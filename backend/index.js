import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import {
  connectRedis,
  redisClient,
  invalidateUserCache,
  invalidateChatCache,
} from "./common/redis.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/notifications", notificationRoutes);

io.on("connection", async (socket) => {
  console.log(`New connection: ${socket.id}`);

  const token = socket.handshake.auth.token;
  if (!token) {
    console.log("Socket connection rejected: No auth token");
    socket.disconnect();
    return;
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      socket.disconnect();
      return;
    }

    await redisClient.set(`user:${userId}:socket`, socket.id);
    await redisClient.set(`user:${userId}:online`, "true");
    socket.join(`user:${userId}`);

    const prisma = new PrismaClient();
    await prisma.user.update({
      where: { id: userId },
      data: { online: true },
    });

    socket.on("register-device", async ({ deviceId, deviceName }) => {
      try {
        await prisma.userDevice.upsert({
          where: { deviceId },
          update: {
            userId,
            deviceName,
            lastActive: new Date(),
          },
          create: {
            userId,
            deviceId,
            deviceName,
            lastActive: new Date(),
          },
        });

        console.log(
          `Device registered for user ${userId}: ${deviceName} (${deviceId})`
        );

        const devices = await prisma.userDevice.findMany({
          where: { userId },
        });

        socket.emit("devices-updated", { devices });
      } catch (error) {
        console.error("Error registering device:", error);
      }
    });

    socket.on("remove-device", async ({ deviceId }) => {
      try {
        await prisma.userDevice.delete({
          where: { deviceId },
        });

        console.log(`Device removed for user ${userId}: ${deviceId}`);

        const devices = await prisma.userDevice.findMany({
          where: { userId },
        });

        socket.emit("devices-updated", { devices });
      } catch (error) {
        console.error("Error removing device:", error);
      }
    });

    socket.on("join-chat", (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${userId} joined chat ${chatId}`);
    });

    socket.on("leave-chat", (chatId) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${userId} left chat ${chatId}`);
    });

    socket.on("typing", ({ chatId, isTyping }) => {
      socket.to(`chat:${chatId}`).emit("user-typing", {
        userId,
        chatId,
        isTyping,
      });
    });

    socket.on("app-opened", async () => {
      try {
        const userChats = await prisma.chat.findMany({
          where: {
            users: { some: { userId } },
          },
          select: { id: true },
        });

        for (const chat of userChats) {
          const messagesToUpdate = await prisma.messageStatus.findMany({
            where: {
              userId,
              status: "SENT",
              message: { chatId: chat.id },
            },
          });

          if (messagesToUpdate.length > 0) {
            await Promise.all(
              messagesToUpdate.map((status) =>
                prisma.messageStatus.update({
                  where: { id: status.id },
                  data: { status: "DELIVERED" },
                })
              )
            );

            const messageIds = messagesToUpdate.map(
              (status) => status.messageId
            );

            io.to(`chat:${chat.id}`).emit("messages-delivered", {
              chatId: chat.id,
              messageIds,
              userId,
            });
          }
        }

        await prisma.userDevice.updateMany({
          where: {
            userId,
            deviceId: socket.handshake.query.deviceId,
          },
          data: { lastActive: new Date() },
        });
      } catch (error) {
        console.error("Error in app-opened handler:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log(`User disconnected: ${userId}`);
      await redisClient.del(`user:${userId}:socket`);
      await redisClient.set(`user:${userId}:online`, "false");
      const now = new Date();
      await redisClient.set(`user:${userId}:lastSeen`, now.toISOString());

      const activeDevices = await prisma.userDevice.count({
        where: {
          userId,
          lastActive: {
            gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
          },
        },
      });

      if (activeDevices === 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            online: false,
            lastSeen: now,
          },
        });
      }

      await prisma.userDevice.updateMany({
        where: {
          userId,
          deviceId: socket.handshake.query.deviceId,
        },
        data: { lastActive: new Date() },
      });
    });

    socket.on("contact-request-sent", ({ receiverId }) => {
      socket.to(`user:${receiverId}`).emit("new-contact-request", {
        senderId: userId,
      });
    });
  } catch (error) {
    console.error("Socket authentication error:", error);
    socket.disconnect();
  }
});

const setupRedisSubscriber = async () => {
  const subscriber = redisClient.duplicate();
  await subscriber.connect();

  await subscriber.subscribe("chat-events", (message) => {
    try {
      const event = JSON.parse(message);

      switch (event.type) {
        case "NEW_MESSAGE":
          io.to(`chat:${event.payload.chatId}`).emit("new-message", {
            message: event.payload.message,
            chatId: event.payload.chatId,
          });

          if (
            event.payload.participantSocketIds &&
            event.payload.participantSocketIds.length > 0
          ) {
            event.payload.participantSocketIds.forEach((participant) => {
              if (participant.socketId) {
                io.to(participant.socketId).emit("notification", {
                  type: "NEW_MESSAGE",
                  chatId: event.payload.chatId,
                  message: event.payload.message,
                });
              }
            });
          }
          break;

        case "NEW_CHAT":
          if (event.payload.participantSocketIds) {
            event.payload.participantSocketIds.forEach((participant) => {
              if (participant.socketId) {
                io.to(participant.socketId).emit("new-chat", {
                  chat: event.payload.chat,
                });
              }
            });
          }
          break;

        case "MESSAGES_DELIVERED":
          io.to(`chat:${event.payload.chatId}`).emit("message-status-update", {
            chatId: event.payload.chatId,
            messageIds: event.payload.messageIds,
            status: "DELIVERED",
            userId: event.payload.deliveredByUserId,
          });
          break;

        case "MESSAGES_READ":
          io.to(`chat:${event.payload.chatId}`).emit("message-status-update", {
            chatId: event.payload.chatId,
            messageIds: event.payload.messageIds,
            status: "READ",
            userId: event.payload.readByUserId,
          });
          break;

        case "MESSAGE_STATUS_UPDATE":
          io.to(`chat:${event.payload.chatId}`).emit("message-status-update", {
            messageId: event.payload.messageId,
            status: event.payload.status,
            chatId: event.payload.chatId,
            userId: event.payload.userId,
          });
          break;

        case "MESSAGE_DELETED":
          io.to(`chat:${event.payload.chatId}`).emit("message-deleted", {
            messageId: event.payload.messageId,
            chatId: event.payload.chatId,
            deletedByUserId: event.payload.deletedByUserId,
          });
          break;

        case "MESSAGE_REACTION":
          io.to(`chat:${event.payload.chatId}`).emit("message-reaction", {
            messageId: event.payload.messageId,
            chatId: event.payload.chatId,
            reaction: event.payload.reaction,
            action: event.payload.action,
            userId: event.payload.userId,
          });
          break;

        case "CONTACT_REQUEST":
          if (event.payload.receiverSocketId) {
            io.to(event.payload.receiverSocketId).emit("new-contact-request", {
              contact: event.payload.contact,
            });
          }
          break;

        case "CONTACT_REQUEST_ACCEPTED":
          if (event.payload.senderSocketId) {
            io.to(event.payload.senderSocketId).emit(
              "contact-request-accepted",
              {
                contact: event.payload.contact,
              }
            );
          }
          break;

        case "CONTACT_REQUEST_REJECTED":
          if (event.payload.senderSocketId) {
            io.to(event.payload.senderSocketId).emit(
              "contact-request-rejected",
              {
                requestId: event.payload.requestId,
                receiverId: event.payload.receiverId,
              }
            );
          }
          break;

        case "CONTACT_BLOCKED":
          {
            const { userId: blockerId, blockedUserId } = event.payload;
            redisClient
              .get(`user:${blockedUserId}:socket`)
              .then((blockedSocketId) => {
                if (blockedSocketId) {
                  io.to(blockedSocketId).emit("blocked-by-contact", {
                    blockerId,
                  });
                }
              })
              .catch((error) => {
                console.error("Error sending block notification:", error);
              });
          }
          break;

        case "CONTACT_UNBLOCKED":
          {
            const { userId: unblockerId, unblockedUserId } = event.payload;
            redisClient
              .get(`user:${unblockedUserId}:socket`)
              .then((unblockedSocketId) => {
                if (unblockedSocketId) {
                  io.to(unblockedSocketId).emit("unblocked-by-contact", {
                    unblockerId,
                  });
                }
              })
              .catch((error) => {
                console.error("Error sending unblock notification:", error);
              });
          }
          break;

        case "NOTIFICATIONS_CLEARED":
          if (event.payload.socketId) {
            io.to(event.payload.socketId).emit("notifications-cleared", {
              chatId: event.payload.chatId,
            });
          }
          break;

        case "CONTACT_REQUESTS_VIEWED":
          if (event.payload.socketId) {
            io.to(event.payload.socketId).emit("contact-requests-viewed");
          }
          break;
      }
    } catch (error) {
      console.error("Error processing Redis event:", error);
    }
  });

  console.log("Redis subscriber connected");
};

(async () => {
  try {
    await connectRedis();
    await setupRedisSubscriber();

    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();

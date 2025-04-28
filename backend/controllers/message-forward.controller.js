import { PrismaClient } from "@prisma/client";
import {
  redisClient,
  invalidateChatCache,
  invalidateUserCache,
} from "../common/redis.js";

const prisma = new PrismaClient();

const MessageStatusType = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

/**
 * Forward a message to one or more chats
 */
export const forwardMessage = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;
    const { chatIds } = req.body;

    if (
      !userId ||
      !messageId ||
      !chatIds ||
      !Array.isArray(chatIds) ||
      chatIds.length === 0
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Limit number of chats to forward to (prevent abuse)
    if (chatIds.length > 5) {
      return res.status(400).json({
        error: "Too many target chats",
        message: "You can forward to a maximum of 5 chats at once",
      });
    }

    // Check if message exists and user has access to it
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            users: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is part of the chat
    const isParticipant = message.chat.users.some((u) => u.userId === userId);
    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Not authorized to access the source message" });
    }

    // Check if the message has been deleted for the user
    const isDeletedForUser = await prisma.messageDeletedFor.findFirst({
      where: {
        messageId,
        userId,
      },
    });

    if (isDeletedForUser) {
      return res
        .status(400)
        .json({ error: "Cannot forward a deleted message" });
    }

    const forwardedMessages = [];
    const failedForwards = [];

    // Process each target chat
    for (const chatId of chatIds) {
      try {
        // Check if user is member of target chat
        const chatMember = await prisma.usersOnChats.findUnique({
          where: {
            userId_chatId: {
              userId,
              chatId,
            },
          },
        });

        if (!chatMember) {
          failedForwards.push({
            chatId,
            reason: "Not a member of this chat",
          });
          continue;
        }

        // Create the forwarded message
        const forwardedMessage = await prisma.message.create({
          data: {
            content: message.content,
            type: message.type,
            senderId: userId,
            chatId,
            statuses: {
              create: {
                userId,
                status: MessageStatusType.READ,
              },
            },
          },
          include: {
            sender: true,
            statuses: true,
          },
        });

        // Record the forwarding relationship
        await prisma.messageForwarding.create({
          data: {
            originalId: message.id,
            forwardedId: forwardedMessage.id,
            forwardedById: userId,
          },
        });

        // Update chat timestamp
        await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() },
        });

        // Add to successful forwards
        forwardedMessages.push(forwardedMessage);

        // Invalidate cache
        await invalidateChatCache(chatId);

        // Get chat participants for notification
        const chatParticipants = await prisma.usersOnChats.findMany({
          where: {
            chatId,
            userId: {
              not: userId,
            },
          },
          select: {
            userId: true,
          },
        });

        // Create notification for other participants
        await Promise.all(
          chatParticipants.map(async (participant) => {
            await prisma.messageStatus.create({
              data: {
                messageId: forwardedMessage.id,
                userId: participant.userId,
                status: MessageStatusType.SENT,
              },
            });

            return prisma.chatNotification.upsert({
              where: {
                userId_chatId: {
                  userId: participant.userId,
                  chatId,
                },
              },
              update: {
                unreadCount: { increment: 1 },
                updatedAt: new Date(),
              },
              create: {
                userId: participant.userId,
                chatId,
                unreadCount: 1,
              },
            });
          })
        );

        // Notify participants via WebSocket
        const recipientSocketIds = await Promise.all(
          chatParticipants.map(async (participant) => {
            const socketId = await redisClient.get(
              `user:${participant.userId}:socket`
            );
            await invalidateUserCache(participant.userId);
            return { userId: participant.userId, socketId };
          })
        );

        await redisClient.publish(
          "chat-events",
          JSON.stringify({
            type: "NEW_MESSAGE",
            payload: {
              message: forwardedMessage,
              chatId,
              isForwarded: true,
              originalMessageId: message.id,
              participantSocketIds: recipientSocketIds,
            },
          })
        );
      } catch (error) {
        console.error(`Error forwarding to chat ${chatId}:`, error);
        failedForwards.push({
          chatId,
          reason: "Internal error during forwarding",
        });
      }
    }

    return res.status(200).json({
      success: true,
      forwardedMessages,
      failedForwards,
      totalForwarded: forwardedMessages.length,
      totalFailed: failedForwards.length,
    });
  } catch (error) {
    console.error("Error forwarding message:", error);
    return res.status(500).json({ error: "Failed to forward message" });
  }
};

/**
 * Get original message that was forwarded
 */
export const getOriginalMessage = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;

    if (!userId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if message exists and user has access to it
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            users: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is part of the chat
    const isParticipant = message.chat.users.some((u) => u.userId === userId);
    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this message" });
    }

    // Check if this is a forwarded message
    const forwarding = await prisma.messageForwarding.findFirst({
      where: {
        forwardedId: messageId,
      },
      include: {
        originalMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePic: true,
              },
            },
            chat: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        forwardedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    if (!forwarding) {
      return res.status(404).json({ error: "Not a forwarded message" });
    }

    // Check if user has access to the original message (they might be in the target chat but not the source chat)
    const canAccessOriginal = await prisma.usersOnChats.findFirst({
      where: {
        userId,
        chatId: forwarding.originalMessage.chatId,
      },
    });

    // If user doesn't have access to the original chat, provide limited info
    if (!canAccessOriginal) {
      // Return limited info without chat details
      return res.status(200).json({
        forwarding: {
          id: forwarding.id,
          forwardedAt: forwarding.forwardedAt,
          forwardedBy: forwarding.forwardedBy,
          originalMessage: {
            id: forwarding.originalMessage.id,
            sender: forwarding.originalMessage.sender,
            createdAt: forwarding.originalMessage.createdAt,
            // Don't include chat details or content if they don't have access
          },
          canAccessOriginal: false,
        },
      });
    }

    // Return full info if they have access
    return res.status(200).json({
      forwarding: {
        ...forwarding,
        canAccessOriginal: true,
      },
    });
  } catch (error) {
    console.error("Error getting original message:", error);
    return res.status(500).json({ error: "Failed to get original message" });
  }
};

/**
 * Get forwarding history for a message
 */
export const getForwardingHistory = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;

    if (!userId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if message exists and user has access to it
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            users: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is part of the chat
    const isParticipant = message.chat.users.some((u) => u.userId === userId);
    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Not authorized to access this message" });
    }

    // Get messages that were forwarded from this one
    const forwards = await prisma.messageForwarding.findMany({
      where: {
        originalId: messageId,
        forwardedById: userId, // Only show messages forwarded by the current user
      },
      include: {
        forwardedMessage: {
          select: {
            id: true,
            createdAt: true,
            chat: {
              select: {
                id: true,
                name: true,
                type: true,
                image: true,
              },
            },
          },
        },
        forwardedBy: {
          select: {
            id: true,
            name: true,
            profilePic: true,
          },
        },
      },
      orderBy: {
        forwardedAt: "desc",
      },
    });

    return res.status(200).json({
      forwardingHistory: forwards,
      message: {
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error("Error getting forwarding history:", error);
    return res.status(500).json({ error: "Failed to get forwarding history" });
  }
};

import { PrismaClient } from "@prisma/client";
import { redisClient, invalidateUserCache } from "../common/redis.js";

const prisma = new PrismaClient();

export const getNotifications = async (req, res) => {
  try {
    const userId = req.userAuthId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cachedNotifications = await redisClient.get(
      `notifications:${userId}`
    );
    if (cachedNotifications) {
      const parsed = JSON.parse(cachedNotifications);
      return res.status(200).json({
        notifications: parsed.notifications,
        totalCount: parsed.totalCount,
        source: "cache",
      });
    }

    const notifications = await prisma.chatNotification.findMany({
      where: {
        userId,
        unreadCount: {
          gt: 0,
        },
      },
      include: {
        chat: {
          select: {
            id: true,
            name: true,
            type: true,
            image: true,
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profilePic: true,
                  },
                },
              },
              where: {
                userId: {
                  not: userId,
                },
              },
              take: 1,
            },
          },
        },
      },
    });

    const totalCount = notifications.reduce(
      (sum, notification) => sum + notification.unreadCount,
      0
    );

    const result = { notifications, totalCount };

    await redisClient.set(`notifications:${userId}`, JSON.stringify(result), {
      EX: 300, // 5 minutes
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

export const clearChatNotifications = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { chatId } = req.params;

    if (!userId || !chatId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updatedNotification = await prisma.chatNotification.upsert({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
      update: {
        unreadCount: 0,
        lastReadAt: new Date(),
      },
      create: {
        userId,
        chatId,
        unreadCount: 0,
        lastReadAt: new Date(),
      },
    });

    await redisClient.del(`notifications:${userId}`);
    await redisClient.del(`notificationCount:${userId}`);
    await redisClient.del(`allNotificationCounts:${userId}`);
    await invalidateUserCache(userId);

    const socketId = await redisClient.get(`user:${userId}:socket`);
    if (socketId) {
      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "NOTIFICATIONS_CLEARED",
          payload: {
            chatId,
            userId,
            socketId,
          },
        })
      );
    }

    return res.status(200).json({
      message: "Notifications cleared",
      notification: updatedNotification,
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    return res.status(500).json({ error: "Failed to clear notifications" });
  }
};

export const getTotalNotificationCount = async (req, res) => {
  try {
    const userId = req.userAuthId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cachedCount = await redisClient.get(`notificationCount:${userId}`);
    if (cachedCount) {
      return res.status(200).json({
        totalCount: parseInt(cachedCount),
        source: "cache",
      });
    }

    const notifications = await prisma.chatNotification.findMany({
      where: {
        userId,
        unreadCount: {
          gt: 0,
        },
      },
      select: {
        unreadCount: true,
      },
    });

    const totalCount = notifications.reduce(
      (sum, notification) => sum + notification.unreadCount,
      0
    );

    await redisClient.set(
      `notificationCount:${userId}`,
      totalCount.toString(),
      {
        EX: 300, // 5 minutes
      }
    );

    return res.status(200).json({ totalCount });
  } catch (error) {
    console.error("Error fetching total notification count:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch notification count" });
  }
};

export const getAllNotificationCounts = async (req, res) => {
  try {
    const userId = req.userAuthId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cachedCounts = await redisClient.get(
      `allNotificationCounts:${userId}`
    );
    if (cachedCounts) {
      return res.status(200).json({
        ...JSON.parse(cachedCounts),
        source: "cache",
      });
    }

    const [chatNotifications, pendingRequests] = await Promise.all([
      prisma.chatNotification.findMany({
        where: {
          userId,
          unreadCount: { gt: 0 },
        },
        select: {
          unreadCount: true,
        },
      }),
      prisma.contact.count({
        where: {
          receiverId: userId,
          status: "PENDING",
        },
      }),
    ]);

    const messageCount = chatNotifications.reduce(
      (sum, notification) => sum + notification.unreadCount,
      0
    );

    const result = {
      messageCount,
      contactRequestCount: pendingRequests,
      totalCount: messageCount + pendingRequests,
    };

    await redisClient.set(
      `allNotificationCounts:${userId}`,
      JSON.stringify(result),
      {
        EX: 300, // 5 minutes
      }
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching notification counts:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch notification counts" });
  }
};

export const markContactRequestsViewed = async (req, res) => {
  try {
    const userId = req.userAuthId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await prisma.contact.updateMany({
      where: {
        receiverId: userId,
        status: "PENDING",
        viewed: false,
      },
      data: {
        viewed: true,
      },
    });

    await redisClient.del(`pendingRequests:${userId}`);
    await redisClient.del(`allNotificationCounts:${userId}`);
    await invalidateUserCache(userId);

    const socketId = await redisClient.get(`user:${userId}:socket`);
    if (socketId) {
      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "CONTACT_REQUESTS_VIEWED",
          payload: {
            userId,
            socketId,
          },
        })
      );
    }

    return res.status(200).json({
      message: "Contact requests marked as viewed",
    });
  } catch (error) {
    console.error("Error marking contact requests as viewed:", error);
    return res
      .status(500)
      .json({ error: "Failed to mark contact requests as viewed" });
  }
};

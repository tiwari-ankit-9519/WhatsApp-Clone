import { PrismaClient } from "@prisma/client";
import { redisClient } from "../common/redis.js";

const prisma = new PrismaClient();

/**
 * Star a message (bookmark)
 */
export const starMessage = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;
    const { note } = req.body;

    if (!userId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" });
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
      return res.status(403).json({ error: "Not a chat participant" });
    }

    // Check if already starred
    const existingStarred = await prisma.starredMessage.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (existingStarred) {
      // Update the note if provided
      if (note !== undefined) {
        const updated = await prisma.starredMessage.update({
          where: {
            id: existingStarred.id,
          },
          data: {
            note,
          },
        });
        return res.status(200).json({
          message: "Note updated on starred message",
          starred: updated,
        });
      }
      return res.status(400).json({ error: "Message already starred" });
    }

    // Create new starred message
    const starred = await prisma.starredMessage.create({
      data: {
        messageId,
        userId,
        note,
      },
      include: {
        message: true,
      },
    });

    // Invalidate cache if needed
    await redisClient.del(`starredMessages:${userId}`);

    return res.status(201).json({
      message: "Message starred successfully",
      starred,
    });
  } catch (error) {
    console.error("Error starring message:", error);
    return res.status(500).json({ error: "Failed to star message" });
  }
};

/**
 * Unstar a message (remove bookmark)
 */
export const unstarMessage = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;

    if (!userId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const starredMessage = await prisma.starredMessage.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (!starredMessage) {
      return res.status(404).json({ error: "Starred message not found" });
    }

    await prisma.starredMessage.delete({
      where: {
        id: starredMessage.id,
      },
    });

    // Invalidate cache
    await redisClient.del(`starredMessages:${userId}`);

    return res.status(200).json({
      message: "Message unstarred successfully",
    });
  } catch (error) {
    console.error("Error unstarring message:", error);
    return res.status(500).json({ error: "Failed to unstar message" });
  }
};

/**
 * Get all starred messages for a user
 */
export const getStarredMessages = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { page = "1", limit = "20" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Try to get from cache for first page
    if (pageNum === 1) {
      const cachedMessages = await redisClient.get(`starredMessages:${userId}`);
      if (cachedMessages) {
        return res.status(200).json({
          starredMessages: JSON.parse(cachedMessages),
          pagination: {
            page: pageNum,
            limit: limitNum,
          },
          source: "cache",
        });
      }
    }

    const starredMessages = await prisma.starredMessage.findMany({
      where: {
        userId,
      },
      include: {
        message: {
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
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        starredAt: "desc",
      },
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.starredMessage.count({
      where: {
        userId,
      },
    });

    // Cache first page results
    if (pageNum === 1) {
      await redisClient.set(
        `starredMessages:${userId}`,
        JSON.stringify(starredMessages),
        {
          EX: 3600, // Cache for 1 hour
        }
      );
    }

    return res.status(200).json({
      starredMessages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: skip + starredMessages.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching starred messages:", error);
    return res.status(500).json({ error: "Failed to fetch starred messages" });
  }
};

/**
 * Update note on a starred message
 */
export const updateStarredMessageNote = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;
    const { note } = req.body;

    if (!userId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (note === undefined) {
      return res.status(400).json({ error: "Note is required" });
    }

    const starredMessage = await prisma.starredMessage.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
    });

    if (!starredMessage) {
      return res.status(404).json({ error: "Starred message not found" });
    }

    const updated = await prisma.starredMessage.update({
      where: {
        id: starredMessage.id,
      },
      data: {
        note,
      },
      include: {
        message: true,
      },
    });

    // Invalidate cache
    await redisClient.del(`starredMessages:${userId}`);

    return res.status(200).json({
      message: "Note updated successfully",
      starred: updated,
    });
  } catch (error) {
    console.error("Error updating starred message note:", error);
    return res.status(500).json({ error: "Failed to update note" });
  }
};

import { PrismaClient } from "@prisma/client";
import {
  redisClient,
  cacheChat,
  getCachedChat,
  cacheMessages,
  getCachedMessages,
  invalidateChatCache,
  invalidateUserCache,
  cacheUserChats,
} from "../common/redis.js";

const prisma = new PrismaClient();

const MessageStatusType = {
  SENT: "SENT",
  DELIVERED: "DELIVERED",
  READ: "READ",
};

const MessageType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  VIDEO: "VIDEO",
  DOCUMENT: "DOCUMENT",
  AUDIO: "AUDIO",
};

const MessageDeleteType = {
  FOR_ME: "FOR_ME",
  FOR_EVERYONE: "FOR_EVERYONE",
};

export const createChat = async (req, res) => {
  const { type, name, participantsIds, adminIds } = req.body;
  const userId = req.userAuthId;
  if (!userId || !participantsIds || participantsIds.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  if (type === "PRIVATE" && participantsIds.length === 1) {
    const contactStatus = await prisma.contact.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: participantsIds[0],
        },
      },
    });

    const reverseContactStatus = await prisma.contact.findUnique({
      where: {
        senderId_receiverId: {
          senderId: participantsIds[0],
          receiverId: userId,
        },
      },
    });

    if (
      (!contactStatus || contactStatus.status !== "ACCEPTED") &&
      (!reverseContactStatus || reverseContactStatus.status !== "ACCEPTED")
    ) {
      return res.status(403).json({
        error: "Cannot create chat with non-contact user",
        message: "You need to add this user as a contact first",
      });
    }

    if (
      (contactStatus && contactStatus.status === "BLOCKED") ||
      (reverseContactStatus && reverseContactStatus.status === "BLOCKED")
    ) {
      return res.status(403).json({
        error: "Cannot create chat with blocked user",
      });
    }

    const existingChat = await prisma.chat.findFirst({
      where: {
        type: "PRIVATE",
        users: {
          every: {
            userId: {
              in: [userId, participantsIds[0]],
            },
          },
        },
      },
      include: {
        users: { include: { user: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: {
            sender: true,
            statuses: true,
            reactions: {
              include: { user: true },
            },
            parentMessage: {
              include: {
                sender: true,
              },
            },
          },
        },
      },
    });

    if (existingChat) {
      await cacheChat(existingChat.id, existingChat);
      if (existingChat.messages && existingChat.messages.length > 0) {
        await cacheMessages(existingChat.id, existingChat.messages);
      }
      return res.status(200).json({ chat: existingChat });
    }
  }

  if (type === "GROUP") {
    const contactsCount = await prisma.contact.count({
      where: {
        OR: [
          {
            senderId: userId,
            receiverId: { in: participantsIds },
            status: "ACCEPTED",
          },
          {
            senderId: { in: participantsIds },
            receiverId: userId,
            status: "ACCEPTED",
          },
        ],
      },
    });

    if (contactsCount === 0) {
      return res.status(403).json({
        error: "Cannot create group with no contacts",
        message: "Add at least one contact to create a group",
      });
    }
  }

  const chat = await prisma.chat.create({
    data: {
      type,
      name: type === "GROUP" ? name : null,
      image: type === "GROUP" ? req.uploadedFile?.url || null : null,
      createdById: userId,
      users: {
        create: [{ userId }, ...participantsIds.map((id) => ({ userId: id }))],
      },
      admins:
        type === "GROUP"
          ? {
              create: [
                { userId },
                ...(adminIds?.map((id) => ({ userId: id })) || []),
              ],
            }
          : undefined,
    },
    include: {
      users: { include: { user: true } },
      admins: { include: { user: true } },
    },
  });

  await cacheChat(chat.id, chat);
  await invalidateUserCache(userId);

  for (const participantId of participantsIds) {
    await invalidateUserCache(participantId);
  }

  const participantSocketIds = await Promise.all(
    participantsIds.map(async (id) => {
      const socketId = await redisClient.get(`user:${id}:socket`);
      return { userId: id, socketId };
    })
  );

  await redisClient.publish(
    "chat-events",
    JSON.stringify({
      type: "NEW_CHAT",
      payload: {
        chat,
        participantSocketIds,
      },
    })
  );

  return res.status(201).json({ chat });
};

export const getChats = async (req, res) => {
  const userId = req.userAuthId;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const cachedUserChats = await redisClient.get(`userChats:${userId}`);
  if (cachedUserChats) {
    return res.status(200).json({
      chats: JSON.parse(cachedUserChats),
      source: "cache",
    });
  }

  const chats = await prisma.chat.findMany({
    where: {
      users: {
        some: {
          userId,
        },
      },
    },
    include: {
      users: {
        include: {
          user: true,
        },
      },
      admins: {
        include: {
          user: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        include: {
          sender: true,
          statuses: {
            where: {
              userId,
            },
          },
          reactions: {
            include: { user: true },
          },
          parentMessage: {
            include: {
              sender: true,
            },
          },
        },
      },
      createdBy: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  await cacheUserChats(userId, chats, 3600);

  return res.status(200).json({ chats });
};

export const getChatById = async (req, res) => {
  const userId = req.userAuthId;
  const chatId = req.params.chatId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const chatParticipant = await prisma.usersOnChats.findUnique({
    where: {
      userId_chatId: {
        userId,
        chatId,
      },
    },
  });

  if (!chatParticipant) {
    return res.status(403).json({ error: "Access denied to this chat" });
  }

  const cachedChat = await getCachedChat(chatId);
  if (cachedChat) {
    return res.status(200).json({
      chat: cachedChat,
      source: "cache",
    });
  }

  const chat = await prisma.chat.findUnique({
    where: {
      id: chatId,
    },
    include: {
      users: {
        include: {
          user: true,
        },
      },
      admins: {
        include: {
          user: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "desc",
        },
        take: 50,
        include: {
          sender: true,
          statuses: true,
          deletedFor: true,
          reactions: {
            include: { user: true },
          },
          parentMessage: {
            include: {
              sender: true,
            },
          },
        },
      },
      createdBy: true,
    },
  });

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  if (chat.messages) {
    chat.messages = chat.messages.filter(
      (message) =>
        !message.deletedFor.some(
          (deleted) =>
            deleted.userId === userId &&
            (deleted.type === MessageDeleteType.FOR_ME ||
              deleted.type === MessageDeleteType.FOR_EVERYONE)
        )
    );
  }

  await cacheChat(chatId, chat);
  if (chat.messages && chat.messages.length > 0) {
    await cacheMessages(chatId, chat.messages);
  }

  return res.status(200).json({ chat });
};

export const sendMessage = async (req, res) => {
  console.log(req.body);

  try {
    const userId = req.userAuthId;
    const { chatId, content, type, parentId } = req.body;

    const messageTypeInput = type || MessageType.TEXT;

    if (!userId || !chatId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const chatParticipant = await prisma.usersOnChats.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!chatParticipant) {
      return res
        .status(403)
        .json({ error: "You are not a participant in this chat" });
    }

    if (parentId) {
      const parentMessage = await prisma.message.findUnique({
        where: { id: parentId },
        include: { chat: true },
      });

      if (!parentMessage) {
        return res.status(404).json({ error: "Parent message not found" });
      }

      if (parentMessage.chatId !== chatId) {
        return res
          .status(400)
          .json({ error: "Parent message must be from the same chat" });
      }
    }

    const lastMessage = await prisma.message.findFirst({
      where: {
        chatId,
        senderId: userId,
        content,
        type: messageTypeInput,
        createdAt: {
          gte: new Date(Date.now() - 30 * 1000),
        },
      },
    });

    if (lastMessage) {
      return res.status(409).json({
        error: "Duplicate message",
        message: "Please wait before sending the same message again",
      });
    }

    let messageType = messageTypeInput;
    let messageContent = content || "";

    if (req.uploadedFile) {
      const mimeType = req.uploadedFile.mimeType.split("/")[0];

      if (mimeType === "image") {
        messageType = MessageType.IMAGE;
      } else if (mimeType === "video") {
        messageType = MessageType.VIDEO;
      } else if (mimeType === "audio") {
        messageType = MessageType.AUDIO;
      } else {
        messageType = MessageType.DOCUMENT;
      }

      messageContent = req.uploadedFile.url;
    } else if (req.uploadedFiles && req.uploadedFiles.successful.length > 0) {
      const file = req.uploadedFiles.successful[0];
      const mimeType = file.mimeType.split("/")[0];

      if (mimeType === "image") {
        messageType = MessageType.IMAGE;
      } else if (mimeType === "video") {
        messageType = MessageType.VIDEO;
      } else if (mimeType === "audio") {
        messageType = MessageType.AUDIO;
      } else {
        messageType = MessageType.DOCUMENT;
      }

      messageContent = file.url;

      if (req.uploadedFiles.failed.length > 0) {
        console.warn("Some files failed to upload:", req.uploadedFiles.failed);
      }
    }

    const message = await prisma.message.create({
      data: {
        content: messageContent,
        type: messageType,
        senderId: userId,
        chatId,
        parentId: parentId || null,
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
        parentMessage: parentId
          ? {
              include: {
                sender: true,
              },
            }
          : undefined,
      },
    });

    await prisma.chat.update({
      where: {
        id: chatId,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    const chatWithParticipants = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        users: true,
      },
    });

    if (!chatWithParticipants) {
      return res.status(404).json({ error: "Chat not found" });
    }

    const recipients = chatWithParticipants.users.filter(
      (p) => p.userId !== userId
    );

    await Promise.all(
      recipients.map(async (recipient) => {
        await prisma.messageStatus.create({
          data: {
            messageId: message.id,
            userId: recipient.userId,
            status: MessageStatusType.SENT,
          },
        });

        return prisma.chatNotification.upsert({
          where: {
            userId_chatId: {
              userId: recipient.userId,
              chatId,
            },
          },
          update: {
            unreadCount: { increment: 1 },
            updatedAt: new Date(),
          },
          create: {
            userId: recipient.userId,
            chatId,
            unreadCount: 1,
          },
        });
      })
    );

    const recipientSocketIds = await Promise.all(
      recipients.map(async (participant) => {
        const socketId = await redisClient.get(
          `user:${participant.userId}:socket`
        );
        return { userId: participant.userId, socketId };
      })
    );

    await invalidateChatCache(chatId);
    await invalidateUserCache(userId);

    for (const recipient of recipients) {
      await invalidateUserCache(recipient.userId);
    }

    await redisClient.publish(
      "chat-events",
      JSON.stringify({
        type: "NEW_MESSAGE",
        payload: {
          message,
          chatId,
          participantSocketIds: recipientSocketIds,
        },
      })
    );

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!userId || !messageId || !emoji) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    const isParticipant = message.chat.users.some((u) => u.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: "Not a chat participant" });
    }

    const existingReaction = await prisma.messageReaction.findFirst({
      where: { messageId, userId, emoji },
    });

    let reaction;
    let action;

    if (existingReaction) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id },
      });
      action = "removed";
    } else {
      reaction = await prisma.messageReaction.create({
        data: { messageId, userId, emoji },
        include: { user: true },
      });
      action = "added";
    }

    await invalidateChatCache(message.chatId);

    const participantSocketIds = await Promise.all(
      message.chat.users.map(async (participant) => {
        const socketId = await redisClient.get(
          `user:${participant.userId}:socket`
        );
        return { userId: participant.userId, socketId };
      })
    );

    await redisClient.publish(
      "chat-events",
      JSON.stringify({
        type: "MESSAGE_REACTION",
        payload: {
          messageId,
          chatId: message.chatId,
          reaction: reaction || existingReaction,
          action,
          userId,
          participantSocketIds,
        },
      })
    );

    return res.status(200).json({
      message: `Reaction ${action}`,
      reaction: reaction || existingReaction,
    });
  } catch (error) {
    console.error("Error reacting to message:", error);
    return res.status(500).json({ error: "Failed to react to message" });
  }
};

export const getMessageReplies = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;

    if (!userId || !messageId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

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

    const isParticipant = message.chat.users.some((u) => u.userId === userId);
    if (!isParticipant) {
      return res.status(403).json({ error: "Not a chat participant" });
    }

    const replies = await prisma.message.findMany({
      where: {
        parentId: messageId,
        deletedFor: {
          none: {
            userId,
            type: {
              in: [MessageDeleteType.FOR_ME, MessageDeleteType.FOR_EVERYONE],
            },
          },
        },
      },
      include: {
        sender: true,
        statuses: true,
        reactions: {
          include: { user: true },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({ replies });
  } catch (error) {
    console.error("Error fetching message replies:", error);
    return res.status(500).json({ error: "Failed to fetch message replies" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;
    const { deleteType } = req.body;

    if (!userId || !messageId || !deleteType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (
      deleteType !== MessageDeleteType.FOR_ME &&
      deleteType !== MessageDeleteType.FOR_EVERYONE
    ) {
      return res.status(400).json({ error: "Invalid delete type" });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chat: {
          include: {
            users: true,
            admins: true,
          },
        },
        deletedFor: true,
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isParticipant = message.chat.users.some((u) => u.userId === userId);
    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "You are not a participant in this chat" });
    }

    const isSender = message.senderId === userId;
    const isAdmin = message.chat.admins.some((a) => a.userId === userId);

    if (
      deleteType === MessageDeleteType.FOR_EVERYONE &&
      !isSender &&
      !isAdmin
    ) {
      return res.status(403).json({
        error: "Only sender or admin can delete message for everyone",
      });
    }

    const alreadyDeleted = message.deletedFor.some((d) => d.userId === userId);
    if (alreadyDeleted) {
      return res.status(400).json({ error: "Message already deleted" });
    }

    if (deleteType === MessageDeleteType.FOR_ME) {
      await prisma.messageDeletedFor.create({
        data: {
          messageId,
          userId,
          type: MessageDeleteType.FOR_ME,
        },
      });

      await invalidateChatCache(message.chatId);
      await invalidateUserCache(userId);

      return res.status(200).json({ message: "Message deleted for you" });
    } else {
      const deletePromises = message.chat.users.map((user) =>
        prisma.messageDeletedFor.create({
          data: {
            messageId,
            userId: user.userId,
            type: MessageDeleteType.FOR_EVERYONE,
          },
        })
      );

      await Promise.all(deletePromises);

      await invalidateChatCache(message.chatId);

      for (const user of message.chat.users) {
        await invalidateUserCache(user.userId);
      }

      const participantSocketIds = await Promise.all(
        message.chat.users.map(async (participant) => {
          const socketId = await redisClient.get(
            `user:${participant.userId}:socket`
          );
          return { userId: participant.userId, socketId };
        })
      );

      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "MESSAGE_DELETED",
          payload: {
            messageId,
            chatId: message.chatId,
            deletedByUserId: userId,
            participantSocketIds,
          },
        })
      );

      return res.status(200).json({ message: "Message deleted for everyone" });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ error: "Failed to delete message" });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { messageId } = req.params;
    const { status } = req.body;

    if (!userId || !messageId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const messageStatus = await prisma.messageStatus.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      include: {
        message: {
          include: {
            chat: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    });

    if (!messageStatus) {
      return res.status(404).json({ error: "Message status not found" });
    }

    const updatedStatus = await prisma.messageStatus.update({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      data: {
        status,
      },
      include: {
        message: true,
        user: true,
      },
    });

    if (status === MessageStatusType.READ && messageStatus.message.chat) {
      await prisma.chatNotification.upsert({
        where: {
          userId_chatId: {
            userId,
            chatId: messageStatus.message.chatId,
          },
        },
        update: {
          unreadCount: 0,
          lastReadAt: new Date(),
        },
        create: {
          userId,
          chatId: messageStatus.message.chatId,
          unreadCount: 0,
          lastReadAt: new Date(),
        },
      });

      await invalidateUserCache(userId);
    }

    if (messageStatus.message.chat) {
      const participantSocketIds = await Promise.all(
        messageStatus.message.chat.users.map(async (participant) => {
          const socketId = await redisClient.get(
            `user:${participant.userId}:socket`
          );
          return { userId: participant.userId, socketId };
        })
      );

      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "MESSAGE_STATUS_UPDATE",
          payload: {
            messageId,
            status,
            userId,
            chatId: messageStatus.message.chatId,
            participantSocketIds,
          },
        })
      );
    }

    return res.status(200).json({ status: updatedStatus });
  } catch (error) {
    console.error("Error updating message status:", error);
    return res.status(500).json({ error: "Failed to update message status" });
  }
};

export const markMessagesAsDelivered = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { chatId } = req.params;

    if (!userId || !chatId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const messagesToUpdate = await prisma.messageStatus.findMany({
      where: {
        userId,
        status: MessageStatusType.SENT,
        message: {
          chatId,
        },
      },
    });

    if (messagesToUpdate.length === 0) {
      return res
        .status(200)
        .json({ message: "No messages to mark as delivered" });
    }

    await Promise.all(
      messagesToUpdate.map(async (status) => {
        await prisma.messageStatus.update({
          where: {
            id: status.id,
          },
          data: {
            status: MessageStatusType.DELIVERED,
          },
        });
      })
    );

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        users: true,
      },
    });

    if (chat) {
      const messageIds = messagesToUpdate.map((status) => status.messageId);

      const participantSocketIds = await Promise.all(
        chat.users.map(async (participant) => {
          const socketId = await redisClient.get(
            `user:${participant.userId}:socket`
          );
          return { userId: participant.userId, socketId };
        })
      );

      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "MESSAGES_DELIVERED",
          payload: {
            chatId,
            messageIds,
            deliveredByUserId: userId,
            participantSocketIds,
          },
        })
      );
    }

    return res.status(200).json({
      success: true,
      count: messagesToUpdate.length,
    });
  } catch (error) {
    console.error("Error marking messages as delivered:", error);
    return res
      .status(500)
      .json({ error: "Failed to mark messages as delivered" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { chatId } = req.params;

    if (!userId || !chatId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const messagesToUpdate = await prisma.messageStatus.findMany({
      where: {
        userId,
        status: {
          in: [MessageStatusType.SENT, MessageStatusType.DELIVERED],
        },
        message: {
          chatId,
        },
      },
    });

    if (messagesToUpdate.length === 0) {
      return res.status(200).json({ message: "No messages to mark as read" });
    }

    await Promise.all(
      messagesToUpdate.map(async (status) => {
        await prisma.messageStatus.update({
          where: {
            id: status.id,
          },
          data: {
            status: MessageStatusType.READ,
          },
        });
      })
    );

    await prisma.chatNotification.upsert({
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

    await invalidateUserCache(userId);

    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
      },
      include: {
        users: true,
      },
    });

    if (chat) {
      const messageIds = messagesToUpdate.map((status) => status.messageId);

      const participantSocketIds = await Promise.all(
        chat.users.map(async (participant) => {
          const socketId = await redisClient.get(
            `user:${participant.userId}:socket`
          );
          return { userId: participant.userId, socketId };
        })
      );

      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "MESSAGES_READ",
          payload: {
            chatId,
            messageIds,
            readByUserId: userId,
            participantSocketIds,
          },
        })
      );
    }

    return res.status(200).json({
      success: true,
      count: messagesToUpdate.length,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ error: "Failed to mark messages as read" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { chatId } = req.params;
    const { page = "1", limit = "30" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    if (!userId || !chatId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const chatParticipant = await prisma.usersOnChats.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!chatParticipant) {
      return res.status(403).json({ error: "Access denied to this chat" });
    }

    if (pageNum === 1) {
      const cachedMessages = await getCachedMessages(chatId);
      if (cachedMessages) {
        const filteredMessages = cachedMessages.filter(
          (message) =>
            !message.deletedFor?.some(
              (deleted) =>
                deleted.userId === userId &&
                (deleted.type === MessageDeleteType.FOR_ME ||
                  deleted.type === MessageDeleteType.FOR_EVERYONE)
            )
        );

        return res.status(200).json({
          messages: filteredMessages,
          pagination: {
            page: pageNum,
            limit: limitNum,
            hasMore: true,
          },
          source: "cache",
        });
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        deletedFor: {
          none: {
            userId,
            type: {
              in: [MessageDeleteType.FOR_ME, MessageDeleteType.FOR_EVERYONE],
            },
          },
        },
      },
      include: {
        sender: true,
        statuses: true,
        deletedFor: true,
        reactions: {
          include: { user: true },
        },
        parentMessage: {
          include: {
            sender: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.message.count({
      where: {
        chatId,
        deletedFor: {
          none: {
            userId,
            type: {
              in: [MessageDeleteType.FOR_ME, MessageDeleteType.FOR_EVERYONE],
            },
          },
        },
      },
    });

    if (pageNum === 1) {
      await cacheMessages(chatId, messages);
    }

    return res.status(200).json({
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalMessages: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        hasMore: skip + messages.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: "Failed to fetch messages" });
  }
};

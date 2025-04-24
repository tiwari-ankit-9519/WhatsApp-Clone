import { PrismaClient, ContactStatus } from "@prisma/client";
import { redisClient, invalidateUserCache } from "../common/redis.js";

const prisma = new PrismaClient();

export const sendContactRequest = async (req, res) => {
  try {
    const senderId = req.userAuthId;
    const { receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ error: "Cannot add yourself as a contact" });
    }

    const receiverExists = await prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiverExists) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingContact = await prisma.contact.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });
    if (existingContact) {
      return res.status(400).json({
        error: "Contact request already exists",
        status: existingContact.status,
      });
    }

    const reverseContact = await prisma.contact.findUnique({
      where: {
        senderId_receiverId: { senderId: receiverId, receiverId: senderId },
      },
    });

    if (reverseContact) {
      if (reverseContact.status === ContactStatus.PENDING) {
        await prisma.contact.update({
          where: { id: reverseContact.id },
          data: { status: ContactStatus.ACCEPTED },
        });
        const newContact = await prisma.contact.create({
          data: { senderId, receiverId, status: ContactStatus.ACCEPTED },
          include: {
            receiver: {
              select: { id: true, name: true, email: true, profilePic: true },
            },
          },
        });

        await invalidateUserCache(senderId);
        await invalidateUserCache(receiverId);
        await redisClient.del(`pendingRequests:${receiverId}`);
        await redisClient.del(`contacts:${senderId}`);
        await redisClient.del(`contacts:${receiverId}`);

        return res.status(200).json({
          message: "Contact request accepted automatically",
          contact: newContact,
        });
      }

      if (reverseContact.status === ContactStatus.BLOCKED) {
        return res
          .status(403)
          .json({ error: "Cannot send contact request to this user" });
      }
    }

    const contact = await prisma.contact.create({
      data: { senderId, receiverId, status: ContactStatus.PENDING },
      include: {
        receiver: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
      },
    });

    await invalidateUserCache(senderId);
    await invalidateUserCache(receiverId);
    await redisClient.del(`pendingRequests:${receiverId}`);
    await redisClient.del(`allNotificationCounts:${receiverId}`);

    const socketId = await redisClient.get(`user:${receiverId}:socket`);

    if (socketId) {
      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "CONTACT_REQUEST",
          payload: {
            contact,
            receiverSocketId: socketId,
          },
        })
      );
    }

    return res.status(201).json({ message: "Contact request sent", contact });
  } catch (error) {
    console.error("Error sending contact request:", error);
    return res.status(500).json({ error: "Failed to send contact request" });
  }
};

export const acceptContactRequest = async (req, res) => {
  try {
    const receiverId = req.userAuthId;
    const { contactId } = req.params;

    const contactRequest = await prisma.contact.findFirst({
      where: { id: contactId, receiverId, status: ContactStatus.PENDING },
      include: {
        sender: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
      },
    });

    if (!contactRequest) {
      return res.status(404).json({ error: "Contact request not found" });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { status: ContactStatus.ACCEPTED },
      include: {
        sender: {
          select: { id: true, name: true, email: true, profilePic: true },
        },
      },
    });

    const reverseContact = await prisma.contact.findUnique({
      where: {
        senderId_receiverId: {
          senderId: receiverId,
          receiverId: contactRequest.senderId,
        },
      },
    });

    if (!reverseContact) {
      await prisma.contact.create({
        data: {
          senderId: receiverId,
          receiverId: contactRequest.senderId,
          status: ContactStatus.ACCEPTED,
        },
      });
    } else if (reverseContact.status !== ContactStatus.ACCEPTED) {
      await prisma.contact.update({
        where: { id: reverseContact.id },
        data: { status: ContactStatus.ACCEPTED },
      });
    }

    await invalidateUserCache(receiverId);
    await invalidateUserCache(contactRequest.senderId);
    await redisClient.del(`pendingRequests:${receiverId}`);
    await redisClient.del(`contacts:${receiverId}`);
    await redisClient.del(`contacts:${contactRequest.senderId}`);
    await redisClient.del(`allNotificationCounts:${receiverId}`);

    const senderSocketId = await redisClient.get(
      `user:${contactRequest.senderId}:socket`
    );

    if (senderSocketId) {
      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "CONTACT_REQUEST_ACCEPTED",
          payload: {
            contact: updatedContact,
            senderSocketId,
          },
        })
      );
    }

    return res
      .status(200)
      .json({ message: "Contact request accepted", contact: updatedContact });
  } catch (error) {
    console.error("Error accepting contact request:", error);
    return res.status(500).json({ error: "Failed to accept contact request" });
  }
};

export const rejectContactRequest = async (req, res) => {
  try {
    const receiverId = req.userAuthId;
    const { contactId } = req.params;

    const contactRequest = await prisma.contact.findFirst({
      where: { id: contactId, receiverId, status: ContactStatus.PENDING },
    });

    if (!contactRequest) {
      return res.status(404).json({ error: "Contact request not found" });
    }

    const senderId = contactRequest.senderId;

    await prisma.contact.delete({ where: { id: contactId } });

    await invalidateUserCache(receiverId);
    await invalidateUserCache(senderId);
    await redisClient.del(`pendingRequests:${receiverId}`);
    await redisClient.del(`allNotificationCounts:${receiverId}`);

    const senderSocketId = await redisClient.get(`user:${senderId}:socket`);

    if (senderSocketId) {
      await redisClient.publish(
        "chat-events",
        JSON.stringify({
          type: "CONTACT_REQUEST_REJECTED",
          payload: {
            requestId: contactId,
            receiverId,
            senderId,
            senderSocketId,
          },
        })
      );
    }

    return res.status(200).json({ message: "Contact request rejected" });
  } catch (error) {
    console.error("Error rejecting contact request:", error);
    return res.status(500).json({ error: "Failed to reject contact request" });
  }
};

export const blockContact = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { contactUserId } = req.body;

    if (!userId || !contactUserId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userExists = await prisma.user.findUnique({
      where: { id: contactUserId },
    });
    if (!userExists) {
      return res.status(404).json({ error: "User not found" });
    }

    let contact = await prisma.contact.findUnique({
      where: {
        senderId_receiverId: { senderId: userId, receiverId: contactUserId },
      },
    });

    if (contact) {
      contact = await prisma.contact.update({
        where: { id: contact.id },
        data: { status: ContactStatus.BLOCKED },
      });
    } else {
      contact = await prisma.contact.create({
        data: {
          senderId: userId,
          receiverId: contactUserId,
          status: ContactStatus.BLOCKED,
        },
      });
    }

    await invalidateUserCache(userId);
    await invalidateUserCache(contactUserId);
    await redisClient.del(`contacts:${userId}`);
    await redisClient.del(`blockedContacts:${userId}`);
    await redisClient.del(`userChats:${userId}`);

    await redisClient.publish(
      "chat-events",
      JSON.stringify({
        type: "CONTACT_BLOCKED",
        payload: {
          userId,
          blockedUserId: contactUserId,
        },
      })
    );

    await prisma.chat
      .findMany({
        where: {
          type: "PRIVATE",
          users: {
            every: {
              userId: {
                in: [userId, contactUserId],
              },
            },
          },
        },
      })
      .then(async (chats) => {
        for (const chat of chats) {
          await redisClient.del(`chat:${chat.id}`);
          await redisClient.del(`messages:${chat.id}`);
        }
      });

    return res.status(200).json({ message: "Contact blocked", contact });
  } catch (error) {
    console.error("Error blocking contact:", error);
    return res.status(500).json({ error: "Failed to block contact" });
  }
};

export const unblockContact = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { contactId } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, senderId: userId, status: ContactStatus.BLOCKED },
    });

    if (!contact) {
      return res.status(404).json({ error: "Blocked contact not found" });
    }

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: { status: ContactStatus.ACCEPTED },
    });

    await invalidateUserCache(userId);
    await invalidateUserCache(contact.receiverId);
    await redisClient.del(`contacts:${userId}`);
    await redisClient.del(`blockedContacts:${userId}`);
    await redisClient.del(`userChats:${userId}`);

    await redisClient.publish(
      "chat-events",
      JSON.stringify({
        type: "CONTACT_UNBLOCKED",
        payload: {
          userId,
          unblockedUserId: contact.receiverId,
        },
      })
    );

    return res
      .status(200)
      .json({ message: "Contact unblocked", contact: updatedContact });
  } catch (error) {
    console.error("Error unblocking contact:", error);
    return res.status(500).json({ error: "Failed to unblock contact" });
  }
};

export const getContacts = async (req, res) => {
  try {
    const userId = req.userAuthId;

    const cachedContacts = await redisClient.get(`contacts:${userId}`);
    if (cachedContacts) {
      return res.status(200).json({
        contacts: JSON.parse(cachedContacts),
        source: "cache",
      });
    }

    const contacts = await prisma.contact.findMany({
      where: { senderId: userId, status: ContactStatus.ACCEPTED },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePic: true,
            online: true,
            lastSeen: true,
          },
        },
      },
    });

    await redisClient.set(`contacts:${userId}`, JSON.stringify(contacts), {
      EX: 3600,
    });

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.userAuthId;

    const cachedRequests = await redisClient.get(`pendingRequests:${userId}`);
    if (cachedRequests) {
      return res.status(200).json({
        pendingRequests: JSON.parse(cachedRequests),
        source: "cache",
      });
    }

    const pendingRequests = await prisma.contact.findMany({
      where: { receiverId: userId, status: ContactStatus.PENDING },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    await redisClient.set(
      `pendingRequests:${userId}`,
      JSON.stringify(pendingRequests),
      {
        EX: 1800, // 30 minutes
      }
    );

    return res.status(200).json({ pendingRequests });
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return res.status(500).json({ error: "Failed to fetch pending requests" });
  }
};

export const getBlockedContacts = async (req, res) => {
  try {
    const userId = req.userAuthId;

    const cachedBlockedContacts = await redisClient.get(
      `blockedContacts:${userId}`
    );
    if (cachedBlockedContacts) {
      return res.status(200).json({
        blockedContacts: JSON.parse(cachedBlockedContacts),
        source: "cache",
      });
    }

    const blockedContacts = await prisma.contact.findMany({
      where: { senderId: userId, status: ContactStatus.BLOCKED },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePic: true,
          },
        },
      },
    });

    await redisClient.set(
      `blockedContacts:${userId}`,
      JSON.stringify(blockedContacts),
      {
        EX: 3600,
      }
    );

    return res.status(200).json({ blockedContacts });
  } catch (error) {
    console.error("Error fetching blocked contacts:", error);
    return res.status(500).json({ error: "Failed to fetch blocked contacts" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const userId = req.userAuthId;
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchTerm = query;

    const cacheKey = `search:${userId}:${searchTerm}`;
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      return res.status(200).json({
        users: JSON.parse(cachedResults),
        source: "cache",
      });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: searchTerm, mode: "insensitive" } },
              { email: { contains: searchTerm, mode: "insensitive" } },
            ],
          },
          { id: { not: userId } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
      },
      take: 20,
    });

    const contactsFrom = await prisma.contact.findMany({
      where: {
        senderId: userId,
        receiverId: { in: users.map((user) => user.id) },
      },
    });

    const contactsTo = await prisma.contact.findMany({
      where: {
        receiverId: userId,
        senderId: { in: users.map((user) => user.id) },
      },
    });

    const enhancedUsers = users.map((user) => {
      const contactFrom = contactsFrom.find((c) => c.receiverId === user.id);
      const contactTo = contactsTo.find((c) => c.senderId === user.id);

      let relationshipStatus = "NONE";

      if (contactFrom) {
        relationshipStatus = contactFrom.status;
      } else if (contactTo) {
        relationshipStatus =
          contactTo.status === ContactStatus.BLOCKED
            ? "BLOCKED_BY_THEM"
            : contactTo.status;
      }

      return { ...user, relationshipStatus };
    });

    await redisClient.set(cacheKey, JSON.stringify(enhancedUsers), {
      EX: 600,
    });

    return res.status(200).json({ users: enhancedUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Failed to search users" });
  }
};

import { PrismaClient } from "@prisma/client";
import {
  redisClient,
  cacheUser,
  getCachedUser,
  invalidateUserCache,
} from "../common/redis.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

const prisma = new PrismaClient();

export const createUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Please provide all fields" });
    return;
  }

  const profilePic = req.uploadedFile
    ? req.uploadedFile.url
    : "https://i.pravatar.cc/300";

  try {
    const userExists = await prisma.user.findFirst({ where: { email } });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        profilePic,
        online: true,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        online: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
      },
    });

    await cacheUser(user.id, user);

    const token = generateToken(user.id);

    res.status(201).json({
      message: "User created successfully",
      user,
      token,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong in Register Controller" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Please provide all fields" });
    return;
  }

  try {
    const userExists = await prisma.user.findFirst({ where: { email } });

    if (!userExists) {
      res.status(400).json({ message: "User does not exist" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, userExists.password);

    if (!isPasswordValid) {
      res.status(400).json({ message: "Invalid password" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userExists.id },
      data: {
        online: true,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        online: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
        password: true,
      },
    });

    const token = generateToken(updatedUser.id);
    const { password: _, ...userWithoutPassword } = updatedUser;

    await cacheUser(updatedUser.id, userWithoutPassword);

    res.status(200).json({
      message: "User logged in successfully",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong in Login Controller" });
  }
};

export const getUserProfile = async (req, res) => {
  const userId = req.userAuthId;

  try {
    const cachedUser = await getCachedUser(userId);

    if (cachedUser) {
      res.status(200).json({
        message: "Profile fetched successfully (from cache)",
        user: cachedUser,
        source: "cache",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        online: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await cacheUser(userId, user);

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong in Profile Controller" });
  }
};

export const updateUserProfile = async (req, res) => {
  const userId = req.userAuthId;
  const { name, email, dateOfBirth, gender, bio } = req.body;

  if (!name && !email && !dateOfBirth && !gender && !bio && !req.uploadedFile) {
    res
      .status(400)
      .json({ message: "Please provide at least one field to update" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updateData = {
      lastSeen: new Date(),
    };

    if (name) updateData.name = name;

    if (email && email !== user.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId },
        },
      });

      if (emailExists) {
        res.status(400).json({ message: "Email already in use" });
        return;
      }

      updateData.email = email;
    }

    if (dateOfBirth) {
      const dobDate = new Date(dateOfBirth);
      if (isNaN(dobDate.getTime())) {
        res
          .status(400)
          .json({ message: "Invalid date format for dateOfBirth" });
        return;
      }

      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 13);
      if (dobDate > minAgeDate) {
        res.status(400).json({
          message: "User must be at least 13 years old",
          minimumAge: 13,
        });
        return;
      }

      updateData.dateOfBirth = dobDate;
    }

    if (gender) {
      const validGenders = ["MALE", "FEMALE", "OTHER"];
      if (!validGenders.includes(gender)) {
        res.status(400).json({
          message: "Invalid gender value",
          validValues: validGenders,
        });
        return;
      }

      updateData.gender = gender;
    }

    if (bio !== undefined) {
      if (bio && bio.length > 500) {
        res.status(400).json({
          message: "Bio is too long",
          maxLength: 500,
        });
        return;
      }

      updateData.bio = bio;
    }

    if (req.uploadedFile) {
      updateData.profilePic = req.uploadedFile.url;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        online: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
      },
    });

    await cacheUser(userId, updatedUser);
    await redisClient.del(`userChats:${userId}`);
    await redisClient.del(`contacts:${userId}`);

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong in Update Profile Controller" });
  }
};

export const logoutUser = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization token missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const userId = req.userAuthId;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        online: false,
        lastSeen: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePic: true,
        online: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        gender: true,
        bio: true,
      },
    });

    await cacheUser(userId, updatedUser);
    await redisClient.set(`blacklist:${token}`, "true", { EX: 86400 });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong during logout" });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.userAuthId;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization token missing" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.messageStatus.deleteMany({ where: { userId } });
      await tx.message.deleteMany({ where: { senderId: userId } });
      await tx.messageDeletedFor.deleteMany({ where: { userId } });
      await tx.adminsOnChats.deleteMany({ where: { userId } });
      await tx.usersOnChats.deleteMany({ where: { userId } });
      await tx.chatNotification.deleteMany({ where: { userId } });
      await tx.contact.deleteMany({
        where: {
          OR: [{ senderId: userId }, { receiverId: userId }],
        },
      });

      const createdChats = await tx.chat.findMany({
        where: { createdById: userId },
        include: { users: true },
      });

      for (const chat of createdChats) {
        if (chat.type === "GROUP") {
          const otherAdmin = await tx.adminsOnChats.findFirst({
            where: { chatId: chat.id, userId: { not: userId } },
          });

          if (otherAdmin) {
            await tx.chat.update({
              where: { id: chat.id },
              data: { createdById: otherAdmin.userId },
            });
          } else if (chat.users.length > 1) {
            const otherUser = chat.users.find((u) => u.userId !== userId);
            if (otherUser) {
              await tx.chat.update({
                where: { id: chat.id },
                data: { createdById: otherUser.userId },
              });
              await tx.adminsOnChats.create({
                data: { userId: otherUser.userId, chatId: chat.id },
              });
            }
          } else {
            await tx.chat.delete({ where: { id: chat.id } });
          }
        } else {
          await tx.chat.delete({ where: { id: chat.id } });
        }
      }

      await tx.user.delete({ where: { id: userId } });
    });

    await redisClient.set(`blacklist:${token}`, "true", { EX: 86400 });
    await invalidateUserCache(userId);
    await redisClient.del(`userChats:${userId}`);
    await redisClient.del(`contacts:${userId}`);
    await redisClient.del(`pendingRequests:${userId}`);
    await redisClient.del(`blockedContacts:${userId}`);
    await redisClient.del(`notifications:${userId}`);
    await redisClient.del(`notificationCount:${userId}`);
    await redisClient.del(`allNotificationCounts:${userId}`);
    await redisClient.del(`user:${userId}:socket`);
    await redisClient.del(`user:${userId}:online`);
    await redisClient.del(`user:${userId}:lastSeen`);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong during account deletion" });
  }
};

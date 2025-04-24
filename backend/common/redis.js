import { config } from "dotenv";
import { createClient } from "redis";

config();

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD;
const redisUsername = process.env.REDIS_USERNAME;

const redisClient = createClient({
  username: redisUsername,
  password: redisPassword,
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.on("reconnecting", () => {
  console.log("Reconnecting to Redis cloud...");
});

redisClient.on("connect", () => {
  console.log("Connected to Redis cloud successfully");
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
    return true;
  } catch (error) {
    console.error("Redis connection failed:", error?.message || error);
    return false;
  }
};

const cacheUser = async (userId, userData, expireTime = 3600) => {
  await redisClient.set(`user:${userId}`, JSON.stringify(userData), {
    EX: expireTime,
  });
};

const getCachedUser = async (userId) => {
  const cachedUser = await redisClient.get(`user:${userId}`);
  return cachedUser ? JSON.parse(cachedUser) : null;
};

const cacheChat = async (chatId, chatData, expireTime = 3600) => {
  await redisClient.set(`chat:${chatId}`, JSON.stringify(chatData), {
    EX: expireTime,
  });
};

const getCachedChat = async (chatId) => {
  const cachedChat = await redisClient.get(`chat:${chatId}`);
  return cachedChat ? JSON.parse(cachedChat) : null;
};

const cacheMessages = async (chatId, messagesData, expireTime = 3600) => {
  await redisClient.set(`messages:${chatId}`, JSON.stringify(messagesData), {
    EX: expireTime,
  });
};

const getCachedMessages = async (chatId) => {
  const cachedMessages = await redisClient.get(`messages:${chatId}`);
  return cachedMessages ? JSON.parse(cachedMessages) : null;
};

const cacheUserChats = async (userId, chatsData, expireTime = 3600) => {
  await redisClient.set(`userChats:${userId}`, JSON.stringify(chatsData), {
    EX: expireTime,
  });
};

const getCachedUserChats = async (userId) => {
  const cachedChats = await redisClient.get(`userChats:${userId}`);
  return cachedChats ? JSON.parse(cachedChats) : null;
};

const invalidateUserCache = async (userId) => {
  await redisClient.del(`user:${userId}`);
  await redisClient.del(`userChats:${userId}`);
};

const invalidateChatCache = async (chatId) => {
  await redisClient.del(`chat:${chatId}`);
  await redisClient.del(`messages:${chatId}`);
};

export {
  redisClient,
  connectRedis,
  cacheUser,
  getCachedUser,
  cacheChat,
  getCachedChat,
  cacheMessages,
  getCachedMessages,
  cacheUserChats,
  getCachedUserChats,
  invalidateUserCache,
  invalidateChatCache,
};

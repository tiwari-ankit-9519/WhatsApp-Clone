import { io } from "socket.io-client";
import { toast } from "react-hot-toast";

let socket = null;
const joinedChats = new Set();
let isInitialized = false;
const DEBUG = true;

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  if (!token) {
    console.warn("Cannot initialize socket without a token");
    return null;
  }

  if (isInitialized && socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  try {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000, // 20 seconds timeout
    });

    socket.on("connect", () => {
      socket.emit("app-opened");

      if (joinedChats.size > 0) {
        joinedChats.forEach((chatId) => {
          socket.emit("join-chat", chatId);
        });
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection error. Please check your internet connection.");
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    if (DEBUG) {
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log(`Socket reconnected after ${attemptNumber} attempts`);
      });

      socket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`Socket reconnection attempt: ${attemptNumber}`);
      });

      socket.on("reconnect_failed", () => {
        console.error("Socket reconnection failed");
        toast.error("Failed to reconnect. Please refresh the page.");
      });
    }

    isInitialized = true;
    return socket;
  } catch (error) {
    console.error("Error initializing socket:", error);
    return null;
  }
};

export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    joinedChats.forEach((chatId) => {
      socket.emit("leave-chat", chatId);
    });

    joinedChats.clear();

    socket.disconnect();

    isInitialized = false;
  }
};

export const joinChat = (chatId) => {
  if (!chatId || !socket || !socket.connected) {
    if (DEBUG && !socket?.connected) return;
  }

  if (!joinedChats.has(chatId)) {
    socket.emit("join-chat", chatId);
    joinedChats.add(chatId);
  } else if (DEBUG) {
    console.log("Already joined chat:", chatId);
  }
};

export const leaveChat = (chatId) => {
  if (!chatId || !socket || !socket.connected) return;

  if (joinedChats.has(chatId)) {
    socket.emit("leave-chat", chatId);
    joinedChats.delete(chatId);
  }
};

let lastTypingEmit = {};

export const emitTyping = (chatId, isTyping) => {
  if (!chatId || !socket || !socket.connected) return;

  const now = Date.now();
  const lastEmit = lastTypingEmit[chatId] || 0;

  const minInterval = 1000;

  if (now - lastEmit > minInterval) {
    if (DEBUG) socket.emit("typing", { chatId, isTyping });
    lastTypingEmit[chatId] = now;
  }
};

export const isSocketConnected = () => {
  return socket?.connected || false;
};
export const getJoinedChats = () => {
  return Array.from(joinedChats);
};

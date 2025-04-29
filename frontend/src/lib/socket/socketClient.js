import { io } from "socket.io-client";

let socket = null;
// Track chat rooms that we've joined to prevent duplicate joins
const joinedChats = new Set();
// Track if we've already initialized to prevent multiple sockets
let isInitialized = false;

export const initializeSocket = (token) => {
  // If socket already exists and is connected, don't recreate it
  if (socket && socket.connected) return socket;

  // If we're trying to initialize without a token, return null
  if (!token) {
    console.warn("Cannot initialize socket without a token");
    return null;
  }

  // If already initialized but disconnected, reconnect instead of creating new
  if (isInitialized && socket) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  // Create new socket connection
  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000, // Increase timeout to 20 seconds
  });

  // General socket event handlers
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("app-opened");
  });

  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  isInitialized = true;
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    console.warn("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    // Leave all joined chats first
    joinedChats.forEach((chatId) => {
      socket.emit("leave-chat", chatId);
    });

    // Clear the set of joined chats
    joinedChats.clear();

    // Disconnect the socket
    socket.disconnect();

    // Reset initialization flag
    isInitialized = false;
  }
};

export const registerDevice = (deviceId, deviceName) => {
  if (!socket || !socket.connected) return;
  socket.emit("register-device", { deviceId, deviceName });
};

export const joinChat = (chatId) => {
  if (!chatId || !socket || !socket.connected) return;

  // Only join chat if not already joined
  if (!joinedChats.has(chatId)) {
    socket.emit("join-chat", chatId);
    joinedChats.add(chatId);
  }
};

export const leaveChat = (chatId) => {
  if (!chatId || !socket || !socket.connected) return;

  // Only leave chat if already joined
  if (joinedChats.has(chatId)) {
    socket.emit("leave-chat", chatId);
    joinedChats.delete(chatId);
  }
};

// Add throttling to typing events to prevent flooding
let lastTypingEmit = {};
export const emitTyping = (chatId, isTyping) => {
  if (!chatId || !socket || !socket.connected) return;

  const now = Date.now();
  const lastEmit = lastTypingEmit[chatId] || 0;

  // Only emit typing event if it's been at least 1 second since last emit
  // or if isTyping state has changed
  const minInterval = 1000; // 1 second

  if (now - lastEmit > minInterval) {
    socket.emit("typing", { chatId, isTyping });
    lastTypingEmit[chatId] = now;
  }
};

export const emitContactRequestSent = (receiverId) => {
  if (!receiverId || !socket || !socket.connected) return;
  socket.emit("contact-request-sent", { receiverId });
};

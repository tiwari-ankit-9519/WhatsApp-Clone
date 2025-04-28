import { io } from "socket.io-client";

let socket = null;

export const initializeSocket = (token) => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:8080", {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
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
    socket.disconnect();
    socket = null;
  }
};

export const registerDevice = (deviceId, deviceName) => {
  if (!socket) return;
  socket.emit("register-device", { deviceId, deviceName });
};

export const joinChat = (chatId) => {
  if (!socket) return;
  socket.emit("join-chat", chatId);
};

export const leaveChat = (chatId) => {
  if (!socket) return;
  socket.emit("leave-chat", chatId);
};

export const emitTyping = (chatId, isTyping) => {
  if (!socket) return;
  socket.emit("typing", { chatId, isTyping });
};

export const emitContactRequestSent = (receiverId) => {
  if (!socket) return;
  socket.emit("contact-request-sent", { receiverId });
};

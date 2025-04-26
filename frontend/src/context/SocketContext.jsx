import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const { isAuthenticated } = useAuth();
  const [eventHandlers, setEventHandlers] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("token");
      const socketInstance = io(
        "https://whatsapp-clone-backend-production-b037.up.railway.app",
        {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 10,
        }
      );

      socketInstance.on("connect", () => {
        setConnected(true);
        socketInstance.emit("register-device", {
          deviceId: navigator.userAgent,
          deviceName: window.navigator.platform,
        });
        console.log("Socket connected with ID:", socketInstance.id);
      });

      socketInstance.on("disconnect", () => {
        setConnected(false);
        console.log("Socket disconnected");
      });

      socketInstance.on("user:online", ({ userId, status }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [userId]: status,
        }));
      });

      socketInstance.on("devices-updated", ({ devices }) => {
        console.log("Registered devices updated:", devices);
      });

      socketInstance.on("reconnect_attempt", (attempt) => {
        console.log(`Socket reconnection attempt ${attempt}`);
      });

      socketInstance.on("reconnect", () => {
        setConnected(true);
        console.log("Socket reconnected");
      });

      socketInstance.on("error", (error) => {
        console.error("Socket error:", error);
      });

      setSocket(socketInstance);

      return () => {
        Object.keys(eventHandlers).forEach((event) => {
          socketInstance.off(event);
        });
        socketInstance.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
        setOnlineUsers({});
      }
    }
  }, [isAuthenticated, eventHandlers]);

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
      return true;
    }
    return false;
  };

  const registerHandler = (event, handler) => {
    if (socket) {
      socket.on(event, handler);
      setEventHandlers((prev) => ({
        ...prev,
        [event]: [...(prev[event] || []), handler],
      }));
      return true;
    }
    return false;
  };

  const unregisterHandler = (event, handler) => {
    if (socket) {
      socket.off(event, handler);
      setEventHandlers((prev) => {
        const handlers = prev[event] || [];
        return {
          ...prev,
          [event]: handlers.filter((h) => h !== handler),
        };
      });
      return true;
    }
    return false;
  };

  const isUserOnline = (userId) => {
    return !!onlineUsers[userId];
  };

  const sendTypingStatus = (chatId, isTyping) => {
    return emit("typing", { chatId, isTyping });
  };

  const joinChatRoom = (chatId) => {
    return emit("join-chat", chatId);
  };

  const leaveChatRoom = (chatId) => {
    return emit("leave-chat", chatId);
  };

  const notifyAppOpened = () => {
    return emit("app-opened");
  };

  const removeDevice = (deviceId) => {
    return emit("remove-device", { deviceId });
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        onlineUsers,
        isUserOnline,
        emit,
        registerHandler,
        unregisterHandler,
        sendTypingStatus,
        joinChatRoom,
        leaveChatRoom,
        notifyAppOpened,
        removeDevice,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

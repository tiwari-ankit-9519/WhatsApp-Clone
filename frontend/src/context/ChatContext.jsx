/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getChats,
  getChatById,
  getMessages,
  markMessagesAsDelivered,
  markMessagesAsRead,
} from "../state/chat";
import { getContacts, getPendingRequests } from "../state/contact";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const API_URL = "https://whatsapp-clone-backend-production-b037.up.railway.app";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadMessages, setUnreadMessages] = useState({});
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem("token");
      const newSocket = io(API_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("app-opened");
    });

    socket.on("new-message", ({ message, chatId }) => {
      queryClient.invalidateQueries(["messages", chatId]);
      queryClient.invalidateQueries(["chats"]);
      queryClient.invalidateQueries(["notifications"]);

      if (activeChat?.id === chatId) {
        markMessagesAsDelivered(chatId);
      } else {
        setUnreadMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }
    });

    socket.on("user-typing", ({ userId, chatId, isTyping }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: isTyping
          ? [...(prev[chatId] || []), userId]
          : (prev[chatId] || []).filter((id) => id !== userId),
      }));
    });

    socket.on(
      "messages-delivered",
      ({ chatId, messageIds, deliveredByUserId }) => {
        if (chatId === activeChat?.id) {
          queryClient.invalidateQueries(["messages", chatId]);
        }
      }
    );

    socket.on("messages-read", ({ chatId, messageIds, readByUserId }) => {
      if (chatId === activeChat?.id) {
        queryClient.invalidateQueries(["messages", chatId]);
      }
    });

    socket.on(
      "message-status-update",
      ({ chatId, messageId, status, userId }) => {
        queryClient.invalidateQueries(["messages", chatId]);
      }
    );

    socket.on("message-deleted", ({ messageId, chatId, deletedByUserId }) => {
      queryClient.invalidateQueries(["messages", chatId]);
      queryClient.invalidateQueries(["chats"]);
    });

    socket.on(
      "message-reaction",
      ({ messageId, chatId, reaction, action, userId }) => {
        queryClient.invalidateQueries(["messages", chatId]);
      }
    );

    socket.on("new-chat", ({ chat, participantSocketIds }) => {
      queryClient.invalidateQueries(["chats"]);
    });

    socket.on("notification", ({ type, chatId, message }) => {
      if (type === "NEW_MESSAGE" && chatId !== activeChat?.id) {
        setUnreadMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || 0) + 1,
        }));
      }
    });

    socket.on("new-contact-request", ({ contact }) => {
      queryClient.invalidateQueries(["pendingRequests"]);
      queryClient.invalidateQueries(["notifications"]);
    });

    socket.on("contact-request-accepted", ({ contact }) => {
      queryClient.invalidateQueries(["contacts"]);
      queryClient.invalidateQueries(["chats"]);
    });

    socket.on("contact-request-rejected", ({ requestId, receiverId }) => {
      queryClient.invalidateQueries(["pendingRequests"]);
    });

    socket.on("blocked-by-contact", ({ blockerId }) => {
      queryClient.invalidateQueries(["contacts"]);
      queryClient.invalidateQueries(["chats"]);

      // Update online users to show blocked user as offline
      setOnlineUsers((prev) => ({
        ...prev,
        [blockerId]: false,
      }));
    });

    socket.on("unblocked-by-contact", ({ unblockerId }) => {
      queryClient.invalidateQueries(["contacts"]);
      queryClient.invalidateQueries(["chats"]);
    });

    socket.on("notifications-cleared", ({ chatId }) => {
      queryClient.invalidateQueries(["notifications"]);
      if (unreadMessages[chatId]) {
        setUnreadMessages((prev) => ({
          ...prev,
          [chatId]: 0,
        }));
      }
    });

    socket.on("contact-requests-viewed", () => {
      queryClient.invalidateQueries(["pendingRequests"]);
      queryClient.invalidateQueries(["notifications"]);
    });

    // Handle online status updates
    socket.on("user:online", ({ userId, online }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: online,
      }));
    });

    return () => {
      socket.off("connect");
      socket.off("new-message");
      socket.off("user-typing");
      socket.off("messages-delivered");
      socket.off("messages-read");
      socket.off("message-status-update");
      socket.off("message-deleted");
      socket.off("message-reaction");
      socket.off("new-chat");
      socket.off("notification");
      socket.off("new-contact-request");
      socket.off("contact-request-accepted");
      socket.off("contact-request-rejected");
      socket.off("blocked-by-contact");
      socket.off("unblocked-by-contact");
      socket.off("notifications-cleared");
      socket.off("contact-requests-viewed");
      socket.off("user:online");
    };
  }, [socket, activeChat, queryClient, unreadMessages]);

  const { data: chatsData } = useQuery({
    queryKey: ["chats"],
    queryFn: getChats,
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch contacts data
  const { data: contactsData } = useQuery({
    queryKey: ["contacts"],
    queryFn: getContacts,
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Fetch pending requests data
  const { data: pendingRequestsData } = useQuery({
    queryKey: ["pendingRequests"],
    queryFn: getPendingRequests,
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
    cacheTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const chats = chatsData?.chats || [];
  const contacts = contactsData?.contacts || [];
  const pendingRequests = pendingRequestsData?.pendingRequests || [];

  // Join a chat room
  const joinChat = (chatId) => {
    if (!socket) return;
    socket.emit("join-chat", chatId);
  };

  // Leave a chat room
  const leaveChat = (chatId) => {
    if (!socket) return;
    socket.emit("leave-chat", chatId);
  };

  // Send typing status
  const setTyping = (chatId, isTyping) => {
    if (!socket) return;
    socket.emit("typing", { chatId, isTyping });
  };

  // Select and activate a chat
  const selectChat = async (chatId) => {
    try {
      // First check if we have this chat data in React Query cache
      const cachedChat = queryClient.getQueryData(["chat", chatId]);

      if (cachedChat) {
        // If we have cached data, use it immediately to prevent loading state
        setActiveChat(cachedChat);
        joinChat(chatId);
        // Then fetch in background to update if needed
        queryClient.prefetchQuery(["chat", chatId], () => getChatById(chatId));
        return cachedChat;
      }

      // If no cached data, fetch from server
      const chatData = await getChatById(chatId);

      if (chatData.chat) {
        setActiveChat(chatData.chat);
        joinChat(chatId);
        markMessagesAsDelivered(chatId);
        markMessagesAsRead(chatId);

        setUnreadMessages((prev) => ({
          ...prev,
          [chatId]: 0,
        }));

        return chatData.chat;
      }
    } catch (error) {
      console.error("Error selecting chat:", error);
      throw error;
    }
  };

  // Clear the active chat
  const clearChat = () => {
    if (activeChat) {
      leaveChat(activeChat.id);
    }
    setActiveChat(null);
  };

  // Check if a user is online
  const isUserOnline = (userId) => {
    return !!onlineUsers[userId];
  };

  // Check if a user is typing in a specific chat
  const isUserTyping = (chatId, userId) => {
    return typingUsers[chatId]?.includes(userId) || false;
  };

  // Get unread message count for a chat
  const getUnreadCount = (chatId) => {
    return unreadMessages[chatId] || 0;
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        activeChat,
        chats,
        contacts,
        pendingRequests,
        onlineUsers,
        typingUsers,
        unreadMessages,
        selectChat,
        clearChat,
        setTyping,
        joinChat,
        leaveChat,
        isUserOnline,
        isUserTyping,
        getUnreadCount,
        user,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

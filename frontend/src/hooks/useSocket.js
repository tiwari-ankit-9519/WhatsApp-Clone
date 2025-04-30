import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getSocket,
  joinChat,
  leaveChat,
  emitTyping,
  isSocketConnected,
} from "../lib/socket/socketClient";
import { handleSocketEvent } from "../lib/queryClient";
import { toast } from "react-hot-toast";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(isSocketConnected());
  const [typingUsers, setTypingUsers] = useState({});
  const [socketError, setSocketError] = useState(null);
  const queryClient = useQueryClient();

  const isMounted = useRef(true);
  const activeChats = useRef(new Set());

  useEffect(() => {
    isMounted.current = true;

    const socket = getSocket();
    if (!socket) {
      setSocketError("Socket not initialized");
      return;
    }

    const onConnect = () => {
      if (isMounted.current) {
        setIsConnected(true);
        setSocketError(null);

        if (activeChats.current.size > 0) {
          activeChats.current.forEach((chatId) => {
            joinChat(chatId);
          });
        }
      }
    };

    const onDisconnect = (reason) => {
      if (isMounted.current) {
        setIsConnected(false);
        if (reason === "io server disconnect" || reason === "transport close") {
          setSocketError(
            "Disconnected from server. Attempting to reconnect..."
          );
        }
      }
    };

    const onNewMessage = (data) => {
      if (!isMounted.current) return;
      handleSocketEvent("new-message", data);
    };

    const onMessageDeleted = (data) => {
      if (!isMounted.current) return;
      handleSocketEvent("message-deleted", data);
    };

    const onMessageReaction = (data) => {
      if (!isMounted.current) return;
      handleSocketEvent("message-reaction", data);
    };

    const onNewChat = (data) => {
      if (!isMounted.current) return;
      handleSocketEvent("new-chat", data);
    };

    const onUserTyping = ({ userId, chatId, isTyping }) => {
      if (!isMounted.current) return;

      if (activeChats.current.has(chatId)) {
        setTypingUsers((prev) => {
          const chatTyping = prev[chatId] || {};
          if (isTyping) {
            return {
              ...prev,
              [chatId]: { ...chatTyping, [userId]: Date.now() },
            };
          } else {
            const newChatTyping = { ...chatTyping };
            delete newChatTyping[userId];
            return { ...prev, [chatId]: newChatTyping };
          }
        });
      }
    };

    const onContactRequestAccepted = () => {
      if (!isMounted.current) return;
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      toast.success("Contact request accepted");
    };

    const onNewContactRequest = () => {
      if (!isMounted.current) return;
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["allNotificationCounts"] });
      toast.info("You have a new contact request");
    };

    const onMessagesRead = (data) => {
      if (!isMounted.current) return;
      handleSocketEvent("messages-read", data);
    };

    const onError = (error) => {
      if (isMounted.current) {
        console.error("Socket error:", error);
        setSocketError(`Connection error: ${error.message || "Unknown error"}`);
      }
    };

    if (socket) {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new-message", onNewMessage);
      socket.off("message-deleted", onMessageDeleted);
      socket.off("message-reaction", onMessageReaction);
      socket.off("new-chat", onNewChat);
      socket.off("user-typing", onUserTyping);
      socket.off("contact-request-accepted", onContactRequestAccepted);
      socket.off("new-contact-request", onNewContactRequest);
      socket.off("messages-read", onMessagesRead);
      socket.off("error", onError);

      socket.on("connect", onConnect);
      socket.on("disconnect", onDisconnect);
      socket.on("new-message", onNewMessage);
      socket.on("message-deleted", onMessageDeleted);
      socket.on("message-reaction", onMessageReaction);
      socket.on("new-chat", onNewChat);
      socket.on("user-typing", onUserTyping);
      socket.on("contact-request-accepted", onContactRequestAccepted);
      socket.on("new-contact-request", onNewContactRequest);
      socket.on("messages-read", onMessagesRead);
      socket.on("error", onError);

      setIsConnected(socket.connected);
    }

    return () => {
      isMounted.current = false;

      if (socket) {
        activeChats.current.forEach((chatId) => {
          leaveChat(chatId);
        });

        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off("new-message", onNewMessage);
        socket.off("message-deleted", onMessageDeleted);
        socket.off("message-reaction", onMessageReaction);
        socket.off("new-chat", onNewChat);
        socket.off("user-typing", onUserTyping);
        socket.off("contact-request-accepted", onContactRequestAccepted);
        socket.off("new-contact-request", onNewContactRequest);
        socket.off("messages-read", onMessagesRead);
        socket.off("error", onError);
      }

      activeChats.current.clear();
    };
  }, [queryClient]);

  useEffect(() => {
    const typingTimeout = 5000;
    let intervalId;

    if (isMounted.current) {
      intervalId = setInterval(() => {
        const now = Date.now();
        setTypingUsers((prev) => {
          const updated = { ...prev };
          let changed = false;

          Object.keys(updated).forEach((chatId) => {
            const chatTypers = updated[chatId];
            const newChatTypers = {};
            let chatChanged = false;

            Object.entries(chatTypers).forEach(([userId, timestamp]) => {
              if (now - timestamp < typingTimeout) {
                newChatTypers[userId] = timestamp;
              } else {
                chatChanged = true;
              }
            });

            if (chatChanged) {
              updated[chatId] = newChatTypers;
              changed = true;
            }
          });

          return changed ? updated : prev;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const joinChatRoom = useCallback((chatId) => {
    if (!chatId) return;

    joinChat(chatId);
    activeChats.current.add(chatId);
  }, []);

  const leaveChatRoom = useCallback((chatId) => {
    if (!chatId) return;

    leaveChat(chatId);
    activeChats.current.delete(chatId);
  }, []);

  const sendTypingStatus = useCallback((chatId, isTyping) => {
    if (!chatId) return;
    emitTyping(chatId, isTyping);
  }, []);

  const getTypingUsers = useCallback(
    (chatId) => {
      if (!chatId) return [];
      return Object.keys(typingUsers[chatId] || {});
    },
    [typingUsers]
  );

  const retryConnection = useCallback(() => {
    const socket = getSocket();
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, []);

  return {
    isConnected,
    socketError,
    joinChatRoom,
    leaveChatRoom,
    sendTypingStatus,
    getTypingUsers,
    retryConnection,
    activeChats: Array.from(activeChats.current),
  };
}

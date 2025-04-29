import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getSocket,
  joinChat,
  leaveChat,
  emitTyping,
} from "../lib/socket/socketClient";
import { handleSocketEvent } from "../lib/queryClient";

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const queryClient = useQueryClient();

  // Use refs to track mounted state and prevent memory leaks
  const isMounted = useRef(true);
  // Track active chat rooms to prevent duplicate joins
  const activeChats = useRef(new Set());

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;

    // Get socket instance
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      if (isMounted.current) {
        setIsConnected(true);
      }
    };

    const onDisconnect = () => {
      if (isMounted.current) {
        setIsConnected(false);
      }
    };

    const onNewMessage = (data) => {
      handleSocketEvent("new-message", data);
    };

    const onMessageDeleted = (data) => {
      handleSocketEvent("message-deleted", data);
    };

    const onMessageReaction = (data) => {
      handleSocketEvent("message-reaction", data);
    };

    const onNewChat = (data) => {
      handleSocketEvent("new-chat", data);
    };

    const onUserTyping = ({ userId, chatId, isTyping }) => {
      if (!isMounted.current) return;

      setTypingUsers((prev) => {
        const chatTyping = prev[chatId] || {};
        if (isTyping) {
          return {
            ...prev,
            [chatId]: { ...chatTyping, [userId]: Date.now() },
          };
        } else {
          // Filter out the user who stopped typing
          const newChatTyping = { ...chatTyping };
          delete newChatTyping[userId];
          return { ...prev, [chatId]: newChatTyping };
        }
      });
    };

    const onContactRequestAccepted = () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
    };

    const onNewContactRequest = () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["allNotificationCounts"] });
    };

    const onMessagesRead = ({ chatId, messageIds, readByUserId }) => {
      queryClient.setQueryData(["messages", chatId], (oldData) => {
        if (!oldData || !oldData.messages) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.map((msg) => {
            if (messageIds.includes(msg.id)) {
              return {
                ...msg,
                statuses: (msg.statuses || []).map((status) => {
                  if (status.userId === readByUserId) {
                    return { ...status, status: "READ" };
                  }
                  return status;
                }),
              };
            }
            return msg;
          }),
        };
      });
    };

    // Only attach event listeners if socket exists
    if (socket) {
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
      }

      // Clear the active chats set
      activeChats.current.clear();
    };
  }, [queryClient]);

  useEffect(() => {
    const typingTimeout = 5000; // 5 seconds
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

  // Use useCallback to memoize these functions to prevent recreation on each render
  const joinChatRoom = useCallback((chatId) => {
    if (!chatId || activeChats.current.has(chatId)) return;

    joinChat(chatId);
    activeChats.current.add(chatId);
  }, []);

  const leaveChatRoom = useCallback((chatId) => {
    if (!chatId || !activeChats.current.has(chatId)) return;

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

  return {
    isConnected,
    joinChatRoom,
    leaveChatRoom,
    sendTypingStatus,
    getTypingUsers,
  };
}

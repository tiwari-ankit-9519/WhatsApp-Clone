import { useEffect, useState } from "react";
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

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => {
      setIsConnected(true);
    };

    const onDisconnect = () => {
      setIsConnected(false);
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

    return () => {
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
    };
  }, [queryClient]);

  useEffect(() => {
    const typingTimeout = 5000; // 5 seconds
    const interval = setInterval(() => {
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

    return () => clearInterval(interval);
  }, []);

  const joinChatRoom = (chatId) => {
    joinChat(chatId);
  };

  const leaveChatRoom = (chatId) => {
    leaveChat(chatId);
  };

  const sendTypingStatus = (chatId, isTyping) => {
    emitTyping(chatId, isTyping);
  };

  const getTypingUsers = (chatId) => {
    return Object.keys(typingUsers[chatId] || {});
  };

  return {
    isConnected,
    joinChatRoom,
    leaveChatRoom,
    sendTypingStatus,
    getTypingUsers,
  };
}

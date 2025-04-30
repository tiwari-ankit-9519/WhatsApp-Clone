/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useChats } from "../../hooks/useChats";
import { useMessages } from "../../hooks/useMessages";
import { useSocketContext } from "../../contexts/SocketContext";
import MessageList from "../../components/messages/MessageList";
import ChatInput from "../../components/chat/ChatInput";
import ChatHeader from "../../components/chat/ChatHeader";
import { Button } from "../../components/ui/button";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { useChatDetails, chats } = useChats();
  const {
    messages,
    sendMessage,
    sendMediaMessage,
    isSending,
    isSendingMedia,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
    isLoading: isMessagesLoading,
  } = useMessages(chatId);
  const {
    isConnected,
    socketError,
    joinChatRoom,
    leaveChatRoom,
    sendTypingStatus,
    retryConnection,
  } = useSocketContext();

  const [message, setMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);
  const [initialScrollComplete, setInitialScrollComplete] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);

  const hasMarkedAsRead = useRef(false);
  const messageListContainerRef = useRef(null);
  const initialLoadRef = useRef(false);
  const connectionTimeout = useRef(null);
  const scrollToBottomTimeoutRef = useRef(null);

  const { chat, isLoading: isChatLoading, markAsRead } = useChatDetails(chatId);

  useEffect(() => {
    if (!isConnected) {
      connectionTimeout.current = setTimeout(() => {
        setShowReconnect(true);
      }, 5000);
    } else {
      setShowReconnect(false);
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
    }

    return () => {
      if (connectionTimeout.current) {
        clearTimeout(connectionTimeout.current);
      }
    };
  }, [isConnected]);

  const handleJoinChat = useCallback(() => {
    if (chatId) {
      joinChatRoom(chatId);
    }
  }, [chatId, joinChatRoom]);

  const handleLeaveChat = useCallback(() => {
    if (chatId) {
      leaveChatRoom(chatId);
    }
  }, [chatId, leaveChatRoom]);

  useEffect(() => {
    hasMarkedAsRead.current = false;
    setOptimisticMessages([]);
    setMessage("");
    setInitialScrollComplete(false);
    initialLoadRef.current = false;

    if (scrollToBottomTimeoutRef.current) {
      clearTimeout(scrollToBottomTimeoutRef.current);
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    handleJoinChat();
    return () => {
      handleLeaveChat();
    };
  }, [chatId, handleJoinChat, handleLeaveChat]);

  useEffect(() => {
    if (
      chatId &&
      chat &&
      markAsRead &&
      !hasMarkedAsRead.current &&
      chat.unreadCount > 0 &&
      isConnected
    ) {
      markAsRead();
      hasMarkedAsRead.current = true;
    }
  }, [chatId, chat, markAsRead, isConnected]);

  const scrollToBottom = useCallback(
    (forced = false) => {
      if (messageListContainerRef.current) {
        const scrollElement = messageListContainerRef.current.querySelector(
          "[data-radix-scroll-area-viewport]"
        );
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
          if (forced && !initialScrollComplete) {
            setInitialScrollComplete(true);
          }
        }
      }
    },
    [initialScrollComplete]
  );

  useEffect(() => {
    if (messages.length > 0 && !isMessagesLoading) {
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current);
      }

      scrollToBottomTimeoutRef.current = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [messages, isMessagesLoading, scrollToBottom]);

  useEffect(() => {
    const messageReceived = messages.length > 0;
    const newMessage = optimisticMessages.length > 0;

    if ((messageReceived || newMessage) && chatId) {
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current);
      }

      scrollToBottomTimeoutRef.current = setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }

    return () => {
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current);
      }
    };
  }, [messages.length, optimisticMessages.length, chatId, scrollToBottom]);

  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    if (!chatId || !isConnected) return;

    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(chatId, true);
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (chatId && isConnected) {
        sendTypingStatus(chatId, false);
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      if (scrollToBottomTimeoutRef.current) {
        clearTimeout(scrollToBottomTimeoutRef.current);
      }
    };
  }, [typingTimeout]);

  const handleSendMessage = async () => {
    if (message.trim() && chatId) {
      if (!isConnected) {
        toast.error("Unable to send message. Please check your connection.");
        return;
      }

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        content: message.trim(),
        type: "TEXT",
        senderId: user.id,
        chatId: chatId,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        statuses: [],
      };

      setOptimisticMessages((prev) => [...prev, optimisticMessage]);
      setMessage("");
      setIsTyping(false);

      if (chatId && isConnected) {
        sendTypingStatus(chatId, false);
      }

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      scrollToBottom(true);

      try {
        await sendMessage({ content: optimisticMessage.content });
        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticId)
        );
      } catch (error) {
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticId ? { ...msg, error: true } : msg
          )
        );
        toast.error("Failed to send message. Please try again.");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMedia = async (file) => {
    if (file && chatId) {
      if (!isConnected) {
        toast.error("Unable to send media. Please check your connection.");
        return;
      }

      const fileType = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("audio/")
        ? "AUDIO"
        : "DOCUMENT";
      let previewUrl = null;

      if (fileType === "IMAGE") {
        previewUrl = URL.createObjectURL(file);
      }

      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMessage = {
        id: optimisticId,
        content: previewUrl || file.name,
        type: fileType,
        senderId: user.id,
        chatId: chatId,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
        isUploading: true,
        statuses: [],
      };

      setOptimisticMessages((prev) => [...prev, optimisticMessage]);
      scrollToBottom(true);

      try {
        await sendMediaMessage({
          file,
          type: fileType,
          content: "",
        });

        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticId)
        );

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticId
              ? { ...msg, error: true, isUploading: false }
              : msg
          )
        );
        toast.error("Failed to send media. Please try again.");
      }
    }
  };

  const handleForceScrollToBottom = () => {
    scrollToBottom(true);
  };

  const handleReconnect = () => {
    retryConnection();
    toast.info("Attempting to reconnect...");
  };

  const allMessages = [
    ...messages,
    ...optimisticMessages.filter(
      (optMsg) =>
        !messages.some(
          (realMsg) =>
            optMsg.content === realMsg.content &&
            Math.abs(new Date(optMsg.createdAt) - new Date(realMsg.createdAt)) <
              5000
        )
    ),
  ];

  if (!chatId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-10 h-10 text-primary"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold mb-3">
              Welcome to ChatConnect
            </h3>
            <p className="text-muted-foreground mb-6">
              Select a chat from the sidebar or start a new conversation.
            </p>
            {chats && chats.length === 0 && (
              <button
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
                onClick={() => navigate("/contacts/find")}
              >
                Find Contacts
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isChatLoading || !chat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <ChatHeader chat={chat} user={user} onBack={() => navigate("/chats")} />
      </div>

      {(!isConnected || socketError) && (
        <div
          className={`px-4 py-2 ${
            socketError
              ? "bg-destructive/10 text-destructive"
              : "bg-yellow-500/10 text-yellow-500"
          } flex items-center justify-between`}
        >
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">
              {socketError ||
                "Connection lost. Messages may not be delivered in real time."}
            </span>
          </div>
          {showReconnect && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReconnect}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reconnect
            </Button>
          )}
        </div>
      )}

      <div
        ref={messageListContainerRef}
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <MessageList
          messages={allMessages || []}
          chat={chat}
          currentUserId={user?.id}
          loadMoreMessages={loadMoreMessages}
          hasMoreMessages={hasMoreMessages}
          isLoadingMore={isLoadingMore}
          onScrollToBottomRequest={handleForceScrollToBottom}
        />

        {messages.length > 10 && (
          <button
            className="absolute bottom-4 right-4 bg-primary text-primary-foreground rounded-full p-2 shadow-md hover:bg-primary/90 transition-opacity opacity-70 hover:opacity-100"
            onClick={handleForceScrollToBottom}
            aria-label="Scroll to bottom"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19V5M5 12l7 7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {isConnected && (
        <div className="absolute bottom-20 right-4 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-md opacity-70">
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </div>
      )}

      <div style={{ flexShrink: 0 }}>
        <ChatInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          handleKeyDown={handleKeyDown}
          handleMessageChange={handleMessageChange}
          handleSendMedia={handleSendMedia}
          isSending={isSending || isSendingMedia}
          isOffline={!isConnected}
        />
      </div>
    </div>
  );
}

export default ChatPage;

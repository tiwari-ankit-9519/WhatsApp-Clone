import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useChats } from "../../hooks/useChats";
import { useMessages } from "../../hooks/useMessages";
import { useSocketContext } from "../../contexts/SocketContext";
import MessageList from "../../components/messages/MessageList";
import ChatInput from "../../components/chat/ChatInput";
import ChatHeader from "../../components/chat/ChatHeader";

function ChatPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { useChatDetails, chats } = useChats();

  // Get messages and all related message functions
  const {
    messages,
    sendMessage,
    sendMediaMessage,
    isSending,
    isSendingMedia,
    loadMoreMessages,
    hasMoreMessages,
    isLoadingMore,
  } = useMessages(chatId);

  // Get socket-related functions
  const { joinChatRoom, leaveChatRoom, sendTypingStatus } = useSocketContext();

  // Local state
  const [message, setMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState([]);

  // Refs
  const hasMarkedAsRead = useRef(false);
  const messageListContainerRef = useRef(null);

  // Get chat details
  const { chat, isLoading: isChatLoading, markAsRead } = useChatDetails(chatId);

  // Join chat room
  const handleJoinChat = useCallback(() => {
    if (chatId) {
      joinChatRoom(chatId);
    }
  }, [chatId, joinChatRoom]);

  // Leave chat room
  const handleLeaveChat = useCallback(() => {
    if (chatId) {
      leaveChatRoom(chatId);
    }
  }, [chatId, leaveChatRoom]);

  // Reset state and refs when chat changes
  useEffect(() => {
    hasMarkedAsRead.current = false;
    setOptimisticMessages([]);
    setMessage("");
  }, [chatId]);

  // Join and leave chat room
  useEffect(() => {
    if (!chatId) return;

    handleJoinChat();
    return () => {
      handleLeaveChat();
    };
  }, [chatId, handleJoinChat, handleLeaveChat]);

  // Mark messages as read
  useEffect(() => {
    if (
      chatId &&
      chat &&
      markAsRead &&
      !hasMarkedAsRead.current &&
      chat.unreadCount > 0
    ) {
      markAsRead();
      hasMarkedAsRead.current = true;
    }
  }, [chatId, chat, markAsRead]);

  // Scroll to bottom directly (not relying on child components)
  const scrollToBottom = useCallback(() => {
    if (messageListContainerRef.current) {
      const scrollElement = messageListContainerRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messages.length > 0 || optimisticMessages.length > 0) {
      // Use a timeout to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, optimisticMessages.length, scrollToBottom]);

  // Handle message input change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    if (!chatId) return;

    // Emit typing status
    if (!isTyping) {
      setIsTyping(true);
      sendTypingStatus(chatId, true);
    }

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      if (chatId) {
        sendTypingStatus(chatId, false);
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Send message with optimistic update
  const handleSendMessage = async () => {
    if (message.trim() && chatId) {
      // Create optimistic message
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

      // Add to optimistic messages
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);

      // Clear input field immediately for better UX
      setMessage("");

      // Reset typing status
      setIsTyping(false);
      if (chatId) {
        sendTypingStatus(chatId, false);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Scroll to bottom immediately after sending
      setTimeout(scrollToBottom, 50);

      // Send actual message
      try {
        await sendMessage({ content: optimisticMessage.content });

        // Remove optimistic message after successful send
        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticId)
        );
      } catch (error) {
        console.log(error);

        // Mark message as failed
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticId ? { ...msg, error: true } : msg
          )
        );
      }
    }
  };

  // Handle key press to send message
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle media attachment upload with optimistic update
  const handleSendMedia = async (file) => {
    if (file && chatId) {
      const fileType = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("audio/")
        ? "AUDIO"
        : "DOCUMENT";

      // Create a preview URL for images
      let previewUrl = null;
      if (fileType === "IMAGE") {
        previewUrl = URL.createObjectURL(file);
      }

      // Create optimistic ID
      const optimisticId = `optimistic-${Date.now()}`;

      // Create optimistic message
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

      // Add to optimistic messages
      setOptimisticMessages((prev) => [...prev, optimisticMessage]);

      // Scroll to bottom immediately after sending
      setTimeout(scrollToBottom, 50);

      // Send actual message
      try {
        await sendMediaMessage({
          file,
          type: fileType,
          content: "",
        });

        // Remove optimistic message after successful send
        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg.id !== optimisticId)
        );

        // Revoke object URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      } catch (error) {
        console.log(error);

        // Mark message as failed
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticId
              ? { ...msg, error: true, isUploading: false }
              : msg
          )
        );
      }
    }
  };

  // Combine actual messages with optimistic messages
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

  // Show empty state when no chat is selected
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

  // Show loading state
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
      }}
    >
      {/* Chat Header - Fixed height */}
      <div style={{ flexShrink: 0 }}>
        <ChatHeader chat={chat} user={user} onBack={() => navigate("/chats")} />
      </div>

      {/* Messages - Scrollable area */}
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
        />
      </div>

      {/* Chat Input - Fixed height */}
      <div style={{ flexShrink: 0 }}>
        <ChatInput
          message={message}
          setMessage={setMessage}
          handleSendMessage={handleSendMessage}
          handleKeyDown={handleKeyDown}
          handleMessageChange={handleMessageChange}
          handleSendMedia={handleSendMedia}
          isSending={isSending || isSendingMedia}
        />
      </div>
    </div>
  );
}

export default ChatPage;

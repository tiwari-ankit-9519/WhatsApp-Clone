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
  const { messages, sendMessage, sendMediaMessage, isSending, isSendingMedia } =
    useMessages(chatId);

  const { joinChatRoom, leaveChatRoom, sendTypingStatus } = useSocketContext();

  const messagesContainerRef = useRef(null);
  const [message, setMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);

  const hasMarkedAsRead = useRef(false);

  const { chat, isLoading: isChatLoading, markAsRead } = useChatDetails(chatId);

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

  // Reset the markAsRead flag when chat changes
  useEffect(() => {
    hasMarkedAsRead.current = false;
  }, [chatId]);

  // Join chat room when chat ID changes
  useEffect(() => {
    if (!chatId) return;

    handleJoinChat();

    return () => {
      handleLeaveChat();
    };
  }, [chatId, handleJoinChat, handleLeaveChat]);

  // Mark messages as read when chat is opened - FIXED to prevent infinite loop
  useEffect(() => {
    // Only call markAsRead if:
    // 1. We have a valid chatId
    // 2. Chat data is loaded
    // 3. We haven't already marked as read (prevents loop)
    // 4. The chat has unread messages
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

  // Send message
  const handleSendMessage = () => {
    if (message.trim() && chatId) {
      sendMessage({ content: message.trim() });
      setMessage("");
      setIsTyping(false);
      if (chatId) {
        sendTypingStatus(chatId, false);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
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

  // Handle media attachment upload
  const handleSendMedia = (file) => {
    if (file && chatId) {
      const fileType = file.type.startsWith("image/")
        ? "IMAGE"
        : file.type.startsWith("audio/")
        ? "AUDIO"
        : "DOCUMENT";

      sendMediaMessage({
        file,
        type: fileType,
        content: "",
      });
    }
  };

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
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <ChatHeader chat={chat} user={user} onBack={() => navigate("/chats")} />

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages || []}
          chat={chat}
          currentUserId={user?.id}
        />
      </div>

      {/* Chat Input */}
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
  );
}

export default ChatPage;

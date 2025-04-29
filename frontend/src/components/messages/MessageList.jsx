import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { useSocketContext } from "../../contexts/SocketContext";
import { ScrollArea } from "../ui/scroll-area";

const MessageList = ({
  messages,
  chat,
  currentUserId,
  loadMoreMessages,
  hasMoreMessages,
  isLoadingMore,
}) => {
  const scrollAreaRef = useRef(null);
  const viewportRef = useRef(null);
  const previousHeightRef = useRef(0);
  const isLoadingRef = useRef(false);
  const { getTypingUsers } = useSocketContext();

  // Sort messages by creation date (oldest to newest)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Handle scrolling when loading more messages
  useEffect(() => {
    const handleScroll = async () => {
      if (
        !viewportRef.current ||
        isLoadingRef.current ||
        !hasMoreMessages ||
        isLoadingMore
      ) {
        return;
      }

      // If scrolled near the top, load more messages
      if (viewportRef.current.scrollTop < 50) {
        isLoadingRef.current = true;
        previousHeightRef.current = viewportRef.current.scrollHeight;

        try {
          await loadMoreMessages();
        } finally {
          // Set a timeout to allow React to render the new messages
          setTimeout(() => {
            isLoadingRef.current = false;
          }, 300);
        }
      }
    };

    const viewport = viewportRef.current;
    if (viewport) {
      viewport.addEventListener("scroll", handleScroll);
      return () => viewport.removeEventListener("scroll", handleScroll);
    }
  }, [loadMoreMessages, hasMoreMessages, isLoadingMore]);

  // Maintain scroll position when loading older messages
  useEffect(() => {
    if (previousHeightRef.current > 0 && viewportRef.current) {
      setTimeout(() => {
        if (viewportRef.current) {
          const newHeight = viewportRef.current.scrollHeight;
          const newPosition = newHeight - previousHeightRef.current;

          if (newPosition > 0) {
            viewportRef.current.scrollTop = newPosition;
            previousHeightRef.current = 0;
          }
        }
      }, 50);
    }
  }, [messages.length]);

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};

    sortedMessages.forEach((message) => {
      const date = new Date(message.createdAt);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate();
  const typingUsers = getTypingUsers(chat.id);

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Find typing user names for display
  const getTypingUserNames = () => {
    if (!typingUsers.length) return null;

    return chat.users
      .filter(
        (u) => typingUsers.includes(u.userId) && u.userId !== currentUserId
      )
      .map((u) => u.user.name)
      .join(", ");
  };

  const typingUserNames = getTypingUserNames();

  // Empty state if no messages
  if (sortedMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto bg-accent/10">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8 text-primary"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
          <p className="text-muted-foreground">
            Start the conversation by saying hello!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", position: "relative" }}>
      <ScrollArea
        className="h-full"
        style={{ height: "100%" }}
        ref={scrollAreaRef}
        viewportRef={viewportRef}
      >
        <div className="p-4 bg-accent/10">
          {/* Loading indicator for infinite scroll */}
          {isLoadingMore && (
            <div className="flex justify-center py-2 mb-2">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}

          {/* Message groups by date */}
          {Object.keys(messageGroups).map((date) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex justify-center my-4">
                <div className="px-3 py-1 bg-accent/50 rounded-full text-xs text-muted-foreground">
                  {formatDate(date)}
                </div>
              </div>

              {/* Messages in this date group */}
              {messageGroups[date].map((message, index) => (
                <MessageItem
                  key={message.id || `temp-${message.createdAt}`}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                  showSender={chat.type === "GROUP"}
                  previousMessage={
                    index > 0 ? messageGroups[date][index - 1] : null
                  }
                  chat={chat}
                />
              ))}
            </div>
          ))}

          {/* Typing indicator */}
          {typingUserNames && (
            <div className="flex px-4 py-2 text-sm text-muted-foreground">
              <div className="bg-card px-3 py-2 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    <span className="animate-bounce">.</span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    >
                      .
                    </span>
                    <span
                      className="animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    >
                      .
                    </span>
                  </div>
                  <span>{typingUserNames} typing</span>
                </div>
              </div>
            </div>
          )}

          {/* Extra space at the bottom to ensure messages don't get hidden behind input */}
          <div style={{ height: "16px" }} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessageList;

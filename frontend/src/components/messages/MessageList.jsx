import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { useSocketContext } from "../../contexts/SocketContext";

const MessageList = ({ messages, chat, currentUserId }) => {
  const messagesEndRef = useRef(null);
  const { getTypingUsers } = useSocketContext();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};

    messages.forEach((message) => {
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
  if (messages.length === 0) {
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
    <div className="flex-1 overflow-y-auto p-4 bg-accent/10">
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
              key={message.id}
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

      {/* Empty div for scrolling to bottom */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

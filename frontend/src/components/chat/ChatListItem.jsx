/* eslint-disable no-unused-vars */
import React from "react";
import { useTheme } from "../../components/theme-provider";
import Avatar from "../ui/AvatarIcon";
import { formatRelativeTime } from "../../lib/utils";

const ChatListItem = ({
  id,
  name,
  avatarUrl,
  isGroup,
  isActive,
  lastMessage,
  lastMessageTime,
  isOnline,
  unreadCount,
  isTyping,
  onClick,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const getLastMessageText = () => {
    if (isTyping) {
      return "typing...";
    }

    if (!lastMessage) {
      return "No messages yet";
    }

    switch (lastMessage.type) {
      case "TEXT":
        return lastMessage.content;
      case "IMAGE":
        return "📷 Image";
      case "VIDEO":
        return "🎥 Video";
      case "AUDIO":
        return "🎵 Audio";
      case "DOCUMENT":
        return "📄 Document";
      default:
        return "New message";
    }
  };

  const messageText = getLastMessageText();
  const time = lastMessageTime
    ? formatRelativeTime(new Date(lastMessageTime))
    : "";

  return (
    <div
      className={`
        px-4 py-3 cursor-pointer flex items-center 
        ${
          isActive
            ? isDark
              ? "bg-gray-700"
              : "bg-gray-100"
            : isDark
            ? "hover:bg-gray-700"
            : "hover:bg-gray-50"
        }
      `}
      onClick={onClick}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={avatarUrl}
          alt={name}
          status={isOnline ? "online" : "offline"}
          isGroup={isGroup}
        />
      </div>

      <div className="ml-3 flex-1 overflow-hidden">
        <div className="flex justify-between items-center">
          <h3
            className={`font-medium truncate ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {name}
          </h3>
          {time && (
            <span
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              } ${unreadCount > 0 ? "font-medium" : ""}`}
            >
              {time}
            </span>
          )}
        </div>

        <div className="flex justify-between items-center mt-1">
          <p
            className={`
            text-sm truncate max-w-[85%] 
            ${
              isTyping
                ? "italic text-teal-500"
                : isDark
                ? unreadCount > 0
                  ? "text-white font-medium"
                  : "text-gray-400"
                : unreadCount > 0
                ? "text-gray-900 font-medium"
                : "text-gray-500"
            }
          `}
          >
            {messageText}
          </p>

          {unreadCount > 0 && (
            <span className="flex-shrink-0 bg-teal-500 text-white text-xs font-medium rounded-full h-5 min-w-[20px] flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatListItem;

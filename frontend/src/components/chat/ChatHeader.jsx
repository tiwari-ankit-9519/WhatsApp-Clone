/* eslint-disable no-unused-vars */
import React from "react";
import { useTheme } from "../../components/theme-provider";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/Avatar";
import DropdownMenu from "../ui/DropdownMenu";
import StatusBar from "./StatusBar";

const ChatHeader = ({ chat }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { typingUsers } = useChat();

  if (!chat) return null;

  // Determine if this is a group or private chat
  const isGroup = chat.type === "GROUP";

  // Get the other user for private chats
  let displayName = chat.name;
  let avatarUrl = chat.image;
  let isOnline = false;
  let userId = null;

  if (!isGroup) {
    const otherUser = chat.users.find((u) => u.user.id !== user?.id)?.user;
    if (otherUser) {
      displayName = otherUser.name;
      avatarUrl = otherUser.profilePic;
      isOnline = otherUser.online;
      userId = otherUser.id;
    }
  }

  // Check if someone is typing
  const typingUserIds = typingUsers[chat.id] || [];
  const isTyping = typingUserIds.length > 0;

  // Menu options
  const menuItems = [
    ...(isGroup
      ? [
          { label: "Group info", action: () => console.log("View group info") },
          {
            label: "Add participants",
            action: () => console.log("Add participants"),
          },
        ]
      : [{ label: "View contact", action: () => console.log("View contact") }]),
    { label: "Search messages", action: () => console.log("Search messages") },
    {
      label: "Mute notifications",
      action: () => console.log("Mute notifications"),
    },
    { label: "Clear messages", action: () => console.log("Clear messages") },
    ...(isGroup
      ? [{ label: "Exit group", action: () => console.log("Exit group") }]
      : [
          {
            label: "Block contact",
            action: () => console.log("Block contact"),
          },
        ]),
  ];

  return (
    <div
      className={`
      px-4 py-3 flex items-center justify-between border-b
      ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
    `}
    >
      <div className="flex items-center">
        <Avatar
          src={avatarUrl}
          alt={displayName}
          status={isOnline ? "online" : "offline"}
          isGroup={isGroup}
        />

        <div className="ml-3">
          <h2
            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {displayName}
          </h2>

          <StatusBar
            isGroup={isGroup}
            isOnline={isOnline}
            isTyping={isTyping}
            chat={chat}
          />
        </div>
      </div>

      <div className="flex items-center">
        {/* Search button */}
        <button
          className={`p-2 rounded-full ${
            isDark
              ? "text-gray-300 hover:bg-gray-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>

        {/* More options dropdown */}
        <DropdownMenu
          items={menuItems}
          buttonClass={`p-2 rounded-full ${
            isDark
              ? "text-gray-300 hover:bg-gray-700"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        />
      </div>
    </div>
  );
};

export default ChatHeader;

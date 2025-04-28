/* eslint-disable no-unused-vars */
import React from "react";
import { useTheme } from "../../components/theme-provider";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import Avatar from "../ui/AvatarIcon";
import CustomDropdownMenu from "../ui/DropdownMenu";
import StatusBar from "./StatusBar";
import {
  Info,
  UserPlus,
  Search as SearchIcon,
  Bell,
  Trash2,
  LogOut,
  Ban,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ChatHeader = ({ chat }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { typingUsers } = useChat();

  if (!chat) return null;

  const isGroup = chat.type === "GROUP";

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

  const typingUserIds = typingUsers[chat.id] || [];
  const isTyping = typingUserIds.length > 0;

  const menuItems = [
    ...(isGroup
      ? [
          {
            label: "Group info",
            icon: (
              <Info
                className={`w-4 h-4 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
            ),
            action: () => console.log("View group info"),
          },
          {
            label: "Add participants",
            icon: (
              <UserPlus
                className={`w-4 h-4 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
            ),
            action: () => console.log("Add participants"),
          },
        ]
      : [
          {
            label: "View contact",
            icon: (
              <Info
                className={`w-4 h-4 ${
                  isDark ? "text-gray-400" : "text-gray-600"
                }`}
              />
            ),
            action: () => console.log("View contact"),
          },
        ]),
    {
      label: "Search messages",
      icon: (
        <SearchIcon
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => console.log("Search messages"),
    },
    {
      label: "Mute notifications",
      icon: (
        <Bell
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => console.log("Mute notifications"),
    },
    {
      label: "Clear messages",
      icon: (
        <Trash2
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => console.log("Clear messages"),
    },
    ...(isGroup
      ? [
          {
            label: "Exit group",
            icon: <LogOut className="w-4 h-4 text-red-500" />,
            action: () => console.log("Exit group"),
          },
        ]
      : [
          {
            label: "Block contact",
            icon: <Ban className="w-4 h-4 text-red-500" />,
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
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
        >
          <SearchIcon className="h-5 w-5" />
        </Button>

        {/* More options dropdown */}
        <CustomDropdownMenu
          items={menuItems}
          buttonIcon={<MoreVertical className="h-5 w-5" />}
          buttonClass={`rounded-full ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
          align="end"
        />
      </div>
    </div>
  );
};

export default ChatHeader;

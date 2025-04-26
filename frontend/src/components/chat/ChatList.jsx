/* eslint-disable no-unused-vars */
import React from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../components/theme-provider";
import { useAuth } from "../../context/AuthContext";
import ChatListItem from "./ChatListItem";

const ChatList = ({ searchQuery }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { chats, activeChat, selectChat, unreadMessages, isUserTyping } =
    useChat();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filter chats based on search query
  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();

    // For private chats, search in the other user's name
    if (chat.type === "PRIVATE") {
      const otherUser = chat.users.find((u) => u.user.id !== user?.id)?.user;
      return otherUser && otherUser.name.toLowerCase().includes(searchLower);
    }

    // For group chats, search in the group name
    return chat.name && chat.name.toLowerCase().includes(searchLower);
  });

  // Sort chats by most recent message
  const sortedChats = [...filteredChats].sort((a, b) => {
    const aMessage = a.messages && a.messages.length > 0 ? a.messages[0] : null;
    const bMessage = b.messages && b.messages.length > 0 ? b.messages[0] : null;

    if (!aMessage && !bMessage) return 0;
    if (!aMessage) return 1;
    if (!bMessage) return -1;

    return new Date(bMessage.createdAt) - new Date(aMessage.createdAt);
  });

  const handleChatClick = (chat) => {
    navigate(`/chats/${chat.id}`);
  };

  return (
    <div className="h-full">
      {sortedChats.length > 0 ? (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedChats.map((chat) => {
            const isActive = activeChat?.id === chat.id;
            const unreadCount = unreadMessages[chat.id] || 0;

            // Get the other user for private chats
            let displayName = chat.name;
            let avatarUrl = chat.image;
            let isOnline = false;

            if (chat.type === "PRIVATE") {
              const otherUser = chat.users.find(
                (u) => u.user.id !== user?.id
              )?.user;
              if (otherUser) {
                displayName = otherUser.name;
                avatarUrl = otherUser.profilePic;
                isOnline = otherUser.online;
              }
            }

            // Get last message
            const lastMessage =
              chat.messages && chat.messages.length > 0
                ? chat.messages[0]
                : null;

            // Check if someone is typing
            const typingUserIds = Object.entries(isUserTyping)
              .filter(([chatId, isTyping]) => chatId === chat.id && isTyping)
              .map(([_, userId]) => userId);

            return (
              <ChatListItem
                key={chat.id}
                id={chat.id}
                name={displayName}
                avatarUrl={avatarUrl}
                isGroup={chat.type === "GROUP"}
                isActive={isActive}
                lastMessage={lastMessage}
                lastMessageTime={lastMessage?.createdAt}
                isOnline={isOnline}
                unreadCount={unreadCount}
                isTyping={typingUserIds.length > 0}
                onClick={() => handleChatClick(chat)}
              />
            );
          })}
        </div>
      ) : (
        <div
          className={`flex flex-col items-center justify-center h-full p-6 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          {searchQuery ? (
            <>
              <p className="text-center mb-2">No chats match your search</p>
              <p className="text-center text-sm">
                Try a different search term or start a new chat
              </p>
            </>
          ) : (
            <>
              <p className="text-center mb-2">No chats yet</p>
              <p className="text-center text-sm">
                Start a new conversation from your contacts
              </p>
              <button
                onClick={() =>
                  navigate("/chats", { state: { activeView: "contacts" } })
                }
                className={`mt-4 px-4 py-2 rounded-lg ${
                  isDark
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "bg-teal-500 hover:bg-teal-600 text-white"
                }`}
              >
                View Contacts
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatList;

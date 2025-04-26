import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../components/theme-provider";
import { useAuth } from "../../context/AuthContext";
import ChatList from "@/components/chat/ChatList";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessages from "@/components/chat/ChatMessages";
import ChatInput from "@/components/chat/ChatInput";
import EmptyChat from "@/components/chat/EmptyChat";
import ContactList from "@/components/chat/ContactList";
import SearchInput from "@/components/chat/SearchInput";
import { useQuery } from "@tanstack/react-query";
import {
  getAllNotificationCounts,
  markContactRequestsViewed,
} from "../../state/chat";
import Avatar from "@/components/ui/Avatar";
import DropdownMenu from "@/components/ui/DropdownMenu";

const ChatLayout = ({ chatId }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { activeChat, selectChat, clearChat } = useChat();
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [activeView, setActiveView] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: getAllNotificationCounts,
    refetchInterval: 10000,
    // Prevent refetch on window focus
    refetchOnWindowFocus: false,
    // Show previous data while fetching
    keepPreviousData: true,
  });

  useEffect(() => {
    const loadChat = async () => {
      if (chatId && (!activeChat || activeChat.id !== chatId)) {
        setIsLoadingChat(true);
        try {
          await selectChat(chatId);
        } catch (error) {
          console.error("Error loading chat:", error);
        } finally {
          setIsLoadingChat(false);
        }
      } else if (!chatId && activeChat) {
        clearChat();
      }
    };

    loadChat();
  }, [chatId, selectChat, clearChat, activeChat]);

  const handleContactClick = (contact) => {
    navigate(`/chats/${contact.id}`);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view === "contacts") {
      markContactRequestsViewed();
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const profileMenuItems = [
    { label: "Profile", action: () => navigate("/profile") },
    { label: "Settings", action: () => navigate("/settings") },
    { label: "Logout", action: handleLogout },
  ];

  // Determine what to render in the main chat area
  const renderChatArea = () => {
    if (chatId && isLoadingChat) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full ${
                isDark ? "border-teal-400" : "border-teal-600"
              } border-2 border-b-transparent animate-spin`}
            ></div>
            <p
              className={`mt-2 text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Loading chat...
            </p>
          </div>
        </div>
      );
    }

    if (activeChat) {
      return (
        <>
          <ChatHeader chat={activeChat} />
          <ChatMessages chatId={activeChat.id} />
          <ChatInput chatId={activeChat.id} />
        </>
      );
    }

    return <EmptyChat />;
  };

  return (
    <div
      className={`h-screen flex flex-col ${
        isDark ? "bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div
          className={`w-full md:w-1/3 lg:w-1/4 flex flex-col border-r ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}
        >
          <div
            className={`p-3 flex items-center justify-between border-b ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center">
              <Avatar
                src={user?.profilePic}
                alt={user?.name}
                size="md"
                status="online"
              />
              <span
                className={`ml-3 font-medium ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {user?.name}
              </span>
            </div>
            <DropdownMenu
              items={profileMenuItems}
              buttonClass={`p-2 rounded-full ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            />
          </div>

          {/* Search input */}
          <div className="p-3">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={
                activeView === "chats"
                  ? "Search or start new chat"
                  : "Search contacts"
              }
            />
          </div>

          {/* Sidebar navigation tabs */}
          <div
            className={`flex border-b ${
              isDark ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <button
              onClick={() => handleViewChange("chats")}
              className={`flex-1 py-3 text-center font-medium relative ${
                activeView === "chats"
                  ? isDark
                    ? "text-teal-400 border-b-2 border-teal-400"
                    : "text-teal-600 border-b-2 border-teal-600"
                  : isDark
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Chats
              {notificationsData?.messageCount > 0 && (
                <span className="absolute top-1 right-4 px-1.5 py-0.5 text-xs rounded-full bg-teal-500 text-white min-w-[18px]">
                  {notificationsData.messageCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleViewChange("contacts")}
              className={`flex-1 py-3 text-center font-medium relative ${
                activeView === "contacts"
                  ? isDark
                    ? "text-teal-400 border-b-2 border-teal-400"
                    : "text-teal-600 border-b-2 border-teal-600"
                  : isDark
                  ? "text-gray-400"
                  : "text-gray-500"
              }`}
            >
              Contacts
              {notificationsData?.contactRequestCount > 0 && (
                <span className="absolute top-1 right-4 px-1.5 py-0.5 text-xs rounded-full bg-teal-500 text-white min-w-[18px]">
                  {notificationsData.contactRequestCount}
                </span>
              )}
            </button>
          </div>

          {/* Content based on active view */}
          <div className="flex-1 overflow-y-auto">
            {activeView === "chats" ? (
              <ChatList activeChat={activeChat} searchQuery={searchQuery} />
            ) : (
              <ContactList
                onContactClick={handleContactClick}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="hidden md:flex md:flex-1 flex-col">
          {renderChatArea()}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;

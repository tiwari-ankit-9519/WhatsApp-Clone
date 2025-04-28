// ChatLayout.jsx
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
import Avatar from "@/components/ui/AvatarIcon";
import CustomDropdownMenu from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Settings, LogOut } from "lucide-react";
import { Loader2 } from "lucide-react";

const ChatLayout = ({ chatId, children, showChatArea = true }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { activeChat, selectChat, clearChat } = useChat();
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeView, setActiveView] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: getAllNotificationCounts,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const profileMenuItems = [
    {
      label: "Profile",
      icon: (
        <User
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => {
        clearChat();
        navigate("/chats/profile");
      },
    },
    {
      label: "Settings",
      icon: (
        <Settings
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => {
        clearChat();
        navigate("/chats/settings");
      },
    },
    {
      label: isLoggingOut ? "Logging out..." : "Logout",
      icon: isLoggingOut ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
      ) : (
        <LogOut className="w-4 h-4 text-red-500" />
      ),
      action: handleLogout,
      disabled: isLoggingOut,
    },
  ];

  const renderChatArea = () => {
    if (chatId && isLoadingChat) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2
              className={`w-8 h-8 animate-spin ${
                isDark ? "text-teal-400" : "text-teal-600"
              }`}
            />
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

  const renderMainContent = () => {
    // If we have children (Profile/Settings page), render them
    if (children) {
      return children;
    }

    // Otherwise, render the chat area
    if (showChatArea) {
      return renderChatArea();
    }

    return null;
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
            <CustomDropdownMenu
              items={profileMenuItems}
              buttonClass={`rounded-full ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            />
          </div>

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
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Chats
              {notificationsData?.messageCount > 0 && (
                <Badge className="absolute top-2 right-1/2 translate-x-12 h-5 min-w-[20px] flex items-center justify-center bg-teal-500 hover:bg-teal-500 text-white text-xs">
                  {notificationsData.messageCount}
                </Badge>
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
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Contacts
              {notificationsData?.contactRequestCount > 0 && (
                <Badge className="absolute top-2 right-1/2 translate-x-12 h-5 min-w-[20px] flex items-center justify-center bg-teal-500 hover:bg-teal-500 text-white text-xs">
                  {notificationsData.contactRequestCount}
                </Badge>
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

        {/* Main content area */}
        <div className="hidden md:flex md:flex-1 flex-col">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
};

export default ChatLayout;

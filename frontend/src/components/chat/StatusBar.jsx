import React from "react";
import { useTheme } from "../../components/theme-provider";
import { useAuth } from "../../context/AuthContext";

const StatusBar = ({ isGroup, isOnline, isTyping, chat }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();

  if (!chat) return null;

  // For group chats, show number of participants
  if (isGroup) {
    const participants = chat.users?.length || 0;

    if (isTyping) {
      return (
        <div className="flex items-center">
          <p
            className={`text-xs italic ${
              isDark ? "text-teal-400" : "text-teal-600"
            }`}
          >
            Someone is typing...
          </p>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {participants} participants
        </p>
      </div>
    );
  }

  // For private chats, show online status or last seen
  if (isTyping) {
    return (
      <div className="flex items-center">
        <p
          className={`text-xs italic ${
            isDark ? "text-teal-400" : "text-teal-600"
          }`}
        >
          typing...
        </p>
      </div>
    );
  }

  if (isOnline) {
    return (
      <div className="flex items-center">
        <p
          className={`text-xs ${isDark ? "text-green-400" : "text-green-500"}`}
        >
          online
        </p>
      </div>
    );
  }

  // Get the other user for private chats
  const otherUser = chat.users?.find((u) => u.user.id !== user?.id)?.user;

  if (otherUser?.lastSeen) {
    const lastSeen = new Date(otherUser.lastSeen);
    const now = new Date();
    const diffMs = now - lastSeen;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let lastSeenText = "";

    if (diffMins < 1) {
      lastSeenText = "last seen just now";
    } else if (diffMins < 60) {
      lastSeenText = `last seen ${diffMins} ${
        diffMins === 1 ? "minute" : "minutes"
      } ago`;
    } else if (diffHours < 24) {
      lastSeenText = `last seen ${diffHours} ${
        diffHours === 1 ? "hour" : "hours"
      } ago`;
    } else if (diffDays === 1) {
      lastSeenText = "last seen yesterday";
    } else {
      const options = { month: "short", day: "numeric" };
      lastSeenText = `last seen ${lastSeen.toLocaleDateString(
        undefined,
        options
      )}`;
    }

    return (
      <div className="flex items-center">
        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          {lastSeenText}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        offline
      </p>
    </div>
  );
};

export default StatusBar;

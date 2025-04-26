import React from "react";
import { useTheme } from "../../components/theme-provider";
import Avatar from "../ui/Avatar";

const ContactRequestItem = ({ contact, onAccept, onReject }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { sender } = contact;

  const handleAccept = (e) => {
    e.stopPropagation();
    onAccept();
  };

  const handleReject = (e) => {
    e.stopPropagation();
    onReject();
  };

  return (
    <div className={`px-4 py-3 ${isDark ? "bg-gray-800/60" : "bg-gray-50"}`}>
      <div className="flex items-center">
        <Avatar
          src={sender.profilePic}
          alt={sender.name}
          status={sender.online ? "online" : "offline"}
        />

        <div className="ml-3 flex-1">
          <h3
            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {sender.name}
          </h3>

          <p
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
          >
            Wants to connect with you
          </p>
        </div>
      </div>

      <div className="flex mt-3 space-x-2">
        <button
          onClick={handleAccept}
          className={`
            flex-1 py-1.5 rounded text-sm font-medium
            ${
              isDark
                ? "bg-teal-600 hover:bg-teal-700 text-white"
                : "bg-teal-500 hover:bg-teal-600 text-white"
            }
          `}
        >
          Accept
        </button>

        <button
          onClick={handleReject}
          className={`
            flex-1 py-1.5 rounded text-sm font-medium
            ${
              isDark
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }
          `}
        >
          Decline
        </button>
      </div>
    </div>
  );
};

export default ContactRequestItem;

import React from "react";
import { useTheme } from "../../components/theme-provider";
import Avatar from "../ui/AvatarIcon";
import { getLastSeen } from "../../lib/utils";

const ContactListItem = ({
  contact,
  isSearchResult = false,
  onContactClick,
  onSendRequest,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { receiver, relationshipStatus } = contact;

  const handleClick = () => {
    if (relationshipStatus === "ACCEPTED" && onContactClick) {
      onContactClick(receiver);
    }
  };

  const getStatusButton = () => {
    switch (relationshipStatus) {
      case "NONE":
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSendRequest();
            }}
            className={`
              px-3 py-1 text-xs font-medium rounded-full
              ${
                isDark
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-teal-500 hover:bg-teal-600 text-white"
              }
            `}
          >
            Add
          </button>
        );
      case "PENDING":
        return (
          <span
            className={`
            px-3 py-1 text-xs font-medium rounded-full
            ${
              isDark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
            }
          `}
          >
            Pending
          </span>
        );
      case "BLOCKED":
      case "BLOCKED_BY_THEM":
        return (
          <span
            className={`
            px-3 py-1 text-xs font-medium rounded-full
            ${isDark ? "bg-red-900/50 text-red-300" : "bg-red-100 text-red-600"}
          `}
          >
            Blocked
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`
        px-4 py-3 flex items-center justify-between 
        ${
          relationshipStatus === "ACCEPTED"
            ? "cursor-pointer"
            : "cursor-default"
        }
        ${
          relationshipStatus === "ACCEPTED" && isDark ? "hover:bg-gray-700" : ""
        }
        ${
          relationshipStatus === "ACCEPTED" && !isDark ? "hover:bg-gray-50" : ""
        }
      `}
      onClick={handleClick}
    >
      <div className="flex items-center">
        <Avatar
          src={receiver.profilePic}
          alt={receiver.name}
          status={receiver.online ? "online" : "offline"}
        />

        <div className="ml-3">
          <h3
            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
          >
            {receiver.name}
          </h3>

          {relationshipStatus === "ACCEPTED" && (
            <p
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {receiver.online ? "online" : getLastSeen(receiver)}
            </p>
          )}

          {isSearchResult && receiver.email && (
            <p
              className={`text-xs ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {receiver.email}
            </p>
          )}
        </div>
      </div>

      {isSearchResult && getStatusButton()}
    </div>
  );
};

export default ContactListItem;

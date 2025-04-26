import React from "react";
import { useTheme } from "../theme-provider";
import { getInitials } from "../../lib/utils";

const Avatar = ({ src, alt, size = "md", status = null, isGroup = false }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Handle avatar sizes
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  // Handle status indicator sizes
  const statusSizes = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  // Get the initials if we don't have an image
  const initials = getInitials(alt);

  // Set the background color for the avatar
  const bgColor = isGroup
    ? isDark
      ? "bg-purple-700"
      : "bg-purple-500"
    : isDark
    ? "bg-teal-700"
    : "bg-teal-500";

  return (
    <div className={`relative flex-shrink-0 ${sizeClasses[size]}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="rounded-full object-cover w-full h-full"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = ""; // Set to empty to show initials
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}

      <div
        className={`
          ${src ? "hidden" : "flex"} 
          ${bgColor} 
          rounded-full w-full h-full items-center justify-center text-white font-medium
        `}
      >
        {isGroup ? (
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ) : (
          initials
        )}
      </div>

      {status && (
        <div
          className={`
          absolute bottom-0 right-0 
          ${statusSizes[size]} 
          rounded-full border-2 
          ${isDark ? "border-gray-800" : "border-white"}
          ${status === "online" ? "bg-green-500" : "bg-gray-400"}
        `}
        ></div>
      )}
    </div>
  );
};

export default Avatar;

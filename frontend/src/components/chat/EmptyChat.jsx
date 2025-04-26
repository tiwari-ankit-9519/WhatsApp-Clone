import React from "react";
import { useTheme } from "../../components/theme-provider";

const EmptyChat = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`
      flex flex-col items-center justify-center h-full 
      ${isDark ? "bg-gray-900" : "bg-gray-50"}
    `}
    >
      <div className="flex flex-col items-center max-w-md text-center px-4">
        {/* WhatsApp logo */}
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center mb-6
          ${isDark ? "bg-gray-800" : "bg-gray-200"}
        `}
        >
          <svg
            className={`w-10 h-10 ${
              isDark ? "text-teal-500" : "text-teal-600"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 19.5C16.14 19.5 19.5 16.14 19.5 12C19.5 7.86 16.14 4.5 12 4.5C7.86 4.5 4.5 7.86 4.5 12C4.5 13.76 5.12 15.38 6.15 16.65L4.5 19.5L7.35 17.85C8.62 18.88 10.24 19.5 12 19.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          className={`text-xl font-semibold mb-3 ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          WhatsApp Web Clone
        </h1>

        <p className={`mb-5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          Send and receive messages without keeping your phone online. Use
          WhatsApp on up to 4 linked devices and 1 phone at the same time.
        </p>

        <div
          className={`
          p-4 rounded-lg mb-4 border 
          ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
        `}
        >
          <div className="flex items-center mb-2">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isDark ? "bg-teal-500" : "bg-teal-600"
              }`}
            ></div>
            <span
              className={`text-sm font-medium ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              End-to-end encrypted
            </span>
          </div>
          <p
            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Messages and calls are end-to-end encrypted. No one outside of this
            chat, not even the server, can read or listen to them.
          </p>
        </div>

        <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          Select a chat from the sidebar or start a new conversation
        </p>
      </div>
    </div>
  );
};

export default EmptyChat;

/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { useTheme } from "./theme-provider";

const AppMockup = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <div
        className={`rounded-2xl overflow-hidden shadow-2xl border ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        {/* Mock chat app header */}
        <div
          className={`px-4 py-3 flex items-center justify-between ${
            isDarkMode ? "bg-gray-800" : "bg-primary"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full ${
                isDarkMode ? "bg-gray-700" : "bg-primary-foreground/20"
              } flex items-center justify-center`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`w-4 h-4 ${
                  isDarkMode ? "text-white" : "text-primary-foreground"
                }`}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span
              className={`font-medium ${
                isDarkMode ? "text-white" : "text-primary-foreground"
              }`}
            >
              Sarah Johnson
            </span>
          </div>
          <div className="flex gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-5 h-5 ${
                isDarkMode ? "text-white" : "text-primary-foreground"
              }`}
            >
              <path d="M15.6 11.6L22 7v10l-6.4-4.5v-1zM4 5h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7c0-1.1.9-2 2-2z" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-5 h-5 ${
                isDarkMode ? "text-white" : "text-primary-foreground"
              }`}
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="19" cy="12" r="1" />
              <circle cx="5" cy="12" r="1" />
            </svg>
          </div>
        </div>

        {/* Mock chat content */}
        <div
          className={`p-4 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"} h-96`}
        >
          {/* Friend's message */}
          <div className="mb-4 flex">
            <div
              className={`rounded-lg px-4 py-2 max-w-xs ${
                isDarkMode
                  ? "bg-gray-800 text-gray-100"
                  : "bg-white text-gray-800"
              } shadow`}
            >
              <p>Hey there! How are you doing today?</p>
              <p
                className={`text-xs mt-1 text-right ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                10:30 AM
              </p>
            </div>
          </div>

          {/* User's message */}
          <div className="mb-4 flex justify-end">
            <div
              className={`rounded-lg px-4 py-2 max-w-xs ${
                isDarkMode
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-primary text-primary-foreground"
              } shadow`}
            >
              <p>
                I'm great! Just finished the project we were working on. How
                about you?
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <p
                  className={`text-xs ${
                    isDarkMode
                      ? "text-primary-foreground/80"
                      : "text-primary-foreground/80"
                  }`}
                >
                  10:32 AM
                </p>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-3 h-3 ${
                    isDarkMode
                      ? "text-primary-foreground/80"
                      : "text-primary-foreground/80"
                  }`}
                >
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <polyline points="21 12 21 19 3 19 3 5 12 5"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Friend's message */}
          <div className="mb-4 flex">
            <div
              className={`rounded-lg px-4 py-2 max-w-xs ${
                isDarkMode
                  ? "bg-gray-800 text-gray-100"
                  : "bg-white text-gray-800"
              } shadow`}
            >
              <p>
                That's awesome! I've been working on some new designs for the
                app.
              </p>
              <div
                className={`w-48 h-32 rounded mt-2 bg-gradient-to-r ${
                  isDarkMode
                    ? "from-purple-700 to-pink-600"
                    : "from-blue-400 to-purple-500"
                } flex items-center justify-center text-white`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <p
                className={`text-xs mt-1 text-right ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                10:35 AM
              </p>
            </div>
          </div>

          {/* User's message */}
          <div className="mb-4 flex justify-end">
            <div
              className={`rounded-lg px-4 py-2 max-w-xs ${
                isDarkMode
                  ? "bg-primary/90 text-primary-foreground"
                  : "bg-primary text-primary-foreground"
              } shadow`}
            >
              <p>
                Looks great! I'd love to see the full design when it's ready.
              </p>
              <div className="flex items-center justify-end gap-1 mt-1">
                <p
                  className={`text-xs ${
                    isDarkMode
                      ? "text-primary-foreground/80"
                      : "text-primary-foreground/80"
                  }`}
                >
                  10:36 AM
                </p>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-3 h-3 ${
                    isDarkMode
                      ? "text-primary-foreground/80"
                      : "text-primary-foreground/80"
                  }`}
                >
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <polyline points="21 12 21 19 3 19 3 5 12 5"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex">
            <div
              className={`rounded-lg px-4 py-2 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } shadow`}
            >
              <div className="flex gap-1">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                  className={`w-2 h-2 rounded-full ${
                    isDarkMode ? "bg-gray-400" : "bg-gray-400"
                  }`}
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                  className={`w-2 h-2 rounded-full ${
                    isDarkMode ? "bg-gray-400" : "bg-gray-400"
                  }`}
                />
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                  className={`w-2 h-2 rounded-full ${
                    isDarkMode ? "bg-gray-400" : "bg-gray-400"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mock input area */}
        <div
          className={`p-3 flex items-center gap-2 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <button
            className={`p-2 rounded-full ${
              isDarkMode
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
              <circle cx="12" cy="13" r="3"></circle>
            </svg>
          </button>
          <div
            className={`flex-1 rounded-full px-4 py-2 ${
              isDarkMode
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            Type a message...
          </div>
          <button
            className={`p-2 rounded-full ${
              isDarkMode
                ? "bg-primary text-primary-foreground"
                : "bg-primary text-primary-foreground"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-primary/20 z-[-1]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />

      <motion.div
        className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-primary/10 z-[-1]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      />
    </motion.div>
  );
};

export default AppMockup;

// LoadingSpinner.jsx
import { useTheme } from "@/components/theme-provider";

const LoadingSpinner = ({ fullScreen = true }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (!fullScreen) {
    return (
      <div className="flex justify-center items-center p-4">
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
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-screen w-full flex flex-col items-center justify-center ${
        isDark
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-cyan-900"
          : "bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800"
      }`}
    >
      <div className="flex flex-col items-center">
        <div
          className={`w-16 h-16 rounded-full ${
            isDark ? "bg-teal-900/50" : "bg-white/20"
          } backdrop-blur-sm flex items-center justify-center mb-4`}
        >
          <svg
            className="w-8 h-8 text-white"
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

        <div className="flex space-x-2">
          <div
            className="h-2.5 w-2.5 rounded-full bg-white animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full bg-white animate-bounce"
            style={{ animationDelay: "200ms" }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full bg-white animate-bounce"
            style={{ animationDelay: "400ms" }}
          />
        </div>

        <p className="text-white mt-4 text-lg">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

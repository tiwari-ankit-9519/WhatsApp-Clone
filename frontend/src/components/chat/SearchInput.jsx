import React from "react";
import { useTheme } from "../theme-provider";
import { debounce } from "../../lib/utils";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search",
  debounceMs = 300,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Create debounced handler if needed
  const debouncedOnChange =
    debounceMs > 0 ? debounce((e) => onChange(e), debounceMs) : onChange;

  return (
    <div
      className={`
      relative flex items-center w-full rounded-lg
      ${isDark ? "bg-gray-700 text-white" : "bg-gray-100 text-gray-900"}
    `}
    >
      {/* Search icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Input field */}
      <input
        type="text"
        className={`
          block w-full pl-10 pr-3 py-2 rounded-lg 
          ${
            isDark
              ? "bg-gray-700 text-white placeholder-gray-400 focus:ring-teal-500"
              : "bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-teal-600"
          }
          border-none focus:outline-none focus:ring-2 focus:ring-opacity-50
        `}
        placeholder={placeholder}
        value={value}
        onChange={debounceMs > 0 ? (e) => debouncedOnChange(e) : onChange}
      />

      {/* Clear button (shown when input has text) */}
      {value && (
        <button
          type="button"
          className={`
            absolute inset-y-0 right-0 pr-3 flex items-center
            ${
              isDark
                ? "text-gray-400 hover:text-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }
          `}
          onClick={() => {
            // Create a synthetic event to clear the input
            const event = { target: { value: "" } };
            onChange(event);
          }}
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchInput;

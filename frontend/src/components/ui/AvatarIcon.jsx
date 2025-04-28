import React from "react";
import { useTheme } from "../theme-provider";
import { getInitials } from "../../lib/utils";
import {
  Avatar as ShadcnAvatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const Avatar = ({ src, alt, size = "md", status = null, isGroup = false }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Handle avatar sizes
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  // Handle text sizes for fallback
  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  // Handle status indicator sizes
  const statusSizes = {
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-4 w-4",
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
    <div className="relative flex-shrink-0">
      <ShadcnAvatar className={cn(sizeClasses[size])}>
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback
          className={cn(
            "text-white font-medium",
            bgColor,
            textSizeClasses[size]
          )}
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
        </AvatarFallback>
      </ShadcnAvatar>

      {status && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2",
            statusSizes[size],
            isDark ? "border-gray-800" : "border-white",
            status === "online" ? "bg-green-500" : "bg-gray-400"
          )}
        />
      )}
    </div>
  );
};

export default Avatar;

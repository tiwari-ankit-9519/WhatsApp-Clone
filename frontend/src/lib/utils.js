import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Today
  if (diffDays < 1) {
    // Less than a minute
    if (diffMins < 1) {
      return "now";
    }

    // Less than an hour
    if (diffMins < 60) {
      return `${diffMins}m`;
    }

    // Hours
    return `${diffHours}h`;
  }

  // Yesterday
  if (diffDays === 1) {
    return "Yesterday";
  }

  // Within a week
  if (diffDays < 7) {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return dayNames[date.getDay()];
  }

  // Older than a week
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

export function getInitials(name) {
  if (!name) return "";

  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getFileExtension(filename) {
  if (!filename) return "";
  return filename.split(".").pop().toLowerCase();
}

export function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatMessageTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getOtherUser(chat, currentUserId) {
  if (!chat || !chat.users || chat.type !== "PRIVATE") return null;
  return chat.users.find((u) => u.user.id !== currentUserId)?.user || null;
}

export function getGroupParticipantsText(chat) {
  if (!chat || chat.type !== "GROUP" || !chat.users) return "";

  const count = chat.users.length;
  if (count <= 0) return "No participants";
  if (count === 1) return "1 participant";
  return `${count} participants`;
}

export function getLastSeen(user) {
  if (!user || !user.lastSeen) return "offline";

  const lastSeen = new Date(user.lastSeen);
  const now = new Date();
  const diffMs = now - lastSeen;
  const diffMins = Math.floor(diffMs / 60000);

  if (user.online) return "online";

  if (diffMins < 1) return "last seen just now";
  if (diffMins < 60) return `last seen ${diffMins} min ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `last seen ${diffHours} h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "last seen yesterday";

  return `last seen ${lastSeen.toLocaleDateString()}`;
}

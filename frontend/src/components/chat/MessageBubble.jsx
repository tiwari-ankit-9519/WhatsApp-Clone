import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../components/theme-provider";
import { useChat } from "../../context/ChatContext";
import Avatar from "../ui/Avatar";
import { formatMessageTime } from "../../lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reactToMessage, deleteMessage } from "../../state/chat";

const MessageBubble = ({
  message,
  isOwnMessage,
  showAvatar = true,
  isConsecutive = false,
  isPending = false,
  onReply,
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { activeChat } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const messageRef = useRef(null);
  const queryClient = useQueryClient();

  // Mutations for deleting messages
  const deleteMutation = useMutation({
    mutationFn: ({ messageId, deleteType }) =>
      deleteMessage(messageId, deleteType),
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", activeChat?.id]);
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  // Mutation for reacting to messages
  const reactionMutation = useMutation({
    mutationFn: ({ messageId, emoji }) => reactToMessage(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", activeChat?.id]);
    },
    onError: (error) => {
      console.error("Reaction error:", error);
    },
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getStatusIndicator = () => {
    if (!isOwnMessage) return null;

    if (
      isPending ||
      message.id?.toString().startsWith("temp-") ||
      message.statuses?.some((s) => s.status === "SENDING")
    ) {
      return (
        <span className={isDark ? "text-white/60" : "text-black/60"}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="h-3 w-3"
          >
            <circle cx="12" cy="12" r="10" strokeWidth="2"></circle>
            <polyline points="12 6 12 12 16 14" strokeWidth="2"></polyline>
          </svg>
        </span>
      );
    }

    const status = message.statuses?.find((s) => s.status)?.status || "SENT";

    switch (status) {
      case "SENT":
        return (
          <span className={isDark ? "text-white/60" : "text-black/60"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
        );
      case "DELIVERED":
        return (
          <span className={isDark ? "text-white/60" : "text-black/60"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7M5 13l4 4L19 7"
              />
            </svg>
          </span>
        );
      case "READ":
        return (
          <span className="text-blue-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7M5 13l4 4L19 7"
              />
            </svg>
          </span>
        );
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case "TEXT":
        return (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-tight">
            {message.content}
          </p>
        );

      case "IMAGE":
        return (
          <div className="max-w-[300px]">
            <img
              src={message.content}
              alt="Image"
              className="rounded-lg max-h-[300px] object-contain bg-black"
              onLoad={() => {
                const messagesEnd = document.getElementById("messages-end");
                if (messagesEnd) {
                  messagesEnd.scrollIntoView({ behavior: "smooth" });
                }
              }}
            />
          </div>
        );

      case "VIDEO":
        return (
          <div className="max-w-[300px]">
            <video
              src={message.content}
              controls
              className="rounded-lg max-h-[300px] w-full"
            />
          </div>
        );

      case "AUDIO":
        return (
          <div className="w-[250px]">
            <audio src={message.content} controls className="w-full" />
          </div>
        );

      case "DOCUMENT":
        return (
          <div className="flex items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium">Document</p>
              <a
                href={message.content}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline"
              >
                Download
              </a>
            </div>
          </div>
        );

      default:
        return <p>Unsupported message type</p>;
    }
  };

  // Display existing reactions
  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;

    const reactionGroups = message.reactions.reduce((groups, reaction) => {
      if (!groups[reaction.emoji]) {
        groups[reaction.emoji] = [];
      }
      groups[reaction.emoji].push(reaction);
      return groups;
    }, {});

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Object.entries(reactionGroups).map(([emoji, reactions]) => (
          <button
            key={emoji}
            className={`
              flex items-center px-1.5 py-0.5 rounded-full text-xs
              ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }
            `}
            onClick={() =>
              reactionMutation.mutate({ messageId: message.id, emoji })
            }
          >
            <span>{emoji}</span>
            <span className="ml-1">{reactions.length}</span>
          </button>
        ))}
      </div>
    );
  };

  // Handler for reaction button
  const handleReaction = (emoji) => {
    if (!message || !message.id) {
      console.error("Cannot react to message - missing message ID", message);
      return;
    }

    console.log(`Reacting with ${emoji} to message ID: ${message.id}`);

    try {
      reactionMutation.mutate({
        messageId: message.id,
        emoji,
      });
    } catch (error) {
      console.error("Error in reaction handler:", error);
    }

    setShowMenu(false);
  };

  // Handler for reply button
  const handleReplyClick = () => {
    if (!message || !message.id) {
      console.error("Cannot reply to message - missing message ID", message);
      return;
    }

    console.log(`Replying to message ID: ${message.id}`);

    try {
      if (onReply && typeof onReply === "function") {
        onReply(message);
      } else {
        console.error("Reply handler is not available", onReply);
      }
    } catch (error) {
      console.error("Error in reply handler:", error);
    }

    setShowMenu(false);
  };

  // Handler for delete button
  const handleDeleteClick = () => {
    if (!message || !message.id) {
      console.error("Cannot delete message - missing message ID", message);
      return;
    }

    console.log(`Deleting message ID: ${message.id}`);

    try {
      deleteMutation.mutate({
        messageId: message.id,
        deleteType: "FOR_EVERYONE",
      });
    } catch (error) {
      console.error("Error in delete handler:", error);
    }

    setShowMenu(false);
  };

  const renderParentMessage = () => {
    if (!message.parentMessage) return null;

    return (
      <div
        className={`
          px-3 py-1.5 mb-1 rounded-lg text-sm opacity-80
          ${isDark ? "bg-gray-700" : "bg-gray-200"}
        `}
      >
        <div className="flex items-center">
          <span
            className={`font-medium ${
              isDark ? "text-teal-400" : "text-teal-600"
            }`}
          >
            {message.parentMessage.sender.name}
          </span>
        </div>
        <p className="truncate">
          {message.parentMessage.type === "TEXT"
            ? message.parentMessage.content
            : `[${message.parentMessage.type.toLowerCase()}]`}
        </p>
      </div>
    );
  };

  const messageTime = formatMessageTime(new Date(message.createdAt));
  const isMessagePending =
    isPending ||
    message.id?.toString().startsWith("temp-") ||
    message.statuses?.some((s) => s.status === "SENDING");

  // Debug data for the message
  const messageDebugId = message?.id || "unknown";
  console.debug(
    `Rendering message bubble ID: ${messageDebugId}, isOwn: ${isOwnMessage}`
  );

  return (
    <div
      ref={messageRef}
      className={`
        flex items-start group mb-0.5 relative
        ${isOwnMessage ? "justify-end" : "justify-start"}
        ${isConsecutive && !isOwnMessage ? "pl-12" : ""}
      `}
    >
      {!isOwnMessage && showAvatar && (
        <div className="flex-shrink-0 mr-2">
          <Avatar
            src={message.sender.profilePic}
            alt={message.sender.name}
            size="sm"
          />
        </div>
      )}

      {!isOwnMessage && !showAvatar && <div className="w-8 mr-2"></div>}

      <div
        className={`
          relative max-w-[70%] 
          ${message.parentMessage ? "pt-0" : "pt-0"}
          ${isMessagePending ? "opacity-80" : ""}
        `}
      >
        {!isOwnMessage && !isConsecutive && (
          <div className="text-xs font-medium mb-1 text-green-500">
            {message.sender.name}
          </div>
        )}

        {renderParentMessage()}

        <div
          className={`
            relative py-[6px] px-[9px] shadow-sm
            ${
              isOwnMessage
                ? isDark
                  ? "bg-[#005C4B] text-white rounded-tl-lg rounded-tr-md rounded-br-md rounded-bl-lg"
                  : "bg-[#E1FFC7] text-black rounded-tl-lg rounded-tr-md rounded-br-md rounded-bl-lg"
                : isDark
                ? "bg-[#1F2C34] text-white rounded-tr-lg rounded-tl-md rounded-bl-md rounded-br-lg"
                : "bg-white text-black rounded-tr-lg rounded-tl-md rounded-bl-md rounded-br-lg"
            }
          `}
        >
          {renderMessageContent()}

          <div className="flex justify-end items-center mt-[2px] space-x-[2px]">
            <span
              className={`text-[11px] ${
                isOwnMessage
                  ? isDark
                    ? "text-white/50"
                    : "text-black/50"
                  : isDark
                  ? "text-white/50"
                  : "text-black/50"
              }`}
            >
              {messageTime}
            </span>
            {getStatusIndicator()}
          </div>
        </div>

        {renderReactions()}

        {/* Three-dots menu button */}
        {!isMessagePending && (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Three dot menu clicked for message:", message.id);
              setShowMenu(!showMenu);
            }}
            className={`
              absolute top-2 z-10
              ${
                isOwnMessage
                  ? "left-0 -translate-x-[28px]"
                  : "right-0 translate-x-[28px]"
              }
              w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
              ${
                isDark
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}

        {/* Popup Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className={`
              absolute z-50 w-[210px] p-2 rounded-lg shadow-lg
              ${isDark ? "bg-gray-800" : "bg-white"}
              ${isOwnMessage ? "right-0 -top-24" : "left-0 -top-24"}
            `}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {/* Emoji Reaction Grid */}
            <div className="grid grid-cols-6 gap-1 p-1">
              {["👍", "❤️", "😂", "😲", "😢", "🙏"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="flex flex-col items-center justify-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                      `Clicked emoji ${emoji} for message:`,
                      message.id
                    );
                    handleReaction(emoji);
                  }}
                >
                  <span className="text-xl">{emoji}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            {/* Action Buttons */}
            <div className="p-1 flex flex-col">
              <button
                type="button"
                className={`
                  flex items-center w-full py-2 px-3 text-sm rounded-md
                  ${
                    isDark
                      ? "hover:bg-gray-700 text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }
                `}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("Reply button clicked for message:", message.id);
                  handleReplyClick();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Reply
              </button>

              {isOwnMessage && (
                <button
                  type="button"
                  className={`
                    flex items-center w-full py-2 px-3 text-sm rounded-md
                    ${
                      isDark
                        ? "hover:bg-gray-700 text-red-400"
                        : "hover:bg-gray-100 text-red-600"
                    }
                  `}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(
                      "Delete button clicked for message:",
                      message.id
                    );
                    handleDeleteClick();
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

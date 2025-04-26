import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../components/theme-provider";
import { useChat } from "../../context/ChatContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "../../state/chat";
import { debounce } from "../../lib/utils";
import Avatar from "../ui/Avatar";

const ChatInput = ({ chatId }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { setTyping, user } = useChat();
  const [message, setMessage] = useState("");
  const [attachmentType, setAttachmentType] = useState(null);
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [parentMessage, setParentMessage] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();

  window.setParentMessage = setParentMessage;

  const addOptimisticMessage = (content, type = "TEXT") => {
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      content,
      type,
      senderId: user?.id,
      chatId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: user,
      statuses: [{ status: "SENDING" }],
      reactions: [],
      parentId: parentMessage?.id,
      parentMessage: parentMessage,
    };

    const currentData = queryClient.getQueryData(["messages", chatId]);

    if (currentData?.messages && currentData.messages.length > 0) {
      queryClient.setQueryData(["messages", chatId], {
        ...currentData,
        messages: [optimisticMessage, ...currentData.messages],
      });
    } else {
      queryClient.setQueryData(["messages", chatId], {
        messages: [optimisticMessage],
        pagination: { page: 1, hasMore: false },
      });
    }

    return tempId;
  };

  const sendMessageMutation = useMutation({
    mutationFn: (data) => sendMessage(chatId, data),
    onMutate: async (data) => {
      const tempId = addOptimisticMessage(
        data.content,
        data.media ? data.type || "IMAGE" : "TEXT"
      );

      setTimeout(() => {
        const messagesEnd = document.getElementById("messages-end");
        if (messagesEnd) {
          messagesEnd.scrollIntoView({ behavior: "smooth" });
        }
      }, 50);

      return { tempId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", chatId]);
      queryClient.invalidateQueries(["chats"]);
      setParentMessage(null);
    },
    onError: (error, _, context) => {
      console.error("Error sending message:", error);

      if (context?.tempId) {
        const oldData = queryClient.getQueryData(["messages", chatId]);
        if (oldData?.messages) {
          queryClient.setQueryData(["messages", chatId], {
            ...oldData,
            messages: oldData.messages.filter(
              (msg) => msg.id !== context.tempId
            ),
          });
        }
      }
    },
  });

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [message]);

  const debouncedTyping = useRef(
    debounce((isTyping) => {
      setTyping(chatId, isTyping);
    }, 500)
  ).current;

  useEffect(() => {
    if (message.trim()) {
      debouncedTyping(true);
    } else {
      debouncedTyping(false);
      setTyping(chatId, false);
    }

    return () => {
      setTyping(chatId, false);
    };
  }, [message, chatId, debouncedTyping, setTyping]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMedia(file);

    const fileType = file.type.split("/")[0];
    setAttachmentType(fileType);

    if (fileType === "image") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const clearMedia = () => {
    setMedia(null);
    setMediaPreview(null);
    setAttachmentType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = () => {
    if ((!message.trim() && !media) || sendMessageMutation.isPending) return;

    const data = {
      content: message.trim(),
      type: "TEXT",
      parentId: parentMessage?.id,
    };

    if (media) {
      data.media = media;
      data.type = attachmentType.toUpperCase();
    }

    sendMessageMutation.mutate(data);
    setMessage("");
    clearMedia();

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const cancelReply = () => {
    setParentMessage(null);
  };

  return (
    <div
      className={`p-3 border-t ${
        isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {parentMessage && (
        <div
          className={`mb-2 flex items-center p-2 rounded-lg ${
            isDark ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center">
              <span
                className={`text-xs font-medium ${
                  isDark ? "text-teal-400" : "text-teal-600"
                }`}
              >
                Replying to {parentMessage.sender.name}
              </span>
            </div>
            <p className="text-sm truncate opacity-75">
              {parentMessage.type === "TEXT"
                ? parentMessage.content
                : `[${parentMessage.type.toLowerCase()}]`}
            </p>
          </div>
          <button
            className={`ml-2 p-1 rounded-full ${
              isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
            }`}
            onClick={cancelReply}
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
        </div>
      )}

      {mediaPreview && (
        <div className="mb-3 relative w-32 h-32">
          <img
            src={mediaPreview}
            alt="Upload preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            className={`
              absolute top-1 right-1 rounded-full p-1
              ${isDark ? "bg-gray-800" : "bg-gray-200"}
            `}
            onClick={clearMedia}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
        </div>
      )}

      <div className="flex items-end space-x-2">
        <button
          className={`
            p-2 rounded-full flex-shrink-0
            ${
              isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-500 hover:bg-gray-100"
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*,application/*,text/*"
        />

        <div
          className={`
          flex-1 min-h-[40px] max-h-[160px] rounded-lg px-3 pt-2 pb-2
          ${isDark ? "bg-gray-700" : "bg-gray-100"}
        `}
        >
          <textarea
            ref={textareaRef}
            placeholder="Type a message"
            className={`
              w-full resize-none bg-transparent outline-none
              ${
                isDark
                  ? "text-white placeholder-gray-400"
                  : "text-gray-900 placeholder-gray-500"
              }
            `}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
        </div>

        {message.trim() || media ? (
          <button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending}
            className={`
              p-2 rounded-full flex-shrink-0 
              ${isDark ? "bg-teal-600 text-white" : "bg-teal-500 text-white"}
              ${
                sendMessageMutation.isPending
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        ) : (
          <button
            className={`
              p-2 rounded-full flex-shrink-0 
              ${
                isDark
                  ? "text-gray-300 hover:bg-gray-700"
                  : "text-gray-500 hover:bg-gray-100"
              }
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../components/theme-provider";
import { useChat } from "../../context/ChatContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "../../state/chat";
import { debounce } from "../../lib/utils";
import Avatar from "../ui/AvatarIcon";
import CustomDropdownMenu from "../ui/DropdownMenu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Image as ImageIcon,
  File as FileIcon,
  Music as MusicIcon,
  X as XIcon,
  Send as SendIcon,
  Mic as MicIcon,
  Paperclip as PaperclipIcon,
  FileText as FileTextIcon,
} from "lucide-react";

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

    if (currentData?.pages) {
      const updatedPages = [...currentData.pages];
      if (updatedPages.length > 0) {
        updatedPages[0] = {
          ...updatedPages[0],
          messages: [optimisticMessage, ...(updatedPages[0].messages || [])],
        };
      } else {
        updatedPages[0] = {
          messages: [optimisticMessage],
          pagination: { page: 1, hasMore: false },
        };
      }

      queryClient.setQueryData(["messages", chatId], {
        ...currentData,
        pages: updatedPages,
        pageParams: currentData.pageParams || [],
      });
    } else if (currentData?.messages) {
      queryClient.setQueryData(["messages", chatId], {
        ...currentData,
        messages: [optimisticMessage, ...currentData.messages],
      });
    } else {
      queryClient.setQueryData(["messages", chatId], {
        pages: [
          {
            messages: [optimisticMessage],
            pagination: { page: 1, hasMore: false },
          },
        ],
        pageParams: [1],
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

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setMedia(file);
    setAttachmentType(type);

    if (type === "image") {
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

  const attachmentMenuItems = [
    {
      label: "Photo & Video",
      icon: (
        <ImageIcon
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,video/*";
        input.onchange = (e) => handleFileSelect(e, "image");
        input.click();
      },
    },
    {
      label: "Document",
      icon: (
        <FileTextIcon
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf,.doc,.docx,.txt,.xlsx,.xls,.ppt,.pptx";
        input.onchange = (e) => handleFileSelect(e, "document");
        input.click();
      },
    },
    {
      label: "Audio",
      icon: (
        <MusicIcon
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "audio/*";
        input.onchange = (e) => handleFileSelect(e, "audio");
        input.click();
      },
    },
    {
      label: "Any File",
      icon: (
        <FileIcon
          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        />
      ),
      action: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "*/*";
        input.onchange = (e) => handleFileSelect(e, "file");
        input.click();
      },
    },
  ];

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
          <Button
            variant="ghost"
            size="icon"
            className={`ml-2 rounded-full ${
              isDark ? "hover:bg-gray-600" : "hover:bg-gray-200"
            }`}
            onClick={cancelReply}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </div>
      )}

      {mediaPreview && (
        <div className="mb-3 relative w-32 h-32">
          <img
            src={mediaPreview}
            alt="Upload preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <Button
            variant="secondary"
            size="icon"
            className={`
              absolute top-1 right-1 rounded-full h-6 w-6
              ${isDark ? "bg-gray-800" : "bg-gray-200"}
            `}
            onClick={clearMedia}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end space-x-2">
        <CustomDropdownMenu
          items={attachmentMenuItems}
          buttonIcon={<PaperclipIcon className="h-6 w-6" />}
          buttonClass={`rounded-full p-2 ${
            isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
          }`}
          align="start"
        />

        <div
          className={`
          flex-1 min-h-[40px] max-h-[160px] rounded-lg px-3 py-2
          ${isDark ? "bg-gray-700" : "bg-gray-100"}
        `}
        >
          <textarea
            ref={textareaRef}
            placeholder="Type a message"
            className={`
              w-full min-h-[24px] resize-none border-0 bg-transparent 
              outline-none focus:outline-none focus:ring-0
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
          <Button
            onClick={handleSendMessage}
            disabled={sendMessageMutation.isPending}
            size="icon"
            className={`
              rounded-full
              ${
                isDark
                  ? "bg-teal-600 hover:bg-teal-700"
                  : "bg-teal-500 hover:bg-teal-600"
              }
              ${
                sendMessageMutation.isPending
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={`
              rounded-full
              ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"}
            `}
          >
            <MicIcon className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;

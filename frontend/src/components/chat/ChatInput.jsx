/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Paperclip,
  Send,
  Image as ImageIcon,
  Mic,
  File as FileIcon,
  X,
  Smile,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useSettings } from "../../hooks/useSettings";
import EmojiPicker from "emoji-picker-react";
import { toast } from "react-hot-toast";

const ChatInput = ({
  message,
  setMessage,
  handleSendMessage,
  handleKeyDown,
  handleMessageChange,
  handleSendMedia,
  isSending,
  chatId,
  user,
}) => {
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messageInputRef = useRef(null);
  const sendButtonRef = useRef(null);

  const { typingIndicator } = useSettings();

  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        event.target.id !== "emoji-button"
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onMessageChange = (e) => {
    setMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);

    if (typingIndicator) {
      handleMessageChange(e);
    }
  };

  const onEmojiClick = (emojiObject) => {
    const emoji = emojiObject.emoji;
    const messageStart = message.substring(0, cursorPosition);
    const messageEnd = message.substring(cursorPosition);

    const newText = messageStart + emoji + messageEnd;
    setMessage(newText);

    if (messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current.focus();
        const newPosition = cursorPosition + emoji.length;
        messageInputRef.current.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }, 10);
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is 20MB.`);
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith("image/")) {
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (err) {
        console.error("Error creating preview URL:", err);
      }
    } else {
      setPreviewUrl(null);
    }

    setShowAttachmentOptions(false);
  };

  const handleFileSend = async () => {
    if (!selectedFile) {
      console.error("No file selected");
      return;
    }

    setUploadProgress(0);
    setIsUploading(true);

    const fileType = selectedFile.type.startsWith("image/")
      ? "IMAGE"
      : selectedFile.type.startsWith("audio/")
      ? "AUDIO"
      : "DOCUMENT";

    const simulateProgress = () => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) {
          clearInterval(interval);
          return;
        }
        setUploadProgress(Math.min(progress, 90));
      }, 300);

      return interval;
    };

    const progressInterval = simulateProgress();

    try {
      await handleSendMedia(selectedFile);

      setUploadProgress(100);

      clearSelectedFile();

      toast.success(`${fileType.toLowerCase()} sent successfully`);
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to send file. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setIsUploading(false);
    }
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const triggerFileInput = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleCustomKeyDown = (e) => {
    setCursorPosition(e.target.selectionStart);

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (selectedFile) {
        handleFileSend();
      } else if (message.trim()) {
        handleSendMessage();
      }
    } else if (handleKeyDown) {
      handleKeyDown(e);
    }
  };

  const getFileTypeInfo = () => {
    if (!selectedFile) return { icon: <FileIcon />, label: "File" };

    if (selectedFile.type.startsWith("image/")) {
      return {
        icon: <ImageIcon className="h-6 w-6 text-primary" />,
        label: "Image",
      };
    } else if (selectedFile.type.startsWith("audio/")) {
      return { icon: <Mic className="h-6 w-6 text-primary" />, label: "Audio" };
    } else if (selectedFile.type.startsWith("video/")) {
      return {
        icon: <FileIcon className="h-6 w-6 text-primary" />,
        label: "Video",
      };
    } else {
      return {
        icon: <FileIcon className="h-6 w-6 text-primary" />,
        label: "Document",
      };
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="p-3 border-t border-border bg-background">
      {/* Attachment Preview */}
      {selectedFile && (
        <div className="flex items-start mb-3 bg-accent/30 p-3 rounded-md relative">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              {previewUrl ? (
                <div className="relative h-16 w-16 mr-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded border border-border"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
                      <span className="text-xs text-white font-medium">
                        {uploadProgress.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-16 w-16 flex items-center justify-center bg-accent rounded border border-border mr-3">
                  {getFileTypeInfo().icon}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded">
                      <span className="text-xs text-white font-medium">
                        {uploadProgress.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{selectedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)} •{" "}
                  {getFileTypeInfo().label}
                </div>
                {isUploading && (
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 absolute top-2 right-2"
            onClick={clearSelectedFile}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input Bar */}
      <div className="flex items-center gap-2">
        {/* Attachment Button */}
        <DropdownMenu
          open={showAttachmentOptions}
          onOpenChange={setShowAttachmentOptions}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              disabled={isUploading}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => triggerFileInput(imageInputRef)}
              className="cursor-pointer"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              <span>Image</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => triggerFileInput(audioInputRef)}
              className="cursor-pointer"
            >
              <Mic className="mr-2 h-4 w-4" />
              <span>Audio</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => triggerFileInput(fileInputRef)}
              className="cursor-pointer"
            >
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Document</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Hidden file inputs */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          type="file"
          ref={audioInputRef}
          accept="audio/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Input Field */}
        <div className="flex-1 relative">
          <Input
            ref={messageInputRef}
            value={message}
            onChange={onMessageChange}
            onKeyDown={handleCustomKeyDown}
            placeholder={
              selectedFile
                ? `Add a caption to your ${getFileTypeInfo().label.toLowerCase()}...`
                : "Type a message..."
            }
            className="w-full py-2 pr-10 bg-background"
            disabled={isSending || isUploading}
            onClick={(e) => setCursorPosition(e.target.selectionStart)}
          />

          {/* Emoji button */}
          <button
            id="emoji-button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={toggleEmojiPicker}
            disabled={isSending || isUploading}
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-12 right-0 z-50"
            >
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                searchDisabled={false}
                skinTonesDisabled={false}
                previewConfig={{
                  showPreview: false,
                }}
                width={300}
                height={400}
                theme="auto"
              />
            </div>
          )}
        </div>

        {/* Send Button */}
        {selectedFile ? (
          <Button
            ref={sendButtonRef}
            onClick={handleFileSend}
            disabled={isSending || isUploading}
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            ref={sendButtonRef}
            onClick={handleSendMessage}
            disabled={isSending || isUploading || !message.trim()}
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;

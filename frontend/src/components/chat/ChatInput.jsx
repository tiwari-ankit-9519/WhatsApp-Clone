/* eslint-disable no-unused-vars */
import { useState, useRef } from "react";
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

const ChatInput = ({
  message,
  setMessage,
  handleSendMessage,
  handleKeyDown,
  handleMessageChange,
  handleSendMedia,
  isSending,
}) => {
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const audioInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleFileSend = () => {
    if (selectedFile) {
      handleSendMedia(selectedFile);
      clearSelectedFile();
    }
  };

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (audioInputRef.current) audioInputRef.current.value = "";
  };

  const triggerFileInput = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="p-3 border-t border-border bg-background">
      {selectedFile && (
        <div className="flex items-start mb-3 bg-accent/30 p-2 rounded-md">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded border border-border mr-3"
                />
              ) : (
                <div className="h-16 w-16 flex items-center justify-center bg-accent rounded border border-border mr-3">
                  {selectedFile.type.startsWith("audio/") ? (
                    <Mic className="h-6 w-6 text-primary" />
                  ) : (
                    <FileIcon className="h-6 w-6 text-primary" />
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{selectedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={clearSelectedFile}
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
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => triggerFileInput(audioInputRef)}
              className="cursor-pointer"
            >
              <Mic className="mr-2 h-4 w-4" />
              <span>Audio</span>
              <input
                type="file"
                ref={audioInputRef}
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => triggerFileInput(fileInputRef)}
              className="cursor-pointer"
            >
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Document</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Input Field */}
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full py-2 pr-10 bg-background"
            disabled={isSending}
          />
          <button
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              /* Add emoji picker here if needed */
            }}
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        {/* Send Button */}
        {selectedFile ? (
          <Button
            onClick={handleFileSend}
            disabled={isSending}
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={handleSendMessage}
            disabled={isSending || !message.trim()}
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

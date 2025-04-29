import { useState, useCallback, useRef } from "react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useMessages } from "../../hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import MessageAttachments from "./MessageAttachments";
import { formatDistanceToNow } from "date-fns";
import {
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Star,
  Trash2,
  Forward,
} from "lucide-react";

const MessageItem = ({ message, isOwn, showSender, previousMessage, chat }) => {
  const { user } = useAuthContext();
  const { deleteMessage, reactToMessage, starMessage } = useMessages(
    message.chatId
  );
  const [showActions, setShowActions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Check if this message should show sender info (for grouping UI)
  const shouldShowSender = useCallback(() => {
    if (!showSender) return false;
    if (!previousMessage) return true;

    return previousMessage.senderId !== message.senderId;
  }, [showSender, previousMessage, message.senderId]);

  // Get sender from chat users
  const getSender = useCallback(() => {
    if (isOwn) return user;

    const sender = chat.users.find((u) => u.user.id === message.senderId)?.user;
    return sender || { name: "Unknown", profilePic: null };
  }, [isOwn, user, chat.users, message.senderId]);

  const sender = getSender();

  // Get message status icon
  const getStatusIcon = useCallback(() => {
    if (!isOwn) return null;

    const status = message.statuses?.find((s) => s.userId !== user.id)?.status;

    if (!status || status === "SENT") {
      return <Check className="h-3 w-3 text-muted-foreground" />;
    } else if (status === "DELIVERED") {
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    } else if (status === "READ") {
      return <CheckCheck className="h-3 w-3 text-primary" />;
    }

    return null;
  }, [isOwn, message.statuses, user.id]);

  // Get content based on message type
  const renderContent = useCallback(() => {
    switch (message.type) {
      case "IMAGE":
      case "VIDEO":
      case "AUDIO":
      case "DOCUMENT":
        return <MessageAttachments message={message} />;
      case "TEXT":
      default:
        return <p className="whitespace-pre-wrap">{message.content}</p>;
    }
  }, [message]);

  const handleDelete = () => {
    deleteMessage({
      messageId: message.id,
      deleteType: "FOR_ME",
    });
    setDropdownOpen(false);
  };

  const handleReaction = (emoji) => {
    reactToMessage({
      messageId: message.id,
      emoji,
    });
    setDropdownOpen(false);
  };

  const handleStarMessage = () => {
    starMessage({
      messageId: message.id,
    });
    setDropdownOpen(false);
  };

  // Track dropdown open state
  const handleOpenChange = (open) => {
    setDropdownOpen(open);
  };

  return (
    <div
      className={`flex mb-2 ${isOwn ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        if (!dropdownOpen) {
          setShowActions(false);
        }
      }}
    >
      <div
        className={`flex ${
          isOwn ? "flex-row-reverse" : "flex-row"
        } max-w-[80%]`}
      >
        {/* Avatar - only shown for non-own messages in groups when needed */}
        {showSender && !isOwn && shouldShowSender() && (
          <Avatar className="h-8 w-8 mt-1 mx-2">
            <AvatarImage src={sender.profilePic} alt={sender.name} />
            <AvatarFallback>
              {sender.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message content */}
        <div
          className={`relative group ${
            isOwn
              ? "ml-12"
              : showSender
              ? shouldShowSender()
                ? ""
                : "ml-12"
              : ""
          }`}
        >
          {/* Sender name for group chats */}
          {showSender && !isOwn && shouldShowSender() && (
            <div className="text-xs font-medium text-primary mb-1 ml-1">
              {sender.name}
            </div>
          )}

          <div
            className={`rounded-lg px-3 py-2 ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-card border border-border rounded-tl-none"
            }`}
          >
            {/* Message body */}
            {renderContent()}

            {/* Time and status */}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[10px] opacity-70">
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: false,
                })}
              </span>
              {getStatusIcon()}
            </div>
          </div>

          {/* Message actions */}
          {showActions && (
            <div
              className={`absolute top-0 ${
                isOwn
                  ? "left-0 -translate-x-full pl-1"
                  : "right-0 translate-x-full pr-1"
              }`}
            >
              <DropdownMenu onOpenChange={handleOpenChange} open={dropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={dropdownRef}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-background border border-border shadow-sm"
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isOwn ? "end" : "start"}>
                  <DropdownMenuItem onClick={() => handleReaction("👍")}>
                    👍 Like
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleReaction("❤️")}>
                    ❤️ Love
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleReaction("😂")}>
                    😂 Laugh
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStarMessage}>
                    <Star className="mr-2 h-4 w-4" />
                    <span>Star message</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDropdownOpen(false)}>
                    <Reply className="mr-2 h-4 w-4" />
                    <span>Reply</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDropdownOpen(false)}>
                    <Forward className="mr-2 h-4 w-4" />
                    <span>Forward</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

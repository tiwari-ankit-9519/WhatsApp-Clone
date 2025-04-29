import { useState, useCallback, useRef, useEffect } from "react";
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
  AlertCircle,
} from "lucide-react";

const MessageItem = ({ message, isOwn, showSender, previousMessage, chat }) => {
  const { user } = useAuthContext();
  const { deleteMessage, reactToMessage, starMessage } = useMessages(
    message.chatId
  );
  const [showActions, setShowActions] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  const [isStarring, setIsStarring] = useState(false);
  const [optimisticReaction, setOptimisticReaction] = useState(null);
  const [optimisticStarred, setOptimisticStarred] = useState(false);
  const dropdownRef = useRef(null);

  // Optimistic reaction effect
  useEffect(() => {
    return () => {
      // Cleanup effect
      setOptimisticReaction(null);
      setOptimisticStarred(false);
    };
  }, []);

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

    // For optimistic messages
    if (message.isOptimistic) {
      return <Check className="h-3 w-3 text-muted-foreground" />;
    }

    const status = message.statuses?.find((s) => s.userId !== user.id)?.status;

    if (!status || status === "SENT") {
      return <Check className="h-3 w-3 text-muted-foreground" />;
    } else if (status === "DELIVERED") {
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    } else if (status === "READ") {
      return <CheckCheck className="h-3 w-3 text-primary" />;
    }

    return null;
  }, [isOwn, message.statuses, message.isOptimistic, user.id]);

  // Get content based on message type
  const renderContent = useCallback(() => {
    if (isDeleting) {
      return (
        <p className="text-muted-foreground italic">Deleting message...</p>
      );
    }

    if (message.deleted) {
      return (
        <p className="text-muted-foreground italic">This message was deleted</p>
      );
    }

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
  }, [message, isDeleting]);

  // Check if user has reacted with this emoji already
  const hasReacted = (emoji) => {
    if (optimisticReaction === emoji) return true;

    return message.reactions?.some(
      (reaction) => reaction.userId === user.id && reaction.emoji === emoji
    );
  };

  const handleDelete = () => {
    // Set deleting state for UI feedback
    setIsDeleting(true);
    setDropdownOpen(false);

    deleteMessage({
      messageId: message.id,
      deleteType: "FOR_ME",
    }).finally(() => {
      setIsDeleting(false);
    });
  };

  const handleReaction = (emoji) => {
    setDropdownOpen(false);

    // Remove reaction if already reacted with this emoji
    if (hasReacted(emoji)) {
      // Remove optimistic reaction
      setOptimisticReaction(null);
      // Handle API call to remove reaction
      setIsReacting(true);
      reactToMessage({
        messageId: message.id,
        emoji: null, // Signal to remove emoji
        previousEmoji: emoji,
      }).finally(() => {
        setIsReacting(false);
      });
    } else {
      // Set optimistic reaction
      setOptimisticReaction(emoji);
      // Handle API call
      setIsReacting(true);
      reactToMessage({
        messageId: message.id,
        emoji,
      }).finally(() => {
        setIsReacting(false);
      });
    }
  };

  const handleStarMessage = () => {
    setDropdownOpen(false);

    // Set optimistic starred state
    setOptimisticStarred(true);
    setIsStarring(true);

    starMessage({
      messageId: message.id,
    }).finally(() => {
      setIsStarring(false);
    });
  };

  // Track dropdown open state
  const handleOpenChange = (open) => {
    setDropdownOpen(open);
  };

  // Calculate opacity for message based on status
  const messageOpacity = message.isOptimistic
    ? "opacity-70"
    : isDeleting
    ? "opacity-50"
    : "";

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
            className={`rounded-lg px-3 py-2 ${messageOpacity} ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-card border border-border rounded-tl-none"
            }`}
          >
            {/* Message body */}
            {renderContent()}

            {/* Message reactions display */}
            {(message.reactions?.length > 0 || optimisticReaction) && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {optimisticReaction && !hasReacted(optimisticReaction) && (
                  <div
                    className="bg-accent/50 rounded-full py-0.5 px-2 text-xs animate-pulse"
                    key="optimistic-reaction"
                  >
                    {optimisticReaction} 1
                  </div>
                )}

                {message.reactions &&
                  message.reactions
                    .reduce((acc, reaction) => {
                      // Skip if this is the optimistic reaction we're removing
                      if (
                        reaction.userId === user.id &&
                        reaction.emoji === optimisticReaction &&
                        !hasReacted(optimisticReaction)
                      ) {
                        return acc;
                      }

                      const existing = acc.find(
                        (r) => r.emoji === reaction.emoji
                      );
                      if (existing) {
                        existing.count += 1;
                      } else {
                        acc.push({ emoji: reaction.emoji, count: 1 });
                      }
                      return acc;
                    }, [])
                    .map((reaction) => (
                      <div
                        className="bg-accent/50 rounded-full py-0.5 px-2 text-xs"
                        key={reaction.emoji}
                      >
                        {reaction.emoji} {reaction.count}
                      </div>
                    ))}
              </div>
            )}

            {/* Time and status */}
            <div className="flex items-center justify-end gap-1 mt-1">
              {optimisticStarred && (
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 mr-1" />
              )}
              <span className="text-[10px] opacity-70">
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: false,
                })}
              </span>
              {getStatusIcon()}
              {message.isOptimistic && (
                <span className="text-[8px] ml-1 text-muted-foreground">
                  sending...
                </span>
              )}
            </div>
          </div>

          {/* Message actions */}
          {showActions && !isDeleting && !message.deleted && (
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
                  <DropdownMenuItem
                    onClick={() => handleReaction("👍")}
                    className={hasReacted("👍") ? "bg-accent/30" : ""}
                    disabled={isReacting}
                  >
                    👍 {hasReacted("👍") ? "Remove Like" : "Like"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleReaction("❤️")}
                    className={hasReacted("❤️") ? "bg-accent/30" : ""}
                    disabled={isReacting}
                  >
                    ❤️ {hasReacted("❤️") ? "Remove Love" : "Love"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleReaction("😂")}
                    className={hasReacted("😂") ? "bg-accent/30" : ""}
                    disabled={isReacting}
                  >
                    😂 {hasReacted("😂") ? "Remove Laugh" : "Laugh"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleStarMessage}
                    disabled={isStarring || optimisticStarred}
                  >
                    {isStarring || optimisticStarred ? (
                      <div className="flex items-center">
                        <Star className="mr-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>Starred</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Star className="mr-2 h-4 w-4" />
                        <span>Star message</span>
                      </div>
                    )}
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
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <div className="flex items-center">
                        <div className="animate-spin h-4 w-4 border-2 border-destructive border-t-transparent rounded-full mr-2"></div>
                        <span>Deleting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </div>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Error indicator for failed messages */}
          {message.error && (
            <div className="absolute -bottom-6 right-0">
              <div className="flex items-center text-destructive text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                <span>Failed to send</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-5 ml-1 px-1 text-primary"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;

import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

const ChatList = ({ chats, currentChatId, onChatSelect }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  // Handle empty chats array
  if (!chats || chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-8 h-8 text-primary"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
        <p className="text-muted-foreground text-center">
          No chats yet. Find contacts to start chatting.
        </p>
      </div>
    );
  }

  // Function to get chat details based on type
  const getChatDetails = (chat) => {
    if (chat.type === "GROUP") {
      return {
        name: chat.name,
        image: chat.image,
        lastMessage: chat.messages?.[0]?.content || "No messages yet",
        time: chat.messages?.[0]?.createdAt,
        unreadCount: chat.unreadCount || 0,
      };
    } else {
      const otherUser = chat.users.find((u) => u.user.id !== user?.id)?.user;
      return {
        name: otherUser?.name || "User",
        image: otherUser?.profilePic,
        lastMessage: chat.messages?.[0]?.content || "No messages yet",
        time: chat.messages?.[0]?.createdAt,
        unreadCount: chat.unreadCount || 0,
      };
    }
  };

  // Handle chat selection
  const handleChatClick = (chatId) => {
    if (onChatSelect) {
      onChatSelect(chatId);
    } else {
      navigate(`/chats/${chatId}`);
    }
  };

  return (
    <div className="divide-y divide-border">
      {chats.map((chat) => {
        const { name, image, lastMessage, time, unreadCount } =
          getChatDetails(chat);

        // Format time display
        const timeDisplay = time
          ? new Date(time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        // Determine message content display based on message type
        let messageContent = lastMessage;
        if (chat.messages?.[0]?.type === "IMAGE") {
          messageContent = "📷 Image";
        } else if (chat.messages?.[0]?.type === "AUDIO") {
          messageContent = "🎵 Audio";
        } else if (chat.messages?.[0]?.type === "DOCUMENT") {
          messageContent = "📎 Document";
        }

        return (
          <div
            key={chat.id}
            className={`p-3 hover:bg-accent/50 cursor-pointer ${
              chat.id === currentChatId ? "bg-accent" : ""
            }`}
            onClick={() => handleChatClick(chat.id)}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback>
                  {name.charAt(0).toUpperCase() ||
                    (chat.type === "GROUP" ? "G" : "U")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate">{name}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeDisplay}
                  </span>
                </div>

                <div className="flex justify-between mt-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {messageContent}
                  </p>

                  {unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 flex items-center justify-center min-w-[20px] h-5">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;

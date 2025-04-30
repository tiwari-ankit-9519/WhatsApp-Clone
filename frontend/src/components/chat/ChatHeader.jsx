import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ArrowLeft, MoreVertical, Info } from "lucide-react";

const ChatHeader = ({ chat, user, onBack }) => {
  const navigate = useNavigate();

  // Get chat info based on chat type
  const getChatInfo = () => {
    if (!chat) return { name: "", image: null, isOnline: false, status: "" };

    if (chat.type === "GROUP") {
      return {
        name: chat.name,
        image: chat.image,
        isOnline: false,
        status: `${chat.users?.length || 0} participants`,
      };
    } else {
      const otherUser = chat.users?.find((u) => u.user.id !== user?.id)?.user;

      // Check if the user is online directly from the user object
      const isOnline = otherUser?.online || false;

      return {
        name: otherUser?.name || "User",
        image: otherUser?.profilePic,
        isOnline: isOnline,
        status: isOnline ? "Online" : "Offline",
      };
    }
  };

  const { name, image, isOnline, status } = getChatInfo();

  return (
    <div className="p-4 border-b border-border flex items-center justify-between bg-background shadow-sm">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-3 md:hidden"
          onClick={onBack || (() => navigate("/chats"))}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{name.charAt(0).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>

        <div>
          <h3 className="font-medium text-foreground">{name}</h3>
          <div className="flex items-center text-xs text-muted-foreground">
            {isOnline && chat.type !== "GROUP" && (
              <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></span>
            )}
            {status}
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/chats/${chat.id}/info`)}
            >
              <Info className="mr-2 h-4 w-4" />
              <span>View info</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Clear chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;

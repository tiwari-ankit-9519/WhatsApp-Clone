import { useNavigate } from "react-router-dom";
import { useContacts } from "../../hooks/useContacts";
import { useChats } from "../../hooks/useChats";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { formatDistanceToNow } from "date-fns";
import { UserCheck, UserX, MoreVertical, MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const ContactItem = ({ contact, isPending = false }) => {
  const navigate = useNavigate();
  const { acceptRequest, rejectRequest, blockContact } = useContacts();
  const { getOrCreatePrivateChat } = useChats();

  const contactUser = isPending ? contact.sender : contact.receiver;

  const handleStartChat = async () => {
    try {
      const chat = await getOrCreatePrivateChat(contactUser.id);
      navigate(`/chats/${chat.id}`);
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleAcceptRequest = (e) => {
    e.stopPropagation();
    acceptRequest(contact.id);
  };

  const handleRejectRequest = (e) => {
    e.stopPropagation();
    rejectRequest(contact.id);
  };

  const handleBlockUser = (e) => {
    e.stopPropagation();
    blockContact(contactUser.id);
  };

  return (
    <div
      className="p-3 flex items-center gap-3 hover:bg-accent/50 cursor-pointer"
      onClick={isPending ? undefined : handleStartChat}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage src={contactUser.profilePic} alt={contactUser.name} />
        <AvatarFallback>
          {contactUser.name?.charAt(0).toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between">
          <span className="font-medium truncate">{contactUser.name}</span>
          {contact.createdAt && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(contact.createdAt), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>

        <div className="flex items-center text-sm text-muted-foreground truncate">
          {contactUser.email}
        </div>
      </div>

      {isPending ? (
        <div className="flex gap-2">
          <Button size="sm" className="h-8 px-2" onClick={handleAcceptRequest}>
            <UserCheck className="h-4 w-4 mr-1" />
            Accept
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2"
            onClick={handleRejectRequest}
          >
            <UserX className="h-4 w-4 mr-1" />
            Reject
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={handleStartChat}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleBlockUser}
                className="text-destructive"
              >
                <UserX className="h-4 w-4 mr-2" />
                Block Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default ContactItem;

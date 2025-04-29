import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useChats } from "../../hooks/useChats";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  Users,
  X,
  Upload,
  Check,
  Bell,
  BellOff,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function ChatInfo() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { useChatDetails } = useChats();

  const { chat, isLoading } = useChatDetails(chatId);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [muted, setMuted] = useState(false);
  const [chatName, setChatName] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const fileInputRef = useRef(null);

  // Initialize chat name when chat is loaded
  useState(() => {
    if (chat && chat.type === "GROUP") {
      setChatName(chat.name || "");
    }
  }, [chat]);

  // Handle file selection for group image
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing selected group image
  const handleRemoveImage = () => {
    setGroupImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle form submission to update group info
  const handleSubmit = (e) => {
    e.preventDefault();
    // Implement group info update logic here
    // This would update the chat name and image
    setIsEditing(false);
  };

  // Handle canceling edit mode
  const handleCancel = () => {
    setIsEditing(false);
    setGroupImage(null);
    setPreviewUrl(null);
    if (chat && chat.type === "GROUP") {
      setChatName(chat.name || "");
    }
  };

  // Handle deleting chat
  const handleDeleteChat = () => {
    // Implement delete chat logic here
    setShowDeleteConfirm(false);
    navigate("/chats");
  };

  // Handle leaving group
  const handleLeaveGroup = () => {
    // Implement leave group logic here
    setShowLeaveConfirm(false);
    navigate("/chats");
  };

  // Get chat info based on type (group or private)
  const getChatInfo = () => {
    if (!chat) return { name: "", image: null, status: "" };

    if (chat.type === "GROUP") {
      return {
        name: chat.name,
        image: chat.image,
        status: `${chat.users.length} participants`,
      };
    } else {
      const otherUser = chat.users.find((u) => u.user.id !== user?.id)?.user;
      return {
        name: otherUser?.name || "User",
        image: otherUser?.profilePic,
        status: otherUser?.online
          ? "Online"
          : otherUser?.lastSeen
          ? `Last seen ${formatDistanceToNow(new Date(otherUser.lastSeen), {
              addSuffix: true,
            })}`
          : "Offline",
      };
    }
  };

  const { name, image, status } = getChatInfo();

  // Show loading state
  if (isLoading || !chat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(`/chats/${chatId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg">Chat Info</h2>
        </div>
        {chat.type === "GROUP" && !isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        ) : (
          isEditing && (
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Chat/Contact Image and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24">
                {previewUrl ? (
                  <AvatarImage src={previewUrl} alt={name} />
                ) : (
                  <>
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback className="text-2xl">
                      {name?.charAt(0).toUpperCase() ||
                        (chat.type === "GROUP" ? "G" : "U")}
                    </AvatarFallback>
                  </>
                )}
              </Avatar>

              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {isEditing && previewUrl && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 mb-4"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4 mr-2" />
                Remove
              </Button>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="w-full max-w-xs">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      value={chatName}
                      onChange={(e) => setChatName(e.target.value)}
                      className="text-center"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Check className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-xl font-semibold">{name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{status}</p>
              </>
            )}
          </div>

          {/* Chat Actions */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setMuted(!muted)}
            >
              {muted ? (
                <>
                  <BellOff className="h-4 w-4 mr-3" />
                  Unmute Notifications
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-3" />
                  Mute Notifications
                </>
              )}
            </Button>

            {chat.type === "GROUP" && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/chats/${chatId}/members`)}
              >
                <Users className="h-4 w-4 mr-3" />
                Group Participants ({chat.users.length})
              </Button>
            )}

            {chat.type === "GROUP" && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/chats/${chatId}/add-members`)}
              >
                <UserPlus className="h-4 w-4 mr-3" />
                Add Participants
              </Button>
            )}
          </div>

          {/* Participants (for group chats) */}
          {chat.type === "GROUP" && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Participants • {chat.users.length}
              </h3>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chat.users.map(({ user: participant, role }) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={participant.profilePic}
                          alt={participant.name}
                        />
                        <AvatarFallback>
                          {participant.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-medium">
                          {participant.id === user?.id
                            ? `${participant.name} (You)`
                            : participant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {role === "ADMIN" ? "Admin" : "Member"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-destructive mb-3">
              Danger Zone
            </h3>

            <div className="space-y-3">
              {chat.type === "GROUP" ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive border-destructive/30"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-3" />
                    Leave Group
                  </Button>

                  {/* Only show delete option for admins */}
                  {chat.users.some(
                    ({ user: u, role }) => u.id === user?.id && role === "ADMIN"
                  ) && (
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      Delete Group
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-3" />
                  Delete Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Chat Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {chat.type === "GROUP" ? "Delete Group?" : "Delete Chat?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {chat.type === "GROUP"
                ? "This will delete the group for all participants and cannot be undone."
                : "This will delete all messages in this chat and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Group Confirmation */}
      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will no longer receive messages from this group and will need
              an invitation to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveGroup}>
              Leave Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ChatInfo;

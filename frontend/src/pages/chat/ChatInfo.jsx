/* eslint-disable no-unused-vars */
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
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
import { Card, CardContent } from "../../components/ui/card";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  UserPlus,
  Users,
  X,
  Upload,
  Check,
  Bell,
  BellOff,
  BadgeCheck,
  Mail,
  UserCircle,
  Calendar,
  Phone,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";

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
  useEffect(() => {
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
    toast.success("Group info updated successfully");
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

  // Handle muting notifications
  const handleMuteToggle = () => {
    setMuted(!muted);
    toast.success(muted ? "Notifications unmuted" : "Notifications muted");
  };

  // Handle deleting chat
  const handleDeleteChat = () => {
    // Implement delete chat logic here
    toast.success(chat.type === "GROUP" ? "Group deleted" : "Chat deleted");
    setShowDeleteConfirm(false);
    navigate("/chats");
  };

  // Handle leaving group
  const handleLeaveGroup = () => {
    // Implement leave group logic here
    toast.success("You left the group");
    setShowLeaveConfirm(false);
    navigate("/chats");
  };

  // Format date in a readable way
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    try {
      return format(new Date(dateString), "PPP");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Get chat info based on type (group or private)
  const getChatInfo = () => {
    if (!chat)
      return {
        name: "",
        image: null,
        status: "",
        user: null,
        isGroup: false,
        createdAt: null,
      };

    if (chat.type === "GROUP") {
      return {
        name: chat.name,
        image: chat.image,
        status: `${chat.users?.length || 0} participants`,
        user: null,
        isGroup: true,
        createdAt: chat.createdAt,
      };
    } else {
      const otherUser = chat.users?.find((u) => u.user.id !== user?.id)?.user;
      const lastSeen = otherUser?.lastSeen
        ? formatDistanceToNow(new Date(otherUser.lastSeen), { addSuffix: true })
        : "a while ago";

      return {
        name: otherUser?.name || "User",
        image: otherUser?.profilePic,
        status: otherUser?.online ? "Online" : `Last seen ${lastSeen}`,
        user: otherUser,
        isGroup: false,
        createdAt: chat.createdAt,
      };
    }
  };

  const {
    name,
    image,
    status,
    user: otherUser,
    isGroup,
    createdAt,
  } = getChatInfo();

  // Check if user is admin (for group chats)
  const isAdmin =
    chat?.type === "GROUP" &&
    chat.users?.some(
      ({ user: u, role }) => u.id === user?.id && role === "ADMIN"
    );

  // Get admin list for group chats
  const admins =
    chat?.type === "GROUP"
      ? chat.users
          ?.filter(({ role }) => role === "ADMIN")
          .map(({ user: u }) => u)
      : [];

  // Show loading state
  if (isLoading || !chat) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3"
            onClick={() => navigate(`/chats/${chatId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-xl">Chat Info</h2>
        </div>
        {chat.type === "GROUP" && !isEditing && isAdmin ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
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
          {/* Chat/Contact Profile Section */}
          <div className="flex flex-col items-center mb-8">
            {isEditing ? (
              <div className="relative mb-6">
                <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-primary/20 shadow-xl">
                  {previewUrl ? (
                    <AvatarImage src={previewUrl} alt={chatName} />
                  ) : (
                    <>
                      <AvatarImage src={image} alt={chatName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                        {chatName?.charAt(0).toUpperCase() || "G"}
                      </AvatarFallback>
                    </>
                  )}
                </Avatar>

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
                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 mb-6 ring-4 ring-primary/20 shadow-xl">
                <AvatarImage src={image} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                  {name?.charAt(0).toUpperCase() || (isGroup ? "G" : "U")}
                </AvatarFallback>
              </Avatar>
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
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{name}</h2>
                <p className="text-sm text-muted-foreground">{status}</p>

                {isGroup && (
                  <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Group
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Details - Only for private chats */}
          {!isGroup && otherUser && (
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  <div className="p-4 flex items-center">
                    <Mail className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Email</h4>
                      <p className="text-sm text-muted-foreground">
                        {otherUser.email || "Not available"}
                      </p>
                    </div>
                  </div>

                  {otherUser.phone && (
                    <div className="p-4 flex items-center">
                      <Phone className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Phone</h4>
                        <p className="text-sm text-muted-foreground">
                          {otherUser.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {otherUser.bio && (
                    <div className="p-4 flex items-start">
                      <UserCircle className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Bio</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {otherUser.bio}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 flex items-center">
                    <Calendar className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Joined</h4>
                      <p className="text-sm text-muted-foreground">
                        {otherUser.createdAt
                          ? formatDate(otherUser.createdAt)
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Group Info - Only for group chats */}
          {isGroup && (
            <Card className="mb-6 overflow-hidden">
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {chat.description && (
                    <div className="p-4 flex items-start">
                      <UserCircle className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {chat.description}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="p-4 flex items-center">
                    <Shield className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Created by</h4>
                      <p className="text-sm text-muted-foreground">
                        {chat.createdBy?.name || "Unknown"}
                        {chat.createdBy?.id === user?.id && " (You)"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex items-center">
                    <Calendar className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">Created on</h4>
                      <p className="text-sm text-muted-foreground">
                        {createdAt ? formatDate(createdAt) : "Unknown"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat Actions */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full justify-start p-3 h-auto"
              onClick={handleMuteToggle}
            >
              {muted ? (
                <>
                  <BellOff className="h-5 w-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Unmute Notifications</span>
                    <span className="text-xs text-muted-foreground">
                      Currently muted
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Mute Notifications</span>
                    <span className="text-xs text-muted-foreground">
                      Receive notifications for new messages
                    </span>
                  </div>
                </>
              )}
            </Button>

            {chat.type === "GROUP" && (
              <>
                <Button
                  variant="outline"
                  className="w-full justify-start p-3 h-auto"
                  onClick={() => navigate(`/chats/${chatId}/members`)}
                >
                  <Users className="h-5 w-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Group Participants</span>
                    <span className="text-xs text-muted-foreground">
                      {chat.users?.length || 0} members
                    </span>
                  </div>
                </Button>

                {isAdmin && (
                  <Button
                    variant="outline"
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => navigate(`/chats/${chatId}/add-members`)}
                  >
                    <UserPlus className="h-5 w-5 mr-3" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Add Participants</span>
                      <span className="text-xs text-muted-foreground">
                        Invite more people to this group
                      </span>
                    </div>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Participants (for group chats) */}
          {chat.type === "GROUP" && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-primary uppercase tracking-wider">
                  Participants
                </h3>
                <span className="text-xs text-muted-foreground">
                  {chat.users?.length || 0} members
                </span>
              </div>

              <div className="space-y-1 max-h-80 overflow-y-auto rounded-lg border border-border">
                {/* Group admins section */}
                {admins?.length > 0 && (
                  <div className="p-2 bg-muted/30">
                    <h4 className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Admins ({admins.length})
                    </h4>
                    <div className="space-y-1">
                      {admins.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-accent/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={admin.profilePic}
                                alt={admin.name}
                              />
                              <AvatarFallback>
                                {admin.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <div className="flex items-center gap-1">
                                <p className="font-medium">
                                  {admin.id === user?.id
                                    ? `${admin.name} (You)`
                                    : admin.name}
                                </p>
                                <BadgeCheck className="h-4 w-4 text-primary" />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Admin
                              </p>
                            </div>
                          </div>

                          {admin.online && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Online
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular members section */}
                <div className="p-2">
                  {admins?.length > 0 && (
                    <h4 className="px-2 py-1 text-xs font-medium text-muted-foreground">
                      Members (
                      {(chat.users?.length || 0) - (admins?.length || 0)})
                    </h4>
                  )}

                  <div className="space-y-1">
                    {chat.users
                      ?.filter(({ user: member, role }) => role !== "ADMIN")
                      .map(({ user: member }) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-accent/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={member.profilePic}
                                alt={member.name}
                              />
                              <AvatarFallback>
                                {member.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div>
                              <p className="font-medium">
                                {member.id === user?.id
                                  ? `${member.name} (You)`
                                  : member.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Member
                              </p>
                            </div>
                          </div>

                          {member.online && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Online
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-destructive mb-4 uppercase tracking-wider">
              Danger Zone
            </h3>

            <div className="space-y-3">
              {chat.type === "GROUP" ? (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start p-3 h-auto border-destructive/30 hover:bg-destructive/10"
                    onClick={() => setShowLeaveConfirm(true)}
                  >
                    <X className="h-5 w-5 mr-3 text-destructive" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-destructive">
                        Leave Group
                      </span>
                      <span className="text-xs text-muted-foreground">
                        You will no longer receive messages from this group
                      </span>
                    </div>
                  </Button>

                  {/* Only show delete option for admins */}
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      className="w-full justify-start p-3 h-auto"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-5 w-5 mr-3" />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">Delete Group</span>
                        <span className="text-xs text-destructive-foreground/80">
                          This action cannot be undone
                        </span>
                      </div>
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="destructive"
                  className="w-full justify-start p-3 h-auto"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-5 w-5 mr-3" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Delete Chat</span>
                    <span className="text-xs text-destructive-foreground/80">
                      This will delete all messages in this chat
                    </span>
                  </div>
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotification";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MessageSquare, UserPlus, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useContacts } from "@/hooks/useContacts";

const NotificationsPopover = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const {
    notifications,
    messageCount,
    contactRequestCount,
    clearChatNotifications,
  } = useNotifications();

  const { pendingRequests, acceptRequest, rejectRequest } = useContacts();

  const togglePopover = () => {
    setIsOpen(!isOpen);
  };

  const handleChatClick = (chatId) => {
    clearChatNotifications(chatId);
    navigate(`/chats/${chatId}`);
    setIsOpen(false);
  };

  const handleAcceptRequest = (contactId) => {
    acceptRequest(contactId);
  };

  const handleRejectRequest = (contactId) => {
    rejectRequest(contactId);
  };

  return (
    <div className="relative">
      <div onClick={togglePopover}>{children}</div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute -right-16 z-50 mt-2 w-80 rounded-md shadow-lg bg-card border border-border">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold">Notifications</h3>
            </div>

            <Tabs defaultValue="messages">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="messages" className="relative">
                  Messages
                  {messageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {messageCount > 99 ? "99+" : messageCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="contacts" className="relative">
                  Contacts
                  {contactRequestCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {contactRequestCount > 99 ? "99+" : contactRequestCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Message Notifications Tab */}
              <TabsContent
                value="messages"
                className="max-h-80 overflow-y-auto"
              >
                {notifications?.length > 0 ? (
                  <div className="divide-y divide-border">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-3 hover:bg-accent cursor-pointer"
                        onClick={() => handleChatClick(notification.chat.id)}
                      >
                        <div className="flex items-start gap-3">
                          {notification.chat.type === "GROUP" ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={notification.chat.image}
                                alt={notification.chat.name}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {notification.chat.name
                                  ?.charAt(0)
                                  .toUpperCase() || "G"}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={
                                  notification.chat.users[0]?.user.profilePic
                                }
                                alt={notification.chat.users[0]?.user.name}
                              />
                              <AvatarFallback>
                                {notification.chat.users[0]?.user.name
                                  ?.charAt(0)
                                  .toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">
                                {notification.chat.type === "GROUP"
                                  ? notification.chat.name
                                  : notification.chat.users[0]?.user.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {notification.updatedAt &&
                                  formatDistanceToNow(
                                    new Date(notification.updatedAt),
                                    { addSuffix: true }
                                  )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              <span className="truncate">
                                {notification.unreadCount} new{" "}
                                {notification.unreadCount === 1
                                  ? "message"
                                  : "messages"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No new message notifications</p>
                  </div>
                )}
              </TabsContent>

              {/* Contact Request Notifications Tab */}
              <TabsContent
                value="contacts"
                className="max-h-80 overflow-y-auto"
              >
                {pendingRequests?.length > 0 ? (
                  <div className="divide-y divide-border">
                    {pendingRequests.map((request) => (
                      <div key={request.id} className="p-3">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={request.sender.profilePic}
                              alt={request.sender.name}
                            />
                            <AvatarFallback>
                              {request.sender.name?.charAt(0).toUpperCase() ||
                                "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium truncate">
                                {request.sender.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {request.createdAt &&
                                  formatDistanceToNow(
                                    new Date(request.createdAt),
                                    { addSuffix: true }
                                  )}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <UserPlus className="h-3 w-3" />
                              <span className="truncate">Contact request</span>
                            </div>

                            <div className="flex gap-2 mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptRequest(request.id);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Accept
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectRequest(request.id);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 py-1 px-2 text-xs font-medium rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending contact requests</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsPopover;

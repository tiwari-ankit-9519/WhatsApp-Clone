/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSocketContext } from "../../contexts/SocketContext";
import { useChats } from "../../hooks/useChats";
import { useContacts } from "../../hooks/useContacts";
import { useNotifications } from "../../hooks/useNotification";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  MessageSquare,
  Users,
  Bell,
  Search,
  UserPlus,
  X,
  Menu,
  LogOut,
  Settings,
  User,
  Plus,
} from "lucide-react";

function Sidebar({ isMobileOpen, closeMobileSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const { isConnected } = useSocketContext();
  const { chats, isChatsLoading, createGroupChat, getOrCreatePrivateChat } =
    useChats();
  const {
    contacts,
    pendingRequests,
    searchUsers,
    acceptRequest,
    rejectRequest,
  } = useContacts();
  const { totalCount: notificationCount, messageCount } = useNotifications();

  // UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [startingChatWithId, setStartingChatWithId] = useState(null);

  const currentChatId = location.pathname.startsWith("/chats/")
    ? location.pathname.split("/chats/")[1]
    : null;

  // Search functionality
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, searchUsers]);

  // Group chat creation
  const handleCreateGroup = () => {
    if (groupName.trim() && selectedContacts.length > 0) {
      createGroupChat({
        name: groupName.trim(),
        participantsIds: selectedContacts.map((contact) => contact.id),
      });
      setGroupName("");
      setSelectedContacts([]);
      setIsCreatingGroup(false);
    }
  };

  // Logout functionality
  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  // Navigation
  const navigateToProfile = () => {
    navigate("/profile");
    closeMobileSidebar();
  };

  const navigateToSettings = () => {
    navigate("/settings");
    closeMobileSidebar();
  };

  // Contact request handlers
  const handleAcceptRequest = (contactId) => {
    acceptRequest(contactId);
  };

  const handleRejectRequest = (contactId) => {
    rejectRequest(contactId);
  };

  // Start a chat with a contact
  const startChatWithContact = async (contactId) => {
    try {
      setStartingChatWithId(contactId);
      const chat = await getOrCreatePrivateChat(contactId);
      navigate(`/chats/${chat.id}`);
      closeMobileSidebar();
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setStartingChatWithId(null);
    }
  };

  // Create a map of user IDs to their active chats (if any)
  const userChatsMap = new Map();

  // Map to track which contacts appear in chats
  const contactsInChats = new Set();

  // First, process all chats
  chats?.forEach((chat) => {
    if (chat.type === "PRIVATE") {
      const otherUser = chat.users.find((u) => u.user.id !== user?.id)?.user;
      if (otherUser) {
        userChatsMap.set(otherUser.id, chat);
        contactsInChats.add(otherUser.id);
      }
    }
  });

  // Build the display items list
  const displayItems = [];

  // First add all active chats
  chats?.forEach((chat) => {
    if (chat.type === "PRIVATE") {
      const otherUser = chat.users.find((u) => u.user.id !== user?.id)?.user;
      if (
        otherUser &&
        !displayItems.some(
          (item) =>
            item.type === "CHAT" &&
            item.chatType === "PRIVATE" &&
            item.otherUserId === otherUser.id
        )
      ) {
        displayItems.push({
          type: "CHAT",
          chatType: chat.type,
          id: chat.id,
          otherUserId: otherUser.id,
          otherUserName: otherUser.name,
          otherUserProfilePic: otherUser.profilePic,
          lastMessage: chat.messages?.[0]?.content || "No messages yet",
          lastMessageTime: chat.messages?.[0]?.createdAt,
          unreadCount: chat.unreadCount || 0,
        });
      }
    } else if (chat.type === "GROUP") {
      displayItems.push({
        type: "CHAT",
        chatType: chat.type,
        id: chat.id,
        name: chat.name,
        image: chat.image,
        lastMessage: chat.messages?.[0]?.content || "No messages yet",
        lastMessageTime: chat.messages?.[0]?.createdAt,
        unreadCount: chat.unreadCount || 0,
      });
    }
  });

  // Then add contacts without active chats
  contacts?.forEach((contact) => {
    if (!contactsInChats.has(contact.receiver.id)) {
      displayItems.push({
        type: "CONTACT",
        id: contact.id,
        userId: contact.receiver.id,
        name: contact.receiver.name,
        profilePic: contact.receiver.profilePic,
        lastSeen: contact.receiver.lastSeen,
        online: contact.receiver.online,
      });
    }
  });

  // Sort: active chats first by latest message, then contacts alphabetically
  displayItems.sort((a, b) => {
    // Both are chats
    if (a.type === "CHAT" && b.type === "CHAT") {
      // If a has a message and b doesn't
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      // If b has a message and a doesn't
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      // If both have messages, sort by time
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }
      // If neither has messages, sort by name
      return (
        a.name?.localeCompare(b.name) ||
        a.otherUserName?.localeCompare(b.otherUserName) ||
        0
      );
    }

    // Chats come before contacts
    if (a.type === "CHAT") return -1;
    if (b.type === "CHAT") return 1;

    // Both are contacts, sort alphabetically
    return a.name?.localeCompare(b.name) || 0;
  });

  // Filter by search query if needed
  const filteredItems = searchQuery
    ? displayItems.filter((item) => {
        if (item.type === "CHAT") {
          if (item.chatType === "GROUP") {
            return item.name.toLowerCase().includes(searchQuery.toLowerCase());
          } else {
            return item.otherUserName
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          }
        } else {
          // CONTACT
          return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
      })
    : displayItems;

  return (
    <>
      {isLoggingOut && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium">Logging out...</p>
          </div>
        </div>
      )}

      <div
        className={`
        h-full flex flex-col border-r border-border bg-card
        fixed inset-y-0 left-0 z-30 w-80 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profilePic} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div>
              <h2 className="font-medium">{user?.name || "User"}</h2>
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={navigateToProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCreatingGroup(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>New Group</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/contacts/find")}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Find Contacts</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={navigateToSettings}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={confirmLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={closeMobileSidebar}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />

            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {pendingRequests?.length > 0 && (
            <div className="p-3 bg-accent/20">
              <h3 className="font-medium text-sm mb-2">Contact Requests</h3>
              {pendingRequests.map((request) => (
                <div key={request.id} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={request.sender.profilePic}
                        alt={request.sender.name}
                      />
                      <AvatarFallback>
                        {request.sender.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">
                        {request.sender.name}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {request.sender.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRejectRequest(request.id)}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery && searchResults.length > 0 && (
            <div className="p-3 border-b border-border">
              <h3 className="font-medium text-sm mb-2">Search Results</h3>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 hover:bg-accent/50 rounded-md"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profilePic} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{user.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    disabled={user.relationshipStatus !== "NONE"}
                  >
                    {user.relationshipStatus === "PENDING"
                      ? "Pending"
                      : user.relationshipStatus === "ACCEPTED"
                      ? "Contact"
                      : user.relationshipStatus === "BLOCKED"
                      ? "Blocked"
                      : "Add"}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="divide-y divide-border">
            {isChatsLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                // For chat items
                if (item.type === "CHAT") {
                  return (
                    <div
                      key={item.id}
                      className={`p-3 hover:bg-accent/50 cursor-pointer ${
                        item.id === currentChatId ? "bg-accent" : ""
                      }`}
                      onClick={() => {
                        navigate(`/chats/${item.id}`);
                        closeMobileSidebar();
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          {item.chatType === "GROUP" ? (
                            <>
                              <AvatarImage src={item.image} alt={item.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {item.name?.charAt(0).toUpperCase() || "G"}
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage
                                src={item.otherUserProfilePic}
                                alt={item.otherUserName}
                              />
                              <AvatarFallback>
                                {item.otherUserName?.charAt(0).toUpperCase() ||
                                  "U"}
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium truncate">
                              {item.chatType === "GROUP"
                                ? item.name
                                : item.otherUserName}
                            </h3>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {item.lastMessageTime
                                ? new Date(
                                    item.lastMessageTime
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>

                          <div className="flex justify-between mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {item.lastMessage}
                            </p>

                            {item.unreadCount > 0 && (
                              <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 flex items-center justify-center min-w-[20px] h-5">
                                {item.unreadCount > 99
                                  ? "99+"
                                  : item.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                // For contact items
                else {
                  return (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-accent/50 cursor-pointer"
                      onClick={() => startChatWithContact(item.userId)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={item.profilePic} alt={item.name} />
                          <AvatarFallback>
                            {item.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.online ? (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Online
                              </span>
                            ) : (
                              <span>
                                {item.lastSeen
                                  ? `Last seen ${new Date(
                                      item.lastSeen
                                    ).toLocaleString([], {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}`
                                  : "Offline"}
                              </span>
                            )}
                          </p>
                        </div>

                        {startingChatWithId === item.userId && (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </div>
                  );
                }
              })
            ) : !searchQuery ? (
              <div className="p-6 text-center text-muted-foreground">
                <p>No chats or contacts yet</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigate("/contacts/find")}
                >
                  Find contacts
                </Button>
              </div>
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p>No results matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg md:hidden"
          onClick={() => setIsCreatingGroup(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>

        <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Group Name</label>
                <Input
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Contacts</label>
                <div className="border border-border rounded-md max-h-40 overflow-y-auto">
                  {contacts?.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex items-center p-2 cursor-pointer hover:bg-accent/50 ${
                        selectedContacts.some(
                          (c) => c.id === contact.receiver.id
                        )
                          ? "bg-primary/10"
                          : ""
                      }`}
                      onClick={() => {
                        if (
                          selectedContacts.some(
                            (c) => c.id === contact.receiver.id
                          )
                        ) {
                          setSelectedContacts(
                            selectedContacts.filter(
                              (c) => c.id !== contact.receiver.id
                            )
                          );
                        } else {
                          setSelectedContacts([
                            ...selectedContacts,
                            {
                              id: contact.receiver.id,
                              name: contact.receiver.name,
                            },
                          ]);
                        }
                      }}
                    >
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage
                          src={contact.receiver.profilePic}
                          alt={contact.receiver.name}
                        />
                        <AvatarFallback>
                          {contact.receiver.name?.charAt(0).toUpperCase() ||
                            "U"}
                        </AvatarFallback>
                      </Avatar>

                      <span className="text-sm">{contact.receiver.name}</span>

                      {selectedContacts.some(
                        (c) => c.id === contact.receiver.id
                      ) && (
                        <div className="w-4 h-4 rounded-full bg-primary ml-auto"></div>
                      )}
                    </div>
                  ))}

                  {(!contacts || contacts.length === 0) && (
                    <p className="p-3 text-sm text-muted-foreground">
                      No contacts available
                    </p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingGroup(false);
                  setGroupName("");
                  setSelectedContacts([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedContacts.length === 0}
              >
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={showLogoutConfirm}
          onOpenChange={setShowLogoutConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to logout?
              </AlertDialogTitle>
              <AlertDialogDescription>
                You will need to login again to use the application.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}

export default Sidebar;

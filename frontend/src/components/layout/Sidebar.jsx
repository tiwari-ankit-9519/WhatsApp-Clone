/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { useSocketContext } from "../../contexts/SocketContext";
import { useChats } from "@/hooks/useChats";
import { useContacts } from "@/hooks/useContacts";
import { useNotifications } from "@/hooks/useNotification";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import NotificationsPopover from "@/components/NotificationsPopover";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
  CheckCircle2,
  XCircle,
  Check,
} from "lucide-react";
import { Upload } from "lucide-react";

function Sidebar({ isMobileOpen, closeMobileSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthContext();
  const { isConnected } = useSocketContext();
  const {
    chats,
    isChatsLoading,
    createGroupChat,
    getOrCreatePrivateChat,
    isCreatingGroupChat,
  } = useChats();
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
  const [searchResults, setSearchResults] = useState([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [startingChatWithId, setStartingChatWithId] = useState(null);
  const [globalLoading, setGlobalLoading] = useState(false); // Global loading state

  // State for group creation
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [groupImage, setGroupImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // Handle file selection for group image
  const handleGroupImageSelect = (e) => {
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
  const handleRemoveGroupImage = () => {
    setGroupImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const [activeTab, setActiveTab] = useState("chats");
  const [selectedPendingRequests, setSelectedPendingRequests] = useState([]);

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

  // Global loading effect
  useEffect(() => {
    document.body.style.overflow = globalLoading ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [globalLoading]);

  // Group chat creation
  const handleCreateGroup = async () => {
    if (groupName.trim() && selectedContacts.length > 0) {
      setGlobalLoading(true);
      try {
        const newGroup = await createGroupChat({
          name: groupName.trim(),
          participantsIds: selectedContacts.map((contact) => contact.id),
          groupIcon: groupImage, // Pass the group image file if selected
        });

        // Navigate to the new group chat
        if (newGroup?.id) {
          navigate(`/chats/${newGroup.id}`);
          closeMobileSidebar();
        }

        // Reset state
        setGroupName("");
        setSelectedContacts([]);
        setGroupImage(null);
        setPreviewUrl(null);
        setIsCreatingGroup(false);
      } catch (error) {
        console.error("Failed to create group:", error);
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  // Logout functionality
  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogout = async () => {
    setShowLogoutConfirm(false);
    setGlobalLoading(true); // Show the global loader for logout

    try {
      await logout();
      // No need to navigate here as the auth context will handle the redirect
    } catch (error) {
      console.error("Logout error:", error);
      setGlobalLoading(false); // Hide loader if there's an error
    }
  };

  // Navigation handlers with proper direct navigation
  const navigateToProfile = () => {
    navigate("/profile");
    closeMobileSidebar();
  };

  const navigateToSettings = () => {
    navigate("/settings");
    closeMobileSidebar();
  };

  const handleFindContactsClick = () => {
    // Directly navigate to the contacts/find route
    navigate("/contacts/find");
    closeMobileSidebar();
  };

  // Track loading states for each request
  const [acceptingRequestIds, setAcceptingRequestIds] = useState([]);
  const [rejectingRequestIds, setRejectingRequestIds] = useState([]);
  const [minimumLoadingTime] = useState(800); // Minimum loading time in milliseconds

  // Contact request handlers
  const handleAcceptRequest = async (contactId) => {
    try {
      // Set loading state for this specific request
      setAcceptingRequestIds((prev) => [...prev, contactId]);

      // Track start time
      const startTime = Date.now();

      // Call the API function
      const result = await acceptRequest(contactId);

      // Calculate elapsed time
      const elapsedTime = Date.now() - startTime;

      // If response was too fast, add artificial delay
      if (elapsedTime < minimumLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumLoadingTime - elapsedTime)
        );
      }

      return result;
    } catch (error) {
      console.error("Error accepting request:", error);
      return false;
    } finally {
      // Clear loading state
      setAcceptingRequestIds((prev) => prev.filter((id) => id !== contactId));
    }
  };

  const handleRejectRequest = async (contactId) => {
    try {
      // Set loading state for this specific request
      setRejectingRequestIds((prev) => [...prev, contactId]);

      // Track start time
      const startTime = Date.now();

      // Call the API function
      const result = await rejectRequest(contactId);

      // Calculate elapsed time
      const elapsedTime = Date.now() - startTime;

      // If response was too fast, add artificial delay
      if (elapsedTime < minimumLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumLoadingTime - elapsedTime)
        );
      }

      return result;
    } catch (error) {
      console.error("Error rejecting request:", error);
      return false;
    } finally {
      // Clear loading state
      setRejectingRequestIds((prev) => prev.filter((id) => id !== contactId));
    }
  };

  // Batch accept/reject handlers
  const [isBatchAccepting, setIsBatchAccepting] = useState(false);
  const [isBatchRejecting, setIsBatchRejecting] = useState(false);

  const handleBatchAccept = async () => {
    if (selectedPendingRequests.length === 0) return;

    setIsBatchAccepting(true);
    const startTime = Date.now();

    try {
      // Process all requests in parallel for better efficiency
      await Promise.all(
        selectedPendingRequests.map((requestId) => acceptRequest(requestId))
      );
      setSelectedPendingRequests([]);

      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minimumLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumLoadingTime - elapsedTime)
        );
      }
    } catch (error) {
      console.error("Failed to accept some requests:", error);
    } finally {
      setIsBatchAccepting(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedPendingRequests.length === 0) return;

    setIsBatchRejecting(true);
    const startTime = Date.now();

    try {
      // Process all requests in parallel for better efficiency
      await Promise.all(
        selectedPendingRequests.map((requestId) => rejectRequest(requestId))
      );
      setSelectedPendingRequests([]);

      // Ensure minimum loading time for better UX
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minimumLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumLoadingTime - elapsedTime)
        );
      }
    } catch (error) {
      console.error("Failed to reject some requests:", error);
    } finally {
      setIsBatchRejecting(false);
    }
  };

  const togglePendingRequestSelection = (requestId) => {
    setSelectedPendingRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  // Start a chat with a contact
  const startChatWithContact = async (contactId) => {
    try {
      setStartingChatWithId(contactId);
      setGlobalLoading(true);
      const chat = await getOrCreatePrivateChat(contactId);
      navigate(`/chats/${chat.id}`);
      closeMobileSidebar();
    } catch (error) {
      console.error("Failed to start chat:", error);
    } finally {
      setStartingChatWithId(null);
      setGlobalLoading(false);
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

  // Build the display items list for chats
  const chatItems = [];

  // First add all active chats
  chats?.forEach((chat) => {
    if (chat.type === "PRIVATE") {
      const otherUser = chat.users.find((u) => u.user.id !== user?.id)?.user;
      if (
        otherUser &&
        !chatItems.some(
          (item) =>
            item.type === "CHAT" &&
            item.chatType === "PRIVATE" &&
            item.otherUserId === otherUser.id
        )
      ) {
        chatItems.push({
          type: "CHAT",
          chatType: chat.type,
          id: chat.id,
          otherUserId: otherUser.id,
          otherUserName: otherUser.name,
          otherUserProfilePic: otherUser.profilePic,
          lastMessage: chat.messages?.[0]?.content || "No messages yet",
          lastMessageTime: chat.messages?.[0]?.createdAt || chat.updatedAt,
          unreadCount: chat.unreadCount || 0,
          online: otherUser.online,
          lastSeen: otherUser.lastSeen,
        });
      }
    } else if (chat.type === "GROUP") {
      chatItems.push({
        type: "CHAT",
        chatType: chat.type,
        id: chat.id,
        name: chat.name,
        image: chat.image,
        lastMessage: chat.messages?.[0]?.content || "No messages yet",
        lastMessageTime: chat.messages?.[0]?.createdAt || chat.updatedAt,
        unreadCount: chat.unreadCount || 0,
      });
    }
  });

  // Add contacts without active chats (they're friends but no message has been exchanged)
  contacts?.forEach((contact) => {
    if (!contactsInChats.has(contact.receiver.id)) {
      chatItems.push({
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
  chatItems.sort((a, b) => {
    // Both are chats
    if (a.type === "CHAT" && b.type === "CHAT") {
      // If a has a message time and b doesn't
      if (a.lastMessageTime && !b.lastMessageTime) return -1;
      // If b has a message time and a doesn't
      if (!a.lastMessageTime && b.lastMessageTime) return 1;
      // If both have message times, sort by time (newest first)
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

    // If one is a chat and one is a contact, chats come first
    if (a.type === "CHAT") return -1;
    if (b.type === "CHAT") return 1;

    // Both are contacts, sort alphabetically
    return a.name?.localeCompare(b.name) || 0;
  });

  // Filter chats by search query if needed
  const filteredChatItems = searchQuery
    ? chatItems.filter((item) => {
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
    : chatItems;

  return (
    <>
      {/* Global loading overlay */}
      {globalLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="bg-background p-6 rounded-lg shadow-lg flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium">Loading...</p>
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
            <div className="z-50">
              <NotificationsPopover>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                      {notificationCount > 99 ? "99+" : notificationCount}
                    </span>
                  )}
                </Button>
              </NotificationsPopover>
            </div>

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
                <DropdownMenuItem onClick={handleFindContactsClick}>
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
              placeholder="Search..."
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

        {/* Main content with tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs
            defaultValue="chats"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="w-full">
              <TabsTrigger value="chats" className="flex-1">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex-1 relative">
                <Users className="h-4 w-4 mr-2" />
                Contacts
                {pendingRequests?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {pendingRequests.length > 99
                      ? "99+"
                      : pendingRequests.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Chats Tab Content */}
            <TabsContent value="chats" className="flex-1 overflow-y-auto">
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
                ) : filteredChatItems.length > 0 ? (
                  filteredChatItems.map((item) => {
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
                                  <AvatarImage
                                    src={item.image}
                                    alt={item.name}
                                  />
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
                                    {item.otherUserName
                                      ?.charAt(0)
                                      .toUpperCase() || "U"}
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
                    // For contact items (friends without chats)
                    else {
                      return (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-accent/50 cursor-pointer"
                          onClick={() => startChatWithContact(item.userId)}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage
                                src={item.profilePic}
                                alt={item.name}
                              />
                              <AvatarFallback>
                                {item.name?.charAt(0).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">
                                {item.name}
                              </h3>
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
                      onClick={handleFindContactsClick}
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
            </TabsContent>

            {/* Contacts Tab Content - Shows Friend Requests */}
            <TabsContent value="contacts" className="flex-1 overflow-y-auto">
              {pendingRequests?.length > 0 ? (
                <div>
                  {/* Batch actions for pending requests */}
                  {selectedPendingRequests.length > 0 && (
                    <div className="p-3 bg-accent/30 flex justify-between items-center">
                      <span className="text-sm font-medium">
                        {selectedPendingRequests.length} selected
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleBatchReject}
                          disabled={
                            isBatchRejecting ||
                            isBatchAccepting ||
                            rejectingRequestIds.length > 0 ||
                            acceptingRequestIds.length > 0
                          }
                        >
                          {isBatchRejecting ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                              <span>Rejecting...</span>
                            </div>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject All
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleBatchAccept}
                          disabled={
                            isBatchRejecting ||
                            isBatchAccepting ||
                            rejectingRequestIds.length > 0 ||
                            acceptingRequestIds.length > 0
                          }
                        >
                          {isBatchAccepting ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                              <span>Accepting...</span>
                            </div>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Accept All
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-border">
                    {pendingRequests.map((request) => {
                      const isAccepting = acceptingRequestIds.includes(
                        request.id
                      );
                      const isRejecting = rejectingRequestIds.includes(
                        request.id
                      );

                      return (
                        <div
                          key={request.id}
                          className="p-3 hover:bg-accent/50"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center mr-1 mt-1">
                              <input
                                type="checkbox"
                                checked={selectedPendingRequests.includes(
                                  request.id
                                )}
                                onChange={() =>
                                  togglePendingRequestSelection(request.id)
                                }
                                className="h-4 w-4 rounded border-gray-300 focus:ring-primary"
                                disabled={isAccepting || isRejecting}
                              />
                            </div>
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
                                <h3 className="font-medium truncate">
                                  {request.sender.name}
                                </h3>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {request.createdAt &&
                                    formatDistanceToNow(
                                      new Date(request.createdAt),
                                      {
                                        addSuffix: true,
                                      }
                                    )}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {request.sender.email}
                              </p>

                              <div className="flex gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 h-8 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRejectRequest(request.id);
                                  }}
                                  disabled={
                                    isRejecting ||
                                    isAccepting ||
                                    isBatchAccepting ||
                                    isBatchRejecting
                                  }
                                >
                                  {isRejecting ? (
                                    <div className="flex items-center justify-center w-full">
                                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                                      <span>Rejecting...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-1" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 h-8 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAcceptRequest(request.id);
                                  }}
                                  disabled={
                                    isRejecting ||
                                    isAccepting ||
                                    isBatchAccepting ||
                                    isBatchRejecting
                                  }
                                >
                                  {isAccepting ? (
                                    <div className="flex items-center justify-center w-full">
                                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                                      <span>Accepting...</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Check className="h-4 w-4 mr-1" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 p-4">
                  <UserPlus className="h-16 w-16 text-muted-foreground opacity-50 mb-4" />
                  <p className="text-center text-muted-foreground">
                    No pending friend requests
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={handleFindContactsClick}
                  >
                    Find new contacts
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Create a direct action button for Find Contacts on mobile */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 md:hidden">
          <Button
            className="h-14 w-14 rounded-full shadow-lg bg-primary/90"
            onClick={handleFindContactsClick}
            title="Find Contacts"
          >
            <UserPlus className="h-6 w-6" />
          </Button>

          <Button
            className="h-14 w-14 rounded-full shadow-lg"
            onClick={() => setIsCreatingGroup(true)}
            title="Create Group"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Group</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Group Image Upload */}
              <div className="flex flex-col items-center mb-2">
                <div className="relative mb-2">
                  <Avatar className="h-24 w-24">
                    {previewUrl ? (
                      <AvatarImage src={previewUrl} alt="Group Image" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {groupName ? groupName.charAt(0).toUpperCase() : "G"}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="absolute bottom-0 right-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleGroupImageSelect}
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
                </div>

                {previewUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1"
                    onClick={handleRemoveGroupImage}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {previewUrl
                    ? "Change group image"
                    : "Add group image (optional)"}
                </p>
              </div>

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
                  setGroupImage(null);
                  setPreviewUrl(null);
                }}
                disabled={isCreatingGroupChat || globalLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={
                  !groupName.trim() ||
                  selectedContacts.length === 0 ||
                  isCreatingGroupChat ||
                  globalLoading
                }
              >
                {isCreatingGroupChat ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
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

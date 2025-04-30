import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useContacts } from "../../hooks/useContacts";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "../../components/ui/alert-dialog";
import {
  Search,
  X,
  ArrowLeft,
  UserPlus,
  Check,
  AlertCircle,
  Users,
  UserX,
  UserCheck,
  MoreVertical,
  MessageSquare,
  Ban,
  Filter,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useChats } from "../../hooks/useChats";

function FindContactsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    searchUsers,
    sendRequest,
    isSearchingUsers,
    isSendingRequest,
    contacts,
    blockedContacts,
    blockContact,
    unblockContact,
    isBlockingContact,
    isUnblockingContact,
  } = useContacts();

  const { getOrCreatePrivateChat } = useChats();

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [activeTab, setActiveTab] = useState("find");
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  // Check URL for tab parameter
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const tabParam = query.get("tab");
    if (tabParam && ["find", "contacts", "blocked"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Handle search when typing in Find tab
  useEffect(() => {
    if (activeTab !== "find") return;

    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setSearchPerformed(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Search for users
  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchPerformed(false);
      return;
    }

    try {
      const results = await searchUsers(searchQuery);
      setSearchResults(results || []);
      setSearchPerformed(true);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search for contacts");
    }
  };

  // Handle sending a contact request
  const handleSendRequest = async (userId) => {
    try {
      await sendRequest(userId);
      // Optimistically update UI
      setPendingRequests((prev) => new Set([...prev, userId]));
      toast.success("Contact request sent");
    } catch (error) {
      console.error("Failed to send request:", error);
      toast.error("Failed to send contact request");
    }
  };

  // Handle block contact
  const handleBlockContact = (contact) => {
    setSelectedContact(contact);
    setShowBlockConfirm(true);
  };

  // Confirm block contact
  const confirmBlockContact = async () => {
    if (!selectedContact) return;

    try {
      // Note: We don't need to set a local loading state here as isBlockingContact
      // from the hook will handle that
      await blockContact(selectedContact.receiver.id);
      toast.success(`${selectedContact.receiver.name} has been blocked`);
      setShowBlockConfirm(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Failed to block contact:", error);
      toast.error("Failed to block contact");
    }
  };

  // Handle unblock contact
  const handleUnblockContact = (contact) => {
    setSelectedContact(contact);
    setShowUnblockConfirm(true);
  };

  // Confirm unblock contact
  const confirmUnblockContact = async () => {
    if (!selectedContact) return;

    try {
      // Note: We don't need to set a local loading state here as isUnblockingContact
      // from the hook will handle that
      await unblockContact(selectedContact.id);
      toast.success(`${selectedContact.receiver.name} has been unblocked`);
      setShowUnblockConfirm(false);
      setSelectedContact(null);
    } catch (error) {
      console.error("Failed to unblock contact:", error);
      toast.error("Failed to unblock contact");
    }
  };

  // Start a chat with a contact
  const handleStartChat = async (contactId) => {
    setIsStartingChat(true);
    try {
      const chat = await getOrCreatePrivateChat(contactId);
      navigate(`/chats/${chat.id}`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  // Filter contacts based on search query
  const filteredContacts = contactSearchQuery.trim()
    ? contacts?.filter(
        (contact) =>
          contact.receiver.name
            .toLowerCase()
            .includes(contactSearchQuery.toLowerCase()) ||
          contact.receiver.email
            .toLowerCase()
            .includes(contactSearchQuery.toLowerCase())
      )
    : contacts;

  // Filter blocked contacts based on search query
  const filteredBlockedContacts = contactSearchQuery.trim()
    ? blockedContacts?.filter(
        (contact) =>
          contact.receiver.name
            .toLowerCase()
            .includes(contactSearchQuery.toLowerCase()) ||
          contact.receiver.email
            .toLowerCase()
            .includes(contactSearchQuery.toLowerCase())
      )
    : blockedContacts;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg">Contacts</h2>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b border-border">
          <TabsList className="w-full">
            <TabsTrigger value="find" className="flex items-center gap-1.5">
              <Search className="h-4 w-4" />
              <span>Find</span>
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>My Contacts</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center gap-1.5">
              <Ban className="h-4 w-4" />
              <span>Blocked</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Find Contacts Tab */}
        <TabsContent value="find" className="flex-1 flex flex-col">
          {/* Search Bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />

              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchPerformed(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {isSearchingUsers ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="divide-y divide-border">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.profilePic} alt={user.name} />
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <Button
                      disabled={
                        isSendingRequest ||
                        user.relationshipStatus !== "NONE" ||
                        pendingRequests.has(user.id)
                      }
                      variant={
                        user.relationshipStatus === "PENDING" ||
                        pendingRequests.has(user.id)
                          ? "outline"
                          : user.relationshipStatus === "ACCEPTED"
                          ? "secondary"
                          : "default"
                      }
                      size="sm"
                      onClick={() => handleSendRequest(user.id)}
                    >
                      {user.relationshipStatus === "PENDING" ||
                      pendingRequests.has(user.id) ? (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Pending
                        </>
                      ) : user.relationshipStatus === "ACCEPTED" ? (
                        "Connected"
                      ) : user.relationshipStatus === "BLOCKED" ? (
                        "Blocked"
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchPerformed ? (
              <div className="flex flex-col items-center justify-center py-16">
                <AlertCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  We couldn't find any users matching "{searchQuery}". Try
                  another search term or check the spelling.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Find new contacts</h3>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  Search for people by name or email to connect with them.
                  You'll be able to chat once they accept your request.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* My Contacts Tab */}
        <TabsContent value="contacts" className="flex-1 flex flex-col">
          {/* Contacts Search Bar */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Input
                placeholder="Search your contacts..."
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />

              {contactSearchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setContactSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {!contacts || contacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  Start by searching for people and sending contact requests.
                </p>
                <Button className="mt-4" onClick={() => setActiveTab("find")}>
                  Find Contacts
                </Button>
              </div>
            ) : filteredContacts && filteredContacts.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={contact.receiver.profilePic}
                          alt={contact.receiver.name}
                        />
                        <AvatarFallback>
                          {contact.receiver.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{contact.receiver.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {contact.receiver.email}
                        </p>
                        {contact.receiver.online ? (
                          <p className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Online
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {contact.receiver.lastSeen
                              ? `Last seen ${new Date(
                                  contact.receiver.lastSeen
                                ).toLocaleString()}`
                              : "Offline"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isStartingChat}
                        onClick={() => handleStartChat(contact.receiver.id)}
                        title="Message"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleBlockContact(contact)}
                            className="text-destructive focus:text-destructive"
                            disabled={isBlockingContact}
                          >
                            {isBlockingContact &&
                            selectedContact?.receiver.id ===
                              contact.receiver.id ? (
                              <>
                                <div className="animate-spin h-4 w-4 border-2 border-destructive border-t-transparent rounded-full mr-2" />
                                Blocking...
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Block Contact
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Filter className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No matches found</h3>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  No contacts match your search term "{contactSearchQuery}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => setContactSearchQuery("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Blocked Contacts Tab */}
        <TabsContent value="blocked" className="flex-1 flex flex-col">
          {/* Blocked Contacts Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Input
                placeholder="Search blocked contacts..."
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />

              {contactSearchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                  onClick={() => setContactSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Blocked Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {!blockedContacts || blockedContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Ban className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">
                  No blocked contacts
                </h3>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  You haven't blocked any contacts yet.
                </p>
              </div>
            ) : filteredBlockedContacts &&
              filteredBlockedContacts.length > 0 ? (
              <div className="divide-y divide-border">
                {filteredBlockedContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={contact.receiver.profilePic}
                          alt={contact.receiver.name}
                        />
                        <AvatarFallback>
                          {contact.receiver.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{contact.receiver.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {contact.receiver.email}
                        </p>
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <Ban className="h-3 w-3" />
                          Blocked
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblockContact(contact)}
                      disabled={isUnblockingContact || isBlockingContact}
                    >
                      {isUnblockingContact &&
                      selectedContact?.id === contact.id ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Unblocking...
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Unblock
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Filter className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No matches found</h3>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  No blocked contacts match your search term "
                  {contactSearchQuery}"
                </p>
                <Button
                  variant="outline"
                  onClick={() => setContactSearchQuery("")}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Block Contact Confirmation Dialog */}
      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block {selectedContact?.receiver.name}?
              They won't be able to message you, and you won't see their
              messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlockContact}
              className="bg-destructive text-destructive-foreground"
              disabled={isBlockingContact}
            >
              {isBlockingContact ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Blocking...
                </>
              ) : (
                "Block Contact"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unblock Contact Confirmation Dialog */}
      <AlertDialog
        open={showUnblockConfirm}
        onOpenChange={setShowUnblockConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock {selectedContact?.receiver.name}?
              They will be able to message you again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnblockContact}
              disabled={isUnblockingContact}
            >
              {isUnblockingContact ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                  Unblocking...
                </>
              ) : (
                "Unblock Contact"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default FindContactsPage;

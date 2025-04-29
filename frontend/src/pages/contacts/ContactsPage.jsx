import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContacts } from "../../hooks/useContacts";
import { useNotifications } from "../../hooks/useNotification";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import ContactItem from "../../components/contacts/ContactItem";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { UserPlus, Users, UserX, Search, X, ArrowLeft } from "lucide-react";

function ContactsPage() {
  const navigate = useNavigate();
  const {
    contacts,
    pendingRequests,
    blockedContacts,
    isContactsLoading,
    isPendingLoading,
    isBlockedLoading,
    searchUsers,
    sendRequest,
    isSendingRequest,
    markContactRequestsViewed,
  } = useContacts();

  const { contactRequestCount } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");

  // Mark contact requests as viewed when opening the pending tab
  useEffect(() => {
    if (activeTab === "pending" && contactRequestCount > 0) {
      markContactRequestsViewed();
    }
  }, [activeTab, contactRequestCount, markContactRequestsViewed]);

  // Handle search for finding new contacts
  const handleSearch = async () => {
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

  // Debounced search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "find" && searchQuery.trim().length >= 2) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Handle sending a contact request
  const handleSendRequest = (userId) => {
    sendRequest(userId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={() => navigate("/chats")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-semibold text-lg">Contacts</h2>
        </div>
      </div>

      {/* Tabs for different contact sections */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b border-border">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="contacts" className="relative">
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Contacts</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Requests</span>
              <span className="sm:hidden">Pending</span>
              {contactRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {contactRequestCount > 99 ? "99+" : contactRequestCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="find">
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Find Contacts</span>
              <span className="sm:hidden">Find</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="flex-1 overflow-auto">
          {isContactsLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : contacts?.length > 0 ? (
            <div className="divide-y divide-border">
              {contacts.map((contact) => (
                <ContactItem key={contact.id} contact={contact} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <Users className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No contacts yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Start by adding new contacts to chat with them
              </p>
              <Button onClick={() => setActiveTab("find")}>
                Find Contacts
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="flex-1 overflow-auto">
          {isPendingLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : pendingRequests?.length > 0 ? (
            <div className="divide-y divide-border">
              {pendingRequests.map((request) => (
                <ContactItem
                  key={request.id}
                  contact={request}
                  isPending={true}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <UserPlus className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No pending requests</h3>
              <p className="text-muted-foreground text-center">
                When someone sends you a contact request, it will appear here
              </p>
            </div>
          )}
        </TabsContent>

        {/* Find Contacts Tab */}
        <TabsContent value="find" className="flex-1 overflow-auto">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Input
                placeholder="Search by name or email..."
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

          {isSearching ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-border">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mr-3 overflow-hidden">
                      {user.profilePic ? (
                        <img
                          src={user.profilePic}
                          alt={user.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <Button
                    disabled={
                      isSendingRequest || user.relationshipStatus !== "NONE"
                    }
                    variant={
                      user.relationshipStatus === "PENDING"
                        ? "outline"
                        : user.relationshipStatus === "ACCEPTED"
                        ? "secondary"
                        : "default"
                    }
                    size="sm"
                    onClick={() => handleSendRequest(user.id)}
                  >
                    {user.relationshipStatus === "PENDING"
                      ? "Pending"
                      : user.relationshipStatus === "ACCEPTED"
                      ? "Contact"
                      : user.relationshipStatus === "BLOCKED"
                      ? "Blocked"
                      : "Add Contact"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8">
              <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Find contacts</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery.length > 0
                  ? `No results for "${searchQuery}"`
                  : "Search for users by name or email"}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ContactsPage;

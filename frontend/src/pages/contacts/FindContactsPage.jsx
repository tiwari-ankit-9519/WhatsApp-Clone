import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useContacts } from "../../hooks/useContacts";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "../../components/ui/avatar";
import {
  Search,
  X,
  ArrowLeft,
  UserPlus,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

function FindContactsPage() {
  const navigate = useNavigate();
  const { searchUsers, sendRequest, isSearchingUsers, isSendingRequest } =
    useContacts();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Handle search when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
        setSearchPerformed(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
          <h2 className="font-semibold text-lg">Find Contacts</h2>
        </div>
      </div>

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
              We couldn't find any users matching "{searchQuery}". Try another
              search term or check the spelling.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Find new contacts</h3>
            <p className="text-muted-foreground text-center max-w-md px-4">
              Search for people by name or email to connect with them. You'll be
              able to chat once they accept your request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FindContactsPage;

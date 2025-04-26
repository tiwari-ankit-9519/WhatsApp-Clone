/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useChat } from "../../context/ChatContext";
import { useTheme } from "../../components/theme-provider";
import ContactListItem from "./ContactListItem";
import ContactRequestItem from "./ContactRequestItem";
import {
  acceptContactRequest,
  rejectContactRequest,
  sendContactRequest,
  searchUsers,
} from "../../state/contact";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const ContactList = ({ onContactClick, searchQuery }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { contacts, pendingRequests } = useChat();
  const [searchMode, setSearchMode] = useState(false);
  const queryClient = useQueryClient();

  // Get search results when searchQuery is not empty
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["userSearch", searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60, // 1 minute
  });

  // Accept contact request mutation
  const acceptMutation = useMutation({
    mutationFn: acceptContactRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(["contacts"]);
      queryClient.invalidateQueries(["pendingRequests"]);
      queryClient.invalidateQueries(["chats"]);
    },
  });

  // Reject contact request mutation
  const rejectMutation = useMutation({
    mutationFn: rejectContactRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingRequests"]);
    },
  });

  // Send contact request mutation
  const sendRequestMutation = useMutation({
    mutationFn: sendContactRequest,
    onSuccess: () => {
      queryClient.invalidateQueries(["userSearch"]);
    },
  });

  // Handle accepting a contact request
  const handleAcceptRequest = (contactId) => {
    acceptMutation.mutate(contactId);
  };

  // Handle rejecting a contact request
  const handleRejectRequest = (contactId) => {
    rejectMutation.mutate(contactId);
  };

  // Handle sending a contact request
  const handleSendRequest = (userId) => {
    sendRequestMutation.mutate(userId);
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter((contact) => {
    if (!searchQuery) return true;
    return contact.receiver.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  // Sort contacts alphabetically
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    return a.receiver.name.localeCompare(b.receiver.name);
  });

  // Determine if we should show search results based on query length
  const showSearchResults = searchQuery.length >= 2;

  // Format search results to filter out existing contacts
  const formattedSearchResults = searchResults?.users || [];

  return (
    <div className="h-full">
      {/* Pending contact requests section */}
      {pendingRequests.length > 0 && !showSearchResults && (
        <div className={`px-4 py-2 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
          <h3
            className={`text-sm font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Contact Requests ({pendingRequests.length})
          </h3>
        </div>
      )}

      {pendingRequests.length > 0 && !showSearchResults && (
        <div
          className={`divide-y ${
            isDark ? "divide-gray-700" : "divide-gray-200"
          }`}
        >
          {pendingRequests.map((request) => (
            <ContactRequestItem
              key={request.id}
              contact={request}
              onAccept={() => handleAcceptRequest(request.id)}
              onReject={() => handleRejectRequest(request.id)}
            />
          ))}
        </div>
      )}

      {/* Contacts section header */}
      {!showSearchResults && (
        <div className={`px-4 py-2 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
          <h3
            className={`text-sm font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Contacts ({sortedContacts.length})
          </h3>
        </div>
      )}

      {/* Search results header */}
      {showSearchResults && (
        <div className={`px-4 py-2 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
          <h3
            className={`text-sm font-medium ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            {isSearching
              ? "Searching..."
              : `Search results (${formattedSearchResults.length})`}
          </h3>
        </div>
      )}

      {/* Contact list or search results */}
      <div
        className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
      >
        {showSearchResults ? (
          // Display search results
          formattedSearchResults.length > 0 ? (
            formattedSearchResults.map((user) => (
              <ContactListItem
                key={user.id}
                contact={{
                  id: user.id,
                  receiver: user,
                  relationshipStatus: user.relationshipStatus,
                }}
                isSearchResult={true}
                onContactClick={onContactClick}
                onSendRequest={() => handleSendRequest(user.id)}
              />
            ))
          ) : (
            // No search results
            <div
              className={`p-4 text-center ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {searchQuery.length > 0
                ? "No results found"
                : "Type to search for users"}
            </div>
          )
        ) : // Display contacts
        sortedContacts.length > 0 ? (
          sortedContacts.map((contact) => (
            <ContactListItem
              key={contact.id}
              contact={contact}
              onContactClick={onContactClick}
            />
          ))
        ) : (
          // No contacts
          <div
            className={`p-4 text-center ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No contacts yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;

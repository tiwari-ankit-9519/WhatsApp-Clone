import apiClient from "./apiClient";

export const contactApi = {
  getContacts: async () => {
    const response = await apiClient.get("/contacts");
    return response.data.contacts;
  },

  getPendingRequests: async () => {
    const response = await apiClient.get("/contacts/pending");
    return response.data.pendingRequests;
  },

  getBlockedContacts: async () => {
    const response = await apiClient.get("/contacts/blocked");
    return response.data.blockedContacts;
  },

  sendContactRequest: async (receiverId) => {
    const response = await apiClient.post("/contacts/request", { receiverId });
    return response.data;
  },

  acceptContactRequest: async (contactId) => {
    const response = await apiClient.patch(
      `/contacts/request/${contactId}/accept`
    );
    return response.data;
  },

  rejectContactRequest: async (contactId) => {
    const response = await apiClient.delete(
      `/contacts/request/${contactId}/reject`
    );
    return response.data;
  },

  blockContact: async (contactUserId) => {
    const response = await apiClient.post("/contacts/block", { contactUserId });
    return response.data;
  },

  unblockContact: async (contactId) => {
    const response = await apiClient.patch(`/contacts/unblock/${contactId}`);
    return response.data;
  },

  searchUsers: async (query) => {
    const response = await apiClient.get(
      `/contacts/search?query=${encodeURIComponent(query)}`
    );
    return response.data.users;
  },

  markContactRequestsViewed: async () => {
    const response = await apiClient.post(
      "/notifications/mark-contacts-viewed"
    );
    return response.data;
  },
};

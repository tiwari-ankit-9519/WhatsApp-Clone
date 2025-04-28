import apiClient from "./apiClient";

export const chatApi = {
  getChats: async () => {
    const response = await apiClient.get("/chats");
    return response.data.chats;
  },

  getChatById: async (chatId) => {
    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data.chat;
  },

  createPrivateChat: async (userId) => {
    const response = await apiClient.post("/chats", {
      type: "PRIVATE",
      participantsIds: [userId],
    });
    return response.data.chat;
  },

  createGroupChat: async (name, participantsIds, groupIcon = null) => {
    const formData = new FormData();
    formData.append("type", "GROUP");
    formData.append("name", name);

    participantsIds.forEach((id) => {
      formData.append("participantsIds", id);
    });

    if (groupIcon instanceof File) {
      formData.append("groupIcon", groupIcon);
    }

    const response = await apiClient.post("/chats", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.chat;
  },

  markMessagesAsDelivered: async (chatId) => {
    const response = await apiClient.post(
      `/chats/${chatId}/messages/delivered`
    );
    return response.data;
  },

  markMessagesAsRead: async (chatId) => {
    const response = await apiClient.post(`/chats/${chatId}/messages/read`);
    return response.data;
  },

  searchChats: async (query) => {
    const response = await apiClient.get(
      `/chats/search?query=${encodeURIComponent(query)}`
    );
    return response.data.chats;
  },
};

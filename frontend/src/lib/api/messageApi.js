import apiClient from "./apiClient";

export const messageApi = {
  getMessages: async (chatId, page = 1, limit = 30) => {
    const response = await apiClient.get(
      `/chats/${chatId}/messages?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  sendMessage: async (chatId, content, type = "TEXT", parentId = null) => {
    const response = await apiClient.post(`/chats/${chatId}/messages`, {
      chatId,
      content,
      type,
      parentId,
    });
    return response.data.message;
  },

  sendMediaMessage: async (chatId, file, type = null, content = "") => {
    const formData = new FormData();
    formData.append("chatId", chatId);
    formData.append("media", file);

    if (content) {
      formData.append("content", content);
    }

    if (type) {
      formData.append("type", type);
    }

    const response = await apiClient.post(
      `/chats/${chatId}/messages`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.message;
  },

  reactToMessage: async (messageId, emoji) => {
    const response = await apiClient.post(
      `/chats/messages/${messageId}/react`,
      { emoji }
    );
    return response.data;
  },

  deleteMessage: async (messageId, deleteType = "FOR_ME") => {
    const response = await apiClient.delete(`/chats/messages/${messageId}`, {
      data: { deleteType },
    });
    return response.data;
  },

  getReplies: async (messageId) => {
    const response = await apiClient.get(
      `/chats/messages/${messageId}/replies`
    );
    return response.data.replies;
  },

  searchMessages: async (query, chatId = null, page = 1, limit = 20) => {
    let url = `/chats/messages/search?query=${encodeURIComponent(
      query
    )}&page=${page}&limit=${limit}`;
    if (chatId) {
      url += `&chatId=${chatId}`;
    }
    const response = await apiClient.get(url);
    return response.data;
  },

  starMessage: async (messageId, note = "") => {
    const response = await apiClient.post(
      `/starred/messages/${messageId}/star`,
      { note }
    );
    return response.data;
  },

  unstarMessage: async (messageId) => {
    const response = await apiClient.delete(
      `/starred/messages/${messageId}/star`
    );
    return response.data;
  },

  getStarredMessages: async (page = 1, limit = 20) => {
    const response = await apiClient.get(
      `/starred/starred?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  forwardMessage: async (messageId, chatIds) => {
    const response = await apiClient.post(
      `/forward/messages/${messageId}/forward`,
      { chatIds }
    );
    return response.data;
  },
};

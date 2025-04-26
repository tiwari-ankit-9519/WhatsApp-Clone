import axios from "axios";

// const API_URL = "https://whatsapp-clone-backend-production-b037.up.railway.app";
const API_URL = "http://localhost:8080";

export const getChats = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/chats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getChatById = async (chatId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/chats/${chatId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createChat = async (data) => {
  const token = localStorage.getItem("token");
  const formData = new FormData();
  formData.append("type", data.type);

  if (data.participantsIds && Array.isArray(data.participantsIds)) {
    data.participantsIds.forEach((id) => {
      formData.append("participantsIds", id);
    });
  }

  if (data.type === "GROUP") {
    formData.append("name", data.name || "New Group");

    if (data.adminIds && Array.isArray(data.adminIds)) {
      data.adminIds.forEach((id) => {
        formData.append("adminIds", id);
      });
    }

    if (data.image) {
      formData.append("groupIcon", data.image);
    }
  }

  const response = await axios.post(`${API_URL}/api/chats`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const sendMessage = async (chatId, data) => {
  if (!chatId) {
    throw new Error("ChatID is required");
  }

  const token = localStorage.getItem("token");
  const formData = new FormData();

  formData.append("content", data.content || "");
  formData.append("type", data.type || "TEXT");
  formData.append("chatId", chatId);

  if (data.parentId) {
    formData.append("parentId", data.parentId);
  }

  if (data.media) {
    formData.append("media", data.media);
  }

  console.log("Sending message to chat:", chatId, "with data:", data);

  const response = await axios.post(
    `${API_URL}/api/chats/${chatId}/messages`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getMessages = async (chatId, page = 1, limit = 30) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(
    `${API_URL}/api/chats/${chatId}/messages?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const markMessagesAsDelivered = async (chatId) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/api/chats/${chatId}/messages/delivered`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const markMessagesAsRead = async (chatId) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/api/chats/${chatId}/messages/read`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const updateMessageStatus = async (messageId, status) => {
  const token = localStorage.getItem("token");
  const response = await axios.patch(
    `${API_URL}/api/chats/messages/${messageId}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const deleteMessage = async (messageId, deleteType) => {
  const token = localStorage.getItem("token");
  const response = await axios.delete(
    `${API_URL}/api/chats/messages/${messageId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { deleteType },
    }
  );
  return response.data;
};

export const reactToMessage = async (messageId, emoji) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/api/chats/messages/${messageId}/react`,
    { emoji },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getMessageReplies = async (messageId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(
    `${API_URL}/api/chats/messages/${messageId}/replies`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getNotifications = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const clearChatNotifications = async (chatId) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/api/notifications/clear/${chatId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const getTotalNotificationCount = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/notifications/count`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getAllNotificationCounts = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/notifications/all-counts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const markContactRequestsViewed = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/api/notifications/mark-contacts-viewed`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

import axios from "axios";

// const API_URL = "https://whatsapp-clone-backend-production-b037.up.railway.app";
const API_URL = "http://localhost:8080";

export const getContacts = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/contacts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getPendingRequests = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/contacts/pending`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getBlockedContacts = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/api/contacts/blocked`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const searchUsers = async (query) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(
    `${API_URL}/api/contacts/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const sendContactRequest = async (receiverId) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/api/contacts/request`,
    {
      receiverId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const acceptContactRequest = async (contactId) => {
  const token = localStorage.getItem("token");
  const response = await axios.patch(
    `${API_URL}/api/contacts/request/${contactId}/accept`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const rejectContactRequest = async (contactId) => {
  const token = localStorage.getItem("token");
  const response = await axios.delete(
    `${API_URL}/api/contacts/request/${contactId}/reject`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const blockContact = async (contactUserId) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(
    `${API_URL}/api/contacts/block`,
    {
      contactUserId,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export const unblockContact = async (contactId) => {
  const token = localStorage.getItem("token");
  const response = await axios.patch(
    `${API_URL}/api/contacts/unblock/${contactId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

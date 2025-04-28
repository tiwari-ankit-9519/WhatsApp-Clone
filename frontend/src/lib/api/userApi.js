import apiClient from "./apiClient";

export const userApi = {
  updateUserProfile: async (userData) => {
    const formData = new FormData();

    // Process regular text fields
    const textFields = ["name", "email", "bio", "gender"];
    textFields.forEach((field) => {
      if (userData[field] !== undefined) {
        formData.append(field, userData[field]);
      }
    });

    // Handle date of birth
    if (userData.dateOfBirth) {
      // Ensure it's a valid date format
      formData.append(
        "dateOfBirth",
        new Date(userData.dateOfBirth).toISOString()
      );
    }

    // Handle profile picture separately
    if (userData.profilePic instanceof File) {
      formData.append("profilePic", userData.profilePic);
    }

    const response = await apiClient.put("/auth/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  getNotifications: async () => {
    const response = await apiClient.get("/notifications");
    return response.data;
  },

  getTotalNotificationCount: async () => {
    const response = await apiClient.get("/notifications/count");
    return response.data.totalCount;
  },

  getAllNotificationCounts: async () => {
    const response = await apiClient.get("/notifications/all-counts");
    return response.data;
  },

  clearChatNotifications: async (chatId) => {
    const response = await apiClient.post(`/notifications/clear/${chatId}`);
    return response.data;
  },
};

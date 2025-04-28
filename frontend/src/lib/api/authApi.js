import apiClient from "./apiClient";

export const authApi = {
  register: async (userData) => {
    const formData = new FormData();
    Object.keys(userData).forEach((key) => {
      if (key === "profilePic" && userData[key] instanceof File) {
        formData.append(key, userData[key]);
      } else {
        formData.append(key, userData[key]);
      }
    });

    const response = await apiClient.post("/auth/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post("/auth/logout");
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get("/auth/profile");
    return response.data;
  },

  updateProfile: async (profileData) => {
    const formData = new FormData();
    Object.keys(profileData).forEach((key) => {
      if (key === "profilePic" && profileData[key] instanceof File) {
        formData.append(key, profileData[key]);
      } else if (profileData[key] !== undefined) {
        formData.append(key, profileData[key]);
      }
    });

    const response = await apiClient.put("/auth/update-profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await apiClient.delete("/auth/delete-profile");
    return response.data;
  },
};

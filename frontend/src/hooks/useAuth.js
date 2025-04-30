import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../lib/api/authApi";
import { toast } from "react-hot-toast";
import { initializeSocket, disconnectSocket } from "../lib/socket/socketClient";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
      initializeSocket(token);
    }
  }, []);

  const { isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: authApi.getProfile,
    enabled: isAuthenticated,
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
    },
    onError: () => {
      logout();
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      initializeSocket(data.token);
      toast.success(data.message || "Login successful");
      navigate("/chats");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      initializeSocket(data.token);
      toast.success(data.message || "Registration successful");
      navigate("/chats");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Registration failed");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(data.message || "Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Profile update failed");
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      logout();
      toast.success("Account deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete account");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
    },
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    disconnectSocket();
    queryClient.clear();
    navigate("/login");
  };

  return {
    user,
    isAuthenticated,
    isLoading: profileLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: () => logoutMutation.mutate(),
    updateProfile: updateProfileMutation.mutate,
    deleteAccount: () => deleteAccountMutation.mutate(),
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
    isUpdateLoading: updateProfileMutation.isPending,
    isDeleteLoading: deleteAccountMutation.isPending,
  };
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../lib/api/userApi";
import { toast } from "react-hot-toast";

export function useProfile() {
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateUserProfile,
    onSuccess: (data) => {
      toast.success(data.message || "Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      const user = data.user;
      localStorage.setItem("user", JSON.stringify(user));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update profile");
    },
  });

  return {
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
  };
}

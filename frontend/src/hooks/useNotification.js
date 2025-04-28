import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../lib/api/userApi";

export function useNotifications() {
  const queryClient = useQueryClient();

  const {
    data: notifications,
    isLoading: isNotificationsLoading,
    error: notificationsError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: userApi.getNotifications,
    staleTime: 1000 * 30, // 30 seconds
  });

  const {
    data: allCounts,
    isLoading: isCountsLoading,
    error: countsError,
  } = useQuery({
    queryKey: ["allNotificationCounts"],
    queryFn: userApi.getAllNotificationCounts,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute
  });

  const clearChatNotificationsMutation = useMutation({
    mutationFn: userApi.clearChatNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["allNotificationCounts"] });
    },
  });

  const messageCount = allCounts?.messageCount || 0;
  const contactRequestCount = allCounts?.contactRequestCount || 0;
  const totalCount = allCounts?.totalCount || 0;

  return {
    notifications: notifications?.notifications || [],
    messageCount,
    contactRequestCount,
    totalCount,
    isLoading: isNotificationsLoading || isCountsLoading,
    error: notificationsError || countsError,
    clearChatNotifications: clearChatNotificationsMutation.mutate,
    isClearing: clearChatNotificationsMutation.isPending,
  };
}

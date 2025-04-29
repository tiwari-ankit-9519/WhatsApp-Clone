import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "../lib/api/userApi";
import { useRef, useEffect } from "react";

export function useNotifications() {
  const queryClient = useQueryClient();
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  // Control how often we refetch notifications to prevent endless API calls
  const {
    data: notifications,
    isLoading: isNotificationsLoading,
    error: notificationsError,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: userApi.getNotifications,
    staleTime: 1000 * 60, // 1 minute - increased from 30 seconds
    refetchInterval: 1000 * 60 * 2, // 2 minutes
    retry: false, // Don't retry failed requests automatically
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  // Control notification counts fetching
  const {
    data: allCounts,
    isLoading: isCountsLoading,
    error: countsError,
  } = useQuery({
    queryKey: ["allNotificationCounts"],
    queryFn: userApi.getAllNotificationCounts,
    staleTime: 1000 * 60, // 1 minute - increased from 30 seconds
    refetchInterval: 1000 * 60 * 2, // 2 minutes - reduced frequency
    retry: false, // Don't retry failed requests
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const clearChatNotificationsMutation = useMutation({
    mutationFn: userApi.clearChatNotifications,
    onSuccess: () => {
      if (isMounted.current) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["allNotificationCounts"] });
      }
    },
  });

  // Set mounted flag and clean up on unmount
  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

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

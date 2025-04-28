import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contactApi } from "../lib/api/contactApi";
import { toast } from "react-hot-toast";

export function useContacts() {
  const queryClient = useQueryClient();

  const {
    data: contacts,
    isLoading: isContactsLoading,
    error: contactsError,
  } = useQuery({
    queryKey: ["contacts"],
    queryFn: contactApi.getContacts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    data: pendingRequests,
    isLoading: isPendingLoading,
    error: pendingError,
  } = useQuery({
    queryKey: ["pendingRequests"],
    queryFn: contactApi.getPendingRequests,
    staleTime: 1000 * 60 * 1, // 1 minute
  });

  const {
    data: blockedContacts,
    isLoading: isBlockedLoading,
    error: blockedError,
  } = useQuery({
    queryKey: ["blockedContacts"],
    queryFn: contactApi.getBlockedContacts,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const sendRequestMutation = useMutation({
    mutationFn: contactApi.sendContactRequest,
    onSuccess: (data) => {
      toast.success(data.message || "Contact request sent");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to send contact request"
      );
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: contactApi.acceptContactRequest,
    onSuccess: (data) => {
      toast.success(data.message || "Contact request accepted");
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to accept contact request"
      );
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: contactApi.rejectContactRequest,
    onSuccess: (data) => {
      toast.success(data.message || "Contact request rejected");
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to reject contact request"
      );
    },
  });

  const blockContactMutation = useMutation({
    mutationFn: contactApi.blockContact,
    onSuccess: (data) => {
      toast.success(data.message || "Contact blocked");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["blockedContacts"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to block contact");
    },
  });

  const unblockContactMutation = useMutation({
    mutationFn: contactApi.unblockContact,
    onSuccess: (data) => {
      toast.success(data.message || "Contact unblocked");
      queryClient.invalidateQueries({ queryKey: ["blockedContacts"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to unblock contact");
    },
  });

  const searchUsersMutation = useMutation({
    mutationFn: contactApi.searchUsers,
  });

  const markContactRequestsViewedMutation = useMutation({
    mutationFn: contactApi.markContactRequestsViewed,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return {
    contacts,
    pendingRequests,
    blockedContacts,
    isContactsLoading,
    isPendingLoading,
    isBlockedLoading,
    contactsError,
    pendingError,
    blockedError,
    sendRequest: sendRequestMutation.mutate,
    acceptRequest: acceptRequestMutation.mutate,
    rejectRequest: rejectRequestMutation.mutate,
    blockContact: blockContactMutation.mutate,
    unblockContact: unblockContactMutation.mutate,
    searchUsers: searchUsersMutation.mutateAsync,
    markContactRequestsViewed: markContactRequestsViewedMutation.mutate,
    isSendingRequest: sendRequestMutation.isPending,
    isAcceptingRequest: acceptRequestMutation.isPending,
    isRejectingRequest: rejectRequestMutation.isPending,
    isBlockingContact: blockContactMutation.isPending,
    isUnblockingContact: unblockContactMutation.isPending,
    isSearchingUsers: searchUsersMutation.isPending,
    searchResults: searchUsersMutation.data?.users || [],
    searchError: searchUsersMutation.error,
  };
}

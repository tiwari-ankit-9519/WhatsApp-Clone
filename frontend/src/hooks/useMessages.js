import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { messageApi } from "../lib/api/messageApi";
import { toast } from "react-hot-toast";
import { useRef, useEffect } from "react";

export function useMessages(chatId) {
  const queryClient = useQueryClient();
  const isMounted = useRef(true);

  // Set mounted flag and clean up on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["messages", chatId],
    queryFn: ({ pageParam = 1 }) => messageApi.getMessages(chatId, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: !!chatId, // Only run query if chatId exists
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1, // Only retry once
  });

  const allMessages = data?.pages.flatMap((page) => page.messages) || [];

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, type, parentId }) =>
      messageApi.sendMessage(chatId, content, type, parentId),
    onSuccess: (newMessage) => {
      if (!isMounted.current) return;

      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old)
          return { pages: [{ messages: [newMessage] }], pageParams: [1] };

        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [newMessage, ...newPages[0].messages],
        };

        return {
          ...old,
          pages: newPages,
        };
      });
    },
    onError: (error) => {
      if (isMounted.current) {
        toast.error(error.response?.data?.message || "Failed to send message");
      }
    },
  });

  const sendMediaMessageMutation = useMutation({
    mutationFn: ({ file, content, type }) =>
      messageApi.sendMediaMessage(chatId, file, type, content),
    onSuccess: (newMessage) => {
      if (!isMounted.current) return;

      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old)
          return { pages: [{ messages: [newMessage] }], pageParams: [1] };

        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [newMessage, ...newPages[0].messages],
        };

        return {
          ...old,
          pages: newPages,
        };
      });
    },
    onError: (error) => {
      if (isMounted.current) {
        toast.error(error.response?.data?.message || "Failed to send media");
      }
    },
  });

  const reactToMessageMutation = useMutation({
    mutationFn: ({ messageId, emoji, previousEmoji }) => {
      // If emoji is null and previousEmoji exists, we're removing a reaction
      if (emoji === null && previousEmoji) {
        // API call to remove reaction
        return messageApi.removeReactionFromMessage(messageId, previousEmoji);
      }
      // Otherwise add/change reaction
      return messageApi.reactToMessage(messageId, emoji);
    },
    onMutate: async ({ messageId, emoji, previousEmoji }) => {
      // Optimistic update to add/remove reaction
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return old;

        const newPages = old.pages.map((page) => {
          return {
            ...page,
            messages: page.messages.map((msg) => {
              if (msg.id === messageId) {
                // Get current reactions or initialize empty array
                let reactions = [...(msg.reactions || [])];

                // If removing reaction
                if (emoji === null && previousEmoji) {
                  reactions = reactions.filter(
                    (r) =>
                      !(
                        r.userId ===
                          queryClient.getQueryData(["profile"])?.user?.id &&
                        r.emoji === previousEmoji
                      )
                  );
                }
                // If adding reaction
                else {
                  // Remove any existing reaction from this user
                  reactions = reactions.filter(
                    (r) =>
                      r.userId !==
                      queryClient.getQueryData(["profile"])?.user?.id
                  );

                  // Add new reaction
                  reactions.push({
                    userId: queryClient.getQueryData(["profile"])?.user?.id,
                    emoji: emoji,
                    createdAt: new Date().toISOString(),
                  });
                }

                return {
                  ...msg,
                  reactions,
                };
              }
              return msg;
            }),
          };
        });

        return {
          ...old,
          pages: newPages,
        };
      });
    },
    onSuccess: () => {
      if (isMounted.current) {
        // We don't need to update the UI again as we've already done the optimistic update
      }
    },
    onError: (error) => {
      if (isMounted.current) {
        toast.error(
          error.response?.data?.message || "Failed to react to message"
        );
        // Revert optimistic update by refetching
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId, deleteType }) =>
      messageApi.deleteMessage(messageId, deleteType),
    onMutate: async ({ messageId, deleteType }) => {
      // Optimistic update for "FOR_ME" deletion
      if (deleteType === "FOR_ME") {
        queryClient.setQueryData(["messages", chatId], (old) => {
          if (!old) return old;

          const newPages = old.pages.map((page) => ({
            ...page,
            messages:
              deleteType === "FOR_ME"
                ? // For "FOR_ME", remove from local state
                  page.messages.filter((msg) => msg.id !== messageId)
                : // For "FOR_EVERYONE", mark as deleted
                  page.messages.map((msg) => {
                    if (msg.id === messageId) {
                      return {
                        ...msg,
                        deleted: true,
                        deletedByUserId: queryClient.getQueryData(["profile"])
                          ?.user?.id,
                      };
                    }
                    return msg;
                  }),
          }));

          return {
            ...old,
            pages: newPages,
          };
        });
      }
    },
    onSuccess: (data, variables) => {
      if (!isMounted.current) return;

      // For "FOR_EVERYONE", we should invalidate queries to get updated message from server
      if (variables.deleteType === "FOR_EVERYONE") {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }
      toast.success(data.message || "Message deleted");
    },
    onError: (error) => {
      if (isMounted.current) {
        toast.error(
          error.response?.data?.message || "Failed to delete message"
        );
        // Revert optimistic update by refetching
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }
    },
  });

  const forwardMessageMutation = useMutation({
    mutationFn: ({ messageId, chatIds }) =>
      messageApi.forwardMessage(messageId, chatIds),
    onSuccess: (data) => {
      if (!isMounted.current) return;

      toast.success(`Message forwarded to ${data.totalForwarded} chats`);
      if (data.failedForwards.length > 0) {
        toast.error(`Failed to forward to ${data.failedForwards.length} chats`);
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      if (isMounted.current) {
        toast.error(
          error.response?.data?.message || "Failed to forward message"
        );
      }
    },
  });

  const starMessageMutation = useMutation({
    mutationFn: ({ messageId, note }) =>
      messageApi.starMessage(messageId, note),
    onMutate: async ({ messageId }) => {
      // Optimistic update to mark message as starred
      // No UI change in the messages list, just return for tracking
      return { messageId };
    },
    onSuccess: (data) => {
      if (isMounted.current) {
        toast.success(data.message || "Message starred");
        queryClient.invalidateQueries({ queryKey: ["starredMessages"] });
      }
    },
    onError: (error) => {
      if (isMounted.current) {
        toast.error(error.response?.data?.message || "Failed to star message");
      }
    },
  });

  const unstarMessageMutation = useMutation({
    mutationFn: (messageId) => messageApi.unstarMessage(messageId),
    onSuccess: (data) => {
      if (isMounted.current) {
        toast.success(data.message || "Message unstarred");
        queryClient.invalidateQueries({ queryKey: ["starredMessages"] });
      }
    },
    onError: (error) => {
      if (isMounted.current) {
        toast.error(
          error.response?.data?.message || "Failed to unstar message"
        );
      }
    },
  });

  const searchMessagesMutation = useMutation({
    mutationFn: ({ query, chatId: searchChatId = null }) =>
      messageApi.searchMessages(query, searchChatId),
  });

  return {
    messages: allMessages,
    isLoading,
    error,
    loadMoreMessages: fetchNextPage,
    hasMoreMessages: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    sendMessage: sendMessageMutation.mutateAsync,
    sendMediaMessage: sendMediaMessageMutation.mutateAsync,
    reactToMessage: reactToMessageMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    forwardMessage: forwardMessageMutation.mutate,
    starMessage: starMessageMutation.mutate,
    unstarMessage: unstarMessageMutation.mutate,
    searchMessages: searchMessagesMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    isSendingMedia: sendMediaMessageMutation.isPending,
    isReacting: reactToMessageMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
    isForwarding: forwardMessageMutation.isPending,
    isStarring: starMessageMutation.isPending,
    isUnstarring: unstarMessageMutation.isPending,
    isSearching: searchMessagesMutation.isPending,
    searchResults: searchMessagesMutation.data,
    searchError: searchMessagesMutation.error,
  };
}

export function useStarredMessages() {
  const isMounted = useRef(true);

  // Set mounted flag and clean up on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["starredMessages"],
    queryFn: ({ pageParam = 1 }) => messageApi.getStarredMessages(pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage?.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const starredMessages =
    data?.pages.flatMap((page) => page.starredMessages) || [];

  return {
    starredMessages,
    isLoading,
    error,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
  };
}

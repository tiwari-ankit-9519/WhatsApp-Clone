import {
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { messageApi } from "../lib/api/messageApi";
import { toast } from "react-hot-toast";

export function useMessages(chatId) {
  const queryClient = useQueryClient();

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
      if (lastPage.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    enabled: !!chatId,
  });

  const allMessages = data?.pages.flatMap((page) => page.messages) || [];

  const sendMessageMutation = useMutation({
    mutationFn: ({ content, type, parentId }) =>
      messageApi.sendMessage(chatId, content, type, parentId),
    onSuccess: (newMessage) => {
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
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  const sendMediaMessageMutation = useMutation({
    mutationFn: ({ file, content, type }) =>
      messageApi.sendMediaMessage(chatId, file, type, content),
    onSuccess: (newMessage) => {
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
      toast.error(error.response?.data?.message || "Failed to send media");
    },
  });

  const reactToMessageMutation = useMutation({
    mutationFn: ({ messageId, emoji }) =>
      messageApi.reactToMessage(messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to react to message"
      );
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: ({ messageId, deleteType }) =>
      messageApi.deleteMessage(messageId, deleteType),
    onSuccess: (data, variables) => {
      if (variables.deleteType === "FOR_ME") {
        queryClient.setQueryData(["messages", chatId], (old) => {
          if (!old) return old;

          const newPages = old.pages.map((page) => ({
            ...page,
            messages: page.messages.filter(
              (msg) => msg.id !== variables.messageId
            ),
          }));

          return {
            ...old,
            pages: newPages,
          };
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
      }
      toast.success(data.message || "Message deleted");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete message");
    },
  });

  const forwardMessageMutation = useMutation({
    mutationFn: ({ messageId, chatIds }) =>
      messageApi.forwardMessage(messageId, chatIds),
    onSuccess: (data) => {
      toast.success(`Message forwarded to ${data.totalForwarded} chats`);
      if (data.failedForwards.length > 0) {
        toast.error(`Failed to forward to ${data.failedForwards.length} chats`);
      }
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to forward message");
    },
  });

  const starMessageMutation = useMutation({
    mutationFn: ({ messageId, note }) =>
      messageApi.starMessage(messageId, note),
    onSuccess: (data) => {
      toast.success(data.message || "Message starred");
      queryClient.invalidateQueries({ queryKey: ["starredMessages"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to star message");
    },
  });

  const unstarMessageMutation = useMutation({
    mutationFn: (messageId) => messageApi.unstarMessage(messageId),
    onSuccess: (data) => {
      toast.success(data.message || "Message unstarred");
      queryClient.invalidateQueries({ queryKey: ["starredMessages"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to unstar message");
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
    sendMessage: sendMessageMutation.mutate,
    sendMediaMessage: sendMediaMessageMutation.mutate,
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
      if (lastPage.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
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

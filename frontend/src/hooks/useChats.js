import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../lib/api/chatApi";
import { toast } from "react-hot-toast";

export function useChats() {
  const queryClient = useQueryClient();

  const {
    data: chats,
    isLoading: isChatsLoading,
    error: chatsError,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: chatApi.getChats,
    staleTime: 1000 * 60 * 1,
  });

  const createPrivateChatMutation = useMutation({
    mutationFn: chatApi.createPrivateChat,
    onSuccess: (newChat) => {
      queryClient.setQueryData(["chats"], (oldChats) => {
        if (!oldChats) return [newChat];
        return [newChat, ...oldChats.filter((chat) => chat.id !== newChat.id)];
      });
      return newChat;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create chat");
    },
  });

  const createGroupChatMutation = useMutation({
    mutationFn: ({ name, participantsIds, groupIcon }) =>
      chatApi.createGroupChat(name, participantsIds, groupIcon),
    onSuccess: (newChat) => {
      queryClient.setQueryData(["chats"], (oldChats) => {
        if (!oldChats) return [newChat];
        return [newChat, ...oldChats];
      });
      toast.success("Group chat created successfully");
      return newChat;
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to create group chat"
      );
    },
  });

  const useChatDetails = (chatId) => {
    const {
      data: chat,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["chat", chatId],
      queryFn: () => chatApi.getChatById(chatId),
      enabled: !!chatId,
      staleTime: 1000 * 60 * 1,
    });

    const markAsDeliveredMutation = useMutation({
      mutationFn: () => chatApi.markMessagesAsDelivered(chatId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
      },
    });

    const markAsReadMutation = useMutation({
      mutationFn: () => chatApi.markMessagesAsRead(chatId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
    });

    return {
      chat,
      isLoading,
      error,
      markAsDelivered: () => markAsDeliveredMutation.mutate(),
      markAsRead: () => markAsReadMutation.mutate(),
      isMarkingDelivered: markAsDeliveredMutation.isPending,
      isMarkingRead: markAsReadMutation.isPending,
    };
  };

  const getOrCreatePrivateChat = async (userId) => {
    const existingChat = chats?.find(
      (chat) =>
        chat.type === "PRIVATE" && chat.users.some((u) => u.user.id === userId)
    );

    if (existingChat) {
      return existingChat;
    }

    return createPrivateChatMutation.mutateAsync(userId);
  };

  return {
    chats,
    isChatsLoading,
    chatsError,
    createPrivateChat: createPrivateChatMutation.mutate,
    createGroupChat: createGroupChatMutation.mutate,
    getOrCreatePrivateChat,
    isCreatingPrivateChat: createPrivateChatMutation.isPending,
    isCreatingGroupChat: createGroupChatMutation.isPending,
    useChatDetails,
  };
}

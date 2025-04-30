import { QueryClient } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
    },
  },
});

export default queryClient;

export const invalidateChats = () => {
  return queryClient.invalidateQueries({ queryKey: ["chats"] });
};

export const invalidateChat = (chatId) => {
  return queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
};

export const invalidateMessages = (chatId) => {
  return queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
};

export const invalidateContacts = () => {
  return queryClient.invalidateQueries({ queryKey: ["contacts"] });
};

export const invalidateProfile = () => {
  return queryClient.invalidateQueries({ queryKey: ["profile"] });
};

export const invalidateAll = () => {
  return queryClient.invalidateQueries();
};

export const handleSocketEvent = (event, data) => {
  // Get current user ID outside of case blocks
  const currentUserId = queryClient.getQueryData(["profile"])?.user?.id;

  switch (event) {
    case "new-message": {
      // Determine if this is my own message
      const isMyMessage = data.message.senderId === currentUserId;

      // IMPORTANT: Skip adding the message if this is from the current user
      // This prevents duplicate messages for senders
      if (isMyMessage) {
        // Only update the chat list for better ordering, but don't add the message again
        queryClient.setQueryData(["chats"], (oldData) => {
          if (!oldData) return oldData;

          // Find the chat
          const chatToUpdateIndex = oldData.findIndex(
            (chat) => chat.id === data.chatId
          );
          if (chatToUpdateIndex === -1) return oldData;

          const chatToUpdate = oldData[chatToUpdateIndex];

          // Create updated chat with timestamp update but do not modify messages
          const updatedChat = {
            ...chatToUpdate,
            updatedAt: new Date().toISOString(),
          };

          // Create a new array with updated chat at the beginning
          const newChats = [...oldData];
          newChats.splice(chatToUpdateIndex, 1); // Remove the old chat
          newChats.unshift(updatedChat); // Add the updated chat at the beginning

          return newChats;
        });

        // Skip updating messages for the sender
        break;
      }

      // For recipients only (not the sender of the message)
      // Update messages data
      queryClient.setQueryData(["messages", data.chatId], (oldData) => {
        if (!oldData) {
          return {
            pages: [
              {
                messages: [data.message],
              },
            ],
            pageParams: [1],
          };
        }

        // Check if message already exists
        let messageExists = false;
        for (const page of oldData.pages) {
          for (const msg of page.messages) {
            if (msg.id === data.message.id) {
              messageExists = true;
              break;
            }
          }
          if (messageExists) break;
        }

        if (messageExists) return oldData;

        // Create new pages array with message added to first page
        const newPages = [...oldData.pages];
        if (newPages.length > 0 && newPages[0].messages) {
          newPages[0] = {
            ...newPages[0],
            messages: [...newPages[0].messages, data.message],
          };
        }

        return {
          ...oldData,
          pages: newPages,
        };
      });

      // Update chats list for recipients
      queryClient.setQueryData(["chats"], (oldData) => {
        if (!oldData) return oldData;

        // Find the chat
        const chatToUpdateIndex = oldData.findIndex(
          (chat) => chat.id === data.chatId
        );
        if (chatToUpdateIndex === -1) return oldData;

        const chatToUpdate = oldData[chatToUpdateIndex];

        // Create updated chat with new message
        const updatedChat = {
          ...chatToUpdate,
          messages: [data.message, ...(chatToUpdate.messages || [])].slice(
            0,
            1
          ),
          updatedAt: new Date().toISOString(),
          // Always increment unread count for recipient
          unreadCount: (chatToUpdate.unreadCount || 0) + 1,
        };

        // Create a new array with updated chat at the beginning
        const newChats = [...oldData];
        newChats.splice(chatToUpdateIndex, 1); // Remove the old chat
        newChats.unshift(updatedChat); // Add the updated chat at the beginning

        return newChats;
      });

      // Update notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["allNotificationCounts"] });
      break;
    }

    case "message-deleted": {
      queryClient.setQueryData(["messages", data.chatId], (oldData) => {
        if (!oldData) return oldData;

        // Handle messages in all pages
        const newPages = oldData.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => {
            if (msg.id === data.messageId) {
              return {
                ...msg,
                deleted: true,
                deletedByUserId: data.deletedByUserId,
              };
            }
            return msg;
          }),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });
      break;
    }

    case "message-reaction": {
      queryClient.setQueryData(["messages", data.chatId], (oldData) => {
        if (!oldData) return oldData;

        // Handle reactions in all pages
        const newPages = oldData.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => {
            if (msg.id === data.messageId) {
              let reactions = [...(msg.reactions || [])];

              if (data.action === "added") {
                reactions.push(data.reaction);
              } else if (data.action === "removed") {
                reactions = reactions.filter(
                  (r) =>
                    !(
                      r.userId === data.userId &&
                      r.emoji === data.reaction.emoji
                    )
                );
              }

              return {
                ...msg,
                reactions,
              };
            }
            return msg;
          }),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });
      break;
    }

    case "new-chat": {
      queryClient.setQueryData(["chats"], (oldData) => {
        if (!oldData) return [data.chat];

        // Check if chat already exists
        const chatExists = oldData.some((chat) => chat.id === data.chat.id);
        if (chatExists) return oldData;

        // Add the new chat at the beginning
        return [data.chat, ...oldData];
      });
      break;
    }

    case "messages-read": {
      if (!data.chatId || !data.messageIds || !data.readByUserId) break;

      // Update read status in messages
      queryClient.setQueryData(["messages", data.chatId], (oldData) => {
        if (!oldData) return oldData;

        const newPages = oldData.pages.map((page) => ({
          ...page,
          messages: page.messages.map((msg) => {
            if (data.messageIds.includes(msg.id)) {
              return {
                ...msg,
                statuses: (msg.statuses || []).map((status) => {
                  if (status.userId === data.readByUserId) {
                    return { ...status, status: "READ" };
                  }
                  return status;
                }),
              };
            }
            return msg;
          }),
        }));

        return {
          ...oldData,
          pages: newPages,
        };
      });

      // Reset unread count in chats
      queryClient.setQueryData(["chats"], (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((chat) => {
          if (chat.id === data.chatId && chat.unreadCount) {
            return {
              ...chat,
              unreadCount: 0,
            };
          }
          return chat;
        });
      });
      break;
    }

    default:
      break;
  }
};

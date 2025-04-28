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
  switch (event) {
    case "new-message":
      queryClient.setQueryData(["messages", data.chatId], (oldData) => {
        if (!oldData || !oldData.messages) return oldData;

        const messageExists = oldData.messages.some(
          (msg) => msg.id === data.message.id
        );
        if (messageExists) return oldData;

        return {
          ...oldData,
          messages: [...oldData.messages, data.message],
        };
      });

      queryClient.setQueryData(["chats"], (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((chat) => {
          if (chat.id === data.chatId) {
            return {
              ...chat,
              messages: [data.message, ...(chat.messages || [])].slice(0, 1),
              updatedAt: new Date().toISOString(),
            };
          }
          return chat;
        });
      });
      break;

    case "message-deleted":
      queryClient.setQueryData(["messages", data.chatId], (oldData) => {
        if (!oldData || !oldData.messages) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.map((msg) => {
            if (msg.id === data.messageId) {
              return {
                ...msg,
                deleted: true,
                deletedByUserId: data.deletedByUserId,
              };
            }
            return msg;
          }),
        };
      });
      break;

    case "message-reaction":
      queryClient.setQueryData(["messages", data.chatId], (oldData) => {
        if (!oldData || !oldData.messages) return oldData;

        return {
          ...oldData,
          messages: oldData.messages.map((msg) => {
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
        };
      });
      break;

    case "new-chat":
      queryClient.setQueryData(["chats"], (oldData) => {
        if (!oldData) return [data.chat];
        return [data.chat, ...oldData];
      });
      break;

    case "user-typing":
      break;

    default:
      console.log("Unhandled socket event:", event, data);
  }
};

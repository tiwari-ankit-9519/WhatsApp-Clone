import React, { useEffect, useRef, useState, useMemo } from "react";
import { useTheme } from "../theme-provider";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages, markMessagesAsRead } from "../../state/chat";
import MessageBubble from "./MessageBubble";

const ChatMessages = ({ chatId }) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { typingUsers } = useChat();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [initialScrollDone, setInitialScrollDone] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["messages", chatId],
      queryFn: ({ pageParam = 1 }) => getMessages(chatId, pageParam),
      getNextPageParam: (lastPage) => {
        // Ensure lastPage exists and has the expected structure
        if (!lastPage || !lastPage.pagination) {
          return undefined;
        }

        // Check if there are more pages
        if (lastPage.pagination.hasMore) {
          const currentPage = lastPage.pagination.page || 1;
          return currentPage + 1;
        }

        return undefined;
      },
      keepPreviousData: true,
      staleTime: 1000 * 5,
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 10,
      // Add retry logic with backoff
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });

  // Use useMemo to wrap the allMessages initialization
  const allMessages = useMemo(() => {
    if (!data) return [];

    // Combine all messages from all pages and sort by creation date (newest messages first in original data)
    const messages = data.pages.flatMap((page) => page.messages || []);

    // When we display, we need to reverse so newest messages are at the bottom
    return [...messages].reverse();
  }, [data]);

  useEffect(() => {
    if (chatId && allMessages.length > 0) {
      markMessagesAsRead(chatId);
    }
  }, [chatId, allMessages]);

  useEffect(() => {
    if (
      allMessages.length > 0 &&
      messagesEndRef.current &&
      isScrolledToBottom &&
      !isFetchingNextPage
    ) {
      messagesEndRef.current.scrollIntoView({
        behavior: initialScrollDone ? "smooth" : "auto",
      });
      if (!initialScrollDone) {
        setInitialScrollDone(true);
      }
    }
  }, [allMessages, initialScrollDone, isFetchingNextPage, isScrolledToBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsScrolledToBottom(isAtBottom);

    if (scrollTop < 50 && !isFetchingNextPage && hasNextPage) {
      const scrollPosition = scrollHeight - scrollTop;
      fetchNextPage().then(() => {
        if (messagesContainerRef.current) {
          const newScrollHeight = messagesContainerRef.current.scrollHeight;
          messagesContainerRef.current.scrollTop =
            newScrollHeight - scrollPosition;
        }
      });
    }
  };

  const groupMessagesByDate = (messages) => {
    return messages.reduce((groups, message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
  };

  const groupedMessages = groupMessagesByDate(allMessages);
  const isTyping = typingUsers[chatId]?.length > 0 || false;

  // Handler for reply functionality
  const handleReply = (replyToMessage) => {
    if (window.setParentMessage) {
      window.setParentMessage(replyToMessage);
    }
  };

  return (
    <div
      ref={messagesContainerRef}
      className={`
        flex-1 overflow-y-auto p-4 space-y-4
        ${isDark ? "bg-gray-900" : "bg-gray-100"}
      `}
      onScroll={handleScroll}
    >
      {isLoading && allMessages.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <div
            className={`
            animate-spin rounded-full h-8 w-8 border-b-2
            ${isDark ? "border-teal-500" : "border-teal-600"}
          `}
          ></div>
        </div>
      ) : (
        <>
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <div
                className={`
                animate-spin rounded-full h-5 w-5 border-b-2
                ${isDark ? "border-teal-500" : "border-teal-600"}
              `}
              ></div>
            </div>
          )}

          {Object.entries(groupedMessages).map(([date, messagesForDate]) => (
            <div key={date} className="space-y-1">
              <div className="flex justify-center">
                <span
                  className={`
                  px-3 py-1 text-xs rounded-full
                  ${
                    isDark
                      ? "bg-gray-800 text-gray-400"
                      : "bg-gray-200 text-gray-600"
                  }
                `}
                >
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {messagesForDate.map((message, index) => {
                const showAvatar =
                  index === 0 ||
                  messagesForDate[index - 1].senderId !== message.senderId;

                const isConsecutive =
                  index > 0 &&
                  messagesForDate[index - 1].senderId === message.senderId;

                const isOwnMessage = message.senderId === user?.id;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwnMessage={isOwnMessage}
                    showAvatar={showAvatar}
                    isConsecutive={isConsecutive}
                    onReply={handleReply}
                  />
                );
              })}
            </div>
          ))}

          {isTyping && (
            <div
              className={`
              flex items-center ml-12 p-3 rounded-lg max-w-[75%]
              ${isDark ? "bg-gray-800" : "bg-white"}
              rounded-tr-lg rounded-br-lg rounded-bl-lg rounded-tl-none
            `}
            >
              <div className="flex space-x-1">
                <div
                  className={`
                  w-2 h-2 rounded-full animate-bounce
                  ${isDark ? "bg-gray-400" : "bg-gray-500"}
                `}
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className={`
                  w-2 h-2 rounded-full animate-bounce
                  ${isDark ? "bg-gray-400" : "bg-gray-500"}
                `}
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className={`
                  w-2 h-2 rounded-full animate-bounce
                  ${isDark ? "bg-gray-400" : "bg-gray-500"}
                `}
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}

          <div id="messages-end" ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};

export default ChatMessages;

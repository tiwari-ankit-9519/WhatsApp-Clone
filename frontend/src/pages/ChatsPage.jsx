// ChatsPage.jsx
import React from "react";
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import { ChatProvider } from "../context/ChatContext";
import { SocketProvider } from "../context/SocketContext";
import ChatLayout from "../components/chat/ChatLayout";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";

const ChatsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Don't check isLoading here since we handle that in the App component
  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <SocketProvider>
      <ChatProvider>
        <Routes>
          <Route path="/" element={<ChatLayout />} />
          <Route path="/:chatId" element={<ChatWithParams />} />
        </Routes>
      </ChatProvider>
    </SocketProvider>
  );
};

const ChatWithParams = () => {
  const { chatId } = useParams();
  return <ChatLayout chatId={chatId} />;
};

export default ChatsPage;

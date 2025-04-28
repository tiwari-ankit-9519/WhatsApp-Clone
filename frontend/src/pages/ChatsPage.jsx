// ChatsPage.jsx
import { Routes, Route, useParams, useNavigate } from "react-router-dom";
import { ChatProvider } from "../context/ChatContext";
import { SocketProvider } from "../context/SocketContext";
import ChatLayout from "../components/chat/ChatLayout";
import ProfilePage from "./ProfilePage";
import SettingsPage from "./SettingsPage";
import { useAuth } from "../context/AuthContext";

const ChatsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  return (
    <SocketProvider>
      <ChatProvider>
        <Routes>
          <Route
            path="/profile"
            element={
              <ChatLayout showChatArea={false}>
                <ProfilePage />
              </ChatLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ChatLayout showChatArea={false}>
                <SettingsPage />
              </ChatLayout>
            }
          />
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

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./contexts/AuthContext";
import { lazy, Suspense } from "react";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ChatPage = lazy(() => import("./pages/chat/ChatPage"));
const ChatInfo = lazy(() => import("./pages/chat/ChatInfo"));
const ContactsPage = lazy(() => import("./pages/contacts/ContactsPage"));
const FindContactsPage = lazy(() =>
  import("./pages/contacts/FindContactsPage")
);
const ProfilePage = lazy(() => import("./pages/profile/ProfilePage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const MainLayout = lazy(() => import("./components/layout/MainLayout"));

const Loading = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthContext();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route
          path="/welcome"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/chats" replace />} />
          <Route path="chats" element={<ChatPage />} />
          <Route path="chats/:chatId" element={<ChatPage />} />
          <Route path="chats/:chatId/info" element={<ChatInfo />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="contacts/find" element={<FindContactsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;

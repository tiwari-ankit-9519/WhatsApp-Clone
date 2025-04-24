import {
  Route,
  Routes,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import ChatsPage from "./pages/ChatsPage";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useEffect } from "react";

// Create a React Query client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Main App component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthNavigationHandler />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// AuthNavigationHandler manages navigation based on auth state
function AuthNavigationHandler() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      const publicRoutes = ["/", "/login", "/register"];
      const currentPath = location.pathname;

      if (isAuthenticated && publicRoutes.includes(currentPath)) {
        navigate("/chats", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, location.pathname, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <AppRoutes />;
}

// App routes component
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/chats" replace /> : <LandingPage />
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/chats" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/chats" replace /> : <RegisterPage />
        }
      />

      {/* Protected routes */}
      <Route
        path="/chats/*"
        element={isAuthenticated ? <ChatsPage /> : <Navigate to="/" replace />}
      />

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

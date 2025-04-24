/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { userProfile, logoutUser } from "@/state/auth";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Initialize auth state from localStorage
  const initializeAuth = useCallback(async () => {
    setIsLoading(true);

    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return;
    }

    // Set token in axios headers
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Set initial authenticated state from localStorage
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Error parsing stored user", e);
      }
    }

    // Verify token with API call
    try {
      const response = await userProfile();

      if (response && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        localStorage.setItem("user", JSON.stringify(response.user));
      } else {
        // Invalid response from server
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common["Authorization"];
      }
    } catch (error) {
      console.error("Error verifying auth token:", error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up axios interceptor and initialize auth
  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Set up interceptor for handling 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setIsAuthenticated(false);
          delete axios.defaults.headers.common["Authorization"];
          queryClient.invalidateQueries({ queryKey: ["user"] });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [queryClient, initializeAuth]);

  // Login function - immediately updates auth state
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (localStorage.getItem("token")) {
        await logoutUser();
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete axios.defaults.headers.common["Authorization"];
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Expose auth state and functions
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshAuth: initializeAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

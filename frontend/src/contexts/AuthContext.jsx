/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { addUserUpdateListener } from "../lib/userUpdateHelper";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useAuth();

  // Listen for user updates from anywhere in the app
  useEffect(() => {
    const cleanup = addUserUpdateListener((userData) => {
      // Update the user state directly when notified
      auth.setUserDirectly(userData);
    });

    return cleanup;
  }, [auth]);

  if (auth.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from "react";
import authService, { User, LoginCredentials } from "../services/authService";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: "admin" | "editor") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authService.isAuthenticated()
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update auth state when localStorage changes
    const handleStorageChange = () => {
      setUser(authService.getCurrentUser());
      setIsAuthenticated(authService.isAuthenticated());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Use the authService login method with the credentials object
      const loggedInUser = await authService.login(credentials);

      if (loggedInUser) {
        setUser(loggedInUser);
        setIsAuthenticated(true);
      } else {
        throw new Error("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      setError(error.message || "Failed to log in");
      throw error; // Re-throw to allow the login page to handle the error
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const hasRole = (role: "admin" | "editor") => {
    return authService.hasRole(role);
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

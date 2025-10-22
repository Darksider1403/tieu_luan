import { createContext, useContext, useState, useEffect } from "react";
import { accountService } from "../services/accountService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = accountService.getToken();
    if (token) {
      const userData = accountService.getUser();
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const response = await accountService.login(credentials);
    if (response.success) {
      setUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    await accountService.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

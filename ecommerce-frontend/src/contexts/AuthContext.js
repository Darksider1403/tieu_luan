import React, { createContext, useContext, useState, useEffect } from "react";
import { accountService } from "../services/accountService";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    const response = await accountService.login(credentials);
    if (response.success) {
      setCurrentUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    await accountService.logout();
    setCurrentUser(null);
  };

  const register = async (userData) => {
    return await accountService.register(userData);
  };

  useEffect(() => {
    // Check if user is already logged in when app loads
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    login,
    logout,
    register,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

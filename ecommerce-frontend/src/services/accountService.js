import apiClient from "./apiService";

export const accountService = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/account/login", {
        username: credentials.username,
        password: credentials.password,
      });

      // Save token and user data to localStorage
      if (response.data.success && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        // Store role separately for easy access by chatbot
        if (response.data.user.role) {
          localStorage.setItem("role", response.data.user.role);
        }
      }

      return response.data;
    } catch (error) {
      // Log full error for debugging
      console.error("Login error details:", error.response?.data);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Login failed";

      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      try {
        await apiClient.post("/account/logout");
      } catch (error) {
        console.error("Logout API call failed:", error);
      }

      // Clear all local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");

      // Clear session storage if you use it
      sessionStorage.clear();

      return { success: true };
    } catch (error) {
      // Even if there's an error, clear local data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      sessionStorage.clear();

      throw new Error(error.response?.data?.error || "Logout failed");
    }
  },

  register: async (userData) => {
    try {
      const response = await apiClient.post("/account/register", {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        fullname: userData.fullname,
        numberPhone: userData.numberPhone,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get("/account/me");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to get user");
    }
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  getUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  verifyEmail: async (code) => {
    try {
      const response = await apiClient.get(
        `/account/verify-email?code=${code}`
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Email verification failed"
      );
    }
  },

  sendTestEmail: async (email) => {
    try {
      const response = await apiClient.post("/account/send-test-email", {
        email: email,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to send test email"
      );
    }
  },

  sendResetEmail: async (username, email) => {
    try {
      const response = await apiClient.post("/account/forgot-password", {
        username,
        email,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to send reset email"
      );
    }
  },

  resetPassword: async (code, password, repeatPassword) => {
    try {
      const response = await apiClient.post("/account/reset-password", {
        code,
        password,
        repeatPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to reset password"
      );
    }
  },

  verifyResetCode: async (code) => {
    try {
      const response = await apiClient.get(
        `/account/verify-reset-code?code=${code}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Invalid reset code");
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/account/${userId}`, {
        email: userData.email,
        fullname: userData.fullname,
        numberPhone: userData.numberPhone,
        status: userData.status,
        role: typeof userData.role === "string" 
          ? (userData.role === "Admin" ? 1 : 0) 
          : userData.role,
      });
      
      // Update localStorage if updating current user
      const currentUser = accountService.getUser();
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { 
          ...currentUser, 
          ...userData,
          role: typeof userData.role === "string" ? userData.role : (userData.role === 1 ? "Admin" : "User")
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to update user");
    }
  },
};

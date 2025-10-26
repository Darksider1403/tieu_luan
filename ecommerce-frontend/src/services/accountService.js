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
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  },

  logout: async () => {
    try {
      // Call logout endpoint (optional - can remove if you don't have one)
      try {
        await apiClient.post("/account/logout");
      } catch (error) {
        console.error("Logout API call failed:", error);
        // Continue anyway
      }

      // Clear all local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Clear session storage if you use it
      sessionStorage.clear();

      return { success: true };
    } catch (error) {
      // Even if there's an error, clear local data
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
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
    return !!localStorage.getItem("authToken");
  },

  getUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: () => {
    return localStorage.getItem("authToken");
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
};

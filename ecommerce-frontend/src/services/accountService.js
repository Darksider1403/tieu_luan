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
      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Optional: call logout endpoint if you have one
      await apiClient.post("/account/logout");

      return { success: true };
    } catch (error) {
      // Still clear local storage even if API call fails
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
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

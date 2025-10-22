import apiClient from "./apiService";

export const accountService = {
  login: async (credentials) => {
    try {
      const response = await apiClient.post("/account/login", {
        username: credentials.username,
        password: credentials.password,
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  },

  logout: async () => {
    try {
      const response = await apiClient.post("/account/logout");
      return response.data;
    } catch (error) {
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

  getAccount: async (id) => {
    try {
      const response = await apiClient.get(`/account/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || "Failed to get account");
    }
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

  // Add forgot password methods here
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

import apiClient from "./apiService";

export const chatbotService = {
  sendMessage: async (message) => {
    try {
      const response = await apiClient.post("/chatbot/chat", {
        message: message,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to send message to chatbot"
      );
    }
  },

  sendAdminMessage: async (message) => {
    try {
      const response = await apiClient.post("/chatbot/admin/chat", {
        message: message,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to send admin message"
      );
    }
  },

  getChatHistory: async () => {
    try {
      const response = await apiClient.get("/chatbot/history");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to get chat history"
      );
    }
  },

  testConnection: async () => {
    try {
      const response = await apiClient.get("/chatbot/test");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.error || "Failed to test chatbot connection"
      );
    }
  },
};

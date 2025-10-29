import apiClient from "./apiService";

export const orderService = {
  // Create a new order
  createOrder: async (orderData) => {
    try {
      const response = await apiClient.post("/order/create", orderData);
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  // Get user's orders
  getOrders: async () => {
    try {
      const response = await apiClient.get("/order/my-orders");
      return response.data;
    } catch (error) {
      console.error("Error fetching orders:", error);
      throw error;
    }
  },

  // Get single order details
  getOrderById: async (orderId) => {
    try {
      const response = await apiClient.get(`/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      const response = await apiClient.put(`/order/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error("Error canceling order:", error);
      throw error;
    }
  },
};

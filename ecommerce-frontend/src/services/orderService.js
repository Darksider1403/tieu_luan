import apiClient from "./apiService";

export const orderService = {
  async createOrder(orderData) {
    try {
      const response = await apiClient.post("/order", {
        address: `${orderData.address}, ${orderData.ward}, ${orderData.district}, ${orderData.city}`,
        phone: orderData.phone,
        email: orderData.email,
        fullName: orderData.fullName,
        notes: orderData.notes,
        paymentMethod: orderData.paymentMethod,
        totalAmount: orderData.totalAmount,
        shippingFee: orderData.shippingFee,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  },

  async createPayment(paymentRequest) {
    try {
      const response = await apiClient.post("/payment/vnpay", paymentRequest);
      return response.data;
    } catch (error) {
      console.error("Error creating VNPay payment:", error);
      throw error;
    }
  },

  async createMoMoPayment(paymentRequest) {
    try {
      const response = await apiClient.post("/payment/momo", paymentRequest);
      return response.data;
    } catch (error) {
      console.error("Error creating MoMo payment:", error);
      throw error;
    }
  },
  async getUserOrders() {
    try {
      const response = await apiClient.get("/order");
      return response.data;
    } catch (error) {
      console.error("Error getting user orders:", error);
      throw error;
    }
  },

  // Get single order details
  async getOrderById(orderId) {
    try {
      const response = await apiClient.get(`/order/${orderId}`);
      return response.data;
    } catch (error) {
      console.error("Error getting order:", error);
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

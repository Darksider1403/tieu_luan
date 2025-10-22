import apiClient from "./apiService";

export const cartService = {
  getCartSize: async () => {
    try {
      const response = await apiClient.get("/cart/size");
      return response.data.cartSize || 0;
    } catch (error) {
      console.error("Cart size error:", error);
      return 0;
    }
  },

  addToCart: async (productId, quantity = 1) => {
    try {
      const response = await apiClient.post("/cart/add", {
        productId,
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },

  getCartItems: async () => {
    try {
      const response = await apiClient.get("/cart");
      return response.data || [];
    } catch (error) {
      console.error("Error fetching cart items:", error);
      return [];
    }
  },

  removeFromCart: async (productId) => {
    try {
      const response = await apiClient.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  },

  clearCart: async () => {
    try {
      const response = await apiClient.delete("/cart/clear");
      return response.data;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      const response = await apiClient.put(`/cart/update/${productId}`, {
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  },
};

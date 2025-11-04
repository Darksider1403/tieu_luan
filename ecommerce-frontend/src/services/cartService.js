// cartService.js
import apiClient from "./apiService";

export const cartService = {
  async addToCart(productId, quantity = 1) {
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

  async getCartItems() {
    try {
      const response = await apiClient.get("/cart");
      return response.data;
    } catch (error) {
      console.error("Error fetching cart items:", error);
      // Return empty array instead of throwing to prevent UI crash
      return [];
    }
  },

  async updateQuantity(productId, quantity) {
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

  async removeFromCart(productId) {
    try {
      const response = await apiClient.delete(`/cart/remove/${productId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  },

  async clearCart() {
    try {
      const response = await apiClient.delete("/cart/clear");
      return response.data;
    } catch (error) {
      console.error("Error clearing cart:", error);
      throw error;
    }
  },

  async getCartSize() {
    try {
      const response = await apiClient.get("/cart/size");
      return response.data.cartSize || 0;
    } catch (error) {
      console.error("Error getting cart size:", error);
      return 0;
    }
  },
};

import apiClient from "./apiService";

export const productService = {
  getSliders: async () => {
    try {
      const response = await apiClient.get("/product/sliders");
      return response.data;
    } catch (error) {
      console.error("Error fetching sliders:", error);
      return [];
    }
  },

  getProduct: async (productId) => {
    try {
      const response = await apiClient.get(`/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  getProductsByCategory: async (categoryId, limit = 15) => {
    try {
      const response = await apiClient.get(
        `/product/category/${categoryId}?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  },

  getProductImages: async (productId) => {
    try {
      const response = await apiClient.get(`/product/${productId}/images`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product images:", error);
      return {};
    }
  },

  searchProducts: async (searchTerm) => {
    try {
      const response = await apiClient.get(
        `/product/search?term=${encodeURIComponent(searchTerm)}`
      );
      return response.data;
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  },

  addToCart: async (productId) => {
    try {
      const response = await apiClient.post("/cart/add", {
        productId,
        quantity: 1,
      });
      return response.data;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  },
};

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
};

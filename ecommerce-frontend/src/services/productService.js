import apiClient from "./apiService";

export const productService = {
  // Get all products (for admin only)
  getAllProductsAdmin: async () => {
    try {
      const response = await apiClient.get("/product/all");
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  // Get products with pagination (public endpoint - for regular users)
  getProducts: async (page = 0, pageSize = 12, category = 1, order = null, filter = null) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        category: category.toString(),
      });
      
      if (order) params.append('order', order);
      if (filter) params.append('filter', filter);
      
      const response = await apiClient.get(`/product?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw error;
    }
  },

  getAllProducts: async (limit = 500) => {
    try {
      const categoriesResponse = await apiClient.get("/product/categories");
      const categories = categoriesResponse.data;

      const categoryIds = Object.keys(categories).map(id => parseInt(id));
      
      console.log("Fetching products from all categories:", categoryIds);
      
      const promises = categoryIds.map(categoryId =>
        apiClient.get(`/product/category/${categoryId}?limit=${limit}`)
      );
      
      const responses = await Promise.all(promises);
      
      const allProducts = responses.flatMap(response => response.data);
      
      console.log(`Total products fetched: ${allProducts.length}`);
      
      return allProducts;
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw error;
    }
  },

  // Get single product by ID
  getProduct: async (productId) => {
    try {
      const response = await apiClient.get(`/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching product:", error);
      throw error;
    }
  },

  // Create product
  createProduct: async (productData) => {
    try {
      const response = await apiClient.post("/product", productData);
      return response.data;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  // Update product
  updateProduct: async (productId, productData) => {
    try {
      const response = await apiClient.put(
        `/product/${productId}`,
        productData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  // Delete product
  deleteProduct: async (productId) => {
    try {
      const response = await apiClient.delete(`/product/${productId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Update product status
  updateProductStatus: async (productId, status) => {
    try {
      const response = await apiClient.patch(`/product/${productId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating product status:", error);
      throw error;
    }
  },

  getSliders: async () => {
    try {
      const response = await apiClient.get("/product/sliders");
      return response.data;
    } catch (error) {
      console.error("Error fetching sliders:", error);
      return [];
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

  getCategories: async () => {
    try {
      const response = await apiClient.get("/product/categories");
      return response.data;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return {};
    }
  },

  rateProduct: async (productId, rating) => {
    try {
      const response = await apiClient.post("/product/rate", {
        productId,
        rating,
      });
      return response.data;
    } catch (error) {
      console.error("Error rating product:", error);
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

  getCart: async () => {
    try {
      const response = await apiClient.get("/cart");
      return response.data;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return [];
    }
  },

  updateCartItem: async (productId, quantity) => {
    try {
      const response = await apiClient.put("/cart/update", {
        productId,
        quantity,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating cart:", error);
      throw error;
    }
  },

  removeFromCart: async (productId) => {
    try {
      const response = await apiClient.delete(`/cart/${productId}`);
      return response.data;
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  },
};

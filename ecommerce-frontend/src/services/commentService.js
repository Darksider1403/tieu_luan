import apiClient from "./apiService";

const API_BASE_URL = "/ProductComment";

export const commentService = {
  // Get all comments for a product
  async getProductComments(productId, page = 1, pageSize = 20) {
    try {
      const response = await apiClient.get(
        `${API_BASE_URL}/product/${productId}?page=${page}&pageSize=${pageSize}`
      );
      return response.data || { comments: [], totalComments: 0 };
    } catch (error) {
      console.error("Error fetching comments:", error);
      throw error;
    }
  },

  // Create a new comment
  async createComment(productId, comment, parentId = null) {
    try {
      const response = await apiClient.post(API_BASE_URL, {
        productId,
        comment,
        parentId,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
  },

  // Update a comment
  async updateComment(commentId, comment) {
    try {
      const response = await apiClient.put(`${API_BASE_URL}/${commentId}`, {
        comment,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
  },

  // Delete a comment
  async deleteComment(commentId) {
    try {
      await apiClient.delete(`${API_BASE_URL}/${commentId}`);
      return true;
    } catch (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
  },

  // Mark comment as helpful
  async markAsHelpful(commentId) {
    try {
      const response = await apiClient.post(
        `${API_BASE_URL}/${commentId}/helpful`
      );
      return response.data;
    } catch (error) {
      console.error("Error marking as helpful:", error);
      throw error;
    }
  },

  // Unmark comment as helpful
  async unmarkAsHelpful(commentId) {
    try {
      const response = await apiClient.delete(
        `${API_BASE_URL}/${commentId}/helpful`
      );
      return response.data;
    } catch (error) {
      console.error("Error unmarking as helpful:", error);
      throw error;
    }
  },
};

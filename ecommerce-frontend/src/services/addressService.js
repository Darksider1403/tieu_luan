import apiClient from "./apiService";

const API_BASE_URL = "/address";

export const addressService = {
  async getProvinces() {
    try {
      const response = await apiClient.get(`${API_BASE_URL}/provinces`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return [];
    }
  },

  async getDistricts(provinceId) {
    try {
      if (!provinceId) return [];
      const response = await apiClient.get(
        `${API_BASE_URL}/districts/${provinceId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
  },

  async getWards(districtId) {
    try {
      if (!districtId) return [];
      const response = await apiClient.get(
        `${API_BASE_URL}/wards/${districtId}`
      );
      return response.data || [];
    } catch (error) {
      console.error("Error fetching wards:", error);
      return [];
    }
  },
};

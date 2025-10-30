import axios from "axios";

const PROVINCE_API_URL = "https://provinces.open-api.vn/api";

export const addressService = {
  // Get all provinces
  getProvinces: async () => {
    try {
      const response = await axios.get(`${PROVINCE_API_URL}/p/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return [];
    }
  },

  // Get districts by province code
  getDistricts: async (provinceCode) => {
    try {
      const response = await axios.get(
        `${PROVINCE_API_URL}/p/${provinceCode}?depth=2`
      );
      return response.data.districts || [];
    } catch (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
  },

  // Get wards by district code
  getWards: async (districtCode) => {
    try {
      const response = await axios.get(
        `${PROVINCE_API_URL}/d/${districtCode}?depth=2`
      );
      return response.data.wards || [];
    } catch (error) {
      console.error("Error fetching wards:", error);
      return [];
    }
  },

  // Search provinces by keyword
  searchProvinces: async (keyword) => {
    try {
      const response = await axios.get(
        `${PROVINCE_API_URL}/p/search/?q=${encodeURIComponent(keyword)}`
      );
      return response.data;
    } catch (error) {
      console.error("Error searching provinces:", error);
      return [];
    }
  },
};

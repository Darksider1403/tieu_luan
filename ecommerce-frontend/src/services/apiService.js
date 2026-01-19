import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); 
    console.log('=== API REQUEST ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Token exists:', !!token);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to Authorization header');
    } else {
      console.warn('⚠️ No token in localStorage');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle responses and token expiration
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401) {
      console.warn('⚠️ 401 Unauthorized - Clearing auth and redirecting to login');
      localStorage.removeItem("token");    
      localStorage.removeItem("user");
      localStorage.removeItem("role");      
      
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
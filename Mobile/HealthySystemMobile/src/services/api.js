import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Cấu hình thống nhất cho cả web và mobile
const API_BASE_URL = __DEV__ 
  ? 'https://nonevadingly-epidermal-vaughn.ngrok-free.dev/api'  // Development - IP máy tính cho mobile (updated)
  : 'http://localhost:5000/api';    // Production - cùng server

// Chú ý: Mobile cần sử dụng IP thật của máy, web có thể dùng localhost

console.log('API Base URL:', API_BASE_URL);

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Tăng timeout lên 30 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm token
api.interceptors.request.use(
  async (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token preview:', token ? token.substring(0, 50) + '...' : 'NO TOKEN');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('⚠️ No token found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi mạng
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.message);
    console.error('❌ API Error Code:', error.code);
    console.error('❌ API Error Config:', {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
    });
    
    // Xử lý các lỗi mạng phổ biến
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.error('Lỗi mạng: Không thể kết nối đến server. Vui lòng kiểm tra:');
      console.error('1. Điện thoại và máy tính có cùng WiFi không?');
      console.error('2. Backend có đang chạy không?');
      console.error('3. IP address có đúng không?', API_BASE_URL);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Lỗi kết nối: Server từ chối kết nối.');
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('Lỗi timeout: Request mất quá nhiều thời gian.');
    } else if (error.response) {
      console.error(`Server error: ${error.response.status} - ${error.response.statusText}`);
    }
    
    return Promise.reject(error);
  }
);

// Export trực tiếp axios instance
export default api;
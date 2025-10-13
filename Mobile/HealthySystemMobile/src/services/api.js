import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Cấu hình thống nhất cho cả web và mobile
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.68.119:5000/api'  // Development - IP máy tính cho mobile (updated)
  : 'http://localhost:5000/api';    // Production - cùng server

// Chú ý: Mobile cần sử dụng IP thật của máy, web có thể dùng localhost

console.log('API Base URL:', API_BASE_URL);

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
    
    // Xử lý các lỗi mạng phổ biến
    if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
      console.error('Lỗi mạng: Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và đảm bảo server đang chạy.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Lỗi kết nối: Server từ chối kết nối. Vui lòng kiểm tra địa chỉ API và cổng server.');
    } else if (error.response) {
      console.error(`Server error: ${error.response.status} - ${error.response.statusText}`);
    }
    
    return Promise.reject(error);
  }
);

// Export trực tiếp axios instance
export default api;
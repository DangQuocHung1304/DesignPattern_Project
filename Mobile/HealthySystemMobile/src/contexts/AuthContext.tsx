import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Define User interface
interface User {
  id: number;
  publicId: string;
  email: string;
  phone?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
}

// Define Auth Context interface
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from storage on mount
  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      setIsLoading(true);
      const [accessToken, userData] = await Promise.all([
        AsyncStorage.getItem('accessToken'),
        AsyncStorage.getItem('userData'),
      ]);

      if (accessToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('✅ User loaded from storage:', parsedUser.email);
      } else {
        console.log('❌ No user data found in storage');
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login for:', email);

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      console.log('📥 Login response:', response.data);

      // Backend trả về: { message, token, user }
      if (response.data && response.data.token) {
        const { token, user: userData } = response.data;

        // Save to AsyncStorage
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));

        // Update state
        setUser(userData);
        setIsAuthenticated(true);

        console.log('✅ Login successful:', userData.email);
        return { success: true };
      } else {
        console.log('❌ Login failed:', response.data.message);
        return {
          success: false,
          message: response.data.message || 'Đăng nhập thất bại',
        };
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Không thể kết nối đến server';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setIsLoading(true);
      console.log('📝 Attempting registration for:', userData.email);

      const response = await api.post('/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        role: 'patient', // Mobile app only supports patient registration
      });

      console.log('📥 Registration response:', response.data);

      // Backend trả về: { message, userId, email } với status 200 nếu thành công
      if (response.status === 200 && response.data) {
        console.log('✅ Registration successful');
        
        // Auto login after successful registration
        return await login(userData.email, userData.password);
      } else {
        console.log('❌ Registration failed:', response.data.message);
        return {
          success: false,
          message: response.data.message || 'Đăng ký thất bại',
        };
      }
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const message =
        error.response?.data?.message ||
        error.message ||
        'Không thể kết nối đến server';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out...');
      
      // Clear AsyncStorage
      await AsyncStorage.multiRemove(['accessToken', 'userData']);

      // Clear state
      setUser(null);
      setIsAuthenticated(false);

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshUserData = async () => {
    try {
      console.log('🔄 Refreshing user data...');
      
      const response = await api.get('/users/profile');

      if (response.data && response.data.success) {
        const userData = response.data.data;
        
        // Update AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        // Update state
        setUser(userData);
        
        console.log('✅ User data refreshed');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;

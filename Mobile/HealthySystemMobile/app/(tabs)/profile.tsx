import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const profileOptions = [
    {
      title: 'Thông tin cá nhân',
      icon: 'user',
      onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
    },
    {
      title: 'Lịch sử khám',
      icon: 'history',
      onPress: () => router.push('/medical-history' as any),
    },
    {
      title: 'Cài đặt',
      icon: 'cog',
      onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
    },
    {
      title: 'Trợ giúp',
      icon: 'question-circle',
      onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
    },
    {
      title: 'Đăng xuất',
      icon: 'sign-out',
      color: '#ff4757',
      onPress: handleLogout,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <FontAwesome name="user" size={50} color="white" />
        </View>
        <Text style={styles.userName}>
          {(user as any)?.name || (user as any)?.hoTen || 'Người dùng'}
        </Text>
        <Text style={styles.userEmail}>
          {(user as any)?.email || 'email@example.com'}
        </Text>
      </View>

      {/* Profile Options */}
      <View style={styles.section}>
        {profileOptions.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionItem,
              index === profileOptions.length - 1 && styles.lastItem,
            ]}
            onPress={option.onPress}
          >
            <View style={styles.optionLeft}>
              <FontAwesome
                name={option.icon as any}
                size={20}
                color={option.color || '#0066cc'}
              />
              <Text
                style={[
                  styles.optionText,
                  option.color && { color: option.color },
                ]}
              >
                {option.title}
              </Text>
            </View>
            <FontAwesome name="chevron-right" size={16} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.appVersion}>Phiên bản 1.0.0</Text>
        <Text style={styles.copyright}>
          © 2024 Hệ thống phòng khám. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  appVersion: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  copyright: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
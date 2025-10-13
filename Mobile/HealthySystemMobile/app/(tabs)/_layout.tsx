import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useAuth } from '../../src/contexts/AuthContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading screen
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            backgroundColor: 'white',
          },
          default: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
          },
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="specialties"
        options={{
          title: 'Chuyên khoa',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="hospital-o" color={color} />,
        }}
      />
      <Tabs.Screen
        name="doctors"
        options={{
          title: 'Bác sĩ',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user-md" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Lịch hẹn',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import api from '../src/services/api';

export default function DebugTokenScreen() {
  const [tokenInfo, setTokenInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      const info: any = {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'No token',
        hasRefreshToken: !!refreshToken,
      };

      // Try to decode JWT (basic decode)
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            info.decodedToken = {
              userId: payload.sub || payload.userId || 'N/A',
              email: payload.email || 'N/A',
              role: payload.role || 'N/A',
              exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A',
              isExpired: payload.exp ? Date.now() > payload.exp * 1000 : false,
            };
          }
        } catch {
          info.decodeError = 'Could not decode token';
        }
      }

      setTokenInfo(info);
    } catch (error) {
      console.error('Error checking token:', error);
    } finally {
      setLoading(false);
    }
  };

  const testAppointmentsAPI = async () => {
    try {
      Alert.alert('Testing...', 'Calling /api/appointments');
      const response = await api.get('/appointments');
      Alert.alert('Success!', `Got ${response.data.length} appointments`);
    } catch (error: any) {
      Alert.alert(
        'API Error',
        `Status: ${error.response?.status || 'N/A'}\nMessage: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const setDummyToken = async () => {
    // For testing - set a dummy token
    const dummyToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6InBhdGllbnQiLCJleHAiOjk5OTk5OTk5OTl9.dummy';
    await AsyncStorage.setItem('accessToken', dummyToken);
    Alert.alert('Success', 'Dummy token set! Refresh to see.');
    checkToken();
  };

  const clearToken = async () => {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    Alert.alert('Success', 'Tokens cleared! Refresh to see.');
    checkToken();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <FontAwesome name="bug" size={32} color="#0066cc" />
        <Text style={styles.title}>Token Debug Info</Text>
      </View>

      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Token Status</Text>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Has Token:</Text>
              <Text
                style={[
                  styles.value,
                  { color: tokenInfo.hasToken ? '#00cc66' : '#ff4444' },
                ]}
              >
                {tokenInfo.hasToken ? '✅ YES' : '❌ NO'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Token Length:</Text>
              <Text style={styles.value}>{tokenInfo.tokenLength}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Preview:</Text>
              <Text style={styles.valueSmall}>{tokenInfo.tokenPreview}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Has Refresh Token:</Text>
              <Text
                style={[
                  styles.value,
                  { color: tokenInfo.hasRefreshToken ? '#00cc66' : '#ff4444' },
                ]}
              >
                {tokenInfo.hasRefreshToken ? '✅ YES' : '❌ NO'}
              </Text>
            </View>
          </View>

          {tokenInfo.decodedToken && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Decoded Token</Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>User ID:</Text>
                <Text style={styles.value}>{tokenInfo.decodedToken.userId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{tokenInfo.decodedToken.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Role:</Text>
                <Text style={styles.value}>{tokenInfo.decodedToken.role}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Expires:</Text>
                <Text style={styles.valueSmall}>{tokenInfo.decodedToken.exp}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Is Expired:</Text>
                <Text
                  style={[
                    styles.value,
                    { color: tokenInfo.decodedToken.isExpired ? '#ff4444' : '#00cc66' },
                  ]}
                >
                  {tokenInfo.decodedToken.isExpired ? '❌ YES' : '✅ NO'}
                </Text>
              </View>
            </View>
          )}

          {tokenInfo.decodeError && (
            <View style={styles.errorBox}>
              <FontAwesome name="exclamation-triangle" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{tokenInfo.decodeError}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity style={styles.button} onPress={checkToken}>
              <FontAwesome name="refresh" size={16} color="white" />
              <Text style={styles.buttonText}>Refresh Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonTest]}
              onPress={testAppointmentsAPI}
            >
              <FontAwesome name="flask" size={16} color="white" />
              <Text style={styles.buttonText}>Test Appointments API</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonWarning]}
              onPress={setDummyToken}
            >
              <FontAwesome name="wrench" size={16} color="white" />
              <Text style={styles.buttonText}>Set Dummy Token (Test)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={clearToken}
            >
              <FontAwesome name="trash" size={16} color="white" />
              <Text style={styles.buttonText}>Clear All Tokens</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpBox}>
            <FontAwesome name="info-circle" size={20} color="#0066cc" />
            <Text style={styles.helpText}>
              If &quot;Has Token&quot; is NO, you need to login first. If token is expired,
              re-login to get a new one.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  valueSmall: {
    fontSize: 12,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  button: {
    backgroundColor: '#0066cc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  buttonTest: {
    backgroundColor: '#00cc66',
  },
  buttonWarning: {
    backgroundColor: '#ff9900',
  },
  buttonDanger: {
    backgroundColor: '#ff4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    flex: 1,
  },
  helpBox: {
    backgroundColor: '#e6f2ff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  helpText: {
    color: '#0066cc',
    fontSize: 13,
    flex: 1,
  },
});

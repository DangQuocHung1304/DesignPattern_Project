import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import api from '../services/api';

export default function NetworkTestScreen() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const testConnection = async () => {
    setTesting(true);
    setResults([]);
    const logs: string[] = [];

    // Test 1: Get base URL
    logs.push(`📡 Testing API: ${api.defaults.baseURL}`);
    setResults([...logs]);

    // Test 2: Specialties
    try {
      logs.push('🔍 Testing GET /specialties...');
      setResults([...logs]);
      
      const response = await api.get('/specialties');
      logs.push(`✅ Specialties: ${response.status} OK`);
      logs.push(`   Found ${response.data.length} specialties`);
    } catch (error: any) {
      logs.push(`❌ Specialties Error: ${error.code || error.message}`);
      if (error.response) {
        logs.push(`   Server responded: ${error.response.status}`);
      }
    }
    setResults([...logs]);

    // Test 3: Login
    try {
      logs.push('🔍 Testing POST /auth/login...');
      setResults([...logs]);
      
      const response = await api.post('/auth/login', {
        email: 'test@example.com',
        password: '123456',
      });
      logs.push(`✅ Login: ${response.status} OK`);
      logs.push(`   ${response.data.message}`);
    } catch (error: any) {
      logs.push(`❌ Login Error: ${error.code || error.message}`);
      if (error.response) {
        logs.push(`   Server: ${error.response.status} - ${error.response.data?.message}`);
      }
    }
    setResults([...logs]);

    logs.push('');
    logs.push('✨ Test completed!');
    setResults([...logs]);
    setTesting(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Network Test</Text>
        <Text style={styles.subtitle}>{api.defaults.baseURL}</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, testing && styles.buttonDisabled]}
        onPress={testConnection}
        disabled={testing}
      >
        {testing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Run Test</Text>
        )}
      </TouchableOpacity>

      <ScrollView style={styles.results}>
        {results.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2196F3',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#BBDEFB',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  results: {
    flex: 1,
    padding: 16,
  },
  logText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

import React from 'react';
import { SafeAreaView } from 'react-native';
import NetworkTestScreen from '../src/components/NetworkTestScreen';

export default function NetworkTest() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <NetworkTestScreen />
    </SafeAreaView>
  );
}
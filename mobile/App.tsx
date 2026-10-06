import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/presentation/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RNStatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      <StatusBar style="light" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

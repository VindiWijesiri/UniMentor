import React from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/presentation/navigation/RootNavigator';

// Expo Go on LAN often drops the Fast Refresh socket after the bundle loads.
// Metro is still serving the app; this only hides the yellow HMR banner.
if (__DEV__) {
  LogBox.ignoreLogs([/Cannot connect to Expo CLI/]);
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

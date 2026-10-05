import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../domain/stores/authStore';
import { hasSeenOnboarding, hydrateSession, markOnboardingSeen } from '../../domain/stores/sessionGate';
import UniMentorWordmark from '../components/UniMentorWordmark';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import StudyPresenceTracker from '../presence/StudyPresenceTracker';

export default function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [ready, setReady] = useState(false);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      const seen = await hasSeenOnboarding();
      await hydrateSession();
      if (!live) return;
      setOnboarded(seen);
      setReady(true);
    })();
    return () => { live = false; };
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <UniMentorWordmark tone="onLight" size={28} />
        <ActivityIndicator color="#102B5D" style={styles.spinner} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <>
          <StudyPresenceTracker />
          <AppNavigator />
        </>
      ) : onboarded ? (
        <AuthNavigator />
      ) : (
        <OnboardingScreen onDone={() => {
          void markOnboardingSeen();
          setOnboarded(true);
        }} />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, backgroundColor: '#F7F8FC', alignItems: 'center', justifyContent: 'center' },
  spinner: { marginTop: 18 },
});

import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

export default function RootNavigator() {
  const { isAuthenticated, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.word}>
          <Text style={styles.uni}>Uni</Text>
          <Text style={styles.mentor}>Mentor</Text>
        </Text>
        <ActivityIndicator color={colors.orange} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return <NavigationContainer>{isAuthenticated ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  word: { fontSize: 32, fontWeight: '800' },
  uni: { color: colors.white },
  mentor: { color: colors.orange },
});

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAuthStore } from '@domain/stores/authStore';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.name ?? 'there'} 👋</Text>
      <Text style={styles.subtitle}>Welcome to UniMentor</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 32 },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4 },
});

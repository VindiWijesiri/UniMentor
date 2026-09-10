import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useAuthStore } from '../../../domain/stores/authStore';
import { colors } from '../../../shared/theme';

export default function HomeScreen() {
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      {/* Header with logo */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name ?? 'there'} 👋</Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>
        </View>
        <Image
          source={require('../../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Quick stats */}
      <View style={styles.cardRow}>
        <View style={[styles.card, { backgroundColor: colors.primary }]}>
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardLabel}>Sessions</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.secondary }]}>
          <Text style={styles.cardValue}>0</Text>
          <Text style={styles.cardLabel}>Mentors</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Get Started</Text>
      <View style={styles.tip}>
        <Text style={styles.tipText}>
          🎓 Search for a mentor and book your first session to get started!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: 24 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 28,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textLight, marginTop: 2 },
  logo: { width: 48, height: 48 },
  cardRow: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  card: {
    flex: 1, borderRadius: 14, padding: 20, alignItems: 'center',
    shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  cardValue: { fontSize: 28, fontWeight: '800', color: colors.white },
  cardLabel: { fontSize: 13, color: colors.white, marginTop: 4, opacity: 0.9 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 },
  tip: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipText: { fontSize: 14, color: colors.text, lineHeight: 22 },
});

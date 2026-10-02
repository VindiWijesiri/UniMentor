import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../../domain/stores/authStore';

export default function AlertsScreen() {
  const role = useAuthStore((state) => state.user?.role);
  const isMentor = role === 'mentor';

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Text style={styles.eyebrow}>{isMentor ? 'TUTOR UPDATES' : 'STUDENT UPDATES'}</Text>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>
          {isMentor
            ? 'Booking requests and student messages will show up here.'
            : 'Session reminders and tutor replies will show up here.'}
        </Text>
      </View>
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>●</Text>
        </View>
        <Text style={styles.emptyTitle}>No alerts yet</Text>
        <Text style={styles.emptyText}>
          {isMentor
            ? 'You will be notified when students book or message you.'
            : 'You will be notified about bookings and learning updates.'}
        </Text>
      </View>
    </View>
  );
}

const navy = '#061F5C';
const yellow = '#FFD21C';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FC' },
  hero: {
    backgroundColor: navy,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#0A57CB',
    right: -85,
    top: -110,
    opacity: 0.56,
  },
  eyebrow: { color: yellow, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#C5D4EB', fontSize: 11.5, marginTop: 4, maxWidth: 280 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: '#FFF3BC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: { color: navy, fontSize: 18, fontWeight: '900' },
  emptyTitle: { color: navy, fontSize: 16, fontWeight: '900', marginTop: 12 },
  emptyText: { color: '#7C8AA1', fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});

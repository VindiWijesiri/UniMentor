import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../../domain/stores/authStore';
import PageHeader from '../../components/PageHeader';

export default function AlertsScreen() {
  const role = useAuthStore((state) => state.user?.role);
  const isMentor = role === 'mentor';

  return (
    <View style={styles.page}>
      <PageHeader title={isMentor ? 'Tutor Alerts' : 'Alerts'} />
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

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FC' },
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

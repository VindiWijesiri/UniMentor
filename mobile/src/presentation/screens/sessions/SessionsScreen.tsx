import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { Session } from '../../../domain/entities/Session';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, formatWhen, personName } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList> };

function tone(status: Session['status']) {
  if (status === 'confirmed') return 'success' as const;
  if (status === 'cancelled') return 'danger' as const;
  if (status === 'completed') return 'info' as const;
  return 'orange' as const;
}

export default function BookingsScreen({ navigation }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    sessionRepository
      .getMySessions()
      .then(setSessions)
      .catch((err) => setError(apiError(err)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout title="Bookings" activeTab="Bookings" showFooter={false} onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {role === 'student' ? (
        <PrimaryButton label="Find a mentor to book" onPress={() => navigation.navigate('Search')} />
      ) : (
        <PrimaryButton label="Verify booking" onPress={() => navigation.navigate('VerifyBooking')} />
      )}
      {sessions.map((item) => (
        <TouchableOpacity key={item._id} onPress={() => navigation.navigate('BookingDetail', { sessionId: item._id })}>
          <Card style={styles.card}>
            <View style={styles.row}>
              <Badge text={item.status} tone={tone(item.status)} />
              {item.verifiedAt ? <Badge text="Verified" tone="success" /> : null}
            </View>
            <Text style={styles.title}>{item.subject}</Text>
            <Text style={styles.meta}>
              {role === 'mentor' ? personName(item.studentId, 'Student') : personName(item.mentorId, 'Mentor')}
            </Text>
            <Text style={styles.meta}>{formatWhen(item.scheduledAt)}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!sessions.length ? <EmptyState text="No bookings yet." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  card: { marginTop: 12 },
  row: { flexDirection: 'row', gap: 6 },
  title: { fontSize: 16, fontWeight: '800', color: colors.navy, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 4 },
});

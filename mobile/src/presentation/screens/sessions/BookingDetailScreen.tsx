import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { Session } from '../../../domain/entities/Session';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, formatWhen, personName } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'BookingDetail'>;

export default function BookingDetailScreen({ navigation, route }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const [session, setSession] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    sessionRepository.getById(route.params.sessionId).then(setSession).catch((err) => Alert.alert('Error', apiError(err)));
  };

  useEffect(() => {
    load();
  }, [route.params.sessionId]);

  const cancel = async () => {
    if (!session) return;
    setBusy(true);
    try {
      setSession(await sessionRepository.cancelSession(session._id));
    } catch (err) {
      Alert.alert('Error', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const complete = async () => {
    if (!session) return;
    setBusy(true);
    try {
      setSession(await sessionRepository.updateStatus(session._id, 'completed'));
    } catch (err) {
      Alert.alert('Error', apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout title="Booking" showBack activeTab="Bookings">
      {session ? (
        <>
          <Card>
            <Badge text={session.status} />
            <Text style={styles.title}>{session.subject}</Text>
            <Text style={styles.meta}>Mentor: {personName(session.mentorId)}</Text>
            <Text style={styles.meta}>Student: {personName(session.studentId)}</Text>
            <Text style={styles.meta}>{formatWhen(session.scheduledAt)}</Text>
            {session.notes ? <Text style={styles.meta}>Notes: {session.notes}</Text> : null}
          </Card>

          {role === 'student' && session.verificationCode && session.status !== 'cancelled' ? (
            <Card style={styles.mt}>
              <Text style={styles.label}>Show this code to your mentor</Text>
              <Text style={styles.code}>{session.verificationCode}</Text>
            </Card>
          ) : null}

          {role === 'mentor' && session.status === 'pending' ? (
            <View style={styles.mt}>
              <PrimaryButton
                label="Verify attendance"
                onPress={() => navigation.navigate('VerifyBooking', { sessionId: session._id })}
              />
            </View>
          ) : null}

          {session.status === 'confirmed' ? (
            <View style={styles.mt}>
              <PrimaryButton label="Mark completed" onPress={complete} loading={busy} />
            </View>
          ) : null}

          {session.status !== 'cancelled' && session.status !== 'completed' ? (
            <View style={styles.mt}>
              <SecondaryButton label="Cancel booking" onPress={cancel} />
            </View>
          ) : null}

          <View style={styles.mt}>
            <SecondaryButton
              label="Open chat"
              onPress={() => {
                const other = role === 'mentor' ? session.studentId : session.mentorId;
                const id = typeof other === 'object' ? other._id : other;
                const name = personName(other);
                navigation.navigate('ChatThread', { participantId: id, participantName: name });
              }}
            />
          </View>
        </>
      ) : (
        <Text style={styles.meta}>Loading booking…</Text>
      )}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '800', color: colors.navy, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.navy },
  code: { fontSize: 36, fontWeight: '800', color: colors.navy, letterSpacing: 6, marginTop: 8 },
  mt: { marginTop: 16 },
});

import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { Session } from '../../../domain/entities/Session';
import { apiError, formatWhen, personName } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'VerifyBooking'>;

export default function VerifyBookingScreen({ navigation, route }: Props) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedId, setSelectedId] = useState(route.params?.sessionId ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionRepository
      .getMySessions()
      .then((items) => {
        const pending = items.filter((item) => item.status === 'pending' || item.status === 'confirmed');
        setSessions(pending);
        if (!selectedId && pending[0]) setSelectedId(pending[0]._id);
      })
      .catch((err) => Alert.alert('Error', apiError(err)));
  }, []);

  const verify = async () => {
    if (!selectedId) {
      Alert.alert('Select a booking', 'Choose the session you are starting.');
      return;
    }
    setLoading(true);
    try {
      await sessionRepository.verify(selectedId, code);
      Alert.alert('Verified', 'Attendance is confirmed. You can start the session.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not verify', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Verify Booking" showBack activeTab="Bookings">
      <Text style={styles.help}>Ask the student for their 6-digit booking code, then confirm attendance.</Text>
      {sessions.map((session) => (
        <TouchableOpacity key={session._id} onPress={() => setSelectedId(session._id)}>
          <Card style={[styles.card, selectedId === session._id && styles.selected]}>
            <Text style={styles.title}>{session.subject}</Text>
            <Text style={styles.meta}>
              {personName(session.studentId, 'Student')} · {formatWhen(session.scheduledAt)}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
      <Text style={styles.label}>Verification code</Text>
      <TextInput
        style={[inputStyle, styles.code]}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        placeholder="000000"
        placeholderTextColor={colors.inactive}
      />
      <PrimaryButton label="Confirm attendance" onPress={verify} loading={loading} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  help: { color: colors.muted, marginBottom: 16 },
  card: { marginBottom: 10 },
  selected: { borderColor: colors.gold, borderWidth: 2 },
  title: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
  label: { fontWeight: '700', color: colors.navy, marginTop: 8, marginBottom: 8 },
  code: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 16,
    color: colors.navy,
    fontWeight: '800',
  },
});

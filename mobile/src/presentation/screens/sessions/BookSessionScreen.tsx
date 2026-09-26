import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'BookSession'>;

export default function BookSessionScreen({ navigation, route }: Props) {
  const { mentorId, mentorName, subject: initialSubject } = route.params;
  const [subject, setSubject] = useState(initialSubject ?? '');
  const [when, setWhen] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const scheduledAt = new Date(when);
    if (!subject.trim() || Number.isNaN(scheduledAt.getTime())) {
      Alert.alert('Check details', 'Add a subject and a valid date/time like 2026-09-26 14:00');
      return;
    }
    setLoading(true);
    try {
      const session = await sessionRepository.bookSession({
        mentorId,
        subject,
        scheduledAt: scheduledAt.toISOString(),
        notes,
      });
      Alert.alert('Booked', 'Show your verification code when you meet the mentor.');
      navigation.replace('BookingDetail', { sessionId: session._id });
    } catch (err) {
      Alert.alert('Booking failed', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Book session" showBack activeTab="Bookings">
      <Text style={styles.mentor}>with {mentorName}</Text>
      <TextInput style={[inputStyle, styles.gap]} placeholder="Subject / module" value={subject} onChangeText={setSubject} />
      <TextInput
        style={[inputStyle, styles.gap]}
        placeholder="Date and time (YYYY-MM-DD HH:mm)"
        value={when}
        onChangeText={setWhen}
      />
      <TextInput
        style={[inputStyle, styles.area]}
        placeholder="Notes for your mentor"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <PrimaryButton label="Confirm booking" onPress={submit} loading={loading} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  mentor: { fontSize: 16, fontWeight: '700', color: colors.navy, marginBottom: 16 },
  gap: { marginBottom: 12 },
  area: { minHeight: 90, textAlignVertical: 'top', marginBottom: 16 },
});

import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../domain/stores/authStore';
import { userRepository } from '../../../data/repositories/userRepository';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorOrange, tutorPage } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorAvailability'>;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BLOCKS = [
  { key: 'morning', label: 'Morning', start: '09:00', end: '12:00' },
  { key: 'evening', label: 'Evening', start: '18:00', end: '21:00' },
];

export default function TutorAvailabilityScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const initial = useMemo(() => new Set(
    (user?.availabilitySlots ?? []).map((slot: any) => `${slot.day}-${slot.start}`),
  ), [user?.availabilitySlots]);
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    const availabilitySlots = DAYS.flatMap((_, day) => BLOCKS
      .filter((block) => selected.has(`${day}-${block.start}`))
      .map((block) => ({ day, start: block.start, end: block.end })));
    const availability = availabilitySlots.length
      ? availabilitySlots.map((slot) => `${DAYS[slot.day]} ${slot.start.slice(0, 2)}-${slot.end.slice(0, 2)}`).join(', ')
      : 'Ask for a time';
    setSaving(true);
    try {
      const updated = await userRepository.updateProfile({ availabilitySlots, availability });
      useAuthStore.getState().setUser?.(updated);
      Alert.alert('Availability saved', 'Students see these hours on your profile.');
      navigation.goBack();
    } catch {
      Alert.alert('Could not save availability.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Availability" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>Choose the hours students can request. A booking still waits for you to confirm it.</Text>
        {DAYS.map((day, index) => (
          <View key={day} style={styles.card}>
            <Text style={styles.day}>{day}</Text>
            <View style={styles.row}>
              {BLOCKS.map((block) => {
                const key = `${index}-${block.start}`;
                const on = selected.has(key);
                return (
                  <TouchableOpacity key={block.key} style={[styles.chip, on && styles.chipOn]} onPress={() => toggle(key)}>
                    <Text style={styles.chipText}>{block.label}</Text>
                    <Text style={styles.chipMeta}>{block.start}–{block.end}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.save} onPress={save} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save hours'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  scroll: { padding: 16, paddingBottom: 32 },
  lead: { color: tutorMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: tutorLine, padding: 14, marginBottom: 10 },
  day: { color: tutorNavy, fontWeight: '800', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderRadius: 14, backgroundColor: '#E8EEF8', padding: 10 },
  chipOn: { backgroundColor: tutorOrange },
  chipText: { color: tutorNavy, fontWeight: '800' },
  chipMeta: { color: tutorMuted, fontSize: 11, marginTop: 2 },
  save: { backgroundColor: tutorOrange, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  saveText: { color: tutorNavy, fontWeight: '800', fontSize: 16 },
});

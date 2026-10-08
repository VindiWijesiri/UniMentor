import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../../domain/stores/authStore';
import { userRepository } from '../../../data/repositories/userRepository';
import type { AppTabParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorOrange, tutorPage } from './theme';

type Props = BottomTabScreenProps<AppTabParamList, 'Profile'>;

export default function TutorProfileEditorScreen(_props: Props) {
  const user = useAuthStore((state) => state.user);
  const [bio, setBio] = useState(user?.bio || '');
  const [subjects, setSubjects] = useState((user?.subjects || []).join(', '));
  const [rate, setRate] = useState(String(user?.hourlyRate || 1800));
  const [languages, setLanguages] = useState((user?.languages || ['English']).join(', '));
  const [mode, setMode] = useState(user?.teachingMode || 'Online');
  const [qualification, setQualification] = useState(user?.qualification || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const hourlyRate = Number(rate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      Alert.alert('Enter an hourly rate in LKR.');
      return;
    }
    setSaving(true);
    try {
      const updated = await userRepository.updateProfile({
        bio,
        subjects: subjects.split(',').map((item) => item.trim()).filter(Boolean),
        hourlyRate,
        languages: languages.split(',').map((item) => item.trim()).filter(Boolean),
        teachingMode: mode,
        qualification,
      });
      useAuthStore.getState().setUser?.(updated);
      Alert.alert('Profile saved', 'Students see this on Find a Tutor.');
    } catch {
      Alert.alert('Could not save the profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Tutor Profile" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>{user?.name} · {user?.email}</Text>
        <Text style={styles.label}>Bio</Text>
        <TextInput value={bio} onChangeText={setBio} style={[styles.input, styles.tall]} multiline placeholder="How you help students" placeholderTextColor={tutorMuted} />
        <Text style={styles.label}>Modules</Text>
        <TextInput value={subjects} onChangeText={setSubjects} style={styles.input} placeholder="Data Structures, OOP" placeholderTextColor={tutorMuted} />
        <Text style={styles.label}>Hourly rate (LKR)</Text>
        <TextInput value={rate} onChangeText={setRate} keyboardType="number-pad" style={styles.input} />
        <Text style={styles.label}>Languages</Text>
        <TextInput value={languages} onChangeText={setLanguages} style={styles.input} placeholder="English, Sinhala" placeholderTextColor={tutorMuted} />
        <Text style={styles.label}>Teaching mode</Text>
        <TextInput value={mode} onChangeText={setMode} style={styles.input} />
        <Text style={styles.label}>Qualification</Text>
        <TextInput value={qualification} onChangeText={setQualification} style={styles.input} />
        <TouchableOpacity style={styles.save} onPress={save} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save profile'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert('Log Out', 'Are you sure you want to log out of UniMentor?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log Out', style: 'destructive', onPress: () => useAuthStore.getState().logout() },
            ]);
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutBtnText}>Sign Out of UniMentor 🚪</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  scroll: { padding: 16, paddingBottom: 32 },
  lead: { color: tutorMuted, marginBottom: 12 },
  label: { color: tutorNavy, fontWeight: '800', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: tutorLine, borderRadius: 14, paddingHorizontal: 12, minHeight: 46, color: tutorNavy },
  tall: { minHeight: 90, paddingTop: 12, textAlignVertical: 'top' },
  save: { backgroundColor: tutorOrange, borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  saveText: { color: tutorNavy, fontWeight: '800', fontSize: 16 },
  logoutBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 16, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  logoutBtnText: { color: '#DC2626', fontWeight: '800', fontSize: 15 },
});

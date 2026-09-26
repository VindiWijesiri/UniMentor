import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '../../../domain/stores/authStore';
import { ROLE_LABEL } from '../../../domain/entities/User';
import apiClient from '../../../data/api/apiClient';
import { apiError, initials } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, FieldLabel, PrimaryButton, SecondaryButton } from '../../components/Ui';

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [subjects, setSubjects] = useState((user?.subjects ?? []).join(', '));
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const response = await apiClient.put('/users/profile', {
        name,
        bio,
        subjects: subjects
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setUser(response.data);
    } catch (err) {
      Alert.alert('Could not save', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Profile" activeTab="Profile" showFooter={false}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials(user?.name)}</Text>
      </View>
      <Text style={styles.role}>{user ? ROLE_LABEL[user.role] : ''}</Text>
      <Card>
        <FieldLabel text="Name" />
        <TextInput style={inputStyle} value={name} onChangeText={setName} />
        <FieldLabel text="Email" />
        <Text style={styles.email}>{user?.email}</Text>
        <FieldLabel text="Bio" />
        <TextInput style={[inputStyle, styles.area]} value={bio} onChangeText={setBio} multiline />
        <FieldLabel text="Subjects" />
        <TextInput style={[inputStyle, styles.gap]} value={subjects} onChangeText={setSubjects} placeholder="Comma separated" />
        <PrimaryButton label="Save profile" onPress={save} loading={loading} />
      </Card>
      <View style={styles.mt}>
        <SecondaryButton label="Log out" onPress={() => void logout()} />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.navy,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: colors.gold, fontWeight: '800', fontSize: 22 },
  role: { textAlign: 'center', marginVertical: 12, color: colors.navy, fontWeight: '800' },
  area: { minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  email: { color: colors.muted, marginBottom: 12 },
  gap: { marginBottom: 12 },
  mt: { marginTop: 16 },
});

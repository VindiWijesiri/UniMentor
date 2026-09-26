import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { User } from '../../../domain/entities/User';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState, FieldLabel, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'FileComplaint'> };

const CATEGORIES = ['tutor_conduct', 'ghostwriting', 'copyright', 'assignment', 'other'] as const;

export default function FileComplaintScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('tutor_conduct');
  const [againstId, setAgainstId] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      learningRepository.users(undefined, query).then(setUsers).catch((err) => Alert.alert('Error', apiError(err)));
    }, [query])
  );

  const save = async () => {
    if (!title.trim() || !details.trim()) {
      Alert.alert('Missing details', 'Title and details are required.');
      return;
    }
    setLoading(true);
    try {
      const complaint = await learningRepository.createComplaint({
        title,
        details,
        category,
        evidenceUrl,
        againstUserId: againstId || undefined,
      });
      navigation.replace('ExamineCase', { complaintId: complaint._id });
    } catch (err) {
      Alert.alert('Could not submit', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="File academic complaint" showBack activeTab="Learning">
      <FieldLabel text="Title" />
      <TextInput style={inputStyle} value={title} onChangeText={setTitle} />
      <FieldLabel text="What happened?" />
      <TextInput style={[inputStyle, styles.area]} value={details} onChangeText={setDetails} multiline />
      <FieldLabel text="Evidence URL (optional)" />
      <TextInput style={[inputStyle, styles.gap]} value={evidenceUrl} onChangeText={setEvidenceUrl} autoCapitalize="none" />
      <FieldLabel text="Category" />
      <View style={styles.wrap}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity key={item} style={[styles.chip, category === item && styles.chipOn]} onPress={() => setCategory(item)}>
            <Text style={[styles.chipText, category === item && styles.chipTextOn]}>{item.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FieldLabel text="Person involved (optional)" />
      <TextInput style={[inputStyle, styles.gap]} value={query} onChangeText={setQuery} placeholder="Search name or email" />
      {users.slice(0, 12).map((user) => (
        <TouchableOpacity key={user._id} onPress={() => setAgainstId(user._id)}>
          <Card style={[styles.card, againstId === user._id && styles.on]}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>{user.role} · {user.email}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!users.length ? <EmptyState text="No matching users." /> : null}
      <PrimaryButton label="Submit complaint" onPress={save} loading={loading} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  area: { minHeight: 90, textAlignVertical: 'top', marginBottom: 12 },
  gap: { marginBottom: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.navy, fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: colors.gold },
  card: { marginBottom: 8 },
  on: { borderColor: colors.gold, borderWidth: 2 },
  name: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 2 },
});

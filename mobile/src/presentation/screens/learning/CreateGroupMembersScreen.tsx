import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Material } from '../../../domain/entities/Material';
import { User } from '../../../domain/entities/User';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'CreateGroupMembers'>;

export default function CreateGroupMembersScreen({ navigation, route }: Props) {
  const me = useAuthStore((s) => s.user?._id);
  const { name, subject, description } = route.params;
  const [students, setStudents] = useState<User[]>([]);
  const [mentors, setMentors] = useState<User[]>([]);
  const [packs, setPacks] = useState<Material[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [mentorIds, setMentorIds] = useState<string[]>([]);
  const [materialIds, setMaterialIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      Promise.all([
        learningRepository.users('student', query),
        learningRepository.users('mentor', query),
        learningRepository.materials({ q: query }),
      ])
        .then(([s, m, materials]) => {
          setStudents(s.filter((user) => user._id !== me));
          setMentors(m.filter((user) => user._id !== me));
          setPacks(materials.filter((item) => item.published));
        })
        .catch((err) => Alert.alert('Error', apiError(err)));
    }, [me, query])
  );

  const toggle = (id: string, list: string[], setList: (value: string[]) => void) => {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  const save = async () => {
    setLoading(true);
    try {
      const group = await learningRepository.createGroup({
        name,
        subject,
        description,
        memberIds,
        mentorIds,
        materialIds,
      });
      navigation.replace('InviteMembers', { groupId: group._id });
    } catch (err) {
      Alert.alert('Could not create', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Peers, tutors & packs" showBack activeTab="Learning">
      <TextInput
        style={[inputStyle, styles.gap]}
        value={query}
        onChangeText={setQuery}
        placeholder="Search people or packs"
        returnKeyType="search"
      />
      <Text style={styles.section}>Peer students</Text>
      {students.map((user) => (
        <TouchableOpacity key={user._id} onPress={() => toggle(user._id, memberIds, setMemberIds)}>
          <Card style={[styles.card, memberIds.includes(user._id) && styles.on]}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>{user.email}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      <Text style={styles.section}>Peer tutors</Text>
      {mentors.map((user) => (
        <TouchableOpacity key={user._id} onPress={() => toggle(user._id, mentorIds, setMentorIds)}>
          <Card style={[styles.card, mentorIds.includes(user._id) && styles.on]}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>{user.email}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      <Text style={styles.section}>Study packs</Text>
      {packs.map((item) => (
        <TouchableOpacity key={item._id} onPress={() => toggle(item._id, materialIds, setMaterialIds)}>
          <Card style={[styles.card, materialIds.includes(item._id) && styles.on]}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.meta}>{item.subject}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      <PrimaryButton label="Create group" onPress={save} loading={loading} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 8 },
  section: { fontWeight: '800', color: colors.navy, marginVertical: 10, fontSize: 16 },
  card: { marginBottom: 8 },
  on: { borderColor: colors.gold, borderWidth: 2 },
  name: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 2 },
});

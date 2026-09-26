import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { User } from '../../../domain/entities/User';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'StartChat'> };

export default function StartChatScreen({ navigation }: Props) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useFocusEffect(
    useCallback(() => {
      learningRepository.users(undefined, query).then(setUsers).catch((err) => Alert.alert('Error', apiError(err)));
    }, [query])
  );

  return (
    <ScreenLayout title="New message" showBack activeTab="Learning">
      <TextInput style={[inputStyle, styles.gap]} value={query} onChangeText={setQuery} placeholder="Search students or mentors" />
      {users.map((user) => (
        <TouchableOpacity
          key={user._id}
          onPress={() => navigation.replace('ChatThread', { participantId: user._id, participantName: user.name })}
        >
          <Card style={styles.card}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.meta}>{user.role} · {user.email}</Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!users.length ? <EmptyState text="No people found." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 12 },
  card: { marginBottom: 8 },
  name: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 2 },
});

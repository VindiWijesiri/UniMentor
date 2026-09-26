import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { StudyGroup } from '../../../domain/entities/Learning';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState, FieldLabel, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Groups'> };

export default function GroupsScreen({ navigation }: Props) {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    learningRepository
      .groups()
      .then(setGroups)
      .catch((err) => setError(apiError(err)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const join = async () => {
    try {
      const group = await learningRepository.joinGroup(code);
      setCode('');
      navigation.navigate('GroupHub', { groupId: group._id });
    } catch (err) {
      Alert.alert('Could not join', apiError(err));
    }
  };

  return (
    <ScreenLayout title="Study groups" showBack activeTab="Learning" onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Create study group" onPress={() => navigation.navigate('CreateGroupDetails')} />
      <View style={styles.mt}>
        <FieldLabel text="Join with invite code" />
        <TextInput style={[inputStyle, styles.gap]} placeholder="ABC123" value={code} onChangeText={setCode} autoCapitalize="characters" />
        <SecondaryButton label="Join group" onPress={join} />
      </View>
      <Text style={styles.section}>Your groups</Text>
      {groups.map((item) => (
        <TouchableOpacity key={item._id} onPress={() => navigation.navigate('GroupHub', { groupId: item._id })}>
          <Card style={styles.card}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.subject} · code {item.inviteCode}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!groups.length ? <EmptyState text="Create or join a study group." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  mt: { marginTop: 16 },
  gap: { marginBottom: 10 },
  section: { marginTop: 18, fontWeight: '800', color: colors.navy, fontSize: 16 },
  card: { marginTop: 10 },
  title: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
});

import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Complaint } from '../../../domain/entities/Learning';
import { apiError } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'IntegrityHub'> };

const GROUPS: { key: Complaint['category']; title: string; action: string }[] = [
  { key: 'assignment', title: 'Assignment code & AST', action: 'Examine code diff' },
  { key: 'copyright', title: 'Study material copyright', action: 'Examine material' },
  { key: 'ghostwriting', title: 'Ghostwriting / tutor conduct', action: 'Examine conduct' },
  { key: 'tutor_conduct', title: 'Tutor conduct', action: 'Examine conduct' },
  { key: 'other', title: 'Other grievances', action: 'Open case' },
];

export default function IntegrityHubScreen({ navigation }: Props) {
  const [items, setItems] = useState<Complaint[]>([]);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      learningRepository.complaints().then(setItems).catch((err) => setError(apiError(err)));
    }, [])
  );

  return (
    <ScreenLayout title="Integrity hub" showBack activeTab="Learning">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {GROUPS.map((group) => {
        const cases = items.filter((item) => item.category === group.key);
        return (
          <Card key={group.key} style={styles.card}>
            <Text style={styles.group}>{group.title}</Text>
            <Text style={styles.meta}>{cases.length} cases</Text>
            {cases.map((item) => (
              <TouchableOpacity key={item._id} onPress={() => navigation.navigate('ExamineCase', { complaintId: item._id })}>
                <Text style={styles.case}>{item.title}</Text>
                <Badge text={item.status} tone={item.status === 'open' ? 'danger' : 'orange'} />
              </TouchableOpacity>
            ))}
            {!cases.length ? <EmptyState text="No cases in this queue." /> : null}
          </Card>
        );
      })}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  card: { marginBottom: 12 },
  group: { fontWeight: '800', color: colors.navy, fontSize: 16 },
  meta: { color: colors.muted, marginBottom: 8 },
  case: { marginTop: 10, fontWeight: '700', color: colors.text },
});

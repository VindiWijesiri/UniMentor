import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Complaint } from '../../../domain/entities/Learning';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, personName } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Complaints'> };

export default function ComplaintsScreen({ navigation }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const reviewer = role === 'lic' || role === 'admin';
  const [items, setItems] = useState<Complaint[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    learningRepository
      .complaints()
      .then(setItems)
      .catch((err) => setError(apiError(err)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout title={reviewer ? 'Complaints' : 'My complaints'} showBack activeTab="Learning" onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {reviewer ? (
        <PrimaryButton label="Open integrity hub" onPress={() => navigation.navigate('IntegrityHub')} />
      ) : (
        <PrimaryButton label="File a complaint" onPress={() => navigation.navigate('FileComplaint')} />
      )}
      <Text style={styles.section}>Cases</Text>
      {items.map((item) => (
        <TouchableOpacity key={item._id} onPress={() => navigation.navigate('ExamineCase', { complaintId: item._id })}>
          <Card style={styles.card}>
            <Badge text={item.status} tone={item.status === 'open' ? 'danger' : item.status === 'resolved' ? 'success' : 'orange'} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.category.replace('_', ' ')} · {personName(item.reporterId, 'Reporter')}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!items.length ? <EmptyState text="No complaints filed." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  section: { marginTop: 18, fontWeight: '800', color: colors.navy, fontSize: 16 },
  card: { marginTop: 10 },
  title: { fontWeight: '800', color: colors.navy, marginTop: 6 },
  meta: { color: colors.muted, marginTop: 4 },
});

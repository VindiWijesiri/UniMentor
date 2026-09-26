import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Assessment, Submission } from '../../../domain/entities/Assessment';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, personName } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Assessments'> };

export default function AssessmentsScreen({ navigation }: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const mentor = role === 'mentor' || role === 'admin';
  const [items, setItems] = useState<Assessment[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([
      learningRepository.assessments(mentor),
      learningRepository.submissions(mentor ? { status: 'submitted' } : { mine: true }),
    ])
      .then(([list, submissions]) => {
        setItems(list);
        setSubs(submissions);
        setError('');
      })
      .catch((err) => setError(apiError(err)));
  }, [mentor]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout title={mentor ? 'Assessment hub' : 'Assessments'} showBack activeTab="Learning" onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {mentor ? (
        <>
          <PrimaryButton label="Create assessment" onPress={() => navigation.navigate('AssessmentCreate')} />
          <View style={styles.mt}>
            <PrimaryButton label="Question library" onPress={() => navigation.navigate('QuestionLibrary')} />
          </View>
        </>
      ) : (
        <PrimaryButton label="Improvement history" onPress={() => navigation.navigate('ImprovementHistory')} />
      )}

      {mentor && subs.length ? <Text style={styles.section}>Needs grading</Text> : null}
      {mentor
        ? subs.map((item) => (
            <TouchableOpacity key={item._id} onPress={() => navigation.navigate('GradeSubmission', { submission: item })}>
              <Card style={styles.card}>
                <Badge text="Submitted" tone="orange" />
                <Text style={styles.title}>
                  {typeof item.assessmentId === 'object' ? item.assessmentId.title : 'Assessment'}
                </Text>
                <Text style={styles.meta}>{personName(item.studentId)}</Text>
              </Card>
            </TouchableOpacity>
          ))
        : null}

      {!mentor ? <Text style={styles.section}>Your submissions</Text> : null}
      {!mentor
        ? subs.map((item) => (
            <Card key={item._id} style={styles.card}>
              <Badge text={item.status} tone={item.status === 'graded' ? 'success' : 'orange'} />
              <Text style={styles.title}>
                {typeof item.assessmentId === 'object' ? item.assessmentId.title : 'Assessment'}
              </Text>
              <Text style={styles.meta}>
                {item.score != null ? `${item.score}/${item.maxScore}` : 'Awaiting grade'}
              </Text>
            </Card>
          ))
        : null}

      <Text style={styles.section}>{mentor ? 'Your assessments' : 'Available to take'}</Text>
      {items.map((item) => (
        <TouchableOpacity
          key={item._id}
          onPress={() =>
            mentor
              ? navigation.navigate('AssessmentCreate')
              : navigation.navigate('AssessmentTake', { assessmentId: item._id })
          }
        >
          <Card style={styles.card}>
            <Badge text={item.published ? 'Live' : 'Draft'} tone={item.published ? 'success' : 'orange'} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.subject} · {item.questions?.length ?? 0} questions · {item.durationMinutes}m
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!items.length ? <EmptyState text="No assessments yet." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  section: { marginTop: 18, marginBottom: 8, fontWeight: '800', color: colors.navy, fontSize: 16 },
  card: { marginBottom: 10 },
  title: { fontWeight: '800', color: colors.navy, marginTop: 6, fontSize: 16 },
  meta: { color: colors.muted, marginTop: 4 },
  mt: { marginTop: 10 },
});

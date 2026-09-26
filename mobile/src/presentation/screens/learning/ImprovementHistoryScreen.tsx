import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Goal } from '../../../domain/entities/Goal';
import { Submission } from '../../../domain/entities/Assessment';
import { apiError } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState } from '../../components/Ui';

export default function ImprovementHistoryScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      learningRepository
        .history()
        .then((data) => {
          setGoals(data.goals);
          setSubs(data.submissions);
          setError('');
        })
        .catch((err) => setError(apiError(err)));
    }, [])
  );

  return (
    <ScreenLayout title="Improvement history" showBack activeTab="Learning">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.section}>Graded assessments</Text>
      {subs.map((item) => (
        <Card key={item._id} style={styles.mb}>
          <Badge text={item.status} tone={item.status === 'graded' ? 'success' : 'orange'} />
          <Text style={styles.title}>{typeof item.assessmentId === 'object' ? item.assessmentId.title : 'Assessment'}</Text>
          <Text style={styles.meta}>
            {item.score != null ? `${item.score}/${item.maxScore}` : 'Awaiting grade'}
          </Text>
          {item.feedback ? <Text style={styles.meta}>{item.feedback}</Text> : null}
        </Card>
      ))}
      {!subs.length ? <EmptyState text="No submissions yet." /> : null}
      <Text style={styles.section}>Goal progress</Text>
      {goals.map((goal) => (
        <Card key={goal._id} style={styles.mb}>
          <Text style={styles.title}>{goal.title}</Text>
          <Text style={styles.meta}>{goal.progress}% of {goal.targetHours}h</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${goal.progress}%` }]} />
          </View>
        </Card>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  section: { fontWeight: '800', color: colors.navy, fontSize: 16, marginBottom: 8, marginTop: 8 },
  mb: { marginBottom: 10 },
  title: { fontWeight: '800', color: colors.navy, marginTop: 6 },
  meta: { color: colors.muted, marginTop: 4 },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.gold },
});

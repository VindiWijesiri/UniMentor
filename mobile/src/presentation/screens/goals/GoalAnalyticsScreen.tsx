import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalPlanView } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { blue, card, ink, line, muted, navy, orange } from '../assessments/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'GoalAnalytics'>;

export default function GoalAnalyticsScreen({ navigation, route }: Props) {
  const [goal, setGoal] = useState<GoalPlanView | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    learningRepository.goal(route.params.goalId).then((item) => { if (active) setGoal(item); }).catch(() => {});
    return () => { active = false; };
  }, [route.params.goalId]));
  const analytics = goal?.analytics;

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Progress" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>{goal?.moduleCode} {goal?.moduleName}</Text>
        <Text style={styles.title}>{goal?.title}</Text>
        <Text style={styles.pace}>{analytics?.pace}</Text>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Projected final grade</Text>
          <Text style={styles.heroValue}>{analytics?.projected}% · Grade {analytics?.projectedGrade}</Text>
          <Text style={styles.heroSub}>Target {goal?.targetPercent}% ({goal?.targetGrade}) · {analytics?.certainty}% certainty</Text>
        </View>
        <Text style={styles.section}>Trajectory</Text>
        <View style={styles.row}>
          <Point label="Baseline" value={`${analytics?.baseline ?? 0}%`} />
          <Point label="Midterm" value={`${analytics?.midterm ?? 0}%`} />
          <Point label="Final target" value={`${goal?.targetPercent ?? 0}%`} />
        </View>
        <Text style={styles.section}>Time invested · {goal?.hoursLogged} hrs</Text>
        <Bar label="Self study" value={analytics?.selfStudy ?? 0} />
        <Bar label="Tutoring" value={analytics?.tutoring ?? 0} />
        <Bar label="Groups" value={analytics?.groups ?? 0} />
        <Text style={styles.section}>Competency focus</Text>
        {(goal?.topics ?? []).map((topic) => (
          <View key={topic.title} style={styles.topic}>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicScore}>{topic.score}% {topic.note}</Text>
            <View style={styles.track}><View style={[styles.fill, { width: `${topic.score}%` }]} /></View>
          </View>
        ))}
        <OrangeButton label="Book session with Tharushi" onPress={() => goal && navigation.navigate('FindGoalTutor', { goalId: goal._id })} />
        <Text style={styles.export} onPress={() => Alert.alert('Progress report', `${goal?.title}: ${goal?.progress}% complete, ${goal?.hoursLogged} hours logged.`)}>
          Export progress report
        </Text>
      </ScrollView>
    </AssessmentScreen>
  );
}

function Point({ label, value }: { label: string; value: string }) {
  return <View style={styles.point}><Text style={styles.pointValue}>{value}</Text><Text style={styles.pointLabel}>{label}</Text></View>;
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.track}><View style={[styles.fill, { width: `${value}%` }]} /></View>
      <Text style={styles.barValue}>{value}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  kicker: { color: blue, fontWeight: '800' },
  title: { color: ink, fontSize: 24, fontWeight: '800' },
  pace: { color: '#15803D', fontWeight: '800', marginTop: 4 },
  hero: { backgroundColor: navy, borderRadius: 18, padding: 16, marginTop: 12 },
  heroLabel: { color: '#C9D4EA' },
  heroValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  heroSub: { color: orange, marginTop: 6 },
  section: { color: ink, fontWeight: '800', fontSize: 16, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  point: { flex: 1, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 10 },
  pointValue: { color: ink, fontWeight: '800', fontSize: 18 },
  pointLabel: { color: muted, marginTop: 2, fontSize: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  barLabel: { width: 80, color: ink, fontWeight: '700' },
  barValue: { width: 40, color: navy, fontWeight: '800' },
  track: { flex: 1, height: 8, backgroundColor: '#E7EDF6', borderRadius: 8 },
  fill: { height: 8, backgroundColor: orange, borderRadius: 8 },
  topic: { backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  topicTitle: { color: ink, fontWeight: '800' },
  topicScore: { color: muted, marginVertical: 4 },
  export: { color: blue, fontWeight: '800', textAlign: 'center', marginTop: 12 },
});

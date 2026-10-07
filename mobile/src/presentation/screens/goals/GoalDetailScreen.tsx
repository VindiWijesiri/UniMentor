import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalPlanView } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar } from '../assessments/Chrome';
import { blue, card, ink, line, muted, navy, orange, soft } from '../assessments/theme';
import FocusSession from '../learning/FocusSession';

type Props = NativeStackScreenProps<AppStackParamList, 'GoalDetail'>;

export default function GoalDetailScreen({ navigation, route }: Props) {
  const goalId = route.params?.goalId || (route.params as any)?.id || '';
  const [goal, setGoal] = useState<GoalPlanView | null>(null);
  const [loading, setLoading] = useState(true);
  const [focusOn, setFocusOn] = useState(false);
  const load = useCallback(() => {
    let active = true;
    if (!goalId) {
      setLoading(false);
      return () => { active = false; };
    }
    learningRepository.goal(goalId)
      .then((item) => { if (active) setGoal(item); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [goalId]);
  useFocusEffect(useCallback(() => load(), [load]));

  if (loading || !goal) {
    return <AssessmentScreen navigation={navigation}><KuppiyaBar title="Goal" /><ActivityIndicator color={navy} style={styles.loader} /></AssessmentScreen>;
  }

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Goal" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.top}>
          <View style={styles.module}><Text style={styles.moduleText}>{goal.moduleCode}: {goal.moduleName}</Text></View>
          <View style={styles.priority}><Text style={styles.priorityText}>{goal.priority}</Text></View>
        </View>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.summary}>{goal.summary}</Text>
        <View style={styles.progressRow}>
          <Text style={styles.percent}>{goal.progress}% ({goal.gradeLabel})</Text>
          <Text style={styles.target}>Target {goal.targetPercent}% ({goal.targetGrade})</Text>
          <Text style={styles.delta}>{goal.delta}</Text>
        </View>
        <View style={styles.track}><View style={[styles.fill, { width: `${goal.progress}%` }]} /></View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{goal.daysLeft} days remaining</Text>
          <Text style={styles.meta}>{goal.dueLabel}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.action} onPress={() => setFocusOn(true)}>
            <Text style={styles.actionText}>Focus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('AddGoalAssessment', { goalId: goal._id })}>
            <Text style={styles.actionText}>+ Assessment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={() => navigation.navigate('LogGoalProgress', { goalId: goal._id })}>
            <Text style={styles.actionText}>Log Study</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.head}>
          <Text style={styles.section}>Linked Assessments · {goal.assessments.length}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AddGoalAssessment', { goalId: goal._id })}><Text style={styles.link}>+ Add</Text></TouchableOpacity>
        </View>
        {goal.assessments.map((item) => (
          <TouchableOpacity key={item.id} style={styles.row} onPress={() => navigation.navigate('GoalAssessmentResult', { goalId: goal._id, assessmentId: item.id })}>
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{item.name}</Text>
              <Text style={styles.meta}>{item.type} · {item.weight}% weight</Text>
            </View>
            <View>
              <Text style={styles.score}>{item.score ?? item.targetMark} / {item.totalMarks}</Text>
              <Text style={styles.meta}>{item.statusLabel}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.head}>
          <Text style={styles.section}>Milestones</Text>
          <TouchableOpacity onPress={() => navigation.navigate('GoalMilestones', { goalId: goal._id })}>
            <Text style={styles.link}>{goal.milestoneDone} / {goal.milestoneTotal} Done</Text>
          </TouchableOpacity>
        </View>
        {goal.milestones.slice(0, 3).map((item) => (
          <View key={item.id} style={[styles.milestone, item.status === 'active' && styles.milestoneOn]}>
            <Text style={styles.mark}>{item.status === 'done' ? '✓' : item.status === 'active' ? '●' : '○'}</Text>
            <Text style={styles.rowTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.progressLabel || item.dueLabel}</Text>
          </View>
        ))}

        <View style={styles.head}>
          <Text style={styles.section}>Goal Support</Text>
          <Text style={styles.meta}>{goal.supportLabel}</Text>
        </View>
        <View style={styles.tutor}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{goal.tutorName.slice(0, 2).toUpperCase()}</Text></View>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{goal.tutorName}</Text>
            <Text style={styles.meta}>{goal.tutorRole} · {goal.tutorSlot}</Text>
          </View>
          <TouchableOpacity style={styles.message} onPress={() => navigation.navigate('FindGoalTutor', { goalId: goal._id })}>
            <Text style={styles.messageText}>Message</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.primary} onPress={() => navigation.navigate('LogGoalProgress', { goalId: goal._id })}>
          <Text style={styles.primaryText}>Log Learning Progress (+1.5h)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('GoalAnalytics', { goalId: goal._id })}>
          <Text style={styles.analytics}>View progress analytics</Text>
        </TouchableOpacity>
        {goal.completed ? (
          <TouchableOpacity onPress={() => navigation.navigate('GoalAchievement', { goalId: goal._id })}>
            <Text style={styles.analytics}>Open achievement</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      <FocusSession
        visible={focusOn}
        areas={[{ id: goal._id, title: goal.title, code: goal.moduleCode }]}
        areaId={goal._id}
        minutes={25}
        chooseTime
        onClose={() => setFocusOn(false)}
        onSaved={load}
      />
    </AssessmentScreen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  scroll: { padding: 16, paddingBottom: 28 },
  flex: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  module: { flex: 1, backgroundColor: '#EEF3FB', borderRadius: 14, padding: 10 },
  moduleText: { color: navy, fontWeight: '800' },
  priority: { backgroundColor: '#FEE2E2', borderRadius: 14, paddingHorizontal: 10, justifyContent: 'center' },
  priorityText: { color: '#B91C1C', fontWeight: '800', fontSize: 12 },
  title: { color: ink, fontSize: 24, fontWeight: '800', marginTop: 12 },
  summary: { color: muted, marginTop: 6, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14 },
  percent: { color: ink, fontSize: 22, fontWeight: '800' },
  target: { color: muted, marginBottom: 3, flex: 1 },
  delta: { color: '#15803D', fontWeight: '800' },
  track: { height: 8, backgroundColor: '#E7EDF6', borderRadius: 8, marginTop: 8 },
  fill: { height: 8, backgroundColor: orange, borderRadius: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  meta: { color: muted, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  action: { flex: 1, backgroundColor: '#EEF3FB', borderRadius: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: navy, fontWeight: '800' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 8 },
  section: { color: ink, fontWeight: '800', fontSize: 16 },
  link: { color: blue, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  rowTitle: { color: ink, fontWeight: '800', flex: 1 },
  score: { color: ink, fontWeight: '800', textAlign: 'right' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  milestoneOn: { backgroundColor: soft, borderRadius: 12, paddingHorizontal: 8 },
  mark: { color: navy, fontWeight: '800', width: 18 },
  tutor: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  message: { backgroundColor: '#EEF3FB', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  messageText: { color: navy, fontWeight: '800' },
  primary: { marginTop: 14, backgroundColor: orange, borderRadius: 16, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: navy, fontWeight: '800', fontSize: 16 },
  analytics: { color: blue, fontWeight: '800', textAlign: 'center', marginTop: 12 },
});

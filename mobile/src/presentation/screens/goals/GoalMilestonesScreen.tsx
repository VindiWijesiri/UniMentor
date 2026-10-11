import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalPlanView } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { card, ink, line, muted, navy, orange } from '../assessments/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'GoalMilestones'>;

export default function GoalMilestonesScreen({ navigation, route }: Props) {
  const [goal, setGoal] = useState<GoalPlanView | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const goalId = route.params?.goalId || (route.params as any)?.id || '';
  const load = useCallback(() => {
    let active = true;
    if (goalId) {
      learningRepository.goal(goalId).then((item) => { if (active) setGoal(item); }).catch(() => {});
    }
    return () => { active = false; };
  }, [goalId]);
  useFocusEffect(useCallback(() => load(), [load]));
  const active = goal?.milestones.find((item) => item.status === 'active');

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Milestones" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>{goal?.moduleCode} · {goal?.moduleName}</Text>
        <Text style={styles.title}>{goal?.title}</Text>
        <Text style={styles.meta}>Target: Midterm Prep · {goal?.dueLabel}</Text>
        <Text style={styles.progress}>{goal?.progress}% · {goal?.milestoneDone} of {goal?.milestoneTotal} done</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${goal?.progress ?? 0}%` }]} /></View>
        {(goal?.milestones ?? []).map((item, index) => (
          <View key={item.id} style={[styles.card, item.status === 'active' && styles.active]}>
            <Text style={styles.step}>Milestone {index + 1}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.meta}>{item.status === 'done' ? 'Done' : item.status === 'locked' ? item.dueLabel : item.detail}</Text>
          </View>
        ))}
        <OrangeButton
          label="Continue Milestone"
          onPress={async () => {
            if (!active || !goal) return;
            const next = await learningRepository.advanceMilestone(goal._id, active.id);
            setGoal(next);
            if (next.completed) navigation.navigate('GoalAchievement', { goalId: goal._id });
          }}
        />
        {adding ? (
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Milestone title"
            placeholderTextColor={muted}
            style={styles.input}
          />
        ) : null}
        <TouchableOpacity
          style={styles.add}
          onPress={async () => {
            if (!goal) return;
            if (!adding) {
              setAdding(true);
              return;
            }
            const nextTitle = title.trim();
            if (!nextTitle) return;
            const next = await learningRepository.addGoalMilestone(goal._id, nextTitle);
            setGoal(next);
            setTitle('');
            setAdding(false);
          }}
        >
          <Text style={styles.addText}>{adding ? 'Save milestone' : '+ Add Milestone'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </AssessmentScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  kicker: { color: muted, fontWeight: '800' },
  title: { color: ink, fontSize: 24, fontWeight: '800', marginTop: 4 },
  meta: { color: muted, marginTop: 4 },
  progress: { color: ink, fontWeight: '800', marginTop: 12 },
  track: { height: 8, backgroundColor: '#E7EDF6', borderRadius: 8, marginVertical: 8 },
  fill: { height: 8, backgroundColor: orange, borderRadius: 8 },
  card: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  active: { borderColor: orange, backgroundColor: '#FFF8F1' },
  step: { color: navy, fontWeight: '800', fontSize: 12 },
  cardTitle: { color: ink, fontWeight: '800', fontSize: 16, marginTop: 4 },
  add: { marginTop: 8, alignItems: 'center', backgroundColor: '#EEF3FB', borderRadius: 14, minHeight: 44, justifyContent: 'center' },
  addText: { color: navy, fontWeight: '800' },
  input: { backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 12, padding: 12, color: ink, marginTop: 8 },
});

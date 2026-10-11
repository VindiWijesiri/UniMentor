import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalAssessmentLink, GoalPlanView } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { card, ink, line, muted, navy, orange } from '../assessments/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'GoalAssessmentResult'>;

export default function GoalAssessmentResultScreen({ navigation, route }: Props) {
  const [goal, setGoal] = useState<GoalPlanView | null>(null);
  const [score, setScore] = useState('');
  const goalId = route.params?.goalId || (route.params as any)?.id || '';
  const assessmentId = route.params?.assessmentId || '';
  const load = useCallback(() => {
    let active = true;
    if (goalId) {
      learningRepository.goal(goalId).then((item) => {
        if (!active) return;
        setGoal(item);
        const current = item.assessments.find((entry) => entry.id === assessmentId);
        setScore(current?.score == null ? '' : String(current.score));
      }).catch(() => {});
    }
    return () => { active = false; };
  }, [assessmentId, goalId]);
  useFocusEffect(useCallback(() => load(), [load]));
  const item = goal?.assessments.find((entry) => entry.id === assessmentId);
  const achieved = item?.score ?? 0;
  const over = item ? achieved - item.targetMark : 0;

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Assessment" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>{goal?.moduleCode} {goal?.title}</Text>
        <Text style={styles.badge}>{item?.statusLabel ?? 'Linked'}</Text>
        <Text style={styles.title}>{item?.name}</Text>
        <Text style={styles.meta}>{item?.weight}% weight · {item?.dateLabel}</Text>
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{over >= 0 ? `+${over} over goal` : `${over} under goal`}</Text>
          <Text style={styles.pair}>Target {item?.targetMark ?? 0} / {item?.totalMarks ?? 100}</Text>
          <Text style={styles.achieved}>Achieved {achieved}</Text>
          <Text style={styles.grade}>{grade(achieved)}</Text>
        </View>
        <Text style={styles.section}>Topic breakdown</Text>
        {(goal?.topics ?? []).map((topic) => (
          <View key={topic.title} style={styles.topic}>
            <Text style={styles.topicTitle}>{topic.title}</Text>
            <Text style={styles.topicScore}>{topic.score}%</Text>
          </View>
        ))}
        {item?.evidence ? <Text style={styles.evidence}>{item.evidence} · graded paper</Text> : null}
        {item?.feedback ? <Text style={styles.feedback}>“{item.feedback}” — {goal?.tutorName}</Text> : null}
        <Text style={styles.section}>Update score</Text>
        <TextInput value={score} onChangeText={setScore} keyboardType="numeric" style={styles.input} placeholder="Score" placeholderTextColor={muted} />
        <OrangeButton
          label="Update score"
          onPress={async () => {
            const nextScore = Number(score);
            if (!Number.isFinite(nextScore) || !goalId || !assessmentId) return;
            const next = await learningRepository.updateGoalAssessment(goalId, assessmentId, nextScore);
            setGoal(next);
            Alert.alert('Score updated', `${item?.name} is now ${nextScore}.`);
          }}
        />
        <TouchableOpacity onPress={() => navigation.navigate('FindGoalTutor', { goalId })}>
          <Text style={styles.link}>Book follow-up session</Text>
        </TouchableOpacity>
      </ScrollView>
    </AssessmentScreen>
  );
}

function grade(score: number) {
  if (score >= 85) return 'Grade A';
  if (score >= 75) return 'Grade B';
  if (score >= 65) return 'Grade C';
  return 'Grade D';
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  kicker: { color: navy, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#ECFDF3', color: '#15803D', fontWeight: '800', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  title: { color: ink, fontSize: 24, fontWeight: '800', marginTop: 8 },
  meta: { color: muted, marginTop: 4 },
  hero: { backgroundColor: navy, borderRadius: 18, padding: 16, marginTop: 12 },
  heroLabel: { color: orange, fontWeight: '800' },
  pair: { color: '#C9D4EA', marginTop: 8 },
  achieved: { color: '#fff', fontSize: 36, fontWeight: '800' },
  grade: { color: '#fff', fontWeight: '800' },
  section: { color: ink, fontWeight: '800', fontSize: 16, marginTop: 16, marginBottom: 8 },
  topic: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: card, borderRadius: 12, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  topicTitle: { color: ink, fontWeight: '700' },
  topicScore: { color: navy, fontWeight: '800' },
  evidence: { color: muted, marginTop: 8 },
  feedback: { color: ink, marginTop: 8, lineHeight: 20 },
  input: { backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 12, padding: 12, color: ink },
  link: { color: navy, fontWeight: '800', textAlign: 'center', marginTop: 12 },
});

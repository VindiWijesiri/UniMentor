import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalPlanView } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { card, ink, line, muted, navy, orange } from '../assessments/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'GoalAchievement'>;

export default function GoalAchievementScreen({ navigation, route }: Props) {
  const [goal, setGoal] = useState<GoalPlanView | null>(null);
  useFocusEffect(useCallback(() => {
    let active = true;
    const gId = route.params?.goalId || (route.params as any)?.id || '';
    if (gId) {
      learningRepository.goal(gId).then((item) => { if (active) setGoal(item); }).catch(() => {});
    }
    return () => { active = false; };
  }, [route.params]));
  const exam = goal?.assessments.find((item) => item.type === 'Exam');

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Achievement" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>Goal accomplished</Text>
        <Text style={styles.title}>Grade A ({exam?.score ?? goal?.progress}%) in {goal?.moduleCode}</Text>
        <View style={styles.row}>
          <Stat label="Above target" value={goal?.delta ?? '+8%'} />
          <Stat label="Study time" value={`${goal?.hoursLogged ?? 0} hrs`} />
          <Stat label="Growth" value="+24%" />
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{goal?.milestoneDone} of {goal?.milestoneTotal} milestones completed</Text>
          <View style={styles.track}><View style={[styles.fill, { width: '100%' }]} /></View>
        </View>
        <View style={styles.credential}>
          <Text style={styles.credKicker}>UniMentor credential</Text>
          <Text style={styles.credTitle}>{goal?.moduleCode} Graph Competency Master</Text>
          <Text style={styles.meta}>Verification ID {goal?.credentialId}</Text>
        </View>
        <OrangeButton label="Share certificate" onPress={() => Alert.alert('Shared', `${goal?.credentialId} is ready to share with your tutor.`)} />
        <Text style={styles.next} onPress={() => navigation.navigate('StudyTaskTracker')}>Set next goal</Text>
      </ScrollView>
    </AssessmentScreen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  emoji: { color: orange, fontWeight: '800', fontSize: 14, letterSpacing: 0.4 },
  title: { color: ink, fontSize: 28, fontWeight: '800', marginTop: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  stat: { flex: 1, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 10 },
  statValue: { color: ink, fontWeight: '800', fontSize: 16 },
  statLabel: { color: muted, marginTop: 4, fontSize: 11 },
  card: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 14, marginTop: 12 },
  cardTitle: { color: ink, fontWeight: '800' },
  track: { height: 8, backgroundColor: '#E7EDF6', borderRadius: 8, marginTop: 10 },
  fill: { height: 8, backgroundColor: orange, borderRadius: 8 },
  credential: { backgroundColor: navy, borderRadius: 18, padding: 16, marginVertical: 14 },
  credKicker: { color: orange, fontWeight: '800' },
  credTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 6 },
  meta: { color: '#C9D4EA', marginTop: 6 },
  next: { color: navy, fontWeight: '800', textAlign: 'center', marginTop: 12 },
});

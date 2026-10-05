import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalPlanView } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { card, ink, line, muted, navy, soft } from '../assessments/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'LogGoalProgress'>;
const HOURS = [0.5, 0.75, 1, 1.5, 2];

export default function LogGoalProgressScreen({ navigation, route }: Props) {
  const [goal, setGoal] = useState<GoalPlanView | null>(null);
  const [hours, setHours] = useState(1.5);
  const [problems, setProblems] = useState(5);
  const [confidence, setConfidence] = useState('Strong grasp');
  const [notes, setNotes] = useState('Successfully proved the relaxation step in Bellman-Ford.');
  useFocusEffect(useCallback(() => {
    let active = true;
    learningRepository.goal(route.params.goalId).then((item) => { if (active) setGoal(item); }).catch(() => {});
    return () => { active = false; };
  }, [route.params.goalId]));
  const active = goal?.milestones.find((item) => item.status === 'active');

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Log Progress" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>Target goal · {goal?.moduleCode}</Text>
        <Text style={styles.title}>{goal?.title}</Text>
        <View style={styles.milestone}><Text style={styles.milestoneText}>{active ? active.title : 'All milestones complete'}</Text></View>
        <Text style={styles.label}>Study duration</Text>
        <View style={styles.chips}>
          {HOURS.map((value) => (
            <TouchableOpacity key={value} style={[styles.chip, hours === value && styles.chipOn]} onPress={() => setHours(value)}>
              <Text style={[styles.chipText, hours === value && styles.chipTextOn]}>{value}h</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Problems solved</Text>
        <View style={styles.stepper}>
          <TouchableOpacity onPress={() => setProblems((value) => Math.max(0, value - 1))}><Text style={styles.step}>-</Text></TouchableOpacity>
          <Text style={styles.count}>{problems}</Text>
          <TouchableOpacity onPress={() => setProblems((value) => value + 1)}><Text style={styles.step}>+</Text></TouchableOpacity>
        </View>
        <Text style={styles.label}>Confidence</Text>
        <View style={styles.chips}>
          {['Needs review', 'Getting there', 'Strong grasp'].map((item) => (
            <TouchableOpacity key={item} style={[styles.chip, confidence === item && styles.chipOn]} onPress={() => setConfidence(item)}>
              <Text style={[styles.chipText, confidence === item && styles.chipTextOn]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Notes</Text>
        <TextInput value={notes} onChangeText={setNotes} multiline style={styles.input} />
        <View style={styles.impact}><Text style={styles.impactText}>Impact projection +{Math.round(hours * 2.8)}% goal velocity</Text></View>
        <OrangeButton
          label="Save progress"
          onPress={async () => {
            try {
              const next = await learningRepository.logGoal(route.params.goalId, { hours, problems, confidence, notes });
              if (next.completed) navigation.replace('GoalAchievement', { goalId: next._id });
              else {
                Alert.alert('Logged', `${hours}h added. This goal is now ${next.progress}%.`);
                navigation.goBack();
              }
            } catch {
              Alert.alert('Not saved', 'Check your connection and try again.');
            }
          }}
        />
      </ScrollView>
    </AssessmentScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  kicker: { color: navy, fontWeight: '800', letterSpacing: 0.4 },
  title: { color: ink, fontSize: 22, fontWeight: '800', marginTop: 6 },
  milestone: { marginTop: 10, backgroundColor: soft, borderRadius: 12, padding: 10 },
  milestoneText: { color: navy, fontWeight: '800' },
  label: { color: ink, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: navy, borderColor: navy },
  chipText: { color: navy, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  step: { width: 40, height: 40, textAlign: 'center', textAlignVertical: 'center', backgroundColor: card, borderRadius: 12, borderWidth: 1, borderColor: line, color: navy, fontSize: 22, fontWeight: '800' },
  count: { color: ink, fontSize: 28, fontWeight: '800' },
  input: { minHeight: 90, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, color: ink, textAlignVertical: 'top' },
  impact: { marginVertical: 12, backgroundColor: '#ECFDF3', borderRadius: 12, padding: 10 },
  impactText: { color: '#15803D', fontWeight: '800' },
});

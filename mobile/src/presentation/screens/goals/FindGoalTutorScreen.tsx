import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalPlanView, GoalTutor } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar } from '../assessments/Chrome';
import { card, ink, line, muted, navy, orange } from '../assessments/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'FindGoalTutor'>;

export default function FindGoalTutorScreen({ navigation, route }: Props) {
  const [goal, setGoal] = useState<GoalPlanView | null>(null);
  const [filter, setFilter] = useState<'all' | 'top' | 'today'>('all');
  useFocusEffect(useCallback(() => {
    let active = true;
    learningRepository.goal(route.params.goalId).then((item) => { if (active) setGoal(item); }).catch(() => {});
    return () => { active = false; };
  }, [route.params.goalId]));
  const tutors = (goal?.tutors ?? []).filter((tutor) => {
    if (filter === 'top') return tutor.rating >= 4.8;
    if (filter === 'today') return /today/i.test(tutor.slot);
    return true;
  });

  const book = async (tutor: GoalTutor) => {
    try {
      const result = await learningRepository.bookGoalTutor(route.params.goalId, tutor.key);
      Alert.alert('Session requested', `${result.tutorName} · ${result.slot}`);
      navigation.navigate('MainTabs', { screen: 'Sessions' });
    } catch {
      Alert.alert('Booking failed', 'Try again in a moment.');
    }
  };

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Find a Tutor" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>Recommended for {goal?.moduleCode}: Graph Traversals</Text>
        <Text style={styles.title}>Find a peer tutor</Text>
        <Text style={styles.meta}>{goal?.title}</Text>
        <View style={styles.filters}>
          {([['all', 'All'], ['top', 'Top rated'], ['today', 'Available today']] as const).map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.chip, filter === key && styles.chipOn]} onPress={() => setFilter(key)}>
              <Text style={[styles.chipText, filter === key && styles.chipTextOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.section}>{tutors.length} available</Text>
        {tutors.map((tutor) => (
          <View key={tutor.key} style={styles.card}>
            <Text style={styles.name}>{tutor.name}{tutor.verified ? '  ✓' : ''}</Text>
            <Text style={styles.meta}>{tutor.rating} · {tutor.specialty}</Text>
            <Text style={styles.meta}>{tutor.price} · {tutor.slot}</Text>
            <TouchableOpacity style={styles.book} onPress={() => book(tutor)}>
              <Text style={styles.bookText}>{tutor.key === 'tharushi' ? 'Book session' : 'View slots'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </AssessmentScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  kicker: { color: orange, fontWeight: '800' },
  title: { color: ink, fontSize: 26, fontWeight: '800', marginTop: 4 },
  meta: { color: muted, marginTop: 4 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { backgroundColor: '#E7EDF6', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: navy },
  chipText: { color: navy, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  section: { color: ink, fontWeight: '800', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 14, marginBottom: 10 },
  name: { color: ink, fontWeight: '800', fontSize: 18 },
  book: { marginTop: 10, backgroundColor: orange, borderRadius: 12, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8 },
  bookText: { color: navy, fontWeight: '800' },
});

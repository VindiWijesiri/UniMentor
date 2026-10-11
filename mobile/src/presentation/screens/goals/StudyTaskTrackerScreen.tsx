import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalBoard } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { card, ink, line, muted, navy, orange, soft } from '../assessments/theme';
import FocusSession from '../learning/FocusSession';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyTaskTracker'>;

const WEEKLY_TARGETS = [10, 15, 20, 25, 30];

export default function StudyTaskTrackerScreen({ navigation }: Props) {
  const [board, setBoard] = useState<GoalBoard | null>(null);
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [savingGoal, setSavingGoal] = useState(false);
  const [focusOn, setFocusOn] = useState(false);
  const load = useCallback(() => {
    let active = true;
    learningRepository.goalBoard().then((item) => { if (active) setBoard(item); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useFocusEffect(useCallback(() => load(), [load]));
  const weekly = board?.goals.find((goal) => goal.moduleCode === 'WEEK');
  const moduleGoalId = board?.goals.find((goal) => goal.moduleCode !== 'WEEK')?._id;

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Study Plan" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>Study plan · weekly goal</Text>
        <Text style={styles.synced}>{board?.syncedLabel}</Text>
        <View style={styles.week}>
          <Text style={styles.weekKicker}>Default weekly goal</Text>
          <Text style={styles.weekTitle}>{weekly?.title ?? 'Weekly study goal'}</Text>
          <Text style={styles.weekHours}>{board?.hoursDone ?? 0} / {board?.hoursGoal ?? 20} hrs · {Math.min(100, Math.round(board?.percent ?? 0))}%</Text>
          <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, board?.percent ?? 0)}%` }]} /></View>
          <Text style={styles.weekNote}>Hours are the time UniMentor stays open, plus any focus block you finish.</Text>
          <TouchableOpacity style={styles.start} onPress={() => setFocusOn(true)}>
            <Text style={styles.startText}>Start a focus block</Text>
          </TouchableOpacity>
          <View style={styles.targets}>
            {WEEKLY_TARGETS.map((hours) => {
              const selected = (board?.hoursGoal ?? 20) === hours;
              return (
                <TouchableOpacity
                  key={hours}
                  style={[styles.target, selected && styles.targetOn]}
                  disabled={savingGoal}
                  onPress={async () => {
                    setSavingGoal(true);
                    try {
                      await learningRepository.setWeeklyGoal(hours);
                      load();
                    } finally {
                      setSavingGoal(false);
                    }
                  }}
                >
                  <Text style={[styles.targetText, selected && styles.targetTextOn]}>{hours}h</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.days}>
            {(board?.days ?? []).map((day, index) => (
              <View key={`${day.label}-${index}`} style={[styles.day, day.state === 'today' && styles.dayToday]}>
                <Text style={[styles.dayLabel, day.state === 'today' && styles.dayLabelOn]}>{day.label}</Text>
                <Text style={[styles.dayDate, day.state === 'today' && styles.dayLabelOn]}>{day.date}</Text>
                <Text style={[styles.dayMark, day.state === 'today' && styles.dayLabelOn]}>{day.hours ? `${day.hours}h` : '0'}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.head}>
          <Text style={styles.section}>Today's focus sprints</Text>
          <Text style={styles.meta}>{(board?.tasks ?? []).filter((task) => task.status === 'open').length} tasks remaining</Text>
        </View>
        {(board?.tasks ?? []).map((task) => (
          <View key={task.id} style={styles.task}>
            <Text style={styles.kind}>{task.kind} · {task.minutes} mins</Text>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.meta}>{task.status === 'done' ? 'Done' : task.dueLabel}</Text>
            <TouchableOpacity
              style={styles.start}
              onPress={async () => {
                if (!task.goalId) return;
                await learningRepository.completeGoalTask(task.goalId, task.id);
                load();
              }}
            >
              <Text style={styles.startText}>{task.status === 'done' ? 'Reopen' : 'Start'}</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.head}>
          <Text style={styles.section}>Upcoming sessions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Sessions' })}><Text style={styles.link}>View all</Text></TouchableOpacity>
        </View>
        {(board?.sessions ?? []).map((session) => (
          <TouchableOpacity key={session.id} style={styles.session} onPress={() => moduleGoalId && navigation.navigate('GoalDetail', { goalId: moduleGoalId })}>
            <Text style={styles.taskTitle}>{session.title}</Text>
            <Text style={styles.meta}>{session.when}</Text>
          </TouchableOpacity>
        ))}
        {(board?.goals ?? []).filter((goal) => goal.moduleCode !== 'WEEK').map((goal) => (
          <TouchableOpacity key={goal._id} style={styles.goal} onPress={() => navigation.navigate('GoalDetail', { goalId: goal._id })}>
            <Text style={styles.kind}>{goal.moduleCode} · {goal.progress}%</Text>
            <Text style={styles.taskTitle}>{goal.title}</Text>
          </TouchableOpacity>
        ))}
        {composer ? (
          <TextInput value={title} onChangeText={setTitle} placeholder="New study task" placeholderTextColor={muted} style={styles.input} />
        ) : null}
        <OrangeButton
          label={composer ? 'Save study task' : '+ Add study task'}
          onPress={async () => {
            if (!composer) {
              setComposer(true);
              return;
            }
            if (!weekly?._id || !title.trim()) return;
            await learningRepository.addGoalTask(weekly._id, { title: title.trim(), kind: 'Problem Set', minutes: 30 });
            setTitle('');
            setComposer(false);
            load();
          }}
        />
      </ScrollView>
      <FocusSession
        visible={focusOn}
        areas={(board?.goals ?? []).map((goal) => ({ id: goal._id, title: goal.title, code: goal.moduleCode }))}
        areaId={weekly?._id || board?.weeklyGoalId || ''}
        minutes={25}
        chooseTime
        onClose={() => setFocusOn(false)}
        onSaved={load}
      />
    </AssessmentScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  kicker: { color: ink, fontWeight: '800' },
  synced: { color: muted, marginTop: 4 },
  week: { backgroundColor: navy, borderRadius: 18, padding: 14, marginTop: 12 },
  weekKicker: { color: orange, fontWeight: '800', fontSize: 11, letterSpacing: 0.5 },
  weekTitle: { color: '#fff', fontWeight: '800', fontSize: 18, marginTop: 4 },
  weekHours: { color: '#fff', fontWeight: '800', marginTop: 4 },
  weekNote: { color: '#C9D4EA', marginTop: 8, fontSize: 12 },
  targets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  target: { backgroundColor: '#1C3E78', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  targetOn: { backgroundColor: orange },
  targetText: { color: '#fff', fontWeight: '800' },
  targetTextOn: { color: navy },
  track: { height: 8, backgroundColor: '#1C3E78', borderRadius: 8, marginVertical: 10 },
  fill: { height: 8, backgroundColor: orange, borderRadius: 8 },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', width: 36 },
  dayToday: { backgroundColor: orange, borderRadius: 12, paddingVertical: 4 },
  dayLabel: { color: '#C9D4EA', fontSize: 11, fontWeight: '800' },
  dayLabelOn: { color: navy },
  dayDate: { color: '#fff', fontWeight: '800' },
  dayMark: { color: '#fff', fontSize: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  section: { color: ink, fontWeight: '800', fontSize: 16 },
  meta: { color: muted, marginTop: 4 },
  link: { color: navy, fontWeight: '800' },
  task: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  kind: { color: navy, fontWeight: '800', fontSize: 12 },
  taskTitle: { color: ink, fontWeight: '800', fontSize: 16, marginTop: 4 },
  start: { alignSelf: 'flex-end', marginTop: 8, backgroundColor: soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  startText: { color: navy, fontWeight: '800' },
  session: { backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  goal: { backgroundColor: '#EEF3FB', borderRadius: 14, padding: 12, marginBottom: 8 },
  input: { backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 12, padding: 12, color: ink, marginBottom: 8 },
});

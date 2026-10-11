import React, { useCallback, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { GoalBoard, GoalTask } from '../../../domain/entities/GoalPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from '../assessments/Chrome';
import { card, ink, line, muted, navy, orange, soft } from '../assessments/theme';
import FocusSession from '../learning/FocusSession';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyTaskTracker'>;

const WEEKLY_TARGETS = [10, 15, 20, 25, 30];

export default function StudyTaskTrackerScreen({ navigation }: Props) {
  const [board, setBoard] = useState<GoalBoard | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [taskEditor, setTaskEditor] = useState<GoalTask | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskKind, setTaskKind] = useState('Problem Set');
  const [taskMinutes, setTaskMinutes] = useState('30');
  const [taskDue, setTaskDue] = useState('Due today');
  const [taskBusy, setTaskBusy] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [focusOn, setFocusOn] = useState(false);
  const [goalEditor, setGoalEditor] = useState<'create' | string | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCode, setGoalCode] = useState('');
  const [goalDue, setGoalDue] = useState('This week');
  const [goalPriority, setGoalPriority] = useState('Medium');
  const [goalBusy, setGoalBusy] = useState(false);
  const [goalError, setGoalError] = useState('');
  const load = useCallback(() => {
    let active = true;
    learningRepository.goalBoard().then((item) => { if (active) setBoard(item); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useFocusEffect(useCallback(() => load(), [load]));
  const weekly = board?.goals.find((goal) => goal.moduleCode === 'WEEK' || goal.seedKey === 'goal-weekly');
  const moduleGoals = (board?.goals ?? []).filter((goal) => goal._id !== weekly?._id);
  const moduleGoalId = moduleGoals[0]?._id;

  const confirmDelete = (message: string) => new Promise<boolean>((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(message));
      return;
    }
    Alert.alert('Delete', message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });

  const openGoalEditor = (goal?: NonNullable<GoalBoard['goals']>[number]) => {
    setGoalEditor(goal?._id ?? 'create');
    setGoalTitle(goal?.title ?? '');
    setGoalCode(goal?.moduleCode === 'WEEK' ? '' : goal?.moduleCode ?? '');
    setGoalDue(goal?.dueLabel || 'This week');
    setGoalPriority(goal?.priority || 'Medium');
    setGoalError('');
  };

  const saveGoal = async () => {
    if (!goalTitle.trim()) {
      setGoalError('Add a goal title.');
      return;
    }
    setGoalBusy(true);
    setGoalError('');
    try {
      const editingWeekly = goalEditor === weekly?._id;
      const body = {
        title: goalTitle.trim(),
        moduleCode: editingWeekly ? 'WEEK' : goalCode.trim(),
        dueLabel: goalDue.trim() || 'This week',
        priority: editingWeekly ? (goalPriority || 'Default') : goalPriority,
      };
      if (goalEditor && goalEditor !== 'create') await learningRepository.updateGoal(goalEditor, body);
      else await learningRepository.createGoal(body);
      setGoalEditor(null);
      load();
    } catch (err: any) {
      setGoalError(err?.response?.data?.message ?? 'Could not save this goal.');
    } finally {
      setGoalBusy(false);
    }
  };

  const openTaskEditor = (task?: GoalTask) => {
    setAddingTask(!task);
    setTaskEditor(task ?? null);
    setTaskTitle(task?.title ?? '');
    setTaskKind(task?.kind || 'Problem Set');
    setTaskMinutes(String(task?.minutes || 30));
    setTaskDue(task?.dueLabel || 'Due today');
    setTaskError('');
  };

  const saveTask = async () => {
    if (!taskTitle.trim()) {
      setTaskError('Add a task title.');
      return;
    }
    const goalId = taskEditor?.goalId || weekly?._id;
    if (!goalId) return;
    setTaskBusy(true);
    setTaskError('');
    try {
      const body = {
        title: taskTitle.trim(),
        kind: taskKind,
        minutes: Number(taskMinutes) || 30,
        dueLabel: taskDue.trim() || 'Due today',
      };
      if (taskEditor) await learningRepository.updateGoalTask(goalId, taskEditor.id, body);
      else await learningRepository.addGoalTask(goalId, body);
      setAddingTask(false);
      setTaskEditor(null);
      load();
    } catch (err: any) {
      setTaskError(err?.response?.data?.message ?? 'Could not save this task.');
    } finally {
      setTaskBusy(false);
    }
  };

  const setTaskStatus = async (task: GoalTask, status: GoalTask['status']) => {
    if (!task.goalId) return;
    try {
      await learningRepository.updateGoalTask(task.goalId, task.id, { status });
      load();
    } catch (err: any) {
      setTaskError(err?.response?.data?.message ?? 'Could not update this task.');
    }
  };

  const removeTask = async (task: GoalTask) => {
    if (!task.goalId) return;
    if (!(await confirmDelete('Remove this study task?'))) return;
    try {
      await learningRepository.deleteGoalTask(task.goalId, task.id);
      if (taskEditor?.id === task.id) setTaskEditor(null);
      load();
    } catch (err: any) {
      setTaskError(err?.response?.data?.message ?? 'Could not delete this task.');
    }
  };

  const removeGoal = async (id: string) => {
    if (!(await confirmDelete('Remove this study goal?'))) return;
    try {
      await learningRepository.deleteGoal(id);
      if (goalEditor === id) setGoalEditor(null);
      load();
    } catch (err: any) {
      setGoalError(err?.response?.data?.message ?? 'Could not delete this goal.');
    }
  };

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar
        title="Study Plan"
        onBack={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else navigation.navigate('MainTabs', { screen: 'Home' });
        }}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.kicker}>Study plan · weekly goal</Text>
        <Text style={styles.synced}>{board?.syncedLabel}</Text>
        <View style={styles.week}>
          <Text style={styles.weekKicker}>Default weekly goal</Text>
          <View style={styles.weekTitleRow}>
            <Text style={styles.weekTitle}>{weekly?.title ?? 'Weekly study goal'}</Text>
            {weekly ? (
              <TouchableOpacity onPress={() => openGoalEditor(weekly)}>
                <Text style={styles.weekEdit}>Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>
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
          <Text style={styles.section}>Today's tasks</Text>
          <TouchableOpacity onPress={() => openTaskEditor()}><Text style={styles.link}>Add</Text></TouchableOpacity>
        </View>
        {addingTask || taskEditor ? (
          <View style={styles.editor}>
            <Text style={styles.section}>{taskEditor ? 'Edit task' : 'New task'}</Text>
            <TextInput value={taskTitle} onChangeText={setTaskTitle} placeholder="Task title" placeholderTextColor={muted} style={styles.input} />
            <View style={styles.targets}>
              {['Revision', 'Problem Set', 'Reading', 'Practice'].map((kind) => (
                <TouchableOpacity key={kind} style={[styles.choice, taskKind === kind && styles.choiceOn]} onPress={() => setTaskKind(kind)}>
                  <Text style={[styles.choiceText, taskKind === kind && styles.choiceTextOn]}>{kind}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.targets}>
              {['15', '30', '45', '60'].map((minutes) => (
                <TouchableOpacity key={minutes} style={[styles.choice, taskMinutes === minutes && styles.choiceOn]} onPress={() => setTaskMinutes(minutes)}>
                  <Text style={[styles.choiceText, taskMinutes === minutes && styles.choiceTextOn]}>{minutes} min</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={taskDue} onChangeText={setTaskDue} placeholder="Due today" placeholderTextColor={muted} style={styles.input} />
            {taskError ? <Text style={styles.danger}>{taskError}</Text> : null}
            <OrangeButton label={taskBusy ? 'Saving...' : 'Save task'} onPress={() => { if (!taskBusy) void saveTask(); }} />
            <TouchableOpacity onPress={() => { setAddingTask(false); setTaskEditor(null); }}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
        ) : null}
        {([
          ['To do', (board?.tasks ?? []).filter((task) => task.status !== 'active' && task.status !== 'done')],
          ['In progress', (board?.tasks ?? []).filter((task) => task.status === 'active')],
          ['Done', (board?.tasks ?? []).filter((task) => task.status === 'done')],
        ] as const).map(([label, items]) => (
          <View key={label}>
            <Text style={styles.groupLabel}>{label} · {items.length}</Text>
            {items.length === 0 ? <Text style={styles.meta}>{label === 'Done' ? 'Finished tasks show up here.' : label === 'In progress' ? 'Start a task to work on it.' : 'No tasks waiting.'}</Text> : null}
            {items.map((task) => (
              <View key={task.id} style={[styles.task, task.status === 'active' && styles.taskActive, task.status === 'done' && styles.taskDone]}>
                <Text style={styles.kind}>{task.kind} · {task.minutes} mins</Text>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.meta}>
                  {task.status === 'active' ? 'In progress' : task.status === 'done' ? 'Done' : task.dueLabel}
                </Text>
                <View style={styles.taskActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openTaskEditor(task)} hitSlop={6}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => { void removeTask(task); }} hitSlop={6}>
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                  {task.status === 'done' ? (
                    <TouchableOpacity onPress={() => { void setTaskStatus(task, 'open'); }}><Text style={styles.link}>Reopen</Text></TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.taskButton}
                      onPress={() => { void setTaskStatus(task, task.status === 'active' ? 'done' : 'active'); }}
                    >
                      <Text style={styles.taskButtonText}>{task.status === 'active' ? 'End' : 'Start'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
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
        <View style={styles.head}>
          <Text style={styles.section}>Study goals</Text>
          <TouchableOpacity onPress={() => openGoalEditor()}><Text style={styles.link}>Add</Text></TouchableOpacity>
        </View>
        {moduleGoals.length === 0 ? <Text style={styles.meta}>No module goals yet. Add one to track it here.</Text> : null}
        {moduleGoals.map((goal) => (
          <View key={goal._id} style={styles.goal}>
            <TouchableOpacity onPress={() => navigation.navigate('GoalDetail', { goalId: goal._id })}>
              <Text style={styles.kind}>{goal.moduleCode || 'Goal'} · {goal.progress}%</Text>
              <Text style={styles.taskTitle}>{goal.title}</Text>
              <Text style={styles.meta}>{goal.priority ? `${goal.priority} · ` : ''}{goal.dueLabel}</Text>
            </TouchableOpacity>
            <View style={styles.taskActions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openGoalEditor(goal)} hitSlop={6}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => { void removeGoal(goal._id); }} hitSlop={6}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {goalEditor ? (
          <View style={styles.editor}>
            <Text style={styles.section}>{goalEditor === 'create' ? 'New study goal' : 'Edit study goal'}</Text>
            <TextInput value={goalTitle} onChangeText={setGoalTitle} placeholder="Goal title" placeholderTextColor={muted} style={styles.input} />
            {goalEditor !== weekly?._id ? (
              <TextInput value={goalCode} onChangeText={setGoalCode} placeholder="Module code" placeholderTextColor={muted} style={styles.input} />
            ) : null}
            <TextInput value={goalDue} onChangeText={setGoalDue} placeholder="Due" placeholderTextColor={muted} style={styles.input} />
            <View style={styles.targets}>
              {['High Priority', 'Medium', 'Low'].map((priority) => (
                <TouchableOpacity key={priority} style={[styles.target, goalPriority === priority && styles.targetOn]} onPress={() => setGoalPriority(priority)}>
                  <Text style={[styles.targetText, goalPriority === priority && styles.targetTextOn]}>{priority}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {goalError ? <Text style={styles.danger}>{goalError}</Text> : null}
            <OrangeButton label={goalBusy ? 'Saving...' : 'Save goal'} onPress={() => { if (!goalBusy) void saveGoal(); }} />
            <TouchableOpacity onPress={() => setGoalEditor(null)}><Text style={styles.cancel}>Cancel</Text></TouchableOpacity>
          </View>
        ) : null}
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
  weekTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  weekTitle: { color: '#fff', fontWeight: '800', fontSize: 18, flex: 1 },
  weekEdit: { color: orange, fontWeight: '800' },
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
  groupLabel: { color: muted, fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  task: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  taskActive: { borderColor: orange, backgroundColor: '#FFFBEB' },
  taskDone: { backgroundColor: '#F8FAFC' },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: line,
  },
  editBtn: {
    backgroundColor: '#EEF3FB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    justifyContent: 'center',
  },
  editBtnText: { color: navy, fontWeight: '800', fontSize: 13 },
  deleteBtn: {
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    justifyContent: 'center',
  },
  deleteBtnText: { color: '#B45309', fontWeight: '800', fontSize: 13 },
  taskButton: { marginLeft: 'auto', backgroundColor: orange, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  taskButtonText: { color: navy, fontWeight: '800' },
  choice: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: line, paddingHorizontal: 12, paddingVertical: 8 },
  choiceOn: { backgroundColor: navy, borderColor: navy },
  choiceText: { color: navy, fontWeight: '800', fontSize: 12 },
  choiceTextOn: { color: '#fff' },
  kind: { color: navy, fontWeight: '800', fontSize: 12 },
  taskTitle: { color: ink, fontWeight: '800', fontSize: 16, marginTop: 4 },
  start: { alignSelf: 'flex-end', marginTop: 8, backgroundColor: soft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  startText: { color: navy, fontWeight: '800' },
  session: { backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  goal: { backgroundColor: '#EEF3FB', borderRadius: 14, padding: 12, marginBottom: 8 },
  goalActions: { flexDirection: 'row', gap: 16, marginTop: 8 },
  danger: { color: '#B45309', fontWeight: '800', marginTop: 6 },
  editor: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 12 },
  cancel: { color: muted, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  input: { backgroundColor: card, borderWidth: 1, borderColor: line, borderRadius: 12, padding: 12, color: ink, marginBottom: 8 },
});

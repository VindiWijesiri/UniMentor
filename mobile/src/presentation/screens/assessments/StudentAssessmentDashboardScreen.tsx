import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import type { AssessmentCard, AssessmentCenter } from '../../../domain/entities/AssessmentWork';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { PageSubbar } from '../../components/PageHeader';
import { AssessmentScreen, KuppiyaBar, OrangeButton, SearchField } from './Chrome';
import { blue, card, danger, ink, line, muted, navy, orange, soft } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Assessments'>;
type Filter = 'all' | 'dueSoon' | 'inProgress' | 'completed';

export default function StudentAssessmentDashboardScreen({ navigation }: Props) {
  const [data, setData] = useState<AssessmentCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(() => {
    let active = true;
    assessmentRepository.center()
      .then((center) => { if (active) { setData(center); setError(''); } })
      .catch(() => { if (active) setError('Could not load assessments.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const items = useMemo(() => {
    const value = query.trim().toLowerCase();
    return (data?.items ?? []).filter((item) => {
      const matchesFilter = filter === 'all' || item.bucket === filter || (filter === 'dueSoon' && item.bucket === 'upcoming' && item.urgent);
      const matchesQuery = !value || `${item.title} ${item.moduleName} ${item.kindLabel}`.toLowerCase().includes(value);
      return matchesFilter && matchesQuery;
    });
  }, [data, filter, query]);

  const active = items.filter((item) => item.bucket !== 'completed');
  const done = items.filter((item) => item.bucket === 'completed');
  const openPaper = (item: AssessmentCard) => {
    if (item.status === 'graded' || item.status === 'submitted') navigation.navigate('AssessmentResult', { paperId: item.paperId });
    else navigation.navigate('TakeAssessment', { paperId: item.paperId });
  };

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="Assessments" />
      <PageSubbar>
        <FilterChip label={`All (${data?.counts.all ?? 0})`} on={filter === 'all'} onPress={() => setFilter('all')} />
        <FilterChip label={`Due Soon (${data?.counts.dueSoon ?? 0})`} on={filter === 'dueSoon'} onPress={() => setFilter('dueSoon')} />
        <FilterChip label={`In Progress (${data?.counts.inProgress ?? 0})`} on={filter === 'inProgress'} onPress={() => setFilter('inProgress')} />
        <FilterChip label={`Completed (${data?.counts.completed ?? 0})`} on={filter === 'completed'} onPress={() => setFilter('completed')} />
      </PageSubbar>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={styles.title}>My Assessments</Text>
            <Text style={styles.cohort}>{data?.cohort ?? 'Cohort: 2026 Semester 2'}</Text>
          </View>
          <TouchableOpacity style={styles.insight} onPress={() => navigation.navigate('AssessmentHistory')}>
            <MaterialIcons name="insights" size={22} color={blue} />
          </TouchableOpacity>
        </View>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search exams, quizzes, case studies..." />

        {loading && !data ? <ActivityIndicator color={navy} style={styles.loader} /> : null}
        {error && !data ? <Text style={styles.error}>{error}</Text> : null}

        {data ? (
          <View style={styles.momentum}>
            <View style={styles.momentumTop}>
              <View style={styles.flex}>
                <Text style={styles.momentumKicker}>Semester momentum</Text>
                <Text style={styles.momentumTitle}>Assessment Health</Text>
                <Text style={styles.momentumSub}>{data.health.percentile}</Text>
              </View>
              <View style={styles.ring}>
                <Text style={styles.ringValue}>{data.health.avgScore}%</Text>
                <Text style={styles.ringLabel}>Avg score</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <Stat value={data.health.completed} label="Completed" />
              <Stat value={data.health.pending} label="Pending" />
              <Stat value={data.health.urgent} label="Urgent" />
            </View>
            <View style={styles.spot}>
              <MaterialIcons name="alarm" size={16} color={orange} />
              <View style={styles.flex}>
                <Text style={styles.spotTitle}>{data.health.spotlightTitle}</Text>
                <Text style={styles.spotDetail}>{data.health.spotlightDetail}</Text>
              </View>
            </View>
            {data.health.resumePaperId ? (
              <OrangeButton label="Resume Active Assessment" icon="play-arrow" onPress={() => navigation.navigate('TakeAssessment', { paperId: String(data.health.resumePaperId) })} />
            ) : null}
          </View>
        ) : null}

        {active.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active & Due Soon</Text>
              <Text style={styles.sectionMeta}>{active.length} tasks</Text>
            </View>
            {active.map((item) => <TaskCard key={item.paperId} item={item} onPress={() => openPaper(item)} />)}
          </>
        )}
        {done.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed & Graded</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AssessmentHistory')}><Text style={styles.link}>View History</Text></TouchableOpacity>
            </View>
            {done.map((item) => <DoneCard key={item.paperId} item={item} onPress={() => openPaper(item)} />)}
          </>
        )}
        <View style={styles.circle}>
          <Text style={styles.optionTitle}>Need a Kuppiya study circle?</Text>
          <Text style={styles.optionDetail}>3 peers are revising Probability & Stats right now.</Text>
          <TouchableOpacity style={styles.join} onPress={() => navigation.navigate('ChatPod')}><Text style={styles.joinText}>Join</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </AssessmentScreen>
  );
}

function FilterChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TaskCard({ item, onPress }: { item: AssessmentCard; onPress: () => void }) {
  return (
    <View style={styles.task}>
      {item.urgent ? <Text style={styles.critical}>Critical deadline</Text> : null}
      <Text style={styles.taskTitle}>{item.title}</Text>
      <View style={styles.chips}>
        {item.chips.map((chip) => <View key={chip} style={styles.mini}><Text style={styles.miniText}>{chip}</Text></View>)}
      </View>
      <Text style={styles.due}>{item.dueLabel} · {item.detail}</Text>
      {item.status === 'in_progress' ? (
        <View style={styles.progressWrap}>
          <View style={[styles.progress, { width: `${item.progress}%` }]} />
        </View>
      ) : <Text style={styles.optionDetail}>Not started</Text>}
      <TouchableOpacity style={styles.start} onPress={onPress}><Text style={styles.startText}>{item.action}</Text></TouchableOpacity>
    </View>
  );
}

function DoneCard({ item, onPress }: { item: AssessmentCard; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.task} onPress={onPress}>
      <Text style={styles.module}>Module: {item.moduleName}</Text>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.due}>{item.dueLabel}</Text>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>{item.score ?? '—'}</Text>
        <Text style={styles.scoreMax}>/{item.maxScore}</Text>
        {item.gradeLabel ? <View style={styles.grade}><Text style={styles.gradeText}>{item.gradeLabel}</Text></View> : null}
      </View>
      {item.feedback ? <Text style={styles.feedback}>“{item.feedback}”</Text> : null}
      <Text style={styles.link}>{item.action}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 28 },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { color: ink, fontSize: 28, fontWeight: '800' },
  cohort: { color: muted, marginTop: 4 },
  insight: { width: 42, height: 42, borderRadius: 14, backgroundColor: card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: line },
  filters: { gap: 8, paddingVertical: 12 },
  chip: { backgroundColor: '#C4D4EE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: navy },
  chipText: { color: navy, fontWeight: '800' },
  chipTextOn: { color: '#fff' },
  loader: { marginVertical: 20 },
  error: { color: danger, marginVertical: 12 },
  momentum: { backgroundColor: navy, borderRadius: 22, padding: 16, marginBottom: 8 },
  momentumTop: { flexDirection: 'row', gap: 12 },
  momentumKicker: { color: orange, fontWeight: '800', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  momentumTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  momentumSub: { color: '#C9D4EA', marginTop: 4 },
  ring: { width: 78, height: 78, borderRadius: 39, borderWidth: 6, borderColor: orange, alignItems: 'center', justifyContent: 'center' },
  ringValue: { color: '#fff', fontWeight: '800', fontSize: 16 },
  ringLabel: { color: '#C9D4EA', fontSize: 9 },
  statRow: { flexDirection: 'row', backgroundColor: '#1C3E78', borderRadius: 16, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: { color: '#C9D4EA', fontSize: 11, marginTop: 2 },
  spot: { flexDirection: 'row', gap: 8, backgroundColor: '#1C3E78', borderRadius: 14, padding: 12, marginVertical: 12 },
  spotTitle: { color: '#fff', fontWeight: '800' },
  spotDetail: { color: orange, marginTop: 2, fontSize: 12 },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  sectionTitle: { color: ink, fontSize: 18, fontWeight: '800' },
  sectionMeta: { color: muted, fontWeight: '700' },
  link: { color: blue, fontWeight: '800', marginTop: 8 },
  task: { backgroundColor: card, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: line },
  critical: { color: danger, fontWeight: '800', fontSize: 11, letterSpacing: 0.4, textTransform: 'uppercase' },
  taskTitle: { color: ink, fontSize: 16, fontWeight: '800', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  mini: { backgroundColor: '#EEF3FB', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  miniText: { color: blue, fontSize: 11, fontWeight: '700' },
  due: { color: muted, marginTop: 8 },
  progressWrap: { height: 8, backgroundColor: '#E7EDF6', borderRadius: 8, marginTop: 8 },
  progress: { height: 8, backgroundColor: orange, borderRadius: 8 },
  start: { marginTop: 12, backgroundColor: orange, borderRadius: 14, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  startText: { color: navy, fontWeight: '800' },
  optionDetail: { color: muted, marginTop: 6 },
  module: { color: muted, fontSize: 12, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 },
  score: { color: ink, fontSize: 32, fontWeight: '800' },
  scoreMax: { color: muted, marginBottom: 6, marginLeft: 2 },
  grade: { marginLeft: 10, marginBottom: 8, backgroundColor: soft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  gradeText: { color: navy, fontWeight: '800' },
  feedback: { color: ink, marginTop: 8, lineHeight: 20 },
  circle: { backgroundColor: '#EEF3FB', borderRadius: 18, padding: 14, marginTop: 8 },
  optionTitle: { color: ink, fontWeight: '800' },
  join: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: navy, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  joinText: { color: '#fff', fontWeight: '800' },
});

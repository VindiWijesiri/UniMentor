import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { TutorLearningDashboard, TutorQueueStudent, TutorStudentStatus } from '../../../domain/entities/Learning';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import { card, ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = BottomTabScreenProps<AppTabParamList, 'Learning'>;
type StackNav = NativeStackNavigationProp<AppStackParamList>;
type FilterKey = 'all' | 'review' | 'atRisk';

async function openStudentChat(stack: StackNav | undefined, student: TutorQueueStudent) {
  try {
    const target = await learningRepository.getTutorChatTarget(student._id);
    stack?.navigate('Chat', {
      mentor: {
        _id: target._id,
        name: target.name,
        email: target.email,
        subjects: target.subjects ?? [],
        bio: target.bio ?? '',
        rating: target.rating ?? 0,
        reviewCount: target.reviewCount ?? 0,
        role: 'student',
      },
    });
  } catch {
    Alert.alert('Chat unavailable', 'This roster row will link to a student account when the Students page is built.');
  }
}

export default function TutorLearningDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const stack = navigation.getParent<StackNav>();
  const [data, setData] = useState<TutorLearningDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    learningRepository.getTutorDashboard()
      .then((dashboard) => {
        if (active) {
          setData(dashboard);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Could not load the tutor workspace.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const visible = useMemo(() => {
    const value = query.trim().toLowerCase();
    return (data?.queue ?? []).filter((item) => {
      const matchesFilter = filter === 'all'
        || (filter === 'review' && item.status === 'review')
        || (filter === 'atRisk' && item.status === 'atRisk');
      const matchesQuery = !value
        || [item.name, item.studentCode, item.moduleCode, item.programme]
          .some((field) => field.toLowerCase().includes(value));
      return matchesFilter && matchesQuery;
    });
  }, [data, filter, query]);

  const assign = async (student: TutorQueueStudent, kind: 'study' | 'recovery') => {
    await learningRepository.assignTutorPack(student._id, kind);
    Alert.alert(kind === 'recovery' ? 'Recovery pack assigned' : 'Material assigned', `${student.name} received the pack.`);
    load();
  };

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
          <View style={styles.heroTop}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.back}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Learning Management</Text>
            <Text style={styles.brand}>UniMentor</Text>
          </View>
          <Text style={styles.workspace}>
            Tutor Workspace · {data?.header.enrolled ?? 0} Enrolled · Cohort: {data?.header.cohort ?? 'DSA & OOP'}
          </Text>
        </View>

        {loading && !data ? (
          <View style={styles.state}><ActivityIndicator color={navy} /><Text style={styles.stateText}>Loading workspace...</Text></View>
        ) : error && !data ? (
          <View style={styles.state}><Text style={styles.stateTitle}>{error}</Text></View>
        ) : (
          <View style={styles.body}>
            <View style={styles.statsGrid}>
              <StatCard label="Active Students" value={String(data?.stats.activeStudents ?? 0)} hint={`+${data?.stats.newStudents ?? 0} new`} />
              <StatCard
                label="Pending Grading"
                value={String(data?.stats.pendingGrading ?? 0)}
                hint="submissions"
                action
                onPress={() => setFilter('review')}
              />
              <StatCard label="Assigned Packs" value={String(data?.stats.assignedPacks ?? 0)} hint="docs active" />
              <StatCard
                label="Avg Class Mastery"
                value={`${data?.stats.classMastery ?? 0}%`}
                hint={`+${data?.stats.masteryDelta ?? 0}%`}
              />
            </View>

            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by name, student ID, module"
                placeholderTextColor={muted}
                style={styles.searchInput}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label={`All (${data?.filters.all ?? 0})`} active={filter === 'all'} onPress={() => setFilter('all')} />
              <Chip label={`Needs Review (${data?.filters.needsReview ?? 0})`} active={filter === 'review'} onPress={() => setFilter('review')} />
              <Chip label={`At Risk <60% (${data?.filters.atRisk ?? 0})`} active={filter === 'atRisk'} onPress={() => setFilter('atRisk')} />
            </ScrollView>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Student Assessment Queue</Text>
              <Text style={styles.sectionMeta}>Sorted by Priority</Text>
            </View>

            {visible.map((student) => (
              <QueueCard
                key={student._id}
                student={student}
                onGrade={() => stack?.navigate('GradeSubmission', { id: student._id })}
                onAnalytics={() => stack?.navigate('TutorStudent', { id: student._id })}
                onAssign={() => assign(student, 'study')}
                onRecovery={() => assign(student, 'recovery')}
                onChat={() => openStudentChat(stack, student)}
              />
            ))}

            <View style={styles.card}>
              <View style={styles.sectionHead}>
                <Text style={styles.cardTitle}>Quick Assessment & Pack Dispatcher</Text>
                <TouchableOpacity onPress={() => stack?.navigate('PackDispatcher')}>
                  <Text style={styles.manage}>Manage All</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.dispatchRow}>
                <TouchableOpacity
                  style={styles.dispatchBtn}
                  onPress={async () => {
                    await learningRepository.dispatchTutorPack('mock');
                    Alert.alert('Mock assigned', 'The batch mock was pushed to the cohort.');
                    load();
                  }}
                >
                  <Text style={styles.dispatchTitle}>Batch Assign Mock</Text>
                  <Text style={styles.dispatchMeta}>Select cohort and set an automated reminder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dispatchBtn}
                  onPress={async () => {
                    await learningRepository.dispatchTutorPack('study');
                    Alert.alert('Study pack pushed', 'Notes were sent to the cohort.');
                    load();
                  }}
                >
                  <Text style={styles.dispatchTitle}>Push Study Pack</Text>
                  <Text style={styles.dispatchMeta}>Sync slides and cheat sheets instantly</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.engine}>Rubric & Anti-Plagiarism Engine · {data?.tools.plagiarismFlags ?? 0} Flags</Text>
            </View>

            <View style={styles.tools}>
              {[
                { key: 'bank', label: 'Item Bank' },
                { key: 'voice', label: 'Voice Marks' },
                { key: 'squads', label: 'Squads' },
                { key: 'export', label: 'Export CSV' },
              ].map((tool) => (
                <TouchableOpacity
                  key={tool.key}
                  style={styles.tool}
                  onPress={() => stack?.navigate('TutorTools', { tool: tool.key as 'bank' | 'voice' | 'squads' | 'export' })}
                >
                  <View style={styles.toolDot} />
                  <Text style={styles.toolLabel}>{tool.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label, value, hint, action, onPress,
}: { label: string; value: string; hint: string; action?: boolean; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.statCard} activeOpacity={onPress ? 0.8 : 1} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statHint, action && styles.statAction]}>{action ? 'ACTION' : hint}</Text>
    </TouchableOpacity>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, active && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function QueueCard({
  student, onGrade, onAnalytics, onAssign, onRecovery, onChat,
}: {
  student: TutorQueueStudent;
  onGrade: () => void;
  onAnalytics: () => void;
  onAssign: () => void;
  onRecovery: () => void;
  onChat: () => void;
}) {
  const status = statusCopy(student.status);
  return (
    <View style={styles.card}>
      <View style={styles.queueTop}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{student.initials}</Text></View>
        <View style={styles.grow}>
          <View style={styles.rowBetween}>
            <Text style={styles.studentName}>{student.name}</Text>
            <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.meta}>Year {student.year} · {student.programme} · {student.studentCode}</Text>
        </View>
      </View>
      <Text style={styles.workTitle}>{student.workTitle}</Text>
      {student.status === 'review' && (
        <>
          <Text style={styles.meta}>
            Submitted {student.submittedAgo}
            {student.taskLabel ? ` · ${student.taskLabel}` : ''}
            {student.questionCount ? ` · ${student.questionCount} questions` : ''}
            {student.pdfReady ? ' · PDF ready' : ''}
          </Text>
          <Text style={styles.score}>Score: --/{student.maxScore}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.yellowBtn} onPress={onGrade}>
              <Text style={styles.yellowText}>Grade Now (PDF Diff)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onChat}><Text style={styles.iconBtnText}>💬</Text></TouchableOpacity>
          </View>
        </>
      )}
      {student.status === 'graded' && (
        <>
          <Text style={styles.score}>Score: {student.score}/{student.maxScore}</Text>
          <Text style={styles.meta}>
            Graded{student.feedbackSent ? ' + feedback sent' : ''} {student.gradedAgo}
            {student.packsDownloaded ? ` · ${student.packsDownloaded} packs downloaded` : ''}
            {student.classRank ? ` · Class rank #${student.classRank}` : ''}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.lightBtn} onPress={onAssign}><Text style={styles.lightText}>Assign Material</Text></TouchableOpacity>
            <TouchableOpacity style={styles.lightBtn} onPress={onAnalytics}><Text style={styles.lightText}>View Analytics</Text></TouchableOpacity>
          </View>
        </>
      )}
      {student.status === 'atRisk' && (
        <>
          <Text style={styles.risk}>Mid-term {student.midtermPercent}% · Below threshold</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.dangerBtn} onPress={onRecovery}><Text style={styles.dangerText}>Assign Recovery Pack</Text></TouchableOpacity>
            <TouchableOpacity style={styles.navyBtn} onPress={onChat}><Text style={styles.navyText}>1-on-1</Text></TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

function statusCopy(status: TutorStudentStatus) {
  if (status === 'review') return { label: 'AWAITING REVIEW', color: '#B45309' };
  if (status === 'atRisk') return { label: 'AT RISK', color: '#DC2626' };
  return { label: 'ACTIVE', color: '#15803D' };
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  scroll: { paddingBottom: 24 },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 18 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 28, fontWeight: '300', marginRight: 8 },
  heroTitle: { flex: 1, color: '#FFF', fontSize: 18, fontWeight: '900' },
  brand: { color: yellow, fontSize: 13, fontWeight: '800' },
  workspace: { color: '#C5D4EB', fontSize: 12, marginTop: 8 },
  body: { padding: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    width: '48.5%', backgroundColor: card, borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#E6EAF2',
  },
  statLabel: { color: muted, fontSize: 11, fontWeight: '700' },
  statValue: { color: ink, fontSize: 26, fontWeight: '900', marginTop: 4 },
  statHint: { color: '#15803D', fontSize: 11, fontWeight: '700', marginTop: 2 },
  statAction: { color: '#B45309' },
  searchBox: {
    marginTop: 12, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: '#E6EAF2',
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, minHeight: 46,
  },
  searchIcon: { color: muted, fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: ink, fontSize: 13 },
  chips: { gap: 8, paddingVertical: 12 },
  chip: { borderRadius: 16, borderWidth: 1, borderColor: '#D9E1EE', paddingHorizontal: 12, paddingVertical: 7, backgroundColor: card },
  chipOn: { backgroundColor: navy, borderColor: navy },
  chipText: { color: ink, fontSize: 12, fontWeight: '800' },
  chipTextOn: { color: '#FFF' },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { color: ink, fontSize: 15, fontWeight: '900' },
  sectionMeta: { color: muted, fontSize: 11, fontWeight: '700' },
  card: { backgroundColor: card, borderRadius: 18, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E6EAF2' },
  cardTitle: { color: ink, fontSize: 14, fontWeight: '900', flex: 1, marginRight: 8 },
  queueTop: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: navy, fontSize: 13, fontWeight: '900' },
  grow: { flex: 1 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  studentName: { color: ink, fontSize: 15, fontWeight: '900', flex: 1 },
  status: { fontSize: 10, fontWeight: '900' },
  meta: { color: muted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  workTitle: { color: ink, fontSize: 14, fontWeight: '800', marginTop: 10 },
  score: { color: ink, fontSize: 13, fontWeight: '800', marginTop: 6 },
  risk: { color: '#DC2626', fontSize: 12, fontWeight: '800', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  yellowBtn: { flex: 1, backgroundColor: yellow, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  yellowText: { color: navy, fontWeight: '900', fontSize: 13 },
  iconBtn: { width: 46, borderRadius: 14, backgroundColor: '#F4F7FB', alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 16 },
  lightBtn: { flex: 1, backgroundColor: '#FFF8D5', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  lightText: { color: navy, fontWeight: '800', fontSize: 12 },
  dangerBtn: { flex: 1, backgroundColor: '#FEE2E2', borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  dangerText: { color: '#B91C1C', fontWeight: '900', fontSize: 12 },
  navyBtn: { flex: 1, backgroundColor: navy, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  navyText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  manage: { color: '#0B6B5B', fontSize: 12, fontWeight: '800' },
  dispatchRow: { flexDirection: 'row', gap: 8 },
  dispatchBtn: { flex: 1, backgroundColor: '#F7FAFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E1E9F6' },
  dispatchTitle: { color: ink, fontSize: 13, fontWeight: '900' },
  dispatchMeta: { color: muted, fontSize: 11, marginTop: 6, lineHeight: 15 },
  engine: { color: '#15803D', fontSize: 11, fontWeight: '800', marginTop: 12 },
  tools: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  tool: { alignItems: 'center', width: '23%' },
  toolDot: { width: 36, height: 36, borderRadius: 12, backgroundColor: card, borderWidth: 1, borderColor: '#E6EAF2', marginBottom: 6 },
  toolLabel: { color: ink, fontSize: 10, fontWeight: '800', textAlign: 'center' },
  state: { padding: 40, alignItems: 'center' },
  stateText: { color: muted, marginTop: 8 },
  stateTitle: { color: ink, fontWeight: '800' },
});

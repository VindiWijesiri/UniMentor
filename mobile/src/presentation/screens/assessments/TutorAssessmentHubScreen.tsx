import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import { tutorPortalRepository, type TutorPerson } from '../../../data/repositories/tutorPortalRepository';
import { ASSESSMENT_KINDS, KIND_META, type AssessmentKind, type TutorAssessmentHub, type TutorHubItem } from '../../../domain/entities/AssessmentWork';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, OrangeButton } from './Chrome';
import { blue, card, ink, line, muted, navy, orange, soft } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorAssessmentHub'>;

export default function TutorAssessmentHubScreen({ navigation }: Props) {
  const [data, setData] = useState<TutorAssessmentHub | null>(null);
  const [filter, setFilter] = useState<'all' | 'ungraded' | 'review'>('all');
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [people, setPeople] = useState<TutorPerson[]>([]);

  const load = useCallback(() => {
    let active = true;
    assessmentRepository.tutorHub()
      .then((hub) => { if (active) setData(hub); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const items = useMemo(() => (data?.items ?? []).filter((item) => {
    if (filter === 'ungraded') return item.pendingGrade > 0;
    if (filter === 'review') return item.status === 'pending_review' || item.status === 'changes_requested';
    return item.status !== 'closed';
  }), [data, filter]);

  const remind = (item: TutorHubItem) => Alert.alert('Reminder queued', `Students in ${item.moduleCode} will be reminded about ${item.title}.`);

  const openAssign = async (paperId: string) => {
    try {
      const rows = await tutorPortalRepository.people();
      if (!rows.length) {
        Alert.alert('No booked students', 'Students appear here after they book you.');
        return;
      }
      setPeople(rows);
      setAssigning(paperId);
    } catch {
      Alert.alert('Could not load booked students.');
    }
  };

  const confirmAssign = async () => {
    if (!assigning) return;
    try {
      const result = await assessmentRepository.assign(assigning, people.map((person) => person._id));
      setAssigning(null);
      Alert.alert(
        'Assigned',
        result.status === 'pending_review'
          ? `${result.assigned} booked student${result.assigned === 1 ? '' : 's'}. It now waits for LIC to publish.`
          : `${result.assigned} booked student${result.assigned === 1 ? '' : 's'} can see this assessment.`,
      );
      load();
    } catch {
      Alert.alert('Could not assign this assessment.');
    }
  };

  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  return (
    <AssessmentScreen navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      {/* Top Header Bar matching StudentDashboardScreen */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            {navigation?.canGoBack?.() ? (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Assessment Hub</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Tutor Assessment Hub</Text>
        <Text style={styles.sub}>{data?.modules ?? 0} modules · {data?.enrolled ?? 0} enrolled students</Text>
        <OrangeButton label="+ Create New Assessment" onPress={() => setPicker(true)} />
        <TouchableOpacity style={styles.import} onPress={() => navigation.navigate('StudyMaterials')}>
          <MaterialIcons name="menu-book" size={16} color={navy} />
          <Text style={styles.importText}>Import from library</Text>
          <Text style={styles.count}>{data?.bankCount ?? 0}</Text>
        </TouchableOpacity>

        {loading && !data ? <ActivityIndicator color={navy} style={styles.loader} /> : null}

        <View style={styles.pulse}>
          <Text style={styles.section}>Queue & cohort pulse</Text>
          <View style={styles.pulseGrid}>
            <View style={styles.pulseCard}>
              <Text style={styles.pulseLabel}>Pending grading</Text>
              <Text style={styles.pulseValue}>{data?.pendingGrading ?? 0}</Text>
              <Text style={styles.pulseHint}>{data?.pendingShort ?? 0} short answers · {data?.pendingProjects ?? 0} project uploads</Text>
            </View>
            <View style={styles.pulseCard}>
              <Text style={styles.pulseLabel}>Active live tests</Text>
              <Text style={styles.pulseValue}>{data?.liveTests ?? 0}</Text>
              <Text style={styles.pulseHint}>{data?.liveParticipants ?? 0} live participants</Text>
              <Text style={styles.pulseLabel}>Class average</Text>
              <Text style={styles.pulseValue}>{data?.classAverage ?? 0}%</Text>
              <Text style={styles.delta}>+{data?.averageDelta ?? 0}%</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.bank} onPress={() => setPicker(true)}>
          <View style={styles.flex}>
            <Text style={styles.bankTitle}>Question bank & library</Text>
            <Text style={styles.bankSub}>{data?.bankCount ?? 0} ready-to-assign items</Text>
          </View>
          <View style={styles.browse}><Text style={styles.browseText}>Browse</Text></View>
        </TouchableOpacity>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Assessments</Text>
          <Text style={styles.sub}>{data?.activeCount ?? 0} active</Text>
        </View>
        <View style={styles.filters}>
          <Mini on={filter === 'all'} label="All" onPress={() => setFilter('all')} />
          <Mini on={filter === 'ungraded'} label="Ungraded" onPress={() => setFilter('ungraded')} />
          <Mini on={filter === 'review'} label="LIC review" onPress={() => setFilter('review')} />
        </View>
        {items.map((item) => (
          <View key={item.paperId} style={styles.card}>
            <Text style={styles.module}>{item.moduleCode} · {item.kindLabel}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.sub}>{item.submitted} / {item.enrolled} submitted{item.average !== null ? ` · Avg ${item.average}%` : ''}</Text>
            <Text style={styles.sub}>{item.closesLabel}{item.status === 'pending_review' ? ' · Awaiting LIC' : ''}{item.status === 'changes_requested' ? ` · ${item.reviewNote}` : ''}</Text>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.main} onPress={() => navigation.navigate('TutorSubmissions', { paperId: item.paperId })}>
                <Text style={styles.mainText}>{item.pendingGrade ? `Grade (${item.pendingGrade} pending)` : 'Submissions'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.icon} onPress={() => Alert.alert(item.title, item.average !== null ? `Class average ${item.average}% from graded submissions.` : 'No graded submissions yet.')}>
                <MaterialIcons name="insights" size={18} color={navy} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.icon} onPress={() => remind(item)}>
                <MaterialIcons name="notifications" size={18} color={navy} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.icon} onPress={() => void openAssign(item.paperId)}>
                <MaterialIcons name="person-add" size={18} color={navy} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <Modal visible={!!assigning} animationType="slide" transparent onRequestClose={() => setAssigning(null)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.section}>Assign to booked students</Text>
            <ScrollView>
              {people.map((person) => (
                <View key={person._id} style={styles.kind}>
                  <Text style={styles.cardTitle}>{person.name}</Text>
                  <Text style={styles.sub}>{person.modules.join(', ') || person.email}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.main} onPress={() => void confirmAssign()}>
              <Text style={styles.mainText}>Assign {people.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAssigning(null)}><Text style={styles.link}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={picker} animationType="slide" transparent onRequestClose={() => setPicker(false)}>
        <View style={styles.modal}>
          <View style={styles.sheet}>
            <Text style={styles.section}>Create an assessment</Text>
            <ScrollView>
              {ASSESSMENT_KINDS.map((kind: AssessmentKind) => (
                <TouchableOpacity
                  key={kind}
                  style={styles.kind}
                  onPress={() => {
                    setPicker(false);
                    navigation.navigate('CreateAssessment', { kind });
                  }}
                >
                  <Text style={styles.cardTitle}>{KIND_META[kind].label}</Text>
                  <Text style={styles.sub}>{KIND_META[kind].blurb}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setPicker(false)}><Text style={styles.link}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AssessmentScreen>
  );
}

function Mini({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandMentor: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
  },
  scroll: { padding: 16, paddingBottom: 28 },
  flex: { flex: 1 },
  title: { color: ink, fontSize: 26, fontWeight: '800' },
  sub: { color: muted, marginTop: 4, marginBottom: 8 },
  import: { marginTop: 10, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line, minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  importText: { color: navy, fontWeight: '800', flex: 1 },
  count: { backgroundColor: soft, color: navy, fontWeight: '800', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  loader: { marginVertical: 16 },
  pulse: { marginTop: 16 },
  section: { color: ink, fontSize: 18, fontWeight: '800' },
  pulseGrid: { flexDirection: 'row', gap: 8, marginTop: 8 },
  pulseCard: { flex: 1, backgroundColor: '#EEF3FB', borderRadius: 16, padding: 12 },
  pulseLabel: { color: muted, fontWeight: '700', fontSize: 12 },
  pulseValue: { color: ink, fontSize: 28, fontWeight: '800' },
  pulseHint: { color: muted, marginTop: 4, fontSize: 12 },
  delta: { color: '#15803D', fontWeight: '800' },
  bank: { marginTop: 12, backgroundColor: navy, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  bankTitle: { color: '#fff', fontWeight: '800' },
  bankSub: { color: '#C9D4EA', marginTop: 2 },
  browse: { backgroundColor: orange, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  browseText: { color: navy, fontWeight: '800' },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { backgroundColor: '#E7EDF6', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: navy },
  chipText: { color: blue, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  card: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 10 },
  module: { color: blue, fontWeight: '800', fontSize: 12 },
  cardTitle: { color: ink, fontWeight: '800', fontSize: 16, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  main: { flex: 1, backgroundColor: orange, borderRadius: 12, alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  mainText: { color: navy, fontWeight: '800' },
  icon: { width: 42, borderRadius: 12, backgroundColor: '#F4F6FB', alignItems: 'center', justifyContent: 'center' },
  modal: { flex: 1, backgroundColor: 'rgba(16,43,93,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%' },
  kind: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: line },
  link: { color: blue, fontWeight: '800', textAlign: 'center', padding: 12 },
});

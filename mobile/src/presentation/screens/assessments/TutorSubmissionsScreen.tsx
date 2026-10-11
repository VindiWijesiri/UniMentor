import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, OrangeButton } from './Chrome';
import { card, ink, line, muted, navy } from './theme';

type Submission = {
  attemptId: string;
  student: { name?: string; email?: string };
  status: string;
  score: number | null;
  maxScore: number;
  feedback?: string;
};

type Props = NativeStackScreenProps<AppStackParamList, 'TutorSubmissions'>;

export default function TutorSubmissionsScreen({ navigation, route }: Props) {
  const paperId = route.params?.paperId || '';
  const [title, setTitle] = useState('Submissions');
  const [rows, setRows] = useState<Submission[]>([]);
  const [released, setReleased] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!paperId) return;
    let active = true;
    assessmentRepository.submissions(paperId)
      .then((payload) => {
        if (!active) return;
        setTitle(payload.paper.title);
        setRows(payload.submissions);
        setReleased(payload.paper.gradesReleased);
        setDrafts(Object.fromEntries(payload.submissions.map((row) => [row.attemptId, row.score === null ? '' : String(row.score)])));
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [paperId]);

  useFocusEffect(useCallback(() => load(), [load]));

  const grade = async (row: Submission) => {
    const score = Number(drafts[row.attemptId]);
    if (!Number.isFinite(score)) {
      Alert.alert('Score needed', `Enter a number from 0 to ${row.maxScore}.`);
      return;
    }
    try {
      await assessmentRepository.grade(row.attemptId, score, 'Graded from the tutor hub.');
      load();
    } catch {
      Alert.alert('Not saved', 'The score could not be saved.');
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              Submissions
            </Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{released ? 'Grades are visible to students.' : 'Release grades after you finish marking.'}</Text>
        {loading ? <ActivityIndicator color={navy} /> : null}
        {rows.length === 0 && !loading ? <Text style={styles.sub}>No submissions yet. Students appear here after they submit.</Text> : null}
        {rows.map((row) => (
          <View key={row.attemptId} style={styles.card}>
            <Text style={styles.name}>{row.student?.name || row.student?.email || 'Student'}</Text>
            <Text style={styles.sub}>{row.status}{row.score !== null ? ` · ${row.score}/${row.maxScore}` : ''}</Text>
            <TextInput
              value={drafts[row.attemptId] ?? ''}
              onChangeText={(value) => setDrafts((current) => ({ ...current, [row.attemptId]: value }))}
              keyboardType="numeric"
              placeholder={`Score / ${row.maxScore}`}
              placeholderTextColor={muted}
              style={styles.input}
            />
            <TouchableOpacity style={styles.save} onPress={() => grade(row)}><Text style={styles.saveText}>Save grade</Text></TouchableOpacity>
          </View>
        ))}
        <OrangeButton
          label="Release grades to students"
          onPress={async () => {
            try {
              await assessmentRepository.release(paperId);
              setReleased(true);
              Alert.alert('Released', 'Students can now open their graded results.');
            } catch {
              Alert.alert('Not released', 'Try again in a moment.');
            }
          }}
        />
      </ScrollView>
    </AssessmentScreen>
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
    flex: 1,
    marginRight: 8,
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
    flexShrink: 1,
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
  scroll: { padding: 16, paddingBottom: 28, gap: 8 },
  back: { color: navy, fontWeight: '800' },
  title: { color: ink, fontSize: 24, fontWeight: '800' },
  sub: { color: muted },
  card: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12 },
  name: { color: ink, fontWeight: '800', fontSize: 16 },
  input: { marginTop: 8, borderWidth: 1, borderColor: line, borderRadius: 12, padding: 10, color: ink },
  save: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#FFF4EA', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  saveText: { color: navy, fontWeight: '800' },
});

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from './Chrome';
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

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar />
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>Back to hub</Text></TouchableOpacity>
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

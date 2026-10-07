import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import type { AssessmentResult } from '../../../domain/entities/AssessmentWork';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { SvgTrendingUp } from '../../components/common/SvgIcons';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from './Chrome';
import { card, danger, good, ink, line, muted, navy, soft } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AssessmentResult'>;

export default function AssessmentResultScreen({ navigation, route }: Props) {
  const [data, setData] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const paperId = route.params?.paperId || '';

  const load = useCallback(() => {
    if (!paperId) return;
    let active = true;
    assessmentRepository.result(paperId)
      .then((result) => { if (active) { setData(result); setError(''); } })
      .catch(() => { if (active) setError('This result is not available yet.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [paperId]);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar />
      {loading ? <ActivityIndicator color={navy} style={styles.loader} /> : error || !data ? (
        <Text style={styles.error}>{error || 'No result yet.'}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>{data.moduleCode} · {data.kindLabel}</Text>
          <Text style={styles.title}>{data.title}</Text>
          <View style={styles.hero}>
            <Text style={styles.scoreLabel}>{data.pendingReview ? 'Submitted' : 'Your score'}</Text>
            <Text style={styles.score}>{data.pendingReview ? 'In review' : `${data.score ?? 0}`}</Text>
            {!data.pendingReview ? <Text style={styles.max}>out of {data.maxScore}</Text> : null}
            {data.gradeLabel ? <View style={styles.grade}><Text style={styles.gradeText}>{data.gradeLabel}</Text></View> : null}
          </View>
          {data.feedback ? <Text style={styles.feedback}>“{data.feedback}”</Text> : null}
          <Text style={styles.tutor}>{data.tutorName}</Text>
          <Text style={styles.section}>Question review</Text>
          {data.breakdown.map((row) => (
            <View key={row.questionId} style={styles.row}>
              <Text style={styles.prompt}>{row.prompt}</Text>
              <Text style={row.correct ? styles.ok : styles.bad}>{row.note}</Text>
              <Text style={styles.meta}>Awarded {row.awarded} / {row.max}</Text>
              {row.given ? <Text style={styles.meta}>Your answer: {row.given}</Text> : null}
              {row.expected && !data.pendingReview ? <Text style={styles.meta}>Expected: {row.expected}</Text> : null}
            </View>
          ))}
          <OrangeButton label="View improvement history" svgIcon={<SvgTrendingUp size={16} color={navy} />} onPress={() => navigation.navigate('AssessmentHistory')} />
        </ScrollView>
      )}
    </AssessmentScreen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  error: { color: danger, padding: 20 },
  scroll: { padding: 16, paddingBottom: 28 },
  kicker: { color: muted, fontWeight: '800' },
  title: { color: ink, fontSize: 24, fontWeight: '800', marginTop: 4 },
  hero: { backgroundColor: navy, borderRadius: 20, padding: 18, marginTop: 14, alignItems: 'flex-start' },
  scoreLabel: { color: '#C9D4EA', fontWeight: '700' },
  score: { color: '#fff', fontSize: 42, fontWeight: '800' },
  max: { color: '#C9D4EA' },
  grade: { marginTop: 8, backgroundColor: soft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  gradeText: { color: navy, fontWeight: '800' },
  feedback: { color: ink, fontSize: 16, lineHeight: 24, marginTop: 14 },
  tutor: { color: muted, marginTop: 6, fontWeight: '700' },
  section: { color: ink, fontSize: 18, fontWeight: '800', marginTop: 18, marginBottom: 8 },
  row: { backgroundColor: card, borderRadius: 16, borderWidth: 1, borderColor: line, padding: 12, marginBottom: 8 },
  prompt: { color: ink, fontWeight: '800' },
  ok: { color: good, fontWeight: '800', marginTop: 6 },
  bad: { color: danger, fontWeight: '800', marginTop: 6 },
  meta: { color: muted, marginTop: 4 },
});

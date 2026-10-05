import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import type { TakePayload, WorkAnswer } from '../../../domain/entities/AssessmentWork';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import QuestionBody from './QuestionBody';
import { TakeHeader } from './Chrome';
import { card, ink, line, muted, navy, orange, page } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TakeAssessment'>;

export default function TakeAssessmentScreen({ navigation, route }: Props) {
  const [data, setData] = useState<TakePayload | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, WorkAnswer>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const preview = Boolean(route.params.preview);
  const loadedId = useRef<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    if (loadedId.current !== route.params.paperId) setLoading(true);
    assessmentRepository.take(route.params.paperId)
      .then((payload) => {
        if (!active) return;
        if (!preview && (payload.attempt.status === 'graded' || payload.attempt.status === 'submitted')) {
          navigation.replace('AssessmentResult', { paperId: route.params.paperId });
          return;
        }
        loadedId.current = route.params.paperId;
        setData(payload);
        setAnswers(payload.attempt.answers ?? {});
        setFlagged(payload.attempt.flagged ?? []);
        setIndex(payload.attempt.questionIndex ?? 0);
        setSeconds(payload.attempt.secondsLeft || payload.paper.durationMin * 60);
      })
      .catch(() => Alert.alert('Unavailable', 'This assessment could not be opened.'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigation, preview, route.params.paperId]);

  useFocusEffect(useCallback(() => load(), [load]));

  useEffect(() => {
    if (!data || preview || data.paper.durationMin === 0) return undefined;
    const timer = setInterval(() => setSeconds((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [data, preview]);

  const questions = data?.paper.questions ?? [];
  const question = questions[index];
  const last = index >= questions.length - 1;

  const persist = async (nextIndex: number, nextAnswers = answers, nextFlagged = flagged) => {
    if (preview || !data) return;
    await assessmentRepository.save(data.paper._id, { answers: nextAnswers, flagged: nextFlagged, questionIndex: nextIndex });
  };

  const updateAnswer = (next: WorkAnswer) => {
    if (!question) return;
    const nextAnswers = { ...answers, [question.id]: next };
    setAnswers(nextAnswers);
    persist(index, nextAnswers).catch(() => {});
  };

  const toggleFlag = () => {
    if (!question) return;
    const next = flagged.includes(question.id) ? flagged.filter((id) => id !== question.id) : [...flagged, question.id];
    setFlagged(next);
    persist(index, answers, next).catch(() => {});
  };

  const go = async (nextIndex: number) => {
    setBusy(true);
    try {
      await persist(nextIndex);
      setIndex(nextIndex);
    } catch {
      Alert.alert('Not saved', 'Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!data) return;
    if (preview) {
      Alert.alert('Preview', 'Students will submit this after the LIC publishes it.');
      return;
    }
    setBusy(true);
    try {
      await assessmentRepository.submit(data.paper._id, answers);
      navigation.replace('AssessmentResult', { paperId: data.paper._id });
    } catch {
      Alert.alert('Submit failed', 'Your answers are still on this device. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (loading || !data || !question) {
    return (
      <View style={styles.page}>
        <TakeHeader course="Assessment" secondsLeft={seconds} onBack={() => navigation.goBack()} />
        <View style={styles.center}><ActivityIndicator color={navy} /></View>
      </View>
    );
  }

  const flaggedOn = flagged.includes(question.id);
  return (
    <View style={styles.page}>
      <TakeHeader course={`${data.paper.moduleCode}: ${data.paper.moduleName}`} secondsLeft={seconds} onBack={() => navigation.goBack()} />
      {preview ? <Text style={styles.preview}>Tutor preview · answers are not submitted</Text> : null}
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>Question {index + 1} of {questions.length}</Text>
          <TouchableOpacity style={styles.flag} onPress={toggleFlag}>
            <MaterialIcons name={flaggedOn ? 'bookmark' : 'bookmark-border'} size={16} color={navy} />
            <Text style={styles.flagText}>{flaggedOn ? 'Flagged' : 'Mark for review'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.segments}>
          {questions.map((item, itemIndex) => <View key={item.id} style={[styles.segment, itemIndex <= index && styles.segmentOn]} />)}
        </View>
        <Text style={styles.paper}>{data.paper.title}</Text>
        <QuestionBody question={question} answer={answers[question.id] ?? {}} onChange={updateAnswer} />
      </ScrollView>
      <View style={styles.actions}>
        <TouchableOpacity disabled={index === 0 || busy} onPress={() => go(index - 1)} style={styles.prev}>
          <Text style={[styles.prevText, index === 0 && styles.disabled]}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.next} disabled={busy} onPress={last ? submit : () => go(index + 1)}>
          <Text style={styles.nextText}>{last ? 'Submit' : 'Next Question'}</Text>
          <MaterialIcons name="arrow-forward" size={16} color={navy} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: page },
  preview: { backgroundColor: '#FFF4EA', color: navy, fontWeight: '800', textAlign: 'center', paddingVertical: 6 },
  scroll: { padding: 16, paddingBottom: 24 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { color: ink, fontWeight: '800', fontSize: 16 },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: card, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: line },
  flagText: { color: navy, fontWeight: '700', fontSize: 12 },
  segments: { flexDirection: 'row', gap: 4, marginVertical: 10 },
  segment: { flex: 1, height: 6, borderRadius: 4, backgroundColor: '#E1E7F2' },
  segmentOn: { backgroundColor: orange },
  paper: { color: muted, marginBottom: 8, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: card, borderTopWidth: 1, borderTopColor: line },
  prev: { paddingHorizontal: 8, paddingVertical: 12 },
  prevText: { color: navy, fontWeight: '800' },
  disabled: { color: '#C5CEDD' },
  next: { backgroundColor: orange, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextText: { color: navy, fontWeight: '800' },
});

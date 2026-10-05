import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { libraryRepository } from '../../../data/repositories/libraryRepository';
import type { LibraryMaterial, QuizResult } from '../../../domain/entities/Library';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';
import PageHeader from '../../components/PageHeader';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyMaterialDetail'>;

export default function StudyMaterialDetailScreen({ route, navigation }: Props) {
  const [item, setItem] = useState<LibraryMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [fileIndex, setFileIndex] = useState(0);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    libraryRepository.get(route.params.id)
      .then((data) => {
        setItem(data);
        setAnswers(new Array(data.questions?.length ?? 0).fill(-1));
        setError('');
      })
      .catch(() => setError('Could not load this material.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [route.params.id]);

  const save = async () => {
    if (!item || saving) return;
    setSaving(true);
    try {
      const updated = await libraryRepository.save(item._id);
      setItem(updated);
      Alert.alert('Saved', 'Stored in your UniMentor library and offline pack.');
    } catch {
      Alert.alert('Could not save this material.');
    } finally {
      setSaving(false);
    }
  };

  const markProgress = async (payload: Record<string, unknown>) => {
    if (!item) return;
    try {
      const updated = await libraryRepository.progress(item._id, payload);
      setItem(updated);
    } catch {
      Alert.alert('Could not update progress.');
    }
  };

  const submitQuiz = async () => {
    if (!item) return;
    try {
      const data = await libraryRepository.quiz(item._id, answers);
      setResult(data);
      setItem(data);
    } catch {
      Alert.alert('Could not submit the quiz.');
    }
  };

  const kindLabel = item?.kind === 'pdf' ? 'PDF Notes' : item?.kind === 'video' ? 'Video' : item?.kind === 'quiz' ? 'Quiz' : item?.kind === 'audio' ? 'Audio' : 'Code Pack';

  return (
    <View style={styles.page}>
      <PageHeader title={kindLabel} onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.state}><ActivityIndicator color={navy} /></View>
      ) : error || !item ? (
        <View style={styles.state}><Text style={styles.error}>{error || 'Material missing.'}</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
          <Text style={styles.meta}>{item.sizeLabel ?? item.durationLabel} · {item.source}</Text>

          {item.kind === 'video' && (
            <View style={styles.player}>
              <Text style={styles.playBig}>▶</Text>
              <Text style={styles.playerMeta}>{item.durationLabel} · {item.watchedPercent ?? 0}% watched</Text>
              <TouchableOpacity style={styles.primary} onPress={() => void markProgress({ watchedPercent: 100, completed: true })}>
                <Text style={styles.primaryText}>Watch Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {item.kind === 'audio' && (
            <View style={styles.player}>
              <Text style={styles.playBig}>▶</Text>
              <Text style={styles.playerMeta}>{item.durationLabel} · {item.audioSpeed ?? 1}x</Text>
              <View style={styles.row}>
                {[1, 1.6, 2].map((speed) => (
                  <TouchableOpacity key={speed} style={styles.speed} onPress={() => void markProgress({ audioSpeed: speed, completed: true })}>
                    <Text style={styles.speedText}>{speed}x</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {item.kind === 'pdf' && (
            <View style={styles.note}>
              <Text style={styles.noteLabel}>Stored PDF notes</Text>
              <Text style={styles.bodyText}>{item.body}</Text>
            </View>
          )}

          {item.kind === 'code' && (
            <View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
                {(item.files ?? []).map((file, index) => (
                  <TouchableOpacity key={file.name} style={[styles.fileChip, fileIndex === index && styles.fileOn]} onPress={() => setFileIndex(index)}>
                    <Text style={[styles.fileText, fileIndex === index && styles.fileTextOn]}>{file.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.code}>
                <Text style={styles.codeText}>{(item.files ?? [])[fileIndex]?.content ?? item.body}</Text>
              </View>
            </View>
          )}

          {item.kind === 'quiz' && (
            <View>
              {(item.questions ?? []).map((question, index) => (
                <View key={question.prompt} style={styles.qCard}>
                  <Text style={styles.qTitle}>Q{index + 1}. {question.prompt}</Text>
                  {question.options.map((option, optionIndex) => {
                    const picked = answers[index] === optionIndex;
                    const review = result?.review[index];
                    const showCorrect = review && optionIndex === review.answer;
                    const showWrong = review && picked && !review.correct;
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.option, picked && styles.optionOn, showCorrect && styles.optionGood, showWrong && styles.optionBad]}
                        onPress={() => setAnswers((current) => current.map((value, idx) => idx === index ? optionIndex : value))}
                        disabled={Boolean(result)}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {result?.review[index]?.explanation ? <Text style={styles.explain}>{result.review[index].explanation}</Text> : null}
                </View>
              ))}
              {result ? (
                <Text style={styles.score}>Score {result.correct}/{result.total} · Best {result.quizBest}%</Text>
              ) : (
                <TouchableOpacity style={styles.primary} onPress={() => void submitQuiz()}>
                  <Text style={styles.primaryText}>Submit Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {item.kind !== 'pdf' && item.kind !== 'code' && item.body ? (
            <Text style={styles.bodyText}>{item.body}</Text>
          ) : null}

          <TouchableOpacity style={styles.secondary} onPress={() => void save()} disabled={saving}>
            <Text style={styles.secondaryText}>{item.saved ? 'Saved to device' : saving ? 'Saving...' : 'Save / Store in library'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 30, marginRight: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '900', flexShrink: 1 },
  libraryPill: { backgroundColor: yellow, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  libraryText: { color: navy, fontSize: 10, fontWeight: '900' },
  sub: { color: '#C5D4EB', fontSize: 11, marginTop: 3 },
  body: { padding: 16, paddingBottom: 40 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#A63838', fontWeight: '800' },
  title: { color: ink, fontSize: 22, fontWeight: '900' },
  subtitle: { color: muted, marginTop: 8, lineHeight: 20 },
  meta: { color: muted, marginTop: 8, fontWeight: '700', fontSize: 12 },
  player: { backgroundColor: navy, borderRadius: 20, padding: 18, marginTop: 16, alignItems: 'center' },
  playBig: { color: yellow, fontSize: 36 },
  playerMeta: { color: '#C5D4EB', marginTop: 8, marginBottom: 12 },
  primary: { backgroundColor: yellow, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  primaryText: { color: navy, fontWeight: '900' },
  secondary: { borderWidth: 1, borderColor: '#D7DEEA', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 16, backgroundColor: '#FFF' },
  secondaryText: { color: navy, fontWeight: '800' },
  note: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginTop: 14, borderWidth: 1, borderColor: '#E6EAF2' },
  noteLabel: { color: navy, fontWeight: '900', marginBottom: 8 },
  bodyText: { color: ink, lineHeight: 22, marginTop: 14 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  speed: { backgroundColor: yellow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  speedText: { color: navy, fontWeight: '900' },
  fileChip: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E6EAF2' },
  fileOn: { backgroundColor: navy, borderColor: navy },
  fileText: { color: ink, fontWeight: '800', fontSize: 12 },
  fileTextOn: { color: '#FFF' },
  code: { backgroundColor: '#0B1F4C', borderRadius: 16, padding: 12, marginTop: 12 },
  codeText: { color: '#DCE7FF', fontFamily: 'monospace', fontSize: 12, lineHeight: 18 },
  qCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 12, marginTop: 12, borderWidth: 1, borderColor: '#E6EAF2' },
  qTitle: { color: ink, fontWeight: '900', marginBottom: 8 },
  option: { borderWidth: 1, borderColor: '#E6EAF2', borderRadius: 12, padding: 10, marginBottom: 6 },
  optionOn: { borderColor: navy, backgroundColor: '#EEF2FF' },
  optionGood: { borderColor: '#15803D', backgroundColor: '#DCFCE7' },
  optionBad: { borderColor: '#DC2626', backgroundColor: '#FEE2E2' },
  optionText: { color: ink, fontWeight: '700' },
  explain: { color: muted, marginTop: 4, fontSize: 12 },
  score: { color: '#15803D', fontWeight: '900', marginTop: 12, fontSize: 16 },
});

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Assessment, Question } from '../../../domain/entities/Assessment';
import { apiError } from '../../../shared/format';
import { colors, radius } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'AssessmentTake'>;

type Answer = Record<string, unknown> & { questionIndex: number };

export default function AssessmentTakeScreen({ navigation, route }: Props) {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    learningRepository
      .getAssessment(route.params.assessmentId)
      .then(setAssessment)
      .catch((err) => Alert.alert('Error', apiError(err)));
  }, [route.params.assessmentId]);

  const questions = assessment?.questions ?? [];

  const setAnswer = (index: number, patch: Record<string, unknown>) => {
    setAnswers((current) => {
      const next = current.filter((item) => item.questionIndex !== index);
      next.push({ questionIndex: index, ...patch });
      return next;
    });
  };

  const submit = async () => {
    if (!assessment) return;
    setLoading(true);
    try {
      const payload = questions.map((question, index) => {
        const existing = answers.find((item) => item.questionIndex === index);
        if (existing) return existing;
        if (question.type === 'ordering') return { questionIndex: index, order: question.orderItems ?? [] };
        return { questionIndex: index };
      });
      const result = await learningRepository.submitAssessment(assessment._id, payload);
      const score = result.status === 'graded' ? `${result.score}/${result.maxScore}` : 'Sent for grading';
      Alert.alert('Submitted', score);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Submit failed', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title={assessment?.title ?? 'Assessment'} showBack activeTab="Learning">
      {assessment ? (
        <>
          <Text style={styles.meta}>
            {assessment.subject} · {assessment.durationMinutes} minutes
          </Text>
          {assessment.instructions ? <Text style={styles.help}>{assessment.instructions}</Text> : null}
          {questions.map((question, index) => (
            <QuestionCard
              key={`${question.prompt}-${index}`}
              index={index}
              question={question}
              answer={answers.find((item) => item.questionIndex === index)}
              onChange={(patch) => setAnswer(index, patch)}
            />
          ))}
          <PrimaryButton label="Submit" onPress={submit} loading={loading} />
        </>
      ) : (
        <Text style={styles.meta}>Loading assessment…</Text>
      )}
    </ScreenLayout>
  );
}

function QuestionCard({
  index,
  question,
  answer,
  onChange,
}: {
  index: number;
  question: Question;
  answer?: Answer;
  onChange: (patch: Record<string, unknown>) => void;
}) {
  const rights = question.pairRights ?? [];
  const lefts = question.pairLefts ?? [];
  const order = useMemo(
    () => (answer?.order as string[] | undefined) ?? question.orderItems ?? [],
    [answer?.order, question.orderItems]
  );
  const buckets = question.buckets ?? [];
  const tokens = question.tokenLabels ?? [];
  const placements = (answer?.placements as { label: string; bucket: string }[]) ?? [];

  const move = (from: number, dir: -1 | 1) => {
    const next = [...order];
    const to = from + dir;
    if (to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    onChange({ order: next });
  };

  return (
    <Card style={styles.q}>
      <Text style={styles.qTitle}>
        {index + 1}. {question.prompt} ({question.points} pts)
      </Text>
      {question.type === 'case_study' && question.scenario ? (
        <Text style={styles.help}>{question.scenario}</Text>
      ) : null}
      {question.type === 'mcq'
        ? (question.options ?? []).map((option, optionIndex) => (
            <TouchableOpacity key={option} style={styles.choice} onPress={() => onChange({ selectedIndex: optionIndex })}>
              <View style={[styles.dot, answer?.selectedIndex === optionIndex && styles.dotOn]} />
              <Text style={styles.choiceText}>{option}</Text>
            </TouchableOpacity>
          ))
        : null}
      {question.type === 'true_false' ? (
        <View style={styles.row}>
          {['True', 'False'].map((label, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.pill, answer?.booleanValue === (i === 0) && styles.pillOn]}
              onPress={() => onChange({ booleanValue: i === 0 })}
            >
              <Text style={styles.pillText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {['short_answer', 'fill_blank', 'essay', 'coding', 'file', 'case_study'].includes(question.type) ? (
        <TextInput
          style={styles.input}
          placeholder={
            question.type === 'file'
              ? 'Paste file URL'
              : question.starterCode || (question.type === 'case_study' ? 'Your case response' : 'Your answer')
          }
          value={String(answer?.text ?? answer?.fileUrl ?? '')}
          onChangeText={(text) => onChange(question.type === 'file' ? { fileUrl: text } : { text })}
          multiline
        />
      ) : null}
      {question.type === 'matching'
        ? lefts.map((left) => (
            <View key={left} style={styles.matchRow}>
              <Text style={styles.matchLeft}>{left}</Text>
              <ScrollView horizontal>
                {rights.map((right) => {
                  const matches = (answer?.matches as { left: string; right: string }[]) ?? [];
                  const selected = matches.some((item) => item.left === left && item.right === right);
                  return (
                    <TouchableOpacity
                      key={right}
                      style={[styles.pill, selected && styles.pillOn]}
                      onPress={() => {
                        const next = matches.filter((item) => item.left !== left);
                        next.push({ left, right });
                        onChange({ matches: next });
                      }}
                    >
                      <Text style={styles.pillText}>{right}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))
        : null}
      {question.type === 'ordering'
        ? order.map((item, orderIndex) => (
            <View key={item} style={styles.orderRow}>
              <Text style={styles.choiceText}>
                {orderIndex + 1}. {item}
              </Text>
              <View style={styles.row}>
                <TouchableOpacity onPress={() => move(orderIndex, -1)}>
                  <Text style={styles.link}>Up</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => move(orderIndex, 1)}>
                  <Text style={styles.link}>Down</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        : null}
      {question.type === 'drag_drop'
        ? tokens.map((label) => (
            <View key={label} style={styles.matchRow}>
              <Text style={styles.matchLeft}>{label}</Text>
              <ScrollView horizontal>
                {buckets.map((bucket) => {
                  const selected = placements.some((item) => item.label === label && item.bucket === bucket);
                  return (
                    <TouchableOpacity
                      key={bucket}
                      style={[styles.pill, selected && styles.pillOn]}
                      onPress={() => {
                        const next = placements.filter((item) => item.label !== label);
                        next.push({ label, bucket });
                        onChange({ placements: next });
                      }}
                    >
                      <Text style={styles.pillText}>{bucket}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ))
        : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  meta: { color: colors.muted, marginBottom: 12 },
  help: { color: colors.text, marginBottom: 12 },
  q: { marginBottom: 12 },
  qTitle: { fontWeight: '800', color: colors.navy, marginBottom: 8 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.navy },
  dotOn: { backgroundColor: colors.gold, borderColor: colors.gold },
  choiceText: { color: colors.text, flex: 1 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    backgroundColor: colors.white,
  },
  pillOn: { backgroundColor: colors.warningBg, borderColor: colors.gold },
  pillText: { fontWeight: '700', color: colors.navy },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: colors.white,
  },
  matchRow: { marginBottom: 10 },
  matchLeft: { fontWeight: '700', color: colors.navy, marginBottom: 6 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  link: { color: colors.info, fontWeight: '700', marginLeft: 8 },
});

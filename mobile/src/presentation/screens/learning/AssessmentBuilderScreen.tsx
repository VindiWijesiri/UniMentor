import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Question, QuestionType } from '../../../domain/entities/Assessment';
import { apiError } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, FieldLabel, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'AssessmentBuilder'>;

const TITLES: Record<QuestionType, string> = {
  mcq: 'Create MCQ Quiz',
  true_false: 'Create True / False',
  short_answer: 'Create Short Answer',
  matching: 'Create Matching Pairs',
  fill_blank: 'Create Fill in the Blanks',
  ordering: 'Create Ordering Assessment',
  essay: 'Create Essay Assessment',
  coding: 'Create Coding Problem',
  file: 'Create Project Submission',
  drag_drop: 'Create Drag & Drop',
  case_study: 'Create Case Study',
};

function emptyQuestion(type: QuestionType): Question {
  const base: Question = { type, prompt: '', points: 1 };
  if (type === 'mcq') {
    base.options = ['', '', '', ''];
    base.correctIndex = 0;
  }
  if (type === 'true_false') base.correctBoolean = true;
  if (type === 'matching') base.pairs = [{ left: '', right: '' }];
  if (type === 'ordering') base.orderItems = ['', ''];
  if (type === 'drag_drop') {
    base.buckets = ['Bucket A', 'Bucket B'];
    base.tokens = [{ label: '', bucket: 'Bucket A' }];
  }
  return base;
}

export default function AssessmentBuilderScreen({ navigation, route }: Props) {
  const type = route.params.type;
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [moduleName, setModuleName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [duration, setDuration] = useState('30');
  const [questions, setQuestions] = useState<Question[]>([emptyQuestion(type)]);
  const [loading, setLoading] = useState(false);

  const update = (index: number, patch: Partial<Question>) => {
    setQuestions((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const save = async () => {
    setLoading(true);
    try {
      await learningRepository.createAssessment({
        title,
        subject,
        module: moduleName,
        instructions,
        durationMinutes: Number(duration) || 30,
        published: true,
        questions,
      });
      Alert.alert('Published', 'Students can now take this assessment.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not publish', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title={TITLES[type]} showBack activeTab="Learning">
      <FieldLabel text="Assessment title" />
      <TextInput style={inputStyle} value={title} onChangeText={setTitle} placeholder="Title" />
      <FieldLabel text="Subject" />
      <TextInput style={[inputStyle, styles.gap]} value={subject} onChangeText={setSubject} placeholder="Module / subject" />
      <FieldLabel text="Module code" />
      <TextInput style={[inputStyle, styles.gap]} value={moduleName} onChangeText={setModuleName} />
      <FieldLabel text="Instructions" />
      <TextInput style={[inputStyle, styles.area, styles.gap]} value={instructions} onChangeText={setInstructions} multiline />
      <FieldLabel text="Duration (minutes)" />
      <TextInput style={[inputStyle, styles.gap]} value={duration} onChangeText={setDuration} keyboardType="numeric" />

      {questions.map((question, index) => (
        <Card key={index} style={styles.card}>
          <Text style={styles.qLabel}>Question {index + 1}</Text>
          <TextInput
            style={[inputStyle, styles.gap]}
            placeholder="Prompt"
            value={question.prompt}
            onChangeText={(prompt) => update(index, { prompt })}
          />
          <TextInput
            style={[inputStyle, styles.gap]}
            placeholder="Points"
            keyboardType="numeric"
            value={String(question.points)}
            onChangeText={(value) => update(index, { points: Number(value) || 0 })}
          />
          {type === 'mcq' ? (
            <>
              {(question.options ?? []).map((option, optionIndex) => (
                <TextInput
                  key={optionIndex}
                  style={[inputStyle, styles.gap]}
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option}
                  onChangeText={(value) => {
                    const options = [...(question.options ?? [])];
                    options[optionIndex] = value;
                    update(index, { options });
                  }}
                />
              ))}
              <TextInput
                style={inputStyle}
                placeholder="Correct option index (0-3)"
                keyboardType="numeric"
                value={String(question.correctIndex ?? 0)}
                onChangeText={(value) => update(index, { correctIndex: Number(value) })}
              />
            </>
          ) : null}
          {type === 'true_false' ? (
            <View style={styles.row}>
              {['True', 'False'].map((label, i) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.pill, question.correctBoolean === (i === 0) && styles.pillOn]}
                  onPress={() => update(index, { correctBoolean: i === 0 })}
                >
                  <Text style={styles.pillText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {type === 'short_answer' || type === 'fill_blank' ? (
            <TextInput
              style={inputStyle}
              placeholder="Accepted answers, comma separated"
              onChangeText={(value) => update(index, { acceptedAnswers: value.split(',').map((item) => item.trim()) })}
            />
          ) : null}
          {type === 'matching' ? (
            <TextInput
              style={inputStyle}
              placeholder="Pairs as left:right | left:right"
              onChangeText={(value) =>
                update(index, {
                  pairs: value.split('|').map((chunk) => {
                    const [left, right] = chunk.split(':').map((part) => part.trim());
                    return { left, right };
                  }),
                })
              }
            />
          ) : null}
          {type === 'ordering' ? (
            <TextInput
              style={inputStyle}
              placeholder="Correct order, comma separated"
              value={(question.orderItems ?? []).join(', ')}
              onChangeText={(value) => update(index, { orderItems: value.split(',').map((item) => item.trim()) })}
            />
          ) : null}
          {type === 'drag_drop' ? (
            <>
              <TextInput
                style={[inputStyle, styles.gap]}
                placeholder="Buckets, comma separated"
                value={(question.buckets ?? []).join(', ')}
                onChangeText={(value) => update(index, { buckets: value.split(',').map((item) => item.trim()) })}
              />
              <TextInput
                style={inputStyle}
                placeholder="Tokens as label:bucket | label:bucket"
                onChangeText={(value) =>
                  update(index, {
                    tokens: value.split('|').map((chunk) => {
                      const [label, bucket] = chunk.split(':').map((part) => part.trim());
                      return { label, bucket };
                    }),
                  })
                }
              />
            </>
          ) : null}
          {type === 'essay' || type === 'case_study' ? (
            <>
              <TextInput
                style={[inputStyle, styles.area, styles.gap]}
                placeholder={type === 'case_study' ? 'Scenario narrative' : 'Rubric'}
                value={type === 'case_study' ? question.scenario : question.rubric}
                onChangeText={(value) => update(index, type === 'case_study' ? { scenario: value } : { rubric: value })}
                multiline
              />
            </>
          ) : null}
          {type === 'coding' ? (
            <TextInput
              style={[inputStyle, styles.area]}
              placeholder="Starter code"
              value={question.starterCode}
              onChangeText={(starterCode) => update(index, { starterCode })}
              multiline
            />
          ) : null}
          {type === 'file' ? (
            <TextInput style={inputStyle} placeholder="Allowed file types / brief" value={question.rubric} onChangeText={(rubric) => update(index, { rubric })} />
          ) : null}
        </Card>
      ))}
      <TouchableOpacity style={styles.add} onPress={() => setQuestions((current) => [...current, emptyQuestion(type)])}>
        <Text style={styles.addText}>+ Add another question</Text>
      </TouchableOpacity>
      <PrimaryButton label="Publish assessment" onPress={save} loading={loading} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 10, marginTop: 0 },
  area: { minHeight: 90, textAlignVertical: 'top', marginBottom: 10 },
  card: { marginVertical: 10 },
  qLabel: { fontWeight: '800', color: colors.gold, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8 },
  pill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  pillOn: { backgroundColor: colors.warningBg, borderColor: colors.gold },
  pillText: { fontWeight: '800', color: colors.navy },
  add: { marginBottom: 16 },
  addText: { color: colors.navy, fontWeight: '800' },
});

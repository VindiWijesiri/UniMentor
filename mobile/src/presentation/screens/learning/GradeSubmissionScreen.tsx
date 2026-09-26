import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { apiError, personName } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, FieldLabel, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'GradeSubmission'>;

export default function GradeSubmissionScreen({ navigation, route }: Props) {
  const { submission } = route.params;
  const [score, setScore] = useState(String(submission.score ?? ''));
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [loading, setLoading] = useState(false);
  const title = typeof submission.assessmentId === 'object' ? submission.assessmentId.title : 'Submission';

  const save = async () => {
    setLoading(true);
    try {
      await learningRepository.gradeSubmission(submission._id, Number(score), feedback);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not grade', apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Grade work" showBack activeTab="Learning">
      <Card>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{personName(submission.studentId)}</Text>
        <Text style={styles.meta}>Max {submission.maxScore}</Text>
      </Card>
      {(submission.answers ?? []).map((answer, index) => (
        <Card key={index} style={styles.mt}>
          <Text style={styles.q}>Answer {index + 1}</Text>
          <Text style={styles.meta}>{JSON.stringify(answer)}</Text>
        </Card>
      ))}
      <FieldLabel text="Score" />
      <TextInput style={[inputStyle, styles.gap]} value={score} onChangeText={setScore} keyboardType="numeric" />
      <FieldLabel text="Feedback" />
      <TextInput style={[inputStyle, styles.area]} value={feedback} onChangeText={setFeedback} multiline />
      <PrimaryButton label="Save grade" onPress={save} loading={loading} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
  q: { fontWeight: '700', color: colors.navy },
  mt: { marginTop: 10 },
  gap: { marginBottom: 12 },
  area: { minHeight: 90, textAlignVertical: 'top', marginBottom: 12 },
});

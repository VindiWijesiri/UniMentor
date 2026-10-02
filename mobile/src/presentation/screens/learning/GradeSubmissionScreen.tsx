import React, { useEffect, useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { TutorQueueStudent } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';
import { ink, muted } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'GradeSubmission'>;

export default function GradeSubmissionScreen({ route, navigation }: Props) {
  const [student, setStudent] = useState<TutorQueueStudent | null>(null);
  const [score, setScore] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learningRepository.getTutorStudent(route.params.id)
      .then((data) => {
        setStudent(data);
        if (data.score != null) setScore(String(data.score));
      })
      .finally(() => setLoading(false));
  }, [route.params.id]);

  const save = async () => {
    const value = Number(score);
    if (Number.isNaN(value) || value < 0 || value > 100) {
      Alert.alert('Invalid score', 'Enter a mark between 0 and 100.');
      return;
    }
    await learningRepository.gradeTutorStudent(route.params.id, value);
    Alert.alert('Graded', 'Score and feedback were saved to the queue.');
    navigation.goBack();
  };

  return (
    <LearningSubpage
      eyebrow="GRADING"
      title={student?.name ?? 'Grade submission'}
      subtitle={student?.workTitle}
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <View style={subpageStyles.list}>
        <View style={subpageStyles.card}>
          <Text style={subpageStyles.cardTitle}>{student?.taskLabel ?? 'PDF diff review'}</Text>
          <Text style={subpageStyles.cardMeta}>
            {student?.moduleCode} · {student?.questionCount ?? 0} questions
            {student?.pdfReady ? ' · PDF ready' : ''}
            {'\n'}This grade writes to the tutor queue. The full grading page can replace it later.
          </Text>
          <TextInput
            value={score}
            onChangeText={setScore}
            keyboardType="numeric"
            placeholder="Score / 100"
            placeholderTextColor={muted}
            style={{
              marginTop: 14,
              borderWidth: 1,
              borderColor: '#E0E6F0',
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 46,
              color: ink,
            }}
          />
          <TouchableOpacity style={subpageStyles.primaryBtn} onPress={save}>
            <Text style={subpageStyles.primaryText}>Save grade</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LearningSubpage>
  );
}

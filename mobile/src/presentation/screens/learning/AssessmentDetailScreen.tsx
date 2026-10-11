import React, { useCallback, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningAssessment } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'AssessmentDetail'>;

export default function AssessmentDetailScreen({ route, navigation }: Props) {
  const [item, setItem] = useState<LearningAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  const assessmentId = route.params?.id || route.params?.paperId || '';

  const load = useCallback(() => {
    if (!assessmentId) return;
    learningRepository.getAssessment(assessmentId)
      .then(setItem)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [assessmentId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!assessmentId) return;
    try {
      const updated = await learningRepository.submitAssessment(assessmentId);
      setItem(updated);
      Alert.alert('Submitted', 'Your work is marked as submitted.');
    } catch {
      Alert.alert('Network error', 'Could not submit this assessment.');
    }
  };

  return (
    <LearningSubpage
      eyebrow={item?.type === 'exam' ? 'MOCK EXAMINATION' : 'ASSIGNMENT'}
      title={item?.title ?? 'Assessment'}
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <View style={subpageStyles.list}>
        <View style={subpageStyles.card}>
          <Text style={subpageStyles.cardTitle}>{item?.subject}</Text>
          <Text style={subpageStyles.cardMeta}>
            Status: {item?.status}
            {item?.scheduledAt ? `\nWhen: ${new Date(item.scheduledAt).toLocaleString()}` : ''}
            {item?.dueDate ? `\nDue: ${new Date(item.dueDate).toLocaleString()}` : ''}
            {item?.durationMin ? `\nDuration: ${item.durationMin} minutes` : ''}
            {item?.marks ? `\nMarks: ${item.marks}` : ''}
          </Text>
          {item?.status !== 'submitted' && (
            <TouchableOpacity style={subpageStyles.primaryBtn} onPress={submit}>
              <Text style={subpageStyles.primaryText}>
                {item?.type === 'assignment' ? 'Submit Work' : 'Mark as complete'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </LearningSubpage>
  );
}

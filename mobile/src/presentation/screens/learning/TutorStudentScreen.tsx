import React, { useCallback, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { TutorQueueStudent } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorStudent'>;

export default function TutorStudentScreen({ route, navigation }: Props) {
  const [student, setStudent] = useState<TutorQueueStudent | null>(null);
  const [loading, setLoading] = useState(true);

  const studentId = route.params?.id || route.params?.studentId || '';

  const load = useCallback(() => {
    if (!studentId) return;
    learningRepository.getTutorStudent(studentId)
      .then(setStudent)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const assign = async () => {
    if (!student) return;
    try {
      await learningRepository.assignTutorPack(student._id, 'study');
      Alert.alert('Assigned', 'A study pack was added for this student.');
      load();
    } catch {
      Alert.alert('Network error', 'Could not assign the pack.');
    }
  };

  return (
    <LearningSubpage
      eyebrow="ANALYTICS"
      title={student?.name ?? 'Student'}
      subtitle={`${student?.programme ?? ''} · ${student?.moduleCode ?? ''}`}
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <View style={subpageStyles.list}>
        <View style={subpageStyles.card}>
          <Text style={subpageStyles.cardTitle}>Progress snapshot</Text>
          <Text style={subpageStyles.cardMeta}>
            Latest work: {student?.workTitle}
            {'\n'}Score: {student?.score ?? '—'} / {student?.maxScore ?? 100}
            {'\n'}Packs downloaded: {student?.packsDownloaded ?? 0}
            {'\n'}Class rank: {student?.classRank ? `#${student.classRank}` : '—'}
            {'\n'}Status: {student?.status}
          </Text>
          <TouchableOpacity style={subpageStyles.primaryBtn} onPress={assign}>
            <Text style={subpageStyles.primaryText}>Assign material</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={subpageStyles.navyBtn}
            onPress={() => navigation.navigate('GradeSubmission', { id: studentId })}
          >
            <Text style={subpageStyles.navyText}>Open grading</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LearningSubpage>
  );
}

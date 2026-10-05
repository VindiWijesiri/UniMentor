import React, { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningAssessment } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'Assessments'>;

export default function AssessmentsScreen({ navigation }: Props) {
  const [items, setItems] = useState<LearningAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    learningRepository.getAssessments()
      .then((data) => { if (active) setItems(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  return (
    <LearningSubpage
      eyebrow="ASSESSMENTS"
      title="Upcoming Work"
      subtitle="Exams and assignments from the assessments module."
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={subpageStyles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={subpageStyles.card}
            onPress={() => navigation.navigate('AssessmentDetail', { id: item._id })}
          >
            <Text style={subpageStyles.cardTitle}>{item.title}</Text>
            <Text style={subpageStyles.cardMeta}>
              {item.subject} · {item.status}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={subpageStyles.empty}>No assessments yet.</Text>}
      />
    </LearningSubpage>
  );
}

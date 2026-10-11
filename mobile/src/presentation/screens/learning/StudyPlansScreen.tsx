import React, { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningPlan } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyPlans'>;

export default function StudyPlansScreen({ navigation }: Props) {
  const listRef = useScrollToTopOnFocus<FlatList>();
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    learningRepository.getPlans()
      .then((data) => { if (active) setPlans(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  return (
    <LearningSubpage
      eyebrow="MY PLANS"
      title="Study Plans"
      subtitle="Weekly goals and revision blocks. Replace this screen when the Plans page is built."
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <FlatList
        ref={listRef}
        data={plans}
        keyExtractor={(item) => item._id}
        contentContainerStyle={subpageStyles.list}
        renderItem={({ item }) => (
          <View style={subpageStyles.card}>
            <Text style={subpageStyles.cardTitle}>{item.moduleCode} · {item.title}</Text>
            <Text style={subpageStyles.cardMeta}>
              {item.status} · {item.progress}% · due {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={subpageStyles.empty}>No plans yet.</Text>}
      />
    </LearningSubpage>
  );
}

import React, { useCallback, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningActivity } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'LearningActivity'>;

export default function LearningActivityScreen({ route, navigation }: Props) {
  const [activity, setActivity] = useState<LearningActivity | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    learningRepository.getDashboard()
      .then((dashboard) => setActivity(dashboard.continueActivity))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const next = async () => {
    if (!activity) return;
    const updated = await learningRepository.progressActivity(activity._id);
    setActivity({
      ...updated,
      percent: Math.round((updated.done / updated.total) * 100),
    });
  };

  return (
    <LearningSubpage
      eyebrow={activity?.moduleCode ?? 'ACTIVITY'}
      title={activity?.topic ?? 'Continue activity'}
      subtitle={activity?.moduleName}
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <View style={subpageStyles.list}>
        <View style={subpageStyles.card}>
          <Text style={subpageStyles.cardTitle}>
            {activity?.activityType} {activity?.done}/{activity?.total}
          </Text>
          <Text style={subpageStyles.cardMeta}>
            {activity?.percent ?? 0}% complete · {activity?.minutesLeft ?? 0} min left
          </Text>
          <TouchableOpacity style={subpageStyles.primaryBtn} onPress={next}>
            <Text style={subpageStyles.primaryText}>
              {activity && activity.done >= activity.total ? 'Completed' : 'Complete next question'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </LearningSubpage>
  );
}

import React, { useCallback, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { TutorLearningDashboard } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'PackDispatcher'>;

export default function PackDispatcherScreen({ navigation }: Props) {
  const [data, setData] = useState<TutorLearningDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    learningRepository.getTutorDashboard()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const dispatch = async (kind: 'mock' | 'study') => {
    await learningRepository.dispatchTutorPack(kind);
    Alert.alert('Dispatched', kind === 'mock' ? 'Batch mock assigned.' : 'Study pack pushed.');
    load();
  };

  return (
    <LearningSubpage
      eyebrow="DISPATCHER"
      title="Assessment & Packs"
      subtitle="Cohort tools. Replace this screen when the pack manager is built."
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <View style={subpageStyles.list}>
        {(data?.packs ?? []).map((pack) => (
          <View key={pack._id} style={subpageStyles.card}>
            <Text style={subpageStyles.cardTitle}>{pack.title}</Text>
            <Text style={subpageStyles.cardMeta}>Assigned {pack.assignedCount} times · {pack.kind}</Text>
            {pack.kind !== 'recovery' && (
              <TouchableOpacity style={subpageStyles.primaryBtn} onPress={() => dispatch(pack.kind === 'mock' ? 'mock' : 'study')}>
                <Text style={subpageStyles.primaryText}>Dispatch now</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </LearningSubpage>
  );
}

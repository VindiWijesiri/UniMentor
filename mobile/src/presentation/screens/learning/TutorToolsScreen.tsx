import React, { useCallback, useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { TutorLearningDashboard } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorTools'>;

const copy = {
  bank: { eyebrow: 'ITEM BANK', title: 'Question Bank', body: 'Graph, tree, and OOP items used in mocks. The Item Bank page can replace this list.' },
  voice: { eyebrow: 'VOICE MARKS', title: 'Voice Feedback', body: 'Recorded marks sit on awaiting-review submissions. The Voice Marks page can replace this.' },
  squads: { eyebrow: 'SQUADS', title: 'Study Squads', body: 'DSA Revision Squad and Probability Pod. The Squads page can replace this.' },
  export: { eyebrow: 'EXPORT', title: 'Roster CSV', body: 'Export uses current queue data from the tutor workspace.' },
};

export default function TutorToolsScreen({ route, navigation }: Props) {
  const tool = route.params.tool;
  const [data, setData] = useState<TutorLearningDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    learningRepository.getTutorDashboard()
      .then(async (dashboard) => {
        setData(dashboard);
        if (tool === 'export') {
          const rows = ['name,code,status,module,score', ...dashboard.queue.map((item) => (
            `${item.name},${item.studentCode},${item.status},${item.moduleCode},${item.score ?? ''}`
          ))].join('\n');
          try {
            await Share.share({ message: rows, title: 'Tutor roster.csv' });
          } catch {
            Alert.alert('Export ready', `${dashboard.queue.length} students in the roster.`);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tool]));

  const info = copy[tool];

  return (
    <LearningSubpage
      eyebrow={info.eyebrow}
      title={info.title}
      subtitle={info.body}
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <View style={subpageStyles.list}>
        <View style={subpageStyles.card}>
          <Text style={subpageStyles.cardTitle}>
            {tool === 'export' ? `${data?.queue.length ?? 0} rows ready` : data?.header.cohort}
          </Text>
          <Text style={subpageStyles.cardMeta}>
            Enrolled {data?.header.enrolled ?? 0} · Pending {data?.filters.needsReview ?? 0} · At risk {data?.filters.atRisk ?? 0}
            {'\n'}Plagiarism flags: {data?.tools.plagiarismFlags ?? 0}
          </Text>
        </View>
      </View>
    </LearningSubpage>
  );
}

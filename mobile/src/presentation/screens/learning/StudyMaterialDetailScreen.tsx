import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningMaterial } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyMaterialDetail'>;

export default function StudyMaterialDetailScreen({ route, navigation }: Props) {
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    learningRepository.getMaterial(route.params.id)
      .then(setMaterial)
      .finally(() => setLoading(false));
  }, [route.params.id]);

  return (
    <LearningSubpage
      eyebrow="MATERIAL"
      title={material?.title ?? 'Study material'}
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <View style={subpageStyles.list}>
        <View style={subpageStyles.card}>
          <Text style={subpageStyles.cardTitle}>{material?.title}</Text>
          <Text style={subpageStyles.cardMeta}>
            {material?.kind.toUpperCase()} · {material?.sourceType}: {material?.sourceLabel}
            {'\n'}Added {material ? new Date(material.uploadedAt).toLocaleString() : ''}
            {'\n\n'}This file is mock learning data. The Study Materials page can replace this source later.
          </Text>
        </View>
      </View>
    </LearningSubpage>
  );
}

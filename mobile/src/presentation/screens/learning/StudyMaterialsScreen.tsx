import React, { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningMaterial } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyMaterials'>;

export default function StudyMaterialsScreen({ navigation }: Props) {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    learningRepository.getMaterials()
      .then((data) => { if (active) setMaterials(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []));

  return (
    <LearningSubpage
      eyebrow="STUDY MATERIALS"
      title="All Documents"
      subtitle="Notes and practice sets from groups and sessions."
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <FlatList
        data={materials}
        keyExtractor={(item) => item._id}
        contentContainerStyle={subpageStyles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={subpageStyles.card}
            onPress={() => navigation.navigate('StudyMaterialDetail', { id: item._id })}
          >
            <Text style={subpageStyles.cardTitle}>{item.title}</Text>
            <Text style={subpageStyles.cardMeta}>
              {item.sourceType === 'group' ? 'Group' : 'Session'}: {item.sourceLabel}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={subpageStyles.empty}>No materials yet.</Text>}
      />
    </LearningSubpage>
  );
}

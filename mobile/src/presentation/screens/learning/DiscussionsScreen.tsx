import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningDiscussion } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';

type Props = NativeStackScreenProps<AppStackParamList, 'Discussions'>;

export default function DiscussionsScreen({ navigation }: Props) {
  const [items, setItems] = useState<LearningDiscussion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    learningRepository.getDiscussions()
      .then((data) => { if (active) setItems(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const join = async (id: string) => {
    await learningRepository.joinDiscussion(id);
    Alert.alert('Joined', 'You joined this discussion pod.');
    load();
  };

  return (
    <LearningSubpage
      eyebrow="DISCUSSIONS"
      title="Recent Discussions"
      subtitle="Squad threads and flashcard pods."
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={subpageStyles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={subpageStyles.card} onPress={() => join(item._id)}>
            <Text style={subpageStyles.cardTitle}>{item.title}</Text>
            <Text style={subpageStyles.cardMeta}>
              {item.authorName} · {item.preview}
              {'\n'}{item.votes} votes · {item.joined ? 'Joined' : 'Tap to join'}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={subpageStyles.empty}>No discussions yet.</Text>}
      />
    </LearningSubpage>
  );
}

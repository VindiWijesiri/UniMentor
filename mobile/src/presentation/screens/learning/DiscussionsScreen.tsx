import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodConversation } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';
import { navy, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'Discussions'>;

export default function DiscussionsScreen({ navigation }: Props) {
  const [items, setItems] = useState<PodConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    podRepository.list('all')
      .then((data) => {
        if (!active) return;
        setItems(data);
        setError('');
      })
      .catch(() => { if (active) setError('Could not load Chat Pod conversations.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <LearningSubpage
      eyebrow="CHAT POD"
      title="Learning Discussions"
      subtitle="The same squads, tutors, and messages as Chat Pod."
      onBack={() => navigation.goBack()}
      loading={false}
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.openPod} onPress={() => navigation.navigate('ChatPod')}>
        <Text style={styles.openPodText}>Open Discussions POD  →</Text>
      </TouchableOpacity>
      {loading && items.length === 0 ? (
        <ActivityIndicator color={navy} />
      ) : (
        <ScrollView contentContainerStyle={subpageStyles.list}>
          {items.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={subpageStyles.card}
              onPress={() => navigation.navigate('PodThread', { conversationId: item._id })}
            >
              <Text style={subpageStyles.cardTitle}>{item.title}</Text>
              <Text style={subpageStyles.cardMeta}>
                {item.meta.leadName ?? item.lastSenderName} · {item.lastMessageText}
                {'\n'}{item.timeLabel}{item.unreadCount ? ` · ${item.unreadCount} unread` : ''}
              </Text>
            </TouchableOpacity>
          ))}
          {items.length === 0 && !loading ? <Text style={subpageStyles.empty}>No conversations yet.</Text> : null}
        </ScrollView>
      )}
    </LearningSubpage>
  );
}

const styles = StyleSheet.create({
  openPod: { backgroundColor: yellow, borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  openPodText: { color: navy, fontWeight: '900' },
  error: { color: '#A63838', fontWeight: '700', marginBottom: 8 },
});

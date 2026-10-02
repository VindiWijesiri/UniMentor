import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { ChatPodMessage } from '../../../domain/entities/Learning';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import LearningSubpage, { subpageStyles } from './LearningSubpage';
import { ink, muted, navy, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatPod'>;

export default function ChatPodScreen({ navigation }: Props) {
  const [messages, setMessages] = useState<ChatPodMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    learningRepository.getChatPod()
      .then((data) => { if (active) setMessages(data); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    const message = await learningRepository.sendChatPod(value);
    setMessages((current) => [...current, message]);
    setText('');
  };

  return (
    <LearningSubpage
      eyebrow="CHAT POD"
      title="Discussions Pod"
      subtitle="Live study chat from your learning groups."
      onBack={() => navigation.goBack()}
      loading={loading}
    >
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={subpageStyles.list}
        renderItem={({ item }) => (
          <View style={subpageStyles.card}>
            <Text style={styles.author}>{item.authorName}</Text>
            <Text style={subpageStyles.cardMeta}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={subpageStyles.empty}>No pod messages yet.</Text>}
      />
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write to the pod"
          placeholderTextColor={muted}
          style={styles.input}
        />
        <TouchableOpacity style={styles.send} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </LearningSubpage>
  );
}

const styles = StyleSheet.create({
  author: { color: ink, fontSize: 13, fontWeight: '900', marginBottom: 4 },
  composer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EAF2',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E6F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    color: ink,
  },
  send: { backgroundColor: yellow, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: navy, fontWeight: '900' },
});

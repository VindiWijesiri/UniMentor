import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { ChatMessage } from '../../../domain/entities/Learning';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, personId, personName } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatThread'>;

export default function ChatScreen({ route }: Props) {
  const me = useAuthStore((s) => s.user?._id);
  const { participantId, participantName, groupId, groupName } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(() => {
    const request = groupId ? learningRepository.groupThread(groupId) : learningRepository.thread(participantId as string);
    request.then(setMessages).catch((err) => setError(apiError(err)));
  }, [groupId, participantId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const send = async () => {
    if (!body.trim()) return;
    try {
      if (groupId) await learningRepository.sendGroup(groupId, body.trim());
      else if (participantId) await learningRepository.send(participantId, body.trim());
      setBody('');
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  return (
    <ScreenLayout title={groupName ?? participantName ?? 'Chat'} showBack activeTab="Learning">
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {messages.map((item) => {
        const mine = personId(item.senderId) === me;
        return (
          <View key={item._id} style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
            {!mine ? <Text style={styles.sender}>{personName(item.senderId)}</Text> : null}
            <Text style={[styles.body, mine && styles.mineText]}>{item.body}</Text>
          </View>
        );
      })}
      <TextInput style={[inputStyle, styles.composer]} value={body} onChangeText={setBody} placeholder="Message" />
      <PrimaryButton label="Send" onPress={send} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 14, marginBottom: 8 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.navy },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  sender: { fontSize: 11, fontWeight: '700', color: colors.gold, marginBottom: 2 },
  body: { color: colors.text },
  mineText: { color: colors.white },
  composer: { marginVertical: 12 },
});

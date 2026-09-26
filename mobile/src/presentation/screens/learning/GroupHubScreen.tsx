import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { StudyGroup, ChatMessage } from '../../../domain/entities/Learning';
import { useAuthStore } from '../../../domain/stores/authStore';
import { apiError, personId, personName } from '../../../shared/format';
import { colors, inputStyle } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'GroupHub'>;

export default function GroupHubScreen({ navigation, route }: Props) {
  const me = useAuthStore((s) => s.user?._id);
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');

  const load = useCallback(() => {
    Promise.all([
      learningRepository.getGroup(route.params.groupId),
      learningRepository.groupThread(route.params.groupId),
    ])
      .then(([g, thread]) => {
        setGroup(g);
        setMessages(thread);
      })
      .catch((err) => Alert.alert('Error', apiError(err)));
  }, [route.params.groupId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const send = async () => {
    if (!body.trim()) return;
    try {
      await learningRepository.sendGroup(route.params.groupId, body.trim());
      setBody('');
      load();
    } catch (err) {
      Alert.alert('Could not send', apiError(err));
    }
  };

  const members = [
    ...(Array.isArray(group?.memberIds) ? group.memberIds : []),
    ...(Array.isArray(group?.mentorIds) ? group.mentorIds : []),
  ];
  const packs = Array.isArray(group?.materialIds) ? group.materialIds : [];

  return (
    <ScreenLayout title={group?.name ?? 'Study group'} showBack activeTab="Learning">
      {group ? (
        <Card>
          <Text style={styles.title}>{group.name}</Text>
          <Text style={styles.meta}>{group.subject} · invite {group.inviteCode}</Text>
          {group.description ? <Text style={styles.meta}>{group.description}</Text> : null}
        </Card>
      ) : null}
      <View style={styles.mt}>
        <SecondaryButton label="Invite peers" onPress={() => navigation.navigate('InviteMembers', { groupId: route.params.groupId })} />
      </View>
      <Text style={styles.section}>Members</Text>
      {members.map((member, index) => (
        <Text key={`${personId(member)}-${index}`} style={styles.member}>
          {personName(member)}
        </Text>
      ))}
      <Text style={styles.section}>Attached packs</Text>
      {packs.map((pack, index) => {
        const id = typeof pack === 'string' ? pack : pack._id;
        return (
          <Card key={id ?? String(index)} style={styles.mb}>
            <Text
              style={styles.cardTitle}
              onPress={() => id && navigation.navigate('MaterialDetail', { materialId: id })}
            >
              {typeof pack === 'string' ? pack : pack.title}
            </Text>
            {typeof pack !== 'string' ? <Text style={styles.meta}>{pack.subject}</Text> : null}
          </Card>
        );
      })}
      <Text style={styles.section}>Live chat</Text>
      {messages.map((item) => (
        <View key={item._id} style={[styles.bubble, personId(item.senderId) === me ? styles.mine : styles.theirs]}>
          <Text style={styles.sender}>{personName(item.senderId)}</Text>
          <Text style={personId(item.senderId) === me ? styles.mineText : styles.body}>{item.body}</Text>
        </View>
      ))}
      <TextInput style={[inputStyle, styles.composer]} value={body} onChangeText={setBody} placeholder="Message the squad" />
      <PrimaryButton label="Send" onPress={send} />
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
  mt: { marginTop: 12 },
  mb: { marginBottom: 8 },
  section: { marginTop: 16, fontWeight: '800', color: colors.navy, marginBottom: 8 },
  member: { color: colors.text, marginBottom: 4 },
  cardTitle: { fontWeight: '800', color: colors.navy },
  bubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '90%' },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.navy },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  sender: { fontSize: 11, fontWeight: '700', color: colors.gold, marginBottom: 2 },
  body: { color: colors.text },
  mineText: { color: colors.white },
  composer: { marginVertical: 12 },
});

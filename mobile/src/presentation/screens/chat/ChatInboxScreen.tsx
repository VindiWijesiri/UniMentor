import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { Conversation } from '../../../domain/entities/Learning';
import { apiError, personName } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState, PrimaryButton, SecondaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList, 'Inbox'> };

export default function InboxScreen({ navigation }: Props) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    learningRepository
      .inbox()
      .then(setItems)
      .catch((err) => setError(apiError(err)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout title="Messages" showBack activeTab="Learning" onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="New message" onPress={() => navigation.navigate('StartChat')} />
      <View style={styles.mt}>
        <SecondaryButton label="Study groups" onPress={() => navigation.navigate('Groups')} />
      </View>
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.participant?._id ?? item.group?._id ?? String(index)}
          onPress={() =>
            item.group
              ? navigation.navigate('GroupHub', { groupId: item.group._id })
              : navigation.navigate('ChatThread', {
                  participantId: item.participant?._id,
                  participantName: item.participant?.name,
                })
          }
        >
          <Card style={styles.card}>
            <Text style={styles.title}>{item.group?.name ?? personName(item.participant, 'Chat')}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {item.lastMessage?.body ?? 'No messages yet'}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}
      {!items.length ? <EmptyState text="No conversations yet. Message a mentor from their profile." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger },
  mt: { marginTop: 10 },
  card: { marginTop: 10 },
  title: { fontWeight: '800', color: colors.navy },
  meta: { color: colors.muted, marginTop: 4 },
});

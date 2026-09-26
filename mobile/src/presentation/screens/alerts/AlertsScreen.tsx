import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { AppNotification } from '../../../domain/entities/Learning';
import { apiError, formatWhen } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Card, EmptyState, SecondaryButton } from '../../components/Ui';

export default function AlertsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    learningRepository
      .notifications()
      .then(setItems)
      .catch((err) => setError(apiError(err)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScreenLayout title="Alerts" activeTab="Alerts" showFooter={false} onRefresh={load}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {items.some((item) => !item.read) ? (
        <View style={styles.mb}>
          <SecondaryButton
            label="Mark all read"
            onPress={async () => {
              await learningRepository.markAllRead();
              load();
            }}
          />
        </View>
      ) : null}
      {items.map((item) => (
        <Card key={item._id} style={[styles.card, !item.read && styles.unread]}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.bodyText}>{item.body}</Text>
          <Text style={styles.meta}>{formatWhen(item.createdAt)}</Text>
        </Card>
      ))}
      {!items.length ? <EmptyState text="No alerts yet." /> : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  mb: { marginBottom: 10 },
  card: { marginBottom: 10 },
  unread: { borderColor: colors.gold, borderWidth: 1.5 },
  title: { fontWeight: '800', color: colors.navy },
  bodyText: { color: colors.text, marginTop: 4 },
  meta: { color: colors.muted, marginTop: 6, fontSize: 12 },
});

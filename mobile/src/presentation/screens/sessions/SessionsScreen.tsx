import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { getMySessionsUseCase } from '@domain/usecases/session/getMySessionsUseCase';
import { Session } from '@domain/entities/Session';

export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    getMySessionsUseCase().then(setSessions).catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Sessions</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.sessionTitle}>{item.subject}</Text>
            <Text style={styles.sessionDetail}>
              {new Date(item.scheduledAt).toLocaleString()} · {item.status}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No sessions yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  sessionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sessionDetail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});

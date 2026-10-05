import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { Session } from '../../../domain/entities/Session';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorOrange, tutorPage } from '../tutor/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'LiveSession'>;

export default function LiveSessionScreen({ route, navigation }: Props) {
  const role = useAuthStore((state) => state.user?.role);
  const isMentor = role === 'mentor';
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    sessionRepository.getMySessions()
      .then((items) => setSession(items.find((item) => item._id === route.params.id) ?? null))
      .catch(() => setSession(null))
      .finally(() => setLoading(false));
  }, [route.params.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const setLive = async (open: boolean) => {
    try {
      const updated = await sessionRepository.setLive(route.params.id, open);
      setSession(updated);
    } catch {
      Alert.alert('Could not update the room.');
    }
  };

  const title = session?.subject || route.params.title;

  return (
    <View style={styles.page}>
      <PageHeader title={title} onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        {loading ? <ActivityIndicator color={tutorNavy} /> : (
          <View style={styles.card}>
            <Text style={styles.kicker}>{session?.isLive ? 'Live' : session?.status || 'Session'}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.meta}>
              {session?.isLive
                ? 'The room is open for this booking.'
                : isMentor
                  ? 'Start the room when you are ready. The student gets an alert.'
                  : 'Waiting for your tutor to open the room.'}
            </Text>
            {isMentor ? (
              <TouchableOpacity style={styles.primary} onPress={() => setLive(!session?.isLive)}>
                <Text style={styles.primaryText}>{session?.isLive ? 'End room' : 'Start room'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  body: { padding: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: tutorLine, padding: 16 },
  kicker: { color: tutorOrange, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: tutorNavy, fontSize: 20, fontWeight: '800', marginTop: 6 },
  meta: { color: tutorMuted, fontSize: 13, lineHeight: 18, marginTop: 8 },
  primary: { alignSelf: 'flex-start', marginTop: 14, backgroundColor: tutorOrange, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  primaryText: { color: tutorNavy, fontWeight: '800' },
});

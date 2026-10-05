import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { getMySessionsUseCase } from '../../../domain/usecases/session/getMySessionsUseCase';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { Session } from '../../../domain/entities/Session';
import type { AppTabParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';

type Props = BottomTabScreenProps<AppTabParamList, 'Home'>;

export default function MentorHomeScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const [sessions, setSessions] = useState<Session[]>([]);

  useFocusEffect(useCallback(() => {
    let active = true;
    getMySessionsUseCase()
      .then((data) => {
        if (active) setSessions(data);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []));

  const upcoming = sessions.filter((session) => session.status === 'pending' || session.status === 'confirmed');
  const nextSession = upcoming[0];

  return (
    <View style={styles.page}>
      <PageHeader title="Mentor Home" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || 'Tutor'}</Text>
          <Text style={styles.rolePill}>Tutor dashboard</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{upcoming.length}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{sessions.length}</Text>
              <Text style={styles.statLabel}>All bookings</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Next booking</Text>
            {nextSession ? (
              <>
                <Text style={styles.sessionTitle}>{nextSession.subject}</Text>
                <Text style={styles.sessionMeta}>
                  {new Date(nextSession.scheduledAt).toLocaleString()} · {nextSession.status}
                </Text>
              </>
            ) : (
              <Text style={styles.empty}>No upcoming student bookings yet.</Text>
            )}
            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Sessions')}>
              <Text style={styles.linkText}>View bookings →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your students</Text>
            <Text style={styles.empty}>Open conversations with students who booked you.</Text>
            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Learning')}>
              <Text style={styles.linkText}>Open learning workspace →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const navy = '#062B67';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  scrollContent: { paddingBottom: 24 },
  hero: { backgroundColor: '#F4F7FB', paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 42,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  brandMarkText: { color: navy, fontWeight: '900', fontSize: 22 },
  brandCopy: { flex: 1, marginLeft: 10 },
  brandName: { color: '#FFF', fontSize: 24, fontWeight: '400' },
  brandStrong: { fontWeight: '900' },
  brandTagline: { color: '#D7E6FA', fontSize: 11 },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  bell: { color: '#FFD200', fontSize: 15 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0B1F4C',
    borderWidth: 2,
    borderColor: '#416FA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  welcome: { color: '#7585A5', fontSize: 14 },
  name: { color: navy, fontSize: 28, fontWeight: '900', marginTop: 2 },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: 'rgba(255,210,28,0.18)',
    color: '#FFD200',
    overflow: 'hidden',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '800',
  },
  content: { paddingHorizontal: 16, marginTop: 8 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3EAF4',
  },
  statValue: { color: navy, fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#7585A5', fontSize: 12, marginTop: 4, fontWeight: '700' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E3EAF4',
  },
  cardTitle: { color: navy, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  sessionTitle: { color: '#111827', fontSize: 15, fontWeight: '700' },
  sessionMeta: { color: '#6B7280', fontSize: 13, marginTop: 4 },
  empty: { color: '#7C8AA1', fontSize: 13, lineHeight: 18 },
  linkButton: { marginTop: 12 },
  linkText: { color: '#075A4D', fontSize: 13, fontWeight: '800' },
});

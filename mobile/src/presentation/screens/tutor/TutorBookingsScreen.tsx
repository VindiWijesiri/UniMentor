import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import type { Session } from '../../../domain/entities/Session';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorOrange, tutorPage } from './theme';

type Props = BottomTabScreenProps<AppTabParamList, 'Sessions'>;

function nameOf(value: Session['studentId'] | Session['mentorId'], fallback: string) {
  return value && typeof value === 'object' ? value.name : fallback;
}

function idOf(value: Session['studentId']) {
  return value && typeof value === 'object' ? value._id : value;
}

export default function TutorBookingsScreen({ navigation }: Props) {
  const stack = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  const load = useCallback(() => {
    console.log('[TutorBookings] Loading sessions...');
    sessionRepository.getMySessions()
      .then((loadedSessions) => {
        console.log('[TutorBookings] Loaded sessions:', loadedSessions.length);
        console.log('[TutorBookings] Session statuses:', loadedSessions.map(s => ({ id: s._id, status: s.status, subject: s.subject })));
        setSessions(loadedSessions);
      })
      .catch((error) => {
        console.error('[TutorBookings] Failed to load sessions:', error);
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // Filter sessions based on selected filter
  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  console.log(`[TutorBookings] Filter: ${filter}, Total sessions: ${sessions.length}, Filtered: ${filteredSessions.length}`);

  const setStatus = async (session: Session, status: Session['status']) => {
    try {
      await sessionRepository.updateStatus(session._id, status);
      load();
    } catch {
      Alert.alert('Could not update the booking.');
    }
  };

  const handleOpenSession = async (session: Session) => {
    // Show confirmation dialog with camera/mic permission request
    Alert.alert(
      'Join Session',
      `Ready to start the session with ${nameOf(session.studentId, 'student')}?\n\nCamera and microphone access will be requested.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Session',
          onPress: async () => {
            try {
              const cameraResult = await requestCameraPermission();
              const micResult = await requestMicrophonePermission();

              if (!cameraResult.granted || !micResult.granted) {
                Alert.alert(
                  'Permissions Required',
                  'Camera and microphone access are required for video sessions. Please enable them in Settings → UniMentor → Permissions.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Open Settings', onPress: () => Linking.openSettings() }
                  ]
                );
                return;
              }

              // Navigate to LiveSession screen
              stack?.navigate('LiveSession', { id: session._id, title: session.subject });
            } catch (error) {
              Alert.alert('Error', 'Failed to request permissions. Please try again.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Bookings" />
      
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
          onPress={() => setFilter('pending')}
        >
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'confirmed' && styles.filterTabActive]}
          onPress={() => setFilter('confirmed')}
        >
          <Text style={[styles.filterText, filter === 'confirmed' && styles.filterTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.filterText, filter === 'completed' && styles.filterTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>Requests from students land here. Confirm a booking to open the session room.</Text>
        {loading ? <ActivityIndicator color={tutorNavy} /> : null}
        {!loading && filteredSessions.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.title}>No {filter !== 'all' ? filter : ''} bookings</Text>
            <Text style={styles.meta}>
              {filter === 'completed' 
                ? 'Completed sessions will appear here after you mark them as complete.'
                : 'When a student books you, the request shows up in this list and in Alerts.'}
            </Text>
          </View>
        ) : null}
        {filteredSessions.map((session) => {
          const studentId = idOf(session.studentId);
          return (
            <View key={session._id} style={styles.card}>
              <Text style={styles.kicker}>{session.status}</Text>
              <Text style={styles.title}>{session.subject}</Text>
              <Text style={styles.meta}>{nameOf(session.studentId, 'Student')} · {new Date(session.scheduledAt).toLocaleString()}</Text>
              {session.notes ? <Text style={styles.meta}>{session.notes}</Text> : null}
              <View style={styles.row}>
                {session.status === 'pending' ? (
                  <>
                    <TouchableOpacity style={styles.primary} onPress={() => setStatus(session, 'confirmed')}>
                      <Text style={styles.primaryText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ghost} onPress={() => setStatus(session, 'cancelled')}>
                      <Text style={styles.ghostText}>Decline</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
                {session.status === 'confirmed' ? (
                  <>
                    <TouchableOpacity style={styles.primary} onPress={() => handleOpenSession(session)}>
                      <Text style={styles.primaryText}>Open room</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ghost} onPress={() => setStatus(session, 'completed')}>
                      <Text style={styles.ghostText}>Complete</Text>
                    </TouchableOpacity>
                  </>
                ) : null}
                {studentId ? (
                  <TouchableOpacity style={styles.ghost} onPress={() => stack?.navigate('TutorStudentProgress', { studentId })}>
                    <Text style={styles.ghostText}>Progress</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  scroll: { padding: 16, paddingBottom: 28 },
  lead: { color: tutorMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: tutorLine, padding: 14, marginBottom: 10 },
  kicker: { color: tutorOrange, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: tutorNavy, fontSize: 16, fontWeight: '800', marginTop: 4 },
  meta: { color: tutorMuted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  primary: { backgroundColor: tutorOrange, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  primaryText: { color: tutorNavy, fontWeight: '800' },
  ghost: { backgroundColor: '#E8EEF8', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  ghostText: { color: tutorNavy, fontWeight: '800' },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: tutorPage,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#E8EEF8',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: tutorOrange,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '700',
    color: tutorNavy,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
});

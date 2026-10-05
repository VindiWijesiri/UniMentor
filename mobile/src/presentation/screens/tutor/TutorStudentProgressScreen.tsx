import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { tutorPortalRepository, type TutorProgress } from '../../../data/repositories/tutorPortalRepository';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorPage } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorStudentProgress'>;

export default function TutorStudentProgressScreen({ route, navigation }: Props) {
  const [data, setData] = useState<TutorProgress | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    tutorPortalRepository.progress(route.params.studentId)
      .then((progress) => { setData(progress); setError(''); })
      .catch(() => setError('This student is not booked with you yet.'))
      .finally(() => setLoading(false));
  }, [route.params.studentId]));

  return (
    <View style={styles.page}>
      <PageHeader title={data?.student.name || 'Student progress'} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? <ActivityIndicator color={tutorNavy} /> : null}
        {error ? <Text style={styles.lead}>{error}</Text> : null}
        {data ? (
          <>
            <View style={styles.card}>
              <Text style={styles.kicker}>This week</Text>
              <Text style={styles.title}>{data.week.hoursDone}h / {data.week.hoursGoal}h</Text>
              <Text style={styles.meta}>Hours count while UniMentor is open. {data.week.hoursLeft}h left · {data.week.percent}% of the weekly goal.</Text>
            </View>
            <Text style={styles.section}>Goals</Text>
            {data.goals.length === 0 ? <Text style={styles.lead}>No study goals yet.</Text> : null}
            {data.goals.map((goal) => (
              <View key={goal._id} style={styles.card}>
                <Text style={styles.title}>{goal.moduleCode} · {goal.title}</Text>
                <Text style={styles.meta}>{goal.progress}% · target {goal.targetGrade} · {goal.dueLabel}</Text>
              </View>
            ))}
            <Text style={styles.section}>Sessions with you</Text>
            {data.sessions.map((session) => (
              <View key={session._id} style={styles.card}>
                <Text style={styles.title}>{session.subject}</Text>
                <Text style={styles.meta}>{session.status} · {new Date(session.scheduledAt).toLocaleString()}</Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  scroll: { padding: 16, paddingBottom: 28 },
  section: { color: tutorNavy, fontWeight: '800', fontSize: 16, marginTop: 8, marginBottom: 8 },
  lead: { color: tutorMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: tutorLine, padding: 14, marginBottom: 10 },
  kicker: { color: '#FF8D28', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: tutorNavy, fontWeight: '800', fontSize: 16, marginTop: 4 },
  meta: { color: tutorMuted, fontSize: 12, marginTop: 4, lineHeight: 18 },
});

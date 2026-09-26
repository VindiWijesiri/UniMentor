import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../domain/stores/authStore';
import { learningRepository } from '../../../data/repositories/learningRepository';
import { apiError, formatWhen, personName } from '../../../shared/format';
import { colors } from '../../../shared/theme';
import ScreenLayout from '../../components/ScreenLayout';
import { Badge, Card, EmptyState, PrimaryButton } from '../../components/Ui';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import type { Session } from '../../../domain/entities/Session';
import type { Goal } from '../../../domain/entities/Goal';
import type { Assessment, Submission } from '../../../domain/entities/Assessment';
import type { Complaint } from '../../../domain/entities/Learning';
import type { Material } from '../../../domain/entities/Material';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList> };

export default function HomeScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<Awaited<ReturnType<typeof learningRepository.dashboard>> | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await learningRepository.dashboard());
      setError('');
    } catch (err) {
      setError(apiError(err));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const nextSession = data?.sessions?.[0];

  return (
    <ScreenLayout
      title="Home"
      activeTab="Home"
      showFooter={false}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      <Text style={styles.hello}>Hello, {user?.name?.split(' ')[0] ?? 'there'}</Text>
      <Text style={styles.sub}>Your UniMentor workspace</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {user?.role === 'student' && (
        <>
          <PrimaryButton label="Find a mentor" onPress={() => navigation.navigate('Search')} />
          {nextSession ? (
            <TouchableOpacity onPress={() => navigation.navigate('BookingDetail', { sessionId: nextSession._id })}>
              <Card style={styles.mt}>
                <Badge text={nextSession.status} tone="orange" />
                <Text style={styles.cardTitle}>{nextSession.subject}</Text>
                <Text style={styles.muted}>
                  {personName(nextSession.mentorId, 'Mentor')} · {formatWhen(nextSession.scheduledAt)}
                </Text>
              </Card>
            </TouchableOpacity>
          ) : null}
          <WeekCard hours={data?.weekHours} target={data?.weeklyTargetHours} />
          <Section title="Today's goals" onMore={() => navigation.navigate('Goals')}>
            {(data?.goals as Goal[] | undefined)?.slice(0, 3).map((goal) => (
              <TouchableOpacity key={goal._id} onPress={() => navigation.navigate('GoalProgress', { goalId: goal._id })}>
                <Card style={styles.mb}>
                  <Text style={styles.cardTitle}>{goal.title}</Text>
                  <Text style={styles.muted}>{goal.progress}% of {goal.targetHours}h</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${goal.progress}%` }]} />
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
            {!data?.goals?.length ? <EmptyState text="No goals yet. Add one from Learning." /> : null}
          </Section>
        </>
      )}

      {user?.role === 'mentor' && (
        <>
          <PrimaryButton label="Verify a booking" onPress={() => navigation.navigate('VerifyBooking')} />
          <Section title="Waiting to verify">
            {(data?.pendingVerify as Session[] | undefined)?.map((session) => (
              <TouchableOpacity key={session._id} onPress={() => navigation.navigate('VerifyBooking', { sessionId: session._id })}>
                <Card style={styles.mb}>
                  <Text style={styles.cardTitle}>{session.subject}</Text>
                  <Text style={styles.muted}>
                    {personName(session.studentId, 'Student')} · {formatWhen(session.scheduledAt)}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
            {!data?.pendingVerify?.length ? <EmptyState text="No pending verifications." /> : null}
          </Section>
          <Section title="Needs grading" onMore={() => navigation.navigate('Assessments')}>
            {(data?.pendingSubmissions as Submission[] | undefined)?.slice(0, 4).map((item) => (
              <TouchableOpacity key={item._id} onPress={() => navigation.navigate('GradeSubmission', { submission: item })}>
                <Card style={styles.mb}>
                  <Text style={styles.cardTitle}>
                    {typeof item.assessmentId === 'object' ? item.assessmentId.title : 'Assessment'}
                  </Text>
                  <Text style={styles.muted}>{personName(item.studentId, 'Student')}</Text>
                </Card>
              </TouchableOpacity>
            ))}
          </Section>
        </>
      )}

      {user?.role === 'lic' && (
        <Section title="Integrity queue" onMore={() => navigation.navigate('IntegrityHub')}>
          <Card style={styles.mb}>
            <Text style={styles.cardTitle}>{data?.openComplaints ?? 0} open cases</Text>
            <Text style={styles.muted}>Review academic complaints and tutor conduct.</Text>
          </Card>
          {(data?.complaints as Complaint[] | undefined)?.slice(0, 4).map((item) => (
            <TouchableOpacity key={item._id} onPress={() => navigation.navigate('ExamineCase', { complaintId: item._id })}>
              <Card style={styles.mb}>
                <Badge text={item.status} tone={item.status === 'open' ? 'danger' : 'orange'} />
                <Text style={styles.cardTitle}>{item.title}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </Section>
      )}

      {user?.role === 'admin' && (
        <>
          <PrimaryButton label="Study material pricing" onPress={() => navigation.navigate('Pricing')} />
          <Card style={styles.mt}>
            <Text style={styles.cardTitle}>Campus price cap</Text>
            <Text style={styles.muted}>LKR {data?.materialPriceCap ?? 0}</Text>
          </Card>
        </>
      )}

      <Section title="Continue learning" onMore={() => navigation.navigate('Materials')}>
        {(data?.materials as Material[] | undefined)?.slice(0, 2).map((material) => (
          <TouchableOpacity key={material._id} onPress={() => navigation.navigate('MaterialDetail', { materialId: material._id })}>
            <Card style={styles.mb}>
              <Text style={styles.cardTitle}>{material.title}</Text>
              <Text style={styles.muted}>{material.subject}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Upcoming assessments" onMore={() => navigation.navigate('Assessments')}>
        {user?.role === 'student'
          ? (data?.assessments as Assessment[] | undefined)?.slice(0, 3).map((item) => (
              <TouchableOpacity key={item._id} onPress={() => navigation.navigate('AssessmentTake', { assessmentId: item._id })}>
                <Card style={styles.mb}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.muted}>{item.subject}</Text>
                </Card>
              </TouchableOpacity>
            ))
          : (data?.assessments as Assessment[] | undefined)?.slice(0, 3).map((item) => (
              <TouchableOpacity key={item._id} onPress={() => navigation.navigate('Assessments')}>
                <Card style={styles.mb}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.muted}>{item.subject}</Text>
                </Card>
              </TouchableOpacity>
            ))}
      </Section>
    </ScreenLayout>
  );
}

function WeekCard({
  hours,
  target,
}: {
  hours?: { label: string; minutes: number }[];
  target?: number;
}) {
  if (!hours) return null;
  const total = hours.reduce((sum, item) => sum + item.minutes, 0) / 60;
  const max = Math.max(...hours.map((item) => item.minutes), 1);
  return (
    <Card style={styles.mt}>
      <View style={styles.row}>
        <Text style={styles.cardTitle}>Weekly study hours</Text>
        <Badge text={`${total.toFixed(1)} / ${target ?? 20} hrs`} tone="orange" />
      </View>
      <View style={styles.weekRow}>
        {hours.map((item) => (
          <View key={item.label} style={styles.weekItem}>
            <View style={[styles.weekBar, { height: 12 + (item.minutes / max) * 48 }]} />
            <Text style={styles.weekLabel}>{item.label[0]}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function Section({
  title,
  children,
  onMore,
}: {
  title: string;
  children: React.ReactNode;
  onMore?: () => void;
}) {
  return (
    <View style={styles.mt}>
      <View style={styles.row}>
        <Text style={styles.section}>{title}</Text>
        {onMore ? (
          <TouchableOpacity onPress={onMore}>
            <Text style={styles.more}>View all</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hello: { fontSize: 24, fontWeight: '800', color: colors.navy },
  sub: { color: colors.muted, marginBottom: 16, marginTop: 4 },
  error: { color: colors.danger, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.navy, marginTop: 6 },
  muted: { color: colors.muted, marginTop: 4, fontSize: 13 },
  mt: { marginTop: 16 },
  mb: { marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  section: { fontSize: 16, fontWeight: '800', color: colors.navy },
  more: { color: colors.info, fontWeight: '700', fontSize: 13 },
  barTrack: { height: 6, backgroundColor: colors.border, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 6, backgroundColor: colors.gold },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, height: 80 },
  weekItem: { alignItems: 'center', width: 28 },
  weekBar: { width: 14, backgroundColor: colors.navy, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  weekLabel: { fontSize: 10, color: colors.muted, marginTop: 4 },
});

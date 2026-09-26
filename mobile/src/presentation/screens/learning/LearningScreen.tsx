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
import type { Assessment } from '../../../domain/entities/Assessment';
import type { Material } from '../../../domain/entities/Material';
import type { Submission } from '../../../domain/entities/Assessment';
import type { Complaint } from '../../../domain/entities/Learning';

type Props = { navigation: NativeStackNavigationProp<AppStackParamList> };

export default function LearningScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'student';
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

  return (
    <ScreenLayout
      title="Learning Dashboard"
      activeTab="Learning"
      showFooter={false}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
      }}
    >
      <Text style={styles.kicker}>UniMentor Learning Hub</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {role === 'student' && <StudentHub navigation={navigation} data={data} />}
      {role === 'mentor' && <MentorHub navigation={navigation} data={data} />}
      {role === 'lic' && <LicHub navigation={navigation} data={data} />}
      {role === 'admin' && <AdminHub navigation={navigation} data={data} />}
    </ScreenLayout>
  );
}

function StudentHub({
  navigation,
  data,
}: {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  data: Awaited<ReturnType<typeof learningRepository.dashboard>> | null;
}) {
  const hours = data?.weekHours ?? [];
  const total = hours.reduce((sum, item) => sum + item.minutes, 0) / 60;
  const target = data?.weeklyTargetHours ?? 20;
  const max = Math.max(...hours.map((item) => item.minutes), 1);
  const continueMaterial = data?.continueMaterial;

  return (
    <View>
      <ScrollRow>
        <Chip label="Study materials" onPress={() => navigation.navigate('Materials')} />
        <Chip label="Assessments" onPress={() => navigation.navigate('Assessments')} />
        <Chip label="My goals" onPress={() => navigation.navigate('Goals')} />
        <Chip label="Study groups" onPress={() => navigation.navigate('Groups')} />
        <Chip label="Chat pod" onPress={() => navigation.navigate('Inbox')} />
        <Chip label="Complaints" onPress={() => navigation.navigate('Complaints')} />
      </ScrollRow>

      <Card>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Weekly study hours</Text>
          <Badge text={`${total.toFixed(1)} / ${target} hrs`} tone="orange" />
        </View>
        <View style={styles.weekRow}>
          {hours.map((item) => (
            <View key={item.label} style={styles.weekItem}>
              <View style={[styles.weekBar, { height: 10 + (item.minutes / max) * 52 }]} />
              <Text style={styles.weekLabel}>{item.label[0]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.muted}>{Math.min(100, Math.round((total / (target || 1)) * 100))}% of weekly goal</Text>
      </Card>

      <Text style={styles.section}>Today's goals</Text>
      <ScrollRow>
        {(data?.goals as Goal[] | undefined)?.map((goal) => (
          <TouchableOpacity key={goal._id} onPress={() => navigation.navigate('GoalProgress', { goalId: goal._id })}>
            <Card style={styles.goalCard}>
              <Badge text={`${goal.progress}%`} tone={goal.progress >= 100 ? 'success' : 'orange'} />
              <Text style={styles.cardTitle}>{goal.title}</Text>
              <Text style={styles.muted}>{goal.subject}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${goal.progress}%` }]} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollRow>
      {!data?.goals?.length ? <EmptyState text="No goals yet. Create one from My goals." /> : null}

      {continueMaterial ? (
        <Card style={styles.mt}>
          <Badge text="Continue where you left off" tone="orange" />
          <Text style={styles.cardTitle}>{continueMaterial.title}</Text>
          <Text style={styles.muted}>{continueMaterial.subject}</Text>
          <View style={styles.mt}>
            <PrimaryButton
              label="Continue activity"
              onPress={() => navigation.navigate('MaterialDetail', { materialId: continueMaterial._id })}
            />
          </View>
        </Card>
      ) : null}

      <Section title="Academic sessions" onMore={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}>
        {(data?.sessions as Session[] | undefined)?.slice(0, 4).map((session) => (
          <TouchableOpacity key={session._id} onPress={() => navigation.navigate('BookingDetail', { sessionId: session._id })}>
            <Card style={styles.mb}>
              <Badge text={session.status} />
              <Text style={styles.cardTitle}>{session.subject}</Text>
              <Text style={styles.muted}>
                {personName(session.mentorId)} · {formatWhen(session.scheduledAt)}
              </Text>
            </Card>
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Upcoming assessments" onMore={() => navigation.navigate('Assessments')}>
        {(data?.assessments as Assessment[] | undefined)?.slice(0, 4).map((item) => (
          <TouchableOpacity key={item._id} onPress={() => navigation.navigate('AssessmentTake', { assessmentId: item._id })}>
            <Card style={styles.mb}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.subject} · {item.durationMinutes}m</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Recent materials" onMore={() => navigation.navigate('Materials')}>
        {(data?.materials as Material[] | undefined)?.slice(0, 3).map((item) => (
          <TouchableOpacity key={item._id} onPress={() => navigation.navigate('MaterialDetail', { materialId: item._id })}>
            <Card style={styles.mb}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.subject}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </Section>

      <PrimaryButton label="Open discussions" onPress={() => navigation.navigate('Inbox')} />
      <View style={styles.mt}>
        <PrimaryButton label="Improvement history" onPress={() => navigation.navigate('ImprovementHistory')} />
      </View>
    </View>
  );
}

function MentorHub({
  navigation,
  data,
}: {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  data: Awaited<ReturnType<typeof learningRepository.dashboard>> | null;
}) {
  return (
    <View>
      <ScrollRow>
        <Chip label="Materials hub" onPress={() => navigation.navigate('Materials')} />
        <Chip label="Assessments" onPress={() => navigation.navigate('Assessments')} />
        <Chip label="Question library" onPress={() => navigation.navigate('QuestionLibrary')} />
        <Chip label="Study groups" onPress={() => navigation.navigate('Groups')} />
        <Chip label="Verify booking" onPress={() => navigation.navigate('VerifyBooking')} />
      </ScrollRow>
      <Section title="Waiting to verify">
        {(data?.pendingVerify as Session[] | undefined)?.map((session) => (
          <TouchableOpacity key={session._id} onPress={() => navigation.navigate('VerifyBooking', { sessionId: session._id })}>
            <Card style={styles.mb}>
              <Text style={styles.cardTitle}>{session.subject}</Text>
              <Text style={styles.muted}>{personName(session.studentId)} · {formatWhen(session.scheduledAt)}</Text>
            </Card>
          </TouchableOpacity>
        ))}
        {!data?.pendingVerify?.length ? <EmptyState text="No pending attendance checks." /> : null}
      </Section>
      <Section title="Needs grading" onMore={() => navigation.navigate('Assessments')}>
        {(data?.pendingSubmissions as Submission[] | undefined)?.map((item) => (
          <TouchableOpacity key={item._id} onPress={() => navigation.navigate('GradeSubmission', { submission: item })}>
            <Card style={styles.mb}>
              <Text style={styles.cardTitle}>{typeof item.assessmentId === 'object' ? item.assessmentId.title : 'Assessment'}</Text>
              <Text style={styles.muted}>{personName(item.studentId)}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </Section>
      <PrimaryButton label="Create MCQ quiz" onPress={() => navigation.navigate('AssessmentBuilder', { type: 'mcq' })} />
    </View>
  );
}

function LicHub({
  navigation,
  data,
}: {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  data: Awaited<ReturnType<typeof learningRepository.dashboard>> | null;
}) {
  return (
    <View>
      <Card>
        <Text style={styles.cardTitle}>{data?.openComplaints ?? 0} open integrity cases</Text>
        <Text style={styles.muted}>Conduct, copyright and assignment reviews.</Text>
      </Card>
      <View style={styles.mt}>
        <PrimaryButton label="Integrity hub" onPress={() => navigation.navigate('IntegrityHub')} />
      </View>
      {(data?.complaints as Complaint[] | undefined)?.slice(0, 5).map((item) => (
        <TouchableOpacity key={item._id} onPress={() => navigation.navigate('ExamineCase', { complaintId: item._id })}>
          <Card style={styles.mb}>
            <Badge text={item.status} tone={item.status === 'open' ? 'danger' : 'orange'} />
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.muted}>{item.category.replace('_', ' ')}</Text>
          </Card>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AdminHub({
  navigation,
  data,
}: {
  navigation: NativeStackNavigationProp<AppStackParamList>;
  data: Awaited<ReturnType<typeof learningRepository.dashboard>> | null;
}) {
  return (
    <View>
      <Card>
        <Text style={styles.cardTitle}>Campus price cap</Text>
        <Text style={styles.muted}>LKR {data?.materialPriceCap ?? 0}</Text>
      </Card>
      <View style={styles.mt}>
        <PrimaryButton label="Study material pricing" onPress={() => navigation.navigate('Pricing')} />
      </View>
      <View style={styles.mt}>
        <PrimaryButton label="Complaints" onPress={() => navigation.navigate('Complaints')} />
      </View>
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
}

function ScrollRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.chipRow}>{children}</View>
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
  kicker: { color: colors.gold, fontWeight: '800', textTransform: 'uppercase', fontSize: 11, marginBottom: 10 },
  error: { color: colors.danger, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.navy, marginTop: 6 },
  muted: { color: colors.muted, marginTop: 4, fontSize: 13 },
  section: { fontSize: 16, fontWeight: '800', color: colors.navy, marginTop: 16, marginBottom: 8 },
  more: { color: colors.info, fontWeight: '700' },
  mt: { marginTop: 14 },
  mb: { marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chip: { backgroundColor: colors.navy, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: colors.gold, fontWeight: '800', fontSize: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80, marginTop: 10 },
  weekItem: { alignItems: 'center', width: 28 },
  weekBar: { width: 14, backgroundColor: colors.navy, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  weekLabel: { fontSize: 10, color: colors.muted, marginTop: 4 },
  goalCard: { width: 170, marginRight: 10 },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.gold },
});

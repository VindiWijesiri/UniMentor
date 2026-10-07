import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { learningRepository } from '../../../data/repositories/learningRepository';
import type { LearningDashboard } from '../../../domain/entities/Learning';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import {
  SvgCalendar,
  SvgChat,
  SvgCheck,
  SvgClipboard,
  SvgFileText,
  SvgPlay,
} from '../../components/common/SvgIcons';
import { card, ice, ink, live, muted, navy, pageBg, secondaryBlue, yellow } from './learningTheme';
import RecentDiscussionsCard from './RecentDiscussionsCard';


type Props = BottomTabScreenProps<AppTabParamList, 'Learning'>;
type StackNav = NativeStackNavigationProp<AppStackParamList>;

function formatWhen(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function LearningDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const user = useAuthStore((state) => state.user);
  const stack = navigation.getParent<StackNav>();
  const [data, setData] = useState<LearningDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lastLoad = useRef(0);
  const dataRef = useRef<LearningDashboard | null>(null);
  dataRef.current = data;

  const load = useCallback(() => {
    let active = true;
    if (dataRef.current && Date.now() - lastLoad.current < 20000) return () => { active = false; };
    if (!dataRef.current) setLoading(true);
    learningRepository.getDashboard()
      .then((dashboard) => {
        if (active) {
          setData(dashboard);
          setError('');
          lastLoad.current = Date.now();
        }
      })
      .catch(() => {
        if (active && !dataRef.current) setError('Could not load your learning dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const initials = data?.header.initials || user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'ST';
  const week = data?.weeklyStudy;
  const maxHours = Math.max(4, ...(week?.days.map((day) => day.hours) ?? [1]));
  const activity = data?.continueActivity;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Learning Dashboard</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.shortcutBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutRow}>
            <TouchableOpacity style={[styles.shortcut, styles.shortcutActive]} onPress={() => stack?.navigate('ChatPod')}>
              <SvgChat size={15} color={navy} />
              <Text style={styles.shortcutActiveText}>Chat Pod</Text>
              {(data?.header.unreadChat ?? 0) > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{data?.header.unreadChat} New</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcut} onPress={() => stack?.navigate('StudyPlans')}>
              <SvgCalendar size={15} color={navy} />
              <Text style={styles.shortcutText}>My Plans</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcut} onPress={() => stack?.navigate('StudyMaterials')}>
              <SvgFileText size={15} color={navy} />
              <Text style={styles.shortcutText}>Study Materials</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcut} onPress={() => stack?.navigate('Assessments')}>
              <SvgClipboard size={15} color={navy} />
              <Text style={styles.shortcutText}>Assessments</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>


        {loading && !data ? (
          <View style={styles.state}><ActivityIndicator color={navy} /><Text style={styles.stateText}>Loading dashboard...</Text></View>
        ) : error && !data ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>{error}</Text>
            <Text style={styles.stateText}>Check that the API is running, then try again.</Text>
            <TouchableOpacity style={styles.yellowBtn} onPress={load}>
              <Text style={styles.yellowBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.body}>
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Weekly Study Hours</Text>
                <Text style={styles.hoursTotal}>{week?.hoursDone ?? 0} / {week?.hoursGoal ?? 20} hours</Text>
              </View>
              <View style={styles.chart}>
                {(week?.days ?? []).map((day, index) => (
                  <View key={`${day.day}-${index}`} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: `${Math.max(8, (day.hours / maxHours) * 100)}%` }]} />
                    </View>
                    <Text style={styles.barLabel}>{day.day}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.weekMeta}>
                <Text style={styles.weekPercent}>{week?.percent ?? 0}% of weekly goal accomplished</Text>
                <Text style={styles.weekLeft}>{week?.hoursLeft ?? 0}h left</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's Goals</Text>
              {(data?.todayGoals ?? []).map((goal) => (
                <TouchableOpacity
                  key={goal._id}
                  style={styles.goalRow}
                  onPress={async () => {
                    try {
                      await learningRepository.toggleGoal(goal._id);
                      load();
                    } catch {
                      setError('Could not update this goal. Check your connection.');
                    }
                  }}
                >
                  <View style={[styles.goalCheck, goal.completed && styles.goalCheckOn]}>
                    {goal.completed ? <SvgCheck size={12} color={navy} strokeWidth={3} /> : null}
                  </View>
                  <View style={styles.goalCopy}>
                    <Text style={styles.goalTitle}>{goal.title}</Text>
                    <Text style={styles.goalMeta}>{goal.dueLabel}</Text>
                  </View>
                  <Text style={styles.goalProgress}>{goal.current}/{goal.total} done</Text>
                </TouchableOpacity>
              ))}
            </View>

            {activity && (
              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>Continue where you left off</Text>
                  <Text style={styles.hoursTotal}>{activity.percent}% done</Text>
                </View>
                <Text style={styles.moduleCode}>{activity.moduleCode} · {activity.moduleName}</Text>
                <Text style={styles.topic}>Topic: {activity.topic}</Text>
                <Text style={styles.goalMeta}>
                  {activity.activityType} {activity.done}/{activity.total} done · ~{activity.minutesLeft} min left
                </Text>
                <TouchableOpacity
                  style={styles.yellowBtn}
                  onPress={() => stack?.navigate('LearningActivity', { id: activity._id })}
                >
                  <View style={styles.btnInnerRow}>
                    <SvgPlay size={13} color={navy} />
                    <Text style={styles.yellowBtnText}>Continue Activity</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Academic Sessions</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
                  <Text style={styles.viewAll}>View All ({data?.sessions.total ?? 0})</Text>
                </TouchableOpacity>
              </View>
              {data?.sessions.live && (
                <View style={styles.liveCard}>
                  <View style={styles.liveTop}>
                    <View style={styles.livePill}><Text style={styles.livePillText}>LIVE NOW</Text></View>
                    <Text style={styles.liveType}>{data.sessions.live.type}</Text>
                    <Text style={styles.liveTime}>{data.sessions.live.minutesLeft} min left</Text>
                  </View>
                  <Text style={styles.liveTitle}>{data.sessions.live.title}</Text>
                  <Text style={styles.goalMeta}>{data.sessions.live.tutorName}</Text>
                  <TouchableOpacity
                    style={styles.navyBtn}
                    onPress={() => stack?.navigate('LiveSession', {
                      id: data.sessions.live!._id,
                      title: data.sessions.live!.title,
                      tutorName: data.sessions.live!.tutorName,
                      minutesLeft: data.sessions.live!.minutesLeft,
                    })}
                  >
                    <Text style={styles.navyBtnText}>Join Room</Text>
                  </TouchableOpacity>
                </View>
              )}
              {(data?.sessions.upcoming ?? []).map((session) => (
                <View key={session._id} style={styles.upcomingRow}>
                  <View>
                    <Text style={styles.upcomingLabel}>UPCOMING</Text>
                    <Text style={styles.goalTitle}>{session.moduleCode} · {session.title}</Text>
                    <Text style={styles.goalMeta}>{formatWhen(session.scheduledAt)}</Text>
                  </View>
                </View>
              ))}
            </View>

            <RecentDiscussionsCard
              feed={data?.podFeed}
              onOpenPod={() => stack?.navigate('ChatPod')}
              onOpenConversation={(conversation) => stack?.navigate('PodThread', { conversationId: conversation._id })}
            />

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Upcoming Assessments</Text>
                <TouchableOpacity onPress={() => stack?.navigate('Assessments')}>
                  <Text style={styles.viewAll}>Assessment centre</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.dueSoon}>{data?.assessments.dueSoon ?? 0} due soon on your plan</Text>
              {(data?.assessments.items ?? []).map((item) => (
                <View key={item._id} style={styles.assessmentBlock}>
                  <Text style={styles.upcomingLabel}>{item.type === 'exam' ? 'MOCK EXAMINATION' : 'ASSIGNMENT'}</Text>
                  <Text style={styles.goalTitle}>{item.title}</Text>
                  <Text style={styles.topic}>{item.subject}</Text>
                  <Text style={styles.goalMeta}>
                    {item.scheduledAt
                      ? `${formatWhen(item.scheduledAt)}${item.durationMin ? ` · ${item.durationMin} min` : ''}${item.marks ? ` · ${item.marks} marks` : ''}`
                      : `Due: ${formatWhen(item.dueDate)}`}
                  </Text>
                  <TouchableOpacity
                    style={item.type === 'assignment' ? styles.yellowBtn : styles.ghostBtn}
                    onPress={() => stack?.navigate('Assessments')}
                  >
                    <Text style={item.type === 'assignment' ? styles.yellowBtnText : styles.ghostBtnText}>
                      {item.type === 'assignment' ? 'Submit Work' : 'View Assessment Details'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Recent Study Materials</Text>
                <TouchableOpacity onPress={() => stack?.navigate('StudyMaterials')}>
                  <Text style={styles.viewAll}>All Docs</Text>
                </TouchableOpacity>
              </View>
              {(data?.materials ?? []).map((item) => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.materialRow}
                  onPress={() => stack?.navigate('StudyMaterialDetail', { id: item._id })}
                >
                  <View style={styles.fileIcon}>
                    {item.kind === 'pdf' ? (
                      <SvgFileText size={18} color={navy} />
                    ) : (
                      <SvgClipboard size={18} color={navy} />
                    )}
                  </View>
                  <View style={styles.goalCopy}>
                    <Text style={styles.goalTitle}>{item.title}</Text>
                    <Text style={styles.goalMeta}>
                      {item.sourceType === 'group' ? 'Group' : 'Session'}: {item.sourceLabel}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  scroll: { paddingBottom: 24 },
  headerBar: {
    backgroundColor: navy,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandMentor: {
    color: yellow,
    fontSize: 20,
    fontWeight: '800',
  },
  btnInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shortcutBar: { backgroundColor: ice, paddingVertical: 12, paddingLeft: 12 },
  shortcutRow: { flexDirection: 'row', gap: 8, paddingRight: 16 },
  shortcut: {
    borderRadius: 22,
    backgroundColor: secondaryBlue,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shortcutActive: { backgroundColor: yellow },
  shortcutText: { color: navy, fontSize: 11, fontWeight: '800' },
  shortcutActiveText: { color: navy, fontSize: 11, fontWeight: '900' },
  shortcutIcon: { color: navy, fontSize: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: live },
  badge: { backgroundColor: navy, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  body: { padding: 14, gap: 10 },
  card: {
    backgroundColor: card, borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: '#E6EAF2',
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: ink, fontSize: 16, fontWeight: '900' },
  hoursTotal: { color: muted, fontSize: 12, fontWeight: '700' },
  chart: { height: 92, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 6 },
  barCol: { alignItems: 'center', width: 28, height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: 10, height: 70, borderRadius: 6, backgroundColor: '#EEF2F7', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: yellow, borderRadius: 6 },
  barLabel: { color: muted, fontSize: 10, fontWeight: '700', marginTop: 6 },
  weekMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  weekPercent: { color: ink, fontSize: 12, fontWeight: '700' },
  weekLeft: { color: muted, fontSize: 12, fontWeight: '700' },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F3F8' },
  goalCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#D5DCE8',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  goalCheckOn: { backgroundColor: yellow, borderColor: yellow },
  goalCheckText: { color: navy, fontSize: 12, fontWeight: '900' },
  goalCopy: { flex: 1, minWidth: 0 },
  goalTitle: { color: ink, fontSize: 14, fontWeight: '800' },
  goalMeta: { color: muted, fontSize: 12, marginTop: 3 },
  goalProgress: { color: muted, fontSize: 11, fontWeight: '700' },
  moduleCode: { color: ink, fontSize: 15, fontWeight: '900' },
  topic: { color: ink, fontSize: 13, fontWeight: '700', marginTop: 4 },
  yellowBtn: { backgroundColor: yellow, borderRadius: 16, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  yellowBtnText: { color: navy, fontSize: 15, fontWeight: '900' },
  navyBtn: { backgroundColor: navy, borderRadius: 14, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  navyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  ghostBtn: {
    borderRadius: 16, paddingVertical: 13, alignItems: 'center', marginTop: 12,
    borderWidth: 1, borderColor: '#D9E1EE',
  },
  ghostBtnText: { color: navy, fontSize: 14, fontWeight: '800' },
  viewAll: { color: '#0B6B5B', fontSize: 12, fontWeight: '800' },
  dueSoon: { color: '#B45309', fontSize: 12, fontWeight: '800' },
  liveCard: { backgroundColor: '#F7FAFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E1E9F6' },
  liveTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  livePill: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  livePillText: { color: live, fontSize: 10, fontWeight: '900' },
  liveType: { color: muted, fontSize: 11, fontWeight: '700' },
  liveTime: { marginLeft: 'auto', color: muted, fontSize: 11, fontWeight: '700' },
  liveTitle: { color: ink, fontSize: 16, fontWeight: '900' },
  upcomingRow: { paddingTop: 12, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F0F3F8' },
  upcomingLabel: { color: muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, marginBottom: 4 },
  assessmentBlock: { paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: '#F0F3F8' },
  materialRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F3F8' },
  fileIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF3FB',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  fileIconText: { color: navy, fontSize: 10, fontWeight: '900' },
  state: { padding: 40, alignItems: 'center' },
  stateText: { color: muted, marginTop: 8 },
  stateTitle: { color: ink, fontWeight: '800' },
});

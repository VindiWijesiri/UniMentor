import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
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
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import {
  SvgCalendar,
  SvgCheck,
  SvgClipboard,
  SvgFileText,
  SvgPlay,
} from '../../components/common/SvgIcons';
import { card, ice, ink, live, muted, navy, pageBg, secondaryBlue, yellow } from './learningTheme';
import RecentDiscussionsCard from './RecentDiscussionsCard';
import FocusSession from './FocusSession';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = BottomTabScreenProps<AppTabParamList, 'Learning'>;
type StackNav = NativeStackNavigationProp<AppStackParamList>;

const HOUR_OPTIONS = [0, 1, 2].map((hour) => ({ key: String(hour), label: hour === 1 ? '1 hour' : `${hour} hours` }));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => ({
  key: String(minute),
  label: minute === 1 ? '1 min' : `${minute} min`,
}));

function MenuField({ label, value, options, onSelect }: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.menuField}>
      <Text style={styles.menuLabel}>{label}</Text>
      <TouchableOpacity style={styles.menu} onPress={() => setOpen(true)}>
        <Text style={styles.menuValue} numberOfLines={1}>{value}</Text>
        <Text style={styles.menuCaret}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.menuBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menuSheet} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.menuSheetTitle}>{label}</Text>
            <ScrollView style={styles.menuList}>
              {options.map((option) => (
                <TouchableOpacity key={option.key} style={styles.menuOption} onPress={() => { onSelect(option.key); setOpen(false); }}>
                  <Text style={[styles.menuOptionText, option.label === value && styles.menuOptionOn]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

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
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const stack = navigation.getParent<StackNav>();
  const [data, setData] = useState<LearningDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [goalId, setGoalId] = useState('');
  const [studyArea, setStudyArea] = useState('');
  const [focusHours, setFocusHours] = useState(0);
  const [focusMins, setFocusMins] = useState(25);
  const [focusOn, setFocusOn] = useState(false);
  const lastLoad = useRef(0);
  const dataRef = useRef<LearningDashboard | null>(null);
  dataRef.current = data;

  const load = useCallback(() => {
    let active = true;
    if (dataRef.current && Date.now() - lastLoad.current < 5000) return () => { active = false; };
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

  const week = data?.weeklyStudy;
  const maxHours = Math.max(4, ...(week?.days.map((day) => day.hours) ?? [1]));
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayHours = week?.days[todayIndex]?.hours ?? 0;
  const activity = data?.continueActivity;
  const focusGoals = (data?.todayGoals ?? []).map((goal) => ({
    id: goal._id,
    title: goal.moduleCode ? `${goal.moduleCode} · ${goal.title}` : goal.title,
    code: goal.moduleCode || 'Goal',
    areas: goal.areas?.length ? goal.areas : ['Whole goal'],
  }));
  const selectedGoal = focusGoals.find((goal) => goal.id === goalId) ?? focusGoals[0];
  const areaOptions = selectedGoal?.areas ?? ['Whole goal'];
  const focusMinutes = focusHours * 60 + focusMins;

  useEffect(() => {
    const first = data?.todayGoals?.[0]?._id;
    if (!goalId && first) setGoalId(first);
  }, [goalId, data]);

  useEffect(() => {
    if (!areaOptions.includes(studyArea)) setStudyArea(areaOptions[0]);
  }, [areaOptions, studyArea]);

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor={navy} translucent={true} />
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            <Text style={styles.headerTitle} numberOfLines={1}>Learning Dashboard</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <View style={styles.shortcutBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutRow}>
          <TouchableOpacity style={[styles.shortcut, styles.shortcutActive]} onPress={() => stack?.navigate('ChatPod')}>
            <View style={styles.liveDot} />
            <Text style={styles.shortcutActiveText}>Chat Pod</Text>
            {(data?.header.unreadChat ?? 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{data?.header.unreadChat} New</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => stack?.navigate('StudyTaskTracker')}>
            <SvgCalendar size={14} color={navy} />
            <Text style={styles.shortcutText}>My Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => stack?.navigate('StudyMaterials')}>
            <SvgFileText size={14} color={navy} />
            <Text style={styles.shortcutText}>Study Materials</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shortcut} onPress={() => stack?.navigate('Assessments')}>
            <SvgClipboard size={14} color={navy} />
            <Text style={styles.shortcutText}>Assessments</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
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
            <TouchableOpacity style={[styles.card, styles.todayCard]} activeOpacity={0.9} onPress={() => stack?.navigate('StudyTaskTracker')}>
              <View style={styles.todayRow}>
                <View>
                  <Text style={styles.cardTitle}>Today</Text>
                  <Text style={styles.todayValue}>{todayHours}h</Text>
                  <Text style={styles.goalMeta}>{week?.hoursDone ?? 0}h of {week?.hoursGoal ?? 20}h this week</Text>
                </View>
                <View style={styles.chart}>
                  {(week?.days ?? []).map((day, index) => (
                    <View key={`${day.day}-${index}`} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { height: `${day.hours ? Math.max(8, (day.hours / maxHours) * 100) : 0}%` }]} />
                      </View>
                      <Text style={[styles.barLabel, index === todayIndex && styles.barLabelToday]}>{day.day}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.weekPercent}>{week?.percent ?? 0}% of the weekly goal</Text>
            </TouchableOpacity>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Focus</Text>
              <Text style={styles.goalMeta}>The study area follows the goal you pick. Set any length.</Text>
              <MenuField
                label="Goal"
                value={selectedGoal?.title || 'Choose a goal'}
                options={focusGoals.map((goal) => ({ key: goal.id, label: goal.title }))}
                onSelect={(id) => {
                  setGoalId(id);
                  const next = focusGoals.find((goal) => goal.id === id);
                  setStudyArea(next?.areas[0] || 'Whole goal');
                }}
              />
              <MenuField
                label="Study area"
                value={studyArea || 'Choose an area'}
                options={areaOptions.map((area) => ({ key: area, label: area }))}
                onSelect={setStudyArea}
              />
              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <MenuField
                    label="Hours"
                    value={HOUR_OPTIONS.find((item) => item.key === String(focusHours))?.label || '0 hours'}
                    options={HOUR_OPTIONS}
                    onSelect={(key) => setFocusHours(Number(key))}
                  />
                </View>
                <View style={styles.timeField}>
                  <MenuField
                    label="Minutes"
                    value={MINUTE_OPTIONS.find((item) => item.key === String(focusMins))?.label || '0 min'}
                    options={MINUTE_OPTIONS}
                    onSelect={(key) => setFocusMins(Number(key))}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={[styles.focusStart, focusMinutes < 1 && styles.focusStartOff]}
                disabled={!selectedGoal || focusMinutes < 1}
                onPress={() => setFocusOn(true)}
              >
                <Text style={styles.focusStartText}>Start {focusMinutes} min</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>Today's Goals</Text>
                <TouchableOpacity onPress={() => stack?.navigate('StudyTaskTracker')}>
                  <Text style={styles.viewAll}>Open tracker</Text>
                </TouchableOpacity>
              </View>
              {(data?.todayGoals ?? []).map((goal) => (
                <View key={goal._id} style={styles.goalRow}>
                  <TouchableOpacity
                    style={[styles.goalCheck, goal.completed && styles.goalCheckOn]}
                    onPress={async () => {
                      if (goal.kind === 'weekly') {
                        stack?.navigate('StudyTaskTracker');
                        return;
                      }
                      try {
                        await learningRepository.toggleGoal(goal._id);
                        lastLoad.current = 0;
                        load();
                      } catch {
                        setError('Could not update this goal. Check your connection.');
                      }
                    }}
                  >
                    {goal.completed ? <SvgCheck size={12} color={navy} strokeWidth={3} /> : null}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.goalCopy}
                    onPress={() => {
                      if (goal.kind === 'weekly') stack?.navigate('StudyTaskTracker');
                      else stack?.navigate('GoalDetail', { goalId: goal._id });
                    }}
                  >
                    <Text style={styles.goalTitle}>{goal.moduleCode ? `${goal.moduleCode} · ` : ''}{goal.title}</Text>
                    <Text style={styles.goalMeta}>{goal.priority ? `${goal.priority} · ` : ''}{goal.dueLabel}</Text>
                    {typeof goal.progress === 'number' ? (
                      <View style={styles.goalTrack}><View style={[styles.goalFill, { width: `${Math.min(100, goal.progress)}%` }]} /></View>
                    ) : null}
                  </TouchableOpacity>
                  <Text style={styles.goalProgress}>{goal.progress ?? Math.round((goal.current / Math.max(goal.total, 1)) * 100)}%</Text>
                  <TouchableOpacity
                    style={styles.focusMini}
                    onPress={() => {
                      setGoalId(goal._id);
                      setStudyArea(goal.areas?.[0] || 'Whole goal');
                      setFocusOn(true);
                    }}
                  >
                    <Text style={styles.focusMiniText}>Focus</Text>
                  </TouchableOpacity>
                </View>
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
                  <View style={styles.continueRow}>
                    <SvgPlay size={14} color={navy} />
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
      <FocusSession
        visible={focusOn}
        areas={selectedGoal ? [{ id: selectedGoal.id, title: selectedGoal.title, code: selectedGoal.code }] : []}
        areaId={selectedGoal?.id || ''}
        minutes={Math.max(1, focusMinutes)}
        studyArea={studyArea}
        onClose={() => setFocusOn(false)}
        onSaved={() => { lastLoad.current = 0; load(); }}
      />
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
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
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
  shortcutBar: {
    backgroundColor: ice,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 20,
  },
  shortcut: {
    height: 40,
    borderRadius: 22,
    backgroundColor: secondaryBlue,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  shortcutActive: { backgroundColor: yellow },
  shortcutText: { color: navy, fontSize: 13, fontWeight: '800' },
  shortcutActiveText: { color: navy, fontSize: 13, fontWeight: '900' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: live },
  badge: { backgroundColor: navy, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  body: { padding: 14, gap: 10 },
  card: {
    backgroundColor: card, borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: '#E6EAF2',
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: ink, fontSize: 16, fontWeight: '900' },
  todayCard: { paddingVertical: 10 },
  todayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  todayValue: { color: ink, fontSize: 22, fontWeight: '900', marginTop: 2 },
  menuField: { marginTop: 8 },
  menuLabel: { color: muted, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  menu: {
    minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: '#E6EAF2',
    paddingLeft: 12, paddingRight: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC',
  },
  menuValue: { flex: 1, color: ink, fontWeight: '700' },
  menuCaret: { color: navy, fontSize: 14, fontWeight: '800' },
  menuBackdrop: { flex: 1, backgroundColor: 'rgba(6,30,71,0.35)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 16, paddingBottom: 28 },
  menuSheetTitle: { color: ink, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  menuList: { maxHeight: 320 },
  menuOption: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuOptionText: { color: '#334155', fontSize: 15 },
  menuOptionOn: { color: navy, fontWeight: '800' },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeField: { flex: 1 },
  focusStart: { backgroundColor: yellow, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  focusStartOff: { opacity: 0.45 },
  focusStartText: { color: navy, fontWeight: '800' },
  focusMini: { marginLeft: 8, backgroundColor: navy, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 6 },
  focusMiniText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  hoursTotal: { color: muted, fontSize: 12, fontWeight: '700' },
  chart: { height: 46, flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  barTrack: { width: 8, height: 28, borderRadius: 6, backgroundColor: '#EEF2F7', justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: yellow, borderRadius: 6 },
  barLabel: { color: muted, fontSize: 10, fontWeight: '700', marginTop: 4 },
  barLabelToday: { color: ink, fontWeight: '900' },
  weekPercent: { color: ink, fontSize: 12, fontWeight: '700', marginTop: 8 },
  goalRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F0F3F8' },
  goalCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#D5DCE8',
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  goalCheckOn: { backgroundColor: yellow, borderColor: yellow },
  goalCopy: { flex: 1, minWidth: 0 },
  goalTitle: { color: ink, fontSize: 14, fontWeight: '800' },
  goalMeta: { color: muted, fontSize: 12, marginTop: 3 },
  goalProgress: { color: muted, fontSize: 11, fontWeight: '700' },
  goalTrack: { height: 6, backgroundColor: '#E7EDF6', borderRadius: 6, marginTop: 8 },
  goalFill: { height: 6, backgroundColor: yellow, borderRadius: 6 },
  moduleCode: { color: ink, fontSize: 15, fontWeight: '900' },
  topic: { color: ink, fontSize: 13, fontWeight: '700', marginTop: 4 },
  yellowBtn: { backgroundColor: yellow, borderRadius: 16, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  yellowBtnText: { color: navy, fontSize: 15, fontWeight: '900' },
  continueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  navyBtn: { backgroundColor: yellow, borderRadius: 14, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  navyBtnText: { color: navy, fontSize: 14, fontWeight: '900' },
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
  state: { padding: 40, alignItems: 'center' },
  stateText: { color: muted, marginTop: 8 },
  stateTitle: { color: ink, fontWeight: '800' },
});

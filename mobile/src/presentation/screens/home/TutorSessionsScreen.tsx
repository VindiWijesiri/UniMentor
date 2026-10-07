import React, { useState, useCallback, useEffect } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../domain/stores/authStore';
import {
  tutorSlotRepository,
  parseTimeToMinutes,
  normalizeDateKey,
} from '../../../data/repositories/tutorSlotRepository';
import type { TutorSlot } from '../../../domain/entities/TutorSlot';

type SessionTab = 'upcoming' | 'today' | 'pods' | 'completed';

interface SessionAttendee {
  id: string;
  name: string;
  email: string;
  avatar: string;
  notes?: string;
  attendance: 'confirmed' | 'attended' | 'absent';
}

interface TutorSessionItem {
  id: string;
  title: string;
  moduleCode: string;
  moduleName: string;
  type: '1-on-1' | 'pod' | 'kuppiya';
  groupName?: string;
  date: string;
  timeRange: string;
  isToday: boolean;
  isLiveNow?: boolean;
  mode: 'Online' | 'In-Person';
  location: string;
  feePerStudent: number;
  totalEarnings: number;
  status: 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
  attendees: SessionAttendee[];
  agenda: string;
}

const INITIAL_SESSIONS: TutorSessionItem[] = [];

function isSlotDateToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const lower = dateStr.toLowerCase().trim();
  if (lower.includes('today')) return true;

  const now = new Date();
  const dNum = now.getDate();
  const mShort = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const mLong = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();

  const hasMonth = lower.includes(mShort) || lower.includes(mLong);
  const dStr1 = String(dNum);
  const dStr2 = dNum < 10 ? `0${dNum}` : String(dNum);
  const hasDay =
    lower.includes(` ${dStr1} `) ||
    lower.includes(` ${dStr1},`) ||
    lower.includes(`${dStr1} `) ||
    lower.includes(` ${dStr2} `) ||
    lower.includes(` ${dStr2},`) ||
    lower.includes(`${dStr2} `);

  return hasMonth && hasDay;
}

function checkSessionJoinEligibility(session: TutorSessionItem): {
  canJoinDirectly: boolean;
  statusLabel: string;
  reason: string;
} {
  if (session.isLiveNow) {
    return {
      canJoinDirectly: true,
      statusLabel: 'Live Now',
      reason: 'This session is currently active and broadcasting live.',
    };
  }

  const isToday = isSlotDateToday(session.date);
  const timeStr = session.timeRange || '';
  const parts = timeStr.split('-');
  const startStr = parts[0]?.trim();
  const endStr = parts[1]?.trim();

  const startMins = parseTimeToMinutes(startStr);
  const endMins = parseTimeToMinutes(endStr);

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  if (isToday && startMins !== null && endMins !== null) {
    if (currentMins >= startMins - 15 && currentMins <= endMins + 30) {
      return {
        canJoinDirectly: true,
        statusLabel: 'Active Time Window',
        reason: 'Session room is active right now (opens 15 min before scheduled start).',
      };
    } else if (currentMins < startMins - 15) {
      const minsLeft = startMins - 15 - currentMins;
      return {
        canJoinDirectly: false,
        statusLabel: 'Upcoming Today',
        reason: `Session is scheduled for today at ${startStr}. Room opens 15 minutes before (${minsLeft} minutes remaining).`,
      };
    } else {
      return {
        canJoinDirectly: false,
        statusLabel: 'Past Scheduled Window',
        reason: `The scheduled time window for this session has already passed today (${session.timeRange}).`,
      };
    }
  }

  return {
    canJoinDirectly: false,
    statusLabel: 'Upcoming Scheduled',
    reason: `This session is scheduled for ${session.date} (${session.timeRange}).`,
  };
}

function transformSlotToSessionItem(slot: TutorSlot): TutorSessionItem {
  const isToday = isSlotDateToday(slot.date);
  const startMins = parseTimeToMinutes(slot.startTime);
  const endMins = parseTimeToMinutes(slot.endTime);
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  let isTimeActive = false;
  if (isToday && startMins !== null && endMins !== null) {
    isTimeActive = currentMins >= startMins - 15 && currentMins <= endMins + 30;
  }

  const attendees: SessionAttendee[] = (slot.registeredAttendees || []).map((ra, idx) => ({
    id: ra.id || `att-${idx}`,
    name: ra.studentName || 'Student Attendee',
    email: ra.studentEmail || 'student@my.sliit.lk',
    avatar:
      ra.faceVerificationPhoto ||
      ra.studentAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    notes: ra.notes,
    attendance: ra.status === 'attended' ? 'attended' : 'confirmed',
  }));

  let sessionType: '1-on-1' | 'pod' | 'kuppiya' = 'pod';
  if (slot.type === '1-on-1') sessionType = '1-on-1';
  else if (slot.type === 'group') sessionType = 'pod';

  const earnings = (attendees.length || slot.bookedCount || 0) * (slot.fee || 2000);

  return {
    id: slot.id,
    title: slot.title || `${slot.module} Mentoring`,
    moduleCode: slot.module?.includes('IT') ? slot.module.split(' ')[0] : 'IT2040',
    moduleName: slot.module || 'Computing Module',
    type: sessionType,
    groupName: slot.targetBatch || (slot.type === 'group' ? 'Revision Pod' : undefined),
    date: slot.date,
    timeRange: slot.timeRange || `${slot.startTime} - ${slot.endTime}`,
    isToday,
    isLiveNow: isTimeActive,
    mode: slot.mode === 'In-Person' ? 'In-Person' : 'Online',
    location: slot.location || 'UniMentor Live Room • Online',
    feePerStudent: slot.fee ?? 2000,
    totalEarnings: earnings,
    status: isTimeActive ? 'in-progress' : 'upcoming',
    attendees,
    agenda: slot.description || slot.prerequisites || 'Comprehensive peer mentoring session.',
  };
}

export default function TutorSessionsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const currentUser = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming');
  const [sessions, setSessions] = useState<TutorSessionItem[]>(INITIAL_SESSIONS);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSessionForRoster, setSelectedSessionForRoster] = useState<TutorSessionItem | null>(null);
  const [liveRoomModalSession, setLiveRoomModalSession] = useState<TutorSessionItem | null>(null);
  const [confirmJoinModalSession, setConfirmJoinModalSession] = useState<TutorSessionItem | null>(null);

  // New instant session modal
  const [createInstantModalVisible, setCreateInstantModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newModule, setNewModule] = useState('Data Structures & Algorithms');
  const [newMode, setNewMode] = useState<'Online' | 'In-Person'>('Online');
  const [newDuration, setNewDuration] = useState('60 Mins');

  const loadTutorSessions = useCallback(async () => {
    try {
      const slots = await tutorSlotRepository.getAllSlots(currentUser?.id, currentUser?.name);
      const convertedSlots = slots.map(transformSlotToSessionItem);

      setSessions((prev) => {
        const existingSlotIds = new Set(convertedSlots.map((s) => s.id));
        const remainingInitial = prev.filter((p) => !existingSlotIds.has(p.id));
        return [...convertedSlots, ...remainingInitial];
      });
    } catch (err) {
      console.log('[TutorSessionsScreen] Error loading slots:', err);
    }
  }, [currentUser]);

  useEffect(() => {
    loadTutorSessions();
    const unsubscribe = tutorSlotRepository.subscribe(() => {
      loadTutorSessions();
    });
    return () => {
      unsubscribe();
    };
  }, [loadTutorSessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTutorSessions();
    setRefreshing(false);
  };

  const handleJoinSessionPress = (session: TutorSessionItem) => {
    const eligibility = checkSessionJoinEligibility(session);

    if (eligibility.canJoinDirectly) {
      setConfirmJoinModalSession(session);
    } else {
      Alert.alert(
        'Session Time Check',
        `${eligibility.reason}\n\nAs the host tutor, would you like to launch and open this meeting early right now?`,
        [
          {
            text: 'Launch Meeting Now',
            onPress: () => {
              const liveSession = { ...session, isLiveNow: true, status: 'in-progress' as const };
              setSessions((prev) =>
                prev.map((s) => (s.id === session.id ? liveSession : s))
              );
              setConfirmJoinModalSession(liveSession);
            },
          },
          {
            text: 'Wait for Scheduled Time',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleConfirmEnterLiveRoom = () => {
    if (!confirmJoinModalSession) return;
    const targetSession = confirmJoinModalSession;
    setConfirmJoinModalSession(null);
    navigation.navigate('LiveSessionRoom', { session: targetSession });
  };

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === 'today') return s.isToday || s.isLiveNow;
    if (activeTab === 'pods') return s.type === 'pod' || s.type === 'kuppiya';
    if (activeTab === 'completed') return s.status === 'completed';
    return s.status === 'upcoming' || s.status === 'in-progress';
  });

  const totalEarningsAll = sessions.reduce((acc, s) => acc + s.totalEarnings, 0);
  const totalStudentsCount = sessions.reduce((acc, s) => acc + s.attendees.length, 0);
  const upcomingCount = sessions.filter((s) => s.status === 'upcoming' || s.status === 'in-progress').length;

  const handleToggleAttendance = (sessionId: string, attendeeId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          attendees: s.attendees.map((a) => {
            if (a.id !== attendeeId) return a;
            const nextStatus = a.attendance === 'attended' ? 'confirmed' : 'attended';
            return { ...a, attendance: nextStatus };
          }),
        };
      })
    );
    if (selectedSessionForRoster && selectedSessionForRoster.id === sessionId) {
      setSelectedSessionForRoster((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          attendees: prev.attendees.map((a) => {
            if (a.id !== attendeeId) return a;
            const nextStatus = a.attendance === 'attended' ? 'confirmed' : 'attended';
            return { ...a, attendance: nextStatus };
          }),
        };
      });
    }
  };

  const handleCreateInstantSession = () => {
    if (!newTitle.trim()) {
      Alert.alert('Session Title Required', 'Please enter a title for this instant session.');
      return;
    }
    const newSession: TutorSessionItem = {
      id: `sess-${Date.now()}`,
      title: newTitle.trim(),
      moduleCode: 'IT-EXP',
      moduleName: newModule,
      type: 'pod',
      groupName: 'Live Kuppiya Room',
      date: 'Today',
      timeRange: 'Starting Now • 60 Mins',
      isToday: true,
      isLiveNow: true,
      mode: newMode,
      location: newMode === 'Online' ? 'UniMentor Live Room • Instant Hall' : 'Computing Lab 304',
      feePerStudent: 1500,
      totalEarnings: 1500,
      status: 'in-progress',
      agenda: 'Immediate open peer mentoring and problem-solving session.',
      attendees: [
        {
          id: `att-demo-${Date.now()}`,
          name: 'Nethmi Silva',
          email: 'nethmi.silva@student.unimentor.lk',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          attendance: 'confirmed',
          notes: 'Joined immediate Kuppiya room.',
        },
      ],
    };
    setSessions((prev) => [newSession, ...prev]);
    setCreateInstantModalVisible(false);
    setNewTitle('');
    setConfirmJoinModalSession(newSession);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Top Header Bar (Matching Student Dashboard Style) */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Mentoring Sessions</Text>
            <View style={styles.headerRolePill}>
              <View style={styles.greenPulseDot} />
              <Text style={styles.headerRoleText}>TUTOR SESSIONS HUB</Text>
            </View>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#061E47" />}
      >
        {/* Metric Cards Bar */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar" size={16} color="#1D4ED8" />
            </View>
            <Text style={styles.statVal}>{upcomingCount}</Text>
            <Text style={styles.statLbl}>Active</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people" size={16} color="#059669" />
            </View>
            <Text style={[styles.statVal, { color: '#059669' }]}>{totalStudentsCount}</Text>
            <Text style={styles.statLbl}>Students</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="wallet" size={16} color="#D97706" />
            </View>
            <Text style={[styles.statVal, { color: '#D97706' }]}>
              {totalEarningsAll >= 1000 ? `${(totalEarningsAll / 1000).toFixed(1)}k` : totalEarningsAll}
            </Text>
            <Text style={styles.statLbl}>LKR Earned</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <View style={[styles.statIconWrap, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="time" size={16} color="#DB2777" />
            </View>
            <Text style={[styles.statVal, { color: '#DB2777' }]}>16.5h</Text>
            <Text style={styles.statLbl}>Hours</Text>
          </View>
        </View>

        {/* Quick Launch Any Meeting Banner */}
        <TouchableOpacity
          style={styles.instantHeroCard}
          activeOpacity={0.88}
          onPress={() => setCreateInstantModalVisible(true)}
        >
          <View style={styles.instantHeroLeft}>
            <View style={styles.instantHeroIcon}>
              <Ionicons name="videocam" size={20} color="#061E47" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instantHeroTitle}>Launch Any Meeting / Instant Kuppiya</Text>
              <Text style={styles.instantHeroSub}>Host an immediate live room or peer session anytime</Text>
            </View>
          </View>
          <View style={styles.instantHeroBtn}>
            <Text style={styles.instantHeroBtnText}>+ Launch Now</Text>
          </View>
        </TouchableOpacity>

        {/* Filter Navigation Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upcoming')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'upcoming' && styles.tabBtnTextActive]}>
              Upcoming ({upcomingCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'today' && styles.tabBtnActive]}
            onPress={() => setActiveTab('today')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={styles.liveDot} />
              <Text style={[styles.tabBtnText, activeTab === 'today' && styles.tabBtnTextActive]}>
                Today / Live
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pods' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pods')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'pods' && styles.tabBtnTextActive]}>
              Study Pods
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'completed' && styles.tabBtnTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-clear-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Sessions In This View</Text>
            <Text style={styles.emptySub}>
              You have no active sessions for this filter. Bookings from students appear here automatically.
            </Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              {/* Card Header */}
              <View style={styles.sessionCardHeader}>
                <View style={styles.sessionTypeWrap}>
                  <View
                    style={[
                      styles.typeBadge,
                      session.type === 'pod'
                        ? { backgroundColor: '#EFF6FF' }
                        : session.type === 'kuppiya'
                        ? { backgroundColor: '#FEF3C7' }
                        : { backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <Ionicons
                      name={
                        session.type === 'pod'
                          ? 'people'
                          : session.type === 'kuppiya'
                          ? 'flash'
                          : 'person'
                      }
                      size={12}
                      color={
                        session.type === 'pod'
                          ? '#1D4ED8'
                          : session.type === 'kuppiya'
                          ? '#D97706'
                          : '#059669'
                      }
                    />
                    <Text
                      style={[
                        styles.typeBadgeText,
                        session.type === 'pod'
                          ? { color: '#1D4ED8' }
                          : session.type === 'kuppiya'
                          ? { color: '#D97706' }
                          : { color: '#059669' },
                      ]}
                    >
                      {session.groupName ? session.groupName : session.type.toUpperCase()}
                    </Text>
                  </View>

                  {(() => {
                    const elig = checkSessionJoinEligibility(session);
                    if (session.isLiveNow || elig.canJoinDirectly) {
                      return (
                        <View style={styles.liveNowPill}>
                          <View style={styles.livePulseDot} />
                          <Text style={styles.liveNowPillText}>LIVE NOW</Text>
                        </View>
                      );
                    }
                    return (
                      <View style={styles.upcomingPill}>
                        <Ionicons name="time-outline" size={10} color="#0D4F9E" />
                        <Text style={styles.upcomingPillText}>UPCOMING</Text>
                      </View>
                    );
                  })()}
                </View>

                <View style={styles.feeBadge}>
                  <Text style={styles.feeBadgeText}>LKR {session.totalEarnings.toLocaleString()}</Text>
                </View>
              </View>

              {/* Title & Module */}
              <Text style={styles.sessionTitle}>{session.title}</Text>
              <Text style={styles.moduleCodeText}>
                {session.moduleCode} • {session.moduleName}
              </Text>

              {/* Date & Time Row */}
              <View style={styles.infoMetaRow}>
                <View style={styles.infoMetaItem}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={styles.infoMetaText}>{session.timeRange}</Text>
                </View>

                <View style={styles.infoMetaItem}>
                  <Ionicons name="calendar-outline" size={14} color="#64748B" />
                  <Text style={styles.infoMetaText}>{session.date}</Text>
                </View>

                <View style={styles.infoMetaItem}>
                  <Ionicons
                    name={session.mode === 'Online' ? 'videocam-outline' : 'business-outline'}
                    size={14}
                    color="#64748B"
                  />
                  <Text style={styles.infoMetaText}>{session.mode}</Text>
                </View>
              </View>

              {/* Location Badge */}
              <View style={styles.locationBox}>
                <Ionicons name="location-outline" size={13} color="#0D4F9E" />
                <Text style={styles.locationBoxText} numberOfLines={1}>
                  {session.location}
                </Text>
              </View>

              {/* Agenda description */}
              {!!session.agenda && (
                <Text style={styles.agendaDesc} numberOfLines={2}>
                  {session.agenda}
                </Text>
              )}

              {/* Attendees Preview Row */}
              <View style={styles.attendeesPreviewRow}>
                <View style={styles.attendeePill}>
                  <Ionicons name="people-outline" size={13} color="#061E47" />
                  <Text style={styles.attendeePillText}>
                    {session.attendees.length} Student{session.attendees.length === 1 ? '' : 's'} Registered
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewRosterBtn}
                  onPress={() => setSelectedSessionForRoster(session)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewRosterBtnText}>View Roster ({session.attendees.length}) ➔</Text>
                </TouchableOpacity>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                {session.status !== 'completed' ? (
                  <TouchableOpacity
                    style={[
                      styles.primaryActionBtn,
                      (session.isLiveNow || checkSessionJoinEligibility(session).canJoinDirectly)
                        ? styles.liveActionBtn
                        : styles.upcomingActionBtn,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => handleJoinSessionPress(session)}
                  >
                    <Ionicons
                      name={session.mode === 'Online' ? 'videocam' : 'enter'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryActionBtnText}>
                      {session.isLiveNow || checkSessionJoinEligibility(session).canJoinDirectly
                        ? 'Join Live Room'
                        : 'Join Session (Scheduled)'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedBadgeWrap}>
                    <Ionicons name="checkmark-done" size={15} color="#059669" />
                    <Text style={styles.completedBadgeText}>Session Completed & Logged</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.secondaryActionBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    Alert.alert(
                      'Session Options',
                      `Manage "${session.title}"`,
                      [
                        {
                          text: 'Launch Meeting Now (Host Early Access)',
                          onPress: () => {
                            const liveSession = { ...session, isLiveNow: true, status: 'in-progress' as const };
                            setSessions((prev) =>
                              prev.map((s) => (s.id === session.id ? liveSession : s))
                            );
                            setConfirmJoinModalSession(liveSession);
                          },
                        },
                        {
                          text: 'Message All Students',
                          onPress: () => Alert.alert('Chat Notice', 'Broadcast notice sent to registered pod members.'),
                        },
                        {
                          text: 'Share Meeting Link',
                          onPress: () => Alert.alert('Link Copied', `${session.location} copied to clipboard.`),
                        },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* ================= ROSTER & ATTENDANCE MODAL ================= */}
      <Modal
        visible={!!selectedSessionForRoster}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedSessionForRoster(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Session Roster & Attendance</Text>
                <Text style={styles.sheetSub} numberOfLines={1}>
                  {selectedSessionForRoster?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedSessionForRoster(null)}
                style={styles.closeCircleBtn}
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {selectedSessionForRoster?.attendees.map((attendee) => (
                <View key={attendee.id} style={styles.rosterItemCard}>
                  <View style={styles.rosterItemTop}>
                    <View style={styles.rosterAvatar}>
                      <Ionicons name="person" size={18} color="#061E47" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.rosterStudentName}>{attendee.name}</Text>
                      <Text style={styles.rosterStudentEmail}>{attendee.email}</Text>
                      {!!attendee.notes && (
                        <View style={styles.studentNoteBox}>
                          <Text style={styles.studentNoteText}>“{attendee.notes}”</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.rosterAttendanceRow}>
                    <TouchableOpacity
                      style={[
                        styles.attendancePillBtn,
                        attendee.attendance === 'attended' && styles.attendancePillBtnActive,
                      ]}
                      onPress={() =>
                        selectedSessionForRoster &&
                        handleToggleAttendance(selectedSessionForRoster.id, attendee.id)
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={attendee.attendance === 'attended' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                        size={15}
                        color={attendee.attendance === 'attended' ? '#FFFFFF' : '#059669'}
                      />
                      <Text
                        style={[
                          styles.attendancePillBtnText,
                          attendee.attendance === 'attended' && styles.attendancePillBtnTextActive,
                        ]}
                      >
                        {attendee.attendance === 'attended' ? 'Marked Attended' : 'Mark Attended'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.messageStudentBtn}
                      onPress={() => {
                        Alert.alert('Message Sent', `Notification opened for ${attendee.name}`);
                      }}
                    >
                      <Text style={styles.messageStudentBtnText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneSheetBtn}
              onPress={() => setSelectedSessionForRoster(null)}
            >
              <Text style={styles.doneSheetBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= PRE-JOIN CONFIRMATION OVERLAY MODAL ================= */}
      <Modal
        visible={!!confirmJoinModalSession}
        animationType="fade"
        transparent
        onRequestClose={() => setConfirmJoinModalSession(null)}
      >
        <View style={styles.confirmJoinOverlay}>
          <View style={styles.confirmJoinCard}>
            <View style={styles.confirmJoinHeader}>
              <View style={styles.confirmHostBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" />
                <Text style={styles.confirmHostBadgeText}>HOST ACCESS VERIFIED</Text>
              </View>
              <TouchableOpacity
                onPress={() => setConfirmJoinModalSession(null)}
                style={styles.confirmCloseCircle}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.confirmJoinTitle}>Confirm Join Session</Text>
            <Text style={styles.confirmJoinSub}>
              You are about to launch and enter this session room as the lead tutor.
            </Text>

            <View style={styles.confirmDetailsBox}>
              <Text style={styles.confirmSessionName} numberOfLines={2}>
                {confirmJoinModalSession?.title}
              </Text>
              <Text style={styles.confirmSessionModule}>
                {confirmJoinModalSession?.moduleCode} • {confirmJoinModalSession?.moduleName}
              </Text>

              <View style={styles.confirmMetaRow}>
                <View style={styles.confirmMetaItem}>
                  <Ionicons name="time-outline" size={13} color="#64748B" />
                  <Text style={styles.confirmMetaText}>{confirmJoinModalSession?.timeRange}</Text>
                </View>
                <View style={styles.confirmMetaItem}>
                  <Ionicons name="calendar-outline" size={13} color="#64748B" />
                  <Text style={styles.confirmMetaText}>{confirmJoinModalSession?.date}</Text>
                </View>
              </View>

              <View style={styles.confirmLocationRow}>
                <Ionicons
                  name={confirmJoinModalSession?.mode === 'Online' ? 'videocam' : 'location'}
                  size={13}
                  color="#0D4F9E"
                />
                <Text style={styles.confirmLocationText} numberOfLines={1}>
                  {confirmJoinModalSession?.location}
                </Text>
              </View>
            </View>

            <View style={styles.preflightBox}>
              <View style={styles.preflightItem}>
                <Ionicons name="mic-outline" size={14} color="#059669" />
                <Text style={styles.preflightText}>Microphone ready</Text>
              </View>
              <View style={styles.preflightItem}>
                <Ionicons name="videocam-outline" size={14} color="#059669" />
                <Text style={styles.preflightText}>HD Camera ready</Text>
              </View>
              <View style={styles.preflightItem}>
                <Ionicons name="people-outline" size={14} color="#059669" />
                <Text style={styles.preflightText}>
                  {confirmJoinModalSession?.attendees.length || 0} student(s) registered
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.confirmEnterBtn}
              onPress={handleConfirmEnterLiveRoom}
              activeOpacity={0.88}
            >
              <Ionicons name="videocam" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.confirmEnterBtnText}>Confirm & Enter Live Room</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmCancelBtn}
              onPress={() => setConfirmJoinModalSession(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.confirmCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= CREATE INSTANT KUPPIYA MODAL ================= */}
      <Modal
        visible={createInstantModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateInstantModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Launch Instant Kuppiya</Text>
            <Text style={styles.sheetSub}>
              Instantly create a broadcast session for students requesting academic help right now.
            </Text>

            <Text style={styles.inputLabel}>Session Topic / Title</Text>
            <TextInput
              style={styles.modalInput}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. Quick Midterm Probability Review"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Module</Text>
            <TextInput
              style={styles.modalInput}
              value={newModule}
              onChangeText={setNewModule}
              placeholder="e.g. Data Structures & Algorithms"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Session Mode</Text>
            <View style={styles.modeToggleRow}>
              {(['Online', 'In-Person'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeToggleBtn, newMode === m && styles.modeToggleBtnActive]}
                  onPress={() => setNewMode(m)}
                >
                  <Text style={[styles.modeToggleText, newMode === m && styles.modeToggleTextActive]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createSessionBtn} onPress={handleCreateInstantSession}>
              <Text style={styles.createSessionBtnText}>Broadcast & Open Kuppiya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setCreateInstantModalVisible(false)}
            >
              <Text style={styles.cancelModalBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },
  headerBar: {
    backgroundColor: '#061E47',
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
  headerRolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  greenPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  headerRoleText: {
    color: '#EAA023',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
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
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061E47',
  },
  statLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#F1F5F9',
  },
  instantHeroCard: {
    backgroundColor: '#061E47',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#EAA023',
  },
  instantHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  instantHeroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAA023',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instantHeroTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  instantHeroSub: {
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  instantHeroBtn: {
    backgroundColor: '#EAA023',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  instantHeroBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTypeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  liveNowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveNowPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#EF4444',
  },
  feeBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  moduleCodeText: {
    fontSize: 12,
    color: '#0D4F9E',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 8,
  },
  infoMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  infoMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  locationBoxText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  agendaDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  attendeesPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginBottom: 10,
  },
  attendeePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  attendeePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#061E47',
  },
  viewRosterBtn: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  viewRosterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D4F9E',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#061E47',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  liveActionBtn: {
    backgroundColor: '#EF4444',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  completedBadgeWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  secondaryActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeCircleBtn: {
    padding: 4,
  },
  rosterItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rosterItemTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rosterAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterStudentName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  rosterStudentEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  studentNoteBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentNoteText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
  },
  rosterAttendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attendancePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  attendancePillBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  attendancePillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  attendancePillBtnTextActive: {
    color: '#FFFFFF',
  },
  messageStudentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  messageStudentBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  doneSheetBtn: {
    backgroundColor: '#061E47',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  doneSheetBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  upcomingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  upcomingPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  upcomingActionBtn: {
    backgroundColor: '#061E47',
  },
  confirmJoinOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmJoinCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  confirmJoinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmHostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  confirmHostBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.4,
  },
  confirmCloseCircle: {
    padding: 4,
  },
  confirmJoinTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  confirmJoinSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 17,
    marginBottom: 16,
  },
  confirmDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  confirmSessionName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  confirmSessionModule: {
    fontSize: 12,
    color: '#0D4F9E',
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 10,
  },
  confirmMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  confirmMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confirmMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  confirmLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  confirmLocationText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  preflightBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
    gap: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  preflightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  preflightText: {
    fontSize: 11.5,
    color: '#166534',
    fontWeight: '600',
  },
  confirmEnterBtn: {
    backgroundColor: '#061E47',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#061E47',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmEnterBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  confirmCancelBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  confirmCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeToggleBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modeToggleBtnActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeToggleTextActive: {
    color: '#FFFFFF',
  },
  createSessionBtn: {
    backgroundColor: '#EAA023',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  createSessionBtnText: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelModalBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});

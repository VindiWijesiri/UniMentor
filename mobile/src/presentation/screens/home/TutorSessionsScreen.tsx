import React, { useState } from 'react';
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

const INITIAL_SESSIONS: TutorSessionItem[] = [
  {
    id: 'sess-1',
    title: 'Graph Traversals: BFS vs DFS & Cycle Detection',
    moduleCode: 'IT2040',
    moduleName: 'Data Structures & Algorithms',
    type: 'pod',
    groupName: 'Algorithms Sprint Pod Alpha',
    date: 'Today',
    timeRange: '02:30 PM - 04:00 PM',
    isToday: true,
    isLiveNow: true,
    mode: 'Online',
    location: 'Microsoft Teams • Room A1',
    feePerStudent: 1500,
    totalEarnings: 6000,
    status: 'in-progress',
    agenda: 'Detailed walkthrough of adjacency lists, BFS queue traversal, recursive DFS and cycle detection in directed graphs.',
    attendees: [
      {
        id: 'att-1',
        name: 'Kavindu Perera',
        email: 'kavindu.p@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        notes: 'Struggling with finding back-edges in directed DFS.',
        attendance: 'confirmed',
      },
      {
        id: 'att-2',
        name: 'Nethmi Silva',
        email: 'nethmi.silva@student.unimentor.lk',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        notes: 'Need clarity on time complexity analysis O(V+E).',
        attendance: 'attended',
      },
      {
        id: 'att-3',
        name: 'Dulitha Bandara',
        email: 'dulitha.b@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        notes: 'Ready with assignment question 3 test cases.',
        attendance: 'confirmed',
      },
      {
        id: 'att-4',
        name: 'Sanduni Fernando',
        email: 'sanduni.f@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
        attendance: 'confirmed',
      },
    ],
  },
  {
    id: 'sess-2',
    title: 'Normalization (1NF to BCNF) & SQL Joins',
    moduleCode: 'IT2030',
    moduleName: 'Database Management Systems',
    type: '1-on-1',
    date: 'Tomorrow, 08 Oct 2026',
    timeRange: '10:00 AM - 11:30 AM',
    isToday: false,
    mode: 'In-Person',
    location: 'Computing Block • Level 4 Lab 402',
    feePerStudent: 2500,
    totalEarnings: 2500,
    status: 'upcoming',
    agenda: 'Deconstruction of anomalous relations into BCNF with dependency preservation and multi-table nested SQL queries.',
    attendees: [
      {
        id: 'att-5',
        name: 'Dineth Jayawardena',
        email: 'dineth.j@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
        notes: 'Need to review functional dependencies for past exam paper 2024.',
        attendance: 'confirmed',
      },
    ],
  },
  {
    id: 'sess-3',
    title: 'React Native Navigation & Global State Architecture',
    moduleCode: 'IT3020',
    moduleName: 'Mobile Application Development',
    type: 'pod',
    groupName: 'Mobile Dev Final Project Pod',
    date: 'Thursday, 09 Oct 2026',
    timeRange: '04:00 PM - 05:30 PM',
    isToday: false,
    mode: 'Online',
    location: 'Zoom Meeting • Passcode: 884210',
    feePerStudent: 2000,
    totalEarnings: 6000,
    status: 'upcoming',
    agenda: 'Architecting Zustand stores with TypeScript and debugging React Navigation deep links on Android devices.',
    attendees: [
      {
        id: 'att-6',
        name: 'Chamath Vihanga',
        email: 'chamath.v@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        notes: 'Stack vs Tab navigation params passing questions.',
        attendance: 'confirmed',
      },
      {
        id: 'att-7',
        name: 'Sachini Wickramasinghe',
        email: 'sachini.w@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        attendance: 'confirmed',
      },
      {
        id: 'att-8',
        name: 'Kusal Mendis',
        email: 'kusal.m@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
        attendance: 'confirmed',
      },
    ],
  },
  {
    id: 'sess-4',
    title: 'Probability Distributions & Central Limit Theorem',
    moduleCode: 'IT2010',
    moduleName: 'Probability & Statistics',
    type: 'kuppiya',
    groupName: 'Midterm Mass Kuppiya Session',
    date: '02 Oct 2026',
    timeRange: '06:00 PM - 08:00 PM',
    isToday: false,
    mode: 'Online',
    location: 'UniMentor Live Room • Hall B',
    feePerStudent: 1000,
    totalEarnings: 15000,
    status: 'completed',
    agenda: 'Covered Poisson, Binomial, and Normal distributions with step-by-step midterm past paper question solving.',
    attendees: [
      {
        id: 'att-9',
        name: 'Akindu Senaratne',
        email: 'akindu.s@my.sliit.lk',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
        attendance: 'attended',
      },
      {
        id: 'att-10',
        name: 'Nethmi Silva',
        email: 'nethmi.silva@student.unimentor.lk',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        attendance: 'attended',
      },
    ],
  },
];

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

  // New instant session modal
  const [createInstantModalVisible, setCreateInstantModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newModule, setNewModule] = useState('Data Structures & Algorithms');
  const [newMode, setNewMode] = useState<'Online' | 'In-Person'>('Online');
  const [newDuration, setNewDuration] = useState('60 Mins');

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
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
      location: newMode === 'Online' ? 'Microsoft Teams • Instant Hall' : 'Computing Lab 304',
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
    Alert.alert('Session Launched Live! 🚀', `Instant Kuppiya "${newTitle}" is open for students.`);
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

        {/* Quick Launch Kuppiya Banner */}
        <TouchableOpacity
          style={styles.instantHeroCard}
          activeOpacity={0.88}
          onPress={() => setCreateInstantModalVisible(true)}
        >
          <View style={styles.instantHeroLeft}>
            <View style={styles.instantHeroIcon}>
              <Ionicons name="flash" size={20} color="#061E47" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instantHeroTitle}>Start Instant Kuppiya</Text>
              <Text style={styles.instantHeroSub}>Launch a live peer session immediately for asking students</Text>
            </View>
          </View>
          <View style={styles.instantHeroBtn}>
            <Text style={styles.instantHeroBtnText}>+ Launch</Text>
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

                  {session.isLiveNow && (
                    <View style={styles.liveNowPill}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveNowPillText}>LIVE NOW</Text>
                    </View>
                  )}
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
                    style={[styles.primaryActionBtn, session.isLiveNow && styles.liveActionBtn]}
                    activeOpacity={0.85}
                    onPress={() => setLiveRoomModalSession(session)}
                  >
                    <Ionicons
                      name={session.mode === 'Online' ? 'videocam' : 'enter'}
                      size={16}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryActionBtnText}>
                      {session.isLiveNow ? 'Enter Live Room' : 'Start Session'}
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
                      <Ionicons name="chatbubble-outline" size={14} color="#0D4F9E" />
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

      {/* ================= LIVE ROOM PREVIEW MODAL ================= */}
      <Modal
        visible={!!liveRoomModalSession}
        animationType="fade"
        transparent
        onRequestClose={() => setLiveRoomModalSession(null)}
      >
        <View style={styles.liveRoomOverlay}>
          <View style={styles.liveRoomCard}>
            <View style={styles.liveRoomHeader}>
              <View style={styles.liveRoomBadge}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveRoomBadgeText}>VIRTUAL KUPPIYA ACTIVE</Text>
              </View>
              <TouchableOpacity onPress={() => setLiveRoomModalSession(null)}>
                <Ionicons name="close-circle" size={26} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.liveRoomTitle}>{liveRoomModalSession?.title}</Text>
            <Text style={styles.liveRoomModule}>
              {liveRoomModalSession?.moduleCode}: {liveRoomModalSession?.moduleName}
            </Text>

            <View style={styles.livePlatformInfo}>
              <Ionicons name="videocam" size={20} color="#EAA023" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.livePlatformTitle}>Platform & Link</Text>
                <Text style={styles.livePlatformLink}>{liveRoomModalSession?.location}</Text>
              </View>
            </View>

            <View style={styles.liveAttendeesSummary}>
              <Text style={styles.liveAttendeesCount}>
                👥 {liveRoomModalSession?.attendees.length} Students in Waiting Room
              </Text>
              <View style={styles.liveAvatarList}>
                {liveRoomModalSession?.attendees.map((a) => (
                  <View key={a.id} style={styles.liveAvatarCircle}>
                    <Text style={styles.liveAvatarInitial}>{a.name.charAt(0)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.launchCallBtn}
              onPress={() => {
                Alert.alert(
                  'Connected to Session! 🎧',
                  `Live virtual session "${liveRoomModalSession?.title}" is broadcasting.`
                );
                setLiveRoomModalSession(null);
              }}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.launchCallBtnText}>Join Virtual Room</Text>
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
  liveRoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  liveRoomCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
  },
  liveRoomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveRoomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveRoomBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  liveRoomTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveRoomModule: {
    fontSize: 12,
    color: '#0D4F9E',
    fontWeight: '700',
    marginTop: 3,
    marginBottom: 14,
  },
  livePlatformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  livePlatformTitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  livePlatformLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  liveAttendeesSummary: {
    marginBottom: 16,
  },
  liveAttendeesCount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  liveAvatarList: {
    flexDirection: 'row',
    gap: 6,
  },
  liveAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAA023',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveAvatarInitial: {
    color: '#061E47',
    fontWeight: '800',
    fontSize: 13,
  },
  launchCallBtn: {
    backgroundColor: '#22C55E',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchCallBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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

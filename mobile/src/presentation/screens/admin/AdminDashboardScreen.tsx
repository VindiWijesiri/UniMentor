import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../domain/stores/authStore';
import {
  SvgCalendar,
  SvgClock,
  SvgFileText,
  SvgUser,
  SvgShieldCheck,
  SvgChevronRight,
  SvgSearch,
  SvgCheck,
} from '../../components/common/SvgIcons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

// Activity item
interface ActivityItem {
  id: string;
  student: string;
  module: string;
  tutor: string;
  time: string;
  status: 'Active' | 'Pending' | 'Completed';
  roomToken?: string;
  auditHash?: string;
}

// Student item
interface RegisteredStudent {
  id: string;
  name: string;
  studentId: string;
  faculty: string;
  degree: string;
  enrolledModules: string[];
  status: 'Active' | 'Inactive';
  initials: string;
}

// Tutor item
interface RegisteredTutor {
  id: string;
  name: string;
  subjects: string[];
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  sessionsCount: number;
  status: 'Verified Approved' | 'Under Review';
  initials: string;
}

// Mentor Scheduled Session
interface MentorScheduledSession {
  id: string;
  mentorName: string;
  studentName: string;
  moduleName: string;
  moduleCode: string;
  scheduledTime: string;
  mode: '1-on-1' | 'Group (3 students)';
  status: 'Confirmed (Live Ready)' | 'Pending Mentor Confirm' | 'Completed';
  roomId: string;
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    student: 'Clara Tan',
    module: 'Database Systems',
    tutor: 'Alex F.',
    time: 'Today 10 AM',
    status: 'Active',
    roomToken: 'ROOM-DB-4091',
    auditHash: 'SHA256: 4f9b8a...12e',
  },
  {
    id: '2',
    student: 'Marco Silva',
    module: 'Algorithms',
    tutor: 'Elena R.',
    time: 'Today 2 PM',
    status: 'Pending',
    roomToken: 'ROOM-ALG-8812',
    auditHash: 'SHA256: 77a01c...99d',
  },
  {
    id: '3',
    student: 'Jonas K.',
    module: 'Computer Networks',
    tutor: 'Sam O.',
    time: 'Yesterday',
    status: 'Completed',
    roomToken: 'ROOM-NET-1049',
    auditHash: 'SHA256: e82b90...44a',
  },
];

const REGISTERED_STUDENTS: RegisteredStudent[] = [
  {
    id: 'stu-1',
    name: 'Kavindi Perera',
    studentId: 'IT21049281',
    faculty: 'Faculty of Computing',
    degree: 'BSc (Hons) in Information Technology',
    enrolledModules: ['IT3020 Mobile App Dev', 'IT2040 Database Systems'],
    status: 'Active',
    initials: 'KP',
  },
  {
    id: 'stu-2',
    name: 'Dimuth Bandara',
    studentId: 'SE21088219',
    faculty: 'Faculty of Computing',
    degree: 'BSc (Hons) in Software Engineering',
    enrolledModules: ['IT2020 Data Structures', 'SE3040 Architecture'],
    status: 'Active',
    initials: 'DB',
  },
  {
    id: 'stu-3',
    name: 'Clara Tan',
    studentId: 'IT21092811',
    faculty: 'Faculty of Computing',
    degree: 'BSc (Hons) in Computer Science',
    enrolledModules: ['IT2040 Database Systems'],
    status: 'Active',
    initials: 'CT',
  },
  {
    id: 'stu-4',
    name: 'Marco Silva',
    studentId: 'IT20984920',
    faculty: 'Faculty of Computing',
    degree: 'BSc (Hons) in Information Technology',
    enrolledModules: ['IT2020 Algorithms & Complexity'],
    status: 'Active',
    initials: 'MS',
  },
  {
    id: 'stu-5',
    name: 'Jonas K.',
    studentId: 'NW20874102',
    faculty: 'Faculty of Computing',
    degree: 'BSc (Hons) in Computer Networks',
    enrolledModules: ['IT3010 Computer Networks'],
    status: 'Active',
    initials: 'JK',
  },
];

const REGISTERED_TUTORS: RegisteredTutor[] = [
  {
    id: 'tut-1',
    name: 'Shenal Perera',
    subjects: ['Mobile App Development', 'React Native'],
    rating: 4.9,
    reviewsCount: 38,
    hourlyRate: 1200,
    sessionsCount: 52,
    status: 'Verified Approved',
    initials: 'SP',
  },
  {
    id: 'tut-2',
    name: 'Alex Ferreira',
    subjects: ['Database Management Systems', 'SQL'],
    rating: 4.9,
    reviewsCount: 42,
    hourlyRate: 1500,
    sessionsCount: 64,
    status: 'Verified Approved',
    initials: 'AF',
  },
  {
    id: 'tut-3',
    name: 'Dr. Elena Rostova',
    subjects: ['Data Structures & Algorithms', 'Complexity Theory'],
    rating: 5.0,
    reviewsCount: 64,
    hourlyRate: 2000,
    sessionsCount: 88,
    status: 'Verified Approved',
    initials: 'ER',
  },
  {
    id: 'tut-4',
    name: 'Sam O.',
    subjects: ['Computer Networks', 'Network Security'],
    rating: 4.8,
    reviewsCount: 29,
    hourlyRate: 1100,
    sessionsCount: 34,
    status: 'Verified Approved',
    initials: 'SO',
  },
];

const MENTOR_SCHEDULED_SESSIONS: MentorScheduledSession[] = [
  {
    id: 'ses-1',
    mentorName: 'Alex Ferreira',
    studentName: 'Clara Tan',
    moduleName: 'Database Management Systems',
    moduleCode: 'IT2040',
    scheduledTime: 'Friday, 10:00 AM - 11:30 AM',
    mode: '1-on-1',
    status: 'Confirmed (Live Ready)',
    roomId: 'MEET-AF-DB-100',
  },
  {
    id: 'ses-2',
    mentorName: 'Dr. Elena Rostova',
    studentName: 'Marco Silva',
    moduleName: 'Data Structures & Algorithms',
    moduleCode: 'IT2020',
    scheduledTime: 'Today, 2:00 PM - 3:30 PM',
    mode: '1-on-1',
    status: 'Pending Mentor Confirm',
    roomId: 'MEET-ER-ALG-200',
  },
  {
    id: 'ses-3',
    mentorName: 'Shenal Perera',
    studentName: 'Kavindi Perera',
    moduleName: 'Mobile Application Development',
    moduleCode: 'IT3020',
    scheduledTime: 'Tomorrow, 4:00 PM - 5:30 PM',
    mode: 'Group (3 students)',
    status: 'Confirmed (Live Ready)',
    roomId: 'MEET-SP-MAD-300',
  },
  {
    id: 'ses-4',
    mentorName: 'Sam O.',
    studentName: 'Jonas K.',
    moduleName: 'Computer Networks',
    moduleCode: 'IT3010',
    scheduledTime: 'Yesterday, 11:00 AM - 12:30 PM',
    mode: '1-on-1',
    status: 'Completed',
    roomId: 'MEET-SO-NET-400',
  },
];

export default function AdminDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const { user, logout } = useAuthStore();

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<RegisteredStudent | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<RegisteredTutor | null>(null);
  const [selectedSession, setSelectedSession] = useState<MentorScheduledSession | null>(null);

  // Recent system activity state
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES);
  const [activityFilter, setActivityFilter] = useState<'All' | 'Active' | 'Pending' | 'Completed'>('All');

  // Registered directory tab state
  const [directoryTab, setDirectoryTab] = useState<'students' | 'tutors'>('students');
  const [directorySearch, setDirectorySearch] = useState('');

  // Mentor scheduled sessions filter
  const [mentorFilter, setMentorFilter] = useState<string>('All');

  // Filtered system activities
  const filteredActivities = activities.filter((act) => {
    if (activityFilter === 'All') return true;
    return act.status === activityFilter;
  });

  // Filtered students
  const filteredStudents = REGISTERED_STUDENTS.filter((st) =>
    st.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
    st.studentId.toLowerCase().includes(directorySearch.toLowerCase()) ||
    st.degree.toLowerCase().includes(directorySearch.toLowerCase())
  );

  // Filtered tutors
  const filteredTutors = REGISTERED_TUTORS.filter((tut) =>
    tut.name.toLowerCase().includes(directorySearch.toLowerCase()) ||
    tut.subjects.some((s) => s.toLowerCase().includes(directorySearch.toLowerCase()))
  );

  // Filtered mentor sessions
  const filteredMentorSessions = MENTOR_SCHEDULED_SESSIONS.filter((ses) => {
    if (mentorFilter === 'All') return true;
    return ses.mentorName.toLowerCase().includes(mentorFilter.toLowerCase());
  });

  // Activity status update
  const handleUpdateActivityStatus = (id: string, newStatus: ActivityItem['status']) => {
    setActivities((prev) =>
      prev.map((act) => (act.id === id ? { ...act, status: newStatus } : act))
    );
    if (selectedActivity && selectedActivity.id === id) {
      setSelectedActivity((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    Alert.alert('System Activity Updated', `Session status changed to ${newStatus}.`);
  };

  const handleAddTutor = () => {
    Alert.alert('Administrative Action', 'Choose an action for tutor onboarding:', [
      { text: 'Review Applications', onPress: () => navigation.navigate('TutorApplications') },
      { text: 'Register New Tutor', onPress: () => navigation.navigate('TutorRegistration') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSystemAudit = () => {
    Alert.alert(
      'System Audit Initialized',
      'Automated transcript hashing and security audit completed. All 34 tutor certificates are verified against campus registries.',
      [
        { text: 'View Document Review', onPress: () => navigation.navigate('DocumentReview') },
        { text: 'OK' },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Header Bar matching UI Screenshot */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.85}
          >
            <View style={styles.avatarBorder}>
              <Image
                source={require('../../../../assets/tutor_avatar.jpg')}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 85 }]}
      >
        {/* Top 3 Summary Stat Cards */}
        <View style={styles.metricsRow}>
          {/* Card 1: Total Sessions */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <SvgCalendar size={18} color="#EAA023" />
              <Text style={[styles.trendBadge, styles.trendGreen]}>+12%</Text>
            </View>
            <Text style={styles.metricValue}>148</Text>
            <Text style={styles.metricLabel}>Total Sessions</Text>
          </View>

          {/* Card 2: Active Tutors */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <SvgUser size={18} color="#EAA023" />
              <Text style={[styles.trendBadge, styles.trendGreen]}>+3</Text>
            </View>
            <Text style={styles.metricValue}>34</Text>
            <Text style={styles.metricLabel}>Active Tutors</Text>
          </View>

          {/* Card 3: Pending Requests */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <SvgClock size={18} color="#EAA023" />
              <Text style={[styles.trendBadge, styles.trendTeal]}>-2</Text>
            </View>
            <Text style={styles.metricValue}>8</Text>
            <Text style={styles.metricLabel}>Pending Requests</Text>
          </View>
        </View>

        {/* Section 1: Administrative Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>ADMINISTRATIVE ACTIONS</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleAddTutor} activeOpacity={0.8}>
            <Text style={styles.plusIcon}>+</Text>
            <Text style={styles.actionBtnText}>Add Tutor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleSystemAudit} activeOpacity={0.8}>
            <SvgFileText size={17} color="#EAA023" />
            <Text style={styles.actionBtnText}>System Audit</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Performance Insights */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>PERFORMANCE INSIGHTS</Text>
        </View>

        <View style={styles.insightsRow}>
          {/* Card 1: Session Trend */}
          <View style={styles.insightCard}>
            <View style={styles.insightHead}>
              <View style={styles.insightTitleRow}>
                <SvgCalendar size={15} color="#EAA023" />
                <Text style={styles.insightTitle}>Session Trend</Text>
              </View>
              <Text style={styles.insightBadgeGreen}>+12%</Text>
            </View>

            {/* Bar Chart Visual */}
            <View style={styles.chartBox}>
              {[22, 32, 40, 50, 68, 80, 92, 98].map((height, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chartBar,
                    {
                      height: `${height}%`,
                      backgroundColor: idx < 3 ? '#FEF3C7' : '#EAA023',
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.insightFooterText}>148 sessions this week</Text>
          </View>

          {/* Card 2: Tutor Activity */}
          <View style={styles.insightCard}>
            <View style={styles.insightHead}>
              <View style={styles.insightTitleRow}>
                <SvgUser size={15} color="#EAA023" />
                <Text style={styles.insightTitle}>Tutor Activity</Text>
              </View>
              <Text style={styles.insightBadgeGreen}>+3</Text>
            </View>

            {/* Gauge Circle Visual */}
            <View style={styles.activityBox}>
              <View style={styles.activityCircle}>
                <Text style={styles.activityCircleNum}>34</Text>
              </View>
            </View>

            <Text style={styles.insightFooterText}>34 active tutors</Text>
          </View>
        </View>

        {/* NEW SECTION 3: REGISTERED STUDENTS & TUTORS */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>REGISTERED STUDENTS & TUTORS DIRECTORY</Text>
        </View>

        <View style={styles.directoryContainer}>
          {/* Segmented Switcher */}
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                directoryTab === 'students' && styles.segmentBtnActive,
              ]}
              onPress={() => setDirectoryTab('students')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  directoryTab === 'students' && styles.segmentBtnTextActive,
                ]}
              >
                Students ({REGISTERED_STUDENTS.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentBtn,
                directoryTab === 'tutors' && styles.segmentBtnActive,
              ]}
              onPress={() => setDirectoryTab('tutors')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  directoryTab === 'tutors' && styles.segmentBtnTextActive,
                ]}
              >
                Tutors ({REGISTERED_TUTORS.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <SvgSearch size={16} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder={directoryTab === 'students' ? 'Search students by name or ID...' : 'Search tutors by name or module...'}
              placeholderTextColor="#94A3B8"
              value={directorySearch}
              onChangeText={setDirectorySearch}
            />
          </View>

          {/* Directory Content List */}
          {directoryTab === 'students' ? (
            <View style={styles.directoryList}>
              {filteredStudents.map((student) => (
                <TouchableOpacity
                  key={student.id}
                  style={styles.directoryCard}
                  onPress={() => setSelectedStudent(student)}
                  activeOpacity={0.75}
                >
                  <View style={styles.studentAvatarCircle}>
                    <Text style={styles.studentAvatarInitials}>{student.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.dirCardHead}>
                      <Text style={styles.dirCardName}>{student.name}</Text>
                      <View style={styles.statusPillActive}>
                        <Text style={styles.statusPillTextGreen}>{student.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.dirCardSub}>{student.degree}</Text>
                    <Text style={styles.dirCardMeta}>ID: {student.studentId} • {student.enrolledModules.length} Enrolled Modules</Text>
                  </View>
                  <SvgChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.viewAllDirectoryBtn}
                onPress={() => navigation.navigate('UserManagement')}
              >
                <Text style={styles.viewAllDirectoryBtnText}>Manage Full User Directory  →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.directoryList}>
              {filteredTutors.map((tutor) => (
                <TouchableOpacity
                  key={tutor.id}
                  style={styles.directoryCard}
                  onPress={() => setSelectedTutor(tutor)}
                  activeOpacity={0.75}
                >
                  <View style={styles.tutorAvatarCircle}>
                    <Text style={styles.tutorAvatarInitials}>{tutor.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.dirCardHead}>
                      <Text style={styles.dirCardName}>{tutor.name}</Text>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingBadgeText}>{tutor.rating} ★</Text>
                      </View>
                    </View>
                    <Text style={styles.dirCardSub}>{tutor.subjects.join(' • ')}</Text>
                    <Text style={styles.dirCardMeta}>Rs. {tutor.hourlyRate}/hr • {tutor.sessionsCount} Sessions Conducted</Text>
                  </View>
                  <SvgChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.viewAllDirectoryBtn}
                onPress={() => navigation.navigate('TutorApplications')}
              >
                <Text style={styles.viewAllDirectoryBtnText}>Review Tutor Applications & Audits  →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* NEW SECTION 4: SESSIONS SCHEDULED BY EACH MENTOR */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>MENTOR SCHEDULED SESSIONS</Text>
        </View>

        {/* Mentor Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mentorChipsRow}
        >
          {['All', 'Alex Ferreira', 'Dr. Elena Rostova', 'Shenal Perera', 'Sam O.'].map((mentor) => (
            <TouchableOpacity
              key={mentor}
              style={[
                styles.mentorChip,
                mentorFilter === mentor && styles.mentorChipActive,
              ]}
              onPress={() => setMentorFilter(mentor)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.mentorChipText,
                  mentorFilter === mentor && styles.mentorChipTextActive,
                ]}
              >
                {mentor}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.mentorSessionsList}>
          {filteredMentorSessions.map((ses) => (
            <TouchableOpacity
              key={ses.id}
              style={styles.mentorSessionCard}
              onPress={() => setSelectedSession(ses)}
              activeOpacity={0.8}
            >
              <View style={styles.sessionHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionModuleName}>{ses.moduleName}</Text>
                  <Text style={styles.sessionCodeText}>{ses.moduleCode} • {ses.mode}</Text>
                </View>
                <View
                  style={[
                    styles.sessionStatusPill,
                    ses.status.includes('Confirmed') && styles.statusActive,
                    ses.status.includes('Pending') && styles.statusPending,
                    ses.status === 'Completed' && styles.statusCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.sessionStatusText,
                      ses.status.includes('Confirmed') && styles.statusActiveText,
                      ses.status.includes('Pending') && styles.statusPendingText,
                      ses.status === 'Completed' && styles.statusCompletedText,
                    ]}
                  >
                    {ses.status}
                  </Text>
                </View>
              </View>

              <View style={styles.sessionDivider} />

              <View style={styles.sessionPeopleRow}>
                <View style={styles.personCol}>
                  <Text style={styles.personRoleLabel}>MENTOR</Text>
                  <Text style={styles.personName}>{ses.mentorName}</Text>
                </View>
                <Text style={styles.personArrow}>→</Text>
                <View style={styles.personCol}>
                  <Text style={styles.personRoleLabel}>STUDENT</Text>
                  <Text style={styles.personName}>{ses.studentName}</Text>
                </View>
              </View>

              <View style={styles.sessionTimeRow}>
                <SvgClock size={13} color="#EAA023" />
                <Text style={styles.sessionTimeText}>{ses.scheduledTime}</Text>
                <View style={{ flex: 1 }} />
                <Text style={styles.inspectSessionLink}>Audit Details ›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section 5: Recent System Activity (NOW FULLY WORKING & INTERACTIVE) */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>RECENT SYSTEM ACTIVITY</Text>
        </View>

        {/* Activity Filter Tabs */}
        <View style={styles.activityFilterRow}>
          {(['All', 'Active', 'Pending', 'Completed'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.activityFilterChip,
                activityFilter === tab && styles.activityFilterChipActive,
              ]}
              onPress={() => setActivityFilter(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.activityFilterText,
                  activityFilter === tab && styles.activityFilterTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tableCard}>
          {/* Navy Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 2 }]}>Student / Tutor</Text>
            <Text style={[styles.thText, { flex: 1.4, textAlign: 'center' }]}>Session Time</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Status</Text>
          </View>

          {/* Rows - Touchable with Details Modal */}
          {filteredActivities.length === 0 ? (
            <View style={styles.emptyTableBox}>
              <Text style={styles.emptyTableText}>No activities matching "{activityFilter}"</Text>
            </View>
          ) : (
            filteredActivities.map((item, index) => (
              <React.Fragment key={item.id}>
                <TouchableOpacity
                  style={styles.tableRow}
                  onPress={() => setSelectedActivity(item)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 2 }}>
                    <Text style={styles.rowMainName}>{item.student}</Text>
                    <Text style={styles.rowSub}>
                      {item.module} • {item.tutor}
                    </Text>
                  </View>

                  <Text style={[styles.rowTime, { flex: 1.4, textAlign: 'center' }]}>
                    {item.time}
                  </Text>

                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View
                      style={[
                        styles.statusPill,
                        item.status === 'Active' && styles.statusActive,
                        item.status === 'Pending' && styles.statusPending,
                        item.status === 'Completed' && styles.statusCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.status === 'Active' && styles.statusActiveText,
                          item.status === 'Pending' && styles.statusPendingText,
                          item.status === 'Completed' && styles.statusCompletedText,
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                {index < filteredActivities.length - 1 && <View style={styles.rowDivider} />}
              </React.Fragment>
            ))
          )}
        </View>

        {/* System Status Footer Card */}
        <View style={styles.systemStatusCard}>
          <View style={styles.systemStatusLeft}>
            <View style={styles.pulsingDot} />
            <Text style={styles.systemStatusLabel}>
              All systems operational — latency 48ms
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowDetailsModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Activity Details & Status Action Modal */}
      <Modal
        visible={!!selectedActivity}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedActivity(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedActivity(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>System Activity Telemetry</Text>
            <Text style={styles.modalSub}>Session Audit & Real-time Status Control</Text>

            {selectedActivity && (
              <>
                <View style={styles.telemetryList}>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Student Name:</Text>
                    <Text style={styles.telemetryVal}>{selectedActivity.student}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Assigned Mentor:</Text>
                    <Text style={styles.telemetryVal}>{selectedActivity.tutor}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Academic Module:</Text>
                    <Text style={styles.telemetryVal}>{selectedActivity.module}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Scheduled Time:</Text>
                    <Text style={styles.telemetryVal}>{selectedActivity.time}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Virtual Room Token:</Text>
                    <Text style={styles.telemetryVal}>{selectedActivity.roomToken || 'ROOM-8291'}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Current Status:</Text>
                    <Text style={[styles.telemetryVal, { color: '#EAA023' }]}>
                      {selectedActivity.status}
                    </Text>
                  </View>
                </View>

                {/* Status Toggle Actions */}
                <Text style={styles.actionModalSectionTitle}>AUDIT CONTROLS</Text>
                <View style={styles.activityActionBtnsRow}>
                  {selectedActivity.status !== 'Active' && (
                    <TouchableOpacity
                      style={[styles.statusActionBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                      onPress={() => handleUpdateActivityStatus(selectedActivity.id, 'Active')}
                    >
                      <Text style={[styles.statusActionText, { color: '#059669' }]}>Set Active</Text>
                    </TouchableOpacity>
                  )}

                  {selectedActivity.status !== 'Pending' && (
                    <TouchableOpacity
                      style={[styles.statusActionBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
                      onPress={() => handleUpdateActivityStatus(selectedActivity.id, 'Pending')}
                    >
                      <Text style={[styles.statusActionText, { color: '#D97706' }]}>Set Pending</Text>
                    </TouchableOpacity>
                  )}

                  {selectedActivity.status !== 'Completed' && (
                    <TouchableOpacity
                      style={[styles.statusActionBtn, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}
                      onPress={() => handleUpdateActivityStatus(selectedActivity.id, 'Completed')}
                    >
                      <Text style={[styles.statusActionText, { color: '#475569' }]}>Mark Completed</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalCloseBtn, { marginTop: 14 }]}
                  onPress={() => setSelectedActivity(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close Activity</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Student Details Modal */}
      <Modal
        visible={!!selectedStudent}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedStudent(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedStudent(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Student Profile Audit</Text>
            <Text style={styles.modalSub}>Campus Verified Undergraduate</Text>

            {selectedStudent && (
              <>
                <View style={styles.telemetryList}>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Name:</Text>
                    <Text style={styles.telemetryVal}>{selectedStudent.name}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Student ID:</Text>
                    <Text style={styles.telemetryVal}>{selectedStudent.studentId}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Faculty:</Text>
                    <Text style={styles.telemetryVal}>{selectedStudent.faculty}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Degree:</Text>
                    <Text style={styles.telemetryVal}>{selectedStudent.degree}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Modules Enrolled:</Text>
                    <Text style={styles.telemetryVal}>{selectedStudent.enrolledModules.join(', ')}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Account Status:</Text>
                    <Text style={[styles.telemetryVal, { color: '#10B981' }]}>{selectedStudent.status}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedStudent(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Tutor Details Modal */}
      <Modal
        visible={!!selectedTutor}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTutor(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedTutor(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Tutor Certification Audit</Text>
            <Text style={styles.modalSub}>Verified Peer Mentor</Text>

            {selectedTutor && (
              <>
                <View style={styles.telemetryList}>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Mentor Name:</Text>
                    <Text style={styles.telemetryVal}>{selectedTutor.name}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Modules:</Text>
                    <Text style={styles.telemetryVal}>{selectedTutor.subjects.join(', ')}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Rating:</Text>
                    <Text style={styles.telemetryVal}>{selectedTutor.rating} ★ ({selectedTutor.reviewsCount} reviews)</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Hourly Rate:</Text>
                    <Text style={styles.telemetryVal}>Rs. {selectedTutor.hourlyRate}/hr</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Sessions Conducted:</Text>
                    <Text style={styles.telemetryVal}>{selectedTutor.sessionsCount} sessions</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Registry Status:</Text>
                    <Text style={[styles.telemetryVal, { color: '#10B981' }]}>{selectedTutor.status}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedTutor(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Mentor Scheduled Session Modal */}
      <Modal
        visible={!!selectedSession}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedSession(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedSession(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Scheduled Session Audit</Text>
            <Text style={styles.modalSub}>UniMentor Live WebRTC Chamber</Text>

            {selectedSession && (
              <>
                <View style={styles.telemetryList}>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Module:</Text>
                    <Text style={styles.telemetryVal}>{selectedSession.moduleName}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Mentor:</Text>
                    <Text style={styles.telemetryVal}>{selectedSession.mentorName}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Student:</Text>
                    <Text style={styles.telemetryVal}>{selectedSession.studentName}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Scheduled Time:</Text>
                    <Text style={styles.telemetryVal}>{selectedSession.scheduledTime}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Format:</Text>
                    <Text style={styles.telemetryVal}>{selectedSession.mode}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Room ID:</Text>
                    <Text style={styles.telemetryVal}>{selectedSession.roomId}</Text>
                  </View>
                  <View style={styles.telemetryRow}>
                    <Text style={styles.telemetryKey}>Status:</Text>
                    <Text style={[styles.telemetryVal, { color: '#EAA023' }]}>{selectedSession.status}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedSession(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close Audit</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Infrastructure Telemetry Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDetailsModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>System Infrastructure Telemetry</Text>
            <Text style={styles.modalSub}>UniMentor Enterprise Cloud Node 01</Text>

            <View style={styles.telemetryList}>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>API Response Latency:</Text>
                <Text style={styles.telemetryVal}>48ms (Optimal)</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Platform Uptime:</Text>
                <Text style={styles.telemetryVal}>99.98% (30-day)</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>PostgreSQL Replica Lag:</Text>
                <Text style={styles.telemetryVal}>0.2ms</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Active WebSockets (Pods):</Text>
                <Text style={styles.telemetryVal}>14 rooms online</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Database Connection Pool:</Text>
                <Text style={styles.telemetryVal}>18% capacity</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Admin Profile & Actions Drawer */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowProfileMenu(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.adminProfileHeader}>
              <Image
                source={require('../../../../assets/tutor_avatar.jpg')}
                style={styles.adminProfileImg}
                resizeMode="cover"
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.adminProfileName}>{user?.name || 'Administrator'}</Text>
                <Text style={styles.adminProfileRole}>{user?.email || 'admin@unimentor.dev'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>CAMPUS SUPER ADMIN</Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.menuItemBtn}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('AdminProfile');
                }}
              >
                <Text style={styles.menuItemText}>👤 View Full Admin Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemBtn}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('AddAdmin');
                }}
              >
                <Text style={styles.menuItemText}>🛡️ Add & Manage Administrators</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemBtn}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('Reports');
                }}
              >
                <Text style={styles.menuItemText}>📊 System Audits & Reports</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItemBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
                onPress={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
              >
                <Text style={[styles.menuItemText, { color: '#DC2626' }]}>🚪 Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBorder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#EAA023',
    overflow: 'hidden',
    backgroundColor: '#061E47',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
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
    color: '#EAA023',
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },

  /* Top 3 Metric Cards */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  metricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  trendGreen: {
    color: '#10B981',
  },
  trendTeal: {
    color: '#0D9488',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#061E47',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  orangeIndicator: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EAA023',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#061E47',
    letterSpacing: 0.8,
  },

  /* Action Buttons */
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  plusIcon: {
    color: '#EAA023',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#061E47',
  },

  /* Performance Insights */
  insightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  insightHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#061E47',
  },
  insightBadgeGreen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },

  /* Chart bars */
  chartBox: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  chartBar: {
    width: 10,
    borderRadius: 4,
  },
  insightFooterText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Tutor Activity Gauge */
  activityBox: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  activityCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  activityCircleNum: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061E47',
  },

  /* Directory Segmented Container */
  directoryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  segmentBtnTextActive: {
    color: '#061E47',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: '#061E47',
    padding: 0,
  },
  directoryList: {
    gap: 10,
  },
  directoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  studentAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#061E47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAvatarInitials: {
    color: '#EAA023',
    fontSize: 12,
    fontWeight: '800',
  },
  tutorAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EAA023',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorAvatarInitials: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  dirCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dirCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#061E47',
  },
  statusPillActive: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillTextGreen: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingBadgeText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '800',
  },
  dirCardSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  dirCardMeta: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  viewAllDirectoryBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  viewAllDirectoryBtnText: {
    color: '#EAA023',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Mentor Scheduled Sessions */
  mentorChipsRow: {
    gap: 8,
    marginBottom: 12,
  },
  mentorChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  mentorChipActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  mentorChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  mentorChipTextActive: {
    color: '#FFFFFF',
  },
  mentorSessionsList: {
    gap: 10,
    marginBottom: 16,
  },
  mentorSessionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionModuleName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#061E47',
  },
  sessionCodeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sessionStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sessionStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  sessionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  sessionPeopleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  personCol: {
    flex: 1,
  },
  personRoleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  personName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#061E47',
    marginTop: 1,
  },
  personArrow: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 8,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  inspectSessionLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EAA023',
  },

  /* Recent System Activity Filters */
  activityFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  activityFilterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  activityFilterChipActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  activityFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  activityFilterTextActive: {
    color: '#FFFFFF',
  },

  /* Activity Table */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tableHeader: {
    backgroundColor: '#061E47',
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  thText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowMainName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#061E47',
  },
  rowSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  rowTime: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusActiveText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  statusCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusCompletedText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  emptyTableBox: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTableText: {
    fontSize: 12,
    color: '#94A3B8',
  },

  /* System Status Card */
  systemStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  systemStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  systemStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EAA023',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#061E47',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  telemetryList: {
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryKey: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  telemetryVal: {
    fontSize: 12,
    color: '#061E47',
    fontWeight: '800',
    maxWidth: 200,
    textAlign: 'right',
  },
  actionModalSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#061E47',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  activityActionBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusActionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  statusActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalCloseBtn: {
    backgroundColor: '#061E47',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  adminProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  adminProfileImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EAA023',
  },
  adminProfileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#061E47',
  },
  adminProfileRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '800',
  },
  menuItemBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#061E47',
  },
});

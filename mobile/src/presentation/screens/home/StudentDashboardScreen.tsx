import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../domain/stores/authStore';
import PageHeader from '../../components/PageHeader';
import { useStudentStore } from '../../../domain/stores/studentStore';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import type { EnrolledMentor, EnrolledModule } from '../../../domain/entities/StudentDashboard';

type Props = BottomTabScreenProps<AppTabParamList, 'Home'>;

const academicCatalogData: Record<string, Record<string, string[]>> = {
  Computing: {
    'Software Engineering': [
      'Data Structures & Algorithms',
      'Software Architecture & Design',
      'Mobile App Development',
      'Object Oriented Programming',
      'DevOps & CI/CD',
    ],
    'Computer Science': [
      'Artificial Intelligence',
      'Machine Learning Systems',
      'DBMS & Big Data',
      'Computer Architecture',
    ],
    'Information Technology': [
      'Web Development & Cloud',
      'Computer Networks & Security',
      'Cloud Computing Infrastructure',
    ],
  },
  Engineering: {
    'Electrical & Electronic': [
      'Circuit Theory & Devices',
      'Digital Electronics',
      'Control Systems & Signals',
    ],
    Mechatronics: ['Robotics Engineering', 'Embedded Systems', 'Sensors & Automation'],
  },
  'Humanities & Sciences': {
    'Mathematics & Statistics': [
      'Probability & Statistics',
      'Applied Linear Algebra',
      'Discrete Mathematics',
    ],
  },
};

export default function StudentDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((state) => state.user);
  const {
    dashboard,
    loading,
    fetchDashboard,
    registerModule,
    assignMentor,
    dropModule,
    incrementGoal,
    updateModuleProgress,
  } = useStudentStore();

  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [showLiveRoom, setShowLiveRoom] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showChangeMentorModal, setShowChangeMentorModal] = useState<EnrolledModule | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showPodsModal, setShowPodsModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [editingModuleProgress, setEditingModuleProgress] = useState<EnrolledModule | null>(null);
  const [progressVal, setProgressVal] = useState('75');
  const [nextSessionTopic, setNextSessionTopic] = useState('');

  // Exam Review Modal state
  const [showExamReviewModal, setShowExamReviewModal] = useState(false);
  const [examReviewTab, setExamReviewTab] = useState<'syllabus' | 'quiz' | 'formulas'>('syllabus');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [reviewedExam, setReviewedExam] = useState(false);

  const quizQuestions = [
    {
      id: 1,
      question: 'If events A and B are mutually exclusive, what is P(A ∩ B)?',
      options: ['0', '1', 'P(A) × P(B)', 'P(A) + P(B)'],
      correctIndex: 0,
      explanation: 'Mutually exclusive events cannot occur simultaneously, so P(A ∩ B) = 0.',
    },
    {
      id: 2,
      question: 'For a Poisson distribution with mean λ = 4, what is the variance?',
      options: ['2', '4', '8', '16'],
      correctIndex: 1,
      explanation: 'In a Poisson distribution, Mean = Variance = λ = 4.',
    },
    {
      id: 3,
      question: 'Under the Central Limit Theorem, the distribution of sample means approaches normal when:',
      options: ['n ≥ 5', 'n ≥ 10', 'n ≥ 30', 'n ≥ 100'],
      correctIndex: 2,
      explanation: 'The standard sample size threshold for CLT normality is n ≥ 30.',
    },
    {
      id: 4,
      question: 'A p-value less than significance level α (0.05) indicates:',
      options: ['Accept null hypothesis', 'Reject null hypothesis', 'Inconclusive test', 'Zero probability'],
      correctIndex: 1,
      explanation: 'p-value < α provides strong evidence against the null hypothesis, so we reject it.',
    },
  ];

  // Register form state
  const [newModuleCode, setNewModuleCode] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('Computing');
  const [selectedDepartment, setSelectedDepartment] = useState('Software Engineering');
  const [selectedMentorForRegistration, setSelectedMentorForRegistration] = useState<EnrolledMentor | null>(null);

  // Goals CRUD state
  const [goalText, setGoalText] = useState('');
  const [goalsList, setGoalsList] = useState<Array<{ id: string; text: string; done: boolean }>>([
    { id: 'g-1', text: 'Master Binary Search Trees & Graph Traversals', done: false },
    { id: 'g-2', text: 'Score 85%+ on Probability Mock Exam', done: false },
    { id: 'g-3', text: 'Complete Software Architecture Class Diagram', done: true },
    { id: 'g-4', text: 'Finish Database Normalization Assignment', done: true },
  ]);

  // Study Pods CRUD state
  const [podsList, setPodsList] = useState<
    Array<{ id: string; name: string; module: string; peers: number; schedule: string }>
  >([
    { id: 'p-1', name: 'Algorithms & Graph Traversals Pod', module: 'IT2040', peers: 12, schedule: 'Today 4:00 PM' },
    { id: 'p-2', name: 'Software Architecture Revision Group', module: 'SE3020', peers: 8, schedule: 'Tomorrow 2:00 PM' },
    { id: 'p-3', name: 'Probability & Stats Exam Cram Pod', module: 'MA2010', peers: 15, schedule: 'Friday 5:00 PM' },
  ]);
  const [newPodName, setNewPodName] = useState('');
  const [newPodModule, setNewPodModule] = useState('IT2040');

  // Library CRUD state
  const [libraryList, setLibraryList] = useState<Array<{ id: string; title: string; meta: string }>>([
    { id: 'l-1', title: 'IT2040 Graph Traversals Quick Guide', meta: 'PDF • 4.2 MB • Verified by Tharushi Perera' },
    { id: 'l-2', title: 'MA2010 Probability Mock Exam with Solutions', meta: 'PDF • 2.8 MB • Uploaded by Dr. Asanka Perera' },
    { id: 'l-3', title: 'SE3020 Enterprise Design Patterns Cheatsheet', meta: 'PDF • 3.5 MB • Verified by Kaveen De Silva' },
  ]);
  const [newResourceTitle, setNewResourceTitle] = useState('');

  // Live room simulation state
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [roomMessages, setRoomMessages] = useState<string[]>([
    'Tharushi Perera: Welcome everyone! Today we cover Graph Traversals: BFS vs DFS.',
    'Kavindu: Could you explain Cycle Detection using DFS?',
  ]);
  const [roomDraft, setRoomDraft] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const handleOpenChat = (mentor: EnrolledMentor) => {
    const mentorEntity = {
      _id: mentor.id || 'mentor-default',
      name: mentor.name,
      email: mentor.email || `${mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
      bio: mentor.bio || `${mentor.roleTitle || 'Mentor'} specializing in academic guidance.`,
      subjects: mentor.subjects || ['Data Structures'],
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      profilePicture: mentor.avatar,
      role: 'mentor' as const,
    };

    navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()?.navigate('Chat', {
      mentor: mentorEntity,
    });
  };

  const handleViewTutorProfile = (mentor: EnrolledMentor) => {
    const mentorEntity = {
      _id: mentor.id || 'mentor-default',
      name: mentor.name,
      email: mentor.email || `${mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
      bio: mentor.bio || `${mentor.roleTitle || 'Mentor'} specializing in peer academic support.`,
      subjects: mentor.subjects || ['Data Structures'],
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      profilePicture: mentor.avatar,
      role: 'mentor' as const,
    };

    navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()?.navigate('TutorProfile', {
      mentor: mentorEntity,
    });
  };

  const handleWriteReview = (mentor: EnrolledMentor) => {
    const mentorEntity = {
      _id: mentor.id || 'mentor-default',
      name: mentor.name,
      email: mentor.email || `${mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
      bio: mentor.bio || `${mentor.roleTitle || 'Mentor'} specializing in peer academic support.`,
      subjects: mentor.subjects || ['Data Structures'],
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      profilePicture: mentor.avatar,
      role: 'mentor' as const,
    };

    navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()?.navigate('WriteReview', {
      mentor: mentorEntity,
    });
  };

  const handleSelectQuizOption = (qIndex: number, optIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleCalculateScore = () => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) score += 1;
    });
    setQuizScore(score);
    Alert.alert('Quiz Results 📊', `You scored ${score} out of ${quizQuestions.length} (${Math.round((score / quizQuestions.length) * 100)}%)!`);
  };

  const handleRegisterNewModule = async () => {
    if (!newModuleName.trim()) {
      Alert.alert('Module Name Required', 'Please select or type a module name.');
      return;
    }

    const code = newModuleCode.trim() || `MOD${Math.floor(1000 + Math.random() * 9000)}`;
    const mentor = selectedMentorForRegistration || dashboard?.availableMentors[0];

    try {
      await registerModule({
        code,
        name: newModuleName.trim(),
        credits: 4,
        faculty: selectedFaculty,
        department: selectedDepartment,
        mentor,
      });
      setShowRegisterModal(false);
      setNewModuleName('');
      setNewModuleCode('');
      setSelectedMentorForRegistration(null);
      Alert.alert('Registration Successful', `You are now enrolled in ${newModuleName.trim()} with mentor ${mentor?.name || 'Assigned Mentor'}.`);
    } catch (err: any) {
      Alert.alert('Enrollment Notice', err.message || 'Unable to register module.');
    }
  };

  const handleSaveGoal = async () => {
    if (!goalText.trim()) {
      Alert.alert('Goal Title', 'Please enter your goal description.');
      return;
    }
    const newG = {
      id: `g-${Date.now()}`,
      text: goalText.trim(),
      done: false,
    };
    setGoalsList((prev) => [newG, ...prev]);
    await incrementGoal();
    setGoalText('');
    Alert.alert('Goal Added! 🎯', 'Keep pushing forward to achieve your academic milestones.');
  };

  const handleToggleGoal = (id: string) => {
    setGoalsList((prev) =>
      prev.map((g) => (g.id === id ? { ...g, done: !g.done } : g))
    );
  };

  const handleDeleteGoal = (id: string) => {
    setGoalsList((prev) => prev.filter((g) => g.id !== id));
  };

  const handleSaveProgress = async () => {
    if (!editingModuleProgress) return;
    const num = Math.min(100, Math.max(0, parseInt(progressVal, 10) || 50));
    await updateModuleProgress(editingModuleProgress.code, num, nextSessionTopic.trim() || undefined);
    setEditingModuleProgress(null);
    Alert.alert('Progress Updated', `Updated ${editingModuleProgress.code} to ${num}% completion.`);
  };

  const handleCreatePod = () => {
    if (!newPodName.trim()) {
      Alert.alert('Required', 'Please enter a pod group name.');
      return;
    }
    const newPod = {
      id: `p-${Date.now()}`,
      name: newPodName.trim(),
      module: newPodModule,
      peers: 1,
      schedule: 'Scheduled with peers',
    };
    setPodsList((prev) => [newPod, ...prev]);
    setNewPodName('');
    Alert.alert('Study Pod Created! 👥', `Your peer pod "${newPod.name}" is now active.`);
  };

  const handleDeletePod = (id: string) => {
    Alert.alert('Leave Pod', 'Leave or delete this study group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => setPodsList((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  const handleAddLibraryResource = () => {
    if (!newResourceTitle.trim()) {
      Alert.alert('Required', 'Please enter resource or notes title.');
      return;
    }
    const newRes = {
      id: `l-${Date.now()}`,
      title: newResourceTitle.trim(),
      meta: 'PDF • Added by You • Peer Verified',
    };
    setLibraryList((prev) => [newRes, ...prev]);
    setNewResourceTitle('');
    Alert.alert('Resource Uploaded! 📄', 'Study material has been added to your Library.');
  };

  const handleDeleteLibraryResource = (id: string) => {
    Alert.alert('Remove File', 'Remove this resource from library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setLibraryList((prev) => prev.filter((l) => l.id !== id)),
      },
    ]);
  };

  const handleSendRoomMessage = () => {
    if (!roomDraft.trim()) return;
    setRoomMessages((prev) => [...prev, `You: ${roomDraft.trim()}`]);
    setRoomDraft('');
  };

  const studentName = authUser?.name || dashboard?.user?.name || 'Nethmi Silva';
  const degreeProgramme = dashboard?.user?.degreeProgramme || 'BSc (Hons)\nSoftware\nEngineering';
  const academicYear = dashboard?.user?.academicYear || 'Year 3';
  const semester = dashboard?.user?.semester || 'Sem 2';
  const stats = dashboard?.academicStats || { goals: 4, plans: 3, dueTests: 2, done: 18 };
  const alert = dashboard?.deadlineAlert;
  const liveSession = dashboard?.liveSession;
  const enrolledModules = dashboard?.enrolledModules || [];
  const availableMentors = dashboard?.availableMentors || [];

  return (
    <View style={styles.screen}>
      <PageHeader title="Student Dashboard" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
      >
        {/* Student Profile Card (Dark Blue / Navy) */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* Year & Semester Pill */}
            <View style={styles.yearSemPill}>
              <View style={styles.goldDot} />
              <Text style={styles.yearSemText}>{`${academicYear} • ${semester}`}</Text>
            </View>

            {/* Profile Avatar with Online Dot */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.avatarWrapper}
              onPress={() => navigation.navigate('Profile')}
            >
              <Image
                source={{
                  uri:
                    authUser?.profilePicture ||
                    dashboard?.user?.profilePicture ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                }}
                style={styles.avatarImg}
              />
              <View style={styles.onlineDot} />
            </TouchableOpacity>
          </View>

          {/* Student Name & Degree */}
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.degreeText}>{degreeProgramme}</Text>

          {/* Stats 4-Column Bar */}
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statTile} onPress={() => setShowGoalModal(true)}>
              <Text style={[styles.statValue, { color: '#FBBF24' }]}>{stats.goals}</Text>
              <Text style={styles.statLabel}>Goals</Text>
            </TouchableOpacity>

            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: '#38BDF8' }]}>{stats.plans}</Text>
              <Text style={styles.statLabel}>Plans</Text>
            </View>

            <TouchableOpacity
              style={styles.statTile}
              onPress={() => setShowExamReviewModal(true)}
            >
              <Text style={[styles.statValue, { color: '#FB7185' }]}>
                {reviewedExam ? Math.max(0, stats.dueTests - 1) : stats.dueTests}
              </Text>
              <Text style={styles.statLabel}>Due Tests</Text>
            </TouchableOpacity>

            <View style={styles.statTile}>
              <Text style={[styles.statValue, { color: '#34D399' }]}>
                {reviewedExam ? stats.done + 1 : stats.done}
              </Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
          </View>
        </View>

        {/* Deadline Approaching Alert Card */}
        {alert && (
          <View style={styles.alertCard}>
            <View style={styles.alertClockIconWrap}>
              <Text style={styles.alertClockEmoji}>⏰</Text>
            </View>

            <View style={styles.alertCopyWrap}>
              <Text style={styles.alertTag}>{alert.tag}</Text>
              <Text style={styles.alertTitle}>{alert.title}</Text>
            </View>

            <View style={styles.alertActionsColumn}>
              <TouchableOpacity
                style={styles.alertActionBtn}
                onPress={() => navigation.navigate('Reviews')}
              >
                <Text style={styles.alertActionBtnText}>Review &gt;</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.alertActionBtn, { marginTop: 6 }]}
                onPress={() => navigation.navigate('Search', { initialQuery: 'Probability' })}
              >
                <Text style={styles.alertActionBtnText}>Find Tutor &gt;</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* QUICK LAUNCHPAD */}
        <View style={styles.launchpadHeaderRow}>
          <Text style={styles.launchpadTitle}>QUICK LAUNCHPAD</Text>
        </View>

        <View style={styles.launchpadGrid}>
          {/* New Goal */}
          <TouchableOpacity
            style={styles.launchpadCardOrange}
            activeOpacity={0.85}
            onPress={() => setShowGoalModal(true)}
          >
            <View style={styles.launchpadIconCircle}>
              <Text style={styles.launchpadOrangeIcon}>✓⁺</Text>
            </View>
            <Text style={styles.launchpadOrangeLabel}>New Goal</Text>
          </TouchableOpacity>

          {/* Pods */}
          <TouchableOpacity
            style={styles.launchpadCardWhite}
            activeOpacity={0.85}
            onPress={() => setShowPodsModal(true)}
          >
            <View style={styles.podsIconWrapper}>
              <Text style={styles.launchpadEmoji}>💬</Text>
              <View style={styles.badgeRed}>
                <Text style={styles.badgeRedText}>3</Text>
              </View>
            </View>
            <Text style={styles.launchpadWhiteLabel}>Pods</Text>
          </TouchableOpacity>

          {/* Join session */}
          <TouchableOpacity
            style={styles.launchpadCardWhite}
            activeOpacity={0.85}
            onPress={() => setShowLiveRoom(true)}
          >
            <Text style={styles.launchpadEmoji}>📹</Text>
            <Text style={styles.launchpadWhiteLabel}>Join session</Text>
          </TouchableOpacity>

          {/* Library */}
          <TouchableOpacity
            style={styles.launchpadCardWhite}
            activeOpacity={0.85}
            onPress={() => setShowLibraryModal(true)}
          >
            <Text style={styles.launchpadEmoji}>📥</Text>
            <Text style={styles.launchpadWhiteLabel}>Library</Text>
          </TouchableOpacity>
        </View>

        {/* Live Session Hero Card (Exact Match with Image) */}
        {liveSession && (
          <View style={styles.liveCard}>
            <View style={styles.liveTopBadgesRow}>
              <View style={styles.livePill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.livePillText}>{liveSession.tag}</Text>
              </View>
              <Text style={styles.liveTimeText}>⏰ {liveSession.timeRemaining}</Text>
            </View>

            <Text style={styles.liveSessionTitle}>{liveSession.title}</Text>
            <Text style={styles.liveSessionSubtitle}>{liveSession.subtitle}</Text>

            {/* Mentor Sub-Card */}
            <View style={styles.liveMentorSubCard}>
              <View style={styles.liveMentorAvatarWrapper}>
                <Image source={{ uri: liveSession.mentor.avatar }} style={styles.liveMentorAvatar} />
                <View style={styles.verifiedCheckBadge}>
                  <Text style={styles.verifiedCheckText}>✓</Text>
                </View>
              </View>

              <View style={styles.liveMentorInfo}>
                <View style={styles.mentorNameRow}>
                  <Text style={styles.liveMentorName}>{liveSession.mentor.name}</Text>
                  <Text style={styles.verifiedGoldBadge}> ✓</Text>
                </View>
                <Text style={styles.liveMentorRole}>
                  {liveSession.mentor.roleTitle} • {liveSession.mentor.batch}
                </Text>
              </View>

              <View style={styles.activeStudentsPill}>
                <Text style={styles.activeStudentsText}>{liveSession.mentor.activeCount || 24} Active</Text>
              </View>
            </View>

            {/* Action Join Room Button */}
            <TouchableOpacity
              style={styles.joinRoomButton}
              activeOpacity={0.85}
              onPress={() => setShowLiveRoom(true)}
            >
              <Text style={styles.joinRoomText}>🚪 Join Room  →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* REGISTERED MODULES & WHO THE MENTOR IS */}
        <View style={styles.modulesSectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modulesSectionTitle}>Registered Modules</Text>
            <Text style={styles.modulesSectionSubtitle}>
              {enrolledModules.length} Modules Enrolled • Assigned Peer Mentors
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addModulePillBtn}
            activeOpacity={0.85}
            onPress={() => {
              const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
              if (parent) {
                parent.navigate('GuidanceWizard');
              } else {
                (navigation as any).navigate('GuidanceWizard');
              }
            }}
          >
            <Text style={styles.addModuleBtnText}>+ Register</Text>
          </TouchableOpacity>
        </View>

        {/* Modules List */}
        {enrolledModules.map((item) => (
          <View key={item.code} style={styles.moduleCard}>
            {/* Top metadata row */}
            <View style={styles.moduleCardTopRow}>
              <View style={styles.moduleCodeBadge}>
                <Text style={styles.moduleCodeText}>{item.code}</Text>
              </View>

              <View style={styles.creditsBadge}>
                <Text style={styles.creditsText}>{item.credits || 4} Credits</Text>
              </View>

              <View style={styles.enrolledStatusBadge}>
                <View style={styles.greenMiniDot} />
                <Text style={styles.enrolledStatusText}>Enrolled</Text>
              </View>
            </View>

            {/* Module Name */}
            <Text style={styles.moduleCardName}>{item.name}</Text>

            {/* Progress bar with Edit */}
            <TouchableOpacity
              style={styles.progressContainer}
              onPress={() => {
                setEditingModuleProgress(item);
                setProgressVal(String(item.progress || 60));
                setNextSessionTopic(item.nextSession || '');
              }}
              activeOpacity={0.8}
            >
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${item.progress || 60}%` }]} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <Text style={styles.editProgressHint}>✏️ Tap to update progress</Text>
                <Text style={styles.progressPercentageText}>{item.progress || 60}% Complete</Text>
              </View>
            </TouchableOpacity>

            {/* ASSIGNED MENTOR SUB-CARD */}
            <View style={styles.mentorBox}>
              <View style={styles.mentorBoxHeader}>
                <Text style={styles.mentorBoxLabel}>⭐ ASSIGNED MENTOR</Text>
                <TouchableOpacity onPress={() => setShowChangeMentorModal(item)}>
                  <Text style={styles.changeMentorLink}>Change Mentor</Text>
                </TouchableOpacity>
              </View>

              {item.mentor ? (
                <View style={styles.mentorProfileRow}>
                  <TouchableOpacity
                    style={styles.mentorAvatarWrapper}
                    onPress={() => handleViewTutorProfile(item.mentor!)}
                  >
                    <Image
                      source={{
                        uri:
                          item.mentor.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(item.mentor.name)}&background=0D4F9E&color=fff`,
                      }}
                      style={styles.mentorAvatar}
                    />
                    <View style={styles.onlineMiniDot} />
                  </TouchableOpacity>

                  <View style={styles.mentorDetailsCol}>
                    <TouchableOpacity
                      onPress={() => handleViewTutorProfile(item.mentor!)}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text style={styles.mentorCardName}>{item.mentor.name}</Text>
                      <Text style={styles.verifiedGoldBadge}> ✓</Text>
                    </TouchableOpacity>

                    <Text style={styles.mentorCardRole}>
                      {item.mentor.roleTitle || 'Senior Peer Mentor'} • {item.mentor.batch || "Batch '24"}
                    </Text>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('Reviews')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.mentorRatingText}>
                        ★ {item.mentor.rating || 4.9} ({item.mentor.reviewCount || 28} reviews) • LKR {(item.mentor.hourlyRate || 1800).toLocaleString()}/hr
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.unassignedMentorBox}
                  onPress={() => setShowChangeMentorModal(item)}
                >
                  <Text style={styles.unassignedText}>No mentor assigned yet. Tap to assign a mentor.</Text>
                </TouchableOpacity>
              )}

              {/* Next Session Note */}
              <View style={styles.nextSessionRow}>
                <Text style={styles.nextSessionIcon}>📅</Text>
                <Text style={styles.nextSessionText}>
                  {item.nextSession || 'Weekly revision session scheduled'}
                </Text>
              </View>

              {/* Action Buttons for this Module & Mentor */}
              <View style={styles.mentorActionsRow}>
                {item.mentor && (
                  <TouchableOpacity
                    style={styles.chatMentorBtn}
                    onPress={() => handleOpenChat(item.mentor!)}
                  >
                    <Text style={styles.chatMentorBtnText}>💬 Chat</Text>
                  </TouchableOpacity>
                )}

                {item.mentor && (
                  <TouchableOpacity
                    style={styles.bookMentorBtn}
                    onPress={() => handleViewTutorProfile(item.mentor!)}
                  >
                    <Text style={styles.bookMentorBtnText}>📅 Book</Text>
                  </TouchableOpacity>
                )}

                {item.mentor && (
                  <TouchableOpacity
                    style={styles.reviewMentorBtn}
                    onPress={() => navigation.navigate('Reviews')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.reviewMentorBtnText}>⭐ Review</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.dropModuleBtn}
                  onPress={() => {
                    Alert.alert(
                      'Drop Module',
                      `Are you sure you want to unenroll from ${item.code} (${item.name})?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Unenroll',
                          style: 'destructive',
                          onPress: () => dropModule(item.code),
                        },
                      ]
                    );
                  }}
                >
                  <Text style={styles.dropModuleBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Academic Guidance Explorer Banner */}
        <TouchableOpacity
          style={styles.catalogExplorerCard}
          onPress={() => {
            const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
            if (parent) {
              parent.navigate('GuidanceWizard');
            } else {
              (navigation as any).navigate('GuidanceWizard');
            }
          }}
          activeOpacity={0.88}
        >
          <View style={styles.explorerIconCircle}>
            <Text style={styles.explorerEmoji}>🎓</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.explorerTitle}>Academic Guidance & Registration</Text>
            <Text style={styles.explorerSubtitle}>Register modules, explore faculties, and get academic guidance.</Text>
          </View>
          <Text style={styles.explorerChevron}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ================= EXAM REVIEW & REVISION MODAL ================= */}
      <Modal visible={showExamReviewModal} animationType="slide" transparent={false} onRequestClose={() => setShowExamReviewModal(false)}>
        <View style={[styles.modalScreen, { paddingTop: insets.top }]}>
          {/* Header */}
          <View style={styles.examModalHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.examTagRow}>
                <View style={styles.examTagBadge}>
                  <Text style={styles.examTagBadgeText}>⏰ EXAM IN 2 DAYS</Text>
                </View>
                <View style={[styles.examTagBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Text style={[styles.examTagBadgeText, { color: '#059669' }]}>
                    {reviewedExam ? '✓ REVIEW COMPLETED' : '78% PREPARED'}
                  </Text>
                </View>
              </View>
              <Text style={styles.examModalTitle}>MA2010: Probability & Statistics</Text>
              <Text style={styles.examModalSubtitle}>Comprehensive Mock Exam & Topic Review Center</Text>
            </View>

            <TouchableOpacity style={styles.closeExamModalBtn} onPress={() => setShowExamReviewModal(false)}>
              <Text style={styles.closeExamModalText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.examTabNav}>
            <TouchableOpacity
              style={[styles.examTabBtn, examReviewTab === 'syllabus' && styles.examTabBtnActive]}
              onPress={() => setExamReviewTab('syllabus')}
            >
              <Text style={[styles.examTabText, examReviewTab === 'syllabus' && styles.examTabTextActive]}>
                📋 Syllabus
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.examTabBtn, examReviewTab === 'quiz' && styles.examTabBtnActive]}
              onPress={() => setExamReviewTab('quiz')}
            >
              <Text style={[styles.examTabText, examReviewTab === 'quiz' && styles.examTabTextActive]}>
                📝 Quiz ({Object.keys(quizAnswers).length}/4)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.examTabBtn, examReviewTab === 'formulas' && styles.examTabBtnActive]}
              onPress={() => setExamReviewTab('formulas')}
            >
              <Text style={[styles.examTabText, examReviewTab === 'formulas' && styles.examTabTextActive]}>
                📐 Formulas
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.examModalScroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            {examReviewTab === 'syllabus' && (
              <View>
                {/* Exam Readiness Progress */}
                <View style={styles.examReadinessCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.readinessTitle}>Readiness Gauge</Text>
                    <Text style={styles.readinessPercent}>{reviewedExam ? '100%' : '78%'}</Text>
                  </View>
                  <View style={styles.readinessTrack}>
                    <View style={[styles.readinessFill, { width: reviewedExam ? '100%' : '78%' }]} />
                  </View>
                  <Text style={styles.readinessHint}>
                    {reviewedExam
                      ? '🎉 You have completed this mock exam review!'
                      : '4 of 5 core module units reviewed. 1 unit needs practice before exam day.'}
                  </Text>
                </View>

                {/* Topics Breakdown */}
                <Text style={styles.examSectionHeading}>CORE REVIEW TOPICS</Text>

                {[
                  {
                    unit: 'Unit 1',
                    title: 'Discrete & Continuous Distributions',
                    status: 'Ready',
                    statusColor: '#10B981',
                    topics: 'Binomial, Poisson, Normal Distribution, Expectation & Variance',
                  },
                  {
                    unit: 'Unit 2',
                    title: "Bayes' Theorem & Conditional Probability",
                    status: 'Ready',
                    statusColor: '#10B981',
                    topics: 'Law of Total Probability, Posterior Likelihood, Independence',
                  },
                  {
                    unit: 'Unit 3',
                    title: 'Central Limit Theorem & Sampling',
                    status: 'Needs Practice',
                    statusColor: '#F59E0B',
                    topics: 'Sampling distribution of mean, Sample size criteria (n ≥ 30), Error bound',
                  },
                  {
                    unit: 'Unit 4',
                    title: 'Hypothesis Testing & Confidence Intervals',
                    status: 'Ready',
                    statusColor: '#10B981',
                    topics: 'Null & alternative hypothesis, p-values, z-test, t-test, Type I & II errors',
                  },
                ].map((item, i) => (
                  <View key={i} style={styles.topicReviewCard}>
                    <View style={styles.topicReviewHeader}>
                      <View style={styles.topicUnitBadge}>
                        <Text style={styles.topicUnitText}>{item.unit}</Text>
                      </View>
                      <View style={[styles.topicStatusBadge, { backgroundColor: item.statusColor + '20' }]}>
                        <Text style={[styles.topicStatusText, { color: item.statusColor }]}>{item.status}</Text>
                      </View>
                    </View>
                    <Text style={styles.topicReviewTitle}>{item.title}</Text>
                    <Text style={styles.topicReviewDesc}>{item.topics}</Text>
                  </View>
                ))}

                {/* Assigned Faculty Mentor Card */}
                <View style={styles.examMentorCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                      source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }}
                      style={styles.examMentorAvatar}
                    />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.examMentorName}>Dr. Asanka Perera</Text>
                      <Text style={styles.examMentorRole}>Lead Examiner & Verified Mentor</Text>
                      <Text style={styles.examMentorStats}>★ 4.9 (42 reviews) • Faculty of Science</Text>
                    </View>
                  </View>

                  <View style={styles.examMentorBtnsRow}>
                    <TouchableOpacity
                      style={styles.examBookMentorBtn}
                      onPress={() => {
                        setShowExamReviewModal(false);
                        handleViewTutorProfile({
                          id: 'mentor-asanka-1',
                          name: 'Dr. Asanka Perera',
                          roleTitle: 'Senior Mathematics & Statistics Lecturer',
                          batch: 'Faculty of Science',
                          rating: 4.9,
                          reviewCount: 42,
                          hourlyRate: 2000,
                          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                          subjects: ['Probability', 'Statistics', 'Mathematics'],
                          bio: 'Experienced mentor specializing in probability theory, hypothesis testing, and statistical computing.',
                        });
                      }}
                    >
                      <Text style={styles.examBookMentorBtnText}>📅 Book Revision Session</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.examChatMentorBtn}
                      onPress={() => {
                        setShowExamReviewModal(false);
                        handleOpenChat({
                          id: 'mentor-asanka-1',
                          name: 'Dr. Asanka Perera',
                          roleTitle: 'Senior Mathematics & Statistics Lecturer',
                          batch: 'Faculty of Science',
                          rating: 4.9,
                          reviewCount: 42,
                          hourlyRate: 2000,
                          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                          subjects: ['Probability', 'Statistics', 'Mathematics'],
                          bio: 'Experienced mentor specializing in probability theory, hypothesis testing, and statistical computing.',
                        });
                      }}
                    >
                      <Text style={styles.examChatMentorBtnText}>💬 Chat</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Mark as Reviewed Button */}
                <TouchableOpacity
                  style={[styles.markReviewedBtn, reviewedExam && styles.markReviewedBtnDone]}
                  onPress={() => {
                    setReviewedExam(true);
                    Alert.alert('Review Completed! 🌟', 'MA2010 Mock Exam status marked as reviewed. You are all set for exam day!');
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.markReviewedBtnText}>
                    {reviewedExam ? '✓ Exam Review Completed' : 'Mark Exam as Reviewed ✅'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {examReviewTab === 'quiz' && (
              <View>
                <View style={styles.quizScoreHeader}>
                  <Text style={styles.quizScoreTitle}>Interactive Practice Quiz</Text>
                  <Text style={styles.quizScoreSubtitle}>
                    Test your understanding with 4 quick mock exam questions.
                  </Text>
                  {quizScore !== null && (
                    <View style={styles.quizScoreBadge}>
                      <Text style={styles.quizScoreBadgeText}>
                        Your Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                      </Text>
                    </View>
                  )}
                </View>

                {quizQuestions.map((q, idx) => {
                  const selectedOpt = quizAnswers[idx];
                  const hasAnswered = selectedOpt !== undefined;
                  const isCorrect = hasAnswered && selectedOpt === q.correctIndex;

                  return (
                    <View key={q.id} style={styles.quizQuestionCard}>
                      <Text style={styles.quizQNumber}>Question {idx + 1} of {quizQuestions.length}</Text>
                      <Text style={styles.quizQuestionText}>{q.question}</Text>

                      <View style={styles.quizOptionsList}>
                        {q.options.map((opt, optIdx) => {
                          const isThisSelected = selectedOpt === optIdx;
                          const isThisCorrect = optIdx === q.correctIndex;

                          let optStyle: any = styles.quizOption;
                          let textStyle: any = styles.quizOptionText;

                          if (hasAnswered) {
                            if (isThisCorrect) {
                              optStyle = [styles.quizOption, styles.quizOptionCorrect];
                              textStyle = [styles.quizOptionText, styles.quizOptionTextCorrect];
                            } else if (isThisSelected) {
                              optStyle = [styles.quizOption, styles.quizOptionWrong];
                              textStyle = [styles.quizOptionText, styles.quizOptionTextWrong];
                            }
                          } else if (isThisSelected) {
                            optStyle = [styles.quizOption, styles.quizOptionSelected];
                          }

                          return (
                            <TouchableOpacity
                              key={optIdx}
                              style={optStyle}
                              onPress={() => handleSelectQuizOption(idx, optIdx)}
                              activeOpacity={0.8}
                            >
                              <View style={styles.quizOptLetter}>
                                <Text style={styles.quizOptLetterText}>
                                  {String.fromCharCode(65 + optIdx)}
                                </Text>
                              </View>
                              <Text style={textStyle}>{opt}</Text>
                              {hasAnswered && isThisCorrect && (
                                <Text style={{ color: '#16A34A', fontWeight: '800', marginLeft: 'auto' }}>✓</Text>
                              )}
                              {hasAnswered && isThisSelected && !isThisCorrect && (
                                <Text style={{ color: '#DC2626', fontWeight: '800', marginLeft: 'auto' }}>✕</Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {hasAnswered && (
                        <View style={[styles.explanationBox, isCorrect ? styles.explanationCorrect : styles.explanationWrong]}>
                          <Text style={styles.explanationTitle}>{isCorrect ? '✓ Correct!' : '✕ Explanation:'}</Text>
                          <Text style={styles.explanationText}>{q.explanation}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}

                <TouchableOpacity
                  style={styles.calcScoreBtn}
                  onPress={handleCalculateScore}
                  activeOpacity={0.85}
                >
                  <Text style={styles.calcScoreBtnText}>Calculate & Save Score 🎯</Text>
                </TouchableOpacity>
              </View>
            )}

            {examReviewTab === 'formulas' && (
              <View>
                <Text style={styles.examSectionHeading}>ESSENTIAL FORMULA CHEATSHEET</Text>

                {[
                  {
                    name: "Bayes' Theorem",
                    formula: 'P(A | B) = [ P(B | A) · P(A) ] / P(B)',
                    usage: 'Calculates the conditional probability of event A given event B.',
                  },
                  {
                    name: 'Binomial Distribution Formula',
                    formula: 'P(X = k) = (n! / (k!(n - k)!)) · p^k · (1 - p)^(n - k)',
                    usage: 'Mean = n·p, Variance = n·p·(1 - p).',
                  },
                  {
                    name: 'Poisson Probability Formula',
                    formula: 'P(X = k) = (λ^k · e^(-λ)) / k!',
                    usage: 'Models count of independent occurrences over a fixed interval. Mean = λ, Variance = λ.',
                  },
                  {
                    name: 'Standard Normal Z-Score',
                    formula: 'Z = (X - μ) / σ',
                    usage: 'Transforms any normal variable to standard normal N(0, 1).',
                  },
                  {
                    name: 'Central Limit Theorem (Sampling Distribution)',
                    formula: 'Z = (X̄ - μ) / (σ / √n)',
                    usage: 'Standard error of sample mean SE = σ / √n.',
                  },
                ].map((item, i) => (
                  <View key={i} style={styles.formulaCard}>
                    <Text style={styles.formulaName}>{item.name}</Text>
                    <View style={styles.formulaCodeBox}>
                      <Text style={styles.formulaCodeText}>{item.formula}</Text>
                    </View>
                    <Text style={styles.formulaUsage}>{item.usage}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.downloadPdfBtn}
                  onPress={() => {
                    Alert.alert(
                      'Download Summary 📄',
                      'MA2010_Probability_Cheat_Sheet.pdf has been saved to your downloads folder.'
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.downloadPdfBtnText}>📥 Download PDF Cheatsheet</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ================= LIVE ROOM MODAL ================= */}
      <Modal visible={showLiveRoom} animationType="slide" transparent={false} onRequestClose={() => setShowLiveRoom(false)}>
        <View style={[styles.modalScreen, { paddingTop: insets.top }]}>
          <View style={styles.roomHeader}>
            <View>
              <View style={styles.livePill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.livePillText}>LIVE SESSION ROOM</Text>
              </View>
              <Text style={styles.roomTitle}>IT2040: Graph Traversals</Text>
              <Text style={styles.roomSubtitle}>Host: Tharushi Perera (Senior Peer Mentor) • 24 Active</Text>
            </View>

            <TouchableOpacity style={styles.leaveRoomBtn} onPress={() => setShowLiveRoom(false)}>
              <Text style={styles.leaveRoomText}>Leave Room</Text>
            </TouchableOpacity>
          </View>

          {/* Main Stage / Video Canvas Simulation */}
          <View style={styles.videoStage}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80' }}
              style={styles.stageHostVideo}
            />
            <View style={styles.stageOverlay}>
              <Text style={styles.stageHostTag}>🎤 Tharushi Perera (Presenting Breadth-First Search)</Text>
            </View>

            {/* Floating student peer thumbnail */}
            <View style={styles.peerThumb}>
              <Text style={styles.peerThumbText}>🧑‍🎓 You</Text>
            </View>
          </View>

          {/* Control Bar */}
          <View style={styles.roomControlsBar}>
            <TouchableOpacity
              style={[styles.controlBtn, isMicMuted && styles.controlBtnMuted]}
              onPress={() => setIsMicMuted(!isMicMuted)}
            >
              <Text style={styles.controlBtnIcon}>{isMicMuted ? '🔇' : '🎙️'}</Text>
              <Text style={styles.controlBtnLabel}>{isMicMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, isCameraOff && styles.controlBtnMuted]}
              onPress={() => setIsCameraOff(!isCameraOff)}
            >
              <Text style={styles.controlBtnIcon}>{isCameraOff ? '🚫' : '📹'}</Text>
              <Text style={styles.controlBtnLabel}>{isCameraOff ? 'Start Cam' : 'Stop Cam'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => Alert.alert('Hand Raised ✋', 'Mentor Tharushi Perera has been notified you have a question.')}
            >
              <Text style={styles.controlBtnIcon}>✋</Text>
              <Text style={styles.controlBtnLabel}>Raise Hand</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => Alert.alert('Session Material 📄', 'Graph Traversals Cheatsheet & Code Samples downloaded to your UniMentor Library.')}
            >
              <Text style={styles.controlBtnIcon}>📑</Text>
              <Text style={styles.controlBtnLabel}>Notes</Text>
            </TouchableOpacity>
          </View>

          {/* Live Chat in Room */}
          <View style={styles.roomChatContainer}>
            <Text style={styles.roomChatHeader}>Peer Revision Room Chat</Text>
            <ScrollView style={styles.roomChatScroll}>
              {roomMessages.map((msg, index) => (
                <View key={index} style={styles.roomMessageBubble}>
                  <Text style={styles.roomMessageText}>{msg}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.roomInputRow}>
              <TextInput
                style={styles.roomInput}
                placeholder="Ask a question in the room..."
                placeholderTextColor="#94A3B8"
                value={roomDraft}
                onChangeText={setRoomDraft}
              />
              <TouchableOpacity style={styles.roomSendBtn} onPress={handleSendRoomMessage}>
                <Text style={styles.roomSendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= REGISTER NEW MODULE MODAL ================= */}
      <Modal visible={showRegisterModal} animationType="slide" transparent onRequestClose={() => setShowRegisterModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRegisterModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Register New Module</Text>
            <Text style={styles.sheetSubheading}>
              Select a module from your degree curriculum and pair with a peer mentor.
            </Text>

            <Text style={styles.inputLabel}>Module Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Mobile App Development, DevOps"
              placeholderTextColor="#94A3B8"
              value={newModuleName}
              onChangeText={setNewModuleName}
            />

            <Text style={styles.inputLabel}>Module Code (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. SE3040, IT3050"
              placeholderTextColor="#94A3B8"
              value={newModuleCode}
              onChangeText={setNewModuleCode}
            />

            <Text style={styles.inputLabel}>Curriculum Quick Pick</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {(academicCatalogData['Computing']['Software Engineering'] || []).map((mod) => (
                <TouchableOpacity
                  key={mod}
                  style={[styles.quickPickChip, newModuleName === mod && styles.quickPickChipActive]}
                  onPress={() => setNewModuleName(mod)}
                >
                  <Text style={[styles.quickPickText, newModuleName === mod && styles.quickPickTextActive]}>
                    {mod}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Select Assigned Mentor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {availableMentors.map((m) => (
                <TouchableOpacity
                  key={m.id || m.name}
                  style={[
                    styles.mentorPickCard,
                    selectedMentorForRegistration?.name === m.name && styles.mentorPickCardActive,
                  ]}
                  onPress={() => setSelectedMentorForRegistration(m)}
                >
                  <Image source={{ uri: m.avatar }} style={styles.mentorPickAvatar} />
                  <Text style={styles.mentorPickName} numberOfLines={1}>
                    {m.name}
                  </Text>
                  <Text style={styles.mentorPickRating}>★ {m.rating || 4.9}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.confirmModalBtn} onPress={handleRegisterNewModule}>
              <Text style={styles.confirmModalBtnText}>Enroll & Assign Mentor</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= CHANGE MENTOR MODAL ================= */}
      <Modal visible={!!showChangeMentorModal} animationType="slide" transparent onRequestClose={() => setShowChangeMentorModal(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowChangeMentorModal(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Assign Mentor for {showChangeMentorModal?.code}</Text>
            <Text style={styles.sheetSubheading}>Choose from available senior peer mentors and faculty tutors.</Text>

            <ScrollView style={{ maxHeight: 340, marginVertical: 10 }}>
              {availableMentors.map((m) => (
                <TouchableOpacity
                  key={m.id || m.name}
                  style={styles.changeMentorRow}
                  onPress={async () => {
                    if (showChangeMentorModal) {
                      await assignMentor(showChangeMentorModal.code, m);
                      setShowChangeMentorModal(null);
                      Alert.alert('Mentor Updated', `${m.name} is now your assigned mentor for ${showChangeMentorModal.code}.`);
                    }
                  }}
                >
                  <Image source={{ uri: m.avatar }} style={styles.mentorAvatar} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mentorCardName}>{m.name} ✓</Text>
                    <Text style={styles.mentorCardRole}>{m.roleTitle || 'Senior Peer Mentor'} • {m.batch || "Batch '24"}</Text>
                    <Text style={styles.mentorRatingText}>★ {m.rating || 4.9} • LKR {(m.hourlyRate || 1800).toLocaleString()}/hr • Active: {m.activeStudentsCount || 24}</Text>
                  </View>
                  <Text style={styles.selectMentorPill}>Select</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setShowChangeMentorModal(null)}>
              <Text style={styles.closeSheetBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= UPDATE MODULE PROGRESS MODAL ================= */}
      <Modal visible={!!editingModuleProgress} animationType="slide" transparent onRequestClose={() => setEditingModuleProgress(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingModuleProgress(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Update Syllabus Progress: {editingModuleProgress?.code}</Text>
            <Text style={styles.sheetSubheading}>Track your completion status and upcoming revision topic.</Text>

            <Text style={styles.inputLabel}>Completion Percentage ({progressVal}%)</Text>
            <View style={styles.chipsWrap}>
              {['25', '50', '75', '90', '100'].map((pct) => (
                <TouchableOpacity
                  key={pct}
                  style={[styles.smallChip, progressVal === pct && styles.smallChipActive]}
                  onPress={() => setProgressVal(pct)}
                >
                  <Text style={[styles.smallChipText, progressVal === pct && styles.smallChipTextActive]}>
                    {pct}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Next Revision Session / Topic</Text>
            <TextInput
              style={styles.modalInput}
              value={nextSessionTopic}
              onChangeText={setNextSessionTopic}
              placeholder="e.g. Tree Traversals & Recursion"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity style={styles.confirmModalBtn} onPress={handleSaveProgress}>
              <Text style={styles.confirmModalBtnText}>Save Progress</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setEditingModuleProgress(null)}>
              <Text style={styles.closeSheetBtnText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= GOALS MODAL (CRUD) ================= */}
      <Modal visible={showGoalModal} animationType="slide" transparent onRequestClose={() => setShowGoalModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowGoalModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Academic Goals ({goalsList.length}) 🎯</Text>
            <Text style={styles.sheetSubheading}>Create, complete, and manage your semester study goals.</Text>

            {/* Create Goal Form */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Type a new academic goal..."
                placeholderTextColor="#94A3B8"
                value={goalText}
                onChangeText={setGoalText}
              />
              <TouchableOpacity style={styles.smallAddBtn} onPress={handleSaveGoal}>
                <Text style={styles.smallAddBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>

            {/* Goals List (Read, Update, Delete) */}
            <ScrollView style={{ maxHeight: 280, marginVertical: 6 }}>
              {goalsList.map((g) => (
                <View key={g.id} style={styles.goalItemRow}>
                  <TouchableOpacity
                    style={[styles.goalCheckbox, g.done && styles.goalCheckboxDone]}
                    onPress={() => handleToggleGoal(g.id)}
                  >
                    {g.done && <Text style={styles.goalCheckmarkText}>✓</Text>}
                  </TouchableOpacity>

                  <Text
                    style={[styles.goalItemText, g.done && styles.goalItemTextDone]}
                    onPress={() => handleToggleGoal(g.id)}
                  >
                    {g.text}
                  </Text>

                  <TouchableOpacity onPress={() => handleDeleteGoal(g.id)} style={{ padding: 6 }}>
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setShowGoalModal(false)}>
              <Text style={styles.closeSheetBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= PODS MODAL (CRUD) ================= */}
      <Modal visible={showPodsModal} animationType="slide" transparent onRequestClose={() => setShowPodsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPodsModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Study Pods ({podsList.length} Active)</Text>
            <Text style={styles.sheetSubheading}>Peer revision groups for collaborative problem solving.</Text>

            {/* Create Pod Form */}
            <View style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={styles.inputLabel}>Create New Study Pod</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Pod group name (e.g. DevOps Cram Pod)"
                placeholderTextColor="#94A3B8"
                value={newPodName}
                onChangeText={setNewPodName}
              />
              <TouchableOpacity style={styles.confirmModalBtn} onPress={handleCreatePod}>
                <Text style={styles.confirmModalBtnText}>+ Create Pod Group</Text>
              </TouchableOpacity>
            </View>

            {/* Pods List */}
            <ScrollView style={{ maxHeight: 240 }}>
              {podsList.map((pod) => (
                <View key={pod.id} style={styles.podCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.podName}>{pod.name}</Text>
                    <TouchableOpacity onPress={() => handleDeletePod(pod.id)}>
                      <Text style={{ fontSize: 12 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.podMeta}>Module: {pod.module} • {pod.peers} Active Peers • {pod.schedule}</Text>
                  <TouchableOpacity
                    style={styles.podJoinBtn}
                    onPress={() => {
                      setShowPodsModal(false);
                      setShowLiveRoom(true);
                    }}
                  >
                    <Text style={styles.podJoinText}>Join Pod Room</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setShowPodsModal(false)}>
              <Text style={styles.closeSheetBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= LIBRARY MODAL (CRUD) ================= */}
      <Modal visible={showLibraryModal} animationType="slide" transparent onRequestClose={() => setShowLibraryModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLibraryModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Module Resource Library ({libraryList.length}) 📥</Text>
            <Text style={styles.sheetSubheading}>Curated lecture summaries, tutorial sheets, and past papers.</Text>

            {/* Create / Upload Resource Form */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Add document or notes title..."
                placeholderTextColor="#94A3B8"
                value={newResourceTitle}
                onChangeText={setNewResourceTitle}
              />
              <TouchableOpacity style={styles.smallAddBtn} onPress={handleAddLibraryResource}>
                <Text style={styles.smallAddBtnText}>+ Upload</Text>
              </TouchableOpacity>
            </View>

            {/* Library List (Read, Download, Delete) */}
            <ScrollView style={{ maxHeight: 260 }}>
              {libraryList.map((item) => (
                <View key={item.id} style={styles.libraryItem}>
                  <Text style={styles.libraryIcon}>📄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.libraryTitle}>{item.title}</Text>
                    <Text style={styles.libraryMeta}>{item.meta}</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Downloaded', `${item.title} downloaded.`)}>
                    <Text style={styles.downloadLink}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteLibraryResource(item.id)} style={{ marginLeft: 8 }}>
                    <Text style={{ fontSize: 13 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setShowLibraryModal(false)}>
              <Text style={styles.closeSheetBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const navyDark = '#061E47';
const navyCard = '#0B2754';
const orangeVibrant = '#F59E0B';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  headerBar: {
    backgroundColor: navyDark,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
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
    color: orangeVibrant,
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContainer: {
    paddingBottom: 24,
  },

  /* Profile Card */
  profileCard: {
    backgroundColor: navyCard,
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  profileTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yearSemPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goldDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FBBF24',
    marginRight: 6,
  },
  yearSemText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: navyCard,
  },
  studentName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: -0.2,
  },
  degreeText: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    backgroundColor: 'rgba(4, 25, 62, 0.45)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Alert Card */
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    padding: 13,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  alertClockIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  alertClockEmoji: {
    fontSize: 20,
  },
  alertCopyWrap: {
    flex: 1,
  },
  alertTag: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  alertTitle: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  alertActionsColumn: {
    marginLeft: 6,
  },
  alertActionBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 11,
    alignItems: 'center',
  },
  alertActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Quick Launchpad */
  launchpadHeaderRow: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  launchpadTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  launchpadGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  launchpadCardOrange: {
    width: '23%',
    height: 84,
    backgroundColor: orangeVibrant,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: orangeVibrant,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  launchpadIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchpadOrangeIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  launchpadOrangeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 6,
  },
  launchpadCardWhite: {
    width: '23%',
    height: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  podsIconWrapper: {
    position: 'relative',
  },
  launchpadEmoji: {
    fontSize: 24,
  },
  badgeRed: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  launchpadWhiteLabel: {
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },

  /* Live Session Hero Card */
  liveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  liveTopBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  greenPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  livePillText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
  },
  liveTimeText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  liveSessionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  liveSessionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  liveMentorSubCard: {
    backgroundColor: '#EEF2F8',
    borderRadius: 16,
    padding: 10,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMentorAvatarWrapper: {
    position: 'relative',
  },
  liveMentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheckText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  liveMentorInfo: {
    flex: 1,
    marginLeft: 10,
  },
  mentorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMentorName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedGoldBadge: {
    color: '#F59E0B',
    fontWeight: '900',
  },
  liveMentorRole: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  activeStudentsPill: {
    backgroundColor: '#E0E7FF',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  activeStudentsText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },
  joinRoomButton: {
    backgroundColor: orangeVibrant,
    borderRadius: 16,
    paddingVertical: 13,
    marginTop: 14,
    alignItems: 'center',
    shadowColor: orangeVibrant,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  joinRoomText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Registered Modules Section */
  modulesSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  modulesSectionTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  modulesSectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  addModulePillBtn: {
    backgroundColor: '#0D4F9E',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addModuleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Module Card */
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moduleCodeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  moduleCodeText: {
    color: '#0284C7',
    fontWeight: '800',
    fontSize: 11,
  },
  creditsBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  creditsText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  enrolledStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 'auto',
  },
  greenMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  enrolledStatusText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '700',
  },
  moduleCardName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#0D4F9E',
    borderRadius: 3,
  },
  progressPercentageText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'right',
  },

  /* Mentor Box inside Module */
  mentorBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  mentorBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mentorBoxLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  changeMentorLink: {
    color: '#0D4F9E',
    fontSize: 11,
    fontWeight: '700',
  },
  mentorProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorAvatarWrapper: {
    position: 'relative',
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineMiniDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  mentorDetailsCol: {
    flex: 1,
    marginLeft: 10,
  },
  mentorCardName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  mentorCardRole: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  mentorRatingText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  unassignedMentorBox: {
    padding: 10,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
  },
  unassignedText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '600',
  },
  nextSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
  },
  nextSessionIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  nextSessionText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  mentorActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  chatMentorBtn: {
    flex: 1,
    backgroundColor: '#0D4F9E',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  chatMentorBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bookMentorBtn: {
    flex: 1,
    backgroundColor: '#EEF2F8',
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  bookMentorBtnText: {
    color: '#0D4F9E',
    fontSize: 11,
    fontWeight: '800',
  },
  dropModuleBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropModuleBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Curriculum Explorer Card */
  catalogExplorerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  explorerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  explorerEmoji: {
    fontSize: 20,
  },
  explorerTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  explorerSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  explorerChevron: {
    color: '#0D4F9E',
    fontSize: 20,
    fontWeight: '800',
  },

  /* Modal Generic Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 19, 43, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#CBD5E1',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeading: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubheading: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  quickPickChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  quickPickChipActive: {
    backgroundColor: '#0D4F9E',
  },
  quickPickText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  quickPickTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mentorPickCard: {
    alignItems: 'center',
    width: 80,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    backgroundColor: '#F8FAFC',
  },
  mentorPickCardActive: {
    borderColor: '#0D4F9E',
    backgroundColor: '#EFF6FF',
  },
  mentorPickAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  mentorPickName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  mentorPickRating: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '700',
  },
  confirmModalBtn: {
    backgroundColor: orangeVibrant,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
  },
  confirmModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  closeSheetBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closeSheetBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Change Mentor Row */
  changeMentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  selectMentorPill: {
    backgroundColor: '#0D4F9E',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },

  /* Pods / Library */
  podCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  podName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  podMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  podJoinBtn: {
    backgroundColor: '#0D4F9E',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  podJoinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  libraryIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  libraryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  libraryMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  downloadLink: {
    color: '#0D4F9E',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Live Room Full Screen */
  modalScreen: {
    flex: 1,
    backgroundColor: '#0A1224',
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0F1C36',
  },
  roomTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  roomSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  leaveRoomBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  leaveRoomText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  videoStage: {
    height: 240,
    backgroundColor: '#1E293B',
    position: 'relative',
    margin: 14,
    borderRadius: 18,
    overflow: 'hidden',
  },
  stageHostVideo: {
    width: '100%',
    height: '100%',
  },
  stageOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stageHostTag: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  peerThumb: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 60,
    height: 60,
    backgroundColor: '#334155',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peerThumbText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  roomControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#0F1C36',
    marginHorizontal: 14,
    borderRadius: 14,
  },
  controlBtn: {
    alignItems: 'center',
  },
  controlBtnMuted: {
    opacity: 0.5,
  },
  controlBtnIcon: {
    fontSize: 20,
  },
  controlBtnLabel: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  roomChatContainer: {
    flex: 1,
    backgroundColor: '#0F1C36',
    margin: 14,
    borderRadius: 18,
    padding: 12,
  },
  roomChatHeader: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  roomChatScroll: {
    flex: 1,
  },
  roomMessageBubble: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 8,
    marginBottom: 6,
  },
  roomMessageText: {
    color: '#E2E8F0',
    fontSize: 12,
  },
  roomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  roomInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 12,
  },
  roomSendBtn: {
    backgroundColor: orangeVibrant,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  roomSendBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  editProgressHint: {
    color: '#0D4F9E',
    fontSize: 10,
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  smallChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  smallChipActive: {
    backgroundColor: '#0D4F9E',
  },
  smallChipText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  smallAddBtn: {
    backgroundColor: orangeVibrant,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  goalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  goalCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  goalCheckboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  goalCheckmarkText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  goalItemText: {
    flex: 1,
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '600',
  },
  goalItemTextDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },

  /* Review Mentor Button */
  reviewMentorBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  reviewMentorBtnText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Exam Review & Revision Modal */
  examModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#061E47',
  },
  examTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  examTagBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  examTagBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  examModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  examModalSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  closeExamModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeExamModalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  examTabNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  examTabBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  examTabBtnActive: {
    borderBottomColor: '#0D4F9E',
  },
  examTabText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  examTabTextActive: {
    color: '#0D4F9E',
    fontWeight: '800',
  },
  examModalScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  examReadinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  readinessTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  readinessPercent: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '900',
  },
  readinessTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  readinessFill: {
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  readinessHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
  examSectionHeading: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  topicReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topicReviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  topicUnitBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topicUnitText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  topicStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topicStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topicReviewTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  topicReviewDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  examMentorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  examMentorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8F0',
  },
  examMentorName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  examMentorRole: {
    color: '#64748B',
    fontSize: 11,
  },
  examMentorStats: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  examMentorBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  examBookMentorBtn: {
    flex: 1,
    backgroundColor: '#0D4F9E',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  examBookMentorBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  examChatMentorBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  examChatMentorBtnText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  markReviewedBtn: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  markReviewedBtnDone: {
    backgroundColor: '#059669',
  },
  markReviewedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  quizScoreHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizScoreTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  quizScoreSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  quizScoreBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  quizScoreBadgeText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  quizQuestionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizQNumber: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  quizQuestionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 12,
  },
  quizOptionsList: {
    gap: 8,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quizOptionSelected: {
    borderColor: '#0D4F9E',
    backgroundColor: '#EFF6FF',
  },
  quizOptionCorrect: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  quizOptionWrong: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  quizOptLetter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quizOptLetterText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  quizOptionText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  quizOptionTextCorrect: {
    color: '#065F46',
    fontWeight: '700',
  },
  quizOptionTextWrong: {
    color: '#991B1B',
    fontWeight: '700',
  },
  explanationBox: {
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  explanationCorrect: {
    backgroundColor: '#ECFDF5',
  },
  explanationWrong: {
    backgroundColor: '#FEF2F2',
  },
  explanationTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
    color: '#0F172A',
  },
  explanationText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  calcScoreBtn: {
    backgroundColor: '#0D4F9E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  calcScoreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  formulaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formulaName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  formulaCodeBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
  },
  formulaCodeText: {
    color: '#0D4F9E',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  formulaUsage: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
  },
  downloadPdfBtn: {
    backgroundColor: '#0D4F9E',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  downloadPdfBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

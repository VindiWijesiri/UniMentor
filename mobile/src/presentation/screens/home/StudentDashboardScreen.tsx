import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../domain/stores/authStore';
import { useStudentStore } from '../../../domain/stores/studentStore';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import type { EnrolledMentor, EnrolledModule } from '../../../domain/entities/StudentDashboard';
import { bookedTutorsRepository, BookedTutorItem } from '../../../data/repositories/bookedTutorsRepository';
import { paymentRepository } from '../../../data/repositories/paymentRepository';
import { tutorSlotRepository } from '../../../data/repositories/tutorSlotRepository';
import {
  SvgVideocam,
  SvgChat,
  SvgTrash,
  SvgClose,
  SvgCheckCircle,
  SvgWallet,
  SvgCalendar,
  SvgClock,
  SvgAlertTriangle,
  SvgPricetag,
  SvgPeople,
  SvgChevronRight,
  SvgPlusCircle,
  SvgChatBubbles,
  SvgFolderOpen,
} from '../../components/common/SvgIcons';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import TutorAvatar from '../../components/common/TutorAvatar';

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
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
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
  const [bookedPods, setBookedPods] = useState<BookedTutorItem[]>([]);
  const [activePodSession, setActivePodSession] = useState<BookedTutorItem | null>(null);

  const loadBookedPods = useCallback(async () => {
    try {
      const items = await bookedTutorsRepository.getBookedTutors();
      setBookedPods(items);
    } catch (e) {
      console.warn('Failed to load booked pods:', e);
    }
  }, []);

  useEffect(() => {
    loadBookedPods();
    const unsub = bookedTutorsRepository.subscribe((updated) => {
      setBookedPods(updated);
    });
    return unsub;
  }, [loadBookedPods]);

  useFocusEffect(
    useCallback(() => {
      loadBookedPods();
    }, [loadBookedPods])
  );

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

  // Cancel Booking & Wallet Refund State
  const [cancellingBooking, setCancellingBooking] = useState<BookedTutorItem | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('Timetable / Lecture clash');
  const [cancellationReasonDetails, setCancellationReasonDetails] = useState('');
  const [cancellationSubmitting, setCancellationSubmitting] = useState(false);
  const [studentWalletBalance, setStudentWalletBalance] = useState(4800);

  useEffect(() => {
    paymentRepository.getWalletBalance().then(setStudentWalletBalance);
  }, []);

  const handleInitiateCancelBooking = (item: BookedTutorItem) => {
    setCancellingBooking(item);
    setCancellationReason('Timetable / Lecture clash');
    setCancellationReasonDetails('');
    paymentRepository.getWalletBalance().then(setStudentWalletBalance);
    setShowCancelModal(true);
  };

  const handleConfirmCancellation = async () => {
    if (!cancellingBooking) return;
    if (cancellationReasonDetails.trim().length < 10) {
      Alert.alert(
        'Valid Reason Required',
        'Please enter at least 10 characters explaining your cancellation reason so the tutor can be notified and your wallet refund can be processed.'
      );
      return;
    }

    try {
      setCancellationSubmitting(true);
      const isGroup = cancellingBooking.studyMode === 'group';
      const defaultRate = isGroup ? 1200 : 2500;
      const refundAmount =
        cancellingBooking.paidAmount ||
        (cancellingBooking.mentor.hourlyRate
          ? cancellingBooking.mentor.hourlyRate * (isGroup ? (cancellingBooking.groupSize || 1) : 1)
          : defaultRate);

      // 1. Credit paid amount back to student wallet
      const refundResult = await paymentRepository.refundToWallet(
        refundAmount,
        `Cancelled booking with ${cancellingBooking.mentor.name}: ${cancellationReason} - ${cancellationReasonDetails.trim()}`
      );
      setStudentWalletBalance(refundResult.newBalance);

      // 2. Remove booked tutor from repository
      await bookedTutorsRepository.removeBookedTutor(cancellingBooking.id);

      // 3. Update tutor dashboard slot (decrement count, release slot, remove attendee)
      await tutorSlotRepository.cancelRegistration({
        slotId: cancellingBooking.slotId,
        mentorId: cancellingBooking.mentor.id,
        mentorName: cancellingBooking.mentor.name,
        studentEmail: authUser?.email,
        studentName: authUser?.name,
      });

      // 4. Reload local booked pods
      await loadBookedPods();

      setShowCancelModal(false);
      const tutorName = cancellingBooking.mentor.name;
      setCancellingBooking(null);
      setCancellationReasonDetails('');

      Alert.alert(
        'Booking Cancelled & Refunded',
        `Your session with ${tutorName} has been cancelled successfully.\n\nRs. ${refundAmount.toLocaleString()} has been credited back to your UniMentor Campus Wallet.\n\nYour new Campus Wallet balance is Rs. ${refundResult.newBalance.toLocaleString()}. The tutor's schedule has been freed up.`
      );
    } catch (err: any) {
      Alert.alert('Cancellation Error', err?.message || 'Could not complete cancellation.');
    } finally {
      setCancellationSubmitting(false);
    }
  };

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
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicrophonePermission] = useMicrophonePermissions();

  const handleToggleRoomCamera = async () => {
    if (isCameraOff) {
      if (!cameraPermission?.granted) {
        const res = await requestCameraPermission();
        if (!res.granted) {
          Alert.alert('Camera Access Needed', 'Please allow camera permissions to display your video stream.');
          return;
        }
      }
      setIsCameraOff(false);
    } else {
      setIsCameraOff(true);
    }
  };

  const handleToggleRoomMic = async () => {
    if (isMicMuted) {
      if (!micPermission?.granted) {
        const res = await requestMicrophonePermission();
        if (!res.granted) {
          Alert.alert('Microphone Access Needed', 'Please allow microphone permissions to speak.');
          return;
        }
      }
      setIsMicMuted(false);
    } else {
      setIsMicMuted(true);
    }
  };
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
    await Promise.all([fetchDashboard(), loadBookedPods()]);
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
    Alert.alert('Quiz Results', `You scored ${score} out of ${quizQuestions.length} (${Math.round((score / quizQuestions.length) * 100)}%)!`);
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
    Alert.alert('Goal Added', 'Keep pushing forward to achieve your academic milestones.');
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
    Alert.alert('Study Pod Created', `Your peer pod "${newPod.name}" is now active.`);
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
    Alert.alert('Resource Uploaded', 'Study material has been added to your Library.');
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

  const handleBackToLogin = () => {
    useAuthStore.getState().logout();
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Student Dashboard</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
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
              onPress={() => (navigation as any).navigate('Profile', { viewAs: 'student' })}
            >
              <Image
                source={{
                  uri:
                    authUser?.profilePicture ||
                    dashboard?.user?.profilePicture ||
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
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
              <Ionicons name="time" size={20} color="#D97706" />
            </View>

            <View style={styles.alertCopyWrap}>
              <Text style={styles.alertTag}>{alert.tag}</Text>
              <Text style={styles.alertTitle}>{alert.title}</Text>
            </View>

            <TouchableOpacity
              style={styles.alertActionBtnPill}
              onPress={() => setShowExamReviewModal(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.alertActionBtnPillText}>Exam Prep</Text>
              <Ionicons name="chevron-forward" size={12} color="#061E47" />
            </TouchableOpacity>
          </View>
        )}

        {/* QUICK LAUNCHPAD */}
        <View style={styles.launchpadHeaderRow}>
          <Text style={styles.launchpadTitle}>QUICK LAUNCHPAD</Text>
        </View>

        <View style={styles.launchpadGrid}>
          {/* New Goal */}
          <TouchableOpacity
            style={styles.launchpadCardUnified}
            activeOpacity={0.85}
            onPress={() => setShowGoalModal(true)}
          >
            <View style={[styles.launchpadIconSquare, { backgroundColor: '#FEF3C7' }]}>
              <SvgPlusCircle size={20} color="#D97706" />
            </View>
            <Text style={styles.launchpadCardLabel}>New Goal</Text>
          </TouchableOpacity>

          {/* Pods */}
          <TouchableOpacity
            style={styles.launchpadCardUnified}
            activeOpacity={0.85}
            onPress={() => setShowPodsModal(true)}
          >
            <View style={[styles.launchpadIconSquare, { backgroundColor: '#EFF6FF' }]}>
              <SvgChatBubbles size={20} color="#1D4ED8" />
              <View style={styles.badgeRed}>
                <Text style={styles.badgeRedText}>3</Text>
              </View>
            </View>
            <Text style={styles.launchpadCardLabel}>Pods</Text>
          </TouchableOpacity>

          {/* Join session (Renamed from Kuppiya) */}
          <TouchableOpacity
            style={styles.launchpadCardUnified}
            activeOpacity={0.85}
            onPress={() => {
              (navigation as any).navigate('Bookings', { screen: 'SessionsList' });
            }}
          >
            <View style={[styles.launchpadIconSquare, { backgroundColor: '#EFF6FF' }]}>
              <SvgVideocam size={20} color="#061E47" />
            </View>
            <Text style={styles.launchpadCardLabel}>Join Session</Text>
          </TouchableOpacity>

          {/* Library */}
          <TouchableOpacity
            style={styles.launchpadCardUnified}
            activeOpacity={0.85}
            onPress={() => setShowLibraryModal(true)}
          >
            <View style={[styles.launchpadIconSquare, { backgroundColor: '#F5F3FF' }]}>
              <SvgFolderOpen size={20} color="#7C3AED" />
            </View>
            <Text style={styles.launchpadCardLabel}>Library</Text>
          </TouchableOpacity>
        </View>

        {/* Live Session Hero Card */}
        {liveSession && (
          <View style={styles.liveCard}>
            <View style={styles.liveTopBadgesRow}>
              <View style={styles.livePill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.livePillText}>{liveSession.tag}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="time-outline" size={13} color="#EF4444" />
                <Text style={styles.liveTimeText}>{liveSession.timeRemaining}</Text>
              </View>
            </View>

            <Text style={styles.liveSessionTitle}>{liveSession.title}</Text>
            <Text style={styles.liveSessionSubtitle}>{liveSession.subtitle}</Text>

            {/* Mentor Sub-Card */}
            <View style={styles.liveMentorSubCard}>
              <View style={styles.liveMentorAvatarWrapper}>
                <Image source={{ uri: liveSession.mentor.avatar }} style={styles.liveMentorAvatar} />
                <View style={styles.verifiedCheckBadge}>
                  <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.liveMentorInfo}>
                <View style={styles.mentorNameRow}>
                  <Text style={styles.liveMentorName}>{liveSession.mentor.name}</Text>
                  <Ionicons name="checkmark-circle" size={14} color="#F59E0B" style={{ marginLeft: 4 }} />
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
              onPress={() => {
                if (bookedPods.length > 0 && !activePodSession) {
                  setActivePodSession(bookedPods[0]);
                }
                setShowLiveRoom(true);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                <Text style={styles.joinRoomText}>Join Room</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Student Campus Wallet Quick Status Card (Positioned lower on dashboard) */}
        <View style={styles.studentWalletQuickCard}>
          <View style={styles.studentWalletLeft}>
            <View style={styles.studentWalletIcon}>
              <SvgWallet size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.studentWalletTitle}>Campus Wallet</Text>
                <View style={styles.studentWalletActivePill}>
                  <Text style={styles.studentWalletActivePillText}>STUDENT</Text>
                </View>
              </View>
              <Text style={styles.studentWalletSubtitle}>
                Session fees & instant booking refunds are credited here
              </Text>
            </View>
          </View>
          <View style={styles.studentWalletRight}>
            <Text style={styles.studentWalletBalanceVal}>Rs. {studentWalletBalance.toLocaleString()}</Text>
            <Text style={styles.studentWalletBalanceLbl}>Available</Text>
          </View>
        </View>

        {/* UPCOMING BOOKINGS & GROUP STUDY PODS */}
        <View style={styles.bookingsSectionWrap}>
          <View style={styles.bookingsHeaderRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.bookingsSectionTitle}>Upcoming Bookings & Pods</Text>
              <Text style={styles.bookingsSectionSubtitle}>
                Active 1-on-1 tutoring and collaborative group study sessions
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bookNewPillBtn}
              onPress={() => (navigation as any).navigate('Bookings', { screen: 'FindMentor' })}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calendar" size={13} color="#061E47" />
                <Text style={styles.bookNewPillBtnText}>Book Session</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bookings Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bookingsCardsScroll}
          >
            {bookedPods.length > 0 ? (
              bookedPods.map((item) => {
                const isGroup = item.studyMode === 'group';
                const studentsCount = item.groupSize || 3;
                const rate = item.mentor.hourlyRate || (isGroup ? 1200 : 2500);

                return (
                  <View key={item.id} style={styles.bookingCard}>
                    {/* Top Badges */}
                    <View style={styles.bookingCardTop}>
                      {isGroup ? (
                        <View style={styles.groupBadge}>
                          <Ionicons name="people" size={12} color="#059669" />
                          <Text style={styles.groupBadgeText}>Group Study Pod ({studentsCount} Students)</Text>
                        </View>
                      ) : (
                        <View style={styles.oneOnOneBadge}>
                          <Ionicons name="person" size={12} color="#1D4ED8" />
                          <Text style={styles.oneOnOneBadgeText}>1-on-1 Mentoring</Text>
                        </View>
                      )}
                      <View style={styles.statusConfirmedBadge}>
                        <View style={styles.statusConfirmedDot} />
                        <Text style={styles.statusConfirmedText}>Confirmed</Text>
                      </View>
                    </View>

                    {/* Title */}
                    <Text style={styles.bookingCardTitle} numberOfLines={2}>
                      {item.moduleCode ? `${item.moduleCode}: ` : ''}{item.moduleName}
                    </Text>

                    {/* Tutor info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <TutorAvatar
                        name={item.mentor.name}
                        imageUrl={item.mentor.avatar}
                        size={30}
                        borderRadius={10}
                        showOnlineDot
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookingCardTutor} numberOfLines={1}>
                          with {item.mentor.name}
                        </Text>
                        <Text style={{ fontSize: 10.5, color: '#64748B' }} numberOfLines={1}>
                          {item.mentor.roleTitle || 'Senior Peer Mentor'}
                        </Text>
                      </View>
                    </View>

                    {/* High-Contrast Clear Price Badge */}
                    <View style={styles.bookingCardPriceRow}>
                      {isGroup ? (
                        <>
                          <View style={styles.groupPriceTagBadge}>
                            <Ionicons name="pricetag" size={12} color="#065F46" />
                            <Text style={styles.groupPriceTagMain}>LKR {rate.toLocaleString()}</Text>
                            <Text style={styles.groupPriceTagSub}>/ student</Text>
                          </View>
                          <Text style={styles.groupTotalSummaryText}>
                            Total: LKR {(rate * studentsCount).toLocaleString()} ({studentsCount} Students)
                          </Text>
                        </>
                      ) : (
                        <>
                          <View style={styles.oneOnOnePriceTagBadge}>
                            <Ionicons name="pricetag" size={12} color="#1E40AF" />
                            <Text style={styles.oneOnOnePriceTagMain}>LKR {rate.toLocaleString()}</Text>
                            <Text style={styles.oneOnOnePriceTagSub}>/ hour</Text>
                          </View>
                          <Text style={styles.oneOnOneSummaryText}>Individual 1-on-1 Session</Text>
                        </>
                      )}
                    </View>

                    {/* Time Row */}
                    <View style={styles.bookingCardTimeRow}>
                      <Ionicons name="time-outline" size={13} color="#D97706" />
                      <Text style={styles.bookingCardTimeText}>{item.nextSession}</Text>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.bookingCardActionsRow}>
                      <TouchableOpacity
                        style={isGroup ? styles.joinPodBtn : styles.joinSessionBtn}
                        onPress={() => {
                          (navigation as any).navigate('Bookings', { screen: 'SessionsList' });
                        }}
                        activeOpacity={0.85}
                      >
                        <SvgVideocam size={13} color="#FFFFFF" />
                        <Text style={[styles.joinPodBtnText, { marginLeft: 4 }]}>
                          Join Session
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.podChatBtn}
                        onPress={() => {
                          const mentorEntity = {
                            _id: item.mentor.id || 'mentor-default',
                            name: item.mentor.name,
                            email: item.mentor.email || `${item.mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
                            bio: item.mentor.bio || 'Peer Mentor',
                            subjects: item.mentor.subjects || [item.moduleName],
                            rating: item.mentor.rating || 4.9,
                            reviewCount: item.mentor.reviewCount || 25,
                            profilePicture: item.mentor.avatar,
                            role: 'mentor' as const,
                          };
                          navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()?.navigate('Chat', {
                            mentor: mentorEntity,
                          });
                        }}
                        activeOpacity={0.85}
                      >
                        <SvgChat size={13} color="#061E47" />
                        <Text style={[styles.podChatBtnText, { marginLeft: 4 }]}>Chat</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.podCancelBtn}
                        onPress={() => handleInitiateCancelBooking(item)}
                        activeOpacity={0.85}
                      >
                        <SvgTrash size={13} color="#DC2626" />
                        <Text style={styles.podCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>

                    {/* View in My Bookings Link */}
                    <TouchableOpacity
                      style={styles.viewBookingDetailsBtn}
                      onPress={() => (navigation as any).navigate('Bookings', { screen: 'SessionsList' })}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.viewBookingDetailsText}>View in My Bookings →</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyPodsCard}>
                <Ionicons name="calendar-outline" size={32} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyPodsTitle}>No Upcoming Sessions or Pods</Text>
                <Text style={styles.emptyPodsSub}>
                  Book a 1-on-1 session or collaborative study pod with verified university mentors.
                </Text>
                <TouchableOpacity
                  style={styles.emptyPodsBookBtn}
                  onPress={() => (navigation as any).navigate('Bookings', { screen: 'FindMentor' })}
                >
                  <Text style={styles.emptyPodsBookBtnText}>Find a Tutor & Book Session →</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {/* REGISTERED MODULES & WHO THE MENTOR IS */}
        <View style={styles.modulesSectionHeaderRow}>
          <View style={{ flex: 1, paddingRight: 6 }}>
            <Text style={styles.modulesSectionTitle}>Registered Modules</Text>
            <Text style={styles.modulesSectionSubtitle}>
              {enrolledModules.length} Modules Enrolled • Synchronized with Database
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity
              style={styles.findTutorPillBtn}
              activeOpacity={0.85}
              onPress={() => (navigation as any).navigate('Bookings', { screen: 'FindMentor' })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="search" size={13} color="#061E47" />
                <Text style={styles.findTutorBtnText}>Find New Tutor</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addModulePillBtn}
              activeOpacity={0.85}
              onPress={() => setShowRegisterModal(true)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addModuleBtnText}>Register</Text>
              </View>
            </TouchableOpacity>
          </View>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="create-outline" size={13} color="#0D4F9E" />
                  <Text style={styles.editProgressHint}>Tap to update progress</Text>
                </View>
                <Text style={styles.progressPercentageText}>{item.progress || 60}% Complete</Text>
              </View>
            </TouchableOpacity>

            {/* ASSIGNED MENTOR SUB-CARD */}
            <View style={styles.mentorBox}>
              <View style={styles.mentorBoxHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="shield-checkmark" size={13} color="#F59E0B" />
                  <Text style={styles.mentorBoxLabel}>ASSIGNED MENTOR</Text>
                </View>
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
                    <TutorAvatar
                      name={item.mentor.name}
                      imageUrl={item.mentor.avatar}
                      size={46}
                      borderRadius={16}
                      showOnlineDot
                    />
                  </TouchableOpacity>

                  <View style={styles.mentorDetailsCol}>
                    <TouchableOpacity
                      onPress={() => handleViewTutorProfile(item.mentor!)}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text style={styles.mentorCardName}>{item.mentor.name}</Text>
                      <Ionicons name="checkmark-circle" size={14} color="#F59E0B" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>

                    <Text style={styles.mentorCardRole}>
                      {item.mentor.roleTitle || 'Senior Peer Mentor'} • {item.mentor.batch || "Batch '24"}
                    </Text>

                    {/* Distinct Badges for Rating and Hourly Rate */}
                    <View style={styles.mentorMetaChipsRow}>
                      <TouchableOpacity
                        onPress={() => navigation.navigate('Reviews')}
                        activeOpacity={0.7}
                        style={styles.mentorRatingChip}
                      >
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={styles.mentorRatingChipText}>
                          {item.mentor.rating || 4.9} ({item.mentor.reviewCount || 28})
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.mentorRateChip}>
                        <Ionicons name="pricetag" size={11} color="#065F46" />
                        <Text style={styles.mentorRateChipText}>
                          LKR {(item.mentor.hourlyRate || 1800).toLocaleString()} / hr
                        </Text>
                      </View>
                    </View>
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
                <Ionicons name="calendar-outline" size={14} color="#0D4F9E" style={{ marginRight: 6 }} />
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
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="chatbubble-ellipses" size={13} color="#FFFFFF" />
                      <Text style={styles.chatMentorBtnText}>Chat</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {item.mentor && (
                  <TouchableOpacity
                    style={styles.bookMentorBtn}
                    onPress={() => {
                      (navigation as any).navigate('Bookings', {
                        screen: 'BookSession',
                        params: {
                          mentor: {
                            _id: item.mentor!.id || 'mentor-default',
                            name: item.mentor!.name,
                            experience: item.mentor!.roleTitle || 'Peer Tutor',
                            rating: item.mentor!.rating || 4.9,
                            reviewCount: item.mentor!.reviewCount || 25,
                            hourlyRate: item.mentor!.hourlyRate || 1800,
                            profilePicture: item.mentor!.avatar,
                            subjects: [item.name],
                          },
                          initialMode: '1-on-1',
                        },
                      });
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="calendar" size={13} color="#0D4F9E" />
                      <Text style={styles.bookMentorBtnText}>Book</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {item.mentor && (
                  <TouchableOpacity
                    style={styles.reviewMentorBtn}
                    onPress={() => navigation.navigate('Reviews')}
                    activeOpacity={0.8}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="star-outline" size={13} color="#475569" />
                      <Text style={styles.reviewMentorBtnText}>Review</Text>
                    </View>
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
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
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
              parent.navigate('GuidanceWizard', { fromTab: 'Home' });
            } else {
              (navigation as any).navigate('GuidanceWizard', { fromTab: 'Home' });
            }
          }}
          activeOpacity={0.88}
        >
          <View style={styles.explorerIconCircle}>
            <Ionicons name="school-outline" size={22} color="#0D4F9E" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.explorerTitle}>Academic Guidance & Registration</Text>
            <Text style={styles.explorerSubtitle}>Register modules, explore faculties, and get academic guidance.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#0D4F9E" />
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time" size={12} color="#D97706" />
                    <Text style={styles.examTagBadgeText}>EXAM IN 2 DAYS</Text>
                  </View>
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
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.examTabNav}>
            <TouchableOpacity
              style={[styles.examTabBtn, examReviewTab === 'syllabus' && styles.examTabBtnActive]}
              onPress={() => setExamReviewTab('syllabus')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="book-outline" size={14} color={examReviewTab === 'syllabus' ? '#0D4F9E' : '#64748B'} />
                <Text style={[styles.examTabText, examReviewTab === 'syllabus' && styles.examTabTextActive]}>
                  Syllabus
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.examTabBtn, examReviewTab === 'quiz' && styles.examTabBtnActive]}
              onPress={() => setExamReviewTab('quiz')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="help-circle-outline" size={14} color={examReviewTab === 'quiz' ? '#0D4F9E' : '#64748B'} />
                <Text style={[styles.examTabText, examReviewTab === 'quiz' && styles.examTabTextActive]}>
                  Quiz ({Object.keys(quizAnswers).length}/4)
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.examTabBtn, examReviewTab === 'formulas' && styles.examTabBtnActive]}
              onPress={() => setExamReviewTab('formulas')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="calculator-outline" size={14} color={examReviewTab === 'formulas' ? '#0D4F9E' : '#64748B'} />
                <Text style={[styles.examTabText, examReviewTab === 'formulas' && styles.examTabTextActive]}>
                  Formulas
                </Text>
              </View>
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
                      ? 'You have completed this mock exam review!'
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="calendar" size={15} color="#FFFFFF" />
                        <Text style={styles.examBookMentorBtnText}>Book Revision Session</Text>
                      </View>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="chatbubbles" size={14} color="#0F172A" />
                        <Text style={styles.examChatMentorBtnText}>Chat</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Mark as Reviewed Button */}
                <TouchableOpacity
                  style={[styles.markReviewedBtn, reviewedExam && styles.markReviewedBtnDone]}
                  onPress={() => {
                    setReviewedExam(true);
                    Alert.alert('Review Completed!', 'MA2010 Mock Exam status marked as reviewed. You are all set for exam day!');
                  }}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.markReviewedBtnText}>
                      {reviewedExam ? 'Exam Review Completed' : 'Mark Exam as Reviewed'}
                    </Text>
                  </View>
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
                                <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={{ marginLeft: 'auto' }} />
                              )}
                              {hasAnswered && isThisSelected && !isThisCorrect && (
                                <Ionicons name="close-circle" size={16} color="#DC2626" style={{ marginLeft: 'auto' }} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {hasAnswered && (
                        <View style={[styles.explanationBox, isCorrect ? styles.explanationCorrect : styles.explanationWrong]}>
                          <Text style={styles.explanationTitle}>{isCorrect ? 'Correct!' : 'Explanation:'}</Text>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="ribbon-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.calcScoreBtnText}>Calculate & Save Score</Text>
                  </View>
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
                      'Download Summary',
                      'MA2010_Probability_Cheat_Sheet.pdf has been saved to your downloads folder.'
                    );
                  }}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.downloadPdfBtnText}>Download PDF Cheatsheet</Text>
                  </View>
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
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.livePill}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.livePillText}>
                  {activePodSession?.studyMode === 'group' ? 'LIVE STUDY POD' : 'LIVE 1-ON-1 SESSION'}
                </Text>
              </View>
              <Text style={styles.roomTitle} numberOfLines={1}>
                {activePodSession?.moduleName || 'IT2040: Graph Traversals'}
              </Text>
              <Text style={styles.roomSubtitle} numberOfLines={1}>
                Host: {activePodSession?.mentor.name || 'Tharushi Perera'} ({activePodSession?.mentor.roleTitle || 'Senior Peer Mentor'}) • {activePodSession?.studyMode === 'group' ? `${activePodSession.groupSize || 3} Pod Members` : '1-on-1 Mentoring'}
              </Text>
            </View>

            <TouchableOpacity style={styles.leaveRoomBtn} onPress={() => setShowLiveRoom(false)}>
              <Text style={styles.leaveRoomText}>Leave Room</Text>
            </TouchableOpacity>
          </View>

          {/* Main Stage / Video Canvas Simulation */}
          <View style={styles.videoStage}>
            {activePodSession?.mentor.avatar ? (
              <Image
                source={{ uri: activePodSession.mentor.avatar }}
                style={styles.stageHostVideo}
              />
            ) : (
              <View style={[styles.stageHostVideo, { backgroundColor: '#0A2540', alignItems: 'center', justifyContent: 'center' }]}>
                <TutorAvatar
                  name={activePodSession?.mentor.name || 'Peer Mentor'}
                  size={88}
                  borderRadius={44}
                  showOnlineDot
                />
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 12 }}>
                  {activePodSession?.mentor.name || 'Peer Mentor'}
                </Text>
                <Text style={{ color: '#94A3B8', fontSize: 11.5, marginTop: 3 }}>
                  Live Video Feed Connected
                </Text>
              </View>
            )}
            <View style={styles.stageOverlay}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="mic" size={14} color="#FFFFFF" />
                <Text style={styles.stageHostTag}>
                  {activePodSession?.mentor.name || 'Peer Mentor'} (Lead Host)
                </Text>
              </View>
            </View>

            {/* Floating student peer thumbnail */}
            <View style={styles.peerThumb}>
              {!isCameraOff && cameraPermission?.granted ? (
                <View style={[StyleSheet.absoluteFill, { borderRadius: 14, overflow: 'hidden' }]}>
                  <CameraView style={StyleSheet.absoluteFill} facing="front" />
                  <View style={{ position: 'absolute', bottom: 3, left: 4, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '700' }}>You (Live)</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="person-circle" size={14} color="#FFFFFF" />
                  <Text style={styles.peerThumbText}>You</Text>
                </View>
              )}
            </View>
          </View>

          {/* Control Bar */}
          <View style={styles.roomControlsBar}>
            <TouchableOpacity
              style={[styles.controlBtn, isMicMuted && styles.controlBtnMuted]}
              onPress={handleToggleRoomMic}
              activeOpacity={0.85}
            >
              <Ionicons name={isMicMuted ? 'mic-off' : 'mic'} size={20} color={isMicMuted ? '#EF4444' : '#FFFFFF'} />
              <Text style={styles.controlBtnLabel}>{isMicMuted ? 'Turn On Mic' : 'Mute Mic'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, isCameraOff && styles.controlBtnMuted]}
              onPress={handleToggleRoomCamera}
              activeOpacity={0.85}
            >
              <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={20} color={isCameraOff ? '#EF4444' : '#FFFFFF'} />
              <Text style={styles.controlBtnLabel}>{isCameraOff ? 'Turn On Cam' : 'Turn Off Cam'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => Alert.alert('Hand Raised', `Mentor ${activePodSession?.mentor.name || 'Peer Mentor'} has been notified that you have a question.`)}
            >
              <Ionicons name="hand-right" size={20} color="#FFFFFF" />
              <Text style={styles.controlBtnLabel}>Raise Hand</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => Alert.alert('Session Material', `${activePodSession?.moduleName || 'Study Session'} Cheatsheet & Code Samples downloaded to your UniMentor Library.`)}
            >
              <Ionicons name="document-text" size={20} color="#FFFFFF" />
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
                  <TutorAvatar name={m.name} imageUrl={m.avatar} size={44} borderRadius={16} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mentorCardName}>{m.name} ✓</Text>
                    <Text style={styles.mentorCardRole}>{m.roleTitle || 'Senior Peer Mentor'} • {m.batch || "Batch '24"}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E' }}>★ {m.rating || 4.9}</Text>
                      <View style={{ backgroundColor: '#ECFDF5', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#065F46' }}>LKR {(m.hourlyRate || 1800).toLocaleString()}/hr</Text>
                      </View>
                    </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="trophy" size={22} color="#F59E0B" />
              <Text style={styles.sheetHeading}>Academic Goals ({goalsList.length})</Text>
            </View>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>Add</Text>
                </View>
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
                    {g.done && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </TouchableOpacity>

                  <Text
                    style={[styles.goalItemText, g.done && styles.goalItemTextDone]}
                    onPress={() => handleToggleGoal(g.id)}
                  >
                    {g.text}
                  </Text>

                  <TouchableOpacity onPress={() => handleDeleteGoal(g.id)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="people" size={22} color="#0D4F9E" />
              <Text style={styles.sheetHeading}>
                Study Pods ({bookedPods.filter((p) => p.studyMode === 'group').length + podsList.length} Active)
              </Text>
            </View>
            <Text style={styles.sheetSubheading}>Peer revision groups for collaborative problem solving.</Text>

            {/* Booked Mentor Study Pods Section */}
            {bookedPods.filter((p) => p.studyMode === 'group').length > 0 && (
              <View style={{ marginBottom: 14 }}>
                <Text style={styles.podSectionHeader}>Your Booked Study Pods</Text>
                {bookedPods
                  .filter((p) => p.studyMode === 'group')
                  .map((pod) => (
                    <View key={`booked-${pod.id}`} style={styles.bookedPodCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <View style={styles.groupBadge}>
                          <Ionicons name="people" size={11} color="#059669" />
                          <Text style={styles.groupBadgeText}>
                            Group Pod ({pod.groupSize || 3} Students)
                          </Text>
                        </View>
                        <View style={styles.statusConfirmedBadge}>
                          <View style={styles.statusConfirmedDot} />
                          <Text style={styles.statusConfirmedText}>Confirmed</Text>
                        </View>
                      </View>

                      <Text style={styles.bookedPodTitle} numberOfLines={1}>
                        {pod.moduleCode ? `${pod.moduleCode}: ` : ''}{pod.moduleName}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 }}>
                        <TutorAvatar
                          name={pod.mentor.name}
                          imageUrl={pod.mentor.avatar}
                          size={24}
                          borderRadius={8}
                        />
                        <Text style={styles.bookedPodMentorName}>with {pod.mentor.name}</Text>
                        <Text style={styles.bookedPodSchedule}>• {pod.nextSession}</Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                        <TouchableOpacity
                          style={[styles.podJoinBtn, { flex: 1 }]}
                          onPress={() => {
                            setActivePodSession(pod);
                            setShowPodsModal(false);
                            setShowLiveRoom(true);
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="videocam" size={14} color="#FFFFFF" />
                            <Text style={styles.podJoinText}>Join Pod Room</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.bookedPodChatBtn}
                          onPress={() => {
                            setShowPodsModal(false);
                            const mentorEntity = {
                              _id: pod.mentor.id || 'mentor-default',
                              name: pod.mentor.name,
                              email: pod.mentor.email || `${pod.mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
                              bio: pod.mentor.bio || 'Peer Mentor',
                              subjects: pod.mentor.subjects || [pod.moduleName],
                              rating: pod.mentor.rating || 4.9,
                              reviewCount: pod.mentor.reviewCount || 25,
                              profilePicture: pod.mentor.avatar,
                              role: 'mentor' as const,
                            };
                            navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()?.navigate('Chat', {
                              mentor: mentorEntity,
                            });
                          }}
                        >
                          <Ionicons name="chatbubbles-outline" size={14} color="#061E47" />
                          <Text style={styles.bookedPodChatText}>Chat</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            <Text style={styles.podSectionHeader}>Community Revision Pods</Text>

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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmModalBtnText}>Create Pod Group</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Pods List */}
            <ScrollView style={{ maxHeight: 200 }}>
              {podsList.map((pod) => (
                <View key={pod.id} style={styles.podCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.podName}>{pod.name}</Text>
                    <TouchableOpacity onPress={() => handleDeletePod(pod.id)}>
                      <Ionicons name="trash-outline" size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.podMeta}>Module: {pod.module} • {pod.peers} Active Peers • {pod.schedule}</Text>
                  <TouchableOpacity
                    style={styles.podJoinBtn}
                    onPress={() => {
                      setActivePodSession({
                        id: pod.id,
                        mentor: {
                          id: 'peer-lead',
                          name: 'Peer Study Lead',
                          roleTitle: 'Pod Host',
                        },
                        moduleCode: pod.module,
                        moduleName: pod.name,
                        nextSession: pod.schedule,
                        studyMode: 'group',
                        groupSize: pod.peers,
                        bookedAt: new Date().toISOString(),
                      });
                      setShowPodsModal(false);
                      setShowLiveRoom(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="log-in-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.podJoinText}>Join Pod Room</Text>
                    </View>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="folder-open" size={22} color="#0D4F9E" />
              <Text style={styles.sheetHeading}>Module Resource Library ({libraryList.length})</Text>
            </View>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="cloud-upload" size={14} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>Upload</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Library List (Read, Download, Delete) */}
            <ScrollView style={{ maxHeight: 260 }}>
              {libraryList.map((item) => (
                <View key={item.id} style={styles.libraryItem}>
                  <Ionicons name="document-text" size={22} color="#0D4F9E" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.libraryTitle}>{item.title}</Text>
                    <Text style={styles.libraryMeta}>{item.meta}</Text>
                  </View>
                  <TouchableOpacity onPress={() => Alert.alert('Downloaded', `${item.title} downloaded.`)}>
                    <Text style={styles.downloadLink}>Download</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteLibraryResource(item.id)} style={{ marginLeft: 8 }}>
                    <Ionicons name="trash-outline" size={15} color="#EF4444" />
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

      {/* ================= CANCEL BOOKING & WALLET REFUND MODAL ================= */}
      <Modal
        visible={showCancelModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          if (!cancellationSubmitting) setShowCancelModal(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            if (!cancellationSubmitting) setShowCancelModal(false);
          }}
        >
          <Pressable style={styles.cancelModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.cancelModalHeaderRow}>
              <View style={styles.cancelModalHeaderLeft}>
                <View style={styles.cancelModalIconWrap}>
                  <SvgAlertTriangle size={20} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cancelModalTitle}>Cancel Booked Tutor</Text>
                  <Text style={styles.cancelModalSub}>
                    Valid reason required • Instant Campus Wallet refund
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowCancelModal(false)}
                disabled={cancellationSubmitting}
                style={styles.cancelModalCloseBtn}
              >
                <SvgClose size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Session Overview Card */}
              {cancellingBooking && (
                <View style={styles.cancelSummaryCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TutorAvatar
                      name={cancellingBooking.mentor.name}
                      imageUrl={cancellingBooking.mentor.avatar}
                      size={42}
                      borderRadius={14}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cancelSummaryTutorName}>{cancellingBooking.mentor.name}</Text>
                      <Text style={styles.cancelSummaryModule}>
                        {cancellingBooking.moduleCode ? `${cancellingBooking.moduleCode}: ` : ''}
                        {cancellingBooking.moduleName}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 }}>
                        <SvgClock size={12} color="#D97706" />
                        <Text style={styles.cancelSummaryTime}>{cancellingBooking.nextSession}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Refund Notice Box */}
              {cancellingBooking && (
                <View style={styles.refundHighlightCard}>
                  <View style={styles.refundHighlightTopRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <SvgWallet size={18} color="#059669" />
                      <Text style={styles.refundHighlightTitle}>100% Wallet Refund</Text>
                    </View>
                    <Text style={styles.refundHighlightAmount}>
                      Rs.{' '}
                      {(
                        cancellingBooking.paidAmount ||
                        (cancellingBooking.studyMode === 'group'
                          ? 1200 * (cancellingBooking.groupSize || 1)
                          : cancellingBooking.mentor.hourlyRate || 2500)
                      ).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.refundHighlightExpl}>
                    This fee will be refunded directly into your UniMentor Campus Wallet immediately upon cancellation.
                  </Text>
                  <View style={styles.refundBalancePreviewRow}>
                    <Text style={styles.refundBalancePreviewLbl}>Current Wallet:</Text>
                    <Text style={styles.refundBalancePreviewVal}>Rs. {studentWalletBalance.toLocaleString()}</Text>
                    <SvgChevronRight size={12} color="#059669" />
                    <Text style={styles.refundBalancePreviewLbl}>After Refund:</Text>
                    <Text style={[styles.refundBalancePreviewVal, { color: '#059669', fontWeight: '800' }]}>
                      Rs.{' '}
                      {(
                        studentWalletBalance +
                        (cancellingBooking.paidAmount ||
                          (cancellingBooking.studyMode === 'group'
                            ? 1200 * (cancellingBooking.groupSize || 1)
                            : cancellingBooking.mentor.hourlyRate || 2500))
                      ).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Mandatory Reason Selector */}
              <Text style={styles.cancelReasonLabel}>SELECT CANCELLATION REASON *</Text>
              {[
                'Timetable / Lecture clash',
                'Coursework or exam rescheduled',
                'Medical / Personal emergency',
                'Found alternative peer study group',
                'Other academic reason',
              ].map((reason) => {
                const isSelected = cancellationReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOptionPill, isSelected && styles.reasonOptionPillSelected]}
                    onPress={() => setCancellationReason(reason)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.reasonRadioOuter, isSelected && styles.reasonRadioOuterSelected]}>
                      {isSelected && <View style={styles.reasonRadioInner} />}
                    </View>
                    <Text style={[styles.reasonOptionText, isSelected && styles.reasonOptionTextSelected]}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Mandatory Detailed Explanation */}
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cancelReasonLabel}>DETAILED REASON (REQUIRED) *</Text>
                  <Text
                    style={[
                      styles.cancelCharCounter,
                      cancellationReasonDetails.trim().length < 10 ? { color: '#EF4444' } : { color: '#059669' },
                    ]}
                  >
                    {cancellationReasonDetails.trim().length}/10 chars min
                  </Text>
                </View>
                <TextInput
                  style={styles.cancelReasonTextInput}
                  placeholder="Explain why you are cancelling this booking (minimum 10 characters required for tutor notification & refund confirmation)..."
                  placeholderTextColor="#94A3B8"
                  value={cancellationReasonDetails}
                  onChangeText={setCancellationReasonDetails}
                  multiline
                  numberOfLines={3}
                />
                {cancellationReasonDetails.trim().length > 0 && cancellationReasonDetails.trim().length < 10 && (
                  <Text style={styles.cancelValidationError}>
                    Please enter at least 10 characters explaining your reason.
                  </Text>
                )}
              </View>

              {/* Tutor Notification Disclaimer */}
              <View style={styles.cancelDisclaimerBox}>
                <SvgCheckCircle size={14} color="#0284C7" />
                <Text style={styles.cancelDisclaimerText}>
                  The tutor will be informed of this slot release, and their scheduled capacity will update automatically.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.cancelModalActionsRow}>
              <TouchableOpacity
                style={styles.cancelKeepBookingBtn}
                onPress={() => setShowCancelModal(false)}
                disabled={cancellationSubmitting}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelKeepBookingBtnText}>Keep Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.cancelConfirmRefundBtn,
                  (cancellationReasonDetails.trim().length < 10 || cancellationSubmitting) &&
                    styles.cancelConfirmRefundBtnDisabled,
                ]}
                onPress={handleConfirmCancellation}
                disabled={cancellationReasonDetails.trim().length < 10 || cancellationSubmitting}
                activeOpacity={0.85}
              >
                {cancellationSubmitting ? (
                  <Text style={styles.cancelConfirmRefundBtnText}>Processing...</Text>
                ) : (
                  <>
                    <SvgTrash size={14} color="#FFFFFF" />
                    <Text style={styles.cancelConfirmRefundBtnText}>Confirm Cancel & Refund</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const navyDark = '#061E47';
const navyCard = '#0B2754';
const orangeVibrant = '#FBBF24';

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
    minHeight: 36,
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
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 11,
    alignItems: 'center',
  },
  alertActionBtnText: {
    color: '#061E47',
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
    color: '#061E47',
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
  findTutorPillBtn: {
    backgroundColor: '#FBBF24',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  findTutorBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  addModulePillBtn: {
    backgroundColor: orangeVibrant,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addModuleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Upcoming Bookings Section */
  bookingsSectionWrap: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  bookingsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  bookingsSectionTitle: {
    color: '#061E47',
    fontSize: 16,
    fontWeight: '800',
  },
  bookingsSectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  bookNewPillBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },
  bookNewPillBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  bookingsCardsScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  bookingCard: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  bookingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  groupBadgeText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '800',
  },
  oneOnOneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  oneOnOneBadgeText: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  statusConfirmedBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusConfirmedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusConfirmedText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },
  bookingCardTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  bookingCardTutor: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
  },
  bookingCardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
    marginBottom: 10,
  },
  bookingCardTimeText: {
    color: '#D97706',
    fontSize: 11.5,
    fontWeight: '700',
  },
  bookingCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  joinPodBtn: {
    flex: 1,
    backgroundColor: navyDark,
    borderRadius: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinPodBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  joinSessionBtn: {
    flex: 1,
    backgroundColor: navyDark,
    borderRadius: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podChatBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podChatBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '700',
  },
  viewBookingDetailsBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewBookingDetailsText: {
    color: '#0D4F9E',
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyPodsCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  emptyPodsTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyPodsSub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
  },
  emptyPodsBookBtn: {
    backgroundColor: orangeVibrant,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  emptyPodsBookBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  podSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  bookedPodCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  bookedPodTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookedPodMentorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  bookedPodSchedule: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  bookedPodChatBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookedPodChatText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#061E47',
  },

  /* Booking Card Price Row */
  bookingCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupPriceTagBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupPriceTagMain: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '900',
  },
  groupPriceTagSub: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
  },
  groupTotalSummaryText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },
  oneOnOnePriceTagBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  oneOnOnePriceTagMain: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '900',
  },
  oneOnOnePriceTagSub: {
    color: '#1D4ED8',
    fontSize: 10,
    fontWeight: '700',
  },
  oneOnOneSummaryText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Mentor Meta Chips Row */
  mentorMetaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mentorRatingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mentorRatingChipText: {
    color: '#92400E',
    fontSize: 10.5,
    fontWeight: '800',
  },
  mentorRateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  mentorRateChipText: {
    color: '#065F46',
    fontSize: 10.5,
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
    backgroundColor: orangeVibrant,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: 'center',
  },
  chatMentorBtnText: {
    color: '#061E47',
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
    color: '#061E47',
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
    backgroundColor: orangeVibrant,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  podJoinText: {
    color: '#061E47',
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
    color: '#061E47',
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
    color: '#061E47',
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
    backgroundColor: orangeVibrant,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  examBookMentorBtnText: {
    color: '#061E47',
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
    backgroundColor: orangeVibrant,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  calcScoreBtnText: {
    color: '#061E47',
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
    backgroundColor: orangeVibrant,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  downloadPdfBtnText: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '800',
  },
  switchRoleHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAA023',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  switchRoleHeaderBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#061E47',
  },
  tutorHeroAccessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  tutorHeroAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  tutorHeroAccessIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#061E47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorHeroAccessTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tutorHeroNewPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tutorHeroNewPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  tutorHeroAccessSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
  tutorHeroAccessArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  alertActionBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertActionBtnPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#061E47',
  },
  launchpadCardUnified: {
    width: '23%',
    height: 86,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    paddingVertical: 8,
  },
  launchpadIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  launchpadCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  studentWalletQuickCard: {
    backgroundColor: '#0F2B5C',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  studentWalletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  studentWalletIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentWalletTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  studentWalletActivePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  studentWalletActivePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34D399',
  },
  studentWalletSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  studentWalletRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  studentWalletBalanceVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#38BDF8',
  },
  studentWalletBalanceLbl: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  podCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 4,
  },
  podCancelBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  cancelModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    width: '100%',
    maxHeight: '90%',
  },
  cancelModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cancelModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cancelModalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  cancelModalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cancelModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  cancelSummaryTutorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cancelSummaryModule: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginTop: 1,
  },
  cancelSummaryTime: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
  },
  refundHighlightCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  refundHighlightTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refundHighlightTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#065F46',
  },
  refundHighlightAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  refundHighlightExpl: {
    fontSize: 11,
    color: '#047857',
    marginTop: 4,
  },
  refundBalancePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  refundBalancePreviewLbl: {
    fontSize: 10.5,
    color: '#475569',
    fontWeight: '600',
  },
  refundBalancePreviewVal: {
    fontSize: 11,
    color: '#0F172A',
    fontWeight: '700',
  },
  cancelReasonLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  reasonOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 7,
    gap: 10,
  },
  reasonOptionPillSelected: {
    borderColor: '#061E47',
    backgroundColor: '#EFF6FF',
  },
  reasonRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioOuterSelected: {
    borderColor: '#061E47',
  },
  reasonRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#061E47',
  },
  reasonOptionText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  reasonOptionTextSelected: {
    color: '#061E47',
    fontWeight: '700',
  },
  cancelCharCounter: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cancelReasonTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    fontSize: 12.5,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 65,
    marginTop: 4,
  },
  cancelValidationError: {
    fontSize: 10.5,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '600',
  },
  cancelDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 12,
    marginBottom: 6,
  },
  cancelDisclaimerText: {
    fontSize: 11,
    color: '#0369A1',
    flex: 1,
    lineHeight: 15,
  },
  cancelModalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelKeepBookingBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelKeepBookingBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  cancelConfirmRefundBtn: {
    flex: 2,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cancelConfirmRefundBtnDisabled: {
    backgroundColor: '#FDA4AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  cancelConfirmRefundBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

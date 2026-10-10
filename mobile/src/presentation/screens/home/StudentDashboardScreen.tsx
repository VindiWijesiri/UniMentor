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
  SvgClock,
  SvgAlertTriangle,
  SvgChevronRight,
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
    fetchDashboard,
    registerModule,
    assignMentor,
    dropModule,
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
  const [showPodsModal, setShowPodsModal] = useState(false);
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

      // 3. Update tutor dashboard slot
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
        `Your session with ${tutorName} has been cancelled successfully.\n\nRs. ${refundAmount.toLocaleString()} has been credited back to your UniMentor Campus Wallet.\n\nYour new Campus Wallet balance is Rs. ${refundResult.newBalance.toLocaleString()}.`
      );
    } catch (err: any) {
      Alert.alert('Cancellation Error', err?.message || 'Could not complete cancellation.');
    } finally {
      setCancellationSubmitting(false);
    }
  };

  // Register form state
  const [newModuleCode, setNewModuleCode] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [selectedFaculty] = useState('Computing');
  const [selectedDepartment] = useState('Software Engineering');
  const [selectedMentorForRegistration, setSelectedMentorForRegistration] = useState<EnrolledMentor | null>(null);

  // Study Pods State
  const [podsList, setPodsList] = useState<
    Array<{ id: string; name: string; module: string; peers: number; schedule: string }>
  >([
    { id: 'p-1', name: 'Algorithms & Graph Traversals Pod', module: 'IT2040', peers: 12, schedule: 'Today 4:00 PM' },
    { id: 'p-2', name: 'Software Architecture Revision Group', module: 'SE3020', peers: 8, schedule: 'Tomorrow 2:00 PM' },
    { id: 'p-3', name: 'Probability & Stats Exam Cram Pod', module: 'MA2010', peers: 15, schedule: 'Friday 5:00 PM' },
  ]);
  const [newPodName, setNewPodName] = useState('');

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
      _id: (mentor as any)._id || mentor.id || 'mentor-default',
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
      Alert.alert('Registration Successful', `Enrolled in ${newModuleName.trim()} with mentor ${mentor?.name || 'Assigned Mentor'}.`);
    } catch (err: any) {
      Alert.alert('Enrollment Notice', err.message || 'Unable to register module.');
    }
  };

  const handleSaveProgress = async () => {
    if (!editingModuleProgress) return;
    const num = Math.min(100, Math.max(0, parseInt(progressVal, 10) || 50));
    await updateModuleProgress(editingModuleProgress.code, num, nextSessionTopic.trim() || undefined);
    setEditingModuleProgress(null);
    Alert.alert('Progress Saved', `Updated ${editingModuleProgress.code} to ${num}%.`);
  };

  const handleCreatePod = () => {
    if (!newPodName.trim()) {
      Alert.alert('Required', 'Please enter a pod group name.');
      return;
    }
    const newPod = {
      id: `p-${Date.now()}`,
      name: newPodName.trim(),
      module: 'IT2040',
      peers: 1,
      schedule: 'Scheduled with peers',
    };
    setPodsList((prev) => [newPod, ...prev]);
    setNewPodName('');
    Alert.alert('Study Pod Created', `Your peer pod "${newPod.name}" is now active.`);
  };

  const handleSendRoomMessage = () => {
    if (!roomDraft.trim()) return;
    setRoomMessages((prev) => [...prev, `You: ${roomDraft.trim()}`]);
    setRoomDraft('');
  };

  const openModuleOptions = (module: EnrolledModule) => {
    Alert.alert(
      `${module.code}: ${module.name}`,
      'Manage this module enrollment',
      [
        {
          text: 'Update Progress',
          onPress: () => {
            setEditingModuleProgress(module);
            setProgressVal(String(module.progress || 60));
            setNextSessionTopic(module.nextSession || '');
          },
        },
        {
          text: 'Change Assigned Mentor',
          onPress: () => setShowChangeMentorModal(module),
        },
        {
          text: 'Unenroll Module',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Unenroll Module',
              `Are you sure you want to drop ${module.code} (${module.name})?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Unenroll', style: 'destructive', onPress: () => dropModule(module.code) },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const studentName = authUser?.name || dashboard?.user?.name || 'Nethmi Silva';
  const degreeProgramme = dashboard?.user?.degreeProgramme?.replace(/\n/g, ' ') || 'BSc (Hons) Software Engineering';
  const academicYear = dashboard?.user?.academicYear || 'Year 3';
  const semester = dashboard?.user?.semester || 'Sem 2';
  const liveSession = dashboard?.liveSession;
  const enrolledModules = dashboard?.enrolledModules || [];
  const availableMentors = dashboard?.availableMentors || [];

  // Identify next upcoming session (from bookedPods or liveSession)
  const nextSession = bookedPods.length > 0 ? bookedPods[0] : null;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Student Dashboard</Text>
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#061E47" />}
      >
        {/* ================= 1. HERO / NEXT UP FOCUS CARD ================= */}
        {nextSession ? (
          <View style={styles.nextCard}>
            <View style={styles.nextCardHeader}>
              <View style={styles.nextBadge}>
                <Ionicons name="sparkles" size={12} color="#D97706" />
                <Text style={styles.nextBadgeText}>UPCOMING SESSION</Text>
              </View>
              <View style={styles.nextTimeTag}>
                <SvgClock size={12} color="#0D4F9E" />
                <Text style={styles.nextTimeText}>{nextSession.nextSession}</Text>
              </View>
            </View>

            <Text style={styles.nextTitle} numberOfLines={1}>
              {nextSession.moduleCode ? `${nextSession.moduleCode}: ` : ''}{nextSession.moduleName}
            </Text>

            <View style={styles.nextTutorRow}>
              <TutorAvatar
                name={nextSession.mentor.name}
                imageUrl={nextSession.mentor.avatar}
                size={34}
                borderRadius={12}
                showOnlineDot
              />
              <View style={styles.nextTutorDetails}>
                <Text style={styles.nextTutorName}>{nextSession.mentor.name}</Text>
                <Text style={styles.nextTutorMeta}>
                  {nextSession.studyMode === 'group'
                    ? `Group Study Pod (${nextSession.groupSize || 3} Students)`
                    : '1-on-1 Mentoring'}
                </Text>
              </View>
            </View>

            <View style={styles.nextActionsRow}>
              <TouchableOpacity
                style={styles.nextJoinBtn}
                activeOpacity={0.85}
                onPress={() => {
                  (navigation as any).navigate('Bookings', { screen: 'SessionsList' });
                }}
              >
                <SvgVideocam size={14} color="#FFFFFF" />
                <Text style={styles.nextJoinBtnText}>Join Session</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextChatBtn}
                activeOpacity={0.85}
                onPress={() => {
                  const mentorEntity = {
                    _id: nextSession.mentor.id || 'mentor-default',
                    name: nextSession.mentor.name,
                    email: nextSession.mentor.email || `${nextSession.mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
                    bio: nextSession.mentor.bio || 'Peer Mentor',
                    subjects: nextSession.mentor.subjects || [nextSession.moduleName],
                    rating: nextSession.mentor.rating || 4.9,
                    reviewCount: nextSession.mentor.reviewCount || 25,
                    profilePicture: nextSession.mentor.avatar,
                    role: 'mentor' as const,
                  };
                  navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()?.navigate('Chat', {
                    mentor: mentorEntity,
                  });
                }}
              >
                <SvgChat size={14} color="#061E47" />
                <Text style={styles.nextChatBtnText}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.nextCancelBtn}
                activeOpacity={0.85}
                onPress={() => handleInitiateCancelBooking(nextSession)}
              >
                <SvgTrash size={14} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        ) : liveSession ? (
          <View style={styles.liveBannerCard}>
            <View style={styles.liveBannerHeader}>
              <View style={styles.livePulsePill}>
                <View style={styles.livePulseDot} />
                <Text style={styles.livePulseText}>LIVE NOW</Text>
              </View>
              <Text style={styles.liveTimeRemaining}>{liveSession.timeRemaining}</Text>
            </View>
            <Text style={styles.liveBannerTitle}>{liveSession.title}</Text>
            <Text style={styles.liveBannerSub}>with {liveSession.mentor.name}</Text>
            <TouchableOpacity
              style={styles.liveBannerBtn}
              activeOpacity={0.85}
              onPress={() => {
                if (bookedPods.length > 0 && !activePodSession) {
                  setActivePodSession(bookedPods[0]);
                }
                setShowLiveRoom(true);
              }}
            >
              <SvgVideocam size={14} color="#061E47" />
              <Text style={styles.liveBannerBtnText}>Enter Live Room</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyHeroCard}>
            <View style={styles.emptyHeroIconWrap}>
              <Ionicons name="school-outline" size={24} color="#0D4F9E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyHeroTitle}>Find Your Peer Mentor</Text>
              <Text style={styles.emptyHeroSub}>Get 1-on-1 tutoring or join a study pod.</Text>
            </View>
            <TouchableOpacity
              style={styles.emptyHeroBtn}
              onPress={() => (navigation as any).navigate('Bookings', { screen: 'FindMentor' })}
            >
              <Text style={styles.emptyHeroBtnText}>Find Tutor</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= 2. QUICK ACTIONS (CLEAR 4 TILES) ================= */}
        <View style={styles.quickNavRow}>
          <TouchableOpacity
            style={styles.quickNavTile}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('Bookings', { screen: 'FindMentor' })}
          >
            <View style={[styles.quickNavIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="search" size={18} color="#1D4ED8" />
            </View>
            <Text style={styles.quickNavLabel}>Find Mentor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavTile}
            activeOpacity={0.8}
            onPress={() => (navigation as any).navigate('Bookings', { screen: 'SessionsList' })}
          >
            <View style={[styles.quickNavIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="calendar-outline" size={18} color="#059669" />
            </View>
            <Text style={styles.quickNavLabel}>My Sessions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavTile}
            activeOpacity={0.8}
            onPress={() => setShowPodsModal(true)}
          >
            <View style={[styles.quickNavIconCircle, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="people-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.quickNavLabel}>Study Pods</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickNavTile}
            activeOpacity={0.8}
            onPress={() => {
              const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
              if (parent) {
                parent.navigate('GuidanceWizard', { fromTab: 'Home' });
              } else {
                (navigation as any).navigate('GuidanceWizard', { fromTab: 'Home' });
              }
            }}
          >
            <View style={[styles.quickNavIconCircle, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="compass-outline" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.quickNavLabel}>Guidance</Text>
          </TouchableOpacity>
        </View>

        {/* ================= 3. ENROLLED MODULES ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Enrolled Modules</Text>
              <Text style={styles.sectionSub}>{enrolledModules.length} Active Courses</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionActionPill}
              activeOpacity={0.8}
              onPress={() => setShowRegisterModal(true)}
            >
              <Ionicons name="add" size={14} color="#061E47" />
              <Text style={styles.sectionActionPillText}>Enroll</Text>
            </TouchableOpacity>
          </View>

          {enrolledModules.map((item) => (
            <View key={item.code} style={styles.moduleCard}>
              <View style={styles.moduleCardHeader}>
                <View style={styles.moduleCodeBadge}>
                  <Text style={styles.moduleCodeText}>{item.code}</Text>
                </View>
                <Text style={styles.moduleName} numberOfLines={1}>
                  {item.name}
                </Text>
                <TouchableOpacity
                  style={styles.moduleMoreBtn}
                  onPress={() => openModuleOptions(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="ellipsis-horizontal" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Clean Slim Progress Bar */}
              <TouchableOpacity
                style={styles.progressWrap}
                onPress={() => {
                  setEditingModuleProgress(item);
                  setProgressVal(String(item.progress || 60));
                  setNextSessionTopic(item.nextSession || '');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${item.progress || 60}%` }]} />
                </View>
                <Text style={styles.progressText}>{item.progress || 60}%</Text>
              </TouchableOpacity>

              {/* Mentor Row & Quick Actions */}
              <View style={styles.moduleFooterRow}>
                {item.mentor ? (
                  <View style={styles.moduleTutorRow}>
                    <TutorAvatar
                      name={item.mentor.name}
                      imageUrl={item.mentor.avatar}
                      size={24}
                      borderRadius={8}
                    />
                    <Text style={styles.moduleTutorName} numberOfLines={1}>
                      {item.mentor.name}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setShowChangeMentorModal(item)}
                    style={styles.assignTutorLink}
                  >
                    <Text style={styles.assignTutorLinkText}>+ Assign Mentor</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.moduleButtonRow}>
                  {item.mentor && (
                    <TouchableOpacity
                      style={styles.moduleChatBtn}
                      onPress={() => handleOpenChat(item.mentor!)}
                      activeOpacity={0.8}
                    >
                      <SvgChat size={12} color="#0D4F9E" />
                      <Text style={styles.moduleChatBtnText}>Chat</Text>
                    </TouchableOpacity>
                  )}

                  {item.mentor && (
                    <TouchableOpacity
                      style={styles.moduleBookBtn}
                      activeOpacity={0.8}
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
                      <Text style={styles.moduleBookBtnText}>Book</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* ================= 4. ALL UPCOMING SESSIONS LIST ================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Booked Sessions</Text>
              <Text style={styles.sectionSub}>{bookedPods.length} Confirmed</Text>
            </View>
            <TouchableOpacity
              style={styles.sectionActionPill}
              activeOpacity={0.8}
              onPress={() => (navigation as any).navigate('Bookings', { screen: 'FindMentor' })}
            >
              <Ionicons name="search" size={13} color="#061E47" />
              <Text style={styles.sectionActionPillText}>Book New</Text>
            </TouchableOpacity>
          </View>

          {bookedPods.length > 0 ? (
            bookedPods.map((item) => {
              const isGroup = item.studyMode === 'group';
              const rate = item.mentor.hourlyRate || (isGroup ? 1200 : 2500);

              return (
                <View key={item.id} style={styles.bookingRowCard}>
                  <View style={styles.bookingRowTop}>
                    <View style={styles.bookingModeTag}>
                      <Ionicons
                        name={isGroup ? 'people' : 'person'}
                        size={12}
                        color={isGroup ? '#059669' : '#1D4ED8'}
                      />
                      <Text
                        style={[
                          styles.bookingModeTagText,
                          { color: isGroup ? '#059669' : '#1D4ED8' },
                        ]}
                      >
                        {isGroup ? `Pod (${item.groupSize || 3})` : '1-on-1'}
                      </Text>
                    </View>
                    <Text style={styles.bookingRowTime}>{item.nextSession}</Text>
                  </View>

                  <Text style={styles.bookingRowTitle} numberOfLines={1}>
                    {item.moduleCode ? `${item.moduleCode}: ` : ''}{item.moduleName}
                  </Text>

                  <View style={styles.bookingRowFooter}>
                    <View style={styles.bookingTutorMeta}>
                      <TutorAvatar
                        name={item.mentor.name}
                        imageUrl={item.mentor.avatar}
                        size={22}
                        borderRadius={6}
                      />
                      <Text style={styles.bookingTutorName} numberOfLines={1}>
                        {item.mentor.name}
                      </Text>
                      <Text style={styles.bookingPriceTag}>• LKR {rate.toLocaleString()}</Text>
                    </View>

                    <View style={styles.bookingRowActions}>
                      <TouchableOpacity
                        style={styles.bookingJoinBtn}
                        onPress={() => {
                          (navigation as any).navigate('Bookings', { screen: 'SessionsList' });
                        }}
                      >
                        <Text style={styles.bookingJoinBtnText}>Join</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.bookingCancelBtn}
                        onPress={() => handleInitiateCancelBooking(item)}
                      >
                        <Text style={styles.bookingCancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyBookingsCard}>
              <Ionicons name="calendar-outline" size={28} color="#94A3B8" />
              <Text style={styles.emptyBookingsText}>No sessions scheduled yet</Text>
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('Bookings', { screen: 'FindMentor' })}
              >
                <Text style={styles.emptyBookingsLink}>Find a mentor to book your first session →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ================= REGISTER NEW MODULE MODAL ================= */}
      <Modal visible={showRegisterModal} animationType="slide" transparent onRequestClose={() => setShowRegisterModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowRegisterModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Register New Module</Text>
            <Text style={styles.sheetSubheading}>
              Select a module from your curriculum and pair with a peer mentor.
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
            <Text style={styles.sheetSubheading}>Choose from available senior peer mentors.</Text>

            <ScrollView style={{ maxHeight: 320, marginVertical: 8 }}>
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
                  <TutorAvatar name={m.name} imageUrl={m.avatar} size={40} borderRadius={14} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.mentorCardName}>{m.name}</Text>
                    <Text style={styles.mentorCardRole}>{m.roleTitle || 'Peer Mentor'}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#059669', marginTop: 2 }}>
                      ★ {m.rating || 4.9} • LKR {(m.hourlyRate || 1800).toLocaleString()}/hr
                    </Text>
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
            <Text style={styles.sheetHeading}>Update Progress: {editingModuleProgress?.code}</Text>
            <Text style={styles.sheetSubheading}>Track your syllabus completion status.</Text>

            <Text style={styles.inputLabel}>Completion ({progressVal}%)</Text>
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

            <Text style={styles.inputLabel}>Next Revision Topic (Optional)</Text>
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

      {/* ================= PODS MODAL ================= */}
      <Modal visible={showPodsModal} animationType="slide" transparent onRequestClose={() => setShowPodsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPodsModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Study Pods</Text>
            <Text style={styles.sheetSubheading}>Collaborative peer revision groups.</Text>

            {/* Create Pod */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                placeholder="Pod group name (e.g. SE Revision)..."
                placeholderTextColor="#94A3B8"
                value={newPodName}
                onChangeText={setNewPodName}
              />
              <TouchableOpacity style={styles.smallAddBtn} onPress={handleCreatePod}>
                <Text style={styles.smallAddBtnText}>Create</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 240 }}>
              {podsList.map((pod) => (
                <View key={pod.id} style={styles.podCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.podName}>{pod.name}</Text>
                    <Text style={styles.podMeta}>{pod.module} • {pod.peers} Peers • {pod.schedule}</Text>
                  </View>
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
                    <Text style={styles.podJoinText}>Join</Text>
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

            <View style={styles.cancelModalHeaderRow}>
              <View style={styles.cancelModalHeaderLeft}>
                <View style={styles.cancelModalIconWrap}>
                  <SvgAlertTriangle size={18} color="#DC2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cancelModalTitle}>Cancel Booking</Text>
                  <Text style={styles.cancelModalSub}>
                    Instant 100% refund to Campus Wallet
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

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Refund Notice Box */}
              {cancellingBooking && (
                <View style={styles.refundHighlightCard}>
                  <View style={styles.refundHighlightTopRow}>
                    <Text style={styles.refundHighlightTitle}>Wallet Refund Amount</Text>
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
                    Credited immediately back to your UniMentor Campus Wallet.
                  </Text>
                </View>
              )}

              {/* Reason Selector */}
              <Text style={styles.cancelReasonLabel}>REASON FOR CANCELLATION</Text>
              {[
                'Timetable / Lecture clash',
                'Coursework or exam rescheduled',
                'Medical / Personal reason',
                'Found alternative peer group',
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

              {/* Detailed Explanation */}
              <View style={{ marginTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cancelReasonLabel}>EXPLANATION (MIN 10 CHARS)</Text>
                  <Text
                    style={[
                      styles.cancelCharCounter,
                      cancellationReasonDetails.trim().length < 10 ? { color: '#EF4444' } : { color: '#059669' },
                    ]}
                  >
                    {cancellationReasonDetails.trim().length}/10
                  </Text>
                </View>
                <TextInput
                  style={styles.cancelReasonTextInput}
                  placeholder="Explain why you are cancelling..."
                  placeholderTextColor="#94A3B8"
                  value={cancellationReasonDetails}
                  onChangeText={setCancellationReasonDetails}
                  multiline
                  numberOfLines={2}
                />
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
                <Text style={styles.cancelKeepBookingBtnText}>Keep Session</Text>
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
                <Text style={styles.cancelConfirmRefundBtnText}>
                  {cancellationSubmitting ? 'Processing...' : 'Confirm Cancel & Refund'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= LIVE ROOM MODAL ================= */}
      <Modal visible={showLiveRoom} animationType="slide" transparent={false} onRequestClose={() => setShowLiveRoom(false)}>
        <View style={[styles.modalScreen, { paddingTop: insets.top }]}>
          <View style={styles.roomHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomTitle} numberOfLines={1}>
                {activePodSession?.moduleName || 'Live Study Session'}
              </Text>
              <Text style={styles.roomSubtitle} numberOfLines={1}>
                Host: {activePodSession?.mentor.name || 'Peer Mentor'}
              </Text>
            </View>
            <TouchableOpacity style={styles.leaveRoomBtn} onPress={() => setShowLiveRoom(false)}>
              <Text style={styles.leaveRoomText}>Leave</Text>
            </TouchableOpacity>
          </View>

          {/* Main Stage Simulation */}
          <View style={styles.videoStage}>
            {activePodSession?.mentor.avatar ? (
              <Image source={{ uri: activePodSession.mentor.avatar }} style={styles.stageHostVideo} />
            ) : (
              <View style={[styles.stageHostVideo, { backgroundColor: '#0A2540', alignItems: 'center', justifyContent: 'center' }]}>
                <TutorAvatar name={activePodSession?.mentor.name || 'Peer Mentor'} size={80} borderRadius={40} />
              </View>
            )}
            <View style={styles.stageOverlay}>
              <Text style={styles.stageHostTag}>{activePodSession?.mentor.name || 'Host'} (Live)</Text>
            </View>

            {/* Student preview */}
            <View style={styles.peerThumb}>
              {!isCameraOff && cameraPermission?.granted ? (
                <View style={[StyleSheet.absoluteFill, { borderRadius: 12, overflow: 'hidden' }]}>
                  <CameraView style={StyleSheet.absoluteFill} facing="front" />
                </View>
              ) : (
                <Text style={styles.peerThumbText}>Cam Off</Text>
              )}
            </View>
          </View>

          {/* Controls */}
          <View style={styles.roomControlsBar}>
            <TouchableOpacity style={styles.controlBtn} onPress={handleToggleRoomMic}>
              <Ionicons name={isMicMuted ? 'mic-off' : 'mic'} size={20} color={isMicMuted ? '#EF4444' : '#FFFFFF'} />
              <Text style={styles.controlBtnLabel}>{isMicMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={handleToggleRoomCamera}>
              <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={20} color={isCameraOff ? '#EF4444' : '#FFFFFF'} />
              <Text style={styles.controlBtnLabel}>{isCameraOff ? 'Cam On' : 'Cam Off'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => Alert.alert('Hand Raised', 'Mentor notified.')}
            >
              <Ionicons name="hand-right" size={20} color="#FFFFFF" />
              <Text style={styles.controlBtnLabel}>Raise</Text>
            </TouchableOpacity>
          </View>

          {/* Chat */}
          <View style={styles.roomChatContainer}>
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
                placeholder="Ask in the room..."
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContainer: {
    paddingBottom: 28,
  },

  /* Header */
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

  /* Hero / Next Session Focus Card */
  nextCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  nextCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  nextBadgeText: {
    color: '#B45309',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  nextTimeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextTimeText: {
    color: '#0D4F9E',
    fontSize: 11.5,
    fontWeight: '700',
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  nextTutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 12,
  },
  nextTutorDetails: {
    flex: 1,
  },
  nextTutorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  nextTutorMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  nextActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextJoinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#061E47',
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextJoinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nextChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  nextChatBtnText: {
    color: '#061E47',
    fontSize: 12.5,
    fontWeight: '700',
  },
  nextCancelBtn: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Live Session Fallback Banner */
  liveBannerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  liveBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  livePulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  livePulseText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '800',
  },
  liveTimeRemaining: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  liveBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveBannerSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  liveBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FBBF24',
    paddingVertical: 9,
    borderRadius: 10,
  },
  liveBannerBtnText: {
    color: '#061E47',
    fontSize: 12.5,
    fontWeight: '800',
  },

  /* Empty Hero Banner */
  emptyHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  emptyHeroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyHeroSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  emptyHeroBtn: {
    backgroundColor: '#061E47',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  emptyHeroBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Quick Actions Row (Clear 4 Tiles) */
  quickNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
  },
  quickNavTile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginHorizontal: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickNavIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickNavLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },

  /* Sections */
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  sectionActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionActionPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#061E47',
  },

  /* Module Card (Streamlined) */
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  moduleCodeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moduleCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
  },
  moduleName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  moduleMoreBtn: {
    padding: 4,
  },
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D4F9E',
    borderRadius: 2.5,
  },
  progressText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    minWidth: 28,
    textAlign: 'right',
  },
  moduleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  moduleTutorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  moduleTutorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  assignTutorLink: {
    flex: 1,
  },
  assignTutorLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  moduleButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  moduleChatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  moduleBookBtn: {
    backgroundColor: '#061E47',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  moduleBookBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Bookings Row Card (Streamlined) */
  bookingRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bookingModeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingModeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bookingRowTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  bookingRowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  bookingRowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingTutorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bookingTutorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  bookingPriceTag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bookingRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingJoinBtn: {
    backgroundColor: '#061E47',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bookingJoinBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  bookingCancelBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bookingCancelBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBookingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  emptyBookingsText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBookingsLink: {
    fontSize: 12,
    color: '#0D4F9E',
    fontWeight: '700',
    marginTop: 2,
  },

  /* Modals Common */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 19, 43, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeading: {
    color: '#0F172A',
    fontSize: 17,
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
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  quickPickChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
  },
  quickPickChipActive: {
    backgroundColor: '#061E47',
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
    width: 76,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  mentorPickCardActive: {
    borderColor: '#061E47',
    backgroundColor: '#EFF6FF',
  },
  mentorPickAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#FBBF24',
    fontWeight: '700',
  },
  confirmModalBtn: {
    backgroundColor: '#061E47',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  confirmModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  closeSheetBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  closeSheetBtnText: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '700',
  },
  changeMentorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  mentorCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  mentorCardRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  selectMentorPill: {
    backgroundColor: '#061E47',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  chipsWrap: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  smallChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallChipActive: {
    backgroundColor: '#061E47',
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
    backgroundColor: '#061E47',
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  podCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  podName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  podMeta: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  podJoinBtn: {
    backgroundColor: '#061E47',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  podJoinText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Cancel Modal */
  cancelModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  cancelModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cancelModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cancelModalIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cancelModalSub: {
    fontSize: 11,
    color: '#64748B',
  },
  cancelModalCloseBtn: {
    padding: 4,
  },
  refundHighlightCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
  },
  refundHighlightTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  refundHighlightTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#065F46',
  },
  refundHighlightAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  refundHighlightExpl: {
    fontSize: 10.5,
    color: '#047857',
    marginTop: 2,
  },
  cancelReasonLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  reasonOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
    gap: 8,
  },
  reasonOptionPillSelected: {
    borderColor: '#061E47',
    backgroundColor: '#EFF6FF',
  },
  reasonRadioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonRadioOuterSelected: {
    borderColor: '#061E47',
  },
  reasonRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#061E47',
  },
  reasonOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  reasonOptionTextSelected: {
    color: '#061E47',
    fontWeight: '700',
  },
  cancelCharCounter: {
    fontSize: 10,
    fontWeight: '700',
  },
  cancelReasonTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    fontSize: 12,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 50,
    marginTop: 2,
  },
  cancelModalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  cancelKeepBookingBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelKeepBookingBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  cancelConfirmRefundBtn: {
    flex: 2,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelConfirmRefundBtnDisabled: {
    backgroundColor: '#FDA4AF',
  },
  cancelConfirmRefundBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* Live Room Modal */
  modalScreen: {
    flex: 1,
    backgroundColor: '#061E47',
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  roomTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  roomSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  leaveRoomBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  leaveRoomText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  videoStage: {
    height: 220,
    backgroundColor: '#0B2754',
    marginHorizontal: 14,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  stageHostVideo: {
    width: '100%',
    height: '100%',
  },
  stageOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageHostTag: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  peerThumb: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 65,
    height: 90,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  peerThumbText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
  },
  roomControlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#0B2754',
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 12,
  },
  controlBtn: {
    alignItems: 'center',
  },
  controlBtnLabel: {
    color: '#CBD5E1',
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 2,
  },
  roomChatContainer: {
    flex: 1,
    backgroundColor: '#0B2754',
    margin: 14,
    borderRadius: 14,
    padding: 10,
  },
  roomChatScroll: {
    flex: 1,
  },
  roomMessageBubble: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 7,
    marginBottom: 5,
  },
  roomMessageText: {
    color: '#E2E8F0',
    fontSize: 11.5,
  },
  roomInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  roomInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 11.5,
  },
  roomSendBtn: {
    backgroundColor: '#FBBF24',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roomSendBtnText: {
    color: '#061E47',
    fontSize: 11.5,
    fontWeight: '700',
  },
});

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../../domain/stores/authStore';
import { useStudentStore } from '../../../domain/stores/studentStore';
import type { EnrolledMentor, EnrolledModule } from '../../../domain/entities/StudentDashboard';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { bookedTutorsRepository, BookedTutorItem } from '../../../data/repositories/bookedTutorsRepository';
import { paymentRepository } from '../../../data/repositories/paymentRepository';
import { tutorSlotRepository } from '../../../data/repositories/tutorSlotRepository';
import {
  SvgTrash,
  SvgClose,
  SvgCheckCircle,
  SvgWallet,
  SvgClock,
  SvgAlertTriangle,
  SvgChevronRight,
  SvgVideocam,
  SvgChat,
} from '../../components/common/SvgIcons';
import { Ionicons } from '@expo/vector-icons';
import TutorAvatar from '../../components/common/TutorAvatar';

type FacultyFilter = 'all' | 'Computing' | 'Engineering' | 'Business' | 'Architecture';
type ViewMode = 'tutors' | 'modules';

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { dashboard, loading, fetchDashboard } = useStudentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyFilter>('all');
  const [bookedTutors, setBookedTutors] = useState<BookedTutorItem[]>([]);

  // Two tabs: 'tutors' (Booked Tutors) and 'modules' (Registered Modules) - NO side-by-side dual
  const [activeViewMode, setActiveViewMode] = useState<ViewMode>('tutors');

  // Join session modal state
  const [joiningSessionTutor, setJoiningSessionTutor] = useState<BookedTutorItem | null>(null);
  const [showJoinSessionModal, setShowJoinSessionModal] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const handleOpenJoinSessionModal = (item: BookedTutorItem) => {
    setJoiningSessionTutor(item);
    setIsMicMuted(false);
    setIsVideoOff(false);
    setShowJoinSessionModal(true);
  };

  // Cancellation & Wallet Refund state
  const authUser = useAuthStore((state) => state.user);
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

      // 4. Reload local booked tutors
      await loadBookedTutors();

      setShowCancelModal(false);
      const tutorName = cancellingBooking.mentor.name;
      setCancellingBooking(null);
      setCancellationReasonDetails('');

      Alert.alert(
        'Booking Cancelled & Refunded! 💰',
        `Your session with ${tutorName} has been cancelled successfully.\n\nRs. ${refundAmount.toLocaleString()} has been credited back to your UniMentor Campus Wallet.\n\nYour new Campus Wallet balance is Rs. ${refundResult.newBalance.toLocaleString()}. The tutor's schedule has been freed up.`
      );
    } catch (err: any) {
      Alert.alert('Cancellation Error', err?.message || 'Could not complete cancellation.');
    } finally {
      setCancellationSubmitting(false);
    }
  };

  useEffect(() => {
    if (!dashboard) {
      fetchDashboard();
    }
  }, [dashboard, fetchDashboard]);

  const enrolledModules = useMemo(() => {
    return dashboard?.enrolledModules || [];
  }, [dashboard]);

  // Load booked tutors from repository & sync with enrolled modules
  const loadBookedTutors = useCallback(async () => {
    try {
      const items = await bookedTutorsRepository.getBookedTutors();

      // Ensure any tutor already assigned in enrolledModules is included
      const currentIds = new Set(items.map((b) => (b.mentor.id || b.mentor.name).toLowerCase()));
      let hasNew = false;

      for (const m of enrolledModules) {
        if (m.mentor && m.mentor.name) {
          const key = (m.mentor.id || m.mentor.name).toLowerCase();
          if (!currentIds.has(key)) {
            currentIds.add(key);
            const newItem: BookedTutorItem = {
              id: `module-assigned-${m.mentor.id || m.mentor.name}`,
              mentor: {
                id: m.mentor.id || m.mentor.name,
                name: m.mentor.name,
                roleTitle: m.mentor.roleTitle || 'Senior Peer Mentor',
                avatar: m.mentor.avatar,
                rating: m.mentor.rating || 4.9,
                reviewCount: m.mentor.reviewCount || 25,
                hourlyRate: m.mentor.hourlyRate || 1800,
                subjects: [m.name],
              },
              moduleCode: m.code,
              moduleName: m.name,
              nextSession: m.nextSession || 'Weekly session scheduled',
              studyMode: '1-on-1',
              bookedAt: new Date().toISOString(),
            };
            await bookedTutorsRepository.addBookedTutor(newItem);
            hasNew = true;
          }
        }
      }

      const refreshed = hasNew ? await bookedTutorsRepository.getBookedTutors() : items;
      setBookedTutors(refreshed);
    } catch (e) {
      console.warn('Failed to load booked tutors:', e);
    }
  }, [enrolledModules]);

  useEffect(() => {
    loadBookedTutors();
    const unsubscribe = bookedTutorsRepository.subscribe((updated) => {
      setBookedTutors(updated);
    });
    return unsubscribe;
  }, [loadBookedTutors]);

  useFocusEffect(
    useCallback(() => {
      loadBookedTutors();
    }, [loadBookedTutors])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchDashboard(), loadBookedTutors()]);
    setRefreshing(false);
  };

  // Filtered modules
  const filteredModules = useMemo(() => {
    let list = enrolledModules;

    if (selectedFaculty !== 'all') {
      list = list.filter(
        (m) => m.faculty?.toLowerCase() === selectedFaculty.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => {
        const code = m.code?.toLowerCase() || '';
        const name = m.name?.toLowerCase() || '';
        const faculty = m.faculty?.toLowerCase() || '';
        const dept = m.department?.toLowerCase() || '';
        const mentorName = m.mentor?.name?.toLowerCase() || '';
        const nextTopic = m.nextSession?.toLowerCase() || '';
        return (
          code.includes(q) ||
          name.includes(q) ||
          faculty.includes(q) ||
          dept.includes(q) ||
          mentorName.includes(q) ||
          nextTopic.includes(q)
        );
      });
    }

    return list;
  }, [enrolledModules, selectedFaculty, searchQuery]);

  // Statistics
  const totalCredits = useMemo(() => {
    return enrolledModules.reduce((acc, m) => acc + (m.credits || 3), 0);
  }, [enrolledModules]);

  const avgProgress = useMemo(() => {
    if (enrolledModules.length === 0) return 0;
    const sum = enrolledModules.reduce((acc, m) => acc + (m.progress || 0), 0);
    return Math.round(sum / enrolledModules.length);
  }, [enrolledModules]);

  const handleViewTutorProfile = (mentor: EnrolledMentor | BookedTutorItem['mentor']) => {
    const mentorEntity = {
      _id: mentor.id || 'mentor-default',
      name: mentor.name,
      email: mentor.email || `${mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
      bio: mentor.bio || `${mentor.roleTitle || 'Mentor'} specializing in peer academic support.`,
      subjects: mentor.subjects || ['Academic Guidance'],
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      profilePicture: mentor.avatar,
      role: 'mentor' as const,
    };

    navigation.navigate('TutorProfile', {
      mentor: mentorEntity,
    });
  };

  const handleOpenChat = (mentor: EnrolledMentor | BookedTutorItem['mentor']) => {
    const mentorEntity = {
      _id: mentor.id || 'mentor-default',
      name: mentor.name,
      email: mentor.email || `${mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
      bio: mentor.bio || 'Peer Mentor',
      subjects: mentor.subjects || ['Academic Guidance'],
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      profilePicture: mentor.avatar,
      role: 'mentor' as const,
    };

    navigation.navigate('Chat', {
      mentor: mentorEntity,
    });
  };

  const handleFindTutorForModule = (moduleItem: EnrolledModule) => {
    (navigation as any).navigate('FindMentor', {
      initialQuery: moduleItem.code || moduleItem.name,
      faculty: moduleItem.faculty,
      department: moduleItem.department,
    });
  };

  return (
    <View style={styles.screen}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      {/* Main Content List */}
      <FlatList
        data={activeViewMode === 'modules' ? filteredModules : []}
        keyExtractor={(item) => item.code}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 24 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#061E47" />
        }
        ListHeaderComponent={
          <View style={styles.belowHeaderSection}>
            {/* Top Subtitle & Find New Tutor Row */}
            <View style={styles.belowHeaderTopRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.belowHeaderSubtitle}>
                  Manage your booked tutors and registered university modules
                </Text>
              </View>
              <TouchableOpacity
                style={styles.findNewTutorBtn}
                onPress={() => (navigation as any).navigate('FindMentor')}
                activeOpacity={0.85}
              >
                <Ionicons name="search" size={13} color="#061E47" />
                <Text style={styles.findNewTutorBtnText}>Find New Tutor</Text>
              </TouchableOpacity>
            </View>

            {/* TABS: One side Booked Tutors, other side Registered Modules (NO side-by-side dual) */}
            <View style={styles.viewModeSelector}>
              <TouchableOpacity
                style={[styles.viewModeBtn, activeViewMode === 'tutors' && styles.viewModeBtnActive]}
                onPress={() => setActiveViewMode('tutors')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="people"
                  size={15}
                  color={activeViewMode === 'tutors' ? '#061E47' : '#64748B'}
                />
                <Text
                  style={[styles.viewModeBtnText, activeViewMode === 'tutors' && styles.viewModeBtnTextActive]}
                >
                  Booked Tutors ({bookedTutors.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewModeBtn, activeViewMode === 'modules' && styles.viewModeBtnActive]}
                onPress={() => setActiveViewMode('modules')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="book"
                  size={15}
                  color={activeViewMode === 'modules' ? '#061E47' : '#64748B'}
                />
                <Text
                  style={[styles.viewModeBtnText, activeViewMode === 'modules' && styles.viewModeBtnTextActive]}
                >
                  Registered Modules ({enrolledModules.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* ================================================================= */}
            {/* VIEW MODE 2: BOOKED TUTORS ONLY (FULL WIDTH WITH JOIN SESSION) */}
            {/* ================================================================= */}
            {activeViewMode === 'tutors' && (
              <View style={styles.bookedTutorsFullSection}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={styles.sectionHeaderIconWrap}>
                      <Ionicons name="people" size={15} color="#061E47" />
                    </View>
                    <View>
                      <Text style={styles.bookedTutorsBarTitle}>Booked Tutors</Text>
                      <Text style={styles.bookedTutorsBarSub}>Active peer mentors & tutors</Text>
                    </View>
                  </View>
                  <View style={styles.bookedTutorsCountBadge}>
                    <Text style={styles.bookedTutorsCountBadgeText}>
                      {bookedTutors.length} Active
                    </Text>
                  </View>
                </View>

                {bookedTutors.length > 0 ? (
                  bookedTutors.map((bt) => (
                    <View key={bt.mentor.id || bt.mentor.name} style={styles.bookedTutorFullCard}>
                      {/* Top Row: Avatar & Name */}
                      <View style={styles.tutorCardTopPart}>
                        <TutorAvatar
                          name={bt.mentor.name}
                          imageUrl={bt.mentor.avatar}
                          size={50}
                          borderRadius={18}
                          showOnlineDot
                        />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.bookedTutorPillName} numberOfLines={1}>
                              {bt.mentor.name}
                            </Text>
                            <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginLeft: 3 }} />
                          </View>
                          <Text style={styles.bookedTutorPillRole} numberOfLines={1}>
                            {bt.mentor.roleTitle || 'Senior Peer Mentor'}
                          </Text>
                          <View style={styles.bookedTutorBadgeRow}>
                            <Text style={styles.bookedTutorBadgeText} numberOfLines={1}>
                              {bt.moduleCode} • {bt.moduleName}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Stats Row */}
                      <View style={styles.tutorCardStatsMini}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="pricetag" size={11} color="#065F46" />
                          <Text style={styles.tutorRateHighlight}>
                            LKR {(bt.mentor.hourlyRate || 1800).toLocaleString()}/hr
                          </Text>
                        </View>
                        <View style={styles.tutorStatsDivider} />
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                          <Ionicons name="star" size={12} color="#F59E0B" />
                          <Text style={styles.tutorRatingHighlight}>
                            {bt.mentor.rating || 4.9}
                          </Text>
                          <Text style={styles.tutorReviewCountMini}>
                            ({bt.mentor.reviewCount || 25})
                          </Text>
                        </View>
                      </View>

                      {/* Next Session indicator */}
                      <View style={styles.tutorNextSessionBadge}>
                        <Ionicons name="calendar-outline" size={12} color="#B45309" />
                        <Text style={styles.tutorNextSessionBadgeText} numberOfLines={1}>
                          Next: {bt.nextSession || 'Weekly session scheduled'}
                        </Text>
                      </View>

                      {/* Action Buttons Row including Join Session */}
                      <View style={styles.tutorCardActionRow}>
                        <TouchableOpacity
                          style={styles.tutorJoinActionBtn}
                          onPress={() => handleOpenJoinSessionModal(bt)}
                          activeOpacity={0.85}
                        >
                          <SvgVideocam size={13} color="#FFFFFF" />
                          <Text style={styles.tutorJoinActionBtnText}>Join Session</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.tutorChatActionBtn}
                          onPress={() => handleOpenChat(bt.mentor)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="chatbubbles-outline" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                          <Text style={styles.tutorChatActionBtnText}>Chat</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.tutorProfileActionBtn}
                          onPress={() => handleViewTutorProfile(bt.mentor)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="person-outline" size={13} color="#061E47" style={{ marginRight: 3 }} />
                          <Text style={styles.tutorProfileActionBtnText}>Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.tutorCancelActionBtn}
                          onPress={() => handleInitiateCancelBooking(bt)}
                          activeOpacity={0.85}
                        >
                          <SvgTrash size={12} color="#DC2626" />
                          <Text style={styles.tutorCancelActionBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyBookedTutorsBox}>
                    <Text style={styles.emptyBookedTutorsText}>
                      No tutors booked yet. Connect with verified peer mentors for your modules.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* ================================================================= */}
            {/* VIEW MODE 3: MODULES HEADER (ONLY SHOWN IN MODULES MODE) */}
            {/* ================================================================= */}
            {activeViewMode === 'modules' && (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                    <View style={styles.sectionHeaderIconWrap}>
                      <Ionicons name="book-outline" size={15} color="#061E47" />
                    </View>
                    <View>
                      <Text style={styles.bookedTutorsBarTitle}>Registered Modules</Text>
                      <Text style={styles.bookedTutorsBarSub}>Track progress & course milestones</Text>
                    </View>
                  </View>
                  <View style={styles.bookedTutorsCountBadge}>
                    <Text style={styles.bookedTutorsCountBadgeText}>
                      {enrolledModules.length} Modules
                    </Text>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsCard}>
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{enrolledModules.length}</Text>
                    <Text style={styles.statLbl}>Modules</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{totalCredits}</Text>
                    <Text style={styles.statLbl}>Credits</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statCol}>
                    <Text style={styles.statVal}>{avgProgress}%</Text>
                    <Text style={styles.statLbl}>Avg Progress</Text>
                  </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={17} color="#8997AF" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search registered modules, codes, or mentors..."
                    placeholderTextColor="#8997AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={18} color="#8997AF" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Filter Pills */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {(['all', 'Computing', 'Engineering', 'Business', 'Architecture'] as FacultyFilter[]).map(
                    (fac) => {
                      const isActive = selectedFaculty === fac;
                      const label = fac === 'all' ? `All (${enrolledModules.length})` : fac;
                      return (
                        <TouchableOpacity
                          key={fac}
                          style={[styles.filterChip, isActive && styles.filterChipActive]}
                          onPress={() => setSelectedFaculty(fac)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isActive && styles.filterChipTextActive,
                            ]}
                          >
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </ScrollView>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#061E47" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedFaculty !== 'all'
                  ? 'No Matching Modules Found'
                  : 'No Modules Selected Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedFaculty !== 'all'
                  ? 'Try clearing your search query or faculty filter to view all enrolled modules.'
                  : 'You have not selected any modules yet. Use Academic Guidance to explore and enroll in your university modules.'}
              </Text>
              {!searchQuery && selectedFaculty === 'all' && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate('GuidanceWizard')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyActionBtnText}>+ Select Modules in Guidance</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={({ item }) => {
          const progress = item.progress || 0;

          return (
            <View style={styles.moduleCard}>
              {/* Top Metadata Row */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{item.code}</Text>
                </View>

                <View style={styles.creditsBadge}>
                  <Text style={styles.creditsBadgeText}>{item.credits || 3} Credits</Text>
                </View>

                {item.faculty ? (
                  <View style={styles.facultyBadge}>
                    <Text style={styles.facultyBadgeText}>{item.faculty}</Text>
                  </View>
                ) : null}

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Enrolled</Text>
                </View>
              </View>

              {/* Module Name */}
              <Text style={styles.moduleName}>{item.name}</Text>

              {item.department ? (
                <Text style={styles.deptText}>
                  Department: <Text style={styles.deptBold}>{item.department}</Text>
                </Text>
              ) : null}

              {/* Progress Section */}
              <View style={styles.progressWrap}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Study & Mentoring Progress</Text>
                  <Text style={styles.progressPercentage}>{progress}% Complete</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(Math.max(progress, 5), 100)}%`,
                        backgroundColor: progress >= 75 ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Next Session Agenda Highlight */}
              {item.nextSession ? (
                <View style={styles.agendaBox}>
                  <Ionicons name="bookmark" size={16} color="#0284C7" style={{ marginRight: 8, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agendaLabel}>NEXT FOCUS / AGENDA</Text>
                    <Text style={styles.agendaText}>{item.nextSession}</Text>
                  </View>
                </View>
              ) : null}

              {/* Assigned Peer Mentor */}
              <View style={styles.mentorSection}>
                <Text style={styles.mentorSectionTitle}>ASSIGNED PEER MENTOR</Text>

                {item.mentor ? (
                  <View style={styles.mentorCardInner}>
                    <TouchableOpacity
                      style={styles.avatarWrap}
                      onPress={() => handleViewTutorProfile(item.mentor!)}
                      activeOpacity={0.8}
                    >
                      <TutorAvatar
                        name={item.mentor.name}
                        imageUrl={item.mentor.avatar}
                        size={46}
                        borderRadius={16}
                        showOnlineDot
                      />
                    </TouchableOpacity>

                    <View style={styles.mentorInfoCol}>
                      <TouchableOpacity
                        onPress={() => handleViewTutorProfile(item.mentor!)}
                        activeOpacity={0.8}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text style={styles.mentorName} numberOfLines={1}>
                          {item.mentor.name}
                        </Text>
                        <Text style={styles.verifiedCheck}> ✓</Text>
                      </TouchableOpacity>

                      <Text style={styles.mentorRole} numberOfLines={1}>
                        {item.mentor.roleTitle || 'Senior Peer Mentor'} • {item.mentor.batch || "Batch '24"}
                      </Text>

                      <View style={styles.mentorMetaChipsRow}>
                        <View style={styles.mentorRatingPill}>
                          <Ionicons name="star" size={10} color="#F59E0B" />
                          <Text style={styles.mentorRatingText}>
                            {item.mentor.rating || 4.9} ({item.mentor.reviewCount || 25})
                          </Text>
                        </View>
                        <View style={styles.mentorPricePill}>
                          <Ionicons name="pricetag" size={10} color="#065F46" />
                          <Text style={styles.mentorPricePillText}>
                            LKR {(item.mentor.hourlyRate || 1800).toLocaleString()} / hr
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Quick Contact Buttons (Profile & Chat only - tutor already booked) */}
                    <View style={styles.mentorActionButtons}>
                      <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => handleViewTutorProfile(item.mentor!)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.profileBtnText}>Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => handleOpenChat(item.mentor!)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="chatbubbles-outline" size={13} color="#FFFFFF" />
                          <Text style={styles.chatBtnText}>Chat</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.unassignedBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unassignedTitle}>No Mentor Assigned</Text>
                      <Text style={styles.unassignedSubtitle}>
                        Find a peer tutor for {item.code} to get help with assignments and exams.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.findTutorBtn}
                      onPress={() => handleFindTutorForModule(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.findTutorBtnText}>Find Tutor →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

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

      {/* ================= JOIN SESSION VIDEO ROOM MODAL ================= */}
      <Modal
        visible={showJoinSessionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowJoinSessionModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowJoinSessionModal(false)}>
          <Pressable style={styles.joinSessionModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.joinSessionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={styles.liveRoomPulseWrap}>
                  <View style={styles.greenPulseDot} />
                  <Text style={styles.liveRoomPulseText}>LIVE SESSION ROOM</Text>
                </View>
                <Text style={styles.joinSessionRoomCode}>POD-782</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowJoinSessionModal(false)}
                style={styles.cancelModalCloseBtn}
              >
                <SvgClose size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Tutor Overview Card */}
            {joiningSessionTutor && (
              <View style={styles.joinSessionTutorCard}>
                <TutorAvatar
                  name={joiningSessionTutor.mentor.name}
                  imageUrl={joiningSessionTutor.mentor.avatar}
                  size={50}
                  borderRadius={18}
                  showOnlineDot
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.joinSessionTutorName}>{joiningSessionTutor.mentor.name}</Text>
                  <Text style={styles.joinSessionModuleName}>
                    {joiningSessionTutor.moduleCode ? `${joiningSessionTutor.moduleCode}: ` : ''}
                    {joiningSessionTutor.moduleName}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 }}>
                    <SvgClock size={12} color="#D97706" />
                    <Text style={styles.joinSessionTimeText}>{joiningSessionTutor.nextSession}</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Video Call Simulation Frame */}
            <View style={styles.videoSimContainer}>
              <View style={styles.videoSimInner}>
                <Ionicons
                  name={isVideoOff ? 'videocam-off' : 'videocam'}
                  size={36}
                  color={isVideoOff ? '#EF4444' : '#10B981'}
                />
                <Text style={styles.videoSimStatusText}>
                  {isVideoOff ? 'Camera Off (Voice Only Mode)' : 'HD Video Feed Ready (SLIIT Malabe Pod)'}
                </Text>
                <Text style={styles.videoSimSub}>
                  {isMicMuted ? 'Microphone is muted' : 'Microphone is active'}
                </Text>
              </View>

              {/* Call Controls Bar */}
              <View style={styles.callControlsBar}>
                <TouchableOpacity
                  style={[styles.callControlBtn, isMicMuted && styles.callControlBtnMuted]}
                  onPress={() => setIsMicMuted(!isMicMuted)}
                >
                  <Ionicons
                    name={isMicMuted ? 'mic-off' : 'mic'}
                    size={20}
                    color={isMicMuted ? '#EF4444' : '#FFFFFF'}
                  />
                  <Text style={styles.callControlBtnLbl}>{isMicMuted ? 'Unmute' : 'Mute'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.callControlBtn, isVideoOff && styles.callControlBtnMuted]}
                  onPress={() => setIsVideoOff(!isVideoOff)}
                >
                  <Ionicons
                    name={isVideoOff ? 'videocam-off' : 'videocam'}
                    size={20}
                    color={isVideoOff ? '#EF4444' : '#FFFFFF'}
                  />
                  <Text style={styles.callControlBtnLbl}>{isVideoOff ? 'Start Cam' : 'Stop Cam'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.callControlBtn}
                  onPress={() => Alert.alert('Screen Share', 'Whiteboard / Slides sharing active.')}
                >
                  <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.callControlBtnLbl}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Join Room CTA */}
            <View style={styles.joinSessionActionsRow}>
              <TouchableOpacity
                style={styles.leaveSessionBtn}
                onPress={() => setShowJoinSessionModal(false)}
              >
                <Text style={styles.leaveSessionBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.connectSessionBtn}
                onPress={() => {
                  setShowJoinSessionModal(false);
                  Alert.alert(
                    'Connected to Session! 🎓',
                    `You have joined the live study room with ${joiningSessionTutor?.mentor.name}. Whiteboard and audio are live.`
                  );
                }}
              >
                <SvgVideocam size={16} color="#FFFFFF" />
                <Text style={styles.connectSessionBtnText}>Enter Video Call Room</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const navy = '#061E47';
const navyLight = '#0B2754';
const amber = '#F59E0B';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  /* Header */
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
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  belowHeaderSection: {
    marginBottom: 6,
  },
  belowHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  belowHeaderSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  findNewTutorBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  findNewTutorBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Stats Card Below Header */
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    color: '#061E47',
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },

  /* Search Box */
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    paddingVertical: 0,
  },

  /* Filter Row */
  filterRow: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  filterChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* FlatList Content */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  /* Module Card */
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#17365E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  /* Card Metadata Header */
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: navy,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  codeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  creditsBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  creditsBadgeText: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  facultyBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facultyBadgeText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },

  /* Module Titles */
  moduleName: {
    color: navy,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  deptText: {
    color: '#64748B',
    fontSize: 11.5,
    marginBottom: 10,
  },
  deptBold: {
    color: '#334155',
    fontWeight: '700',
  },

  /* Progress */
  progressWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
  },
  progressPercentage: {
    color: navy,
    fontSize: 11,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Agenda Box */
  agendaBox: {
    backgroundColor: '#FFFDF0',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginBottom: 12,
  },
  agendaIcon: {
    fontSize: 13,
    marginRight: 8,
    marginTop: 1,
  },
  agendaLabel: {
    color: '#B45309',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  agendaText: {
    color: '#451A03',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Mentor Section */
  mentorSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  mentorSectionTitle: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  mentorCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  mentorAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mentorInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  mentorName: {
    color: navy,
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedCheck: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
  },
  mentorRole: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  mentorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mentorRatingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewCountText: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  hourlyRateText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '600',
  },

  /* Meta Chips in Module Card */
  mentorMetaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  mentorRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mentorPricePill: {
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
  mentorPricePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#065F46',
  },

  /* Mentor Action Buttons */
  mentorActionButtons: {
    flexDirection: 'column',
    gap: 5,
    marginLeft: 8,
  },
  profileBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileBtnText: {
    color: navy,
    fontSize: 11,
    fontWeight: '800',
  },
  chatBtn: {
    backgroundColor: '#061E47',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* Unassigned Mentor Box */
  unassignedBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unassignedTitle: {
    color: navy,
    fontSize: 12.5,
    fontWeight: '800',
  },
  unassignedSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  findTutorBtn: {
    backgroundColor: amber,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  findTutorBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    color: navy,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyActionBtn: {
    backgroundColor: navy,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: navy,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Section Header Row */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  sectionHeaderIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Booked Tutors Dedicated Bar Section */
  bookedTutorsBarSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  bookedTutorsBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bookedTutorsBarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#061E47',
    letterSpacing: -0.2,
  },
  bookedTutorsBarSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 1,
  },
  bookedTutorsCountBadge: {
    backgroundColor: '#EEF2F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  bookedTutorsCountBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#061E47',
  },
  bookedTutorsScroll: {
    gap: 12,
    paddingRight: 6,
  },
  bookedTutorPillCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 260,
  },
  tutorCardTopPart: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookedTutorPillName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookedTutorPillRole: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  bookedTutorBadgeRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookedTutorBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#061E47',
  },
  tutorCardStatsMini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 9,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tutorRateHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  tutorStatsDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#E2E8F0',
  },
  tutorRatingHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },
  tutorReviewCountMini: {
    fontSize: 10,
    color: '#64748B',
  },
  tutorNextSessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tutorNextSessionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B45309',
    flex: 1,
  },
  tutorCardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  tutorChatActionBtn: {
    flex: 1,
    backgroundColor: '#061E47',
    borderRadius: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorChatActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  tutorProfileActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorProfileActionBtnText: {
    color: '#061E47',
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyBookedTutorsBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyBookedTutorsText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
  },
  tutorCancelActionBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 9,
    paddingVertical: 7,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tutorCancelActionBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
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

  /* VIEW MODE SELECTOR */
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: 10,
    gap: 4,
  },
  viewModeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  viewModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  viewModeBtnTextActive: {
    color: '#061E47',
    fontWeight: '800',
  },

  /* FULL BOOKED TUTOR CARD */
  bookedTutorsFullSection: {
    marginBottom: 16,
  },
  bookedTutorFullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  tutorJoinActionBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 5,
  },
  tutorJoinActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* JOIN SESSION ROOM MODAL */
  joinSessionModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
  },
  joinSessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  liveRoomPulseWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveRoomPulseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  greenPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  joinSessionRoomCode: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  joinSessionTutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  joinSessionTutorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  joinSessionModuleName: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '700',
    marginTop: 1,
  },
  joinSessionTimeText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
  },
  videoSimContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  videoSimInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  videoSimStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
    textAlign: 'center',
  },
  videoSimSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  callControlsBar: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    width: '100%',
    justifyContent: 'center',
  },
  callControlBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    gap: 3,
  },
  callControlBtnMuted: {
    backgroundColor: '#450A0A',
  },
  callControlBtnLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  joinSessionActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  leaveSessionBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveSessionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  connectSessionBtn: {
    flex: 2,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  connectSessionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

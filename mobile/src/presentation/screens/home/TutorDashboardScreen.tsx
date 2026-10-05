import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
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

const { width } = Dimensions.get('window');

export default function TutorDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);

  const [refreshing, setRefreshing] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [livePodModalVisible, setLivePodModalVisible] = useState(false);

  // Dynamic state for editable schedule
  const [scheduleDays, setScheduleDays] = useState('Monday to Friday');
  const [scheduleHours, setScheduleHours] = useState('3:00 PM - 6:00 PM');

  // Assessment form state
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentModule, setAssessmentModule] = useState('Data Structures & Algorithms');
  const [assessmentDuration, setAssessmentDuration] = useState('45 Mins');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with ${currentUser?.name || 'Senior Peer Tutor'} on UniMentor for peer tutoring and Kuppiya sessions!`,
      });
    } catch {
      // Ignore
    }
  };

  const handleSaveSchedule = () => {
    setScheduleModalVisible(false);
    Alert.alert('Schedule Updated', `Your booking availability has been set to: ${scheduleDays} (${scheduleHours}).`);
  };

  const handleCreateAssessment = () => {
    if (!assessmentTitle.trim()) {
      Alert.alert('Missing Field', 'Please enter an assessment title.');
      return;
    }
    setAssessmentModalVisible(false);
    Alert.alert('Assessment Published', `"${assessmentTitle}" has been shared with your active study pods.`);
    setAssessmentTitle('');
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A2342" />
      {/* 1. Header with Dark Navy Background */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Tutor Dashboard</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#08214D" />}
      >
        {/* 2. Top Schedule Banner Card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleSub}>{scheduleDays}</Text>
            <Text style={styles.scheduleTime}>{scheduleHours}</Text>
          </View>
          <TouchableOpacity
            style={styles.scheduleBtn}
            activeOpacity={0.85}
            onPress={() => setScheduleModalVisible(true)}
          >
            <Text style={styles.scheduleBtnText}>Schedule Booking</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Tutor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* Oval Tutor Image */}
            <View style={styles.avatarOuterContainer}>
              <View style={styles.avatarOvalWrapper}>
                <Image
                  source={require('../../../../assets/tutor_avatar.jpg')}
                  style={styles.avatarOvalImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.verifiedBadgeOverlay}>
                <Ionicons name="checkmark-sharp" size={13} color="#0A2342" />
              </View>
            </View>

            {/* Profile Info */}
            <View style={styles.profileDetails}>
              <View style={styles.nameBadgeRow}>
                <View style={styles.nameAndBadge}>
                  <Text style={styles.tutorName}>T</Text>
                  <View style={styles.verifiedPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#F59E0B" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.shareCircle}
                  activeOpacity={0.8}
                  onPress={handleShare}
                >
                  <Ionicons name="share-social" size={17} color="#1D4ED8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.tutorRole}>
                Senior Peer Tutor • Faculty of Computing
              </Text>
            </View>
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.profileActionRow}>
            <TouchableOpacity
              style={styles.assessmentBtn}
              activeOpacity={0.8}
              onPress={() => setAssessmentModalVisible(true)}
            >
              <Text style={styles.assessmentBtnText}>Create New Assessment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pulseBtn, !pulseActive && styles.pulseBtnInactive]}
              activeOpacity={0.85}
              onPress={() => {
                setPulseActive(!pulseActive);
                Alert.alert(
                  'Tutor Pulse',
                  pulseActive
                    ? 'Tutor Pulse paused. Students will see you as offline.'
                    : 'Tutor Pulse is now active! Students can request immediate Kuppiya sessions.'
                );
              }}
            >
              <Ionicons
                name="location"
                size={13}
                color={pulseActive ? '#854D0E' : '#64748B'}
              />
              <Text style={[styles.pulseBtnText, !pulseActive && styles.pulseBtnTextInactive]}>
                Tutor Pulse {pulseActive ? '(Active)' : '(Paused)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Tutor Performance Section */}
        <View style={styles.performanceSection}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>Tutor Performance</Text>
            <Text style={styles.performanceMonth}>May 2024</Text>
          </View>

          {/* 2x2 Performance Grid */}
          <View style={styles.gridRow}>
            {/* Card 1: Total Earnings */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Total Earnings</Text>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="wallet-outline" size={16} color="#0284C7" />
                </View>
              </View>
              <Text style={styles.perfValue}>LKR 48,500</Text>
              <View style={styles.perfFooterRow}>
                <View style={styles.trendPill}>
                  <Ionicons name="trending-up" size={12} color="#4F46E5" />
                  <Text style={styles.trendPillText}>+18%</Text>
                </View>
                {/* Visual Sparkline Graphic */}
                <View style={styles.sparklineContainer}>
                  <View style={[styles.sparkDot, { left: 0, bottom: 2 }]} />
                  <View style={[styles.sparkLineSegment, { left: 1, bottom: 3, width: 10, transform: [{ rotate: '-22deg' }] }]} />
                  <View style={[styles.sparkLineSegment, { left: 9, bottom: 6, width: 8, transform: [{ rotate: '18deg' }] }]} />
                  <View style={[styles.sparkLineSegment, { left: 16, bottom: 5, width: 10, transform: [{ rotate: '-20deg' }] }]} />
                  <View style={[styles.sparkLineSegment, { left: 24, bottom: 7, width: 14, transform: [{ rotate: '-32deg' }] }]} />
                  <View style={[styles.sparkDot, { right: 0, top: 1 }]} />
                </View>
              </View>
            </View>

            {/* Card 2: Completed */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Completed</Text>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="checkmark-done" size={17} color="#0284C7" />
                </View>
              </View>
              <Text style={styles.perfValue}>38 Sessions</Text>
              <View style={styles.perfFooterSingle}>
                <View style={styles.goldDot} />
                <Text style={styles.perfSubtext}>100% fulfill rate</Text>
              </View>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 12 }]}>
            {/* Card 3: Student Rating */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Student Rating</Text>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star" size={15} color="#F59E0B" />
                </View>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.perfValue}>4.9</Text>
                <Text style={styles.ratingMax}> / 5.0</Text>
              </View>
              <Text style={styles.perfSubtext}>120 reviews (98% pos)</Text>
            </View>

            {/* Card 4: Active Students */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Active Students</Text>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="people" size={16} color="#0284C7" />
                </View>
              </View>
              <Text style={styles.perfValue}>24 Students</Text>
              <Text style={styles.perfSubtext}>Across 3 study pods</Text>
            </View>
          </View>
        </View>

        {/* 5. LIVE KUPPIYA POD Card */}
        <TouchableOpacity
          style={styles.livePodCard}
          activeOpacity={0.92}
          onPress={() => setLivePodModalVisible(true)}
        >
          {/* Top Row with LIVE tag and Slot */}
          <View style={styles.livePodHeader}>
            <View style={styles.livePodBadge}>
              <View style={styles.livePulsingDot} />
              <Text style={styles.livePodBadgeText}>LIVE KUPPIYA POD</Text>
            </View>
            <Text style={styles.livePodSlotText}>Slot: 3:00 - 4:30 PM</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.livePodTitle}>Data Structures: Graph Traversals</Text>
          <Text style={styles.livePodDesc}>
            BFS, DFS & Topological Sort real-world walk-through
          </Text>

          {/* Pod Footer info */}
          <View style={styles.livePodFooter}>
            <View style={styles.studentAvatarsRow}>
              <View style={[styles.avatarMini, { backgroundColor: '#38BDF8' }]}>
                <Text style={styles.avatarMiniText}>KS</Text>
              </View>
              <View style={[styles.avatarMini, { backgroundColor: '#818CF8', marginLeft: -8 }]}>
                <Text style={styles.avatarMiniText}>AN</Text>
              </View>
              <View style={[styles.avatarMini, { backgroundColor: '#34D399', marginLeft: -8 }]}>
                <Text style={styles.avatarMiniText}>DM</Text>
              </View>
              <View style={[styles.avatarMiniPlus, { marginLeft: -8 }]}>
                <Text style={styles.avatarMiniPlusText}>+21</Text>
              </View>
              <Text style={styles.enrolledCountText}>24 Registered</Text>
            </View>

            <View style={styles.startPodPill}>
              <Ionicons name="play-circle" size={15} color="#FFFFFF" />
              <Text style={styles.startPodText}>Join Pod</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Extra Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: Schedule Availability Booking */}
      <Modal visible={scheduleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Availability & Schedule</Text>
            <Text style={styles.modalSub}>
              Students can book 1-on-1 tutoring sessions only during your designated active hours.
            </Text>

            <Text style={styles.modalLabel}>Active Days</Text>
            <TextInput
              style={styles.modalInput}
              value={scheduleDays}
              onChangeText={setScheduleDays}
              placeholder="e.g. Monday to Friday"
            />

            <Text style={styles.modalLabel}>Working Hours Slot</Text>
            <TextInput
              style={styles.modalInput}
              value={scheduleHours}
              onChangeText={setScheduleHours}
              placeholder="e.g. 3:00 PM - 6:00 PM"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setScheduleModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.modalConfirmText}>Save Availability</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Create Assessment */}
      <Modal visible={assessmentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create New Assessment</Text>
            <Text style={styles.modalSub}>
              Quick quiz or revision challenge for your active Kuppiya study pods.
            </Text>

            <Text style={styles.modalLabel}>Assessment Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Graph Traversals Quiz 01"
              value={assessmentTitle}
              onChangeText={setAssessmentTitle}
            />

            <Text style={styles.modalLabel}>Module / Subject</Text>
            <TextInput
              style={styles.modalInput}
              value={assessmentModule}
              onChangeText={setAssessmentModule}
            />

            <Text style={styles.modalLabel}>Time Limit</Text>
            <TextInput
              style={styles.modalInput}
              value={assessmentDuration}
              onChangeText={setAssessmentDuration}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAssessmentModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateAssessment}
              >
                <Text style={styles.modalConfirmText}>Publish Assessment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Live Kuppiya Room Details */}
      <Modal visible={livePodModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: '#0D244D' }]}>
            <View style={[styles.modalHandle, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.livePodBadge}>
              <View style={styles.livePulsingDot} />
              <Text style={styles.livePodBadgeText}>KUPPIYA SESSION ROOM</Text>
            </View>

            <Text style={[styles.modalTitle, { color: '#FFFFFF', marginTop: 12 }]}>
              Data Structures: Graph Traversals
            </Text>
            <Text style={[styles.modalSub, { color: '#93C5FD' }]}>
              Interactive Peer Kuppiya • 24 Students waiting in lobby.
            </Text>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginVertical: 12 }}>
              <Text style={{ color: '#E2E8F0', fontWeight: '700', fontSize: 13, marginBottom: 4 }}>
                Session Agenda:
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 12, lineHeight: 18 }}>
                1. Adjacency Matrix vs List representation{'\n'}
                2. Breadth-First Search (BFS) queue demo{'\n'}
                3. Depth-First Search (DFS) recursive stack{'\n'}
                4. Live Q&A and past exam question review
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setLivePodModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: '#FFFFFF' }]}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#F59E0B' }]}
                onPress={() => {
                  setLivePodModalVisible(false);
                  Alert.alert('Live Session Started', 'Broadcasting live Kuppiya pod audio & whiteboard!');
                }}
              >
                <Text style={[styles.modalConfirmText, { color: '#0F172A' }]}>Start Broadcast</Text>
              </TouchableOpacity>
            </View>
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
  headerContainer: {
    backgroundColor: '#0A2342',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandMentor: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F59E0B',
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // 2. Schedule Card
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.2,
  },
  scheduleBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  // 3. Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOuterContainer: {
    position: 'relative',
    width: 128,
    height: 86,
  },
  avatarOvalWrapper: {
    width: 128,
    height: 86,
    borderRadius: 43,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  avatarOvalImage: {
    width: '100%',
    height: '100%',
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    bottom: -1,
    right: 6,
    backgroundColor: '#F59E0B',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 4,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 14,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  shareCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  tutorRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  assessmentBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pulseBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulseBtnInactive: {
    backgroundColor: '#E2E8F0',
  },
  pulseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  pulseBtnTextInactive: {
    color: '#64748B',
  },

  // 4. Performance Section
  performanceSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.3,
  },
  performanceMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  perfCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  perfCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    marginTop: 8,
    letterSpacing: -0.4,
  },
  perfFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  trendPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  sparklineContainer: {
    position: 'relative',
    width: 44,
    height: 16,
    justifyContent: 'center',
  },
  sparkLineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },
  sparkDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  perfFooterSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  perfSubtext: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingMax: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // 5. LIVE KUPPIYA POD Card
  livePodCard: {
    backgroundColor: '#0D244D',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0D244D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  livePodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  livePulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  livePodBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.6,
  },
  livePodSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93C5FD',
  },
  livePodTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  livePodDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 3,
    lineHeight: 18,
  },
  livePodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  studentAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D244D',
  },
  avatarMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarMiniPlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D244D',
  },
  avatarMiniPlusText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  enrolledCountText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
    fontWeight: '500',
  },
  startPodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  startPodText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1.5,
    backgroundColor: '#0A2342',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

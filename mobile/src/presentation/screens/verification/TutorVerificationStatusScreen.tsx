import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/theme';
import { VerificationStatus } from '../../../domain/entities/User';
import { useAuthStore } from '../../../domain/stores/authStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface StateMeta {
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  icon: string;
  description: string;
  actionLabel: string;
}

const statusMeta: Record<VerificationStatus, StateMeta> = {
  not_submitted: {
    title: 'Verification Not Submitted',
    badge: 'NOT SUBMITTED',
    badgeBg: '#F3F4F6',
    badgeColor: '#4B5563',
    icon: '📝',
    description: 'You have not submitted your university credentials for peer tutoring yet.',
    actionLabel: 'Start Tutor Verification  →',
  },
  pending: {
    title: 'Application Queued',
    badge: 'PENDING REVIEW',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    icon: '⏳',
    description: 'Your application has been received and assigned to the Faculty Verification Queue.',
    actionLabel: 'Update submitted documents  →',
  },
  under_review: {
    title: 'Under Faculty Review',
    badge: 'UNDER REVIEW',
    badgeBg: '#E0F2FE',
    badgeColor: colors.primary,
    icon: '🔍',
    description: 'Faculty staff are reviewing the photos and details on your application.',
    actionLabel: 'Update submitted documents  →',
  },
  approved: {
    title: 'Verified Peer Tutor',
    badge: 'APPROVED & VERIFIED',
    badgeBg: '#ECFDF5',
    badgeColor: colors.success,
    icon: '✅',
    description: 'Congratulations! Your profile is verified and active on the student search catalog.',
    actionLabel: 'Go to Tutor Dashboard  →',
  },
  rejected: {
    title: 'Application Rejected',
    badge: 'REJECTED',
    badgeBg: '#FEE2E2',
    badgeColor: colors.error,
    icon: '❌',
    description: 'Your verification was declined. Transcript grades did not meet module thresholds (A/A+).',
    actionLabel: 'Submit Appeal / Re-upload  →',
  },
  suspended: {
    title: 'Account Suspended',
    badge: 'SUSPENDED',
    badgeBg: '#FEF2F2',
    badgeColor: '#991B1B',
    icon: '🚫',
    description: 'Your teaching privileges are temporarily suspended pending an academic integrity review.',
    actionLabel: 'File Formal Appeal  →',
  },
  expired: {
    title: 'Verification Expired',
    badge: 'EXPIRED (NEW SEMESTER)',
    badgeBg: '#FFF7ED',
    badgeColor: '#C2410C',
    icon: '⚠️',
    description: 'Your annual university enrollment validity has expired. Please submit current semester proof.',
    actionLabel: 'Renew Semester Enrollment  →',
  },
};

function mapStatus(value?: string): VerificationStatus {
  if (value === 'approved') return 'approved';
  if (value === 'rejected') return 'rejected';
  if (value === 'under_review' || value === 'verified') return 'under_review';
  if (value === 'pending') return 'pending';
  if (value === 'suspended') return 'suspended';
  if (value === 'expired') return 'expired';
  return 'not_submitted';
}

export default function TutorVerificationStatusScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const updateUserProfile = useAuthStore((state) => state.updateUserProfile);
  const [activeStatus, setActiveStatus] = useState<VerificationStatus>(mapStatus(user?.verificationStatus));

  useEffect(() => {
    const real = token && !token.startsWith('demo_') && !token.startsWith('mock_');
    if (!real) return;
    import('../../../data/repositories/authRepository').then(({ authRepository }) => {
      authRepository.me()
        .then((result) => {
          updateUserProfile(result.user);
          setActiveStatus(mapStatus(result.user.verificationStatus));
        })
        .catch(() => undefined);
    });
  }, [token, updateUserProfile]);

  const meta = statusMeta[activeStatus];
  const subjects = user?.subjects?.length ? user.subjects : [];
  const submitted = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';

  const handlePrimaryAction = () => {
    if (activeStatus === 'approved') {
      navigation.navigate('TutorDashboard');
      return;
    }
    if (activeStatus === 'not_submitted' || activeStatus === 'pending' || activeStatus === 'under_review' || activeStatus === 'rejected' || activeStatus === 'expired') {
      navigation.navigate('VerifyIdentity', { role: 'mentor', email: user?.email });
      return;
    }
    Alert.alert(meta.title, meta.description);
  };

  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      {/* Top Header Bar matching StudentDashboardScreen */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            {navigation?.canGoBack?.() ? (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Verification Status</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Current State Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={[styles.statusBadge, { backgroundColor: meta.badgeBg }]}>
              <Text style={[styles.statusBadgeText, { color: meta.badgeColor }]}>{meta.badge}</Text>
            </View>
            <Text style={styles.stateIcon}>{meta.icon}</Text>
          </View>
          <Text style={styles.stateTitle}>{meta.title}</Text>
          <Text style={styles.stateDesc}>{meta.description}</Text>

          <View style={styles.referenceRow}>
            <Text style={styles.refLabel}>Account: <Text style={styles.refVal}>{user?.email || '—'}</Text></Text>
            <Text style={styles.refLabel}>Submitted: <Text style={styles.refVal}>{submitted}</Text></Text>
          </View>
        </View>

        {/* Module-Specific Approval List (FR05 & FR06) */}
        <View style={styles.moduleSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Module Approval Breakdown</Text>
            <Text style={styles.sectionBadge}>FR05 & FR06</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Tutors are approved per specific university module based on transcript grades.
          </Text>

          <View style={styles.moduleCardList}>
            {subjects.length === 0 ? (
              <Text style={styles.sectionSubtitle}>No teaching modules were saved on this account.</Text>
            ) : subjects.map((name) => (
              <View key={name} style={styles.moduleItem}>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleName}>{name}</Text>
                  <Text style={styles.moduleMeta}>Faculty reviews the whole application</Text>
                </View>
                <View style={[styles.modStatusPill, { backgroundColor: activeStatus === 'approved' ? '#ECFDF5' : activeStatus === 'rejected' ? '#FEE2E2' : '#FEF3C7' }]}>
                  <Text style={[styles.modStatusText, { color: activeStatus === 'approved' ? colors.success : activeStatus === 'rejected' ? colors.error : '#B45309' }]}>
                    {activeStatus === 'approved' ? 'APPROVED' : activeStatus === 'rejected' ? 'REJECTED' : 'WAITING'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Verification Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Verification Timeline</Text>
          <View style={styles.timelineList}>
            <View style={styles.timelineStep}>
              <View style={[styles.timelineNode, styles.nodeComplete]}>
                <Text style={styles.nodeCheck}>✓</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>University Email Verified</Text>
                <Text style={styles.timelineStepTime}>
                  {activeStatus === 'not_submitted' ? (user?.email || 'Email not verified yet') : `${user?.email || 'Account email'} • Completed`}
                </Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View style={[styles.timelineNode, styles.nodeComplete]}>
                <Text style={styles.nodeCheck}>✓</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>ID & Live Face Matching</Text>
                <Text style={styles.timelineStepTime}>
                  {activeStatus === 'not_submitted' ? 'Upload your ID and transcript' : 'Submitted with your application'}
                </Text>
              </View>
            </View>

            <View style={styles.timelineStep}>
              <View
                style={[
                  styles.timelineNode,
                  activeStatus === 'approved' ? styles.nodeComplete : styles.nodeActive,
                ]}
              >
                <Text style={styles.nodeCheck}>
                  {activeStatus === 'approved' ? '✓' : '●'}
                </Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStepTitle}>Faculty Transcript Audit</Text>
                <Text style={styles.timelineStepTime}>
                  {activeStatus === 'approved' ? 'Approved by faculty staff' : 'Waiting for faculty review'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePrimaryAction} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>{meta.actionLabel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandMentor: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
  },
  stateTesterCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  testerPrompt: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  stateChipRow: {
    gap: 6,
  },
  stateChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stateChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  stateChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  stateChipTextActive: {
    color: colors.white,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: 18,
    marginBottom: 20,
    shadowColor: colors.navy,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stateIcon: {
    fontSize: 26,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
  },
  stateDesc: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
    marginBottom: 14,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  refLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
  refVal: {
    color: colors.navy,
    fontWeight: '700',
  },
  moduleSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 12,
  },
  moduleCardList: {
    gap: 8,
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  moduleInfo: {
    flex: 1,
    marginRight: 8,
  },
  moduleName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 2,
  },
  moduleMeta: {
    fontSize: 11,
    color: colors.textLight,
  },
  modStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timelineSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
  },
  timelineList: {
    marginTop: 12,
    gap: 14,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  nodeComplete: {
    backgroundColor: colors.success,
  },
  nodeActive: {
    backgroundColor: colors.primary,
  },
  nodeCheck: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  timelineContent: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  timelineStepTime: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  primaryBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
});

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import { useAuthStore } from '../../../domain/stores/authStore';
import { AccountStatus } from '../../../domain/entities/User';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface StatusInfo {
  title: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  icon: string;
  desc: string;
  buttonLabel: string;
}

const statusMap: Record<AccountStatus, StatusInfo> = {
  active: {
    title: 'Account in Good Standing',
    badge: 'ACTIVE & VERIFIED',
    badgeBg: '#ECFDF5',
    badgeColor: colors.success,
    icon: '✅',
    desc: 'Your university student/tutor membership is active. You have full access to study sessions, mentor messaging, and platform tools.',
    buttonLabel: 'Account is active',
  },
  under_review: {
    title: 'Credentials Under Review',
    badge: 'UNDER FACULTY AUDIT',
    badgeBg: '#E0F2FE',
    badgeColor: colors.primary,
    icon: '⏳',
    desc: 'Your enrollment documents and faculty permissions are currently being audited by the university quality board.',
    buttonLabel: 'View Audit Queue Status',
  },
  pending: {
    title: 'Pending ID Verification',
    badge: 'PENDING ACTION',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    icon: '📝',
    desc: 'Please submit your university student ID card to activate booking and messaging features.',
    buttonLabel: 'Complete ID Verification  →',
  },
  suspended: {
    title: 'Account Temporarily Restricted',
    badge: 'SUSPENDED',
    badgeBg: '#FEE2E2',
    badgeColor: colors.error,
    icon: '🚫',
    desc: 'Access suspended due to academic integrity review or terms violation. Tutoring and session bookings are disabled.',
    buttonLabel: 'File Formal Campus Appeal',
  },
  rejected: {
    title: 'Verification Declined',
    badge: 'REJECTED',
    badgeBg: '#FEE2E2',
    badgeColor: colors.error,
    icon: '❌',
    desc: 'Your university credentials could not be validated against campus registrar records.',
    buttonLabel: 'Submit Re-verification Documents',
  },
  expired: {
    title: 'Enrollment Expired',
    badge: 'RE-REGISTRATION REQUIRED',
    badgeBg: '#FFF7ED',
    badgeColor: '#C2410C',
    icon: '⚠️',
    desc: 'Annual university enrollment must be renewed for the current academic semester.',
    buttonLabel: 'Submit Current Semester Proof',
  },
};

export default function AccountStatusScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const currentStatus: AccountStatus = user?.accountStatus && statusMap[user.accountStatus]
    ? user.accountStatus
    : 'active';
  const info = statusMap[currentStatus];

  const handleAction = () => {
    if (currentStatus === 'pending' || currentStatus === 'rejected' || currentStatus === 'expired') {
      navigation.navigate('VerifyIdentity', { role: user?.role === 'mentor' ? 'mentor' : 'student', email: user?.email });
      return;
    }
    if (currentStatus === 'under_review') {
      navigation.navigate('TutorVerificationStatus');
      return;
    }
    Alert.alert(info.title, info.desc);
  };

  return (
    <View style={styles.page}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Status & Audit</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={[styles.badgePill, { backgroundColor: info.badgeBg }]}>
              <Text style={[styles.badgeText, { color: info.badgeColor }]}>{info.badge}</Text>
            </View>
            <Text style={styles.heroIcon}>{info.icon}</Text>
          </View>

          <Text style={styles.heroTitle}>{info.title}</Text>
          <Text style={styles.heroDesc}>{info.desc}</Text>

          <View style={styles.divider} />

          <View style={styles.statusDetails}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Registered Member:</Text>
              <Text style={styles.statusVal}>{user?.name || '—'}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Role:</Text>
              <Text style={[styles.statusVal, { textTransform: 'capitalize' }]}>
                {user?.role || 'student'}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Official Email:</Text>
              <Text style={styles.statusVal}>{user?.email || '—'}</Text>
            </View>
          </View>
        </View>

        {/* University Academic Standing */}
        <Text style={styles.sectionHeader}>UNIVERSITY CREDENTIAL DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Enrolled Institution</Text>
            <Text style={styles.detailVal}>{user?.university || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Faculty / Department</Text>
            <Text style={styles.detailVal}>
              {[user?.faculty, user?.department].filter(Boolean).join(' • ') || '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Student Registration Number</Text>
            <Text style={styles.detailVal}>{user?.studentId || '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Current Validity Period</Text>
            <Text style={[styles.detailVal, { fontWeight: '800' }]}>Not tracked</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleAction} activeOpacity={0.85}>
          <Text style={styles.actionButtonText}>{info.buttonLabel}</Text>
        </TouchableOpacity>

        {/* Contact Compliance Link */}
        <TouchableOpacity
          style={styles.appealLink}
          onPress={() => navigation.navigate('HelpSupport')}
        >
          <Text style={styles.appealLinkText}>
            Questions about your standing? <Text style={styles.appealBold}>Contact Campus Board</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backArrow: {
    fontSize: 24,
    color: colors.navy,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
  },
  headerSpacer: {
    width: 38,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  testerCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
  },
  testerPrompt: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  testerChips: {
    gap: 6,
  },
  testerChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  testerChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  testerChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
  },
  testerChipTextActive: {
    color: colors.white,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    marginBottom: 20,
    shadowColor: '#244369',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroIcon: {
    fontSize: 26,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 18,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  statusDetails: {
    gap: 6,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textLight,
  },
  statusVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailKey: {
    fontSize: 12,
    color: colors.textLight,
  },
  detailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  actionButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  actionButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  appealLink: {
    alignItems: 'center',
  },
  appealLinkText: {
    fontSize: 13,
    color: colors.textLight,
  },
  appealBold: {
    color: colors.primary,
    fontWeight: '800',
  },
});

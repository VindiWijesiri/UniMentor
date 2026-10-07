import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';
import { useAuthStore, mockTutorUser, mockStudentUser } from '../../../domain/stores/authStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

export default function VerificationResultScreen({ navigation, route }: Props) {
  const initialSuccess = route?.params?.success ?? true;
  const initialRole = route?.params?.role || 'mentor';
  const initialReason =
    route?.params?.reason ||
    'Student ID card image was blurred or expired. The registration number CS/2023/089 could not be matched against faculty records.';

  const [isSuccess, setIsSuccess] = useState(initialSuccess);
  const { setUser, setToken } = useAuthStore();

  const handleGoToNext = () => {
    const account = route?.params?.user;
    const token = route?.params?.token;
    if (account && token) {
      setToken(token);
      setUser(account);
      return;
    }
    if (initialRole === 'mentor') {
      setUser({
        ...mockTutorUser,
        verificationStatus: 'under_review',
        accountStatus: 'pending',
      });
      setToken('demo_tutor_token');
      navigation.navigate('TutorVerificationStatus');
    } else {
      setUser({
        ...mockStudentUser,
        verificationStatus: 'approved',
        accountStatus: 'active',
      });
      setToken('demo_student_token');
    }
  };

  const handleRetry = () => {
    navigation.navigate('VerifyIdentity', { role: initialRole });
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Reviewer State Switcher */}
        <View style={styles.reviewerToggle}>
          <Text style={styles.togglePrompt}>REVIEWER TEST TOGGLE:</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isSuccess && styles.toggleBtnActiveSuccess]}
              onPress={() => setIsSuccess(true)}
            >
              <Text style={[styles.toggleText, isSuccess && styles.toggleTextActive]}>
                ✓ Success State
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isSuccess && styles.toggleBtnActiveFail]}
              onPress={() => setIsSuccess(false)}
            >
              <Text style={[styles.toggleText, !isSuccess && styles.toggleTextActive]}>
                ✕ Failed State
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isSuccess ? (
          /* ================= SUCCESS STATE ================= */
          <View style={styles.resultBody}>
            <View style={styles.iconCircleSuccess}>
              <Text style={styles.badgeEmoji}>🎉</Text>
              <View style={styles.checkPill}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            </View>

            <Text style={styles.heading}>Verification Submitted!</Text>
            <Text style={styles.subheading}>
              Your university credentials and live biometric identity have been successfully submitted for faculty approval.
            </Text>

            {/* Status Summary Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verification Reference</Text>
                <Text style={styles.infoValueBold}>#VER-2024-8931</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Current Status</Text>
                <View style={styles.statusPillReview}>
                  <Text style={styles.statusPillReviewText}>UNDER FACULTY REVIEW</Text>
                </View>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estimated Turnaround</Text>
                <Text style={styles.infoValue}>Within 24 Hours</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Verified University</Text>
                <Text style={styles.infoValue}>University of Colombo</Text>
              </View>
            </View>

            {/* Next Steps Card */}
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>What happens next?</Text>
              <Text style={styles.noticeText}>
                Our academic compliance team will review your transcripts and approve your requested modules individually. You will receive an instant notification upon approval.
              </Text>
            </View>

            {/* Buttons */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoToNext} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>
                {initialRole === 'mentor' ? 'Track Verification Status  →' : 'Enter UniMentor  →'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ================= FAILED STATE ================= */
          <View style={styles.resultBody}>
            <View style={styles.iconCircleFailed}>
              <Text style={styles.failIcon}>⚠️</Text>
            </View>

            <Text style={[styles.heading, { color: colors.error }]}>Verification Unsuccessful</Text>
            <Text style={styles.subheading}>
              We could not verify your university documents against official university records.
            </Text>

            {/* Reason Card */}
            <View style={styles.reasonCard}>
              <View style={styles.reasonHeader}>
                <Text style={styles.reasonIcon}>ℹ️</Text>
                <Text style={styles.reasonTitle}>Specific Rejection Reason:</Text>
              </View>
              <Text style={styles.reasonBody}>{initialReason}</Text>
              <View style={styles.recommendationWrap}>
                <Text style={styles.recTitle}>Recommendation:</Text>
                <Text style={styles.recText}>
                  Please ensure your Student ID card photo is crisp, all four corners are visible, and the academic validity date is current.
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85}>
              <Text style={styles.retryButtonText}>Re-upload ID & Try Again  🔄</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => navigation.navigate('HelpSupport')}
            >
              <Text style={styles.supportButtonText}>Contact Academic Support Team  →</Text>
            </TouchableOpacity>
          </View>
        )}
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 40,
  },
  reviewerToggle: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  togglePrompt: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.6,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  toggleBtnActiveSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: colors.success,
  },
  toggleBtnActiveFail: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  toggleTextActive: {
    fontWeight: '800',
  },
  resultBody: {
    alignItems: 'center',
  },
  iconCircleSuccess: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 18,
  },
  badgeEmoji: {
    fontSize: 42,
  },
  checkPill: {
    position: 'absolute',
    bottom: 0,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  checkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  iconCircleFailed: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  failIcon: {
    fontSize: 40,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  infoValueBold: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  statusPillReview: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillReviewText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  noticeCard: {
    width: '100%',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    padding: 14,
    marginBottom: 24,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
  reasonCard: {
    width: '100%',
    backgroundColor: '#FFF1F2',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFE4E6',
    padding: 16,
    marginBottom: 24,
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reasonIcon: {
    fontSize: 16,
  },
  reasonTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
  },
  reasonBody: {
    fontSize: 13,
    color: '#881337',
    lineHeight: 18,
    marginBottom: 12,
  },
  recommendationWrap: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 8,
  },
  recTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  recText: {
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  retryButton: {
    backgroundColor: colors.secondary,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  supportButton: {
    paddingVertical: 10,
  },
  supportButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

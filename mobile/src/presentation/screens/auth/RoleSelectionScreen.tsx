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
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function RoleSelectionScreen({ navigation }: Props) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor'>('student');

  const handleContinue = () => {
    if (selectedRole === 'student') {
      navigation.navigate('StudentRegistration');
    } else {
      navigation.navigate('TutorRegistration');
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join UniMentor</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero Copy */}
        <View style={styles.heroSection}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP 1 OF 3</Text>
          </View>
          <Text style={styles.title}>Choose Your Academic Role</Text>
          <Text style={styles.subtitle}>
            Connect with verified peers at your university. Select how you would like to start.
          </Text>
        </View>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {/* Student Card */}
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'student' && styles.roleCardSelected]}
            onPress={() => setSelectedRole('student')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.roleIconWrap, selectedRole === 'student' && styles.iconWrapActive]}>
                <Text style={styles.roleEmoji}>🎓</Text>
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.roleName}>I am a Student</Text>
                <View style={styles.tagPill}>
                  <Text style={styles.tagPillText}>LEARNER & STUDY SESSIONS</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, selectedRole === 'student' && styles.radioOuterActive]}>
                {selectedRole === 'student' && <View style={styles.radioInner} />}
              </View>
            </View>

            <Text style={styles.roleSummary}>
              Find high-scoring peer tutors across your faculty and ace your exams with personalized guidance.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>Search mentors by faculty, department & module</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>Book 1-on-1 tutoring sessions & group workshops</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>Read verified peer reviews & ratings</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Tutor Card */}
          <TouchableOpacity
            style={[styles.roleCard, selectedRole === 'mentor' && styles.roleCardSelected]}
            onPress={() => setSelectedRole('mentor')}
            activeOpacity={0.9}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.roleIconWrap, selectedRole === 'mentor' && styles.iconWrapActive]}>
                <Text style={styles.roleEmoji}>👨‍🏫</Text>
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.roleName}>I want to be a Tutor</Text>
                <View style={[styles.tagPill, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.tagPillText, { color: '#B45309' }]}>SHARE KNOWLEDGE & EARN</Text>
                </View>
              </View>
              <View style={[styles.radioOuter, selectedRole === 'mentor' && styles.radioOuterActive]}>
                {selectedRole === 'mentor' && <View style={styles.radioInner} />}
              </View>
            </View>

            <Text style={styles.roleSummary}>
              Get verified for the modules you excelled in, set your hourly rates, and mentor fellow students.
            </Text>

            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>Module-specific verification and trusted badge</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>Set your own hourly fees & flexible teaching hours</Text>
              </View>
              <View style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>Tutor dashboard with earnings & session analytics</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Security & Verification Notice */}
        <View style={styles.securityNotice}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <Text style={styles.securityText}>
            All accounts require university email verification (.ac.lk / .edu) to ensure campus safety.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={styles.continueText}>
            Continue as {selectedRole === 'student' ? 'Student' : 'Peer Tutor'}  →
          </Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity
          style={styles.loginLinkWrap}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Already registered? <Text style={styles.loginLinkBold}>Sign In</Text>
          </Text>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  headerSpacer: {
    width: 38,
  },
  heroSection: {
    marginBottom: 20,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 19,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  roleCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.borderLight,
    padding: 18,
    shadowColor: colors.navy,
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  roleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowOpacity: 0.12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconWrapActive: {
    backgroundColor: '#EBF4FF',
    borderColor: colors.primary,
  },
  roleEmoji: {
    fontSize: 22,
  },
  cardTitleWrap: {
    flex: 1,
  },
  roleName: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 3,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  roleSummary: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  featureList: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureCheck: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.success,
  },
  featureText: {
    fontSize: 12,
    color: colors.textLight,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 20,
  },
  shieldIcon: {
    fontSize: 18,
  },
  securityText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
    lineHeight: 17,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 16,
  },
  continueText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  loginLinkWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: colors.textLight,
  },
  loginLinkBold: {
    color: colors.primary,
    fontWeight: '800',
  },
});

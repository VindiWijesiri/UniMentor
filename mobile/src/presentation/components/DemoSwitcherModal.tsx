import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';

interface DemoSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function DemoSwitcherModal({ visible, onClose }: DemoSwitcherModalProps) {
  const navigation = useNavigation<any>();
  const { user, switchDemoRole } = useAuthStore();

  const handleRoleSelect = (role: 'student' | 'mentor' | 'admin') => {
    switchDemoRole(role);
    onClose();
  };

  const handleNavigate = (screenName: string, params?: object) => {
    onClose();
    try {
      navigation.navigate(screenName, params);
    } catch {
      // If direct navigation isn't supported in current navigator stack, log or ignore
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.sheetTitle}>UniMentor Demo Navigator</Text>
              <Text style={styles.sheetSubtitle}>
                Current Active Role: <Text style={styles.currentRole}>{user?.role?.toUpperCase() || 'GUEST'}</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Quick Role Switcher */}
            <Text style={styles.sectionHeader}>QUICK ROLE SWITCHER</Text>
            <View style={styles.roleGrid}>
              <TouchableOpacity
                style={[styles.roleCard, user?.role === 'student' && styles.roleCardActive]}
                onPress={() => handleRoleSelect('student')}
              >
                <Text style={styles.roleIcon}>🎓</Text>
                <Text style={[styles.roleTitle, user?.role === 'student' && styles.roleTextActive]}>
                  Student Flow
                </Text>
                <Text style={styles.roleDesc}>Find mentors, search modules</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, user?.role === 'mentor' && styles.roleCardActive]}
                onPress={() => handleRoleSelect('mentor')}
              >
                <Text style={styles.roleIcon}>👨‍🏫</Text>
                <Text style={[styles.roleTitle, user?.role === 'mentor' && styles.roleTextActive]}>
                  Tutor Flow
                </Text>
                <Text style={styles.roleDesc}>Dashboard, verification, profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleCard, user?.role === 'admin' && styles.roleCardActive]}
                onPress={() => handleRoleSelect('admin')}
              >
                <Text style={styles.roleIcon}>🛡️</Text>
                <Text style={[styles.roleTitle, user?.role === 'admin' && styles.roleTextActive]}>
                  Admin Flow
                </Text>
                <Text style={styles.roleDesc}>Approve tutors, user management</Text>
              </TouchableOpacity>
            </View>

            {/* Direct Screen Jump Links */}
            <Text style={styles.sectionHeader}>DIRECT SCREEN NAVIGATOR (24 SCREENS)</Text>

            <Text style={styles.subGroupHeader}>1. Authentication & Registration</Text>
            <View style={styles.linkList}>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('Login')}>
                <Text style={styles.screenLinkText}>• Login Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('RoleSelection')}>
                <Text style={styles.screenLinkText}>• Role Selection Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('StudentRegistration')}>
                <Text style={styles.screenLinkText}>• Student Registration Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('TutorRegistration')}>
                <Text style={styles.screenLinkText}>• Tutor Registration Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('ForgotPassword')}>
                <Text style={styles.screenLinkText}>• Forgot Password Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.screenLink}
                onPress={() => handleNavigate('ResetPassword', { email: 'student@campus.ac.lk' })}
              >
                <Text style={styles.screenLinkText}>• Reset Password Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subGroupHeader}>2. Verification Flow</Text>
            <View style={styles.linkList}>
              <TouchableOpacity
                style={styles.screenLink}
                onPress={() => handleNavigate('EmailVerification', { email: 'student@campus.ac.lk' })}
              >
                <Text style={styles.screenLinkText}>• Email Verification (OTP)</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('VerifyIdentity')}>
                <Text style={styles.screenLinkText}>• Identity Verification (ID Upload)</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('FaceVerification')}>
                <Text style={styles.screenLinkText}>• Face Verification (Live Scan)</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.screenLink}
                onPress={() => handleNavigate('VerificationResult', { success: true })}
              >
                <Text style={styles.screenLinkText}>• Verification Result (Success State)</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.screenLink}
                onPress={() => handleNavigate('VerificationResult', { success: false, reason: 'ID photo was blurry' })}
              >
                <Text style={styles.screenLinkText}>• Verification Result (Failed State)</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('TutorVerificationStatus')}>
                <Text style={styles.screenLinkText}>• Tutor Verification Status (6 States)</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subGroupHeader}>3. Tutor Features</Text>
            <View style={styles.linkList}>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('TutorDashboard')}>
                <Text style={styles.screenLinkText}>• Tutor Dashboard</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('TutorProfileManage')}>
                <Text style={styles.screenLinkText}>• Tutor Profile View</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('EditProfile')}>
                <Text style={styles.screenLinkText}>• Edit Tutor Profile</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subGroupHeader}>4. Admin Portal</Text>
            <View style={styles.linkList}>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('AdminLogin')}>
                <Text style={styles.screenLinkText}>• Admin Login</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('AdminDashboard')}>
                <Text style={styles.screenLinkText}>• Admin Dashboard</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('TutorApplications')}>
                <Text style={styles.screenLinkText}>• Tutor Applications List</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.screenLink}
                onPress={() => handleNavigate('TutorApplicationDetails', { applicationId: 'APP-8421' })}
              >
                <Text style={styles.screenLinkText}>• Application Details & Module Approval</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.screenLink}
                onPress={() => handleNavigate('DocumentReview', { documentType: 'Student ID Card' })}
              >
                <Text style={styles.screenLinkText}>• Document Review Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('UserManagement')}>
                <Text style={styles.screenLinkText}>• User Management (Students, Tutors, Admin)</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subGroupHeader}>5. Platform Services & Settings</Text>
            <View style={styles.linkList}>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('Settings')}>
                <Text style={styles.screenLinkText}>• Settings Main Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('Security')}>
                <Text style={styles.screenLinkText}>• Security & Password</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('NotificationSettings')}>
                <Text style={styles.screenLinkText}>• Notification Settings</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('HelpSupport')}>
                <Text style={styles.screenLinkText}>• Help & Support / FAQs</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.screenLink} onPress={() => handleNavigate('AccountStatus')}>
                <Text style={styles.screenLinkText}>• Account Status Screen</Text>
                <Text style={styles.screenArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 43, 103, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.cardBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingTop: 12,
  },
  handle: {
    width: 48,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  currentRole: {
    fontWeight: '800',
    color: colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textLight,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 6,
  },
  subGroupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 16,
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  roleCardActive: {
    backgroundColor: '#EBF4FF',
    borderColor: colors.primary,
  },
  roleIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  roleTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  roleDesc: {
    fontSize: 10,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 2,
  },
  linkList: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  screenLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  screenLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  screenArrow: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
  },
});

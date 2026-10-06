import React, { useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
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
import DemoSwitcherModal from '../../components/DemoSwitcherModal';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SettingsScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const { user, logout } = useAuthStore();
  const [demoModalVisible, setDemoModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of UniMentor?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Platform Services</Text>
        <TouchableOpacity
          style={styles.demoHeaderBtn}
          onPress={() => setDemoModalVisible(true)}
        >
          <Text style={styles.demoHeaderText}>⚡ Demo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'UniMentor Member'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{(user?.role || 'student').toUpperCase()}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {(user?.accountStatus || 'active').toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 1: Account */}
        <Text style={styles.sectionHeader}>ACCOUNT & ACADEMIC PROFILE</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AccountStatus')}
          >
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={styles.menuLabel}>University Account Status & Audit</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('TutorVerificationStatus')}
          >
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={styles.menuLabel}>Faculty Verification & Module Badges</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              user?.role === 'mentor'
                ? navigation.navigate('EditProfile')
                : navigation.navigate('Profile')
            }
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuLabel}>Edit Profile & Academic Info</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Security */}
        <Text style={styles.sectionHeader}>SECURITY & CREDENTIALS</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Security')}
          >
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuLabel}>Password, 2FA & Biometric Login</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <Text style={styles.menuIcon}>🔔</Text>
            <Text style={styles.menuLabel}>Push Notifications & Reminders</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Section 3: Platform Services & Support */}
        <Text style={styles.sectionHeader}>SUPPORT & PLATFORM SERVICES</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuLabel}>Help Center & Campus Support</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'Campus Honor Code',
                'UniMentor maintains strict academic integrity. All tutoring sessions comply with university examination rules and guidelines.'
              )
            }
          >
            <Text style={styles.menuIcon}>🏛️</Text>
            <Text style={styles.menuLabel}>University Honor Code & Terms</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Section 4: Quick Demo Navigator */}
        <Text style={styles.sectionHeader}>EVALUATION & REVIEWER TOOLS</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setDemoModalVisible(true)}
          >
            <Text style={styles.menuIcon}>⚡</Text>
            <Text style={[styles.menuLabel, { color: colors.primary, fontWeight: '800' }]}>
              Open 24-Screen Demo Navigator
            </Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Sign Out of UniMentor</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>UniMentor Mobile Platform v2.4.0 • Build 892</Text>
      </ScrollView>

      {/* Demo Switcher */}
      <DemoSwitcherModal
        visible={demoModalVisible}
        onClose={() => setDemoModalVisible(false)}
      />
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
    paddingTop: 12,
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
  demoHeaderBtn: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  demoHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
    shadowColor: '#244369',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navy,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  rolePill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rolePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  statusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  menuArrow: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 4,
    marginBottom: 16,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textLight,
  },
});

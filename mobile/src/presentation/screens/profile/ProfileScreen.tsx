import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../domain/stores/authStore';
import { colors } from '../../../shared/theme';
import DemoSwitcherModal from '../../components/DemoSwitcherModal';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout, switchDemoRole } = useAuthStore();
  const [demoModalVisible, setDemoModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* User Profile Card */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{user?.name?.charAt(0) || 'U'}</Text>
            </View>
            <View style={styles.statusBadgeDot}>
              <Text style={styles.statusDotText}>✓</Text>
            </View>
          </View>

          <Text style={styles.userName}>{user?.name || 'Kavindu Perera'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Text style={styles.userDegree}>
            {user?.degree || 'BSc (Hons) in Computer Science'}
          </Text>
          <Text style={styles.userUni}>
            🏛️ {user?.university || 'University of Colombo'}
          </Text>

          {/* Quick Demo Switcher Bar */}
          <View style={styles.demoBar}>
            <Text style={styles.demoBarTitle}>ACTIVE FLOW: {user?.role?.toUpperCase() || 'STUDENT'}</Text>
            <View style={styles.demoBtnRow}>
              <TouchableOpacity
                style={[styles.demoPill, user?.role === 'student' && styles.demoPillActive]}
                onPress={() => switchDemoRole('student')}
              >
                <Text style={[styles.demoPillText, user?.role === 'student' && styles.demoPillTextActive]}>
                  🎓 Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoPill, user?.role === 'mentor' && styles.demoPillActive]}
                onPress={() => switchDemoRole('mentor')}
              >
                <Text style={[styles.demoPillText, user?.role === 'mentor' && styles.demoPillTextActive]}>
                  👨‍🏫 Tutor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoPill, user?.role === 'admin' && styles.demoPillActive]}
                onPress={() => switchDemoRole('admin')}
              >
                <Text style={[styles.demoPillText, user?.role === 'admin' && styles.demoPillTextActive]}>
                  🛡️ Admin
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Academic Details Card */}
        <Text style={styles.sectionHeader}>ACADEMIC ENROLLMENT</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Student Registration ID</Text>
            <Text style={styles.infoVal}>{user?.studentId || 'CS/2023/089'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Faculty & Department</Text>
            <Text style={styles.infoVal}>
              {user?.faculty || 'Computing'} • {user?.department || 'Computer Science'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Account Standing</Text>
            <View style={styles.standingBadge}>
              <Text style={styles.standingText}>
                {(user?.accountStatus || 'active').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Platform Services & Shortcuts */}
        <Text style={styles.sectionHeader}>SERVICES & AUDIT</Text>
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('AccountStatus')}
          >
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={styles.menuLabel}>Account Status & Standing</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('TutorVerificationStatus')}
          >
            <Text style={styles.menuIcon}>🛡️</Text>
            <Text style={styles.menuLabel}>Tutor Verification Status (6 States)</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.menuIcon}>⚙️</Text>
            <Text style={styles.menuLabel}>Settings & Platform Preferences</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('HelpSupport')}
          >
            <Text style={styles.menuIcon}>💬</Text>
            <Text style={styles.menuLabel}>Campus Help & Support Center</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* 24-Screen Demo Navigator */}
        <TouchableOpacity
          style={styles.allScreensBtn}
          onPress={() => setDemoModalVisible(true)}
          activeOpacity={0.88}
        >
          <Text style={styles.allScreensIcon}>⚡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.allScreensTitle}>Browse All 24 Screens</Text>
            <Text style={styles.allScreensSub}>
              Jump to any screen in Student, Tutor, or Admin flows
            </Text>
          </View>
          <Text style={styles.allScreensArrow}>→</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Demo Modal */}
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
  container: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 24,
    paddingBottom: 40,
  },
  profileHero: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
    shadowColor: '#244369',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#416FA7',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
  },
  statusBadgeDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  statusDotText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
  },
  userDegree: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  userUni: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  demoBar: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  demoBarTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 6,
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  demoPill: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  demoPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
  },
  demoPillTextActive: {
    color: colors.white,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  infoKey: {
    fontSize: 12,
    color: colors.textLight,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  standingBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  standingText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
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
    paddingVertical: 13,
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
  allScreensBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF4FF',
    borderWidth: 1.5,
    borderColor: '#C7D9FA',
    padding: 14,
    borderRadius: 16,
    marginBottom: 20,
    gap: 10,
  },
  allScreensIcon: {
    fontSize: 22,
  },
  allScreensTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  allScreensSub: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  allScreensArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
});

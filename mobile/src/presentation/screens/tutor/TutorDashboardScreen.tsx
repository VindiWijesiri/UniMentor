import React from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
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
import { useAuthStore } from '../../../domain/stores/authStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function TutorDashboardScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const { user } = useAuthStore();
  const tutor = user ?? { name: 'Tutor', email: '', university: '', completedSessions: 0, rating: 0, totalReviews: 0 };

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Navy Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTop}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{tutor.name.charAt(0)}</Text>
            </View>
            <View style={styles.heroCopy}>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>PEER TUTOR DASHBOARD</Text>
              </View>
              <Text style={styles.heroName}>{tutor.name}</Text>
              <Text style={styles.heroFaculty}>🏛️ {tutor.university || 'University of Moratuwa'}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsIconBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsIconText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Completion Bar */}
          <View style={styles.completionCard}>
            <View style={styles.compHeader}>
              <Text style={styles.compTitle}>Tutor Profile Readiness</Text>
              <Text style={styles.compPercent}>90% Complete</Text>
            </View>
            <View style={styles.compBarBg}>
              <View style={[styles.compBarFill, { width: '90%' }]} />
            </View>
          </View>
        </View>

        {/* Verification Status Card */}
        <TouchableOpacity
          style={styles.verificationCard}
          onPress={() => navigation.navigate('TutorVerificationStatus')}
          activeOpacity={0.9}
        >
          <View style={styles.verCardLeft}>
            <View style={styles.verCheckCircle}>
              <Text style={styles.verCheckMark}>✓</Text>
            </View>
            <View>
              <Text style={styles.verStatusText}>Faculty Verified • Active on Catalog</Text>
              <Text style={styles.verSubText}>3 Approved Modules • Re-check status anytime</Text>
            </View>
          </View>
          <Text style={styles.verArrow}>→</Text>
        </TouchableOpacity>

        {/* 2x2 Performance Metrics Grid */}
        <Text style={styles.sectionHeader}>PERFORMANCE & EARNINGS</Text>
        <View style={styles.metricsGrid}>
          {/* Card 1 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>💰</Text>
            <Text style={styles.metricValue}>LKR 185,000</Text>
            <Text style={styles.metricLabel}>Total Earnings</Text>
            <View style={styles.trendPill}>
              <Text style={styles.trendText}>+14% this month</Text>
            </View>
          </View>

          {/* Card 2 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⏳</Text>
            <Text style={styles.metricValue}>{tutor.completedSessions || 74} hrs</Text>
            <Text style={styles.metricLabel}>Sessions Conducted</Text>
            <View style={[styles.trendPill, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.trendText, { color: colors.primary }]}>Top 5% Tutor</Text>
            </View>
          </View>

          {/* Card 3 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⭐</Text>
            <Text style={styles.metricValue}>{tutor.rating || '4.9'} / 5.0</Text>
            <Text style={styles.metricLabel}>{tutor.totalReviews || 38} Student Reviews</Text>
            <View style={[styles.trendPill, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.trendText, { color: '#B45309' }]}>98% Positive</Text>
            </View>
          </View>

          {/* Card 4 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>👥</Text>
            <Text style={styles.metricValue}>19 Students</Text>
            <Text style={styles.metricLabel}>Active Learners</Text>
            <View style={[styles.trendPill, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.trendText, { color: colors.success }]}>6 Repeat Clients</Text>
            </View>
          </View>
        </View>

        {/* Upcoming Sessions Section */}
        <View style={styles.sessionsSection}>
          <View style={styles.sessionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Sessions')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Session 1 */}
          <View style={styles.sessionItem}>
            <View style={styles.sessionDateBadge}>
              <Text style={styles.sessionDateDay}>TODAY</Text>
              <Text style={styles.sessionDateTime}>5:30 PM</Text>
            </View>
            <View style={styles.sessionDetails}>
              <Text style={styles.sessionStudent}>Kavindu Perera</Text>
              <Text style={styles.sessionModule}>Data Structures • Binary Search Trees</Text>
              <Text style={styles.sessionLocation}>📍 University Library, Study Pod 3</Text>
            </View>
            <View style={styles.sessionRateBadge}>
              <Text style={styles.sessionRate}>LKR 2,500</Text>
            </View>
          </View>

          {/* Session 2 */}
          <View style={styles.sessionItem}>
            <View style={[styles.sessionDateBadge, { backgroundColor: '#E0F2FE' }]}>
              <Text style={[styles.sessionDateDay, { color: colors.primary }]}>TOMORROW</Text>
              <Text style={[styles.sessionDateTime, { color: colors.primary }]}>6:00 PM</Text>
            </View>
            <View style={styles.sessionDetails}>
              <Text style={styles.sessionStudent}>Minoli Silva</Text>
              <Text style={styles.sessionModule}>OOP • Polymorphism & Inheritance</Text>
              <Text style={styles.sessionLocation}>🌐 Online Zoom Meeting Room</Text>
            </View>
            <View style={styles.sessionRateBadge}>
              <Text style={styles.sessionRate}>LKR 2,500</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Shortcuts */}
        <Text style={styles.sectionHeader}>QUICK SHORTCUTS</Text>
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('TutorProfileManage')}
          >
            <Text style={styles.shortcutIcon}>👤</Text>
            <Text style={styles.shortcutLabel}>Public Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.shortcutIcon}>✏️</Text>
            <Text style={styles.shortcutLabel}>Edit Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('TutorVerificationStatus')}
          >
            <Text style={styles.shortcutIcon}>📜</Text>
            <Text style={styles.shortcutLabel}>Audit Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.shortcutIcon}>🛡️</Text>
            <Text style={styles.shortcutLabel}>Security</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  container: {
    paddingBottom: 40,
  },
  heroBanner: {
    backgroundColor: '#062B67',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0B1F4C',
    borderWidth: 2,
    borderColor: '#416FA7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  heroCopy: {
    flex: 1,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 160, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFD200',
    letterSpacing: 0.5,
  },
  heroName: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.white,
  },
  heroFaculty: {
    fontSize: 11,
    color: '#D7E6FA',
    marginTop: 2,
  },
  settingsIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIconText: {
    fontSize: 18,
  },
  completionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  compHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  compTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  compPercent: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD200',
  },
  compBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
  },
  compBarFill: {
    height: '100%',
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: -14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: colors.navy,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  verCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  verCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verCheckMark: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.success,
  },
  verStatusText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  verSubText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  verArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginLeft: 8,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricCard: {
    width: '48.5%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#244369',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textLight,
    marginBottom: 8,
  },
  trendPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  sessionsSection: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 24,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  sessionDateBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
    width: 68,
  },
  sessionDateDay: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  sessionDateTime: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    marginTop: 2,
  },
  sessionDetails: {
    flex: 1,
  },
  sessionStudent: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  sessionModule: {
    fontSize: 11,
    color: colors.text,
    marginTop: 1,
  },
  sessionLocation: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  sessionRateBadge: {
    paddingLeft: 6,
  },
  sessionRate: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.navy,
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  shortcutBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 12,
    marginHorizontal: 3,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  shortcutIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  shortcutLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
  },
});

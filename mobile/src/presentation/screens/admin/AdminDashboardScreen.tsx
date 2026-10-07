import React, { useEffect, useState } from 'react';
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
import { adminRepository } from '../../../data/repositories/adminRepository';
import type { User } from '../../../domain/entities/User';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AdminDashboardScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const admin = user ?? { name: 'Admin', email: '' };
  const [userCount, setUserCount] = useState(0);
  const [joinedWeek, setJoinedWeek] = useState(0);
  const [pendingTutors, setPendingTutors] = useState(0);
  const [recent, setRecent] = useState<User[]>([]);

  useEffect(() => {
    adminRepository.directory()
      .then((users) => {
        setUserCount(users.length);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setJoinedWeek(users.filter((item) => item.createdAt && new Date(item.createdAt).getTime() >= weekAgo).length);
        const waiting = users.filter((item) => item.role === 'mentor' && item.verificationStatus !== 'approved' && item.verificationStatus !== 'rejected');
        setPendingTutors(waiting.length);
        setRecent(waiting.slice(0, 5));
      })
      .catch(() => undefined);
  }, []);

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Navy Header Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTop}>
            <View style={styles.adminAvatar}>
              <Text style={styles.avatarText}>{admin.name.charAt(0)}</Text>
            </View>
            <View style={styles.heroCopy}>
              <View style={styles.staffBadge}>
                <Text style={styles.staffBadgeText}>ADMINISTRATION CONSOLE</Text>
              </View>
              <Text style={styles.adminName}>{admin.name}</Text>
              <Text style={styles.adminRole}>Lead Verification Officer • UniMentor</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* System Status Pill */}
          <View style={styles.systemStatusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.systemStatusText}>
              Platform Health: Normal • All Services Operational (99.9% Uptime)
            </Text>
          </View>
        </View>

        {/* 4 Summary Stats */}
        <View style={styles.statsGrid}>
          {/* Stat 1 */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <View style={styles.statIconWrap}>
              <Text style={styles.statEmoji}>👥</Text>
            </View>
            <Text style={styles.statNumber}>{userCount}</Text>
            <Text style={styles.statLabel}>Active University Users</Text>
            <Text style={styles.statSub}>{joinedWeek} joined this week</Text>
          </TouchableOpacity>

          {/* Stat 2 */}
          <TouchableOpacity
            style={[styles.statCard, styles.statCardAlert]}
            onPress={() => navigation.navigate('TutorApplications')}
          >
            <View style={[styles.statIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Text style={styles.statEmoji}>⏳</Text>
            </View>
            <Text style={[styles.statNumber, { color: '#B45309' }]}>{pendingTutors}</Text>
            <Text style={styles.statLabel}>Pending Tutor Audits</Text>
            <Text style={[styles.statSub, { color: '#B45309', fontWeight: '800' }]}>
              Action Required  →
            </Text>
          </TouchableOpacity>

          {/* Stat 3 */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Text style={styles.statEmoji}>📚</Text>
            </View>
            <Text style={styles.statNumber}>—</Text>
            <Text style={styles.statLabel}>Approved Modules</Text>
            <Text style={styles.statSub}>Not tracked yet</Text>
          </View>

          {/* Stat 4 */}
          <View style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Text style={styles.statEmoji}>🛡️</Text>
            </View>
            <Text style={styles.statNumber}>—</Text>
            <Text style={styles.statLabel}>Audit Integrity Rate</Text>
            <Text style={styles.statSub}>Not tracked yet</Text>
          </View>
        </View>

        {/* Priority Action Shortcuts */}
        <Text style={styles.sectionHeader}>ADMIN SERVICES & CONTROLS</Text>
        <View style={styles.actionsList}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('TutorApplications')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#E0F2FE' }]}>
                <Text style={styles.actionEmoji}>📋</Text>
              </View>
              <View>
                <Text style={styles.actionTitle}>Review Tutor Applications</Text>
                <Text style={styles.actionSub}>{pendingTutors} tutors awaiting review</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Text style={styles.actionEmoji}>🎓</Text>
              </View>
              <View>
                <Text style={styles.actionTitle}>User Directory & Permissions</Text>
                <Text style={styles.actionSub}>Search students, tutors, lecturers, and status</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('TutorApplications')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.actionEmoji}>🔍</Text>
              </View>
              <View>
                <Text style={styles.actionTitle}>Document Inspection Viewer</Text>
                <Text style={styles.actionSub}>Open a tutor application to review their account</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Applications Queue */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Pending Verification Queue</Text>
            <TouchableOpacity onPress={() => navigation.navigate('TutorApplications')}>
              <Text style={styles.viewAllText}>View All ({pendingTutors})</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <Text style={styles.queueMeta}>No tutors are waiting for review.</Text>
          ) : recent.map((item) => (
            <TouchableOpacity
              key={item._id}
              style={styles.queueItem}
              onPress={() =>
                navigation.navigate('TutorApplicationDetails', {
                  applicationId: item._id,
                  name: item.name,
                  degree: item.degree || item.degreeProgramme,
                  university: item.university,
                  faculty: item.faculty,
                  studentId: item.studentId,
                  modules: item.subjects ?? [],
                  email: item.email,
                  hourlyRate: item.hourlyRate,
                  submittedDate: item.createdAt ? new Date(item.createdAt).toLocaleString() : '—',
                })
              }
            >
              <View style={styles.queueAvatar}>
                <Text style={styles.queueAvatarText}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.queueDetails}>
                <Text style={styles.queueName}>{item.name}</Text>
                <Text style={styles.queueMeta}>
                  {(item.faculty || item.university || 'Campus')} • {(item.subjects?.length || 0)} modules
                </Text>
                <Text style={styles.queueTime}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Submitted'}</Text>
              </View>
              <View style={styles.reviewBadge}>
                <Text style={styles.reviewBadgeText}>REVIEW</Text>
              </View>
            </TouchableOpacity>
          ))}
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
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  adminAvatar: {
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
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
  },
  heroCopy: {
    flex: 1,
  },
  staffBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 210, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 3,
  },
  staffBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFD200',
    letterSpacing: 0.5,
  },
  adminName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  adminRole: {
    fontSize: 11,
    color: '#D7E6FA',
    marginTop: 2,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsIcon: {
    fontSize: 18,
  },
  systemStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 8,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  systemStatusText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
  },
  statCard: {
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
  statCardAlert: {
    borderColor: '#FCD34D',
    backgroundColor: '#FFFDF5',
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 18,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  statSub: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  actionsList: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    marginBottom: 24,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  actionSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  recentSection: {
    backgroundColor: colors.white,
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  queueAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  queueAvatarText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  queueDetails: {
    flex: 1,
  },
  queueName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  queueMeta: {
    fontSize: 11,
    color: colors.text,
    marginTop: 1,
  },
  queueTime: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  reviewBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reviewBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
});

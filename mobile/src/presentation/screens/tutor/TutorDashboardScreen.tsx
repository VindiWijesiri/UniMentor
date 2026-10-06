import React, { useEffect, useState } from 'react';
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
import { learningRepository } from '../../../data/repositories/learningRepository';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { tutorPortalRepository } from '../../../data/repositories/tutorPortalRepository';
import type { Session } from '../../../domain/entities/Session';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

function money(amount: number) {
  return `LKR ${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

function dayLabel(iso: string) {
  const date = new Date(iso);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const that = new Date(date);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((that.getTime() - start.getTime()) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'TOMORROW';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toUpperCase();
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function studentName(session: Session) {
  return typeof session.studentId === 'object' && session.studentId?.name ? session.studentId.name : 'Student';
}

export default function TutorDashboardScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const { user } = useAuthStore();
  const tutor = user ?? { name: 'Tutor', email: '', university: '', completedSessions: 0, rating: 0, totalReviews: 0, reviewCount: 0 };
  const [earnings, setEarnings] = useState(0);
  const [monthNote, setMonthNote] = useState('');
  const [completed, setCompleted] = useState(0);
  const [upcoming, setUpcoming] = useState<Session[]>([]);
  const [activeStudents, setActiveStudents] = useState(0);
  const [pendingGrading, setPendingGrading] = useState(0);
  const [classMastery, setClassMastery] = useState<number | null>(null);
  const [repeatClients, setRepeatClients] = useState(0);

  useEffect(() => {
    learningRepository.getTutorDashboard()
      .then((board) => {
        setActiveStudents(board.stats.activeStudents);
        setPendingGrading(board.stats.pendingGrading);
        setClassMastery(board.stats.classMastery);
      })
      .catch(() => {});
    tutorPortalRepository.payments()
      .then((payload) => {
        setEarnings(payload.totalLkr || 0);
        const now = new Date();
        const thisKey = `${now.getFullYear()}-${now.getMonth()}`;
        const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastKey = `${previous.getFullYear()}-${previous.getMonth()}`;
        let thisMonth = 0;
        let lastMonth = 0;
        (payload.items ?? []).forEach((item) => {
          const date = new Date(item.createdAt);
          const key = `${date.getFullYear()}-${date.getMonth()}`;
          if (key === thisKey) thisMonth += item.amountLkr;
          if (key === lastKey) lastMonth += item.amountLkr;
        });
        if (lastMonth > 0) {
          const delta = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
          setMonthNote(`${delta >= 0 ? '+' : ''}${delta}% vs last month`);
        } else if (thisMonth > 0) {
          setMonthNote(`${money(thisMonth)} this month`);
        }
      })
      .catch(() => {});
    sessionRepository.getMySessions()
      .then((sessions) => {
        const done = sessions.filter((session) => session.status === 'completed');
        setCompleted(done.length);
        const counts = new Map<string, number>();
        done.forEach((session) => {
          const id = typeof session.studentId === 'object' ? session.studentId._id : session.studentId;
          counts.set(id, (counts.get(id) || 0) + 1);
        });
        setRepeatClients([...counts.values()].filter((count) => count > 1).length);
        setUpcoming(
          sessions
            .filter((session) => (session.status === 'pending' || session.status === 'confirmed') && new Date(session.scheduledAt).getTime() >= Date.now())
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .slice(0, 3),
        );
      })
      .catch(() => {});
  }, []);

  const checks = [
    Boolean(tutor.name),
    Boolean(user?.bio),
    Boolean(user?.degree || user?.degreeProgramme),
    Boolean(user?.university),
    typeof user?.hourlyRate === 'number' && user.hourlyRate > 0,
    Boolean((user?.subjects?.length || 0) + (user?.approvedModules?.length || 0)),
    Boolean(user?.availability),
    Boolean(user?.phone),
  ];
  const readiness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  const verification = String(user?.verificationStatus || 'unverified');
  const verified = verification === 'approved' || verification === 'verified';
  const moduleCount = (user?.subjects?.length || 0) || (user?.approvedModules?.length || 0);
  const rating = typeof user?.rating === 'number' ? user.rating : 0;
  const reviews = user?.reviewCount || user?.totalReviews || 0;

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
              <Text style={styles.heroFaculty}>{user?.university || user?.faculty || 'Campus not added'}</Text>
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
              <Text style={styles.compPercent}>{readiness}% Complete</Text>
            </View>
            <View style={styles.compBarBg}>
              <View style={[styles.compBarFill, { width: `${readiness}%` }]} />
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
              <Text style={styles.verStatusText}>
                {verified ? 'Faculty verified • Active on catalog' : verification === 'rejected' ? 'Application rejected' : 'Verification in progress'}
              </Text>
              <Text style={styles.verSubText}>{moduleCount} module{moduleCount === 1 ? '' : 's'} on the profile</Text>
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
            <Text style={styles.metricValue}>{money(earnings)}</Text>
            <Text style={styles.metricLabel}>Total Earnings</Text>
            {monthNote ? (
              <View style={styles.trendPill}>
                <Text style={styles.trendText}>{monthNote}</Text>
              </View>
            ) : null}
          </View>

          {/* Card 2 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⏳</Text>
            <Text style={styles.metricValue}>{completed}</Text>
            <Text style={styles.metricLabel}>Sessions completed</Text>
            {classMastery !== null ? (
              <View style={[styles.trendPill, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[styles.trendText, { color: colors.primary }]}>Class mastery {classMastery}%</Text>
              </View>
            ) : null}
          </View>

          {/* Card 3 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>⭐</Text>
            <Text style={styles.metricValue}>{rating.toFixed(1)} / 5.0</Text>
            <Text style={styles.metricLabel}>{reviews} student review{reviews === 1 ? '' : 's'}</Text>
          </View>

          {/* Card 4 */}
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>👥</Text>
            <Text style={styles.metricValue}>{activeStudents}</Text>
            <Text style={styles.metricLabel}>Active learners</Text>
            <View style={[styles.trendPill, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.trendText, { color: colors.success }]}>
                {pendingGrading} to grade • {repeatClients} repeat
              </Text>
            </View>
          </View>
        </View>

        {/* Upcoming Sessions Section */}
        <View style={styles.sessionsSection}>
          <View style={styles.sessionHeaderRow}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Sessions' })}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {upcoming.length === 0 ? (
            <Text style={styles.emptySessions}>No upcoming sessions yet.</Text>
          ) : upcoming.map((session) => (
            <View key={session._id} style={styles.sessionItem}>
              <View style={styles.sessionDateBadge}>
                <Text style={styles.sessionDateDay}>{dayLabel(session.scheduledAt)}</Text>
                <Text style={styles.sessionDateTime}>{timeLabel(session.scheduledAt)}</Text>
              </View>
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionStudent}>{studentName(session)}</Text>
                <Text style={styles.sessionModule}>{session.subject}{session.moduleCode ? ` • ${session.moduleCode}` : ''}</Text>
                <Text style={styles.sessionLocation}>{session.status === 'pending' ? 'Waiting for confirmation' : 'Confirmed'}</Text>
              </View>
              {user?.hourlyRate ? (
                <View style={styles.sessionRateBadge}>
                  <Text style={styles.sessionRate}>{money(user.hourlyRate)}</Text>
                </View>
              ) : null}
            </View>
          ))}
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
            onPress={() => navigation.navigate('TutorAvailability')}
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
            onPress={() => navigation.navigate('Security')}
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
  emptySessions: {
    fontSize: 13,
    color: colors.textLight,
    paddingVertical: 12,
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

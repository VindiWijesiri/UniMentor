import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../domain/stores/authStore';
import {
  SvgCalendar,
  SvgClock,
  SvgFileText,
  SvgUser,
} from '../../components/common/SvgIcons';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface ActivityItem {
  id: string;
  student: string;
  module: string;
  tutor: string;
  time: string;
  status: 'Active' | 'Pending' | 'Completed';
}

const mockActivity: ActivityItem[] = [
  {
    id: '1',
    student: 'Clara Tan',
    module: 'Database Systems',
    tutor: 'Alex F.',
    time: 'Today 10 AM',
    status: 'Active',
  },
  {
    id: '2',
    student: 'Marco Silva',
    module: 'Algorithms',
    tutor: 'Elena R.',
    time: 'Today 2 PM',
    status: 'Pending',
  },
  {
    id: '3',
    student: 'Jonas K.',
    module: 'Computer Networks',
    tutor: 'Sam O.',
    time: 'Yesterday',
    status: 'Completed',
  },
];

export default function AdminDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const { user, logout } = useAuthStore();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activities] = useState<ActivityItem[]>(mockActivity);

  const handleAddTutor = () => {
    Alert.alert(
      'Administrative Action',
      'Choose an action for tutor onboarding:',
      [
        {
          text: 'Review Applications',
          onPress: () => navigation.navigate('TutorApplications'),
        },
        {
          text: 'Register New Tutor',
          onPress: () => navigation.navigate('TutorRegistration'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSystemAudit = () => {
    Alert.alert(
      'System Audit Initialized',
      'Automated transcript hashing and security audit completed. All 34 tutor certificates are verified against campus registries.',
      [
        { text: 'View Document Review', onPress: () => navigation.navigate('DocumentReview') },
        { text: 'OK' },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Header Bar matching UI Screenshot */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => setShowProfileMenu(true)}
            activeOpacity={0.85}
          >
            <View style={styles.avatarBorder}>
              <Image
                source={require('../../../../assets/tutor_avatar.jpg')}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top 3 Summary Stat Cards */}
        <View style={styles.metricsRow}>
          {/* Card 1: Total Sessions */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <SvgCalendar size={18} color="#EAA023" />
              <Text style={[styles.trendBadge, styles.trendGreen]}>+12%</Text>
            </View>
            <Text style={styles.metricValue}>148</Text>
            <Text style={styles.metricLabel}>Total Sessions</Text>
          </View>

          {/* Card 2: Active Tutors */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <SvgUser size={18} color="#EAA023" />
              <Text style={[styles.trendBadge, styles.trendGreen]}>+3</Text>
            </View>
            <Text style={styles.metricValue}>34</Text>
            <Text style={styles.metricLabel}>Active Tutors</Text>
          </View>

          {/* Card 3: Pending Requests */}
          <View style={styles.metricCard}>
            <View style={styles.metricTopRow}>
              <SvgClock size={18} color="#EAA023" />
              <Text style={[styles.trendBadge, styles.trendTeal]}>-2</Text>
            </View>
            <Text style={styles.metricValue}>8</Text>
            <Text style={styles.metricLabel}>Pending Requests</Text>
          </View>
        </View>

        {/* Section 1: Administrative Actions */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>ADMINISTRATIVE ACTIONS</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleAddTutor}
            activeOpacity={0.8}
          >
            <Text style={styles.plusIcon}>+</Text>
            <Text style={styles.actionBtnText}>Add Tutor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleSystemAudit}
            activeOpacity={0.8}
          >
            <SvgFileText size={17} color="#EAA023" />
            <Text style={styles.actionBtnText}>System Audit</Text>
          </TouchableOpacity>
        </View>

        {/* Section 2: Performance Insights */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>PERFORMANCE INSIGHTS</Text>
        </View>

        <View style={styles.insightsRow}>
          {/* Card 1: Session Trend */}
          <View style={styles.insightCard}>
            <View style={styles.insightHead}>
              <View style={styles.insightTitleRow}>
                <SvgCalendar size={15} color="#EAA023" />
                <Text style={styles.insightTitle}>Session Trend</Text>
              </View>
              <Text style={styles.insightBadgeGreen}>+12%</Text>
            </View>

            {/* Bar Chart Visual */}
            <View style={styles.chartBox}>
              {[22, 32, 40, 50, 68, 80, 92, 98].map((height, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.chartBar,
                    {
                      height: `${height}%`,
                      backgroundColor: idx < 3 ? '#FEF3C7' : '#EAA023',
                    },
                  ]}
                />
              ))}
            </View>

            <Text style={styles.insightFooterText}>148 sessions this week</Text>
          </View>

          {/* Card 2: Tutor Activity */}
          <View style={styles.insightCard}>
            <View style={styles.insightHead}>
              <View style={styles.insightTitleRow}>
                <SvgUser size={15} color="#EAA023" />
                <Text style={styles.insightTitle}>Tutor Activity</Text>
              </View>
              <Text style={styles.insightBadgeGreen}>+3</Text>
            </View>

            {/* Gauge Circle Visual */}
            <View style={styles.activityBox}>
              <View style={styles.activityCircle}>
                <Text style={styles.activityCircleNum}>34</Text>
              </View>
            </View>

            <Text style={styles.insightFooterText}>34 active tutors</Text>
          </View>
        </View>

        {/* Section 3: Recent System Activity */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>RECENT SYSTEM ACTIVITY</Text>
        </View>

        <View style={styles.tableCard}>
          {/* Navy Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, { flex: 2 }]}>Student / Tutor</Text>
            <Text style={[styles.thText, { flex: 1.4, textAlign: 'center' }]}>Session Time</Text>
            <Text style={[styles.thText, { flex: 1, textAlign: 'right' }]}>Status</Text>
          </View>

          {/* Rows */}
          {activities.map((item, index) => (
            <React.Fragment key={item.id}>
              <View style={styles.tableRow}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.rowMainName}>{item.student}</Text>
                  <Text style={styles.rowSub}>
                    {item.module} • {item.tutor}
                  </Text>
                </View>

                <Text style={[styles.rowTime, { flex: 1.4, textAlign: 'center' }]}>
                  {item.time}
                </Text>

                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'Active' && styles.statusActive,
                      item.status === 'Pending' && styles.statusPending,
                      item.status === 'Completed' && styles.statusCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'Active' && styles.statusActiveText,
                        item.status === 'Pending' && styles.statusPendingText,
                        item.status === 'Completed' && styles.statusCompletedText,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
              {index < activities.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* System Status Footer Card */}
        <View style={styles.systemStatusCard}>
          <View style={styles.systemStatusLeft}>
            <View style={styles.pulsingDot} />
            <Text style={styles.systemStatusLabel}>
              All systems operational — latency 48ms
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowDetailsModal(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.detailsBtnText}>Details</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDetailsModal(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>System Infrastructure Telemetry</Text>
            <Text style={styles.modalSub}>UniMentor Enterprise Cloud Node 01</Text>

            <View style={styles.telemetryList}>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>API Response Latency:</Text>
                <Text style={styles.telemetryVal}>48ms (Optimal)</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Platform Uptime:</Text>
                <Text style={styles.telemetryVal}>99.98% (30-day)</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>PostgreSQL Replica Lag:</Text>
                <Text style={styles.telemetryVal}>0.2ms</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Active WebSockets (Pods):</Text>
                <Text style={styles.telemetryVal}>14 rooms online</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Database Connection Pool:</Text>
                <Text style={styles.telemetryVal}>18% capacity</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowDetailsModal(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Admin Profile & Actions Menu */}
      <Modal
        visible={showProfileMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileMenu(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowProfileMenu(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.adminProfileHeader}>
              <Image
                source={require('../../../../assets/tutor_avatar.jpg')}
                style={styles.adminProfileImg}
                resizeMode="cover"
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.adminProfileName}>{user?.name || 'Administrator'}</Text>
                <Text style={styles.adminProfileRole}>{user?.email || 'admin@unimentor.dev'}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>CAMPUS SUPER ADMIN</Text>
                </View>
              </View>
            </View>

            <View style={{ gap: 8, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.menuItemBtn}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('UserManagement');
                }}
              >
                <Text style={styles.menuItemText}>👥 Manage Users & Registrations</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemBtn}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('TutorApplications');
                }}
              >
                <Text style={styles.menuItemText}>🎓 Review Tutor Audits</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItemBtn}
                onPress={() => {
                  setShowProfileMenu(false);
                  navigation.navigate('Settings');
                }}
              >
                <Text style={styles.menuItemText}>⚙️ Security & Settings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItemBtn, { borderColor: '#FEE2E2', backgroundColor: '#FEF2F2' }]}
                onPress={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
              >
                <Text style={[styles.menuItemText, { color: '#DC2626' }]}>🚪 Sign Out</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 38,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBorder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: '#EAA023',
    overflow: 'hidden',
    backgroundColor: '#061E47',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandMentor: {
    color: '#EAA023',
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28,
  },

  /* Top 3 Metric Cards */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  metricTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trendBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  trendGreen: {
    color: '#10B981',
  },
  trendTeal: {
    color: '#0D9488',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#061E47',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  orangeIndicator: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EAA023',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#061E47',
    letterSpacing: 0.8,
  },

  /* Action Buttons */
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  plusIcon: {
    color: '#EAA023',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -2,
  },
  actionBtnText: {
    color: '#061E47',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Performance Insights */
  insightsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  insightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  insightHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightTitle: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  insightBadgeGreen: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  chartBox: {
    height: 58,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 6,
    marginVertical: 8,
  },
  chartBar: {
    width: 7,
    borderRadius: 4,
  },
  activityBox: {
    height: 58,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  activityCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityCircleNum: {
    fontSize: 13,
    fontWeight: '900',
    color: '#061E47',
  },
  insightFooterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Activity Table */
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  tableHeader: {
    backgroundColor: '#061E47',
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowMainName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  rowSub: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  rowTime: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusActiveText: {
    color: '#16A34A',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#D97706',
  },
  statusCompleted: {
    backgroundColor: '#F1F5F9',
  },
  statusCompletedText: {
    color: '#475569',
  },

  /* Bottom Operational Card */
  systemStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  systemStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  systemStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EAA023',
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#061E47',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  telemetryList: {
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  telemetryKey: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  telemetryVal: {
    fontSize: 12,
    color: '#061E47',
    fontWeight: '800',
  },
  modalCloseBtn: {
    backgroundColor: '#061E47',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  adminProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  adminProfileImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#EAA023',
  },
  adminProfileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#061E47',
  },
  adminProfileRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '800',
  },
  menuItemBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#061E47',
  },
});

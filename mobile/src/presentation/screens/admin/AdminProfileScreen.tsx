import React from 'react';
import {
  Alert,
  Image,
  Platform,
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
  SvgChevronRight,
  SvgShieldCheck,
  SvgUser,
  SvgLock,
  SvgFileText,
} from '../../components/common/SvgIcons';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AdminProfileScreen({ navigation }: Props) {
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const { user, logout } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out of Admin Console',
      'Are you sure you want to end your administrative session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Navy Header Profile Card */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 6 }]}>
        <View style={styles.brandRow}>
          <Text style={styles.brandUni}>Uni</Text>
          <Text style={styles.brandMentor}>Mentor</Text>
        </View>

        <View style={styles.profileHeaderBox}>
          <View style={styles.avatarBorder}>
            <Image
              source={require('../../../../assets/tutor_avatar.jpg')}
              style={styles.avatarImg}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.adminName}>{user?.name || 'Admin Kasun Jayawardena'}</Text>
          <Text style={styles.adminEmail}>{user?.email || 'admin@unimentor.dev'}</Text>

          <View style={styles.roleBadge}>
            <SvgShieldCheck size={14} color="#B45309" />
            <Text style={styles.roleBadgeText}>CAMPUS SUPER ADMIN</Text>
          </View>
          <Text style={styles.universitySub}>SLIIT Malabe Campus • Platform Governance</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 85 }]}
      >
        {/* Top 3 Supervision KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>34</Text>
            <Text style={styles.kpiLabel}>Tutors Managed</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiVal}>148</Text>
            <Text style={styles.kpiLabel}>Sessions Audited</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={[styles.kpiVal, { color: '#10B981' }]}>99.98%</Text>
            <Text style={styles.kpiLabel}>System Uptime</Text>
          </View>
        </View>

        {/* Section 1: Staff Official Details */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>GOVERNANCE IDENTITY & CLEARANCE</Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Campus Node</Text>
            <Text style={styles.detailVal}>SLIIT Malabe Campus</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Department</Text>
            <Text style={styles.detailVal}>Quality & Verification Board</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Faculty</Text>
            <Text style={styles.detailVal}>Academic Administration</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Employee ID</Text>
            <Text style={styles.detailVal}>ADM-SLIIT-2026-001</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Security Clearance</Text>
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>Tier 1 (Full Governance)</Text>
            </View>
          </View>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>2FA Enforcement</Text>
            <View style={styles.twoFaBadge}>
              <Text style={styles.twoFaText}>Enforced (Authenticator App)</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Quick Management Shortcuts */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>GOVERNANCE SHORTCUTS</Text>
        </View>

        <View style={styles.shortcutsCard}>
          <TouchableOpacity
            style={styles.shortcutRow}
            onPress={() => navigation.navigate('UserManagement')}
            activeOpacity={0.7}
          >
            <View style={styles.shortcutIconWrap}>
              <SvgUser size={18} color="#061E47" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>User Directory & Account Status</Text>
              <Text style={styles.shortcutSub}>Manage students, tutors, and account suspensions</Text>
            </View>
            <SvgChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.shortcutRow}
            onPress={() => navigation.navigate('TutorApplications')}
            activeOpacity={0.7}
          >
            <View style={styles.shortcutIconWrap}>
              <SvgShieldCheck size={18} color="#EAA023" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Tutor Application Audits</Text>
              <Text style={styles.shortcutSub}>Review credentials, transcripts & module approvals</Text>
            </View>
            <SvgChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.shortcutRow}
            onPress={() => navigation.navigate('DocumentReview')}
            activeOpacity={0.7}
          >
            <View style={styles.shortcutIconWrap}>
              <SvgFileText size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Document Verification Vault</Text>
              <Text style={styles.shortcutSub}>Inspect uploaded certificates and transcript hashes</Text>
            </View>
            <SvgChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.shortcutRow}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={styles.shortcutIconWrap}>
              <SvgLock size={18} color="#6366F1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.shortcutTitle}>Security & Audit Policy</Text>
              <Text style={styles.shortcutSub}>Two-factor settings, telemetry, and platform rules</Text>
            </View>
            <SvgChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutBtnText}>🚪  Sign Out of Admin Console</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 22,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  brandMentor: {
    color: '#EAA023',
    fontSize: 18,
    fontWeight: '800',
  },
  profileHeaderBox: {
    alignItems: 'center',
    width: '100%',
  },
  avatarBorder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: '#EAA023',
    overflow: 'hidden',
    backgroundColor: '#061E47',
    marginBottom: 10,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  adminName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  adminEmail: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    marginBottom: 6,
  },
  roleBadgeText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  universitySub: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 16,
  },

  /* Top 3 KPI Cards */
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#061E47',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textAlign: 'center',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
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

  /* Details Card */
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  detailVal: {
    fontSize: 12,
    color: '#061E47',
    fontWeight: '800',
  },
  tierBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tierBadgeText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '800',
  },
  twoFaBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  twoFaText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* Shortcuts Card */
  shortcutsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    gap: 12,
  },
  shortcutIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#061E47',
  },
  shortcutSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  /* Sign Out Button */
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  signOutBtnText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
});

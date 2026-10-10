import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../shared/theme';
import { useAuthStore, mockTutorUser } from '../../../domain/stores/authStore';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function TutorProfileManageScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const { user } = useAuthStore();
  const tutor = user?.role === 'mentor' ? user : mockTutorUser;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      {/* Top Header Bar (Matching Student Dashboard Style) */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            {navigation?.canGoBack?.() ? (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Tutor Profile</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Sub-bar with Edit Button */}
        <View style={styles.subBarRow}>
          <Text style={styles.subBarText}>Personal Credentials & Accreditation</Text>
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editHeaderText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card Hero */}
        <View style={styles.profileHero}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{tutor.name.charAt(0)}</Text>
            </View>
            <View style={styles.verifiedCheckBadge}>
              <Text style={styles.verifiedCheck}>✓</Text>
            </View>
          </View>

          <Text style={styles.tutorName}>{tutor.name}</Text>
          <Text style={styles.tutorDegree}>{tutor.degree || 'MSc in Software Engineering'}</Text>
          <Text style={styles.tutorUni}>🏛️ {tutor.university || 'University of Moratuwa'}</Text>

          {/* Key Stats Row */}
          <View style={styles.statsBar}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>★ {tutor.rating || '4.9'}</Text>
              <Text style={styles.statLabel}>{tutor.totalReviews || 38} Reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{tutor.completedSessions || 74}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>LKR {tutor.hourlyRate || 2500}</Text>
              <Text style={styles.statLabel}>Per Hour</Text>
            </View>
          </View>
        </View>

        {/* Verification Status Banner */}
        <TouchableOpacity
          style={styles.verificationBanner}
          onPress={() => navigation.navigate('TutorVerificationStatus')}
        >
          <View style={styles.verBannerLeft}>
            <Text style={styles.verShield}>🛡️</Text>
            <View>
              <Text style={styles.verBannerTitle}>Faculty Verified Tutor</Text>
              <Text style={styles.verBannerSub}>All credentials & modules audited</Text>
            </View>
          </View>
          <Text style={styles.verBannerArrow}>View Details →</Text>
        </TouchableOpacity>

        {/* Approved Modules Section */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardSectionTitle}>Approved Teaching Modules</Text>
            <View style={styles.approvedCountPill}>
              <Text style={styles.approvedCountText}>
                {tutor.approvedModules?.length || 3} Verified
              </Text>
            </View>
          </View>

          <View style={styles.modulesChipsWrap}>
            {(tutor.approvedModules || ['Data Structures', 'OOP', 'Software Architecture']).map(
              (mod) => (
                <View key={mod} style={styles.approvedModuleChip}>
                  <Text style={styles.approvedModCheck}>✓</Text>
                  <Text style={styles.approvedModText}>{mod}</Text>
                </View>
              )
            )}
          </View>
        </View>

        {/* Availability Schedule */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>Tutoring Schedule & Availability</Text>
          <View style={styles.scheduleRow}>
            <Text style={styles.clockIcon}>🕒</Text>
            <Text style={styles.scheduleText}>
              {tutor.availability || 'Mon - Thu: 5:00 PM - 9:00 PM | Sat: 10:00 AM - 2:00 PM'}
            </Text>
          </View>
        </View>

        {/* Bio / About */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardSectionTitle}>About & Teaching Approach</Text>
          <Text style={styles.bioText}>
            {tutor.bio ||
              'Experienced university tutor specializing in computer algorithms, object-oriented concepts, and clean code practices. I prioritize hands-on problem solving and past-paper reviews.'}
          </Text>
        </View>

        {/* Student Inquiries & Direct Chat Banner */}
        <TouchableOpacity
          style={styles.chatBanner}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Messages' })}
          activeOpacity={0.85}
        >
          <View style={styles.chatBannerLeft}>
            <View style={styles.chatBannerIcon}>
              <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.chatBannerTitle}>Student Inquiries & Live Chat</Text>
              <Text style={styles.chatBannerSub}>Direct student questions, peer inquiries & voice notes</Text>
            </View>
          </View>
          <View style={styles.chatBannerRight}>
            <Text style={styles.chatBannerAction}>Open Chat →</Text>
          </View>
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editBtnText}>Edit Tutor Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={() => navigation.navigate('TutorDashboard')}
          >
            <Text style={styles.dashboardBtnText}>Tutor Dashboard  →</Text>
          </TouchableOpacity>
        </View>
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
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  brandMentor: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
  },
  subBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subBarText: {
    fontSize: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  editHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#EAA023',
  },
  editHeaderText: {
    color: '#061E47',
    fontSize: 13,
    fontWeight: '800',
  },
  profileHero: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  verifiedCheck: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  tutorName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  tutorDegree: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 4,
    textAlign: 'center',
  },
  tutorUni: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  statsBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: colors.divider,
    alignSelf: 'center',
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  verBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verShield: {
    fontSize: 22,
  },
  verBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  verBannerSub: {
    fontSize: 11,
    color: '#047857',
  },
  verBannerArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  approvedCountPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  approvedCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  modulesChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  approvedModuleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  approvedModCheck: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '900',
  },
  approvedModText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  clockIcon: {
    fontSize: 16,
  },
  scheduleText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  bioText: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 19,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  editBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navy,
  },
  chatBanner: {
    backgroundColor: '#061E47',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#061E47',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  chatBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chatBannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatBannerSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  chatBannerRight: {
    paddingLeft: 8,
  },
  chatBannerAction: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EAA023',
  },
  dashboardBtn: {
    flex: 1.2,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  dashboardBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
});

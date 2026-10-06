import React from 'react';
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
import { useAuthStore, mockTutorUser } from '../../../domain/stores/authStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function TutorProfileManageScreen({ navigation }: Props) {
  const { user } = useAuthStore();
  const tutor = user?.role === 'mentor' ? user : mockTutorUser;

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tutor Profile</Text>
          <TouchableOpacity
            style={styles.editHeaderBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editHeaderText}>Edit</Text>
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
  editHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EBF4FF',
  },
  editHeaderText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
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
    color: colors.white,
  },
});

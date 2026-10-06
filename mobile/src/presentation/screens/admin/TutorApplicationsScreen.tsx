import React, { useEffect, useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import { adminRepository } from '../../../data/repositories/adminRepository';
import type { User } from '../../../domain/entities/User';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface ApplicationItem {
  id: string;
  name: string;
  university: string;
  faculty: string;
  degree: string;
  requestedModules: string[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  submittedDate: string;
  studentId: string;
}

function mapApplication(user: User): ApplicationItem {
  const verification = user.verificationStatus;
  const status: ApplicationItem['status'] = verification === 'approved'
    ? 'approved'
    : verification === 'rejected'
      ? 'rejected'
      : verification === 'under_review'
        ? 'under_review'
        : 'pending';
  return {
    id: user._id,
    name: user.name,
    university: user.university || '—',
    faculty: user.faculty || '—',
    degree: user.degree || user.degreeProgramme || '—',
    requestedModules: user.subjects?.length ? user.subjects : user.approvedModules ?? [],
    status,
    submittedDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—',
    studentId: user.studentId || '—',
  };
}

export default function TutorApplicationsScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'under_review' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<ApplicationItem[]>([]);

  useEffect(() => {
    adminRepository.directory()
      .then((users) => setApplications(users.filter((user) => user.role === 'mentor').map(mapApplication)))
      .catch(() => setApplications([]));
  }, []);

  const filtered = applications.filter((app) => {
    const matchesTab = activeTab === 'all' || app.status === activeTab;
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: ApplicationItem['status']) => {
    switch (status) {
      case 'approved':
        return { label: 'APPROVED', bg: '#ECFDF5', text: colors.success };
      case 'under_review':
        return { label: 'UNDER REVIEW', bg: '#E0F2FE', text: colors.primary };
      case 'pending':
        return { label: 'PENDING', bg: '#FEF3C7', text: '#B45309' };
      case 'rejected':
        return { label: 'REJECTED', bg: '#FEE2E2', text: colors.error };
    }
  };

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tutor Applications</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or university..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {(['all', 'pending', 'under_review', 'approved', 'rejected'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
                {tab.replace('_', ' ').toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Applications List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsCount}>Showing {filtered.length} Applications</Text>
          <Text style={styles.moduleNotice}>FR05 & FR06 Compliant Audit</Text>
        </View>

        {filtered.map((item) => {
          const badge = getStatusBadge(item.status);
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                navigation.navigate('TutorApplicationDetails', {
                  applicationId: item.id,
                  name: item.name,
                  degree: item.degree,
                  university: item.university,
                  faculty: item.faculty,
                  studentId: item.studentId,
                  modules: item.requestedModules,
                })
              }
              activeOpacity={0.88}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.applicantAvatar}>
                  <Text style={styles.applicantAvatarText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{item.name}</Text>
                  <Text style={styles.applicantUni}>🏛️ {item.university}</Text>
                  <Text style={styles.applicantId}>ID: {item.studentId} • {item.faculty}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.modulesRow}>
                <Text style={styles.modulesHeader}>Requested Modules:</Text>
                <View style={styles.moduleChips}>
                  {item.requestedModules.map((m) => (
                    <View key={m} style={styles.moduleChip}>
                      <Text style={styles.moduleChipText}>{m}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.cardBottomRow}>
                <Text style={styles.submittedDate}>📅 {item.submittedDate}</Text>
                <Text style={styles.inspectLink}>Inspect & Verify  →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  headerSpacer: {
    width: 38,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  clearText: {
    fontSize: 14,
    color: colors.textLight,
    paddingHorizontal: 4,
  },
  tabsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
  },
  tabChipTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 40,
  },
  resultsMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  moduleNotice: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#244369',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  applicantAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  applicantAvatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  applicantInfo: {
    flex: 1,
  },
  applicantName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  applicantUni: {
    fontSize: 11,
    color: colors.text,
    marginTop: 2,
  },
  applicantId: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 10,
  },
  modulesRow: {
    marginBottom: 10,
  },
  modulesHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 6,
  },
  moduleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  moduleChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  moduleChipText: {
    fontSize: 11,
    color: colors.navy,
    fontWeight: '600',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submittedDate: {
    fontSize: 11,
    color: colors.textLight,
  },
  inspectLink: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
});

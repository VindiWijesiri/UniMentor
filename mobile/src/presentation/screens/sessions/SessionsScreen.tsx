import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStudentStore } from '../../../domain/stores/studentStore';
import type { EnrolledMentor, EnrolledModule } from '../../../domain/entities/StudentDashboard';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

type FacultyFilter = 'all' | 'Computing' | 'Engineering' | 'Business' | 'Architecture';

export default function SessionsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { dashboard, loading, fetchDashboard } = useStudentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyFilter>('all');

  useEffect(() => {
    if (!dashboard) {
      fetchDashboard();
    }
  }, [dashboard, fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const enrolledModules = useMemo(() => {
    return dashboard?.enrolledModules || [];
  }, [dashboard]);

  // Filtered modules
  const filteredModules = useMemo(() => {
    let list = enrolledModules;

    if (selectedFaculty !== 'all') {
      list = list.filter(
        (m) => m.faculty?.toLowerCase() === selectedFaculty.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => {
        const code = m.code?.toLowerCase() || '';
        const name = m.name?.toLowerCase() || '';
        const faculty = m.faculty?.toLowerCase() || '';
        const dept = m.department?.toLowerCase() || '';
        const mentorName = m.mentor?.name?.toLowerCase() || '';
        const nextTopic = m.nextSession?.toLowerCase() || '';
        return (
          code.includes(q) ||
          name.includes(q) ||
          faculty.includes(q) ||
          dept.includes(q) ||
          mentorName.includes(q) ||
          nextTopic.includes(q)
        );
      });
    }

    return list;
  }, [enrolledModules, selectedFaculty, searchQuery]);

  // Statistics
  const totalCredits = useMemo(() => {
    return enrolledModules.reduce((acc, m) => acc + (m.credits || 3), 0);
  }, [enrolledModules]);

  const avgProgress = useMemo(() => {
    if (enrolledModules.length === 0) return 0;
    const sum = enrolledModules.reduce((acc, m) => acc + (m.progress || 0), 0);
    return Math.round(sum / enrolledModules.length);
  }, [enrolledModules]);

  const handleViewTutorProfile = (mentor: EnrolledMentor) => {
    const mentorEntity = {
      _id: mentor.id || 'mentor-default',
      name: mentor.name,
      email: mentor.email || `${mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
      bio: mentor.bio || `${mentor.roleTitle || 'Mentor'} specializing in peer academic support.`,
      subjects: mentor.subjects || ['Academic Guidance'],
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      profilePicture: mentor.avatar,
      role: 'mentor' as const,
    };

    navigation.navigate('TutorProfile', {
      mentor: mentorEntity,
    });
  };

  const handleOpenChat = (mentor: EnrolledMentor) => {
    const mentorEntity = {
      _id: mentor.id || 'mentor-default',
      name: mentor.name,
      email: mentor.email || `${mentor.name.toLowerCase().replace(/\s+/g, '.')}@unimentor.lk`,
      bio: mentor.bio || 'Peer Mentor',
      subjects: mentor.subjects || ['Academic Guidance'],
      rating: mentor.rating || 4.9,
      reviewCount: mentor.reviewCount || 25,
      profilePicture: mentor.avatar,
      role: 'mentor' as const,
    };

    navigation.navigate('Chat', {
      mentor: mentorEntity,
    });
  };

  const handleFindTutorForModule = (moduleItem: EnrolledModule) => {
    navigation.navigate('MainTabs', {
      screen: 'Search',
      params: {
        initialQuery: moduleItem.code || moduleItem.name,
        faculty: moduleItem.faculty,
        department: moduleItem.department,
      },
    } as any);
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Bookings & Modules</Text>
            <Text style={styles.headerSubtitle}>
              Peer tutoring sessions and registered modules
            </Text>
          </View>
          <View style={styles.moduleCountBadge}>
            <Text style={styles.moduleCountText}>{enrolledModules.length} Enrolled</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{enrolledModules.length}</Text>
            <Text style={styles.statLbl}>Modules</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{totalCredits}</Text>
            <Text style={styles.statLbl}>Credits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statVal}>{avgProgress}%</Text>
            <Text style={styles.statLbl}>Avg Progress</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#8997AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search selected modules, codes, or mentors..."
            placeholderTextColor="#8997AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {(['all', 'Computing', 'Engineering', 'Business', 'Architecture'] as FacultyFilter[]).map(
            (fac) => {
              const isActive = selectedFaculty === fac;
              const label = fac === 'all' ? `All (${enrolledModules.length})` : fac;
              return (
                <TouchableOpacity
                  key={fac}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedFaculty(fac)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </View>

      {/* Modules List */}
      <FlatList
        data={filteredModules}
        keyExtractor={(item) => item.code}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 110 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#061E47" />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color="#061E47" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={48} color="#94A3B8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>
                {searchQuery || selectedFaculty !== 'all'
                  ? 'No Matching Modules Found'
                  : 'No Modules Selected Yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedFaculty !== 'all'
                  ? 'Try clearing your search query or faculty filter to view all enrolled modules.'
                  : 'You have not selected any modules yet. Use Academic Guidance to explore and enroll in your university modules.'}
              </Text>
              {!searchQuery && selectedFaculty === 'all' && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => navigation.navigate('GuidanceWizard')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emptyActionBtnText}>+ Select Modules in Guidance</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        }
        renderItem={({ item }) => {
          const progress = item.progress || 0;

          return (
            <View style={styles.moduleCard}>
              {/* Top Metadata Row */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{item.code}</Text>
                </View>

                <View style={styles.creditsBadge}>
                  <Text style={styles.creditsBadgeText}>{item.credits || 3} Credits</Text>
                </View>

                {item.faculty ? (
                  <View style={styles.facultyBadge}>
                    <Text style={styles.facultyBadgeText}>{item.faculty}</Text>
                  </View>
                ) : null}

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>Enrolled</Text>
                </View>
              </View>

              {/* Module Name */}
              <Text style={styles.moduleName}>{item.name}</Text>

              {item.department ? (
                <Text style={styles.deptText}>
                  Department: <Text style={styles.deptBold}>{item.department}</Text>
                </Text>
              ) : null}

              {/* Progress Section */}
              <View style={styles.progressWrap}>
                <View style={styles.progressHeaderRow}>
                  <Text style={styles.progressLabel}>Study & Mentoring Progress</Text>
                  <Text style={styles.progressPercentage}>{progress}% Complete</Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(Math.max(progress, 5), 100)}%`,
                        backgroundColor: progress >= 75 ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Next Session Agenda Highlight */}
              {item.nextSession ? (
                <View style={styles.agendaBox}>
                  <Ionicons name="bookmark" size={16} color="#0284C7" style={{ marginRight: 8, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.agendaLabel}>NEXT FOCUS / AGENDA</Text>
                    <Text style={styles.agendaText}>{item.nextSession}</Text>
                  </View>
                </View>
              ) : null}

              {/* Assigned Peer Mentor */}
              <View style={styles.mentorSection}>
                <Text style={styles.mentorSectionTitle}>ASSIGNED PEER MENTOR</Text>

                {item.mentor ? (
                  <View style={styles.mentorCardInner}>
                    <TouchableOpacity
                      style={styles.avatarWrap}
                      onPress={() => handleViewTutorProfile(item.mentor!)}
                      activeOpacity={0.8}
                    >
                      {item.mentor.avatar ? (
                        <Image source={{ uri: item.mentor.avatar }} style={styles.mentorAvatar} />
                      ) : (
                        <View style={styles.mentorAvatarFallback}>
                          <Text style={styles.mentorAvatarLetter}>
                            {item.mentor.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.onlineDot} />
                    </TouchableOpacity>

                    <View style={styles.mentorInfoCol}>
                      <TouchableOpacity
                        onPress={() => handleViewTutorProfile(item.mentor!)}
                        activeOpacity={0.8}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text style={styles.mentorName} numberOfLines={1}>
                          {item.mentor.name}
                        </Text>
                        <Text style={styles.verifiedCheck}> ✓</Text>
                      </TouchableOpacity>

                      <Text style={styles.mentorRole} numberOfLines={1}>
                        {item.mentor.roleTitle || 'Senior Peer Mentor'} • {item.mentor.batch || "Batch '24"}
                      </Text>

                      <View style={styles.mentorRatingRow}>
                        <Text style={styles.mentorRatingText}>
                          ★ {item.mentor.rating || 4.9}
                        </Text>
                        <Text style={styles.reviewCountText}>
                          ({item.mentor.reviewCount || 25} reviews)
                        </Text>
                        {item.mentor.hourlyRate ? (
                          <Text style={styles.hourlyRateText}>
                            • LKR {item.mentor.hourlyRate.toLocaleString()}/hr
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Quick Contact Buttons */}
                    <View style={styles.mentorActionButtons}>
                      <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => handleViewTutorProfile(item.mentor!)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.profileBtnText}>Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => handleOpenChat(item.mentor!)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.chatBtnText}>Chat 💬</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.unassignedBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.unassignedTitle}>No Mentor Assigned</Text>
                      <Text style={styles.unassignedSubtitle}>
                        Find a peer tutor for {item.code} to get help with assignments and exams.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.findTutorBtn}
                      onPress={() => handleFindTutorForModule(item)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.findTutorBtnText}>Find Tutor →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const navy = '#061E47';
const navyLight = '#0B2754';
const amber = '#F59E0B';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },

  /* Header */
  header: {
    backgroundColor: navy,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    color: '#D7E6FA',
    fontSize: 12,
    marginTop: 2,
  },
  moduleCountBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  moduleCountText: {
    color: '#FBBF24',
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* Stats Card in Header */
  statsCard: {
    backgroundColor: navyLight,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statCol: {
    alignItems: 'center',
  },
  statVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  statLbl: {
    color: '#93C5FD',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  /* Search Box */
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchText: {
    color: '#8997AF',
    fontSize: 13,
    paddingHorizontal: 6,
    fontWeight: '800',
  },

  /* Filter Row */
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  filterChipActive: {
    backgroundColor: amber,
    borderColor: amber,
  },
  filterChipText: {
    color: '#D7E6FA',
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  /* FlatList Content */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },

  /* Module Card */
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#17365E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  /* Card Metadata Header */
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  codeBadge: {
    backgroundColor: navy,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  codeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  creditsBadge: {
    backgroundColor: '#EFF6FF',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  creditsBadgeText: {
    color: '#1D4ED8',
    fontSize: 10.5,
    fontWeight: '800',
  },
  facultyBadge: {
    backgroundColor: '#F8FAFC',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  facultyBadgeText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 'auto',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  statusText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },

  /* Module Titles */
  moduleName: {
    color: navy,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 4,
  },
  deptText: {
    color: '#64748B',
    fontSize: 11.5,
    marginBottom: 10,
  },
  deptBold: {
    color: '#334155',
    fontWeight: '700',
  },

  /* Progress */
  progressWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 10.5,
    fontWeight: '700',
  },
  progressPercentage: {
    color: navy,
    fontSize: 11,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Agenda Box */
  agendaBox: {
    backgroundColor: '#FFFDF0',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FEF08A',
    marginBottom: 12,
  },
  agendaIcon: {
    fontSize: 13,
    marginRight: 8,
    marginTop: 1,
  },
  agendaLabel: {
    color: '#B45309',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  agendaText: {
    color: '#451A03',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  /* Mentor Section */
  mentorSection: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  mentorSectionTitle: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  mentorCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  mentorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  mentorAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentorAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  mentorInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  mentorName: {
    color: navy,
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedCheck: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '900',
  },
  mentorRole: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  mentorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  mentorRatingText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewCountText: {
    color: '#94A3B8',
    fontSize: 10.5,
  },
  hourlyRateText: {
    color: '#475569',
    fontSize: 10.5,
    fontWeight: '600',
  },

  /* Mentor Action Buttons */
  mentorActionButtons: {
    flexDirection: 'column',
    gap: 5,
    marginLeft: 8,
  },
  profileBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileBtnText: {
    color: navy,
    fontSize: 11,
    fontWeight: '800',
  },
  chatBtn: {
    backgroundColor: '#061E47',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: 'center',
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* Unassigned Mentor Box */
  unassignedBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unassignedTitle: {
    color: navy,
    fontSize: 12.5,
    fontWeight: '800',
  },
  unassignedSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  findTutorBtn: {
    backgroundColor: amber,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
  },
  findTutorBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  /* Empty State */
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    color: navy,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyActionBtn: {
    backgroundColor: navy,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: navy,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

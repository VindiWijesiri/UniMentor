import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { Mentor } from '../../../domain/entities/Mentor';
import type { Review } from '../../../domain/entities/Review';
import { reviewRepository } from '../../../data/repositories/reviewRepository';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = any;
type ProfileMentor = Mentor & {
  experience?: string;
  sessionCount?: number;
  availability?: string;
  guidance?: string;
};

function SectionHeading({ icon, title }: { icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={15} color="#061E47" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function TutorProfileScreen({ route, navigation }: Props) {
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const currentUser = useAuthStore((state) => state.user);
  const currentRole = currentUser?.role;

  // Resolve mentor data: from route.params if provided, or from logged-in mentor user
  const mentor: ProfileMentor = (route?.params?.mentor || {
    _id: currentUser?._id || 'mentor-current',
    name: currentUser?.name || 'Tutor Profile',
    email: currentUser?.email || '',
    bio:
      currentUser?.bio ||
      'Senior peer tutor dedicated to academic excellence, providing step-by-step guidance.',
    subjects:
      currentUser?.subjects && currentUser.subjects.length > 0
        ? currentUser.subjects
        : ['Academic Guidance'],
    rating: currentUser?.rating || 5.0,
    reviewCount: currentUser?.reviewCount || 0,
    profilePicture: currentUser?.profilePicture,
    hourlyRate: currentUser?.hourlyRate || 2000,
    role: 'mentor' as const,
  }) as ProfileMentor;

  const isMentorOwnProfile =
    currentRole === 'mentor' &&
    (mentor._id === currentUser?._id ||
      mentor.name.toLowerCase() === currentUser?.name?.toLowerCase());

  const chatLabel = currentRole === 'mentor' ? 'Chat with Student' : 'Chat with Tutor';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const loadReviews = useCallback(async () => {
    try {
      const data = await reviewRepository.listForTutor(mentor._id);
      setReviews(data);
    } catch {
      // Keep existing reviews
    } finally {
      setLoadingReviews(false);
    }
  }, [mentor._id]);

  const handleDeleteReview = (reviewId: string) => {
    if (currentRole === 'mentor') {
      Alert.alert('Permission Denied', 'Mentors cannot delete student reviews.');
      return;
    }

    Alert.alert(
      'Delete Review',
      `Are you sure you want to permanently delete your review for ${mentor.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reviewRepository.delete(reviewId, mentor._id);
              await loadReviews();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete review.');
            }
          },
        },
      ]
    );
  };

  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [loadReviews])
  );

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : (mentor.rating ? mentor.rating.toFixed(1) : 'New');

  const openChat = () => {
    if (!/^[a-f\d]{24}$/i.test(mentor._id)) {
      Alert.alert('Chat unavailable', 'Please select a registered tutor from the updated tutor list.');
      return;
    }
    navigation.navigate('Chat', { mentor });
  };

  return (
    <View style={styles.page}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            {navigation.canGoBack?.() ? (
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

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 82 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{mentor.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.profileCopy}>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={13} color="#D97706" style={{ marginRight: 3 }} />
                <Text style={styles.verifiedText}>VERIFIED TUTOR</Text>
              </View>
              <Text style={styles.name} numberOfLines={1}>{mentor.name}</Text>
              <Text style={styles.experience} numberOfLines={1}>{mentor.experience ?? 'Senior student tutor'}</Text>
            </View>
            {isMentorOwnProfile && (
              <TouchableOpacity
                style={styles.heroSignOutBtn}
                onPress={() => useAuthStore.getState().logout()}
                activeOpacity={0.8}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="log-out-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.heroSignOutText}>Sign Out</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroStats}>
            <TouchableOpacity
              style={styles.heroStat}
              onPress={() => currentRole === 'student' && navigation.navigate('WriteReview', { mentor })}
              activeOpacity={currentRole === 'student' ? 0.75 : 1}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={14} color="#F59E0B" style={{ marginRight: 3 }} />
                <Text style={styles.heroStatValue}>{avgRating}</Text>
              </View>
              <Text style={styles.heroStatLabel}>
                {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'} {currentRole === 'student' ? '• +Rate' : ''}
              </Text>
            </TouchableOpacity>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{mentor.sessionCount ?? 0}+</Text>
              <Text style={styles.heroStatLabel}>Sessions</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, styles.onlineText]}>Online</Text>
              <Text style={styles.heroStatLabel}>Status</Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyWrap}>
          <View style={styles.availabilityCard}>
            <View style={styles.calendarBox}>
              <Ionicons name="calendar-outline" size={18} color="#061E47" />
            </View>
            <View style={styles.availabilityCopy}>
              <Text style={styles.availabilityLabel}>NEXT AVAILABLE</Text>
              <Text style={styles.availabilityValue}>{mentor.availability ?? 'Schedule available'}</Text>
            </View>
            <View style={styles.availableBadge}><Text style={styles.availableBadgeText}>Available</Text></View>
          </View>

          <View style={styles.card}>
            <SectionHeading icon="information-circle-outline" title="About tutor" />
            <Text style={styles.bodyText}>{mentor.bio || 'Friendly academic support with clear, step-by-step explanations.'}</Text>
          </View>

          <View style={styles.card}>
            <SectionHeading icon="book-outline" title="Modules" />
            <View style={styles.tags}>
              {mentor.subjects.map((subject, index) => (
                <View key={subject} style={[styles.tag, index === 0 && styles.primaryTag]}>
                  <View style={[styles.tagDot, index === 0 && styles.primaryTagDot]} />
                  <Text style={[styles.tagText, index === 0 && styles.primaryTagText]}>{subject}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.supportCard}>
            <SectionHeading icon="checkmark-done-outline" title="Tutor support" />
            <View style={styles.supportRow}>
              {['Concepts', 'Assignments', 'Exams'].map((item) => (
                <View key={item} style={styles.supportItem}>
                  <View style={styles.supportCheck}>
                    <Ionicons name="checkmark" size={12} color="#16A34A" />
                  </View>
                  <Text style={styles.supportText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* STUDENT REVIEWS SECTION */}
          <View style={styles.reviewsCard}>
            <View style={styles.reviewsHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star" size={15} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Student Reviews</Text>
                  <Text style={styles.reviewsSubCount}>
                    {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} from verified students
                  </Text>
                </View>
              </View>

              {currentRole !== 'mentor' && (
                <TouchableOpacity
                  style={styles.writeReviewHeaderBtn}
                  onPress={() => navigation.navigate('WriteReview', { mentor })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.writeReviewHeaderBtnText}>+ Write Review</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Rating Breakdown Banner */}
            <View style={styles.ratingSummaryBanner}>
              <View style={styles.ratingBigCol}>
                <Text style={styles.ratingBigNumber}>{avgRating}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name="star"
                      size={15}
                      color={s <= Math.round(Number(avgRating) || 0) ? '#F59E0B' : '#E2E8F0'}
                      style={{ marginRight: 2 }}
                    />
                  ))}
                </View>
                <Text style={styles.ratingTotalText}>Based on {totalReviews} reviews</Text>
              </View>

              <View style={styles.ratingBarsCol}>
                {[5, 4, 3, 2, 1].map((starLevel) => {
                  const count = reviews.filter((r) => Math.round(r.rating) === starLevel).length;
                  const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                  return (
                    <View key={starLevel} style={styles.starBarRow}>
                      <Text style={styles.starBarLabel}>{starLevel}★</Text>
                      <View style={styles.starBarTrack}>
                        <View style={[styles.starBarFill, { width: `${pct}%` }]} />
                      </View>
                      <Text style={styles.starBarCount}>{count}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Reviews List */}
            {loadingReviews ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#061E47" />
                <Text style={{ marginTop: 8, color: '#64748B', fontSize: 12 }}>Loading reviews...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviewsBox}>
                <Ionicons name="chatbubbles-outline" size={44} color="#94A3B8" style={{ marginBottom: 8 }} />
                <Text style={styles.emptyReviewsTitle}>No reviews yet</Text>
                <Text style={styles.emptyReviewsSubtitle}>
                  Be the first student to share your learning experience with {mentor.name}!
                </Text>
                {currentRole !== 'mentor' && (
                  <TouchableOpacity
                    style={styles.emptyWriteBtn}
                    onPress={() => navigation.navigate('WriteReview', { mentor })}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.emptyWriteBtnText}>Write a Review</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((rev, index) => {
                  const initials = (rev.studentName || 'Student').charAt(0).toUpperCase();
                  const reviewDate = rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Recent';

                  const revStudentId =
                    typeof rev.student === 'object' && rev.student !== null
                      ? (rev.student as any)._id
                      : rev.student;
                  const isMyReview =
                    currentRole !== 'mentor' &&
                    ((currentUser?._id && (revStudentId === currentUser._id || rev.student === currentUser._id)) ||
                      (currentUser?.name &&
                        rev.studentName &&
                        rev.studentName.toLowerCase() === currentUser.name.toLowerCase()) ||
                      rev.student === 'current-student');

                  return (
                    <View key={rev._id || `rev-${index}`} style={styles.reviewItem}>
                      <View style={styles.reviewTopRow}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.reviewAuthor}>{rev.studentName || 'Verified Student'}</Text>
                            {isMyReview && (
                              <View style={styles.myReviewPill}>
                                <Text style={styles.myReviewPillText}>You</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.reviewDate}>{reviewDate}</Text>
                        </View>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Ionicons
                              key={s}
                              name="star"
                              size={13}
                              color={s <= rev.rating ? '#F59E0B' : '#E2E8F0'}
                              style={{ marginHorizontal: 0.5 }}
                            />
                          ))}
                        </View>
                      </View>

                      <Text style={styles.reviewComment}>{rev.comment}</Text>

                      {isMyReview && (
                        <View style={styles.reviewActionsRow}>
                          <TouchableOpacity
                            style={styles.reviewEditBtn}
                            onPress={() =>
                              navigation.navigate('WriteReview', { mentor, existingReview: rev })
                            }
                            activeOpacity={0.75}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="create-outline" size={13} color="#0D4F9E" />
                              <Text style={styles.reviewEditBtnText}>Edit</Text>
                            </View>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.reviewDeleteBtn}
                            onPress={() => handleDeleteReview(rev._id)}
                            activeOpacity={0.75}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Ionicons name="trash-outline" size={13} color="#EF4444" />
                              <Text style={styles.reviewDeleteBtnText}>Delete</Text>
                            </View>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      {isMentorOwnProfile ? (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={styles.mentorTabActionBtn}
            onPress={() => navigation.navigate('Messages')}
            activeOpacity={0.84}
          >
            <Text style={styles.mentorTabActionText}>Student Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.mentorTabLogoutBtn}
            onPress={() => useAuthStore.getState().logout()}
            activeOpacity={0.84}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="log-out-outline" size={17} color="#DC2626" />
              <Text style={styles.mentorTabLogoutText}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
            activeOpacity={0.82}
          >
            <Ionicons name="chevron-back" size={18} color="#061E47" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chatButton} onPress={openChat} activeOpacity={0.84}>
            <View style={styles.chatIcon}>
              <Ionicons name="chatbubble-ellipses" size={16} color="#061E47" />
            </View>
            <View>
              <Text style={styles.chatButtonLabel}>DIRECT MESSAGE</Text>
              <Text style={styles.chatButtonText}>{chatLabel}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color="#061E47" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const navy = '#061E47';
const navyCard = '#0B2754';
const amber = '#F59E0B';
const gold = '#FBBF24';
const onlineGreen = '#22C55E';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  headerBar: {
    backgroundColor: navy,
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
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -6,
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
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  content: { backgroundColor: '#F4F7FB' },
  hero: { backgroundColor: navy, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28, overflow: 'hidden' },
  heroOrbLarge: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: navyCard, right: -92, top: -104, opacity: 0.65 },
  heroOrbSmall: { position: 'absolute', width: 74, height: 74, borderRadius: 37, backgroundColor: '#0D3875', left: -38, bottom: 8, opacity: 0.42 },
  profileRow: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  avatarWrap: { marginRight: 15 },
  avatar: { width: 86, height: 86, borderRadius: 27, backgroundColor: '#EEF2F8', borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  avatarText: { color: navy, fontSize: 35, fontWeight: '900' },
  onlineDot: { position: 'absolute', right: -3, bottom: -3, width: 21, height: 21, borderRadius: 11, backgroundColor: onlineGreen, borderWidth: 4, borderColor: navy },
  profileCopy: { flex: 1, minWidth: 0 },
  verifiedBadge: { alignSelf: 'flex-start', borderRadius: 11, backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 8, paddingVertical: 4, marginBottom: 7 },
  verifiedText: { color: '#D97706', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.7 },
  name: { color: '#FFF', fontSize: 23, fontWeight: '900', letterSpacing: -0.3 },
  experience: { color: '#C9D8EF', fontSize: 12, marginTop: 4 },
  heroSignOutBtn: {
    backgroundColor: 'rgba(254, 226, 226, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  heroSignOutText: {
    color: '#FECACA',
    fontSize: 11.5,
    fontWeight: '800',
  },
  heroStats: { height: 70, marginTop: 22, borderRadius: 17, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', zIndex: 2 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  heroStatLabel: { color: '#AFC3E2', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4 },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.18)' },
  star: { color: gold },
  onlineText: { color: onlineGreen },
  bodyWrap: { paddingHorizontal: 16, paddingTop: 14 },
  availabilityCard: { minHeight: 68, borderRadius: 18, backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', shadowColor: '#7D6510', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  calendarBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: amber, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  calendarIcon: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  availabilityCopy: { flex: 1 },
  availabilityLabel: { color: '#D97706', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  availabilityValue: { color: navy, fontSize: 14, fontWeight: '900', marginTop: 3 },
  availableBadge: { borderRadius: 10, backgroundColor: '#FFF', paddingHorizontal: 9, paddingVertical: 5 },
  availableBadgeText: { color: '#D97706', fontSize: 9, fontWeight: '800' },
  card: { borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginTop: 12, shadowColor: '#1D3D66', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 11 },
  sectionIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#EEF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  sectionIconText: { color: navy, fontSize: 13, fontWeight: '900' },
  sectionTitle: { color: navy, fontSize: 16, fontWeight: '900' },
  bodyText: { color: '#596B87', fontSize: 13, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { minHeight: 33, borderRadius: 12, backgroundColor: '#F1F5FB', borderWidth: 1, borderColor: '#E1E8F2', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  primaryTag: { backgroundColor: '#EEF2F8', borderColor: '#CBD5E1' },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9AA9BF', marginRight: 7 },
  primaryTagDot: { backgroundColor: amber },
  tagText: { color: '#52647F', fontSize: 11, fontWeight: '700' },
  primaryTagText: { color: navy },
  supportCard: { borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginTop: 12 },
  supportRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  supportItem: { flex: 1, alignItems: 'center', borderRadius: 13, backgroundColor: '#F7F9FD', paddingVertical: 11 },
  supportCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  supportCheckText: { color: amber, fontSize: 12, fontWeight: '900' },
  supportText: { color: '#536580', fontSize: 10, fontWeight: '800' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', shadowColor: '#17365E', shadowOpacity: 0.10, shadowRadius: 12, elevation: 10, flexDirection: 'row', gap: 8 },
  backButton: { width: 91, height: 52, borderRadius: 15, backgroundColor: '#EEF2F8', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  backArrow: { color: navy, fontSize: 19, fontWeight: '900', marginRight: 6, marginTop: -2 },
  backButtonText: { color: navy, fontSize: 12.5, fontWeight: '900' },
  chatButton: { flex: 1, height: 52, borderRadius: 15, backgroundColor: amber, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', shadowColor: amber, shadowOpacity: 0.25, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  chatIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: 'rgba(6,30,71,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  chatIconText: { color: navy, fontSize: 12, lineHeight: 12, fontWeight: '900', marginTop: -5 },
  chatButtonLabel: { color: '#78350F', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.6 },
  chatButtonText: { color: navy, fontSize: 12, fontWeight: '900', marginTop: 2 },
  chatArrow: { color: navy, fontSize: 19, fontWeight: '900', marginLeft: 'auto' },

  /* Reviews Card & Styles */
  reviewsCard: {
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 12,
    shadowColor: '#1D3D66',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  reviewsSubCount: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  writeReviewHeaderBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  writeReviewHeaderBtnText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  ratingSummaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ratingBigCol: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  ratingBigNumber: {
    color: navy,
    fontSize: 32,
    fontWeight: '900',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 3,
  },
  starIcon: {
    fontSize: 13,
  },
  starFilled: {
    color: '#F59E0B',
  },
  starEmpty: {
    color: '#CBD5E1',
  },
  ratingTotalText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  ratingBarsCol: {
    flex: 1,
    paddingLeft: 14,
    gap: 4,
  },
  starBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starBarLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    width: 22,
  },
  starBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  starBarFill: {
    height: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  starBarCount: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
    width: 14,
    textAlign: 'right',
  },
  reviewsList: {
    gap: 10,
  },
  reviewItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    color: navy,
    fontSize: 14,
    fontWeight: '900',
  },
  reviewAuthor: {
    color: navy,
    fontSize: 13,
    fontWeight: '800',
  },
  reviewDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 1,
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewStar: {
    fontSize: 12,
  },
  reviewComment: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
  },
  emptyReviewsBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyReviewsEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyReviewsTitle: {
    color: navy,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyReviewsSubtitle: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginHorizontal: 16,
    lineHeight: 16,
  },
  emptyWriteBtn: {
    marginTop: 14,
    backgroundColor: amber,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyWriteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  myReviewPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  myReviewPillText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '800',
  },
  reviewActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reviewEditBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  reviewEditBtnText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewDeleteBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reviewDeleteBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  mentorTabActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: amber,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  mentorTabActionText: {
    color: '#061E47',
    fontSize: 13.5,
    fontWeight: '800',
  },
  mentorTabLogoutBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mentorTabLogoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
});

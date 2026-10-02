import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reviewRepository } from '../../../data/repositories/reviewRepository';
import { useAuthStore } from '../../../domain/stores/authStore';
import { useReviewStore } from '../../../domain/stores/reviewStore';
import type { Review } from '../../../domain/entities/Review';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'WriteReview'>;

interface RatingOption {
  label: string;
  emoji: string;
  badgeBg: string;
  badgeBorder: string;
  textColor: string;
}

const RATING_DETAILS: Record<number, RatingOption> = {
  1: {
    label: '1.0 • Poor Experience',
    emoji: '⚠️',
    badgeBg: '#FEF2F2',
    badgeBorder: '#FECACA',
    textColor: '#DC2626',
  },
  2: {
    label: '2.0 • Needs Improvement',
    emoji: '😕',
    badgeBg: '#FFF7ED',
    badgeBorder: '#FED7AA',
    textColor: '#EA580C',
  },
  3: {
    label: '3.0 • Satisfactory Session',
    emoji: '🙂',
    badgeBg: '#F0FDF4',
    badgeBorder: '#BBF7D0',
    textColor: '#16A34A',
  },
  4: {
    label: '4.0 • Very Good & Helpful',
    emoji: '😃',
    badgeBg: '#EFF6FF',
    badgeBorder: '#BFDBFE',
    textColor: '#2563EB',
  },
  5: {
    label: '5.0 • Outstanding Session!',
    emoji: '⭐',
    badgeBg: '#FFFBEB',
    badgeBorder: '#FDE68A',
    textColor: '#D97706',
  },
};

interface QuickPraise {
  id: string;
  text: string;
  sentence: string;
}

const QUICK_PRAISES: QuickPraise[] = [
  { id: 'clear', text: '💡 Clear concepts', sentence: 'Explains complex concepts very clearly and simply.' },
  { id: 'exam', text: '🎯 Great exam prep', sentence: 'Gave targeted exam tips and practice problems.' },
  { id: 'patient', text: '🤝 Very patient', sentence: 'Extremely patient with questions and never rushed.' },
  { id: 'punctual', text: '⏱️ Always on time', sentence: 'Well prepared and started promptly on time.' },
  { id: 'notes', text: '📚 Helpful notes', sentence: 'Provided clear summaries and high quality study notes.' },
  { id: 'motivating', text: '🔥 Inspiring', sentence: 'Very motivating and boosted my confidence in this subject.' },
  { id: 'friendly', text: '✨ Friendly atmosphere', sentence: 'Welcoming, approachable, and encouraging teaching style.' },
];

export default function WriteReviewScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { mentor, existingReview: initialExistingReview } = route.params;
  const { user } = useAuthStore();

  const [rating, setRating] = useState(initialExistingReview?.rating || 5);
  const [comment, setComment] = useState(initialExistingReview?.comment || '');
  const [editingReviewId, setEditingReviewId] = useState<string | null>(
    initialExistingReview?._id || null
  );
  const [selectedPraiseIds, setSelectedPraiseIds] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [isEditingActive, setIsEditingActive] = useState(!initialExistingReview);
  const hasLoadedExistingRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  const activateEditMode = () => {
    if (editingReviewId && !isEditingActive) {
      setIsEditingActive(true);
    }
  };

  // Prevent mentors from reviewing or managing reviews
  useEffect(() => {
    if (user?.role === 'mentor') {
      Alert.alert(
        'Permission Restricted',
        'Mentors cannot write, edit, or delete reviews. Only students can review tutors.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [user?.role, navigation]);

  // Check if student already has a review for this mentor if not passed in params
  useEffect(() => {
    if (user?.role === 'mentor') return;
    if (hasLoadedExistingRef.current) return;

    if (initialExistingReview) {
      hasLoadedExistingRef.current = true;
      setEditingReviewId(initialExistingReview._id);
      setRating(initialExistingReview.rating);
      setComment(initialExistingReview.comment);
      setIsEditingActive(false);
      return;
    }

    let isMounted = true;
    const findMyExistingReview = async () => {
      setCheckingExisting(true);
      try {
        const allReviews = await reviewRepository.listForTutor(mentor._id);
        const myRev = allReviews.find((r: Review) => {
          const studentId =
            typeof r.student === 'object' && r.student !== null
              ? (r.student as any)._id
              : r.student;
          if (user?._id && studentId === user._id) return true;
          if (user?.name && r.studentName && r.studentName.toLowerCase() === user.name.toLowerCase()) return true;
          return false;
        });

        if (myRev && isMounted && !hasLoadedExistingRef.current) {
          hasLoadedExistingRef.current = true;
          setEditingReviewId(myRev._id);
          setRating(myRev.rating);
          setComment(myRev.comment);
          setIsEditingActive(false);
        }
      } catch {
        // Continue with default new review state
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    };

    findMyExistingReview();
    return () => {
      isMounted = false;
    };
  }, [mentor._id, user?._id, user?.name, initialExistingReview]);

  const togglePraise = (praise: QuickPraise) => {
    const isSelected = selectedPraiseIds.includes(praise.id);
    if (isSelected) {
      setSelectedPraiseIds(selectedPraiseIds.filter((id) => id !== praise.id));
      setComment((prev) =>
        prev
          .replace(praise.sentence, '')
          .replace(/\s{2,}/g, ' ')
          .trim()
      );
    } else {
      setSelectedPraiseIds([...selectedPraiseIds, praise.id]);
      setComment((prev) => {
        const trimmed = prev.trim();
        if (!trimmed) return praise.sentence;
        if (trimmed.includes(praise.sentence)) return trimmed;
        return `${trimmed} ${praise.sentence}`;
      });
    }
  };

  const handleSaveOrUpdate = async () => {
    Keyboard.dismiss();

    // 1st click: If reviewing an existing review and edit mode is not yet active, activate edit mode!
    if (editingReviewId && !isEditingActive) {
      setIsEditingActive(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return;
    }

    // 2nd click (or new review): Validate rating & comment and submit update
    if (!rating) {
      Alert.alert('Rating Required', 'Please select a rating between 1 and 5 stars.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Feedback Required', 'Please share a brief comment about your learning experience.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReviewId) {
        // 1. Update review in backend and update cache
        await reviewRepository.update(editingReviewId, rating, comment.trim(), mentor._id);
        // 2. Refresh reviews store
        await useReviewStore.getState().fetchMyReviews().catch(() => {});
        // 3. Return to review page first so user sees their updated review!
        navigation.goBack();
        // 4. Show notification AFTER review has been updated and shown on review page
        setTimeout(() => {
          Alert.alert(
            'Review Updated! ⭐',
            `Your review for ${mentor.name} has been updated successfully.`
          );
        }, 350);
      } else {
        // 1. Save new review
        await reviewRepository.save(mentor._id, rating, comment.trim());
        // 2. Refresh reviews store
        await useReviewStore.getState().fetchMyReviews().catch(() => {});
        // 3. Return to review page first
        navigation.goBack();
        // 4. Show notification AFTER review is published
        setTimeout(() => {
          Alert.alert(
            'Review Published! ⭐',
            `Thank you! Your review for ${mentor.name} is now published and visible on their profile.`
          );
        }, 350);
      }
    } catch (error) {
      let message = 'Could not save your review. Please try again.';
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          message = 'Cannot reach server. Please check your network connection.';
        } else if (error.response.status === 401) {
          message = 'Your session has expired. Please sign in again.';
        } else if (error.response.status === 403) {
          message = 'Only student accounts can post or edit reviews.';
        } else {
          message = error.response.data?.message || message;
        }
      }
      Alert.alert('Submission Notice', message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = () => {
    if (!editingReviewId) return;

    Alert.alert(
      'Delete Review',
      `Are you sure you want to permanently delete your review for ${mentor.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await reviewRepository.delete(editingReviewId, mentor._id);
              await useReviewStore.getState().fetchMyReviews().catch(() => {});
              navigation.goBack();
              setTimeout(() => {
                Alert.alert('Review Deleted', 'Your review has been successfully removed.');
              }, 350);
            } catch (err: any) {
              Alert.alert('Delete Error', err.message || 'Unable to delete review at this time.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const activeRating = RATING_DETAILS[rating] || RATING_DETAILS[5];
  const isEditing = !!editingReviewId;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
          {/* Top Mentor Profile Banner */}
          <View style={styles.mentorBanner}>
            <View style={styles.avatarWrap}>
              {mentor.profilePicture ? (
                <Image source={{ uri: mentor.profilePicture }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>{mentor.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.verifiedDot}>
                <Text style={styles.verifiedCheck}>✓</Text>
              </View>
            </View>

            <View style={styles.mentorInfoCol}>
              <View style={styles.mentorBadgeRow}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>VERIFIED TUTOR</Text>
                </View>
                {isEditing ? (
                  <View style={[styles.editingBadge, isEditingActive && styles.editingBadgeActive]}>
                    <Text style={[styles.editingBadgeText, isEditingActive && styles.editingBadgeTextActive]}>
                      {isEditingActive ? 'EDITING REVIEW' : 'PREVIOUS REVIEW'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>
                      ★ {mentor.rating ? mentor.rating.toFixed(1) : '5.0'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.mentorName} numberOfLines={1}>{mentor.name}</Text>
              <Text style={styles.mentorSubjects} numberOfLines={1}>
                {mentor.subjects && mentor.subjects.length > 0
                  ? mentor.subjects.join(' • ')
                  : 'Academic Guidance & Mentorship'}
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {checkingExisting && (
              <View style={styles.loadingBanner}>
                <ActivityIndicator size="small" color="#061E47" />
                <Text style={styles.loadingBannerText}>Checking previous reviews...</Text>
              </View>
            )}

            {isEditing && !isEditingActive && (
              <View style={styles.previousReviewBanner}>
                <Text style={styles.previousReviewBannerIcon}>📋</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.previousReviewBannerTitle}>Previous Review Submitted</Text>
                  <Text style={styles.previousReviewBannerSub}>
                    Tap 'Update Review' below to edit your rating and comments.
                  </Text>
                </View>
              </View>
            )}

            {isEditing && isEditingActive && (
              <View style={styles.editingActiveBanner}>
                <Text style={styles.editingActiveBannerIcon}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editingActiveBannerTitle}>Editing Previous Review</Text>
                  <Text style={styles.editingActiveBannerSub}>
                    Make your changes, then tap 'Update Review' below to save.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => {
                    if (initialExistingReview) {
                      setRating(initialExistingReview.rating);
                      setComment(initialExistingReview.comment);
                    }
                    setIsEditingActive(false);
                    Keyboard.dismiss();
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={styles.cancelEditBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Section 1: Star Rating */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeaderTitle}>
                {isEditing
                  ? (isEditingActive ? 'Update Your Rating' : 'Your Current Rating')
                  : 'How was your session?'}
              </Text>
              <Text style={styles.sectionHeaderSubtitle}>
                {isEditing && !isEditingActive
                  ? `Your currently submitted rating for ${mentor.name}. Tap Update Review below to modify.`
                  : `Tap the stars below to rate your experience with ${mentor.name}`}
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((val) => {
                  const isFilled = val <= rating;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[styles.starBtn, isFilled && styles.starBtnFilled]}
                      onPress={() => {
                        setRating(val);
                        activateEditMode();
                      }}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    >
                      <Text style={[styles.starGlyph, isFilled && styles.starGlyphFilled]}>★</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Mood Feedback Pill */}
              <View
                style={[
                  styles.moodPill,
                  {
                    backgroundColor: activeRating.badgeBg,
                    borderColor: activeRating.badgeBorder,
                  },
                ]}
              >
                <Text style={styles.moodEmoji}>{activeRating.emoji}</Text>
                <Text style={[styles.moodLabel, { color: activeRating.textColor }]}>
                  {activeRating.label}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 2: Quick Compliment Tags */}
            <View style={styles.sectionBlock}>
              <View style={styles.tagsHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>Quick Compliments</Text>
                <Text style={styles.tagsHint}>Tap to add</Text>
              </View>
              <Text style={styles.sectionHeaderSubtitle}>
                Select highlights to include in your written review
              </Text>

              <View style={styles.quickPraiseGrid}>
                {QUICK_PRAISES.map((praise) => {
                  const isSelected = selectedPraiseIds.includes(praise.id);
                  return (
                    <TouchableOpacity
                      key={praise.id}
                      style={[styles.praiseChip, isSelected && styles.praiseChipSelected]}
                      onPress={() => {
                        togglePraise(praise);
                        activateEditMode();
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[styles.praiseChipText, isSelected && styles.praiseChipTextSelected]}
                      >
                        {isSelected ? `✓ ${praise.text}` : praise.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Section 3: Review Text Area */}
            <View style={styles.sectionBlock}>
              <View style={styles.commentHeaderRow}>
                <Text style={styles.sectionHeaderTitle}>
                  {isEditing && !isEditingActive ? 'Your Current Review' : 'Your Written Review'}
                </Text>
                <Text style={styles.charCountText}>{comment.length} / 500</Text>
              </View>
              <Text style={styles.sectionHeaderSubtitle}>
                Share specific feedback about teaching clarity, topics covered, and helpfulness
              </Text>

              <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
                <TextInput
                  ref={inputRef}
                  style={styles.textInputArea}
                  value={comment}
                  onChangeText={(val) => {
                    setComment(val);
                    activateEditMode();
                  }}
                  maxLength={500}
                  multiline
                  textAlignVertical="top"
                  placeholder={`Write your honest review for ${mentor.name}... (e.g. helped me prepare for exams, explained difficult concepts step-by-step)`}
                  placeholderTextColor="#94A3B8"
                  onFocus={() => {
                    setIsFocused(true);
                    activateEditMode();
                  }}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            </View>

            {/* Action Buttons: Primary (Submit / Update) + Delete */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[
                  styles.primaryBtn,
                  (!rating || !comment.trim() || submitting || deleting) && styles.primaryBtnDisabled,
                ]}
                onPress={() => void handleSaveOrUpdate()}
                disabled={submitting || deleting}
                activeOpacity={0.88}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <View style={styles.btnContentRow}>
                    {isEditing && !isEditingActive ? (
                      <>
                        <Text style={styles.btnIcon}>✏️</Text>
                        <Text style={styles.primaryBtnText}>Update Review</Text>
                        <Text style={styles.btnArrow}>★</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>
                          {isEditing ? 'Update Review' : 'Submit Review'}
                        </Text>
                        <Text style={styles.btnArrow}>★</Text>
                      </>
                    )}
                  </View>
                )}
              </TouchableOpacity>

              {isEditing && (
                <TouchableOpacity
                  style={[styles.deleteBtn, (submitting || deleting) && styles.deleteBtnDisabled]}
                  onPress={handleDeleteReview}
                  disabled={submitting || deleting}
                  activeOpacity={0.8}
                >
                  {deleting ? (
                    <ActivityIndicator color="#DC2626" size="small" />
                  ) : (
                    <View style={styles.btnContentRow}>
                      <Text style={styles.deleteBtnIcon}>🗑️</Text>
                      <Text style={styles.deleteBtnText}>Delete This Review</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const navy = '#061E47';
const amber = '#F59E0B';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* Mentor Profile Preview Banner */
  mentorBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#17365E',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 14,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#EEF2F8',
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  verifiedDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedCheck: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  mentorInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  mentorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  editingBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  editingBadgeText: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingBadgeText: {
    color: '#D97706',
    fontSize: 9.5,
    fontWeight: '800',
  },
  mentorName: {
    color: navy,
    fontSize: 16.5,
    fontWeight: '900',
  },
  mentorSubjects: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  /* Master Form Card */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#17365E',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderRadius: 10,
    marginBottom: 14,
    gap: 8,
  },
  loadingBannerText: {
    color: navy,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionBlock: {
    paddingVertical: 4,
  },
  sectionHeaderTitle: {
    color: navy,
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  sectionHeaderSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 12,
    lineHeight: 17,
  },

  /* Star Rating */
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  starBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBtnFilled: {
    backgroundColor: '#FFFDF0',
    borderColor: '#FDE68A',
  },
  starGlyph: {
    fontSize: 30,
    color: '#CBD5E1',
  },
  starGlyphFilled: {
    color: amber,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    alignSelf: 'center',
  },
  moodEmoji: {
    fontSize: 14,
    marginRight: 6,
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },

  /* Quick Praise Grid */
  tagsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsHint: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  quickPraiseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  praiseChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  praiseChipSelected: {
    backgroundColor: '#FFFBEB',
    borderColor: amber,
  },
  praiseChipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  praiseChipTextSelected: {
    color: '#B45309',
    fontWeight: '800',
  },

  /* Text Input */
  commentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCountText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  inputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  inputWrapperFocused: {
    borderColor: navy,
    backgroundColor: '#FFFFFF',
  },
  textInputArea: {
    minHeight: 120,
    color: '#0F172A',
    fontSize: 14,
    lineHeight: 22,
    padding: 0,
  },

  /* Buttons */
  buttonGroup: {
    marginTop: 20,
    gap: 10,
  },
  primaryBtn: {
    height: 52,
    backgroundColor: amber,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: amber,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  primaryBtnDisabled: {
    opacity: 0.55,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  btnArrow: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  /* Delete Button */
  deleteBtn: {
    height: 48,
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnDisabled: {
    opacity: 0.55,
  },
  deleteBtnIcon: {
    fontSize: 14,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Banners and Badges for Edit Flow */
  btnIcon: {
    fontSize: 15,
  },
  previousReviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  previousReviewBannerIcon: {
    fontSize: 20,
  },
  previousReviewBannerTitle: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '800',
  },
  previousReviewBannerSub: {
    color: '#2563EB',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  editingActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  editingActiveBannerIcon: {
    fontSize: 20,
  },
  editingActiveBannerTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '800',
  },
  editingActiveBannerSub: {
    color: '#B45309',
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  cancelEditBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  cancelEditBtnText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  editingBadgeActive: {
    backgroundColor: '#FEF3C7',
    borderColor: amber,
  },
  editingBadgeTextActive: {
    color: '#B45309',
  },
});

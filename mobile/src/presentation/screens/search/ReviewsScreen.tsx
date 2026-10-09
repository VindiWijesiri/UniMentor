import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mentorRepository } from '../../../data/repositories/mentorRepository';
import { useReviewStore } from '../../../domain/stores/reviewStore';
import type { Mentor } from '../../../domain/entities/Mentor';
import type { Review } from '../../../domain/entities/Review';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Reviews'>;
type ActiveTab = 'tutors' | 'my-reviews';

export default function ReviewsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const [activeTab, setActiveTab] = useState<ActiveTab>('tutors');
  const [tutors, setTutors] = useState<Mentor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { myReviews, fetchMyReviews, updateReview, deleteReview } = useReviewStore();

  // Edit Review Modal
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadData = async () => {
    try {
      const results = await mentorRepository.search('');
      setTutors(
        results.filter((tutor) => {
          const normalizedName = tutor.name.trim().toLowerCase();
          const normalizedEmail = tutor.email.trim().toLowerCase();
          return normalizedName !== 'demo mentor' && !normalizedEmail.startsWith('demo@');
        })
      );
    } catch {
      // Keep existing list
    }

    try {
      await fetchMyReviews();
    } catch {
      // Handled
    }
  };

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const visibleTutors = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return tutors;
    return tutors.filter((tutor) =>
      [tutor.name || '', ...(tutor.subjects || [])].some((item) => typeof item === 'string' && item.toLowerCase().includes(value))
    );
  }, [query, tutors]);

  const writeReview = (mentor: Mentor) =>
    navigation
      .getParent<NativeStackNavigationProp<AppStackParamList>>()
      ?.navigate('WriteReview', { mentor });

  const openEditModal = (rev: Review) => {
    setEditingReview(rev);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  const handleSaveEdit = async () => {
    Keyboard.dismiss();
    if (!editingReview) return;
    const trimmed = editComment.trim();
    if (!trimmed) {
      Alert.alert('Required', 'Comment cannot be empty.');
      return;
    }
    const revId = editingReview._id;
    const ratingVal = editRating;
    const tutorId =
      typeof editingReview.tutor === 'object' && editingReview.tutor !== null
        ? (editingReview.tutor as any)._id
        : editingReview.tutor;

    setSavingEdit(true);
    try {
      // 1. Update review in backend & local cache
      await updateReview(revId, ratingVal, trimmed, tutorId);
      // 2. Refresh reviews so the list re-renders with the updated review
      await fetchMyReviews().catch(() => {});
      // 3. Close the modal FIRST so the updated review is visible on the review page
      setEditingReview(null);

      // 4. Show success notification AFTER review is updated and visible on review page
      setTimeout(() => {
        Alert.alert('Review Updated', 'Your review has been updated successfully.');
      }, 350);
    } catch (err: any) {
      Alert.alert('Update Failed', err?.message || 'Could not update review.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteReview = (rev: Review) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteReview(rev._id),
      },
    ]);
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
            <Text style={styles.headerTitle}>Tutor Reviews</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      {/* Sub Header Section Below Header */}
      <View style={styles.subHeaderContainer}>
        <Text style={styles.belowHeaderSubtitle}>
          Share learning feedback and manage your submitted tutor reviews
        </Text>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'tutors' && styles.tabBtnActive]}
            onPress={() => setActiveTab('tutors')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'tutors' && styles.tabBtnTextActive]}>
              Review a Tutor ({tutors.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'my-reviews' && styles.tabBtnActive]}
            onPress={() => {
              setActiveTab('my-reviews');
              fetchMyReviews().catch(() => {});
            }}
          >
            <Text
              style={[styles.tabBtnText, activeTab === 'my-reviews' && styles.tabBtnTextActive]}
            >
              My Reviews ({myReviews.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'tutors' && (
          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color="#8997AF" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
              placeholder="Search tutor or module..."
              placeholderTextColor="#8997AF"
            />
          </View>
        )}
      </View>

      {/* Content depending on active tab */}
      {activeTab === 'tutors' ? (
        <FlatList
          data={visibleTutors}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#061E47" />
          }
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator size="large" color="#061E47" style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.emptyText}>No tutors found matching your search.</Text>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.tutorCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.tutorCopy}>
                <Text style={styles.tutorName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.modules} numberOfLines={1}>
                  {item.subjects.slice(0, 2).join('  •  ')}
                </Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.star}>★</Text>
                  <Text style={styles.rating}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
                  <Text style={styles.reviewCount}> • {item.reviewCount ?? 0} reviews</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => writeReview(item)}
                activeOpacity={0.82}
              >
                <Text style={styles.reviewButtonText}>Write Review</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        /* My Reviews Tab with Edit & Delete CRUD */
        <FlatList
          data={myReviews}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#061E47" />
          }
          ListEmptyComponent={
            <View style={styles.emptyStateWrap}>
              <Ionicons name="create-outline" size={38} color="#94A3B8" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTitle}>No Reviews Submitted Yet</Text>
              <Text style={styles.emptySub}>
                Select a tutor from the "Review a Tutor" tab to share your feedback!
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const tutorName =
              typeof item.tutor === 'object' && item.tutor !== null
                ? item.tutor.name || 'Tutor'
                : 'Assigned Tutor';

            return (
              <View style={styles.myReviewCard}>
                <View style={styles.myReviewTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewTutorName}>{tutorName}</Text>
                    <View style={styles.ratingStarsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Text
                          key={star}
                          style={{
                            color: star <= item.rating ? '#F59E0B' : '#CBD5E1',
                            fontSize: 16,
                          }}
                        >
                          ★
                        </Text>
                      ))}
                      <Text style={styles.ratingNum}>({item.rating}.0)</Text>
                    </View>
                  </View>

                  {/* Actions: Edit & Delete */}
                  <View style={styles.crudBtnRow}>
                    <TouchableOpacity
                      style={styles.editReviewBtn}
                      onPress={() => openEditModal(item)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="create-outline" size={13} color="#0D4F9E" />
                        <Text style={styles.editReviewBtnText}>Edit</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteReviewBtn}
                      onPress={() => handleDeleteReview(item)}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.reviewCommentText}>{item.comment}</Text>
                <Text style={styles.reviewDateText}>
                  {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                </Text>
              </View>
            );
          }}
        />
      )}

      {/* ================= EDIT REVIEW MODAL ================= */}
      <Modal visible={!!editingReview} animationType="slide" transparent onRequestClose={() => setEditingReview(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalOverlayPressable} onPress={() => { Keyboard.dismiss(); setEditingReview(null); }}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <ScrollView
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Edit Your Review</Text>
                <Text style={styles.sheetSubtitle}>Update your star rating and feedback comment.</Text>

                {/* Stars Selector */}
                <Text style={styles.inputLabel}>Rating</Text>
                <View style={styles.starsPickerRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity key={s} onPress={() => setEditRating(s)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={[styles.starPick, editRating >= s && styles.starPickActive]}>
                        ★
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.starPickLabel}>{editRating} out of 5</Text>
                </View>

                <Text style={styles.inputLabel}>Comment</Text>
                <TextInput
                  style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
                  multiline
                  value={editComment}
                  onChangeText={setEditComment}
                  placeholder="Your honest feedback..."
                  placeholderTextColor="#94A3B8"
                />

                <TouchableOpacity
                  style={[styles.submitEditBtn, (!editComment.trim() || savingEdit) && styles.submitEditBtnDisabled]}
                  onPress={() => void handleSaveEdit()}
                  disabled={savingEdit}
                  activeOpacity={0.8}
                >
                  {savingEdit ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitEditBtnText}>Update Review</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
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
  subHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  belowHeaderSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 10,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#061E47',
    fontWeight: '800',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748B',
    marginTop: 40,
    fontSize: 13,
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B2754',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  tutorCopy: {
    flex: 1,
    marginRight: 8,
  },
  tutorName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  modules: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  star: {
    color: '#F59E0B',
    fontSize: 13,
    marginRight: 3,
  },
  rating: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewCount: {
    color: '#64748B',
    fontSize: 11,
  },
  reviewButton: {
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  reviewButtonText: {
    color: '#061E47',
    fontSize: 11,
    fontWeight: '800',
  },

  /* My Reviews Card */
  myReviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  myReviewTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewTutorName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  ratingStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ratingNum: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  crudBtnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  editReviewBtn: {
    backgroundColor: '#EEF2F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editReviewBtnText: {
    color: '#061E47',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteReviewBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  deleteReviewBtnText: {
    fontSize: 11,
  },
  reviewCommentText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  reviewDateText: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 6,
  },
  emptyStateWrap: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  emptySub: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 26, 60, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 14,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  starsPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  starPick: {
    fontSize: 28,
    color: '#CBD5E1',
  },
  starPickActive: {
    color: '#F59E0B',
  },
  starPickLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  submitEditBtn: {
    backgroundColor: '#FBBF24',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  submitEditBtnDisabled: {
    opacity: 0.65,
  },
  submitEditBtnText: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlayPressable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
});

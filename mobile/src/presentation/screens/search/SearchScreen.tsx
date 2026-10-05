import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { searchMentorsUseCase } from '../../../domain/usecases/mentor/searchMentorsUseCase';
import type { Mentor } from '../../../domain/entities/Mentor';
import { countTutorFilters } from '../../../domain/entities/TutorFilters';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import { shortlistRepository } from '../../../data/repositories/shortlistRepository';
import type { ShortlistedMentor } from '../../../domain/entities/ShortlistedMentor';
import PageHeader from '../../components/PageHeader';

type Props = BottomTabScreenProps<AppTabParamList, 'Search'>;
type MentorCard = Mentor & {
  experience?: string;
  sessionCount?: number;
  availability?: string;
  guidance?: string;
  hourlyRate?: number;
};

const subjects = [
  'All', 'Data Structures', 'DBMS', 'OOP', 'Calculus',
  'Machine Learning', 'Programming', 'Web Development',
];

function matchesMentor(mentor: MentorCard, value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'all') return true;
  return [mentor.name, mentor.bio, ...mentor.subjects]
    .some((item) => item.toLowerCase().includes(normalized));
}

export function getMentorRate(mentor: { _id?: string; name: string; hourlyRate?: number }): number {
  if (typeof mentor.hourlyRate === 'number' && mentor.hourlyRate > 0) {
    return mentor.hourlyRate;
  }
  const idStr = mentor._id || mentor.name || 'mentor';
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
  }
  const rates = [1200, 1500, 1800, 2000, 2200, 2500, 2800, 3200, 3500, 3800, 4200, 4500];
  return rates[hash % rates.length];
}

export default function SearchScreen({ route, navigation }: Props) {
  const initialQuery = route.params?.initialQuery ?? '';
  const faculty = route.params?.faculty;
  const department = route.params?.department;
  const programme = route.params?.programme;
  const academicYear = route.params?.academicYear;
  const semester = route.params?.semester;
  const topic = route.params?.topic;
  const filters = route.params?.filters;
  const activeFilterCount = countTutorFilters(filters);
  const [query, setQuery] = useState(initialQuery);
  const [selectedSubject, setSelectedSubject] = useState(initialQuery || 'All');
  const [apiMentors, setApiMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);

  // Shortlist CRUD state
  const [searchTab, setSearchTab] = useState<'browse' | 'shortlist'>('browse');
  const [shortlist, setShortlist] = useState<ShortlistedMentor[]>([
    {
      mentorId: 'mentor-tharushi-1',
      name: 'Tharushi Perera',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      hourlyRate: 1800,
      rating: 4.9,
      subjects: ['Data Structures', 'Algorithms'],
      priority: 'Top Choice',
      notes: 'Available on Wednesdays. Excellent review on Graph Traversals.',
      savedAt: new Date().toISOString(),
    },
  ]);
  const [showShortlistModal, setShowShortlistModal] = useState(false);
  const [modalTargetMentor, setModalTargetMentor] = useState<MentorCard | ShortlistedMentor | null>(null);
  const [isEditingShortlist, setIsEditingShortlist] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<'Top Choice' | 'Considering' | 'Backup'>('Top Choice');
  const [shortlistNotes, setShortlistNotes] = useState('');
  const [submittingShortlist, setSubmittingShortlist] = useState(false);

  useEffect(() => {
    shortlistRepository.getShortlist().then((data) => {
      if (data && data.length > 0) {
        setShortlist(data);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setQuery(initialQuery);
    setSelectedSubject(initialQuery);
    setLoading(true);
    console.log(`[SearchScreen] 🔎 Initial search triggered with query: "${initialQuery}"`);
    searchMentorsUseCase(initialQuery)
      .then((mentors) => {
        console.log(`[SearchScreen] 📥 Received ${mentors?.length ?? 0} mentors from API`);
        if (active) setApiMentors(mentors);
      })
      .catch((err) => {
        console.error(`[SearchScreen] ❌ Error fetching mentors:`, err.message || err);
        if (active) setApiMentors([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialQuery]);

  useEffect(() => {
    setComparisonIds((current) => current.filter((id) => apiMentors.some((mentor) => mentor._id === id)));
  }, [apiMentors]);

  const visibleMentors = useMemo(() => {
    const searchValue = query.trim() || selectedSubject;
    const remoteMatches = apiMentors.filter((mentor) => matchesMentor(mentor, searchValue));
    const filtered = remoteMatches
      .filter((mentor) => !filters?.minRating || (mentor.rating ?? 0) >= filters.minRating)
      .filter((mentor) => {
        if (!filters?.priceRange) return true;
        const rate = getMentorRate(mentor);
        return filters.priceRange === '500-3000'
          ? (rate >= 500 && rate <= 3000)
          : (rate > 3000 && rate <= 5000);
      });
    console.log(`[SearchScreen] 📊 Total from API: ${apiMentors.length} | Visible after filter: ${filtered.length}`);
    return filtered;
  }, [apiMentors, filters?.minRating, filters?.priceRange, query, selectedSubject]);

  const handleSearch = async (searchValue = query) => {
    const value = searchValue.trim();
    setSelectedSubject(value || 'All');
    console.log(`[SearchScreen] 🔎 Manual search triggered with value: "${value}"`);
    setLoading(true);
    try {
      const results = await searchMentorsUseCase(value === 'All' ? '' : value);
      console.log(`[SearchScreen] 📥 handleSearch received ${results?.length ?? 0} mentors`);
      setApiMentors(results);
    } catch (err: any) {
      console.error(`[SearchScreen] ❌ handleSearch failed:`, err.message || err);
      setApiMentors([]);
    } finally {
      setLoading(false);
    }
  };

  const selectSubject = (subject: string) => {
    const value = subject === 'All' ? '' : subject;
    setQuery(value);
    setSelectedSubject(subject);
    void handleSearch(subject);
  };

  const toggleComparison = (mentorId: string) => {
    setComparisonIds((current) => {
      if (current.includes(mentorId)) return current.filter((id) => id !== mentorId);
      if (current.length >= 3) {
        Alert.alert('Maximum 3 tutors', 'Remove one tutor before adding another.');
        return current;
      }
      return [...current, mentorId];
    });
  };

  const openSaveModal = (mentor: MentorCard) => {
    setModalTargetMentor(mentor);
    setIsEditingShortlist(false);
    const existing = shortlist.find((s) => s.mentorId === mentor._id);
    if (existing) {
      setSelectedPriority(existing.priority);
      setShortlistNotes(existing.notes || '');
    } else {
      setSelectedPriority('Top Choice');
      setShortlistNotes('');
    }
    setShowShortlistModal(true);
  };

  const openEditShortlistModal = (item: ShortlistedMentor) => {
    setModalTargetMentor(item);
    setIsEditingShortlist(true);
    setSelectedPriority(item.priority);
    setShortlistNotes(item.notes || '');
    setShowShortlistModal(true);
  };

  const handleSaveShortlist = async () => {
    if (!modalTargetMentor) return;
    setSubmittingShortlist(true);
    const mentorId = 'mentorId' in modalTargetMentor ? modalTargetMentor.mentorId : modalTargetMentor._id;
    const mentorName = modalTargetMentor.name;
    const rate = 'hourlyRate' in modalTargetMentor && modalTargetMentor.hourlyRate
      ? modalTargetMentor.hourlyRate
      : getMentorRate(modalTargetMentor as MentorCard);
    const rating = modalTargetMentor.rating ?? 4.8;
    const subjectsList = modalTargetMentor.subjects || [];

    try {
      if (isEditingShortlist) {
        const updated = await shortlistRepository.update(mentorId, {
          priority: selectedPriority,
          notes: shortlistNotes.trim(),
        });
        setShortlist(updated);
        Alert.alert('Shortlist Updated', `Updated notes for ${mentorName}.`);
      } else {
        const updated = await shortlistRepository.add({
          mentorId,
          name: mentorName,
          hourlyRate: rate,
          rating,
          subjects: subjectsList,
          priority: selectedPriority,
          notes: shortlistNotes.trim(),
        });
        setShortlist(updated);
        Alert.alert('Saved to Shortlist', `${mentorName} has been added to your shortlist.`);
      }
      setShowShortlistModal(false);
    } catch {
      // Local fallback in case of connection drop
      if (isEditingShortlist) {
        setShortlist((current) =>
          current.map((s) =>
            s.mentorId === mentorId
              ? { ...s, priority: selectedPriority, notes: shortlistNotes.trim() }
              : s
          )
        );
      } else {
        setShortlist((current) => [
          ...current.filter((s) => s.mentorId !== mentorId),
          {
            mentorId,
            name: mentorName,
            hourlyRate: rate,
            rating,
            subjects: subjectsList,
            priority: selectedPriority,
            notes: shortlistNotes.trim(),
            savedAt: new Date().toISOString(),
          },
        ]);
      }
      setShowShortlistModal(false);
      Alert.alert('Shortlist Saved', `Saved ${mentorName} to your shortlist.`);
    } finally {
      setSubmittingShortlist(false);
    }
  };

  const handleRemoveFromShortlist = (mentorId: string, name: string) => {
    Alert.alert(
      'Remove from Shortlist',
      `Are you sure you want to remove ${name} from your shortlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await shortlistRepository.remove(mentorId);
              setShortlist(updated);
            } catch {
              setShortlist((current) => current.filter((s) => s.mentorId !== mentorId));
            }
          },
        },
      ]
    );
  };

  const handleGoBack = () => {
    const parent = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (route.params?.faculty || route.params?.department || route.params?.programme) {
      if (parent) {
        parent.navigate('GuidanceWizard');
      } else {
        navigation.navigate('Home');
      }
    } else if (parent && parent.canGoBack()) {
      parent.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const openComparison = () => {
    const mentors = visibleMentors.filter(({ _id }) => comparisonIds.includes(_id));
    if (mentors.length < 2) {
      Alert.alert('Select tutors', 'Choose at least 2 tutors to compare.');
      return;
    }
    navigation.getParent<NativeStackNavigationProp<AppStackParamList>>()
      ?.navigate('CompareTutors', { mentors });
  };

  const renderMentor = ({ item }: { item: MentorCard }) => {
    const rate = getMentorRate(item);
    const isShortlisted = shortlist.some((s) => s.mentorId === item._id);

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.mentorMain}>
            <Text style={styles.mentorName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.experience}>{item.experience ?? 'Verified senior student mentor'}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{item.rating?.toFixed(1) ?? 'New'}</Text>
              <Text style={styles.sessions}>  ·  {item.sessionCount ?? 0}+ sessions</Text>
            </View>
          </View>
          <View style={styles.matchBadge}><Text style={styles.matchText}>Verified</Text></View>
        </View>

        <View style={styles.subjectRow}>
          {item.subjects.slice(0, 2).map((subject) => (
            <View key={subject} style={styles.subjectTag}>
              <Text style={styles.subjectTagText}>{subject}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>HOURLY RATE</Text>
            <Text style={styles.priceText}>LKR {rate.toLocaleString()} <Text style={styles.priceUnit}>/ hour</Text></Text>
            <Text style={styles.availableText}>●  {item.availability ?? 'Schedule available'}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.saveShortlistBtn, isShortlisted && styles.saveShortlistBtnActive]}
              onPress={() => openSaveModal(item)}
              activeOpacity={0.8}
            >
              <Text style={[styles.saveShortlistText, isShortlisted && styles.saveShortlistTextActive]}>
                {isShortlisted ? '★ Saved' : '☆ Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addCompareButton, comparisonIds.includes(item._id) && styles.addCompareButtonSelected]}
              onPress={() => toggleComparison(item._id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.addCompareText, comparisonIds.includes(item._id) && styles.addCompareTextSelected]}>
                {comparisonIds.includes(item._id) ? '✓ Added' : '+ Compare'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewButton}
              activeOpacity={0.82}
              onPress={() => navigation
                .getParent<NativeStackNavigationProp<AppStackParamList>>()
                ?.navigate('TutorProfile', { mentor: item })}
            >
              <Text style={styles.viewButtonText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderShortlistCard = ({ item }: { item: ShortlistedMentor }) => {
    const priorityColor =
      item.priority === 'Top Choice' ? '#D97706' : item.priority === 'Considering' ? '#1E3A8A' : '#475569';
    const priorityBg =
      item.priority === 'Top Choice' ? '#FEF3C7' : item.priority === 'Considering' ? '#E0E7FF' : '#F1F5F9';

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.mentorMain}>
            <View style={styles.shortlistNameRow}>
              <Text style={styles.mentorName} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityBg }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>{item.priority}</Text>
              </View>
            </View>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{item.rating?.toFixed(1) ?? '4.8'}</Text>
              <Text style={styles.sessions}>  ·  LKR {item.hourlyRate.toLocaleString()} / hour</Text>
            </View>
          </View>
        </View>

        {item.subjects && item.subjects.length > 0 && (
          <View style={styles.subjectRow}>
            {item.subjects.slice(0, 3).map((sub) => (
              <View key={sub} style={styles.subjectTag}>
                <Text style={styles.subjectTagText}>{sub}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Private Student Notes */}
        <View style={styles.notesBox}>
          <Text style={styles.notesBoxLabel}>MY PRIVATE NOTES:</Text>
          <Text style={styles.notesBoxContent}>
            {item.notes ? item.notes : 'No private notes yet. Tap "Edit Notes" to record study goals or preferred days.'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.shortlistActions}>
            <TouchableOpacity
              style={styles.editNotesBtn}
              onPress={() => openEditShortlistModal(item)}
            >
              <Text style={styles.editNotesBtnText}>✏️ Edit Notes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveFromShortlist(item.mentorId, item.name)}
            >
              <Text style={styles.removeBtnText}>🗑️ Remove</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              const fullMentor = apiMentors.find((m) => m._id === item.mentorId) || {
                _id: item.mentorId,
                name: item.name,
                email: '',
                role: 'mentor' as const,
                subjects: item.subjects,
                rating: item.rating,
                hourlyRate: item.hourlyRate,
              };
              navigation
                .getParent<NativeStackNavigationProp<AppStackParamList>>()
                ?.navigate('TutorProfile', { mentor: fullMentor as Mentor });
            }}
          >
            <Text style={styles.viewButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Find Your Mentor" onBack={handleGoBack} />
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="Search module or tutor"
            placeholderTextColor="#8492AD"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void handleSearch()}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchButton} onPress={() => void handleSearch()}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher: All Tutors vs My Shortlist */}
        <View style={styles.tabSwitchRow}>
          <TouchableOpacity
            style={[styles.tabSwitchBtn, searchTab === 'browse' && styles.tabSwitchBtnActive]}
            onPress={() => setSearchTab('browse')}
          >
            <Text style={[styles.tabSwitchText, searchTab === 'browse' && styles.tabSwitchTextActive]}>
              All Tutors ({visibleMentors.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabSwitchBtn, searchTab === 'shortlist' && styles.tabSwitchBtnActive]}
            onPress={() => setSearchTab('shortlist')}
          >
            <Text style={[styles.tabSwitchText, searchTab === 'shortlist' && styles.tabSwitchTextActive]}>
              ★ My Shortlist ({shortlist.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={searchTab === 'browse' ? visibleMentors : (shortlist as any)}
        keyExtractor={(item: any) => item._id || item.mentorId}
        renderItem={searchTab === 'browse' ? (renderMentor as any) : (renderShortlistCard as any)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, comparisonIds.length > 0 && styles.listContentWithCompare]}
        ListHeaderComponent={searchTab === 'browse' ? (
          <>
            <View style={styles.filterHeadingRow}>
              <Text style={styles.browseLabel}>Filter by module</Text>
              <TouchableOpacity
                style={[styles.openFiltersButton, activeFilterCount > 0 && styles.openFiltersButtonActive]}
                onPress={() => navigation
                  .getParent<NativeStackNavigationProp<AppStackParamList>>()
                  ?.navigate('Filters', { filters, searchParams: route.params })}
                activeOpacity={0.8}
              >
                <Text style={[styles.openFiltersIcon, activeFilterCount > 0 && styles.openFiltersTextActive]}>≡</Text>
                <Text style={[styles.openFiltersText, activeFilterCount > 0 && styles.openFiltersTextActive]}>Filters</Text>
                {activeFilterCount > 0 && <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilterCount}</Text></View>}
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {subjects.map((subject) => {
                const active = selectedSubject === subject || (!query && subject === 'All');
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => selectSubject(subject)}
                  >
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>{subject}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>Available tutors</Text>
                <Text style={styles.resultsCount}>{visibleMentors.length} results</Text>
                {(faculty || department || programme) && (
                  <Text style={styles.resultsContext} numberOfLines={1}>
                    {initialQuery || [faculty, department].filter(Boolean).join('  •  ')}
                  </Text>
                )}
              </View>
              {loading && <ActivityIndicator color="#061E47" />}
            </View>
            {comparisonIds.length > 0 && (
              <View style={styles.comparePanel}>
                <View style={styles.compareCountWrap}>
                  <Text style={styles.compareCount}>{comparisonIds.length}/3</Text>
                  <Text style={styles.compareHint}>tutors selected</Text>
                </View>
                <TouchableOpacity
                  style={[styles.compareButton, comparisonIds.length < 2 && styles.compareButtonDisabled]}
                  onPress={openComparison}
                  activeOpacity={0.84}
                >
                  <Text style={styles.compareButtonText}>Compare Tutors</Text>
                  <Text style={styles.compareArrow}>→</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={styles.shortlistHeaderWrap}>
            <View style={styles.shortlistHeaderInfo}>
              <Text style={styles.resultsTitle}>My Shortlisted Mentors</Text>
              <Text style={styles.resultsCount}>{shortlist.length} saved tutors with private study notes</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>{searchTab === 'browse' ? '⌕' : '★'}</Text>
            <Text style={styles.emptyTitle}>
              {searchTab === 'browse' ? 'No mentors found' : 'Your Shortlist is Empty'}
            </Text>
            <Text style={styles.emptyText}>
              {searchTab === 'browse'
                ? 'Try another subject or search term.'
                : 'Browse tutors in "All Tutors" and tap "☆ Save" to create your personal shortlist with custom notes and priorities.'}
            </Text>
          </View>
        )}
      />

      {/* Shortlist Modal for Create & Update */}
      <Modal
        visible={showShortlistModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowShortlistModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowShortlistModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>
              {isEditingShortlist ? 'Edit Shortlist Entry' : 'Save to My Shortlist'}
            </Text>
            <Text style={styles.sheetSubtitle}>
              {modalTargetMentor ? modalTargetMentor.name : 'Selected Tutor'} • Record personal study notes
            </Text>

            <Text style={styles.modalLabel}>Select Priority:</Text>
            <View style={styles.prioritySelectorRow}>
              {(['Top Choice', 'Considering', 'Backup'] as const).map((p) => {
                const active = selectedPriority === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityOption, active && styles.priorityOptionActive]}
                    onPress={() => setSelectedPriority(p)}
                  >
                    <Text style={[styles.priorityOptionText, active && styles.priorityOptionTextActive]}>
                      {p === 'Top Choice' ? '🥇 ' : p === 'Considering' ? '🥈 ' : '🥉 '}
                      {p}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Private Study Notes:</Text>
            <TextInput
              style={styles.modalNotesInput}
              value={shortlistNotes}
              onChangeText={setShortlistNotes}
              placeholder="e.g. Free on Wednesdays after 4 PM; great for Graph Algorithms"
              placeholderTextColor="#94A3B8"
              multiline
            />

            <TouchableOpacity
              style={styles.saveShortlistSubmitBtn}
              onPress={handleSaveShortlist}
              disabled={submittingShortlist}
            >
              {submittingShortlist ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveShortlistSubmitText}>
                  {isEditingShortlist ? 'Update Notes & Priority' : 'Save to My Shortlist'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setShowShortlistModal(false)}
            >
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {comparisonIds.length > 0 && (
        <View style={styles.floatingCompareBar}>
          <View>
            <Text style={styles.floatingCompareCount}>{comparisonIds.length}/3 selected</Text>
            <Text style={styles.floatingCompareHint}>{comparisonIds.length < 2 ? 'Select one more tutor' : 'Ready to compare'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.floatingCompareButton, comparisonIds.length < 2 && styles.compareButtonDisabled]}
            onPress={openComparison}
            activeOpacity={0.84}
          >
            <Text style={styles.floatingCompareText}>Compare Tutors</Text>
            <Text style={styles.floatingCompareArrow}>→</Text>
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
  header: { backgroundColor: '#F4F7FB', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerSpacer: { width: 40 },
  title: {
    flex: 1,
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#D5E3F6',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 16,
    paddingLeft: 2,
  },
  searchBox: { height: 54, borderRadius: 16, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingLeft: 13, shadowColor: '#001433', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  searchIcon: { color: navy, fontSize: 25, fontWeight: '800', marginRight: 7, marginTop: -3 },
  input: { flex: 1, color: '#253654', fontSize: 14, paddingVertical: 0 },
  searchButton: { height: 42, borderRadius: 12, backgroundColor: amber, justifyContent: 'center', paddingHorizontal: 16, marginRight: 6 },
  searchButtonText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  listContent: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 30 },
  listContentWithCompare: { paddingBottom: 104 },
  filterHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  browseLabel: { color: navy, fontSize: 13, fontWeight: '800' },
  openFiltersButton: { minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: '#D9E3F0', backgroundColor: '#FFF', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center' },
  openFiltersButtonActive: { borderColor: amber, backgroundColor: '#FEF3C7' },
  openFiltersIcon: { color: '#60708D', fontSize: 16, fontWeight: '900', marginRight: 5, transform: [{ rotate: '90deg' }] },
  openFiltersText: { color: '#526681', fontSize: 11, fontWeight: '800' },
  openFiltersTextActive: { color: '#B45309' },
  filterCount: { minWidth: 18, height: 18, borderRadius: 9, backgroundColor: amber, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  filterCountText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  filterRow: { gap: 8, paddingRight: 16, paddingBottom: 4 },
  filterChip: { borderWidth: 1, borderColor: '#DCE4EF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' },
  filterChipActive: { borderColor: amber, backgroundColor: amber },
  filterText: { color: '#60708D', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#FFF' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 },
  resultsTitle: { color: navy, fontSize: 20, fontWeight: '900' },
  resultsCount: { color: '#7E8DA8', fontSize: 12, marginTop: 2 },
  resultsContext: { color: '#55708F', fontSize: 10, marginTop: 3, maxWidth: 290 },
  comparePanel: { minHeight: 62, borderRadius: 16, backgroundColor: '#EEF2F8', borderWidth: 1, borderColor: '#CFE0F8', paddingHorizontal: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  compareCountWrap: { flex: 1 },
  compareCount: { color: navy, fontSize: 16, fontWeight: '900' },
  compareHint: { color: '#71819B', fontSize: 9.5, marginTop: 1 },
  compareButton: { height: 40, borderRadius: 12, backgroundColor: navy, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  compareButtonDisabled: { opacity: 0.42 },
  compareButtonText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  compareArrow: { color: gold, fontSize: 17, fontWeight: '900', marginLeft: 7 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, marginBottom: 13, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#1D3D66', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 54, height: 54, borderRadius: 17, backgroundColor: '#EEF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: navy, fontSize: 22, fontWeight: '900' },
  onlineDot: { position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: 7, backgroundColor: onlineGreen, borderWidth: 2, borderColor: '#FFF' },
  mentorMain: { flex: 1, minWidth: 0 },
  mentorName: { color: navy, fontSize: 16, fontWeight: '900' },
  experience: { color: '#74839E', fontSize: 11, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  star: { color: amber, fontSize: 14 },
  rating: { color: '#263553', fontSize: 12, fontWeight: '800', marginLeft: 3 },
  sessions: { color: '#8491A8', fontSize: 11 },
  matchBadge: { alignSelf: 'flex-start', backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 5 },
  matchText: { color: '#D97706', fontSize: 9, fontWeight: '800' },
  matchBadgeSelected: { backgroundColor: navy },
  matchTextSelected: { color: '#FFF' },
  bio: { color: '#5F6F89', fontSize: 12, lineHeight: 17, marginTop: 11 },
  guidance: { color: '#64748B', fontSize: 11, lineHeight: 16, marginTop: 7 },
  guidanceLabel: { color: navy, fontWeight: '900' },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  subjectTag: { backgroundColor: '#EEF2F8', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 },
  subjectTagText: { color: navy, fontSize: 10, fontWeight: '700' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#ECF0F5', marginTop: 14, paddingTop: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceBlock: { flex: 1, minWidth: 0 },
  priceLabel: { color: '#8996AB', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  priceText: { color: navy, fontSize: 16, fontWeight: '900', marginTop: 2 },
  priceUnit: { color: '#7C8AA3', fontSize: 9.5, fontWeight: '700' },
  cardActions: { gap: 6, marginLeft: 9 },
  addCompareButton: { minWidth: 91, height: 32, borderRadius: 10, borderWidth: 1, borderColor: navy, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  addCompareButtonSelected: { backgroundColor: navy, borderColor: navy },
  addCompareText: { color: navy, fontSize: 10, fontWeight: '900' },
  addCompareTextSelected: { color: '#FFF' },
  availableLabel: { color: '#9AA5B9', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  availableText: { color: '#D97706', fontSize: 9.5, fontWeight: '800', marginTop: 3 },
  viewButton: { backgroundColor: navy, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  viewButtonText: { color: '#FFF', fontSize: 12, fontWeight: '800' },
  floatingCompareBar: { position: 'absolute', left: 12, right: 12, bottom: 8, minHeight: 66, borderRadius: 18, backgroundColor: navy, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#001433', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  floatingCompareCount: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  floatingCompareHint: { color: '#BFCFE7', fontSize: 9.5, marginTop: 2 },
  floatingCompareButton: { height: 42, borderRadius: 12, backgroundColor: amber, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' },
  floatingCompareText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  floatingCompareArrow: { color: '#FFF', fontSize: 18, fontWeight: '900', marginLeft: 7 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 18, alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },
  emptyIcon: { color: '#9AA8BD', fontSize: 35 },
  emptyTitle: { color: navy, fontSize: 16, fontWeight: '800', marginTop: 6 },
  emptyText: { color: '#8794AA', fontSize: 12, marginTop: 4 },
  detailBackdrop: { flex: 1, backgroundColor: 'rgba(3, 18, 43, 0.58)', justifyContent: 'flex-end' },
  detailSheet: { maxHeight: '90%', backgroundColor: '#F7F9FC', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CCD5E2', alignSelf: 'center', marginBottom: 12 },
  detailTopRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailEyebrow: { color: '#D97706', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8EDF4', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: navy, fontSize: 24, lineHeight: 27, fontWeight: '500' },
  profileHeader: { alignItems: 'center', paddingTop: 4, paddingBottom: 14 },
  detailAvatar: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#EEF2F8', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  detailAvatarText: { color: navy, fontSize: 32, fontWeight: '900' },
  detailOnlineDot: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: onlineGreen, borderWidth: 3, borderColor: '#F7F9FC' },
  detailName: { color: navy, fontSize: 22, fontWeight: '900' },
  detailExperience: { color: '#65758F', fontSize: 12, fontWeight: '700', marginTop: 3 },
  detailEmail: { color: '#8996AA', fontSize: 11, marginTop: 3 },
  statsRow: { backgroundColor: navyCard, borderRadius: 18, minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  statLabel: { color: '#BFD0E9', fontSize: 9, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.7 },
  statDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.18)' },
  onlineText: { color: onlineGreen },
  detailSection: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E7ECF3' },
  detailSectionTitle: { color: navy, fontSize: 14, fontWeight: '900', marginBottom: 7 },
  detailBody: { color: '#5D6D86', fontSize: 12, lineHeight: 18 },
  detailSubjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  detailSubjectTag: { backgroundColor: '#EAF3FF', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  detailSubjectText: { color: '#25588D', fontSize: 11, fontWeight: '800' },
  guidanceCard: { backgroundColor: '#FFFDF0', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#FDE68A' },
  guidanceCardTitle: { color: navy, fontSize: 14, fontWeight: '900', marginBottom: 6 },
  guidanceCardText: { color: '#78350F', fontSize: 12, lineHeight: 18 },
  availabilityCard: { backgroundColor: '#FFFDF0', borderRadius: 16, padding: 13, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  availabilityIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  availabilityIconText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  availabilityCopy: { flex: 1 },
  availabilityTitle: { color: '#D97706', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  availabilityValue: { color: navy, fontSize: 13, fontWeight: '900', marginTop: 2 },

  /* Tab Switcher: All Tutors vs My Shortlist */
  tabSwitchRow: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: '#E6EDF6',
    borderRadius: 14,
    padding: 3,
  },
  tabSwitchBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  tabSwitchText: {
    color: '#526681',
    fontSize: 12,
    fontWeight: '700',
  },
  tabSwitchTextActive: {
    color: navy,
    fontWeight: '800',
  },

  /* Shortlist Button on Tutor Cards */
  saveShortlistBtn: {
    minWidth: 84,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: amber,
    backgroundColor: '#FFFDF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveShortlistBtnActive: {
    backgroundColor: amber,
    borderColor: amber,
  },
  saveShortlistText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '900',
  },
  saveShortlistTextActive: {
    color: '#FFFFFF',
  },

  /* Shortlisted Card Specifics */
  shortlistNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 6,
  },
  priorityBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  notesBox: {
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  notesBoxLabel: {
    color: '#D97706',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  notesBoxContent: {
    color: '#334155',
    fontSize: 11.5,
    lineHeight: 16,
  },
  shortlistActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  editNotesBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  editNotesBtnText: {
    color: navy,
    fontSize: 11,
    fontWeight: '700',
  },
  removeBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removeBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  shortlistHeaderWrap: {
    paddingVertical: 12,
    marginBottom: 4,
  },
  shortlistHeaderInfo: {},

  /* Shortlist Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,30,71,0.55)',
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
  modalLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  prioritySelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  priorityOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  priorityOptionActive: {
    backgroundColor: '#FEF3C7',
    borderColor: amber,
  },
  priorityOptionText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  priorityOptionTextActive: {
    color: '#D97706',
    fontWeight: '900',
  },
  modalNotesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  saveShortlistSubmitBtn: {
    backgroundColor: amber,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveShortlistSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sheetTitle: { color: navy, fontSize: 18, fontWeight: '800' },
  sheetSubtitle: { color: '#64748B', fontSize: 11, marginTop: 2, marginBottom: 14 },
  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
});

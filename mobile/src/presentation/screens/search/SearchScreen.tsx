import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchMentorsUseCase } from '../../../domain/usecases/mentor/searchMentorsUseCase';
import type { Mentor } from '../../../domain/entities/Mentor';
import type { AppTabParamList } from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Search'>;
type MentorCard = Mentor & {
  experience?: string;
  sessionCount?: number;
  availability?: string;
  guidance?: string;
};

const subjects = [
  'All', 'Data Structures', 'DBMS', 'OOP', 'Calculus',
  'Machine Learning', 'Programming', 'Web Development',
];

const demoMentors: MentorCard[] = [
  {
    _id: 'demo-1', name: 'Nimal Perera', email: 'nimal@unimentor.lk',
    subjects: ['Data Structures', 'Algorithms', 'Programming'], rating: 4.9,
    bio: 'Final-year Computer Science student who enjoys explaining algorithms with simple examples.',
    experience: '4th year student mentor', sessionCount: 42, availability: 'Available today',
  },
  {
    _id: 'demo-2', name: 'Tharushi Silva', email: 'tharushi@unimentor.lk',
    subjects: ['DBMS', 'SQL', 'Database Design'], rating: 4.8,
    bio: 'Senior IT student offering friendly support with SQL, database design and coursework.',
    experience: '4th year student mentor', sessionCount: 35, availability: 'Next slot 4:00 PM',
  },
  {
    _id: 'demo-3', name: 'Kasun Fernando', email: 'kasun@unimentor.lk',
    subjects: ['OOP', 'Java', 'Software Engineering'], rating: 4.9,
    bio: 'Final-year Software Engineering student sharing practical OOP and Java guidance.',
    experience: 'Final-year student mentor', sessionCount: 48, availability: 'Available today',
  },
  {
    _id: 'demo-4', name: 'Amali Jayasinghe', email: 'amali@unimentor.lk',
    subjects: ['Calculus', 'Mathematics', 'Statistics'], rating: 4.7,
    bio: 'Fourth-year Mathematics student helping juniors understand tutorials and exam questions.',
    experience: '4th year student mentor', sessionCount: 31, availability: 'Next slot tomorrow',
  },
  {
    _id: 'demo-5', name: 'Ravindu Senanayake', email: 'ravindu@unimentor.lk',
    subjects: ['Machine Learning', 'Python', 'Data Science'], rating: 4.9,
    bio: 'Final-year Data Science student supporting juniors with ML basics and Python projects.',
    experience: 'Final-year student mentor', sessionCount: 39, availability: 'Available today',
  },
  {
    _id: 'demo-6', name: 'Shenali Dias', email: 'shenali@unimentor.lk',
    subjects: ['Programming', 'Python', 'Programming Fundamentals'], rating: 4.8,
    bio: 'Third-year Computing student who provides beginner-friendly coding support.',
    experience: '3rd year student mentor', sessionCount: 27, availability: 'Next slot 6:30 PM',
  },
  {
    _id: 'demo-7', name: 'Mohamed Irfan', email: 'irfan@unimentor.lk',
    subjects: ['Web Development', 'React', 'Node.js'], rating: 4.7,
    bio: 'Final-year IT student helping juniors build web projects and complete assignments.',
    experience: 'Final-year student mentor', sessionCount: 33, availability: 'Available tomorrow',
  },
];

const moduleTutorProfiles = [
  { name: 'Sachini Wijesinghe', rating: 4.9, experience: 'Final-year student mentor', sessionCount: 38, availability: 'Available today' },
  { name: 'Dilan Abeysekara', rating: 4.8, experience: '4th year student mentor', sessionCount: 29, availability: 'Next slot 5:30 PM' },
  { name: 'Nethmi Gunawardena', rating: 4.7, experience: '3rd year student mentor', sessionCount: 21, availability: 'Available tomorrow' },
];

function createModuleTutors(
  moduleName: string,
  faculty?: string,
  department?: string,
): MentorCard[] {
  const slug = moduleName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const academicArea = department || faculty || 'Academic Studies';

  return moduleTutorProfiles.map((profile, index) => ({
    _id: `module-${slug}-${index + 1}`,
    name: profile.name,
    email: `${slug}.tutor${index + 1}@unimentor.lk`,
    subjects: [moduleName, academicArea],
    rating: profile.rating,
    bio: `Senior student mentor providing clear, step-by-step peer support for ${moduleName}.`,
    experience: profile.experience,
    sessionCount: profile.sessionCount,
    availability: profile.availability,
    guidance: 'Core concepts, tutorials, assignments, exam preparation and practical problem solving',
  }));
}

function matchesMentor(mentor: MentorCard, value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'all') return true;
  return [mentor.name, mentor.bio, ...mentor.subjects]
    .some((item) => item.toLowerCase().includes(normalized));
}

function mergeMentors(apiMentors: Mentor[], fallbackMentors: MentorCard[]): MentorCard[] {
  const merged = new Map<string, MentorCard>();
  fallbackMentors.forEach((mentor) => merged.set(mentor._id, mentor));
  apiMentors.forEach((mentor) => merged.set(mentor._id, mentor));
  return [...merged.values()];
}

export default function SearchScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const initialQuery = route.params?.initialQuery ?? '';
  const faculty = route.params?.faculty;
  const department = route.params?.department;
  const programme = route.params?.programme;
  const [query, setQuery] = useState(initialQuery);
  const [selectedSubject, setSelectedSubject] = useState(initialQuery || 'All');
  const [apiMentors, setApiMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorCard | null>(null);

  useEffect(() => {
    if (!initialQuery) return;
    let active = true;
    setQuery(initialQuery);
    setSelectedSubject(initialQuery);
    setLoading(true);
    searchMentorsUseCase(initialQuery)
      .then((mentors) => {
        if (active) setApiMentors(mentors);
      })
      .catch(() => {
        if (active) setApiMentors([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialQuery]);

  const visibleMentors = useMemo(() => {
    const searchValue = query.trim() || selectedSubject;
    const localMatches = demoMentors.filter((mentor) => matchesMentor(mentor, searchValue));
    const remoteMatches = apiMentors.filter((mentor) => matchesMentor(mentor, searchValue));
    const searchingByTutorName = demoMentors.some((mentor) =>
      mentor.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
    const moduleTutors = searchValue && searchValue !== 'All' && !searchingByTutorName
      ? createModuleTutors(
        searchValue,
        searchValue === initialQuery ? faculty : undefined,
        searchValue === initialQuery ? department : undefined,
      )
      : [];
    return mergeMentors(remoteMatches, [...localMatches, ...moduleTutors]);
  }, [apiMentors, department, faculty, initialQuery, query, selectedSubject]);

  const handleSearch = async (searchValue = query) => {
    const value = searchValue.trim();
    setSelectedSubject(value || 'All');
    if (!value || value === 'All') {
      setApiMentors([]);
      return;
    }

    setLoading(true);
    try {
      setApiMentors(await searchMentorsUseCase(value));
    } catch {
      // Keep local suggestions visible while the API is unavailable.
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

  const renderMentor = ({ item }: { item: MentorCard }) => (
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
        <View style={styles.matchBadge}><Text style={styles.matchText}>Top match</Text></View>
      </View>

      <Text style={styles.bio} numberOfLines={2}>{item.bio || 'Academic mentor ready to help with your studies.'}</Text>
      <Text style={styles.guidance} numberOfLines={2}>
        <Text style={styles.guidanceLabel}>Guidance: </Text>
        {item.guidance ?? 'Concept explanations, assignments, exam preparation and practical support'}
      </Text>

      <View style={styles.subjectRow}>
        {item.subjects.slice(0, 3).map((subject) => (
          <View key={subject} style={styles.subjectTag}>
            <Text style={styles.subjectTagText}>{subject}</Text>
          </View>
        ))}
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.availableLabel}>AVAILABILITY</Text>
          <Text style={styles.availableText}>{item.availability ?? 'Schedule available'}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewButton}
          activeOpacity={0.82}
          onPress={() => setSelectedMentor(item)}
        >
          <Text style={styles.viewButtonText}>View Mentor  →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.page}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) }]}>
        <Text style={styles.eyebrow}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Find Your Mentor</Text>
        <Text style={styles.subtitle}>Find a senior student who has already studied your subject.</Text>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="Search a subject, mentor or skill..."
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
      </View>

      <FlatList
        data={visibleMentors}
        keyExtractor={(item) => item._id}
        renderItem={renderMentor}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={(
          <>
            <Text style={styles.browseLabel}>Browse by subject</Text>
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
                <Text style={styles.resultsTitle}>Recommended Student Mentors</Text>
                <Text style={styles.resultsCount}>{visibleMentors.length} mentors found</Text>
                {(faculty || department || programme) && (
                  <Text style={styles.resultsContext} numberOfLines={1}>
                    {[faculty, department, programme].filter(Boolean).join('  •  ')}
                  </Text>
                )}
              </View>
              {loading && <ActivityIndicator color="#075A4D" />}
            </View>
          </>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>⌕</Text>
            <Text style={styles.emptyTitle}>No mentors found</Text>
            <Text style={styles.emptyText}>Try another subject or search term.</Text>
          </View>
        )}
      />

      <Modal
        transparent
        visible={selectedMentor !== null}
        animationType="slide"
        onRequestClose={() => setSelectedMentor(null)}
      >
        <Pressable style={styles.detailBackdrop} onPress={() => setSelectedMentor(null)}>
          <Pressable
            style={[styles.detailSheet, { paddingBottom: Math.max(insets.bottom, 18) }]}
            onPress={(event) => event.stopPropagation()}
          >
            {selectedMentor && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHandle} />
                <View style={styles.detailTopRow}>
                  <Text style={styles.detailEyebrow}>STUDENT MENTOR PROFILE</Text>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedMentor(null)}>
                    <Text style={styles.closeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.profileHeader}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>{selectedMentor.name.charAt(0).toUpperCase()}</Text>
                    <View style={styles.detailOnlineDot} />
                  </View>
                  <Text style={styles.detailName}>{selectedMentor.name}</Text>
                  <Text style={styles.detailExperience}>
                    {selectedMentor.experience ?? 'Verified senior student mentor'}
                  </Text>
                  <Text style={styles.detailEmail}>{selectedMentor.email}</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>★ {selectedMentor.rating?.toFixed(1) ?? 'New'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedMentor.sessionCount ?? 0}+</Text>
                    <Text style={styles.statLabel}>Sessions</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, styles.onlineText]}>Online</Text>
                    <Text style={styles.statLabel}>Status</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>About this mentor</Text>
                  <Text style={styles.detailBody}>
                    {selectedMentor.bio || 'A senior student ready to provide friendly academic peer support.'}
                  </Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Subjects</Text>
                  <View style={styles.detailSubjects}>
                    {selectedMentor.subjects.map((subject) => (
                      <View key={subject} style={styles.detailSubjectTag}>
                        <Text style={styles.detailSubjectText}>{subject}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.guidanceCard}>
                  <Text style={styles.guidanceCardTitle}>Guidance offered</Text>
                  <Text style={styles.guidanceCardText}>
                    {selectedMentor.guidance ?? 'Concept explanations, tutorials, assignments, exam preparation and practical support'}
                  </Text>
                </View>

                <View style={styles.availabilityCard}>
                  <View style={styles.availabilityIcon}><Text style={styles.availabilityIconText}>✓</Text></View>
                  <View style={styles.availabilityCopy}>
                    <Text style={styles.availabilityTitle}>Next availability</Text>
                    <Text style={styles.availabilityValue}>
                      {selectedMentor.availability ?? 'Schedule available'}
                    </Text>
                  </View>
                </View>

              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const navy = '#062B67';
const green = '#087B59';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { backgroundColor: navy, paddingHorizontal: 18, paddingBottom: 22 },
  eyebrow: { color: '#FFD200', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginBottom: 5 },
  title: { color: '#FFF', fontSize: 28, fontWeight: '900' },
  subtitle: { color: '#D5E3F6', fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: 16 },
  searchBox: { height: 52, borderRadius: 15, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingLeft: 12 },
  searchIcon: { color: navy, fontSize: 25, fontWeight: '800', marginRight: 7, marginTop: -3 },
  input: { flex: 1, color: '#253654', fontSize: 14, paddingVertical: 0 },
  searchButton: { height: 40, borderRadius: 12, backgroundColor: '#FFD200', justifyContent: 'center', paddingHorizontal: 15, marginRight: 6 },
  searchButtonText: { color: navy, fontSize: 13, fontWeight: '900' },
  listContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 28 },
  browseLabel: { color: navy, fontSize: 13, fontWeight: '800', marginBottom: 9 },
  filterRow: { gap: 8, paddingRight: 14, paddingBottom: 4 },
  filterChip: { borderWidth: 1, borderColor: '#DCE4EF', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' },
  filterChipActive: { borderColor: green, backgroundColor: green },
  filterText: { color: '#60708D', fontSize: 12, fontWeight: '700' },
  filterTextActive: { color: '#FFF' },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 11 },
  resultsTitle: { color: navy, fontSize: 18, fontWeight: '900' },
  resultsCount: { color: '#7E8DA8', fontSize: 12, marginTop: 2 },
  resultsContext: { color: '#55708F', fontSize: 10, marginTop: 3, maxWidth: 290 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#E6EBF3', shadowColor: '#1D3D66', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#E2F5EE', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarText: { color: green, fontSize: 22, fontWeight: '900' },
  onlineDot: { position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: 7, backgroundColor: '#28B779', borderWidth: 2, borderColor: '#FFF' },
  mentorMain: { flex: 1, minWidth: 0 },
  mentorName: { color: navy, fontSize: 16, fontWeight: '900' },
  experience: { color: '#74839E', fontSize: 11, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  star: { color: '#FFB000', fontSize: 14 },
  rating: { color: '#263553', fontSize: 12, fontWeight: '800', marginLeft: 3 },
  sessions: { color: '#8491A8', fontSize: 11 },
  matchBadge: { alignSelf: 'flex-start', backgroundColor: '#FFF4D0', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5 },
  matchText: { color: '#9A6A00', fontSize: 9, fontWeight: '800' },
  bio: { color: '#5F6F89', fontSize: 12, lineHeight: 17, marginTop: 11 },
  guidance: { color: '#64748B', fontSize: 11, lineHeight: 16, marginTop: 7 },
  guidanceLabel: { color: green, fontWeight: '900' },
  subjectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  subjectTag: { backgroundColor: '#EEF5FF', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  subjectTagText: { color: '#275991', fontSize: 10, fontWeight: '700' },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#ECF0F5', marginTop: 12, paddingTop: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  availableLabel: { color: '#9AA5B9', fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  availableText: { color: green, fontSize: 11, fontWeight: '800', marginTop: 2 },
  viewButton: { backgroundColor: navy, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 9 },
  viewButtonText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 18, alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },
  emptyIcon: { color: '#9AA8BD', fontSize: 35 },
  emptyTitle: { color: navy, fontSize: 16, fontWeight: '800', marginTop: 6 },
  emptyText: { color: '#8794AA', fontSize: 12, marginTop: 4 },
  detailBackdrop: { flex: 1, backgroundColor: 'rgba(3, 18, 43, 0.58)', justifyContent: 'flex-end' },
  detailSheet: { maxHeight: '90%', backgroundColor: '#F7F9FC', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 18, paddingTop: 10 },
  sheetHandle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#CCD5E2', alignSelf: 'center', marginBottom: 12 },
  detailTopRow: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailEyebrow: { color: green, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8EDF4', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { color: navy, fontSize: 24, lineHeight: 27, fontWeight: '500' },
  profileHeader: { alignItems: 'center', paddingTop: 4, paddingBottom: 14 },
  detailAvatar: { width: 76, height: 76, borderRadius: 24, backgroundColor: '#DDF4EA', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  detailAvatarText: { color: green, fontSize: 32, fontWeight: '900' },
  detailOnlineDot: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: '#28B779', borderWidth: 3, borderColor: '#F7F9FC' },
  detailName: { color: navy, fontSize: 22, fontWeight: '900' },
  detailExperience: { color: '#65758F', fontSize: 12, fontWeight: '700', marginTop: 3 },
  detailEmail: { color: '#8996AA', fontSize: 11, marginTop: 3 },
  statsRow: { backgroundColor: navy, borderRadius: 18, minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  statLabel: { color: '#BFD0E9', fontSize: 9, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.7 },
  statDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.18)' },
  onlineText: { color: '#64E0AF' },
  detailSection: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E7ECF3' },
  detailSectionTitle: { color: navy, fontSize: 14, fontWeight: '900', marginBottom: 7 },
  detailBody: { color: '#5D6D86', fontSize: 12, lineHeight: 18 },
  detailSubjects: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  detailSubjectTag: { backgroundColor: '#EAF3FF', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  detailSubjectText: { color: '#25588D', fontSize: 11, fontWeight: '800' },
  guidanceCard: { backgroundColor: '#E6F7F0', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#CBECDD' },
  guidanceCardTitle: { color: green, fontSize: 14, fontWeight: '900', marginBottom: 6 },
  guidanceCardText: { color: '#41685C', fontSize: 12, lineHeight: 18 },
  availabilityCard: { backgroundColor: '#FFF8DC', borderRadius: 16, padding: 13, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  availabilityIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#FFD200', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  availabilityIconText: { color: navy, fontSize: 17, fontWeight: '900' },
  availabilityCopy: { flex: 1 },
  availabilityTitle: { color: '#866400', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  availabilityValue: { color: navy, fontSize: 13, fontWeight: '900', marginTop: 2 },
});

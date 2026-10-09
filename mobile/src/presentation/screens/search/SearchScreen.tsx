import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { searchMentorsUseCase } from '../../../domain/usecases/mentor/searchMentorsUseCase';
import type { Mentor } from '../../../domain/entities/Mentor';
import { countTutorFilters, TutorFilters } from '../../../domain/entities/TutorFilters';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { shortlistRepository } from '../../../data/repositories/shortlistRepository';
import { bookedTutorsRepository } from '../../../data/repositories/bookedTutorsRepository';
import { tutorSettingsRepository, TutorBookingSettings } from '../../../data/repositories/tutorSettingsRepository';
import TutorAvatar from '../../components/common/TutorAvatar';
import type { ShortlistedMentor } from '../../../domain/entities/ShortlistedMentor';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = any;
type MentorCard = Mentor & {
  experience?: string;
  sessionCount?: number;
  availability?: string;
  guidance?: string;
  hourlyRate?: number;
  experienceYears?: '1-2 years' | '3-5 years' | '5+ years';
  languages?: string[];
  lessonTypes?: ('Individual' | 'Group')[];
};

const BASE_DEFAULT_MENTORS: MentorCard[] = [
  {
    _id: 'mentor-alex',
    name: 'Alex Ferreira',
    email: 'alex.f@unimentor.lk',
    role: 'mentor',
    subjects: ['Database Management Systems', 'Data Structures & Algorithms'],
    bio: 'Senior distinction peer tutor specializing in SQL query optimization and database design.',
    rating: 4.9,
    reviewCount: 48,
    hourlyRate: 2500,
    experience: 'Senior Peer Mentor',
    sessionCount: 38,
    availability: 'Weekdays 3:00 - 6:00 PM',
    experienceYears: '3-5 years',
    languages: ['English', 'Sinhala'],
    lessonTypes: ['Individual', 'Group'],
  },
  {
    _id: 'demo-tutor-1',
    name: 'Tharushi Perera',
    email: 'tharushi.p@unimentor.lk',
    role: 'mentor',
    subjects: ['Data Structures & Algorithms', 'Object Oriented Programming'],
    bio: 'Specialist in Graph Algorithms, BFS/DFS, and Tree Traversals.',
    rating: 4.9,
    reviewCount: 38,
    hourlyRate: 2200,
    experience: 'Senior Peer Mentor',
    sessionCount: 24,
    availability: 'Flexible Evenings',
    experienceYears: '3-5 years',
    languages: ['English', 'Sinhala'],
    lessonTypes: ['Individual', 'Group'],
  },
  {
    _id: 'mentor-shenal',
    name: 'Shenal Perera',
    email: 'shenal.p@unimentor.lk',
    role: 'mentor',
    subjects: ['Mobile Application Development', 'Web Development & Cloud'],
    bio: 'Specialized in React Native, cross-platform apps, and cloud integration. Fluent in English, Sinhala & Tamil.',
    rating: 4.9,
    reviewCount: 38,
    hourlyRate: 2400,
    experience: 'Senior Peer Mentor',
    sessionCount: 31,
    availability: 'Fridays & Weekends',
    experienceYears: '1-2 years',
    languages: ['English', 'Sinhala', 'Tamil'],
    lessonTypes: ['Individual', 'Group'],
  },
  {
    _id: 'mentor-kaveen-2',
    name: 'Kaveen De Silva',
    email: 'kaveen.d@unimentor.lk',
    role: 'mentor',
    subjects: ['Software Architecture & Design', 'Web Development & Cloud'],
    bio: 'Expert in Clean Architecture, Enterprise Design Patterns, and Microservices.',
    rating: 4.8,
    reviewCount: 29,
    hourlyRate: 2600,
    experience: 'Lead Peer Mentor',
    sessionCount: 29,
    availability: 'Weekdays & Evenings',
    experienceYears: '3-5 years',
    languages: ['English', 'Sinhala'],
    lessonTypes: ['Individual'],
  },
  {
    _id: 'mentor-sanduni-3',
    name: 'Sanduni Fernando',
    email: 'sanduni.f@unimentor.lk',
    role: 'mentor',
    subjects: ['Database Management Systems', 'Machine Learning Systems'],
    bio: 'Experienced peer tutor in Database Normalization, ERDs, and ML Data Pipelines.',
    rating: 4.95,
    reviewCount: 44,
    hourlyRate: 2200,
    experience: 'Peer Tutor',
    sessionCount: 35,
    availability: 'Tuesdays & Thursdays',
    experienceYears: '1-2 years',
    languages: ['English', 'Sinhala'],
    lessonTypes: ['Individual', 'Group'],
  },
  {
    _id: 'mentor-asanka-4',
    name: 'Dr. Asanka Perera',
    email: 'asanka.p@unimentor.lk',
    role: 'mentor',
    subjects: ['Probability & Statistics', 'Discrete Mathematics'],
    bio: 'Faculty Academic Mentor with deep expertise in Probability, Combinatorics, and Stats. Fluent in English, Sinhala and Tamil.',
    rating: 5.0,
    reviewCount: 52,
    hourlyRate: 4500,
    experience: 'Faculty Academic Mentor',
    sessionCount: 60,
    availability: 'Weekend Sessions',
    experienceYears: '5+ years',
    languages: ['English', 'Sinhala', 'Tamil'],
    lessonTypes: ['Individual', 'Group'],
  },
];

function matchesModuleOrSubject(subject: string, query: string): boolean {
  const s = subject.toLowerCase().trim();
  const q = query.toLowerCase().trim();
  if (!q || q === 'all') return true;

  if (s.includes(q) || q.includes(s)) return true;

  const acronymMap: Record<string, string[]> = {
    dbms: ['database', 'dbms', 'sql', 'nosql', 'rdbms', 'it2020', 'it2030'],
    database: ['database', 'dbms', 'sql', 'it2020', 'it2030'],
    'database systems': ['database', 'dbms', 'sql', 'it2020'],
    'data structures': ['data structures', 'dsa', 'algorithm', 'algorithms', 'algo', 'graph', 'tree', 'it2040'],
    dsa: ['data structures', 'algorithm', 'algorithms', 'dsa', 'it2040'],
    algo: ['data structures', 'algorithm', 'algorithms', 'dsa'],
    algorithms: ['data structures', 'algorithm', 'algorithms', 'dsa'],
    mobile: ['mobile', 'react native', 'android', 'ios', 'it3020'],
    'mobile app': ['mobile', 'react native', 'android', 'ios', 'it3020'],
    'mobile app dev': ['mobile', 'react native', 'android', 'ios', 'it3020'],
    'mobile application development': ['mobile', 'react native', 'android', 'ios', 'it3020'],
    se: ['software architecture', 'software engineering', 'design patterns', 'se3020'],
    'software engineering': ['software architecture', 'software engineering', 'se3020'],
    'software architecture': ['software architecture', 'enterprise design', 'design patterns', 'se3020'],
    oop: ['object oriented', 'oop', 'java', 'c++', 'python'],
    ml: ['machine learning', 'ai', 'data science', 'artificial intelligence'],
    'machine learning': ['machine learning', 'ai', 'data science', 'artificial intelligence'],
    ai: ['artificial intelligence', 'ai', 'machine learning', 'ml'],
    web: ['web', 'frontend', 'backend', 'cloud', 'full stack'],
    'web development': ['web', 'frontend', 'backend', 'cloud', 'full stack'],
    math: ['probability', 'statistics', 'stats', 'mathematics', 'maths', 'math', 'ma2010', 'discrete'],
    maths: ['probability', 'statistics', 'stats', 'mathematics', 'maths', 'math', 'ma2010', 'discrete'],
    mathematics: ['probability', 'statistics', 'stats', 'mathematics', 'maths', 'math', 'ma2010', 'discrete'],
    'probability & stats': ['probability', 'statistics', 'stats', 'ma2010', 'discrete', 'mathematics', 'maths', 'math'],
    stats: ['probability', 'statistics', 'stats', 'ma2010', 'mathematics'],
    statistics: ['probability', 'statistics', 'stats', 'ma2010', 'mathematics'],
    networks: ['network', 'networks', 'security', 'cisco'],
  };

  for (const [key, variants] of Object.entries(acronymMap)) {
    if (q === key || q.includes(key)) {
      if (variants.some((v) => s.includes(v))) return true;
    }
    if (s === key || s.includes(key)) {
      if (variants.some((v) => q.includes(v))) return true;
    }
  }

  const qTokens = q.split(/\s+/).filter((t) => t.length > 2);
  if (qTokens.length > 0 && qTokens.some((t) => s.includes(t))) {
    return true;
  }

  return false;
}

function matchesMentor(mentor: MentorCard, value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === 'all') return true;

  const name = (mentor.name || '').toLowerCase();
  const bio = (mentor.bio || '').toLowerCase();
  const exp = (mentor.experience || '').toLowerCase();
  const email = (mentor.email || '').toLowerCase();

  if (name.includes(normalized)) return true;
  if (bio.includes(normalized)) return true;
  if (exp.includes(normalized)) return true;
  if (email.includes(normalized)) return true;

  if (Array.isArray(mentor.subjects)) {
    if (mentor.subjects.some((sub) => matchesModuleOrSubject(sub, normalized))) {
      return true;
    }
  }

  const tokens = normalized.split(/\s+/).filter((t) => t.length > 1);
  if (tokens.length > 1) {
    const allTokensMatch = tokens.every((token) => {
      if (name.includes(token)) return true;
      if (bio.includes(token)) return true;
      if (exp.includes(token)) return true;
      if (Array.isArray(mentor.subjects)) {
        return mentor.subjects.some((sub) => matchesModuleOrSubject(sub, token));
      }
      return false;
    });
    if (allTokensMatch) return true;
  }

  return false;
}

function matchesSubjectChip(mentor: MentorCard, subject: string): boolean {
  if (!subject || subject === 'All') return true;
  if (Array.isArray(mentor.subjects)) {
    return mentor.subjects.some((sub) => matchesModuleOrSubject(sub, subject));
  }
  return false;
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

export function matchesFilters(mentor: MentorCard, filters?: TutorFilters): boolean {
  if (!filters) return true;

  // 1. Min Rating
  if (filters.minRating && (mentor.rating ?? 0) < filters.minRating) {
    return false;
  }

  // 2. Price Range
  if (filters.priceRange) {
    const rate = getMentorRate(mentor);
    if (filters.priceRange === '500-3000') {
      if (rate < 500 || rate > 3000) return false;
    } else if (filters.priceRange === '3000-5000') {
      if (rate < 3000 || rate > 5000) return false;
    }
  }

  // 3. Teaching Experience
  if (filters.experience) {
    const target = filters.experience;
    const expYears = mentor.experienceYears;
    const expText = (mentor.experience || '').toLowerCase();
    const sessions = mentor.sessionCount || 0;

    if (target === '1-2 years') {
      const match =
        expYears === '1-2 years' ||
        expText.includes('1-2') ||
        expText.includes('peer tutor') ||
        expText.includes('junior') ||
        (sessions < 30 && !expText.includes('senior') && !expText.includes('faculty') && !expText.includes('lead'));
      if (!match) return false;
    } else if (target === '3-5 years') {
      const match =
        expYears === '3-5 years' ||
        expText.includes('3-5') ||
        expText.includes('senior') ||
        expText.includes('lead') ||
        (sessions >= 20 && sessions <= 50 && !expText.includes('faculty'));
      if (!match) return false;
    } else if (target === '5+ years') {
      const match =
        expYears === '5+ years' ||
        expText.includes('5+') ||
        expText.includes('faculty') ||
        expText.includes('lecturer') ||
        expText.includes('dr.') ||
        sessions > 50;
      if (!match) return false;
    }
  }

  // 4. Preferred Language
  if (filters.language) {
    const target = filters.language.toLowerCase();
    const langs = mentor.languages || ['English', 'Sinhala'];
    const bio = (mentor.bio || '').toLowerCase();
    const match = langs.some((l) => l.toLowerCase() === target) || bio.includes(target);
    if (!match) return false;
  }

  // 5. Lesson Type
  if (filters.lessonType) {
    const types = mentor.lessonTypes || ['Individual', 'Group'];
    if (!types.includes(filters.lessonType)) {
      return false;
    }
  }

  return true;
}

export default function SearchScreen({ route, navigation }: Props) {
  const listRef = useScrollToTopOnFocus<FlatList>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const initialQuery = route.params?.initialQuery ?? '';
  const faculty = route.params?.faculty;
  const department = route.params?.department;
  const programme = route.params?.programme;
  const academicYear = route.params?.academicYear;
  const semester = route.params?.semester;
  const topic = route.params?.topic;

  // Filter state for overlay bottom sheet
  const [activeFilters, setActiveFilters] = useState<TutorFilters>(route.params?.filters ?? {});
  const [draftFilters, setDraftFilters] = useState<TutorFilters>(route.params?.filters ?? {});
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);

  useEffect(() => {
    if (route.params?.filters) {
      setActiveFilters(route.params.filters);
      setDraftFilters(route.params.filters);
    }
  }, [route.params?.filters]);

  const activeFilterCount = useMemo(() => countTutorFilters(activeFilters), [activeFilters]);
  const draftFilterCount = useMemo(() => countTutorFilters(draftFilters), [draftFilters]);
  const [query, setQuery] = useState(initialQuery);
  const [selectedSubject, setSelectedSubject] = useState(initialQuery || 'All');
  const [apiMentors, setApiMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [mentorSettingsMap, setMentorSettingsMap] = useState<Record<string, TutorBookingSettings>>({});

  useEffect(() => {
    tutorSettingsRepository.getAllMentorSettings().then((map) => {
      setMentorSettingsMap(map);
    }).catch(() => {});
    const unsub = tutorSettingsRepository.subscribe((map) => {
      setMentorSettingsMap(map);
    });
    return unsub;
  }, []);

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

  // Booking Modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingTargetMentor, setBookingTargetMentor] = useState<MentorCard | null>(null);
  const [bookingSubject, setBookingSubject] = useState('');
  const [bookingSlot, setBookingSlot] = useState('Tomorrow 10:00 AM');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  const handleOpenBookingModal = (mentor: MentorCard) => {
    (navigation as any).navigate('BookSession', {
      mentor,
      initialMode: '1-on-1',
    });
  };

  const handleConfirmBooking = async () => {
    if (!bookingTargetMentor) return;
    try {
      setIsSubmittingBooking(true);
      const rate = getMentorRate(bookingTargetMentor);
      const codeMatch = bookingSubject.match(/^[A-Z]{2,4}\s?[0-9]{4}/i);
      const moduleCode = codeMatch ? codeMatch[0].toUpperCase() : bookingSubject.substring(0, 6).toUpperCase();

      await bookedTutorsRepository.addBookedTutor({
        id: `booking-${Date.now()}-${bookingTargetMentor._id}`,
        mentor: {
          id: bookingTargetMentor._id,
          name: bookingTargetMentor.name,
          roleTitle: bookingTargetMentor.experience || 'Peer Mentor',
          avatar: bookingTargetMentor.profilePicture,
          rating: bookingTargetMentor.rating || 4.9,
          reviewCount: bookingTargetMentor.reviewCount || 25,
          hourlyRate: rate,
          subjects: bookingTargetMentor.subjects,
        },
        moduleCode: moduleCode || 'TUTOR',
        moduleName: bookingSubject,
        nextSession: 'Tomorrow • 10:00 AM',
        studyMode: '1-on-1',
        bookedAt: new Date().toISOString(),
      });

      try {
        await sessionRepository.bookSession({
          mentorId: bookingTargetMentor._id,
          subject: bookingSubject,
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          notes: bookingNotes.trim() || `Booked session for ${bookingSubject} with ${bookingTargetMentor.name}`,
        });
      } catch (e) {
        console.log('[SearchScreen] API booking sync notice:', e);
      }

      setShowBookingModal(false);
      Alert.alert(
        'Session Booked',
        `Your tutoring session with ${bookingTargetMentor.name} for ${bookingSubject} has been confirmed.`,
        [
          {
            text: 'View in My Bookings',
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                (navigation as any).navigate('SessionsList');
              }
            },
          },
          { text: 'Done', style: 'cancel' },
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err?.message || 'Could not schedule session. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

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
    setSelectedSubject(initialQuery.trim() ? initialQuery : 'All');
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

  const mergedMentors = useMemo(() => {
    const map = new Map<string, MentorCard>();
    const apiLookup = new Map<string, Mentor>();
    apiMentors.forEach((m) => {
      if (m.email) apiLookup.set(m.email.toLowerCase().trim(), m);
      if (m.name) apiLookup.set(m.name.toLowerCase().trim(), m);
    });

    BASE_DEFAULT_MENTORS.forEach((m) => {
      const matchedApi =
        (m.email ? apiLookup.get(m.email.toLowerCase().trim()) : undefined) ||
        (m.name ? apiLookup.get(m.name.toLowerCase().trim()) : undefined);

      if (matchedApi) {
        map.set(matchedApi._id, {
          ...m,
          ...(matchedApi as MentorCard),
          _id: matchedApi._id,
        });
      } else {
        map.set(m._id, m);
      }
    });

    apiMentors.forEach((m) => {
      if (!map.has(m._id)) {
        map.set(m._id, m as MentorCard);
      }
    });

    const list = Array.from(map.values());

    return list.map((mentor) => {
      const settings =
        mentorSettingsMap[mentor._id] ||
        Object.values(mentorSettingsMap).find(
          (s) => s.mentorName.toLowerCase() === mentor.name.toLowerCase()
        );

      const baseExp = (mentor as MentorCard).experienceYears || (
        (mentor.experience && mentor.experience.toLowerCase().includes('faculty')) || (mentor.sessionCount && mentor.sessionCount > 50)
          ? '5+ years'
          : (mentor.sessionCount && mentor.sessionCount > 20) || (mentor.experience && mentor.experience.toLowerCase().includes('senior'))
          ? '3-5 years'
          : '1-2 years'
      );
      const baseLangs = (mentor as MentorCard).languages || (
        mentor.bio?.toLowerCase().includes('tamil')
          ? ['English', 'Sinhala', 'Tamil']
          : ['English', 'Sinhala']
      );
      const baseLessonTypes = (mentor as MentorCard).lessonTypes || ['Individual', 'Group'];

      if (settings) {
        return {
          ...mentor,
          subjects:
            settings.teachingModules && settings.teachingModules.length > 0
              ? settings.teachingModules
              : mentor.subjects,
          profilePicture: settings.profileImage || mentor.profilePicture,
          hourlyRate: settings.hourlyRate1on1 || mentor.hourlyRate,
          experienceYears: baseExp,
          languages: baseLangs,
          lessonTypes: baseLessonTypes,
        };
      }
      return {
        ...mentor,
        experienceYears: baseExp,
        languages: baseLangs,
        lessonTypes: baseLessonTypes,
      };
    });
  }, [apiMentors, mentorSettingsMap]);

  useEffect(() => {
    setComparisonIds((current) => current.filter((id) => mergedMentors.some((mentor) => mentor._id === id)));
  }, [mergedMentors]);

  const visibleMentors = useMemo(() => {
    const q = query.trim();
    let matches = mergedMentors;

    if (selectedSubject && selectedSubject !== 'All') {
      matches = matches.filter((mentor) => matchesSubjectChip(mentor, selectedSubject));
    }

    if (q) {
      matches = matches.filter((mentor) => matchesMentor(mentor, q));
    }

    return matches.filter((mentor) => matchesFilters(mentor, activeFilters));
  }, [mergedMentors, activeFilters, query, selectedSubject]);

  const previewMatchCount = useMemo(() => {
    const q = query.trim();
    let matches = mergedMentors;

    if (selectedSubject && selectedSubject !== 'All') {
      matches = matches.filter((mentor) => matchesSubjectChip(mentor, selectedSubject));
    }

    if (q) {
      matches = matches.filter((mentor) => matchesMentor(mentor, q));
    }

    return matches.filter((mentor) => matchesFilters(mentor, draftFilters)).length;
  }, [mergedMentors, draftFilters, query, selectedSubject]);

  const subjectChips = useMemo(() => {
    const standard = [
      'All',
      'Data Structures',
      'Database Systems',
      'Mobile App Dev',
      'Software Architecture',
      'OOP',
      'Machine Learning',
      'Web Development',
      'Probability & Stats',
    ];
    const custom: string[] = [];
    Object.values(mentorSettingsMap).forEach((s) => {
      (s.teachingModules || []).forEach((mod) => {
        if (
          !standard.some((st) => matchesModuleOrSubject(st, mod)) &&
          !custom.includes(mod)
        ) {
          custom.push(mod);
        }
      });
    });
    const chips = [...standard, ...custom];
    const incoming = initialQuery.trim();
    if (
      incoming &&
      incoming !== 'All' &&
      !chips.some((chip) => chip.toLowerCase() === incoming.toLowerCase())
    ) {
      chips.splice(1, 0, incoming);
    }
    return chips;
  }, [mentorSettingsMap, initialQuery]);

  const handleSearch = async (searchValue?: string) => {
    Keyboard.dismiss();
    const value = (typeof searchValue === 'string' ? searchValue : query).trim();
    setQuery(value);
    setLoading(true);
    try {
      const results = await searchMentorsUseCase(value === 'All' ? '' : value);
      if (Array.isArray(results) && results.length > 0) {
        setApiMentors((prev) => {
          const map = new Map<string, Mentor>();
          prev.forEach((m) => map.set(m._id, m));
          results.forEach((m) => map.set(m._id, m));
          return Array.from(map.values());
        });
      }
    } catch (err: any) {
      console.warn(`[SearchScreen] ⚠️ Search notice:`, err?.message || err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    Keyboard.dismiss();
    setQuery('');
    setSelectedSubject('All');
  };

  const selectSubject = (subject: string) => {
    setSelectedSubject(subject);
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
    // Specifically return to My Bookings page as requested
    try {
      (navigation as any).navigate('SessionsList');
    } catch {
      const parent = (navigation.getParent?.() as any) || (navigation as any);
      parent?.navigate('Bookings', { screen: 'SessionsList' });
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const openComparison = () => {
    const mentors = visibleMentors.filter(({ _id }) => comparisonIds.includes(_id));
    if (mentors.length < 2) {
      Alert.alert('Select tutors', 'Choose at least 2 tutors to compare.');
      return;
    }
    navigation.navigate('CompareTutors', { mentors });
  };

  const renderMentor = ({ item }: { item: MentorCard }) => {
    const rate = getMentorRate(item);
    const isShortlisted = shortlist.some((s) => s.mentorId === item._id);

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <TutorAvatar
            name={item.name}
            imageUrl={item.profilePicture}
            size={46}
            borderRadius={23}
            showOnlineDot
          />
          <View style={styles.mentorMain}>
            <Text style={styles.mentorName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.experience}>{item.experience ?? 'Verified senior student mentor'}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" style={{ marginRight: 3 }} />
              <Text style={styles.rating}>{item.rating?.toFixed(1) ?? 'New'}</Text>
              <Text style={styles.sessions}>  ·  {item.sessionCount ?? 0}+ sessions</Text>
            </View>
          </View>
          <View style={styles.matchBadge}><Text style={styles.matchText}>Verified</Text></View>
        </View>

        <View style={styles.subjectRow}>
          {(item.subjects || []).slice(0, 4).map((subject) => (
            <View key={subject} style={styles.subjectTag}>
              <Text style={styles.subjectTagText}>{subject}</Text>
            </View>
          ))}
        </View>

        <View style={styles.tutorCardFooter}>
          <View style={styles.priceRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>HOURLY RATE</Text>
              <Text style={styles.priceText}>
                LKR {rate.toLocaleString()} <Text style={styles.priceUnit}>/ hour</Text>
              </Text>
            </View>
            <View style={styles.availabilityBadge}>
              <Text style={styles.availableText}>● {item.availability ?? 'Schedule available'}</Text>
            </View>
          </View>

          {/* 2 Column x 2 Row Action Buttons Grid */}
          <View style={styles.buttonGrid2x2}>
            {/* Row 1: Book & Profile */}
            <View style={styles.gridRow}>
              <TouchableOpacity
                style={styles.gridBookBtn}
                onPress={() => handleOpenBookingModal(item)}
                activeOpacity={0.82}
              >
                <Ionicons name="calendar" size={14} color="#061E47" style={{ marginRight: 5 }} />
                <Text style={styles.gridBookBtnText}>Book</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.gridProfileBtn}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('TutorProfile', { mentor: item })}
              >
                <Ionicons name="person-outline" size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={styles.gridProfileBtnText}>Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Row 2: Compare & Save */}
            <View style={styles.gridRow}>
              <TouchableOpacity
                style={[
                  styles.gridCompareBtn,
                  comparisonIds.includes(item._id) && styles.gridCompareBtnSelected,
                ]}
                onPress={() => toggleComparison(item._id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={comparisonIds.includes(item._id) ? 'checkmark-circle' : 'git-compare-outline'}
                  size={14}
                  color={comparisonIds.includes(item._id) ? '#FFFFFF' : '#061E47'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.gridCompareBtnText,
                    comparisonIds.includes(item._id) && styles.gridCompareBtnTextSelected,
                  ]}
                >
                  {comparisonIds.includes(item._id) ? 'Comparing' : 'Compare'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.gridSaveBtn,
                  isShortlisted && styles.gridSaveBtnActive,
                ]}
                onPress={() => openSaveModal(item)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isShortlisted ? 'bookmark' : 'bookmark-outline'}
                  size={14}
                  color={isShortlisted ? '#B45309' : '#0F172A'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.gridSaveBtnText,
                    isShortlisted && styles.gridSaveBtnTextActive,
                  ]}
                >
                  {isShortlisted ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
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
          <TutorAvatar
            name={item.name}
            imageUrl={item.avatar}
            size={46}
            borderRadius={23}
            showOnlineDot
          />
          <View style={styles.mentorMain}>
            <View style={styles.shortlistNameRow}>
              <Text style={styles.mentorName} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.priorityBadge, { backgroundColor: priorityBg }]}>
                <Text style={[styles.priorityBadgeText, { color: priorityColor }]}>{item.priority}</Text>
              </View>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#F59E0B" style={{ marginRight: 3 }} />
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
              style={styles.bookButton}
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
                handleOpenBookingModal(fullMentor as MentorCard);
              }}
              activeOpacity={0.82}
            >
              <Ionicons name="calendar" size={13} color="#061E47" style={{ marginRight: 4 }} />
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editNotesBtn}
              onPress={() => openEditShortlistModal(item)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="create-outline" size={14} color="#0D4F9E" />
                <Text style={styles.editNotesBtnText}>Edit Notes</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => handleRemoveFromShortlist(item.mentorId, item.name)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={styles.removeBtnText}>Remove</Text>
              </View>
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
              navigation.navigate('TutorProfile', { mentor: fullMentor as Mentor });
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
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Find Your Mentor</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <FlatList
        ref={listRef}
        keyboardShouldPersistTaps="handled"
        data={searchTab === 'browse' ? visibleMentors : (shortlist as any)}
        keyExtractor={(item: any) => item._id || item.mentorId}
        renderItem={searchTab === 'browse' ? (renderMentor as any) : (renderShortlistCard as any)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, comparisonIds.length > 0 && styles.listContentWithCompare]}
        ListHeaderComponent={
          <>
            <View style={styles.belowHeaderSection}>
              <Text style={styles.belowHeaderSubtitle}>
                Choose a verified peer tutor for your university module
              </Text>

              <View style={styles.searchBox}>
                <Ionicons name="search" size={17} color="#8492AD" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  placeholder="Search module, tutor name, or topic..."
                  placeholderTextColor="#8492AD"
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={() => void handleSearch()}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearSearchBtn}
                    onPress={handleClearSearch}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.searchButton, loading && styles.searchButtonLoading]}
                  onPress={() => void handleSearch()}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.searchButtonText}>Search</Text>
                  )}
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons
                      name="star"
                      size={13}
                      color={searchTab === 'shortlist' ? '#FFFFFF' : '#F59E0B'}
                    />
                    <Text style={[styles.tabSwitchText, searchTab === 'shortlist' && styles.tabSwitchTextActive]}>
                      My Shortlist ({shortlist.length})
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {searchTab === 'browse' ? (
          <>
            <View style={styles.filterHeadingRow}>
              <Text style={styles.browseLabel}>Filter by module</Text>
              <TouchableOpacity
                style={[styles.openFiltersButton, activeFilterCount > 0 && styles.openFiltersButtonActive]}
                onPress={() => {
                  setDraftFilters({ ...activeFilters });
                  setShowFilterOverlay(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="options-outline"
                  size={15}
                  color={activeFilterCount > 0 ? '#FFFFFF' : '#0B2754'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.openFiltersText, activeFilterCount > 0 && styles.openFiltersTextActive]}>Filters</Text>
                {activeFilterCount > 0 && (
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {subjectChips.map((subject) => {
                const active = selectedSubject === subject;
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

            {/* Active Filters Quick Strip */}
            {activeFilterCount > 0 && (
              <View style={styles.activeFiltersBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
                  <Text style={styles.activeFiltersTitle}>Active:</Text>
                  {activeFilters.priceRange && (
                    <TouchableOpacity
                      style={styles.activeFilterTag}
                      onPress={() => setActiveFilters((prev) => ({ ...prev, priceRange: undefined }))}
                    >
                      <Text style={styles.activeFilterTagText}>
                        LKR {activeFilters.priceRange === '500-3000' ? '500–3K' : '3K–5K'}
                      </Text>
                      <Ionicons name="close" size={12} color="#061E47" />
                    </TouchableOpacity>
                  )}
                  {activeFilters.minRating && (
                    <TouchableOpacity
                      style={styles.activeFilterTag}
                      onPress={() => setActiveFilters((prev) => ({ ...prev, minRating: undefined }))}
                    >
                      <Text style={styles.activeFilterTagText}>★ {activeFilters.minRating}+</Text>
                      <Ionicons name="close" size={12} color="#061E47" />
                    </TouchableOpacity>
                  )}
                  {activeFilters.experience && (
                    <TouchableOpacity
                      style={styles.activeFilterTag}
                      onPress={() => setActiveFilters((prev) => ({ ...prev, experience: undefined }))}
                    >
                      <Text style={styles.activeFilterTagText}>{activeFilters.experience}</Text>
                      <Ionicons name="close" size={12} color="#061E47" />
                    </TouchableOpacity>
                  )}
                  {activeFilters.lessonType && (
                    <TouchableOpacity
                      style={styles.activeFilterTag}
                      onPress={() => setActiveFilters((prev) => ({ ...prev, lessonType: undefined }))}
                    >
                      <Text style={styles.activeFilterTagText}>{activeFilters.lessonType}</Text>
                      <Ionicons name="close" size={12} color="#061E47" />
                    </TouchableOpacity>
                  )}
                  {activeFilters.language && (
                    <TouchableOpacity
                      style={styles.activeFilterTag}
                      onPress={() => setActiveFilters((prev) => ({ ...prev, language: undefined }))}
                    >
                      <Text style={styles.activeFilterTagText}>{activeFilters.language}</Text>
                      <Ionicons name="close" size={12} color="#061E47" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.clearAllFilterLink}
                    onPress={() => {
                      setActiveFilters({});
                      setDraftFilters({});
                    }}
                  >
                    <Text style={styles.clearAllFilterText}>Clear All</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.compareCount}>{comparisonIds.length}/3</Text>
                    <TouchableOpacity
                      style={styles.headerClearBtn}
                      onPress={() => setComparisonIds([])}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={13} color="#DC2626" />
                      <Text style={styles.headerClearBtnText}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.compareHint}>tutors selected</Text>
                </View>
                <TouchableOpacity
                  style={[styles.compareButton, comparisonIds.length < 2 && styles.compareButtonDisabled]}
                  onPress={openComparison}
                  activeOpacity={0.84}
                >
                  <Text style={styles.compareButtonText}>Compare Tutors</Text>
                  <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
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
      </>
    }
    ListEmptyComponent={(
          <View style={styles.emptyCard}>
            <Ionicons
              name={
                searchTab === 'browse'
                  ? activeFilterCount > 0
                    ? 'filter-outline'
                    : 'search-outline'
                  : 'star-outline'
              }
              size={44}
              color="#94A3B8"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.emptyTitle}>
              {searchTab === 'browse'
                ? activeFilterCount > 0
                  ? 'No tutors match your active filters'
                  : 'No mentors found'
                : 'Your Shortlist is Empty'}
            </Text>
            <Text style={styles.emptyText}>
              {searchTab === 'browse'
                ? activeFilterCount > 0
                  ? 'Try relaxing one or more filter requirements to view more verified tutors.'
                  : 'Try another subject or search term.'
                : 'Browse tutors in "All Tutors" and tap "☆ Save" to create your personal shortlist with custom notes and priorities.'}
            </Text>
            {searchTab === 'browse' && query.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.resetFiltersBtn, { marginTop: 10, borderColor: '#CBD5E1' }]}
                onPress={handleClearSearch}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={14} color="#061E47" style={{ marginRight: 6 }} />
                <Text style={styles.resetFiltersBtnText}>Clear Search "{query.trim()}"</Text>
              </TouchableOpacity>
            )}
            {searchTab === 'browse' && activeFilterCount > 0 && (
              <TouchableOpacity
                style={styles.resetFiltersBtn}
                onPress={() => {
                  setActiveFilters({});
                  setDraftFilters({});
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh-outline" size={14} color="#061E47" style={{ marginRight: 6 }} />
                <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
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
                    <Ionicons
                      name={p === 'Top Choice' ? 'trophy' : p === 'Considering' ? 'bookmark' : 'shield-checkmark'}
                      size={13}
                      color={active ? '#FFFFFF' : '#0B2754'}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.priorityOptionText, active && styles.priorityOptionTextActive]}>
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
          <View style={styles.floatingCompareInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.floatingCompareCount}>{comparisonIds.length}/3 selected</Text>
              <TouchableOpacity
                style={styles.floatingClearBtn}
                onPress={() => setComparisonIds([])}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={14} color="#FCA5A5" />
                <Text style={styles.floatingClearText}>Clear</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.floatingCompareHint}>
              {comparisonIds.length < 2 ? 'Select 1 more tutor or tap Clear' : 'Ready to compare'}
            </Text>

            {/* Individual chips with remove (X) */}
            <View style={styles.selectedChipsRow}>
              {comparisonIds.map((id) => {
                const mentorObj = apiMentors.find((m) => m._id === id);
                const tutorName = mentorObj?.name ? mentorObj.name.split(' ')[0] : 'Tutor';
                return (
                  <TouchableOpacity
                    key={id}
                    style={styles.selectedChip}
                    onPress={() => toggleComparison(id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectedChipText} numberOfLines={1}>{tutorName}</Text>
                    <Ionicons name="close" size={11} color="#061E47" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.floatingCompareButton, comparisonIds.length < 2 && styles.compareButtonDisabled]}
            onPress={openComparison}
            activeOpacity={0.84}
          >
            <Text style={styles.floatingCompareText}>Compare Tutors</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* ================= BOOKING MODAL ================= */}
      <Modal
        visible={showBookingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowBookingModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Book Tutoring Session</Text>
            <Text style={styles.sheetSubtitle}>
              Schedule a 1-on-1 peer learning session with your verified tutor
            </Text>

            {bookingTargetMentor && (
              <View style={styles.bookingMentorCard}>
                <View style={styles.bookingAvatarWrap}>
                  <Text style={styles.avatarText}>
                    {bookingTargetMentor.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingMentorName}>{bookingTargetMentor.name}</Text>
                  <Text style={styles.bookingMentorRate}>
                    LKR {getMentorRate(bookingTargetMentor).toLocaleString()} / hour • ★ {bookingTargetMentor.rating?.toFixed(1) || '4.9'}
                  </Text>
                </View>
              </View>
            )}

            {/* Subject Selection */}
            <Text style={styles.modalLabel}>Select Subject / Topic:</Text>
            <View style={styles.bookingChipsRow}>
              {(bookingTargetMentor?.subjects?.length ? bookingTargetMentor.subjects : ['Academic Guidance', 'Module Revision']).map(
                (sub) => (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.bookingChip, bookingSubject === sub && styles.bookingChipActive]}
                    onPress={() => setBookingSubject(sub)}
                  >
                    <Text
                      style={[
                        styles.bookingChipText,
                        bookingSubject === sub && styles.bookingChipTextActive,
                      ]}
                    >
                      {sub}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            {/* Preferred Time Slot */}
            <Text style={styles.modalLabel}>Preferred Time Slot:</Text>
            <View style={styles.bookingChipsRow}>
              {[
                'Tomorrow 10:00 AM',
                'Tomorrow 3:30 PM',
                'In 2 Days 11:00 AM',
                'In 3 Days 4:00 PM',
              ].map((slot) => (
                <TouchableOpacity
                  key={slot}
                  style={[styles.bookingChip, bookingSlot === slot && styles.bookingChipActive]}
                  onPress={() => setBookingSlot(slot)}
                >
                  <Text
                    style={[
                      styles.bookingChipText,
                      bookingSlot === slot && styles.bookingChipTextActive,
                    ]}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Session Goals Notes */}
            <Text style={styles.modalLabel}>Session Goals / Questions (Optional):</Text>
            <TextInput
              style={styles.modalNotesInput}
              value={bookingNotes}
              onChangeText={setBookingNotes}
              placeholder="e.g. Need assistance with graph traversal past papers and Assignment 2..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.confirmBookingBtn, isSubmittingBooking && { opacity: 0.7 }]}
              onPress={handleConfirmBooking}
              disabled={isSubmittingBooking}
              activeOpacity={0.85}
            >
              {isSubmittingBooking ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <Text style={styles.confirmBookingText}>Scheduling Session...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="calendar" size={16} color="#061E47" />
                  <Text style={styles.confirmBookingText}>Confirm & Book Session</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setShowBookingModal(false)}
            >
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= FILTER OVERLAY MODAL ================= */}
      <Modal
        visible={showFilterOverlay}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterOverlay(false)}
      >
        <Pressable
          style={styles.filterModalOverlay}
          onPress={() => setShowFilterOverlay(false)}
        >
          <Pressable
            style={[styles.filterSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Header */}
            <View style={styles.filterSheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterSheetTitle}>Filter Tutors</Text>
                <Text style={styles.filterSheetSubtitle}>
                  Refine tutors in Find Your Mentor
                </Text>
              </View>
              {draftFilterCount > 0 && (
                <TouchableOpacity
                  style={styles.filterResetBtn}
                  onPress={() => setDraftFilters({})}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterResetBtnText}>Reset All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Scrollable Filter Categories */}
            <ScrollView
              style={styles.filterScrollBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* 1. Price Range */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <View style={styles.filterSectionIconWrap}>
                    <Ionicons name="cash-outline" size={15} color="#D97706" />
                  </View>
                  <Text style={styles.filterSectionTitle}>Hourly Rate (LKR)</Text>
                </View>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { label: 'LKR 500 – 3,000', value: '500-3000' as const },
                    { label: 'LKR 3,000 – 5,000', value: '3000-5000' as const },
                  ].map((opt) => {
                    const active = draftFilters.priceRange === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                        onPress={() =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            priceRange: active ? undefined : opt.value,
                          }))
                        }
                        activeOpacity={0.8}
                      >
                        {active && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Minimum Rating */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <View style={styles.filterSectionIconWrap}>
                    <Ionicons name="star" size={15} color="#D97706" />
                  </View>
                  <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                </View>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { label: '4.5+ ★', value: 4.5 as const },
                    { label: '4.0+ ★', value: 4.0 as const },
                    { label: '3.5+ ★', value: 3.5 as const },
                  ].map((opt) => {
                    const active = draftFilters.minRating === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                        onPress={() =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            minRating: active ? undefined : opt.value,
                          }))
                        }
                        activeOpacity={0.8}
                      >
                        {active && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 3. Teaching Experience */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <View style={styles.filterSectionIconWrap}>
                    <Ionicons name="briefcase-outline" size={15} color="#D97706" />
                  </View>
                  <Text style={styles.filterSectionTitle}>Teaching Experience</Text>
                </View>
                <View style={styles.filterOptionsGrid}>
                  {(['1-2 years', '3-5 years', '5+ years'] as const).map((exp) => {
                    const active = draftFilters.experience === exp;
                    return (
                      <TouchableOpacity
                        key={exp}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                        onPress={() =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            experience: active ? undefined : exp,
                          }))
                        }
                        activeOpacity={0.8}
                      >
                        {active && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                          {exp}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 4. Lesson Type */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <View style={styles.filterSectionIconWrap}>
                    <Ionicons name="people-outline" size={15} color="#D97706" />
                  </View>
                  <Text style={styles.filterSectionTitle}>Lesson Type</Text>
                </View>
                <View style={styles.filterOptionsGrid}>
                  {[
                    { label: 'Individual (1-on-1)', value: 'Individual' as const },
                    { label: 'Group (Study Pod)', value: 'Group' as const },
                  ].map((lt) => {
                    const active = draftFilters.lessonType === lt.value;
                    return (
                      <TouchableOpacity
                        key={lt.value}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                        onPress={() =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            lessonType: active ? undefined : lt.value,
                          }))
                        }
                        activeOpacity={0.8}
                      >
                        {active && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                          {lt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 5. Preferred Language */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <View style={styles.filterSectionIconWrap}>
                    <Ionicons name="language-outline" size={15} color="#D97706" />
                  </View>
                  <Text style={styles.filterSectionTitle}>Preferred Language</Text>
                </View>
                <View style={styles.filterOptionsGrid}>
                  {(['English', 'Sinhala', 'Tamil'] as const).map((lang) => {
                    const active = draftFilters.language === lang;
                    return (
                      <TouchableOpacity
                        key={lang}
                        style={[styles.filterPill, active && styles.filterPillActive]}
                        onPress={() =>
                          setDraftFilters((prev) => ({
                            ...prev,
                            language: active ? undefined : lang,
                          }))
                        }
                        activeOpacity={0.8}
                      >
                        {active && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        )}
                        <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                          {lang}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.filterSheetFooter}>
              <TouchableOpacity
                style={styles.filterCancelBtn}
                onPress={() => setShowFilterOverlay(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterApplyBtn}
                onPress={() => {
                  setActiveFilters({ ...draftFilters });
                  setShowFilterOverlay(false);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="funnel" size={15} color="#061E47" style={{ marginRight: 6 }} />
                <Text style={styles.filterApplyBtnText}>
                  Apply Filters {previewMatchCount > 0 ? `(${previewMatchCount})` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const navy = '#061E47';
const navyCard = '#0B2754';
const amber = '#FBBF24';
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
  belowHeaderSection: {
    marginBottom: 14,
  },
  belowHeaderSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  searchBox: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#001433',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  searchIcon: { color: navy, fontSize: 25, fontWeight: '800', marginRight: 7, marginTop: -3 },
  input: { flex: 1, color: '#253654', fontSize: 13.5, paddingVertical: 0 },
  clearSearchBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: { height: 38, borderRadius: 10, backgroundColor: amber, justifyContent: 'center', paddingHorizontal: 16, marginRight: 5 },
  searchButtonLoading: { opacity: 0.85 },
  searchButtonText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  listContent: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },
  listContentWithCompare: { paddingBottom: 20 },
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
  viewButton: { backgroundColor: amber, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  viewButtonText: { color: '#061E47', fontSize: 12, fontWeight: '800' },
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
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
  },
  tabSwitchBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabSwitchText: {
    color: '#64748B',
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

  /* Header & Book Button Styles */
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBackBtn: { paddingRight: 6, paddingVertical: 2 },
  headerClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  headerClearBtnText: { color: '#DC2626', fontSize: 10, fontWeight: '800' },
  bookButton: {
    minWidth: 70,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FBBF24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  bookButtonText: { color: '#061E47', fontSize: 11, fontWeight: '900' },

  /* Floating Compare Bar Extras */
  floatingCompareInfo: { flex: 1, marginRight: 8 },
  floatingClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  floatingClearText: { color: '#FCA5A5', fontSize: 10, fontWeight: '800' },
  selectedChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 4 },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FBBF24',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selectedChipText: { color: '#061E47', fontSize: 10, fontWeight: '800', maxWidth: 70 },

  /* Booking Modal Styles */
  bookingMentorCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  bookingAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#061E47',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bookingMentorName: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  bookingMentorRate: { color: '#D97706', fontSize: 12, fontWeight: '700', marginTop: 2 },
  bookingChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  bookingChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingChipActive: { backgroundColor: '#061E47', borderColor: '#061E47' },
  bookingChipText: { color: '#475569', fontSize: 11, fontWeight: '700' },
  bookingChipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  confirmBookingBtn: {
    backgroundColor: '#FBBF24',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 6,
  },
  confirmBookingText: { color: '#061E47', fontSize: 14, fontWeight: '800' },

  /* 2 Column x 2 Row Tutor Card Action Buttons */
  tutorCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#ECF0F5',
    marginTop: 14,
    paddingTop: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  availabilityBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  buttonGrid2x2: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridBookBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FBBF24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    shadowColor: '#FBBF24',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  gridBookBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '900',
  },
  gridProfileBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#061E47',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  gridProfileBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  gridCompareBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#061E47',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  gridCompareBtnSelected: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  gridCompareBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  gridCompareBtnTextSelected: {
    color: '#FFFFFF',
  },
  gridSaveBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  gridSaveBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  gridSaveBtnText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '800',
  },
  gridSaveBtnTextActive: {
    color: '#92400E',
    fontWeight: '900',
  },

  /* Active Filters Quick Strip */
  activeFiltersBar: {
    marginBottom: 8,
    marginTop: 4,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
  },
  activeFiltersTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
  },
  activeFilterTagText: {
    color: '#061E47',
    fontSize: 11,
    fontWeight: '800',
  },
  clearAllFilterLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearAllFilterText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBBF24',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 14,
  },
  resetFiltersBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '900',
  },

  /* Filter Modal Overlay */
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6,30,71,0.6)',
    justifyContent: 'flex-end',
  },
  filterSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '88%',
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterSheetTitle: {
    color: navy,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  filterSheetSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  filterResetBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterResetBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  filterScrollBody: {
    maxHeight: 420,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  filterSectionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSectionTitle: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '800',
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  filterPillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  filterSheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  filterCancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '800',
  },
  filterApplyBtn: {
    flex: 2,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FBBF24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FBBF24',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  filterApplyBtnText: {
    color: '#061E47',
    fontSize: 13,
    fontWeight: '900',
  },
});

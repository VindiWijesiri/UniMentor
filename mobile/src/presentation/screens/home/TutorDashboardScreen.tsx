import React, { useState, useEffect } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../domain/stores/authStore';
import { tutorSlotRepository } from '../../../data/repositories/tutorSlotRepository';
import { tutorSettingsRepository } from '../../../data/repositories/tutorSettingsRepository';
import type { TutorSlot, RegisteredAttendee } from '../../../domain/entities/TutorSlot';
import TutorAvatar from '../../components/common/TutorAvatar';
import apiClient from '../../../data/api/apiClient';

const { width } = Dimensions.get('window');

const POPULAR_CURRICULUM_MODULES = [
  'Data Structures & Algorithms',
  'Database Management Systems',
  'Mobile Application Development',
  'Software Architecture & Design',
  'Object Oriented Programming',
  'Web Development & Cloud',
  'Machine Learning Systems',
  'Artificial Intelligence',
  'Operating Systems & System Design',
  'Probability & Statistics',
  'Computer Networks & Security',
  'DevOps & CI/CD',
];

const TIME_OPTIONS = [
  '08:30 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:30 PM',
  '02:30 PM',
  '03:30 PM',
  '04:30 PM',
  '05:30 PM',
  '06:30 PM',
  '07:30 PM',
];

const DURATION_CHOICES = [
  { label: '30 Mins', mins: 30 },
  { label: '45 Mins', mins: 45 },
  { label: '60 Mins', mins: 60 },
  { label: '90 Mins', mins: 90 },
  { label: '120 Mins', mins: 120 },
];

function getUpcomingDatesList(count = 14) {
  const dates = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const fullDay = d.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNum = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const formatted = `${fullDay}, ${dayNum} ${month} ${year}`;
    dates.push({
      formatted,
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : dayName,
      dateLabel: `${dayNum} ${month}`,
      isToday: i === 0,
      isTomorrow: i === 1,
    });
  }
  return dates;
}

function calculateEndTimeFromStart(startTime: string, durationMinutes: number): string {
  const match = startTime.trim().toUpperCase().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (!match) return '03:30 PM';
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3];
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;

  const totalEndMins = (hours * 60 + minutes + durationMinutes) % (24 * 60);
  let endH = Math.floor(totalEndMins / 60);
  const endM = totalEndMins % 60;
  const ampm = endH >= 12 ? 'PM' : 'AM';
  if (endH > 12) endH -= 12;
  if (endH === 0) endH = 12;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${ampm}`;
}

export default function TutorDashboardScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const tutorMentorId = currentUser?._id || (currentUser as any)?.id || 'demo-tutor-1';
  const tutorMentorName = currentUser?.name || 'Tharushi Perera';

  const upcomingDatesList = getUpcomingDatesList(14);

  const [refreshing, setRefreshing] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [livePodModalVisible, setLivePodModalVisible] = useState(false);

  // Verified student photo modal state
  const [selectedVerifiedAttendee, setSelectedVerifiedAttendee] = useState<RegisteredAttendee | null>(null);
  const [verifiedPhotoModalVisible, setVerifiedPhotoModalVisible] = useState(false);

  // Dynamic state for editable schedule
  const [scheduleDays, setScheduleDays] = useState('Monday to Friday');
  const [scheduleHours, setScheduleHours] = useState('3:00 PM - 6:00 PM');

  // Slot management state
  const [tutorSlots, setTutorSlots] = useState<TutorSlot[]>([]);
  const [addSlotModalVisible, setAddSlotModalVisible] = useState(false);
  const [newSlotDate, setNewSlotDate] = useState(upcomingDatesList[0].formatted);
  const [newSlotStartTime, setNewSlotStartTime] = useState('10:00 AM');
  const [newSlotDuration, setNewSlotDuration] = useState(60);
  const [newSlotEndTime, setNewSlotEndTime] = useState('11:00 AM');
  const [newSlotType, setNewSlotType] = useState<'1-on-1' | 'group' | 'both'>('both');
  const [newSlotCapacity, setNewSlotCapacity] = useState('5');
  const [newSlotModule, setNewSlotModule] = useState('Database Management Systems');

  // Tutor Profile Image state
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Offered Modules state (Used by students in Find Your Mentor)
  const [teachingModules, setTeachingModules] = useState<string[]>([
    'Database Management Systems',
    'Data Structures & Algorithms',
  ]);
  const [newModuleInput, setNewModuleInput] = useState('');

  // Pricing and preferences state
  const [rate1on1, setRate1on1] = useState('2500');
  const [rateGroup, setRateGroup] = useState('1200');
  const [subjectPreferences, setSubjectPreferences] = useState<string[]>([
    'Query Optimization',
    'Indexing',
    'ER Diagrams',
    'Normalization',
    'Transactions & ACID',
    'NoSQL & MongoDB',
  ]);
  const [newTopicInput, setNewTopicInput] = useState('');

  // Assessment form state
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentModule, setAssessmentModule] = useState('Data Structures & Algorithms');
  const [assessmentDuration, setAssessmentDuration] = useState('45 Mins');

  useEffect(() => {
    loadTutorSettingsAndSlots();
    const unsub = tutorSlotRepository.subscribe(() => {
      loadTutorSettingsAndSlots();
    });
    return unsub;
  }, [tutorMentorId, tutorMentorName]);

  const loadTutorSettingsAndSlots = async () => {
    try {
      const slots = await tutorSlotRepository.getAllSlots(tutorMentorId, tutorMentorName);
      setTutorSlots(slots);
      const settings = await tutorSettingsRepository.getSettings(
        tutorMentorId,
        tutorMentorName
      );
      setRate1on1(String(settings.hourlyRate1on1));
      setRateGroup(String(settings.hourlyRateGroup));
      setTeachingModules(
        settings.teachingModules && settings.teachingModules.length > 0
          ? settings.teachingModules
          : ['Database Management Systems', 'Data Structures & Algorithms']
      );
      setSubjectPreferences(settings.subjectPreferences);
      setProfileImageUri(settings.profileImage || null);
      if (settings.profileImage) {
        setImageUrlInput(settings.profileImage);
      }
    } catch {
      // Ignore
    }
  };

  const handleToggleCurriculumModule = async (moduleName: string) => {
    const isSelected = teachingModules.some(
      (m) => m.toLowerCase() === moduleName.toLowerCase()
    );
    let updated: string[];
    if (isSelected) {
      if (teachingModules.length <= 1) {
        Alert.alert(
          'At Least 1 Module Required',
          'You must offer at least one module so students can find and book sessions with you in Find Your Mentor.'
        );
        return;
      }
      updated = teachingModules.filter(
        (m) => m.toLowerCase() !== moduleName.toLowerCase()
      );
    } else {
      updated = [...teachingModules, moduleName];
    }
    setTeachingModules(updated);
    await tutorSettingsRepository.updateTeachingModules(tutorMentorId, updated);
    try {
      await apiClient.put('/users/profile', { subjects: updated });
    } catch {}
  };

  const handleAddCustomModule = async () => {
    const trimmed = newModuleInput.trim();
    if (!trimmed) {
      Alert.alert('Module Name Required', 'Please enter a module title or course code.');
      return;
    }
    if (teachingModules.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Already Added', 'This module is already in your offered list.');
      return;
    }
    const updated = [...teachingModules, trimmed];
    setTeachingModules(updated);
    setNewModuleInput('');
    await tutorSettingsRepository.updateTeachingModules(tutorMentorId, updated);
    try {
      await apiClient.put('/users/profile', { subjects: updated });
    } catch {}
    Alert.alert(
      'Module Added',
      `"${trimmed}" added. Students searching for this module in Find Your Mentor will now find your profile.`
    );
  };

  const handleRemoveModule = async (moduleName: string) => {
    if (teachingModules.length <= 1) {
      Alert.alert(
        'At Least 1 Module Required',
        'You must keep at least one module so students can find your profile in Find Your Mentor.'
      );
      return;
    }
    const updated = teachingModules.filter(
      (m) => m.toLowerCase() !== moduleName.toLowerCase()
    );
    setTeachingModules(updated);
    await tutorSettingsRepository.updateTeachingModules(tutorMentorId, updated);
    try {
      await apiClient.put('/users/profile', { subjects: updated });
    } catch {}
  };

  const handleSaveProfileImage = async (url: string | null) => {
    await tutorSettingsRepository.updateProfileImage(
      tutorMentorId,
      url
    );
    setProfileImageUri(url);
    setImageModalVisible(false);
    Alert.alert(
      url ? 'Photo Updated' : 'Initials Avatar Selected',
      url
        ? 'Your tutor profile photo has been updated successfully.'
        : 'You are now displaying your stylish initials avatar.'
    );
  };

  const handleSaveRates = async () => {
    const r1 = parseInt(rate1on1, 10);
    const rg = parseInt(rateGroup, 10);
    if (isNaN(r1) || isNaN(rg) || r1 <= 0 || rg <= 0) {
      Alert.alert('Invalid Rates', 'Please enter valid numerical hourly rates.');
      return;
    }
    await tutorSettingsRepository.updateRates(tutorMentorId, {
      hourlyRate1on1: r1,
      hourlyRateGroup: rg,
    });
    try {
      await apiClient.put('/users/profile', { hourlyRate: r1 });
    } catch {}
    Alert.alert(
      'Rates Saved',
      `1-on-1 Rate set to LKR ${r1.toLocaleString()}/hr and Group Rate set to LKR ${rg.toLocaleString()}/student/hr.`
    );
  };

  const handleAddSubject = async () => {
    if (!newTopicInput.trim()) return;
    const updated = await tutorSettingsRepository.addSubjectPreference(
      tutorMentorId,
      newTopicInput.trim()
    );
    setSubjectPreferences(updated.subjectPreferences);
    setNewTopicInput('');
  };

  const handleRemoveSubject = async (topic: string) => {
    const updated = await tutorSettingsRepository.removeSubjectPreference(
      tutorMentorId,
      topic
    );
    setSubjectPreferences(updated.subjectPreferences);
  };

  const handleAddSlot = async () => {
    if (!newSlotStartTime.trim() || !newSlotEndTime.trim()) {
      Alert.alert('Missing Field', 'Please select a session start and end time.');
      return;
    }

    // 1. OVERLAP CHECK: Verify against other sessions created by this same tutor
    const conflictResult = tutorSlotRepository.checkOverlap(
      tutorMentorId,
      tutorMentorName,
      newSlotDate,
      newSlotStartTime,
      newSlotEndTime
    );

    if (conflictResult.hasOverlap && conflictResult.overlappingSlot) {
      const conflict = conflictResult.overlappingSlot;
      Alert.alert(
        'Session Time Overlap Detected',
        `You already have an existing session scheduled on:\n\nDate: ${conflict.date}\nTime: ${conflict.startTime} - ${conflict.endTime}\nSession: "${conflict.title}"\n\nPlease select a different date or time. Tutors cannot have overlapping live sessions.`,
        [{ text: 'Pick Another Time', style: 'default' }]
      );
      return; // Do NOT add if there is an overlap!
    }

    // 2. Add slot only if no overlap exists!
    const created = await tutorSlotRepository.addSlot({
      mentorId: tutorMentorId,
      mentorName: tutorMentorName,
      title: `${newSlotModule} Guidance Session`,
      date: newSlotDate,
      startTime: newSlotStartTime,
      endTime: newSlotEndTime,
      timeRange: `${newSlotStartTime} - ${newSlotEndTime}`,
      duration: `${newSlotDuration} Mins`,
      fee: parseInt(rate1on1, 10) || 2500,
      type: newSlotType,
      maxCapacity: parseInt(newSlotCapacity, 10) || 5,
      module: newSlotModule,
      description: `Comprehensive interactive peer session for ${newSlotModule}.`,
      mode: 'Online',
    });
    setTutorSlots((prev) => [created, ...prev]);
    setAddSlotModalVisible(false);
    Alert.alert(
      'Slot Published Live',
      `New booking slot (${newSlotDate}, ${newSlotStartTime} - ${newSlotEndTime}) is now live for student bookings.`
    );
  };

  const handleDeleteSlot = (slotId: string) => {
    Alert.alert('Remove Slot', 'Are you sure you want to remove this available booking slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await tutorSlotRepository.deleteSlot(slotId);
          setTutorSlots((prev) => prev.filter((s) => s.id !== slotId));
        },
      },
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTutorSettingsAndSlots();
    setRefreshing(false);
  };

  const bookedSlots = tutorSlots.filter(
    (s) => (s.bookedCount || 0) > 0 || (s.registeredAttendees?.length || 0) > 0
  );
  const totalBookedAttendeesCount = bookedSlots.reduce(
    (acc, s) => acc + (s.registeredAttendees?.length || s.bookedCount || 0),
    0
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with ${currentUser?.name || 'Senior Peer Tutor'} on UniMentor for peer tutoring and Kuppiya sessions!`,
      });
    } catch {
      // Ignore
    }
  };

  const handleSaveSchedule = () => {
    setScheduleModalVisible(false);
    Alert.alert('Schedule Updated', `Your booking availability has been set to: ${scheduleDays} (${scheduleHours}).`);
  };

  const handleCreateAssessment = () => {
    if (!assessmentTitle.trim()) {
      Alert.alert('Missing Field', 'Please enter an assessment title.');
      return;
    }
    setAssessmentModalVisible(false);
    Alert.alert('Assessment Published', `"${assessmentTitle}" has been shared with your active study pods.`);
    setAssessmentTitle('');
  };

    const statusBarHeight =
      Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
        {/* 1. Header with Dark Navy Background */}
        <View style={[styles.headerContainer, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Tutor Dashboard</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <TouchableOpacity
                style={styles.switchRoleHeaderBtn}
                activeOpacity={0.85}
                onPress={() => {
                  useAuthStore.getState().setUser({
                    ...(currentUser || {}),
                    _id: currentUser?._id || 'demo-student-1',
                    id: currentUser?.id || 'demo-student-1',
                    name: currentUser?.name || 'Nethmi Silva',
                    email: currentUser?.email || 'nethmi.silva@student.unimentor.lk',
                    role: 'student',
                  } as any);
                  Alert.alert('Student Mode Active', 'Switched to Student Dashboard & bottom navigation.');
                  (navigation as any).navigate('MainTabs', { screen: 'Home' });
                }}
              >
                <Ionicons name="swap-horizontal" size={12} color="#061E47" />
                <Text style={styles.switchRoleHeaderBtnText}>Student Mode ➔</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerMessagesBtn}
                activeOpacity={0.85}
                onPress={() => (navigation as any).navigate('Messages')}
              >
                <Text style={styles.headerMessagesBtnText}>Messages</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#08214D" />}
      >
        {/* 2. Top Schedule Banner Card */}
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleSub}>{scheduleDays}</Text>
            <Text style={styles.scheduleTime}>{scheduleHours}</Text>
          </View>
          <TouchableOpacity
            style={styles.scheduleBtn}
            activeOpacity={0.85}
            onPress={() => setScheduleModalVisible(true)}
          >
            <Text style={styles.scheduleBtnText}>Schedule Booking</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Tutor Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            {/* Tutor Avatar with Camera Edit Badge */}
            <View style={styles.avatarOuterContainer}>
              <TouchableOpacity
                onPress={() => setImageModalVisible(true)}
                activeOpacity={0.85}
              >
                <TutorAvatar
                  name={currentUser?.name || 'Alex Ferreira'}
                  imageUrl={profileImageUri}
                  size={76}
                  borderRadius={25}
                />
                <View style={styles.cameraBadgeBtn}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <View style={styles.verifiedBadgeOverlay}>
                <Ionicons name="checkmark-sharp" size={13} color="#0A2342" />
              </View>
            </View>

            {/* Profile Info */}
            <View style={styles.profileDetails}>
              <View style={styles.nameBadgeRow}>
                <View style={styles.nameAndBadge}>
                  <Text style={styles.tutorName}>{currentUser?.name || 'Alex Ferreira'}</Text>
                  <View style={styles.verifiedPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#F59E0B" />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.shareCircle}
                  activeOpacity={0.8}
                  onPress={handleShare}
                >
                  <Ionicons name="share-social" size={17} color="#1D4ED8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.tutorRole}>
                Senior Peer Tutor • Faculty of Computing
              </Text>

              <TouchableOpacity
                style={styles.editPhotoLinkRow}
                onPress={() => setImageModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="image-outline" size={13} color="#1D4ED8" />
                <Text style={styles.editPhotoLinkText}>
                  {profileImageUri ? 'Change Photo' : 'Add Profile Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.profileActionRow}>
            <TouchableOpacity
              style={styles.assessmentBtn}
              activeOpacity={0.8}
              onPress={() => setAssessmentModalVisible(true)}
            >
              <Text style={styles.assessmentBtnText}>Create New Assessment</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pulseBtn, !pulseActive && styles.pulseBtnInactive]}
              activeOpacity={0.85}
              onPress={() => {
                setPulseActive(!pulseActive);
                Alert.alert(
                  'Tutor Pulse',
                  pulseActive
                    ? 'Tutor Pulse paused. Students will see you as offline.'
                    : 'Tutor Pulse is now active! Students can request immediate Kuppiya sessions.'
                );
              }}
            >
              <Ionicons
                name="location"
                size={13}
                color={pulseActive ? '#854D0E' : '#64748B'}
              />
              <Text style={[styles.pulseBtnText, !pulseActive && styles.pulseBtnTextInactive]}>
                Tutor Pulse {pulseActive ? '(Active)' : '(Paused)'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3.1 Booking Pricing & Subject Preferences Section */}
        <View style={styles.pricingAndTopicsCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={styles.sectionHeading}>Booking Pricing & Topics</Text>
              <Text style={styles.sectionSubheading}>
                Configure student rates & topics shown under Subject Preferences
              </Text>
            </View>
            <TouchableOpacity
              style={styles.saveRatesBtn}
              onPress={handleSaveRates}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark-done" size={14} color="#061E47" />
                <Text style={styles.saveRatesBtnText}>Save Rates</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Rates Inputs Row */}
          <View style={styles.ratesInputRow}>
            <View style={styles.rateCol}>
              <Text style={styles.rateColLabel}>1-on-1 Rate / Hour</Text>
              <View style={styles.rateInputWrap}>
                <Text style={styles.currencyPrefix}>LKR</Text>
                <TextInput
                  style={styles.rateInputField}
                  value={rate1on1}
                  onChangeText={setRate1on1}
                  keyboardType="numeric"
                  placeholder="2500"
                />
              </View>
            </View>

            <View style={styles.rateCol}>
              <Text style={styles.rateColLabel}>Group Rate / Student</Text>
              <View style={styles.rateInputWrap}>
                <Text style={styles.currencyPrefix}>LKR</Text>
                <TextInput
                  style={styles.rateInputField}
                  value={rateGroup}
                  onChangeText={setRateGroup}
                  keyboardType="numeric"
                  placeholder="1200"
                />
              </View>
            </View>
          </View>

          {/* Subject Preferences Management */}
          <Text style={styles.topicsSectionTitle}>SUBJECT PREFERENCES FOR BOOKING</Text>
          <Text style={styles.topicsSectionDesc}>
            These topics will appear as checkboxes for students booking a session with you
          </Text>

          <View style={styles.topicsChipsWrap}>
            {subjectPreferences.map((topic) => (
              <View key={topic} style={styles.topicChip}>
                <Text style={styles.topicChipText}>{topic}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveSubject(topic)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={15} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.addTopicRow}>
            <TextInput
              style={styles.addTopicInput}
              value={newTopicInput}
              onChangeText={setNewTopicInput}
              placeholder="Add topic (e.g. Transactions & ACID)..."
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity
              style={styles.addTopicBtn}
              onPress={handleAddSubject}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addTopicBtnText}>Add Topic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3.1.5 Modules Willing to Tutor (Directly Filters in Find Your Mentor) */}
        <View style={styles.modulesOfferedCard}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Ionicons name="book" size={17} color="#0D4F9E" />
                <Text style={styles.sectionHeading}>Modules I am Willing to Tutor ({teachingModules.length})</Text>
              </View>
              <Text style={styles.sectionSubheading}>
                Select the modules you are available to teach. Students in "Find Your Mentor" will filter and find your profile based on these modules.
              </Text>
            </View>
          </View>

          {/* Currently Selected Modules */}
          <Text style={styles.topicsSectionTitle}>CURRENTLY OFFERED MODULES</Text>
          <View style={styles.offeredModulesWrap}>
            {teachingModules.map((moduleName) => (
              <View key={moduleName} style={styles.offeredModuleChip}>
                <Ionicons name="checkmark-circle" size={15} color="#059669" style={{ marginRight: 5 }} />
                <Text style={styles.offeredModuleChipText}>{moduleName}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveModule(moduleName)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ marginLeft: 6 }}
                >
                  <Ionicons name="close-circle" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Quick-Select from University Curriculum */}
          <Text style={[styles.topicsSectionTitle, { marginTop: 12 }]}>
            QUICK ADD FROM UNIVERSITY CURRICULUM
          </Text>
          <Text style={styles.topicsSectionDesc}>
            Tap a module to toggle it in your teaching list:
          </Text>
          <View style={styles.curriculumPillsWrap}>
            {POPULAR_CURRICULUM_MODULES.map((moduleName) => {
              const isSelected = teachingModules.some(
                (m) => m.toLowerCase() === moduleName.toLowerCase()
              );
              return (
                <TouchableOpacity
                  key={moduleName}
                  style={[
                    styles.curriculumPill,
                    isSelected && styles.curriculumPillSelected,
                  ]}
                  onPress={() => handleToggleCurriculumModule(moduleName)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark' : 'add'}
                    size={13}
                    color={isSelected ? '#FFFFFF' : '#0D4F9E'}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.curriculumPillText,
                      isSelected && styles.curriculumPillTextSelected,
                    ]}
                  >
                    {moduleName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Add Custom Module Input */}
          <Text style={[styles.topicsSectionTitle, { marginTop: 12 }]}>
            ADD CUSTOM MODULE / COURSE CODE
          </Text>
          <View style={styles.addTopicRow}>
            <TextInput
              style={styles.addTopicInput}
              value={newModuleInput}
              onChangeText={setNewModuleInput}
              placeholder="e.g. IT3020: Mobile Application Dev..."
              placeholderTextColor="#94A3B8"
            />
            <TouchableOpacity
              style={styles.addModuleBtn}
              onPress={handleAddCustomModule}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.addTopicBtnText}>Add Module</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3.2 Upload & Manage Booking Slots for Students */}
        <View style={styles.slotsSection}>
          {/* DEDICATED SLOTS PAGE HERO BANNER */}
          <TouchableOpacity
            style={styles.dedicatedSlotHeroCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('TutorSlotManagement')}
          >
            <View style={styles.dedicatedSlotHeroLeft}>
              <View style={styles.dedicatedSlotHeroIcon}>
                <Ionicons name="calendar" size={22} color="#061E47" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.dedicatedSlotHeroTitle}>Allocated Slots & Registrations</Text>
                  <View style={styles.dedicatedSlotNewPill}>
                    <Text style={styles.dedicatedSlotNewPillText}>DEDICATED PAGE</Text>
                  </View>
                </View>
                <Text style={styles.dedicatedSlotHeroSubtitle}>
                  Fill allocated slots with custom fees, durations & see registered students/groups
                </Text>
              </View>
            </View>
            <View style={styles.dedicatedSlotHeroArrow}>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.slotsSectionHeaderRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={styles.slotsSectionTitle}>Available Student Booking Slots</Text>
              <Text style={styles.slotsSectionSubtitle}>
                Slots published for 1-on-1 and Group bookings ({tutorSlots.length} active)
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addSlotBtn}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('TutorSlotManagement')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="settings-outline" size={15} color="#061E47" />
                <Text style={styles.addSlotBtnText}>Manage Slots</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Slots Horizontal List */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.slotsHorizontalList}
          >
            {tutorSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={styles.tutorSlotCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('TutorSlotManagement')}
              >
                <View style={styles.slotCardTop}>
                  <View
                    style={[
                      styles.slotTypeBadge,
                      slot.type === 'group'
                        ? { backgroundColor: '#ECFDF5' }
                        : slot.type === '1-on-1'
                        ? { backgroundColor: '#EFF6FF' }
                        : { backgroundColor: '#FFFBEB' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.slotTypeBadgeText,
                        slot.type === 'group'
                          ? { color: '#059669' }
                          : slot.type === '1-on-1'
                          ? { color: '#1D4ED8' }
                          : { color: '#D97706' },
                      ]}
                    >
                      {slot.type === 'both' ? '1-on-1 & Group' : slot.type.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.slotCardFeeBadge}>
                    <Text style={styles.slotCardFeeText}>LKR {(slot.fee || 2000).toLocaleString()}</Text>
                  </View>
                </View>
                <Text style={styles.slotCardTitle} numberOfLines={1}>{slot.title || slot.module}</Text>
                <Text style={styles.slotCardStartTime}>{slot.startTime}</Text>
                <Text style={styles.slotCardRange}>{slot.timeRange} ({slot.duration || '60m'})</Text>
                <Text style={styles.slotCardDate}>{slot.date}</Text>
                <View style={styles.slotCapacityRow}>
                  <Ionicons name="people-outline" size={12} color="#0D4F9E" />
                  <Text style={styles.slotCapacityText}>
                    {slot.bookedCount}/{slot.maxCapacity} booked • View Attendees ➔
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 3.3 Booked Slots & Verified Students Section */}
        <View style={styles.bookedSlotsDashboardSection}>
          <View style={styles.bookedSlotsHeaderRow}>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" />
                <Text style={styles.bookedSlotsSectionTitle}>Booked Slots & Verified Students</Text>
                {totalBookedAttendeesCount > 0 && (
                  <View style={styles.verifiedCountBadge}>
                    <Text style={styles.verifiedCountBadgeText}>{totalBookedAttendeesCount} Booked</Text>
                  </View>
                )}
              </View>
              <Text style={styles.bookedSlotsSectionSubtitle}>
                Students registered for your mentoring slots with biometrically verified photos
              </Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllSlotsLinkBtn}
              onPress={() => navigation.navigate('TutorSlotManagement')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewAllSlotsLinkText}>Manage All ➔</Text>
            </TouchableOpacity>
          </View>

          {bookedSlots.length === 0 ? (
            <View style={styles.emptyBookedCard}>
              <Ionicons name="calendar-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyBookedTitle}>No Student Bookings Yet</Text>
              <Text style={styles.emptyBookedDesc}>
                When a student books one of your slots in Find Your Mentor, their registration details, notes, and verified face photo will appear right here.
              </Text>
              <TouchableOpacity
                style={styles.allocateSlotPromptBtn}
                onPress={() => navigation.navigate('TutorSlotManagement')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={16} color="#061E47" />
                <Text style={styles.allocateSlotPromptText}>Allocate New Time Slot</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bookedSlots.map((slot) => {
              const attendees = slot.registeredAttendees || [];
              return (
                <View key={slot.id} style={styles.bookedSlotCard}>
                  {/* Slot Title Banner */}
                  <View style={styles.bookedSlotTopRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <View style={styles.bookedSlotModulePill}>
                          <Text style={styles.bookedSlotModulePillText}>{slot.module}</Text>
                        </View>
                        <View style={styles.bookedSlotTypePill}>
                          <Text style={styles.bookedSlotTypePillText}>
                            {slot.type === 'both' ? '1-on-1 & Group' : slot.type.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.bookedSlotTitleText} numberOfLines={1}>
                        {slot.title || `${slot.module} Mentoring`}
                      </Text>
                    </View>
                    <View style={styles.bookedSlotMetaRight}>
                      <Text style={styles.bookedSlotDateText}>{slot.date}</Text>
                      <Text style={styles.bookedSlotTimeText}>{slot.timeRange || slot.startTime}</Text>
                      <Text style={styles.bookedSlotCapacityText}>
                        {slot.bookedCount}/{slot.maxCapacity} Booked
                      </Text>
                    </View>
                  </View>

                  {/* Registered Attendees in this slot */}
                  <View style={styles.bookedAttendeesWrap}>
                    <Text style={styles.attendeesHeaderLabel}>
                      REGISTERED STUDENTS ({attendees.length}) • TAP PHOTO TO VIEW VERIFIED IDENTITY
                    </Text>
                    {attendees.length === 0 ? (
                      <Text style={styles.noAttendeesNoticeText}>
                        1 student booked (Details syncing...)
                      </Text>
                    ) : (
                      attendees.map((att, attIdx) => {
                        const verifiedPhoto = att.faceVerificationPhoto || att.studentAvatar;
                        return (
                          <View key={att.id || attIdx} style={styles.dashAttendeeItem}>
                            <TouchableOpacity
                              style={styles.dashAttendeeAvatarBox}
                              activeOpacity={0.85}
                              onPress={() => {
                                setSelectedVerifiedAttendee(att);
                                setVerifiedPhotoModalVisible(true);
                              }}
                            >
                              {verifiedPhoto ? (
                                <Image
                                  source={{ uri: verifiedPhoto }}
                                  style={styles.dashAttendeeImg}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.dashAttendeeFallback}>
                                  <Text style={styles.dashAttendeeInitials}>
                                    {(att.studentName || 'S')
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.dashVerifiedBadge}>
                                <Ionicons name="checkmark-circle" size={13} color="#059669" />
                              </View>
                            </TouchableOpacity>

                            <View style={{ flex: 1, marginLeft: 10 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text style={styles.dashAttendeeNameText}>{att.studentName}</Text>
                                <View style={styles.dashVerifiedTag}>
                                  <Ionicons name="shield-checkmark" size={10} color="#059669" />
                                  <Text style={styles.dashVerifiedTagText}>Verified ✓</Text>
                                </View>
                                {att.bookingType === 'group' && (
                                  <View style={styles.dashGroupTag}>
                                    <Text style={styles.dashGroupTagText}>Group of {att.groupSize || 1}</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.dashAttendeeEmailText}>{att.studentEmail}</Text>

                              {!!att.notes && (
                                <View style={styles.dashAttendeeNotesBox}>
                                  <Text style={styles.dashAttendeeNotesLabel}>Message:</Text>
                                  <Text style={styles.dashAttendeeNotesText} numberOfLines={2}>
                                    "{att.notes}"
                                  </Text>
                                </View>
                              )}

                              <View style={styles.dashAttendeeMetaRow}>
                                <Text style={styles.dashAttendeePaidText}>
                                  Paid: LKR {(att.feePaid || slot.fee || 2500).toLocaleString()}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <TouchableOpacity
                                    style={styles.dashMessageBtn}
                                    onPress={() => {
                                      Alert.alert(
                                        'Direct Message',
                                        `Opening direct chat with ${att.studentName}...`,
                                        [
                                          { text: 'Cancel', style: 'cancel' },
                                          {
                                            text: 'Open Chat',
                                            onPress: () => (navigation as any).navigate('Messages'),
                                          },
                                        ]
                                      );
                                    }}
                                    activeOpacity={0.75}
                                  >
                                    <Text style={styles.dashMessageBtnText}>Message</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.dashViewImgLink}
                                    onPress={() => {
                                      setSelectedVerifiedAttendee(att);
                                      setVerifiedPhotoModalVisible(true);
                                    }}
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons name="eye-outline" size={11} color="#0D4F9E" />
                                    <Text style={styles.dashViewImgLinkText}>View Verified Photo</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* 4. Tutor Performance Section */}
        <View style={styles.performanceSection}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>Tutor Performance</Text>
            <Text style={styles.performanceMonth}>May 2024</Text>
          </View>

          {/* 2x2 Performance Grid */}
          <View style={styles.gridRow}>
            {/* Card 1: Total Earnings */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Total Earnings</Text>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="wallet-outline" size={16} color="#0284C7" />
                </View>
              </View>
              <Text style={styles.perfValue}>LKR 48,500</Text>
              <View style={styles.perfFooterRow}>
                <View style={styles.trendPill}>
                  <Ionicons name="trending-up" size={12} color="#4F46E5" />
                  <Text style={styles.trendPillText}>+18%</Text>
                </View>
                {/* Visual Sparkline Graphic */}
                <View style={styles.sparklineContainer}>
                  <View style={[styles.sparkDot, { left: 0, bottom: 2 }]} />
                  <View style={[styles.sparkLineSegment, { left: 1, bottom: 3, width: 10, transform: [{ rotate: '-22deg' }] }]} />
                  <View style={[styles.sparkLineSegment, { left: 9, bottom: 6, width: 8, transform: [{ rotate: '18deg' }] }]} />
                  <View style={[styles.sparkLineSegment, { left: 16, bottom: 5, width: 10, transform: [{ rotate: '-20deg' }] }]} />
                  <View style={[styles.sparkLineSegment, { left: 24, bottom: 7, width: 14, transform: [{ rotate: '-32deg' }] }]} />
                  <View style={[styles.sparkDot, { right: 0, top: 1 }]} />
                </View>
              </View>
            </View>

            {/* Card 2: Completed */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Completed</Text>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="checkmark-done" size={17} color="#0284C7" />
                </View>
              </View>
              <Text style={styles.perfValue}>38 Sessions</Text>
              <View style={styles.perfFooterSingle}>
                <View style={styles.goldDot} />
                <Text style={styles.perfSubtext}>100% fulfill rate</Text>
              </View>
            </View>
          </View>

          <View style={[styles.gridRow, { marginTop: 12 }]}>
            {/* Card 3: Student Rating */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Student Rating</Text>
                <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="star" size={15} color="#F59E0B" />
                </View>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.perfValue}>4.9</Text>
                <Text style={styles.ratingMax}> / 5.0</Text>
              </View>
              <Text style={styles.perfSubtext}>120 reviews (98% pos)</Text>
            </View>

            {/* Card 4: Active Students */}
            <View style={styles.perfCard}>
              <View style={styles.perfCardTop}>
                <Text style={styles.perfLabel}>Active Students</Text>
                <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="people" size={16} color="#0284C7" />
                </View>
              </View>
              <Text style={styles.perfValue}>24 Students</Text>
              <Text style={styles.perfSubtext}>Across 3 study pods</Text>
            </View>
          </View>
        </View>

        {/* 5. LIVE KUPPIYA POD Card */}
        <TouchableOpacity
          style={styles.livePodCard}
          activeOpacity={0.92}
          onPress={() => setLivePodModalVisible(true)}
        >
          {/* Top Row with LIVE tag and Slot */}
          <View style={styles.livePodHeader}>
            <View style={styles.livePodBadge}>
              <View style={styles.livePulsingDot} />
              <Text style={styles.livePodBadgeText}>LIVE KUPPIYA POD</Text>
            </View>
            <Text style={styles.livePodSlotText}>Slot: 3:00 - 4:30 PM</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.livePodTitle}>Data Structures: Graph Traversals</Text>
          <Text style={styles.livePodDesc}>
            BFS, DFS & Topological Sort real-world walk-through
          </Text>

          {/* Pod Footer info */}
          <View style={styles.livePodFooter}>
            <View style={styles.studentAvatarsRow}>
              <View style={[styles.avatarMini, { backgroundColor: '#38BDF8' }]}>
                <Text style={styles.avatarMiniText}>KS</Text>
              </View>
              <View style={[styles.avatarMini, { backgroundColor: '#818CF8', marginLeft: -8 }]}>
                <Text style={styles.avatarMiniText}>AN</Text>
              </View>
              <View style={[styles.avatarMini, { backgroundColor: '#34D399', marginLeft: -8 }]}>
                <Text style={styles.avatarMiniText}>DM</Text>
              </View>
              <View style={[styles.avatarMiniPlus, { marginLeft: -8 }]}>
                <Text style={styles.avatarMiniPlusText}>+21</Text>
              </View>
              <Text style={styles.enrolledCountText}>24 Registered</Text>
            </View>

            <View style={styles.startPodPill}>
              <Ionicons name="play-circle" size={15} color="#FFFFFF" />
              <Text style={styles.startPodText}>Join Pod</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Extra Bottom Padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* MODAL 1: Schedule Availability Booking */}
      <Modal visible={scheduleModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Set Availability & Schedule</Text>
            <Text style={styles.modalSub}>
              Students can book 1-on-1 tutoring sessions only during your designated active hours.
            </Text>

            <Text style={styles.modalLabel}>Active Days</Text>
            <TextInput
              style={styles.modalInput}
              value={scheduleDays}
              onChangeText={setScheduleDays}
              placeholder="e.g. Monday to Friday"
            />

            <Text style={styles.modalLabel}>Working Hours Slot</Text>
            <TextInput
              style={styles.modalInput}
              value={scheduleHours}
              onChangeText={setScheduleHours}
              placeholder="e.g. 3:00 PM - 6:00 PM"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setScheduleModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleSaveSchedule}
              >
                <Text style={styles.modalConfirmText}>Save Availability</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Create Assessment */}
      <Modal visible={assessmentModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Create New Assessment</Text>
            <Text style={styles.modalSub}>
              Quick quiz or revision challenge for your active Kuppiya study pods.
            </Text>

            <Text style={styles.modalLabel}>Assessment Title</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Graph Traversals Quiz 01"
              value={assessmentTitle}
              onChangeText={setAssessmentTitle}
            />

            <Text style={styles.modalLabel}>Module / Subject</Text>
            <TextInput
              style={styles.modalInput}
              value={assessmentModule}
              onChangeText={setAssessmentModule}
            />

            <Text style={styles.modalLabel}>Time Limit</Text>
            <TextInput
              style={styles.modalInput}
              value={assessmentDuration}
              onChangeText={setAssessmentDuration}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAssessmentModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleCreateAssessment}
              >
                <Text style={styles.modalConfirmText}>Publish Assessment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: Live Kuppiya Room Details */}
      <Modal visible={livePodModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: '#0D244D' }]}>
            <View style={[styles.modalHandle, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={styles.livePodBadge}>
              <View style={styles.livePulsingDot} />
              <Text style={styles.livePodBadgeText}>KUPPIYA SESSION ROOM</Text>
            </View>

            <Text style={[styles.modalTitle, { color: '#FFFFFF', marginTop: 12 }]}>
              Data Structures: Graph Traversals
            </Text>
            <Text style={[styles.modalSub, { color: '#93C5FD' }]}>
              Interactive Peer Kuppiya • 24 Students waiting in lobby.
            </Text>

            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginVertical: 12 }}>
              <Text style={{ color: '#E2E8F0', fontWeight: '700', fontSize: 13, marginBottom: 4 }}>
                Session Agenda:
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 12, lineHeight: 18 }}>
                1. Adjacency Matrix vs List representation{'\n'}
                2. Breadth-First Search (BFS) queue demo{'\n'}
                3. Depth-First Search (DFS) recursive stack{'\n'}
                4. Live Q&A and past exam question review
              </Text>
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setLivePodModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: '#FFFFFF' }]}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#F59E0B' }]}
                onPress={() => {
                  setLivePodModalVisible(false);
                  Alert.alert('Live Session Started', 'Broadcasting live Kuppiya pod audio & whiteboard!');
                }}
              >
                <Text style={[styles.modalConfirmText, { color: '#0F172A' }]}>Start Broadcast</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Upload & Add Booking Slot */}
      <Modal visible={addSlotModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Allocate New Time Slot</Text>
            <Text style={styles.modalSub}>
              Select session date, time, and duration below without typing. Overlaps are checked automatically.
            </Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* 1. DATE PICKER (INTERACTIVE CHIPS - NO TYPING) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.modalLabel}>1. SELECT DATE (TAP TO PICK)</Text>
                <Text style={styles.selectedDateBadgeText}>{newSlotDate.split(',')[0]}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePickerRow}>
                {upcomingDatesList.map((item) => {
                  const isSelected = newSlotDate === item.formatted;
                  return (
                    <TouchableOpacity
                      key={item.formatted}
                      style={[styles.datePickChip, isSelected && styles.datePickChipActive]}
                      onPress={() => setNewSlotDate(item.formatted)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.datePickDay, isSelected && styles.datePickDayActive]}>
                        {item.dayName}
                      </Text>
                      <Text style={[styles.datePickNum, isSelected && styles.datePickNumActive]}>
                        {item.dateLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 2. START TIME PICKER (INTERACTIVE CHIPS - NO TYPING) */}
              <Text style={[styles.modalLabel, { marginTop: 12 }]}>2. SELECT START TIME (TAP TO PICK)</Text>
              <View style={styles.timeChipsGrid}>
                {TIME_OPTIONS.map((t) => {
                  const isSelected = newSlotStartTime === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timePickChip, isSelected && styles.timePickChipActive]}
                      onPress={() => {
                        setNewSlotStartTime(t);
                        setNewSlotEndTime(calculateEndTimeFromStart(t, newSlotDuration));
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.timePickChipText, isSelected && styles.timePickChipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3. SESSION DURATION (CHIPS - NO TYPING) */}
              <Text style={[styles.modalLabel, { marginTop: 12 }]}>3. SESSION DURATION</Text>
              <View style={styles.durationPillsRow}>
                {DURATION_CHOICES.map((dur) => {
                  const isSelected = newSlotDuration === dur.mins;
                  return (
                    <TouchableOpacity
                      key={dur.label}
                      style={[styles.durationPill, isSelected && styles.durationPillActive]}
                      onPress={() => {
                        setNewSlotDuration(dur.mins);
                        setNewSlotEndTime(calculateEndTimeFromStart(newSlotStartTime, dur.mins));
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.durationPillText, isSelected && styles.durationPillTextActive]}>
                        {dur.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Timing Preview Banner */}
              <View style={styles.selectedTimePreviewBanner}>
                <Text style={styles.selectedTimePreviewTitle}>SCHEDULE PREVIEW:</Text>
                <Text style={styles.selectedTimePreviewVal}>
                  {newSlotStartTime} - {newSlotEndTime} ({newSlotDuration} Mins)
                </Text>
              </View>

              {/* 4. Booking Mode Allowed */}
              <Text style={[styles.modalLabel, { marginTop: 10 }]}>BOOKING MODE ALLOWED</Text>
              <View style={styles.modePickerRow}>
                {(['1-on-1', 'group', 'both'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modePickerBtn, newSlotType === m && styles.modePickerBtnActive]}
                    onPress={() => setNewSlotType(m)}
                  >
                    <Text style={[styles.modePickerBtnText, newSlotType === m && styles.modePickerBtnTextActive]}>
                      {m === 'both' ? 'Both' : m === 'group' ? 'Group Only' : '1-on-1 Only'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 5. Max Students & Module */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Max Students</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newSlotCapacity}
                    onChangeText={setNewSlotCapacity}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.modalLabel}>Module / Subject</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newSlotModule}
                    onChangeText={setNewSlotModule}
                    placeholder="Database Management Systems"
                  />
                </View>
              </View>
            </ScrollView>

            {/* BUTTON ROW: Publish Slot Live (NO ICONS ON BUTTON) */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAddSlotModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#F59E0B' }]}
                onPress={handleAddSlot}
              >
                <Text style={[styles.modalConfirmText, { color: '#061E47', fontWeight: '800' }]}>
                  Publish Slot Live
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Tutor Profile Image Management */}
      <Modal visible={imageModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.modalTitle}>Tutor Profile Photo</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Ionicons name="close" size={22} color="#0A2342" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Personalize your tutor profile photo for students. If no photo is added, your stylish initials avatar will be displayed automatically.
            </Text>

            {/* Current Preview */}
            <View style={styles.photoPreviewBox}>
              <TutorAvatar
                name={currentUser?.name || 'Alex Ferreira'}
                imageUrl={imageUrlInput.trim() || profileImageUri}
                size={84}
                borderRadius={28}
              />
              <Text style={styles.photoPreviewLabel}>
                {imageUrlInput.trim() || profileImageUri ? 'Photo Preview' : 'Initials Avatar Active'}
              </Text>
            </View>

            {/* Image URL Input */}
            <Text style={styles.inputSectionLabel}>Custom Image URL</Text>
            <View style={styles.urlInputRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                value={imageUrlInput}
                onChangeText={setImageUrlInput}
                placeholder="https://example.com/my-photo.jpg"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
              />
              {imageUrlInput ? (
                <TouchableOpacity
                  style={styles.clearInputBtn}
                  onPress={() => setImageUrlInput('')}
                >
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Academic Sample Presets */}
            <Text style={[styles.inputSectionLabel, { marginTop: 14 }]}>Or Choose From Sample Tutor Photos</Text>
            <View style={styles.samplePhotosRow}>
              {[
                {
                  id: 'p1',
                  url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  label: 'Academic 1',
                },
                {
                  id: 'p2',
                  url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
                  label: 'Academic 2',
                },
                {
                  id: 'p3',
                  url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
                  label: 'Academic 3',
                },
                {
                  id: 'p4',
                  url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
                  label: 'Academic 4',
                },
              ].map((sample) => (
                <TouchableOpacity
                  key={sample.id}
                  style={[
                    styles.samplePhotoThumb,
                    imageUrlInput === sample.url && styles.samplePhotoThumbActive,
                  ]}
                  onPress={() => setImageUrlInput(sample.url)}
                >
                  <Image source={{ uri: sample.url }} style={styles.samplePhotoImg} />
                  {imageUrlInput === sample.url && (
                    <View style={styles.samplePhotoCheck}>
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Clear / Initials Button */}
            <TouchableOpacity
              style={styles.useInitialsBtn}
              onPress={() => {
                setImageUrlInput('');
                handleSaveProfileImage(null);
              }}
            >
              <Ionicons name="person-circle-outline" size={16} color="#475569" />
              <Text style={styles.useInitialsBtnText}>Remove Photo & Use Initials Avatar</Text>
            </TouchableOpacity>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setImageModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#061E47' }]}
                onPress={() => handleSaveProfileImage(imageUrlInput.trim() || null)}
              >
                <Text style={[styles.modalConfirmText, { color: '#FFFFFF' }]}>Save Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VERIFIED STUDENT PHOTO MODAL */}
      <Modal visible={verifiedPhotoModalVisible} transparent animationType="fade">
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalCard}>
            <View style={styles.photoModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.photoShieldIcon}>
                  <Ionicons name="shield-checkmark" size={18} color="#059669" />
                </View>
                <View>
                  <Text style={styles.photoModalTitle}>Verified Student Identity</Text>
                  <Text style={styles.photoModalSubtitle}>Biometric verification completed for session</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setVerifiedPhotoModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.photoModalBody}>
              {selectedVerifiedAttendee?.faceVerificationPhoto || selectedVerifiedAttendee?.studentAvatar ? (
                <View style={styles.photoModalImageWrapper}>
                  <Image
                    source={{
                      uri:
                        selectedVerifiedAttendee.faceVerificationPhoto ||
                        selectedVerifiedAttendee.studentAvatar,
                    }}
                    style={styles.photoModalImage}
                    resizeMode="cover"
                  />
                  <View style={styles.verifiedStampPill}>
                    <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                    <Text style={styles.verifiedStampText}>BIOMETRIC VERIFIED ✓</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.photoModalPlaceholder}>
                  <Ionicons name="person-circle-outline" size={72} color="#0D4F9E" />
                  <Text style={styles.photoModalPlaceholderText}>Initials Verified Identity</Text>
                </View>
              )}

              <View style={styles.photoModalDetailsBox}>
                <View style={styles.photoDetailRow}>
                  <Text style={styles.photoDetailLabel}>Student Name:</Text>
                  <Text style={styles.photoDetailVal}>{selectedVerifiedAttendee?.studentName}</Text>
                </View>
                <View style={styles.photoDetailRow}>
                  <Text style={styles.photoDetailLabel}>Email Address:</Text>
                  <Text style={styles.photoDetailVal}>{selectedVerifiedAttendee?.studentEmail}</Text>
                </View>
                <View style={styles.photoDetailRow}>
                  <Text style={styles.photoDetailLabel}>Verification Status:</Text>
                  <View style={styles.verifiedLiveBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#059669" />
                    <Text style={styles.verifiedLiveBadgeText}>Verified Identity ✓</Text>
                  </View>
                </View>
                <View style={styles.photoDetailRow}>
                  <Text style={styles.photoDetailLabel}>Booking Mode:</Text>
                  <Text style={styles.photoDetailVal}>
                    {selectedVerifiedAttendee?.bookingType === 'group'
                      ? `Group (${selectedVerifiedAttendee.groupSize || 1} Students)`
                      : '1-on-1 Individual'}
                  </Text>
                </View>
                {selectedVerifiedAttendee?.feePaid !== undefined && (
                  <View style={styles.photoDetailRow}>
                    <Text style={styles.photoDetailLabel}>Payment Amount:</Text>
                    <Text style={[styles.photoDetailVal, { color: '#059669', fontWeight: '800' }]}>
                      LKR {selectedVerifiedAttendee.feePaid.toLocaleString()} (Paid)
                    </Text>
                  </View>
                )}
                {!!selectedVerifiedAttendee?.notes && (
                  <View style={[styles.photoDetailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 2 }]}>
                    <Text style={styles.photoDetailLabel}>Session Topic / Notes:</Text>
                    <Text style={[styles.photoDetailVal, { fontSize: 11, color: '#334155' }]}>
                      {selectedVerifiedAttendee.notes}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.photoModalCloseBtn}
              onPress={() => setVerifiedPhotoModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.photoModalCloseBtnText}>Close Verification Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F3F6FA',
  },
  headerContainer: {
    backgroundColor: '#061E47',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
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
  scrollContent: {
    paddingBottom: 24,
  },

  // 2. Schedule Card
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 2,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.2,
  },
  scheduleBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },

  // 3. Profile Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarOuterContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#1D4ED8',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 12,
    elevation: 4,
  },
  verifiedBadgeOverlay: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F59E0B',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
    elevation: 4,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 16,
  },
  editPhotoLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  editPhotoLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  tutorName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  shareCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  tutorRole: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  assessmentBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assessmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  pulseBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pulseBtnInactive: {
    backgroundColor: '#E2E8F0',
  },
  pulseBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  pulseBtnTextInactive: {
    color: '#64748B',
  },

  // 4. Performance Section
  performanceSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.3,
  },
  performanceMonth: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  perfCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  perfCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  perfValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    marginTop: 8,
    letterSpacing: -0.4,
  },
  perfFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  trendPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  sparklineContainer: {
    position: 'relative',
    width: 44,
    height: 16,
    justifyContent: 'center',
  },
  sparkLineSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 1,
  },
  sparkDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
  },
  perfFooterSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  goldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  perfSubtext: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ratingMax: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // 5. LIVE KUPPIYA POD Card
  livePodCard: {
    backgroundColor: '#0D244D',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0D244D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  livePodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  livePodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  livePulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  livePodBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.6,
  },
  livePodSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#93C5FD',
  },
  livePodTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  livePodDesc: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 3,
    lineHeight: 18,
  },
  livePodFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  studentAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D244D',
  },
  avatarMiniText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarMiniPlus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0D244D',
  },
  avatarMiniPlusText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  enrolledCountText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 8,
    fontWeight: '500',
  },
  startPodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },
  startPodText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2342',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1.5,
    backgroundColor: '#0A2342',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Slot Management Styles */
  slotsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  slotsSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotsSectionTitle: {
    color: '#0A2342',
    fontSize: 15,
    fontWeight: '800',
  },
  slotsSectionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  addSlotBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },
  addSlotBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  slotsHorizontalList: {
    gap: 10,
    paddingVertical: 2,
  },
  tutorSlotCard: {
    width: 148,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  slotTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotTypeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  slotCardStartTime: {
    color: '#0A2342',
    fontSize: 14,
    fontWeight: '800',
  },
  slotCardRange: {
    color: '#64748B',
    fontSize: 10.5,
    marginTop: 1,
  },
  slotCardDate: {
    color: '#475569',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  slotCapacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 4,
  },
  slotCapacityText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  modePickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  modePickerBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modePickerBtnActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  modePickerBtnText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  modePickerBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  /* Date & Time Picker Styles */
  selectedDateBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  datePickerRow: {
    gap: 8,
    paddingVertical: 4,
  },
  datePickChip: {
    width: 68,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  datePickChipActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
    shadowColor: '#061E47',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickDay: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
  },
  datePickDayActive: {
    color: '#F59E0B',
    fontWeight: '800',
  },
  datePickNum: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  datePickNumActive: {
    color: '#FFFFFF',
  },
  timeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 4,
  },
  timePickChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timePickChipActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  timePickChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  timePickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  durationPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationPillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  durationPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  durationPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  selectedTimePreviewBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedTimePreviewTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  selectedTimePreviewVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },

  /* Pricing & Topics Section Styles */
  pricingAndTopicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#0A2342',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubheading: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  saveRatesBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 12,
  },
  saveRatesBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  ratesInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  rateCol: {
    flex: 1,
  },
  rateColLabel: {
    color: '#334155',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  rateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
  },
  currencyPrefix: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  rateInputField: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: '#0A2342',
    paddingVertical: 8,
  },
  topicsSectionTitle: {
    color: '#0A2342',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  topicsSectionDesc: {
    color: '#64748B',
    fontSize: 11,
    marginBottom: 10,
  },
  topicsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  topicChipText: {
    color: '#061E47',
    fontSize: 11.5,
    fontWeight: '700',
  },
  addTopicRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addTopicInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    color: '#0F172A',
  },
  addTopicBtn: {
    backgroundColor: '#0D4F9E',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addTopicBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Offered Modules Section Styles */
  modulesOfferedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    elevation: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  offeredModulesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  offeredModuleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  offeredModuleChipText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '700',
  },
  curriculumPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  curriculumPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  curriculumPillSelected: {
    backgroundColor: '#0D4F9E',
    borderColor: '#0D4F9E',
  },
  curriculumPillText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '700',
  },
  curriculumPillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  addModuleBtn: {
    backgroundColor: '#0D4F9E',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  /* Tutor Photo Modal Styles */
  photoPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 8,
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 8,
  },
  clearInputBtn: {
    position: 'absolute',
    right: 12,
  },
  samplePhotosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  samplePhotoThumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  samplePhotoThumbActive: {
    borderColor: '#1D4ED8',
    borderWidth: 2.5,
  },
  samplePhotoImg: {
    width: '100%',
    height: '100%',
  },
  samplePhotoCheck: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#1D4ED8',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  useInitialsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  useInitialsBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  dedicatedSlotHeroCard: {
    backgroundColor: '#EAA023',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#EAA023',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  dedicatedSlotHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  dedicatedSlotHeroIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dedicatedSlotHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#061E47',
  },
  dedicatedSlotNewPill: {
    backgroundColor: '#061E47',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dedicatedSlotNewPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EAA023',
  },
  dedicatedSlotHeroSubtitle: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
    lineHeight: 15,
  },
  dedicatedSlotHeroArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#061E47',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  slotCardFeeBadge: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  slotCardFeeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  slotCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  switchRoleHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EAA023',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  switchRoleHeaderBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#061E47',
  },
  headerMessagesBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  headerMessagesBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 3.3 Booked Slots & Verified Students Dashboard Section
  bookedSlotsDashboardSection: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  bookedSlotsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  bookedSlotsSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061E47',
  },
  verifiedCountBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedCountBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  bookedSlotsSectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  viewAllSlotsLinkBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllSlotsLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D4F9E',
  },
  emptyBookedCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyBookedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginTop: 8,
  },
  emptyBookedDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  allocateSlotPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EAA023',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 12,
  },
  allocateSlotPromptText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#061E47',
  },
  bookedSlotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookedSlotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bookedSlotModulePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookedSlotModulePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D4F9E',
  },
  bookedSlotTypePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bookedSlotTypePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  bookedSlotTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookedSlotMetaRight: {
    alignItems: 'flex-end',
  },
  bookedSlotDateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  bookedSlotTimeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D4F9E',
  },
  bookedSlotCapacityText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  bookedAttendeesWrap: {
    marginTop: 10,
    gap: 8,
  },
  attendeesHeaderLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  noAttendeesNoticeText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  dashAttendeeItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dashAttendeeAvatarBox: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  dashAttendeeImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dashAttendeeFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D4F9E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  dashAttendeeInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dashVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  dashAttendeeNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  dashVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dashVerifiedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  dashGroupTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dashGroupTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  dashAttendeeEmailText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  dashAttendeeNotesBox: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dashAttendeeNotesLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0D4F9E',
    letterSpacing: 0.4,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  dashAttendeeNotesText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '500',
  },
  dashMessageBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashMessageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  dashAttendeeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 4,
  },
  dashAttendeePaidText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  dashViewImgLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dashViewImgLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D4F9E',
  },

  // Photo Preview Modal Styles
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  photoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  photoShieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061E47',
  },
  photoModalSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  photoModalBody: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  photoModalImageWrapper: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 16,
  },
  photoModalImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  verifiedStampPill: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedStampText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  photoModalPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  photoModalPlaceholderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  photoModalDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  photoDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  photoDetailVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  verifiedLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedLiveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  photoModalCloseBtn: {
    backgroundColor: '#061E47',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  photoModalCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

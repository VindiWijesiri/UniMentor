import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { tutorSlotRepository } from '../../../data/repositories/tutorSlotRepository';
import type { TutorSlot, RegisteredAttendee } from '../../../domain/entities/TutorSlot';
import { useAuthStore } from '../../../domain/stores/authStore';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

const { width } = Dimensions.get('window');

const DURATION_OPTIONS = ['30 Mins', '45 Mins', '60 Mins', '90 Mins', '120 Mins'];
const COMMON_MODULES = [
  'Database Management Systems',
  'Data Structures & Algorithms',
  'Software Architecture & Design',
  'Mobile Application Development',
  'Object Oriented Programming',
  'Probability & Statistics',
  'Computer Networks & Security',
  'Cloud Computing Infrastructure',
];

const PRESET_FEES = [1500, 2000, 2500, 3000, 3500];

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

export default function TutorSlotManagementScreen({ navigation }: any) {
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore((state) => state.user);
  const tutorMentorId = currentUser?._id || (currentUser as any)?.id || 'demo-tutor-1';
  const tutorMentorName = currentUser?.name || 'Tharushi Perera';

  const upcomingDatesList = getUpcomingDatesList(14);

  const [slots, setSlots] = useState<TutorSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | '1-on-1' | 'group' | 'booked'>('all');
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  // Add / Edit Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);

  // Verified Photo preview modal state
  const [verifiedPhotoModalVisible, setVerifiedPhotoModalVisible] = useState(false);
  const [selectedVerifiedAttendee, setSelectedVerifiedAttendee] = useState<RegisteredAttendee | null>(null);

  // Form Fields
  const [slotTitle, setSlotTitle] = useState('');
  const [slotModule, setSlotModule] = useState(COMMON_MODULES[0]);
  const [slotDate, setSlotDate] = useState(upcomingDatesList[0].formatted);
  const [slotStartTime, setSlotStartTime] = useState('10:00 AM');
  const [slotDuration, setSlotDuration] = useState('90 Mins');
  const [slotEndTime, setSlotEndTime] = useState('11:30 AM');
  const [slotFee, setSlotFee] = useState('2500');
  const [slotType, setSlotType] = useState<'1-on-1' | 'group' | 'both'>('group');
  const [slotCapacity, setSlotCapacity] = useState('5');
  const [slotMode, setSlotMode] = useState<'Online' | 'In-Person' | 'Hybrid'>('Online');
  const [slotLocation, setSlotLocation] = useState('Microsoft Teams • Link Provided Upon Booking');
  const [slotDescription, setSlotDescription] = useState('');
  const [slotPrerequisites, setSlotPrerequisites] = useState('Basic understanding of concepts and lecture slides.');
  const [slotTargetBatch, setSlotTargetBatch] = useState('Year 2 & Year 3');

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tutorSlotRepository.getAllSlots(tutorMentorId, tutorMentorName);
      setSlots(data);
      if (data.length > 0) {
        const bookedSlot = data.find((s) => (s.registeredAttendees?.length || 0) > 0 || (s.bookedCount || 0) > 0);
        if (bookedSlot && !expandedSlotId) {
          setExpandedSlotId(bookedSlot.id);
        } else if (!expandedSlotId) {
          setExpandedSlotId(data[0].id);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [tutorMentorId, tutorMentorName, expandedSlotId]);

  useEffect(() => {
    loadSlots();
    const unsub = tutorSlotRepository.subscribe(() => {
      loadSlots();
    });
    return unsub;
  }, [loadSlots]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSlots();
    setRefreshing(false);
  };

  const calculateEndTime = (start: string, dur: string) => {
    // Simple helper for time labels
    const mins = parseInt(dur.replace(/[^0-9]/g, ''), 10) || 60;
    const match = start.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return start;
    let h = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    const meridian = match[3].toUpperCase();

    if (meridian === 'PM' && h !== 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;

    const totalMinutes = h * 60 + m + mins;
    const newH24 = Math.floor(totalMinutes / 60) % 24;
    const newM = totalMinutes % 60;

    const newMeridian = newH24 >= 12 ? 'PM' : 'AM';
    let newH12 = newH24 % 12;
    if (newH12 === 0) newH12 = 12;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(newH12)}:${pad(newM)} ${newMeridian}`;
  };

  const handleDurationChange = (dur: string) => {
    setSlotDuration(dur);
    setSlotEndTime(calculateEndTime(slotStartTime, dur));
  };

  const handleStartTimeChange = (start: string) => {
    setSlotStartTime(start);
    setSlotEndTime(calculateEndTime(start, slotDuration));
  };

  const resetForm = () => {
    setEditingSlotId(null);
    setSlotTitle('');
    setSlotModule(COMMON_MODULES[0]);
    setSlotDate('Friday, 19 Sep 2025');
    setSlotStartTime('10:00 AM');
    setSlotDuration('90 Mins');
    setSlotEndTime('11:30 AM');
    setSlotFee('2500');
    setSlotType('group');
    setSlotCapacity('5');
    setSlotMode('Online');
    setSlotLocation('Microsoft Teams • Link Provided Upon Booking');
    setSlotDescription('');
    setSlotPrerequisites('Basic understanding of concepts and lecture slides.');
    setSlotTargetBatch('Year 2 & Year 3');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleOpenEditModal = (slot: TutorSlot) => {
    setEditingSlotId(slot.id);
    setSlotTitle(slot.title || '');
    setSlotModule(slot.module);
    setSlotDate(slot.date);
    setSlotStartTime(slot.startTime);
    setSlotEndTime(slot.endTime);
    setSlotDuration(slot.duration || '60 Mins');
    setSlotFee(String(slot.fee ?? 2000));
    setSlotType(slot.type);
    setSlotCapacity(String(slot.maxCapacity));
    setSlotMode(slot.mode || 'Online');
    setSlotLocation(slot.location || 'Microsoft Teams');
    setSlotDescription(slot.description || '');
    setSlotPrerequisites(slot.prerequisites || '');
    setSlotTargetBatch(slot.targetBatch || 'All Batches');
    setModalVisible(true);
  };

  const handleSaveSlot = async () => {
    if (!slotTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a descriptive session title/topic.');
      return;
    }
    if (!slotStartTime.trim() || !slotEndTime.trim()) {
      Alert.alert('Required Field', 'Please specify start and end times.');
      return;
    }

    // 1. OVERLAP CHECK: Check conflicts with existing sessions created by the same tutor
    const conflictResult = tutorSlotRepository.checkOverlap(
      tutorMentorId,
      tutorMentorName,
      slotDate,
      slotStartTime,
      slotEndTime,
      editingSlotId || undefined
    );

    if (conflictResult.hasOverlap && conflictResult.overlappingSlot) {
      const conflict = conflictResult.overlappingSlot;
      Alert.alert(
        'Session Time Overlap Detected',
        `You already have an existing session scheduled on:\n\nDate: ${conflict.date}\nTime: ${conflict.startTime} - ${conflict.endTime}\nSession: "${conflict.title}"\n\nPlease select a different date or time slot. Tutors cannot have overlapping live sessions.`,
        [{ text: 'Change Time', style: 'default' }]
      );
      return; // Do NOT add or update if overlap exists!
    }

    const feeNum = parseInt(slotFee, 10);
    if (isNaN(feeNum) || feeNum < 0) {
      Alert.alert('Invalid Fee', 'Please enter a valid session fee (e.g. 2000 LKR).');
      return;
    }
    const capNum = parseInt(slotCapacity, 10) || (slotType === '1-on-1' ? 1 : 5);

    if (editingSlotId) {
      const updated = await tutorSlotRepository.updateSlot(editingSlotId, {
        title: slotTitle.trim(),
        module: slotModule,
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
        duration: slotDuration,
        timeRange: `${slotStartTime} - ${slotEndTime}`,
        fee: feeNum,
        type: slotType,
        maxCapacity: capNum,
        mode: slotMode,
        location: slotLocation.trim(),
        description: slotDescription.trim(),
        prerequisites: slotPrerequisites.trim(),
        targetBatch: slotTargetBatch.trim(),
      });
      if (updated) {
        setSlots((prev) => prev.map((s) => (s.id === editingSlotId ? updated : s)));
      }
      Alert.alert('Slot Updated', `"${slotTitle}" has been updated.`);
    } else {
      const created = await tutorSlotRepository.addSlot({
        mentorId: tutorMentorId,
        mentorName: tutorMentorName,
        title: slotTitle.trim(),
        module: slotModule,
        date: slotDate,
        startTime: slotStartTime,
        endTime: slotEndTime,
        duration: slotDuration,
        timeRange: `${slotStartTime} - ${slotEndTime}`,
        fee: feeNum,
        type: slotType,
        maxCapacity: capNum,
        mode: slotMode,
        location: slotLocation.trim(),
        description: slotDescription.trim() || 'Interactive mentoring and problem solving session.',
        prerequisites: slotPrerequisites.trim(),
        targetBatch: slotTargetBatch.trim(),
        registeredAttendees: [],
      });
      setSlots((prev) => [created, ...prev]);
      setExpandedSlotId(created.id);
      Alert.alert(
        'Time Slot Allocated & Published',
        `"${slotTitle}" (${slotDuration}, LKR ${feeNum.toLocaleString()}) is now visible to students for booking.`
      );
    }

    setModalVisible(false);
  };

  const handleDeleteSlot = (slot: TutorSlot) => {
    Alert.alert(
      'Delete Allocated Slot?',
      `Are you sure you want to remove "${slot.title}"?\n${
        (slot.registeredAttendees?.length || 0) > 0
          ? `Warning: ${slot.registeredAttendees?.length} student(s)/groups are already registered.`
          : ''
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await tutorSlotRepository.deleteSlot(slot.id);
            setSlots((prev) => prev.filter((s) => s.id !== slot.id));
          },
        },
      ]
    );
  };

  // Calculations for stats
  const totalSlotsCount = slots.length;
  const totalRegisteredCount = slots.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
  const totalPotentialFees = slots.reduce(
    (acc, s) => acc + ((s.fee || 0) * (s.bookedCount || (s.registeredAttendees?.length || 0))),
    0
  );
  const fullyBookedCount = slots.filter((s) => s.bookedCount >= s.maxCapacity).length;

  const filteredSlots = slots.filter((s) => {
    if (filterTab === '1-on-1') return s.type === '1-on-1' || s.type === 'both';
    if (filterTab === 'group') return s.type === 'group' || s.type === 'both';
    if (filterTab === 'booked') return (s.bookedCount || 0) > 0;
    return true;
  });

  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Top Header Bar (Matching Student Dashboard Style) */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            {navigation?.canGoBack?.() ? (
              <TouchableOpacity
                style={styles.headerBackButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.headerTitle}>Slot Allocation</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#061E47" />}
      >
        {/* Overview Stats Bar (4 Metrics) */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar" size={16} color="#1D4ED8" />
            </View>
            <Text style={styles.statVal}>{totalSlotsCount}</Text>
            <Text style={styles.statLbl}>Slots Open</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="people" size={16} color="#059669" />
            </View>
            <Text style={[styles.statVal, { color: '#059669' }]}>{totalRegisteredCount}</Text>
            <Text style={styles.statLbl}>Registered</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="wallet" size={16} color="#D97706" />
            </View>
            <Text style={[styles.statVal, { color: '#D97706' }]}>
              {totalPotentialFees >= 1000 ? `${(totalPotentialFees / 1000).toFixed(1)}k` : totalPotentialFees}
            </Text>
            <Text style={styles.statLbl}>Fees (LKR)</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="checkmark-done-circle" size={16} color="#DB2777" />
            </View>
            <Text style={[styles.statVal, { color: '#DB2777' }]}>{fullyBookedCount}</Text>
            <Text style={styles.statLbl}>Full Slots</Text>
          </View>
        </View>

        {/* Primary Schedule CTA Banner */}
        <TouchableOpacity
          style={styles.heroScheduleBanner}
          activeOpacity={0.88}
          onPress={handleOpenAddModal}
        >
          <View style={styles.heroLeft}>
            <View style={styles.plusIconWrap}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Allocate New Time Slot</Text>
              <Text style={styles.heroDesc}>
                Set topic, time duration, fee per student, & publish directly for bookings
              </Text>
            </View>
          </View>
          <View style={styles.heroArrow}>
            <Ionicons name="chevron-forward" size={18} color="#061E47" />
          </View>
        </TouchableOpacity>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {[
            { key: 'all', label: `All Slots (${slots.length})` },
            { key: 'group', label: 'Group Sessions' },
            { key: '1-on-1', label: '1-on-1' },
            { key: 'booked', label: 'Has Bookings' },
          ].map((tab) => {
            const active = filterTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, active && styles.filterPillActive]}
                onPress={() => setFilterTab(tab.key as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Slots List Header */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            ALLOCATED SLOTS & ATTENDEE LIST ({filteredSlots.length})
          </Text>
          <TouchableOpacity onPress={loadSlots}>
            <Text style={styles.syncText}>Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Slots Cards */}
        {filteredSlots.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No slots found for this filter</Text>
            <Text style={styles.emptyDesc}>
              Tap "Allocate New Time Slot" above to publish your availability and receive student bookings.
            </Text>
          </View>
        ) : (
          filteredSlots.map((slot) => {
            const isExpanded = expandedSlotId === slot.id;
            const attendees = slot.registeredAttendees || [];
            const capacityFilledPct = Math.min(
              100,
              Math.round(((slot.bookedCount || 0) / (slot.maxCapacity || 1)) * 100)
            );
            const isFull = (slot.bookedCount || 0) >= slot.maxCapacity;

            return (
              <View key={slot.id} style={styles.slotCard}>
                {/* Slot Top Meta Bar */}
                <View style={styles.slotTopRow}>
                  <View style={styles.moduleBadge}>
                    <Text style={styles.moduleBadgeText}>{slot.module}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.typeBadge,
                        slot.type === 'group'
                          ? { backgroundColor: '#ECFDF5' }
                          : slot.type === '1-on-1'
                          ? { backgroundColor: '#EFF6FF' }
                          : { backgroundColor: '#FFFBEB' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeBadgeText,
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

                    <View style={styles.feePill}>
                      <Text style={styles.feePillText}>LKR {(slot.fee || 0).toLocaleString()}</Text>
                    </View>
                  </View>
                </View>

                {/* Slot Title & Description */}
                <Text style={styles.slotTitleText}>{slot.title}</Text>
                {!!slot.description && (
                  <Text style={styles.slotDescriptionText} numberOfLines={isExpanded ? undefined : 2}>
                    {slot.description}
                  </Text>
                )}

                {/* Date, Time Duration & Location Grid */}
                <View style={styles.metaGrid}>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={15} color="#0D4F9E" />
                    <Text style={styles.metaBoldText}>{slot.timeRange}</Text>
                    <View style={styles.durationPill}>
                      <Text style={styles.durationPillText}>{slot.duration || '60 Mins'}</Text>
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={15} color="#64748B" />
                    <Text style={styles.metaText}>{slot.date}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Ionicons
                      name={slot.mode === 'In-Person' ? 'location-outline' : 'videocam-outline'}
                      size={15}
                      color="#64748B"
                    />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {slot.mode || 'Online'} • {slot.location || 'Microsoft Teams'}
                    </Text>
                  </View>
                </View>

                {/* Capacity Progress Bar */}
                <View style={styles.capacitySection}>
                  <View style={styles.capacityHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons
                        name="people"
                        size={14}
                        color={isFull ? '#EF4444' : '#059669'}
                      />
                      <Text style={styles.capacityText}>
                        {slot.bookedCount} of {slot.maxCapacity} Booked ({capacityFilledPct}%)
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.spotsLeftText,
                        isFull ? { color: '#EF4444' } : { color: '#059669' },
                      ]}
                    >
                      {isFull ? 'SLOT FULL' : `${slot.maxCapacity - slot.bookedCount} spots left`}
                    </Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${capacityFilledPct}%`,
                          backgroundColor: isFull ? '#EF4444' : '#059669',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Attendees Accordion Header */}
                <TouchableOpacity
                  style={styles.attendeesAccordionBtn}
                  onPress={() => setExpandedSlotId(isExpanded ? null : slot.id)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="people-circle-outline" size={18} color="#061E47" />
                    <Text style={styles.attendeesAccordionTitle}>
                      Registered Students / Groups ({attendees.length})
                    </Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>

                {/* Registered Students / Groups List */}
                {isExpanded && (
                  <View style={styles.attendeesListContainer}>
                    {attendees.length === 0 ? (
                      <View style={styles.noAttendeesBox}>
                        <Ionicons name="information-circle-outline" size={20} color="#94A3B8" />
                        <Text style={styles.noAttendeesText}>
                          No students registered yet for this slot. It is currently live and available in Find Your Mentor!
                        </Text>
                      </View>
                    ) : (
                      attendees.map((attendee, idx) => {
                        const verifiedPhoto = attendee.faceVerificationPhoto || attendee.studentAvatar;
                        return (
                        <View key={attendee.id || idx} style={styles.attendeeCard}>
                          <View style={styles.attendeeTopRow}>
                            <TouchableOpacity
                              activeOpacity={0.85}
                              style={styles.attendeeAvatarContainer}
                              onPress={() => {
                                setSelectedVerifiedAttendee(attendee);
                                setVerifiedPhotoModalVisible(true);
                              }}
                            >
                              {verifiedPhoto ? (
                                <Image
                                  source={{ uri: verifiedPhoto }}
                                  style={styles.attendeeAvatarImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.attendeeAvatarFallback}>
                                  <Text style={styles.attendeeAvatarInitials}>
                                    {(attendee.studentName || 'S')
                                      .split(' ')
                                      .map((n) => n[0])
                                      .slice(0, 2)
                                      .join('')
                                      .toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.attendeeVerifiedBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                              </View>
                            </TouchableOpacity>

                            <View style={{ flex: 1, marginLeft: 12 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text style={styles.attendeeName}>
                                  {attendee.studentName}
                                </Text>
                                <View style={styles.verifiedStudentPill}>
                                  <Ionicons name="shield-checkmark" size={10} color="#059669" />
                                  <Text style={styles.verifiedStudentPillText}>Verified</Text>
                                </View>
                                {attendee.bookingType === 'group' && (
                                  <View style={styles.groupBadge}>
                                    <Text style={styles.groupBadgeText}>
                                      Group of {attendee.groupSize || 1}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.attendeeEmail}>{attendee.studentEmail}</Text>
                              <TouchableOpacity
                                style={styles.viewVerifiedLink}
                                activeOpacity={0.7}
                                onPress={() => {
                                  setSelectedVerifiedAttendee(attendee);
                                  setVerifiedPhotoModalVisible(true);
                                }}
                              >
                                <Ionicons name="eye-outline" size={11} color="#0D4F9E" />
                                <Text style={styles.viewVerifiedLinkText}>View Verified Image</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={styles.confirmedStatusBadge}>
                              <Text style={styles.confirmedStatusText}>Confirmed</Text>
                            </View>
                          </View>

                          {/* Additional Attendee Info */}
                          <View style={styles.attendeeMetaRow}>
                            <Text style={styles.attendeeTimeText}>
                              Registered: {attendee.registeredAt}
                            </Text>
                            {attendee.feePaid !== undefined && (
                              <Text style={styles.attendeePaidText}>
                                Paid: LKR {attendee.feePaid.toLocaleString()}
                              </Text>
                            )}
                          </View>

                          {!!attendee.notes && (
                            <View style={styles.attendeeNotesBox}>
                              <Text style={styles.notesLabel}>STUDENT NOTES / TOPICS:</Text>
                              <Text style={styles.notesText}>{attendee.notes}</Text>
                            </View>
                          )}

                          {/* Quick Actions for Attendee */}
                          <View style={styles.attendeeActionsRow}>
                            <TouchableOpacity
                              style={styles.chatActionBtn}
                              onPress={() => {
                                Alert.alert(
                                  'Direct Message',
                                  `Opening direct chat with ${attendee.studentName}...`,
                                  [
                                    {
                                      text: 'Open Chat',
                                      onPress: () => (navigation as any).navigate('Messages'),
                                    },
                                    { text: 'Cancel', style: 'cancel' },
                                  ]
                                );
                              }}
                            >
                              <Text style={styles.chatActionText}>Message</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionBtnOutline}
                              onPress={() => {
                                Alert.alert(
                                  'Attendance',
                                  `Mark ${attendee.studentName} as Attended?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Mark Attended',
                                      onPress: () => Alert.alert('Success', 'Attendance recorded.'),
                                    },
                                  ]
                                );
                              }}
                            >
                              <Ionicons name="checkmark-done" size={13} color="#059669" />
                              <Text style={[styles.chatActionText, { color: '#059669' }]}>
                                Attendance
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                    )}
                  </View>
                )}

                {/* Slot Card Action Toolbar */}
                <View style={styles.slotCardFooter}>
                  <TouchableOpacity
                    style={styles.footerEditBtn}
                    onPress={() => handleOpenEditModal(slot)}
                  >
                    <Ionicons name="pencil-outline" size={14} color="#0D4F9E" />
                    <Text style={styles.footerEditText}>Edit Details & Fee</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.footerDeleteBtn}
                    onPress={() => handleDeleteSlot(slot)}
                  >
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                    <Text style={styles.footerDeleteText}>Remove Slot</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ──────────────────────────────────────────────────────────────────────── */}
      {/* ADD / EDIT SLOT MODAL                                                   */}
      {/* ──────────────────────────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {editingSlotId ? 'Edit Allocated Time Slot' : 'Allocate New Time Slot'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  Set slot topic, duration, fee, and capacity for student bookings
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={26} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* 1. Slot Title / Topic */}
              <Text style={styles.inputLabel}>SLOT SESSION TITLE / TOPIC *</Text>
              <TextInput
                style={styles.textInput}
                value={slotTitle}
                onChangeText={setSlotTitle}
                placeholder="e.g. Tree & Graph Traversals Problem Revision"
                placeholderTextColor="#94A3B8"
              />

              {/* 2. Module / Subject Selection */}
              <Text style={styles.inputLabel}>MODULE / COURSE CODE *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                {COMMON_MODULES.map((mod) => (
                  <TouchableOpacity
                    key={mod}
                    style={[
                      styles.choicePill,
                      slotModule === mod && styles.choicePillActive,
                    ]}
                    onPress={() => setSlotModule(mod)}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        slotModule === mod && styles.choicePillTextActive,
                      ]}
                    >
                      {mod}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 3. DATE SELECTION (TAP TO PICK - NO TYPING) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.inputLabel}>DATE (TAP TO PICK) *</Text>
                <Text style={styles.selectedDateBadge}>{slotDate.split(',')[0]}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePickerScroll}>
                {upcomingDatesList.map((item) => {
                  const isSelected = slotDate === item.formatted;
                  return (
                    <TouchableOpacity
                      key={item.formatted}
                      style={[styles.dateChipItem, isSelected && styles.dateChipItemActive]}
                      onPress={() => setSlotDate(item.formatted)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateChipDayText, isSelected && styles.dateChipDayTextActive]}>
                        {item.dayName}
                      </Text>
                      <Text style={[styles.dateChipNumText, isSelected && styles.dateChipNumTextActive]}>
                        {item.dateLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 4. START TIME SELECTION (TAP TO PICK - NO TYPING) */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>START TIME (TAP TO PICK) *</Text>
              <View style={styles.timeChipsGrid}>
                {TIME_OPTIONS.map((t) => {
                  const isSelected = slotStartTime === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeOptionChip, isSelected && styles.timeOptionChipActive]}
                      onPress={() => handleStartTimeChange(t)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.timeOptionChipText, isSelected && styles.timeOptionChipTextActive]}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 5. Duration Selector & Computed End Time */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>SESSION DURATION *</Text>
              <View style={styles.durationSelectorRow}>
                {DURATION_OPTIONS.map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    style={[
                      styles.durationOptionBtn,
                      slotDuration === dur && styles.durationOptionBtnActive,
                    ]}
                    onPress={() => handleDurationChange(dur)}
                  >
                    <Text
                      style={[
                        styles.durationOptionText,
                        slotDuration === dur && styles.durationOptionTextActive,
                      ]}
                    >
                      {dur}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Selected Schedule Preview Banner */}
              <View style={styles.schedulePreviewBanner}>
                <Text style={styles.schedulePreviewBannerLabel}>SCHEDULE PREVIEW:</Text>
                <Text style={styles.schedulePreviewBannerVal}>
                  {slotStartTime} - {slotEndTime} ({slotDuration})
                </Text>
              </View>

              {/* 5. Pricing / Fee Setting */}
              <Text style={styles.inputLabel}>SLOT BOOKING FEE (LKR) *</Text>
              <View style={styles.feeInputWrapper}>
                <Text style={styles.feeCurrencyPrefix}>LKR</Text>
                <TextInput
                  style={styles.feeTextInput}
                  value={slotFee}
                  onChangeText={setSlotFee}
                  keyboardType="numeric"
                  placeholder="2500"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.presetFeesRow}>
                {PRESET_FEES.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={styles.presetFeeBtn}
                    onPress={() => setSlotFee(String(preset))}
                  >
                    <Text style={styles.presetFeeText}>LKR {preset.toLocaleString()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 6. Session Type & Capacity */}
              <Text style={styles.inputLabel}>SESSION FORMAT & CAPACITY *</Text>
              <View style={styles.typeSelectorRow}>
                {[
                  { key: 'group', label: 'Group Session' },
                  { key: '1-on-1', label: '1-on-1 Exclusive' },
                  { key: 'both', label: 'Both (Flexible)' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.typeSelectorBtn,
                      slotType === item.key && styles.typeSelectorBtnActive,
                    ]}
                    onPress={() => {
                      setSlotType(item.key as any);
                      if (item.key === '1-on-1') setSlotCapacity('1');
                      else if (slotCapacity === '1') setSlotCapacity('5');
                    }}
                  >
                    <Text
                      style={[
                        styles.typeSelectorBtnText,
                        slotType === item.key && styles.typeSelectorBtnTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {slotType !== '1-on-1' && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.inputLabel}>MAX STUDENT CAPACITY</Text>
                  <TextInput
                    style={styles.textInput}
                    value={slotCapacity}
                    onChangeText={setSlotCapacity}
                    keyboardType="numeric"
                    placeholder="e.g. 5 students"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}

              {/* 7. Mode & Location */}
              <Text style={styles.inputLabel}>DELIVERY MODE & LOCATION *</Text>
              <View style={styles.modeSelectorRow}>
                {['Online', 'In-Person', 'Hybrid'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeBtn, slotMode === m && styles.modeBtnActive]}
                    onPress={() => {
                      setSlotMode(m as any);
                      if (m === 'Online') {
                        setSlotLocation('Microsoft Teams • Link Provided Upon Booking');
                      } else if (m === 'In-Person') {
                        setSlotLocation('SLIIT Malabe Campus • Computing Building Lab 402');
                      } else {
                        setSlotLocation('SLIIT Lab 402 & Online MS Teams Stream');
                      }
                    }}
                  >
                    <Text style={[styles.modeBtnText, slotMode === m && styles.modeBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={[styles.textInput, { marginTop: 6 }]}
                value={slotLocation}
                onChangeText={setSlotLocation}
                placeholder="Meeting Link / Classroom location"
                placeholderTextColor="#94A3B8"
              />

              {/* 8. Detailed Description & Agenda */}
              <Text style={styles.inputLabel}>SESSION DESCRIPTION & TOPICS COVERED *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={slotDescription}
                onChangeText={setSlotDescription}
                multiline
                numberOfLines={3}
                placeholder="Detail what students will learn, sample past paper problems to be solved, and session agenda..."
                placeholderTextColor="#94A3B8"
              />

              {/* 9. Prerequisites & Target Batch */}
              <Text style={styles.inputLabel}>PREREQUISITES & TARGET BATCH</Text>
              <TextInput
                style={styles.textInput}
                value={slotPrerequisites}
                onChangeText={setSlotPrerequisites}
                placeholder="e.g. Bring laptops with MySQL Workbench installed"
                placeholderTextColor="#94A3B8"
              />
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                value={slotTargetBatch}
                onChangeText={setSlotTargetBatch}
                placeholder="e.g. Year 2 Sem 2, All Computing students"
                placeholderTextColor="#94A3B8"
              />

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Modal Bottom Save Action */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                activeOpacity={0.88}
                onPress={handleSaveSlot}
              >
                <Text style={styles.modalSubmitText}>
                  {editingSlotId ? 'Update Slot' : 'Publish Slot Live'}
                </Text>
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
    backgroundColor: '#F4F7FB',
  },
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
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
    padding: 16,
    paddingBottom: 32,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#061E47',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F1F5F9',
  },
  heroScheduleBanner: {
    backgroundColor: '#EAA023',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#EAA023',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  plusIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#061E47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061E47',
  },
  heroDesc: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
    lineHeight: 15,
  },
  heroArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  slotTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  moduleBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '55%',
  },
  moduleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#061E47',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  feePill: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  feePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  slotTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 4,
  },
  slotDescriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  metaGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaBoldText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D4F9E',
  },
  durationPill: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  durationPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    flex: 1,
  },
  capacitySection: {
    marginBottom: 12,
  },
  capacityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  spotsLeftText: {
    fontSize: 11,
    fontWeight: '800',
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
  attendeesAccordionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginBottom: 8,
  },
  attendeesAccordionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#061E47',
  },
  attendeesListContainer: {
    gap: 10,
    marginBottom: 12,
  },
  noAttendeesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noAttendeesText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
  attendeeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attendeeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeeAvatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  attendeeAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  attendeeAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D4F9E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  attendeeAvatarInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  attendeeVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  verifiedStudentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedStudentPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  viewVerifiedLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  viewVerifiedLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  attendeeName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  groupBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  groupBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  attendeeEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  confirmedStatusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  confirmedStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  attendeeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attendeeTimeText: {
    fontSize: 11,
    color: '#64748B',
  },
  attendeePaidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  attendeeNotesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#EAA023',
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 11,
    color: '#334155',
    marginTop: 2,
  },
  attendeeActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chatActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  slotCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 4,
  },
  footerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  footerEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D4F9E',
  },
  footerDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  footerDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#061E47',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalFormScroll: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  twoColRow: {
    flexDirection: 'row',
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  choicePillActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  choicePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  choicePillTextActive: {
    color: '#FFFFFF',
  },
  durationSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  durationOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationOptionBtnActive: {
    backgroundColor: '#0D4F9E',
    borderColor: '#0D4F9E',
  },
  durationOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  durationOptionTextActive: {
    color: '#FFFFFF',
  },
  computedEndText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  feeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  feeCurrencyPrefix: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0D4F9E',
    marginRight: 8,
  },
  feeTextInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  presetFeesRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  presetFeeBtn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  presetFeeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectorBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typeSelectorBtnActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  typeSelectorBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  typeSelectorBtnTextActive: {
    color: '#FFFFFF',
  },
  modeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeBtnActive: {
    backgroundColor: '#0D4F9E',
    borderColor: '#0D4F9E',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modeBtnTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#EAA023',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#061E47',
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
    backgroundColor: '#F59E0B',
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
  selectedDateBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  datePickerScroll: {
    paddingVertical: 6,
    gap: 8,
  },
  dateChipItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    minWidth: 70,
  },
  dateChipItemActive: {
    backgroundColor: '#061E47',
    borderColor: '#F59E0B',
  },
  dateChipDayText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dateChipDayTextActive: {
    color: '#F59E0B',
  },
  dateChipNumText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 2,
  },
  dateChipNumTextActive: {
    color: '#FFFFFF',
  },
  timeChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeOptionChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: 78,
    alignItems: 'center',
  },
  timeOptionChipActive: {
    backgroundColor: '#061E47',
    borderColor: '#F59E0B',
  },
  timeOptionChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  timeOptionChipTextActive: {
    color: '#F59E0B',
  },
  schedulePreviewBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  schedulePreviewBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  schedulePreviewBannerVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
});

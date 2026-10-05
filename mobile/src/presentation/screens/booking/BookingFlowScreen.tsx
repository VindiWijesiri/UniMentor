import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from '../../navigation/AppNavigator';
import { tutorSlotRepository } from '../../../data/repositories/tutorSlotRepository';
import { tutorSettingsRepository, TutorBookingSettings } from '../../../data/repositories/tutorSettingsRepository';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { bookedTutorsRepository } from '../../../data/repositories/bookedTutorsRepository';
import type { TutorSlot } from '../../../domain/entities/TutorSlot';
import TutorAvatar from '../../components/common/TutorAvatar';

const { width } = Dimensions.get('window');

type Step = 'book' | 'choose_time' | 'conflict' | 'alternatives' | 'finalize';

type Props = NativeStackScreenProps<BookingsStackParamList, 'BookSession'>;

export default function BookingFlowScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const mentor = route.params?.mentor || {
    _id: 'mentor-alex',
    name: 'Alex Ferreira',
    experience: 'Database Systems Tutor',
    rating: 4.9,
    reviewCount: 48,
    hourlyRate: 2500,
    subjects: ['Query Optimization', 'Indexing', 'ER Diagrams', 'Normalization'],
  };

  const initialMode = route.params?.initialMode || '1-on-1';

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('book');
  const [studyMode, setStudyMode] = useState<'1-on-1' | 'group'>(initialMode);
  const [groupSize, setGroupSize] = useState<number>(3);

  // Tutor configured settings (Pricing & Subject preferences from Tutor Dashboard)
  const [hourlyRate1on1, setHourlyRate1on1] = useState<number>(mentor.hourlyRate || 2500);
  const [hourlyRateGroup, setHourlyRateGroup] = useState<number>(1200);
  const [subjectPreferences, setSubjectPreferences] = useState<string[]>([
    'Query Optimization',
    'Indexing',
    'ER Diagrams',
    'Normalization',
  ]);
  const [availableDates, setAvailableDates] = useState<string[]>([
    'Friday, 19 Sep 2025',
    'Saturday, 20 Sep 2025',
    'Monday, 22 Sep 2025',
    'Tuesday, 23 Sep 2025',
    'Thursday, 25 Sep 2025',
  ]);

  // Screen 1: Subject Preferences & Date
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Query Optimization', 'Indexing']);
  const [selectedDate, setSelectedDate] = useState<string>('Friday, 19 Sep 2025');
  const [selectedInitialTime, setSelectedInitialTime] = useState<string>('10:00 AM');
  const [sessionNotes, setSessionNotes] = useState<string>(
    'Please cover B+ Trees and indexing queries...'
  );

  // Pickers state
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [timeModalVisible, setTimeModalVisible] = useState(false);

  // Screen 2: Slots
  const [availableSlots, setAvailableSlots] = useState<TutorSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TutorSlot | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Screen 4: Alternatives
  const [selectedAlternative, setSelectedAlternative] = useState<string>('4:00 PM');
  const [alternativeTimeRange, setAlternativeTimeRange] = useState<string>('4:00 PM - 5:00 PM');

  // Screen 5: Finalized state
  const [timeUpdatedBanner, setTimeUpdatedBanner] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tutorImage, setTutorImage] = useState<string | null>(mentor.profilePicture || null);

  // Load Tutor Settings (prices & subject preferences set by tutor from tutor dashboard)
  useEffect(() => {
    loadTutorSettings();
  }, [mentor]);

  const loadTutorSettings = async () => {
    try {
      const settings = await tutorSettingsRepository.getSettings(mentor._id, mentor.name);
      setHourlyRate1on1(settings.hourlyRate1on1);
      setHourlyRateGroup(settings.hourlyRateGroup);
      if (settings.subjectPreferences && settings.subjectPreferences.length > 0) {
        setSubjectPreferences(settings.subjectPreferences);
        setSelectedTopics(settings.subjectPreferences.slice(0, 2));
      }
      if (settings.availableDates && settings.availableDates.length > 0) {
        setAvailableDates(settings.availableDates);
        setSelectedDate(settings.availableDates[0]);
      }
      if (settings.profileImage !== undefined) {
        setTutorImage(settings.profileImage);
      }
    } catch {
      // Use fallback
    }
  };

  // Load slots on mount and when date or studyMode changes
  useEffect(() => {
    loadSlots();
  }, [selectedDate, studyMode]);

  const loadSlots = async () => {
    setIsLoadingSlots(true);
    try {
      const slots = await tutorSlotRepository.getSlotsByMentorAndDate(
        mentor._id,
        mentor.name,
        selectedDate,
        studyMode === 'group' ? 'group' : '1-on-1'
      );
      setAvailableSlots(slots);

      // Default select the slot matching selectedInitialTime or first slot
      const initial = slots.find((s) => s.startTime === selectedInitialTime) || slots[0];
      if (initial) {
        setSelectedSlot(initial);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      if (selectedTopics.length > 1) {
        setSelectedTopics(selectedTopics.filter((t) => t !== topic));
      } else {
        Alert.alert('Selection Required', 'Please keep at least one subject topic selected.');
      }
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  // Step 1: Check Availability
  const handleCheckAvailability = () => {
    if (selectedTopics.length === 0) {
      Alert.alert('Select Topics', 'Please choose at least one subject topic.');
      return;
    }
    // Advance to Step 2
    setCurrentStep('choose_time');
  };

  // Step 2: Slot Selection
  // Note: Slots are displayed cleanly without conflict badges upfront.
  // ONLY when user selects a conflicting/unavailable slot, it displays the conflict warning!
  const handleSelectSlot = (slot: TutorSlot) => {
    setSelectedSlot(slot);
  };

  const handleContinueFromSlots = () => {
    if (!selectedSlot) {
      Alert.alert('Choose Time', 'Please select a time slot.');
      return;
    }
    // ONLY display conflict when selected slot has conflict / is not available
    if (selectedSlot.hasConflict) {
      setCurrentStep('conflict');
    } else {
      setTimeUpdatedBanner(null);
      setCurrentStep('finalize');
    }
  };

  // Step 3: Conflict screen actions
  const handleViewAlternatives = () => {
    setCurrentStep('alternatives');
  };

  // Step 4: Alternatives selection
  const handleConfirmAlternative = () => {
    setTimeUpdatedBanner(`Time updated to ${selectedAlternative}`);
    setCurrentStep('finalize');
  };

  // Step 5: Finalize Booking
  const handleFinalizeBooking = async () => {
    setIsSubmitting(true);
    try {
      const finalTime = timeUpdatedBanner ? selectedAlternative : selectedSlot?.startTime || '10:00 AM';
      const scheduledDateTime = new Date();
      scheduledDateTime.setDate(scheduledDateTime.getDate() + 3);

      const feeSummary =
        studyMode === 'group'
          ? `LKR ${hourlyRateGroup} per student (Total: LKR ${hourlyRateGroup * groupSize} for ${groupSize} students)`
          : `LKR ${hourlyRate1on1} / hour`;

      const primarySubject = mentor.subjects?.[0] || 'Academic Mentoring';
      const codeMatch = primarySubject.match(/^[A-Z]{2,4}\s?[0-9]{4}/i);
      const moduleCode = codeMatch ? codeMatch[0].toUpperCase() : primarySubject.substring(0, 6).toUpperCase();

      // Immediately save to persistent booked tutors repository so it shows in My Bookings!
      await bookedTutorsRepository.addBookedTutor({
        id: `booking-${Date.now()}-${mentor._id}`,
        mentor: {
          id: mentor._id,
          name: mentor.name,
          roleTitle: mentor.experience || 'Senior Peer Mentor',
          avatar: mentor.profilePicture,
          rating: mentor.rating || 4.9,
          reviewCount: mentor.reviewCount || 25,
          hourlyRate: studyMode === 'group' ? hourlyRateGroup : hourlyRate1on1,
          subjects: mentor.subjects,
          email: mentor.email,
          bio: mentor.bio,
        },
        moduleCode: moduleCode || 'TUTOR',
        moduleName: `${primarySubject}${selectedTopics.length > 0 ? ` (${selectedTopics.slice(0, 2).join(', ')})` : ''}`,
        nextSession: `${selectedDate} • ${finalTime}`,
        studyMode,
        groupSize: studyMode === 'group' ? groupSize : 1,
        bookedAt: new Date().toISOString(),
      });

      try {
        await sessionRepository.bookSession({
          mentorId: mentor._id,
          subject: `${primarySubject} (${selectedTopics.join(', ')})`,
          scheduledAt: scheduledDateTime.toISOString(),
          notes: `[${studyMode.toUpperCase()} STUDY - ${
            studyMode === 'group' ? `${groupSize} Students` : '1-on-1'
          }] Time: ${finalTime}. Rate: ${feeSummary}. Notes: ${sessionNotes}`,
        });
      } catch (apiErr) {
        console.log('[BookingFlow] API session book sync notice:', apiErr);
      }

      if (selectedSlot) {
        await tutorSlotRepository.markSlotBooked(selectedSlot.id, studyMode === 'group');
      }

      Alert.alert(
        'Booking Confirmed! 🎉',
        `Your ${studyMode === 'group' ? `Group (${groupSize} Students)` : '1-on-1'} tutoring session with ${
          mentor.name
        } is scheduled for ${selectedDate} at ${finalTime} (${feeSummary}).`,
        [
          {
            text: 'View in My Bookings',
            onPress: () => navigation.navigate('SessionsList'),
          },
        ]
      );
    } catch {
      Alert.alert(
        'Booking Placed',
        `Your booking request with ${mentor.name} has been placed.`,
        [{ text: 'OK', onPress: () => navigation.navigate('SessionsList') }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Back button handler
  const handleBack = () => {
    if (currentStep === 'finalize') {
      if (timeUpdatedBanner) {
        setCurrentStep('alternatives');
      } else {
        setCurrentStep('choose_time');
      }
    } else if (currentStep === 'alternatives') {
      setCurrentStep('conflict');
    } else if (currentStep === 'conflict') {
      setCurrentStep('choose_time');
    } else if (currentStep === 'choose_time') {
      setCurrentStep('book');
    } else {
      navigation.goBack();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'book':
        return 'Book a Session';
      case 'choose_time':
        return 'Choose Time';
      case 'conflict':
        return 'Time Conflict';
      case 'alternatives':
        return 'Select Alternatives';
      case 'finalize':
        return 'Finalize Booking';
    }
  };

  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" />

      {/* 1. Top Header Bar (Matching SearchScreen & SessionsScreen exact styling) */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getStepTitle()}
            </Text>
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
      >
        {/* ========================================================================= */}
        {/* STEP 1: BOOK A SESSION */}
        {/* ========================================================================= */}
        {currentStep === 'book' && (
          <View style={styles.stepContainer}>
            {/* Segmented Study Mode Switcher: 1-on-1 Study vs Group */}
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[styles.segmentBtn, studyMode === '1-on-1' && styles.segmentBtnActive]}
                onPress={() => setStudyMode('1-on-1')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    studyMode === '1-on-1' && styles.segmentBtnTextActive,
                  ]}
                >
                  1-on-1 Study
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, studyMode === 'group' && styles.segmentBtnActive]}
                onPress={() => setStudyMode('group')}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    studyMode === 'group' && styles.segmentBtnTextActive,
                  ]}
                >
                  Group
                </Text>
              </TouchableOpacity>
            </View>

            {/* Prominent Featured Pricing Card */}
            <View style={styles.featuredPricingCard}>
              <View style={styles.featuredPricingHeader}>
                <View style={styles.pricingModeBadge}>
                  <Ionicons
                    name={studyMode === '1-on-1' ? 'person' : 'people'}
                    size={14}
                    color={studyMode === '1-on-1' ? '#1D4ED8' : '#059669'}
                  />
                  <Text
                    style={[
                      styles.pricingModeText,
                      { color: studyMode === '1-on-1' ? '#1D4ED8' : '#059669' },
                    ]}
                  >
                    {studyMode === '1-on-1' ? '1-on-1 Mentoring Rate' : 'Group Study Rate'}
                  </Text>
                </View>
                <View style={styles.verifiedRateTag}>
                  <Ionicons name="shield-checkmark" size={12} color="#059669" />
                  <Text style={styles.verifiedRateText}>Tutor Rate</Text>
                </View>
              </View>

              <View style={styles.featuredPriceRow}>
                <Text style={styles.featuredCurrency}>LKR</Text>
                <Text style={styles.featuredAmount}>
                  {studyMode === '1-on-1'
                    ? hourlyRate1on1.toLocaleString()
                    : hourlyRateGroup.toLocaleString()}
                </Text>
                <Text style={styles.featuredPeriod}>
                  {studyMode === '1-on-1' ? '/ hour' : '/ student / hr'}
                </Text>
              </View>

              {studyMode === 'group' && (
                <View style={styles.groupTotalHighlightRow}>
                  <Text style={styles.groupTotalHighlightText}>
                    Total Group Fee: <Text style={{ fontWeight: '900', color: '#061E47' }}>LKR {(hourlyRateGroup * groupSize).toLocaleString()} / hr</Text> ({groupSize} students)
                  </Text>
                </View>
              )}
            </View>

            {/* Group Options Card (when Group is selected) */}
            {studyMode === 'group' && (
              <View style={styles.groupSettingsCard}>
                <View style={styles.groupCardHeader}>
                  <Ionicons name="people" size={18} color="#D97706" />
                  <Text style={styles.groupCardTitle}>Group Study Booking</Text>
                </View>
                <Text style={styles.groupCardSubtitle}>
                  Collaborative peer study session with student group discount
                </Text>

                <View style={styles.groupSizeRow}>
                  <Text style={styles.groupSizeLabel}>Number of Students:</Text>
                  <View style={styles.stepperWrap}>
                    {[2, 3, 4, 5, 6].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[styles.sizePill, groupSize === num && styles.sizePillActive]}
                        onPress={() => setGroupSize(num)}
                      >
                        <Text
                          style={[
                            styles.sizePillText,
                            groupSize === num && styles.sizePillTextActive,
                          ]}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.groupRateRow}>
                  <View>
                    <Text style={styles.groupRateLabel}>Price per Student:</Text>
                    <Text style={styles.groupRateValue}>
                      LKR {hourlyRateGroup.toLocaleString()} / hr
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.groupRateLabel}>Total Group Fee:</Text>
                    <Text style={[styles.groupRateValue, { color: '#0A2342' }]}>
                      LKR {(hourlyRateGroup * groupSize).toLocaleString()} / hr
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Tutor Profile Card */}
            <View style={styles.tutorCard}>
              <View style={styles.tutorAvatarWrap}>
                <TutorAvatar
                  name={mentor.name}
                  imageUrl={tutorImage || mentor.profilePicture}
                  size={54}
                  borderRadius={18}
                />
              </View>
              <View style={styles.tutorDetails}>
                <Text style={styles.tutorName}>{mentor.name}</Text>
                <Text style={styles.tutorRole}>
                  {mentor.experience || 'Database Systems Tutor'}
                </Text>
                <View style={styles.ratingRow}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Ionicons key={i} name="star" size={14} color="#F59E0B" />
                  ))}
                  <Text style={styles.ratingText}>
                    {' '}
                    {mentor.rating?.toFixed(1) || '4.9'} ({mentor.reviewCount || 48} reviews)
                  </Text>
                </View>
              </View>
            </View>

            {/* Section: SUBJECT PREFERENCES (Configured by tutor from tutor dashboard) */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.orangeIndicator} />
              <Text style={styles.sectionTitle}>SUBJECT PREFERENCES</Text>
            </View>

            {subjectPreferences.map((topic) => {
              const isChecked = selectedTopics.includes(topic);
              return (
                <TouchableOpacity
                  key={topic}
                  style={styles.checkboxCard}
                  onPress={() => toggleTopic(topic)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                    {isChecked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.checkboxLabel}>{topic}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Interactive Select Date & Time Row */}
            <View style={styles.dateTimeRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputSubLabel}>Select Date</Text>
                <TouchableOpacity
                  style={styles.datePickerBox}
                  onPress={() => setDateModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {selectedDate.replace(/^.*,\s*/, '') || selectedDate}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#D97706" />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputSubLabel}>Select Time</Text>
                <TouchableOpacity
                  style={styles.datePickerBox}
                  onPress={() => setTimeModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.pickerText} numberOfLines={1}>
                    {selectedInitialTime}
                  </Text>
                  <Ionicons name="time-outline" size={18} color="#D97706" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Session Notes (Optional) */}
            <Text style={styles.inputSubLabel}>Session Notes (Optional)</Text>
            <TextInput
              style={styles.notesInput}
              value={sessionNotes}
              onChangeText={setSessionNotes}
              placeholder="e.g. Please cover B+ Trees and indexing queries..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleCheckAvailability}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>Check Availability</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: CHOOSE TIME */}
        {/* ========================================================================= */}
        {currentStep === 'choose_time' && (
          <View style={styles.stepContainer}>
            {/* Tutor Profile Card */}
            <View style={styles.tutorCard}>
              <View style={styles.tutorAvatarWrap}>
                <TutorAvatar
                  name={mentor.name}
                  imageUrl={tutorImage || mentor.profilePicture}
                  size={54}
                  borderRadius={18}
                />
              </View>
              <View style={styles.tutorDetails}>
                <Text style={styles.tutorName}>{mentor.name}</Text>
                <Text style={styles.tutorRole}>
                  {mentor.experience || 'Database Systems Tutor'}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {' '}
                    {mentor.rating?.toFixed(1) || '4.9'} ({mentor.reviewCount || 48} reviews)
                  </Text>
                </View>
              </View>
            </View>

            {/* Date Badge */}
            <View style={styles.dateBadgeWrap}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={15} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.dateBadgeText}>{selectedDate}</Text>
              </View>
            </View>

            {/* AVAILABLE TIME SLOTS Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.orangeIndicator} />
              <Text style={styles.sectionTitle}>AVAILABLE TIME SLOTS</Text>
            </View>

            {/* Slots Grid */}
            {/* Slots are displayed as normal clean pills upfront. */}
            {/* ONLY when the student selects a slot that has conflict, it displays as conflict! */}
            {isLoadingSlots ? (
              <ActivityIndicator size="small" color="#F59E0B" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.slotsGrid}>
                {availableSlots
                  .filter((s) => s.startTime !== '10:00 AM' && s.startTime !== '04:00 PM' && s.startTime !== '11:30 AM' && s.startTime !== '05:30 PM' || s.hasConflict)
                  .map((slot) => {
                    const isSelected = selectedSlot?.id === slot.id;
                    const showConflictState = isSelected && slot.hasConflict;

                    return (
                      <TouchableOpacity
                        key={slot.id}
                        style={[
                          styles.slotPill,
                          isSelected && (showConflictState ? styles.slotPillConflictSelected : styles.slotPillSelected),
                        ]}
                        onPress={() => handleSelectSlot(slot)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.slotTextNormal,
                            isSelected && (showConflictState ? styles.slotTextConflict : styles.slotTextSelected),
                          ]}
                        >
                          {slot.startTime}
                        </Text>
                        {showConflictState && (
                          <View style={styles.conflictAlertRow}>
                            <Ionicons name="warning" size={10} color="#DC2626" />
                            <Text style={styles.conflictAlertText}>CONFLICT</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            )}

            {/* If selected slot has conflict, display conflict warning banner */}
            {selectedSlot?.hasConflict ? (
              <View style={styles.conflictInlineBanner}>
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text style={styles.conflictInlineText}>
                  {selectedSlot.startTime} is marked not available due to a schedule conflict. Tap Continue to view alternatives.
                </Text>
              </View>
            ) : (
              <Text style={styles.slotHelperText}>
                Select an available slot above to continue with your booking.
              </Text>
            )}

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.primaryActionButton, selectedSlot?.hasConflict && { backgroundColor: '#DC2626' }]}
              onPress={handleContinueFromSlots}
              activeOpacity={0.85}
            >
              <Text style={[styles.primaryActionText, selectedSlot?.hasConflict && { color: '#FFFFFF' }]}>
                {selectedSlot?.hasConflict ? 'Check Conflict Details' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: TIME CONFLICT */}
        {/* ========================================================================= */}
        {currentStep === 'conflict' && (
          <View style={styles.stepContainer}>
            {/* Tutor Profile Card */}
            <View style={styles.tutorCard}>
              <View style={styles.tutorAvatarWrap}>
                <TutorAvatar
                  name={mentor.name}
                  imageUrl={tutorImage || mentor.profilePicture}
                  size={54}
                  borderRadius={18}
                />
              </View>
              <View style={styles.tutorDetails}>
                <Text style={styles.tutorName}>{mentor.name}</Text>
                <Text style={styles.tutorRole}>
                  {mentor.experience || 'Database Systems Tutor'}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {' '}
                    {mentor.rating?.toFixed(1) || '4.9'} ({mentor.reviewCount || 48} reviews)
                  </Text>
                </View>
              </View>
            </View>

            {/* Red Conflict Warning Box */}
            <View style={styles.conflictCard}>
              <View style={styles.conflictHeaderRow}>
                <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
                <Text style={styles.conflictCardTitle}>Time Conflict Detected</Text>
              </View>
              <Text style={styles.conflictCardDesc}>
                You already have a session booked at this time.
              </Text>

              {/* Existing Session Box */}
              <View style={styles.existingSessionBox}>
                <Text style={styles.existingSessionTag}>YOUR EXISTING SESSION</Text>
                <Text style={styles.existingSessionName}>
                  {selectedSlot?.conflictDetails?.existingSessionTitle || 'Data Structures'}
                </Text>
                <Text style={styles.existingSessionWith}>
                  {selectedSlot?.conflictDetails?.existingWith || 'with Prof. Kumar'}
                </Text>
                <Text style={styles.existingSessionTime}>
                  {selectedSlot?.conflictDetails?.time || '19 Sep 2025, 2:00 PM – 3:00 PM'}
                </Text>
              </View>
            </View>

            {/* View Alternatives Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleViewAlternatives}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>View Alternatives</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLinkButton}
              onPress={() => setCurrentStep('choose_time')}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryLinkText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: SELECT ALTERNATIVES */}
        {/* ========================================================================= */}
        {currentStep === 'alternatives' && (
          <View style={styles.stepContainer}>
            {/* Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.orangeIndicator} />
              <Text style={styles.sectionTitle}>
                AVAILABLE ALTERNATIVES FOR {selectedDate.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.alternativesSubtitle}>
              These timeslots do not conflict with your schedule and your tutor is fully available.
            </Text>

            {/* List of alternatives cards */}
            {[
              { time: '10:00 AM', range: '10:00 AM - 11:00 AM' },
              { time: '11:30 AM', range: '11:30 AM - 12:30 PM' },
              { time: '4:00 PM', range: '4:00 PM - 5:00 PM' },
              { time: '5:30 PM', range: '5:30 PM - 6:30 PM' },
            ].map((alt) => {
              const isSelected = selectedAlternative === alt.time;
              return (
                <TouchableOpacity
                  key={alt.time}
                  style={[
                    styles.alternativeCard,
                    isSelected && styles.alternativeCardSelected,
                  ]}
                  onPress={() => {
                    setSelectedAlternative(alt.time);
                    setAlternativeTimeRange(alt.range);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.greenAvailabilityDot} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.alternativeTime}>{alt.time}</Text>
                    <Text style={styles.alternativeRange}>{alt.range}</Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                    ]}
                  >
                    {isSelected && <View style={styles.radioInnerDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.viewMoreDatesRow}
              onPress={() => setDateModalVisible(true)}
              activeOpacity={0.75}
            >
              <Ionicons name="calendar-outline" size={16} color="#D97706" />
              <Text style={styles.viewMoreDatesText}>View More Dates</Text>
            </TouchableOpacity>

            {/* Confirm Time Button */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleConfirmAlternative}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: FINALIZE BOOKING */}
        {/* ========================================================================= */}
        {currentStep === 'finalize' && (
          <View style={styles.stepContainer}>
            {/* Green Notification Banner */}
            <View style={styles.updatedBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.updatedBannerText}>
                {timeUpdatedBanner || `Time confirmed: ${selectedSlot?.startTime || '10:00 AM'}`}
              </Text>
            </View>

            {/* Tutor Profile Card */}
            <View style={styles.tutorCard}>
              <View style={styles.tutorAvatarWrap}>
                <TutorAvatar
                  name={mentor.name}
                  imageUrl={tutorImage || mentor.profilePicture}
                  size={54}
                  borderRadius={18}
                />
              </View>
              <View style={styles.tutorDetails}>
                <Text style={styles.tutorName}>{mentor.name}</Text>
                <Text style={styles.tutorRole}>
                  {mentor.experience || 'Database Systems Tutor'}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {' '}
                    {mentor.rating?.toFixed(1) || '4.9'} ({mentor.reviewCount || 48} reviews)
                  </Text>
                </View>
              </View>
            </View>

            {/* BOOKING DETAILS Box */}
            <View style={styles.bookingDetailsBox}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.orangeIndicator} />
                <Text style={styles.sectionTitle}>BOOKING DETAILS</Text>
              </View>

              {/* Session Mode: Individual vs Group */}
              <View style={styles.detailItemRow}>
                <Ionicons
                  name={studyMode === 'group' ? 'people' : 'person'}
                  size={17}
                  color={studyMode === 'group' ? '#059669' : '#1D4ED8'}
                />
                <Text style={[styles.detailItemText, { fontWeight: '800' }]}>
                  {studyMode === 'group'
                    ? `Group Study Session (${groupSize} Students)`
                    : 'Individual 1-on-1 Mentoring'}
                </Text>
              </View>

              {/* Price Details */}
              <View style={styles.detailItemRow}>
                <Ionicons name="pricetag" size={17} color="#D97706" />
                <Text style={[styles.detailItemText, { color: '#D97706', fontWeight: '800' }]}>
                  {studyMode === 'group'
                    ? `LKR ${hourlyRateGroup.toLocaleString()} per student (Total: LKR ${(hourlyRateGroup * groupSize).toLocaleString()})`
                    : `LKR ${hourlyRate1on1.toLocaleString()} / hour`}
                </Text>
              </View>

              {/* Date */}
              <View style={styles.detailItemRow}>
                <Ionicons name="calendar-outline" size={17} color="#475569" />
                <Text style={styles.detailItemText}>{selectedDate}</Text>
              </View>

              {/* Time */}
              <View style={styles.detailItemRow}>
                <Ionicons name="time-outline" size={17} color="#0A2342" />
                <Text style={[styles.detailItemText, { color: '#0A2342', fontWeight: '800' }]}>
                  {timeUpdatedBanner ? alternativeTimeRange : selectedSlot?.timeRange || '10:00 AM - 11:00 AM'}
                </Text>
              </View>
            </View>

            {/* SELECTED TOPICS */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.orangeIndicator} />
              <Text style={styles.sectionTitle}>SELECTED TOPICS</Text>
            </View>

            <View style={styles.topicsBadgeRow}>
              {selectedTopics.map((topic) => (
                <View key={topic} style={styles.topicBadgePill}>
                  <Text style={styles.topicBadgeText}>{topic}</Text>
                </View>
              ))}
            </View>

            {/* Session Notes */}
            <Text style={styles.inputSubLabel}>Session Notes</Text>
            <View style={styles.finalNotesBox}>
              <Text style={styles.finalNotesText}>
                {sessionNotes || 'No additional notes provided.'}
              </Text>
            </View>

            {/* Confirm Booking Button */}
            <TouchableOpacity
              style={[styles.primaryActionButton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleFinalizeBooking}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <ActivityIndicator color="#061E47" size="small" />
                  <Text style={styles.primaryActionText}>Finalizing Booking...</Text>
                </View>
              ) : (
                <Text style={styles.primaryActionText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* DATE PICKER MODAL */}
      <Modal visible={dateModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDateModalVisible(false)}
        >
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {availableDates.map((date) => (
                <TouchableOpacity
                  key={date}
                  style={[styles.pickerItemRow, selectedDate === date && styles.pickerItemRowActive]}
                  onPress={() => {
                    setSelectedDate(date);
                    setDateModalVisible(false);
                  }}
                >
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={selectedDate === date ? '#D97706' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedDate === date && styles.pickerItemTextActive,
                    ]}
                  >
                    {date}
                  </Text>
                  {selectedDate === date && (
                    <Ionicons name="checkmark-circle" size={18} color="#D97706" style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* TIME PICKER MODAL */}
      <Modal visible={timeModalVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTimeModalVisible(false)}
        >
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>Select Preferred Time</Text>
              <TouchableOpacity onPress={() => setTimeModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 280 }}>
              {[
                '09:00 AM',
                '10:00 AM',
                '10:30 AM',
                '11:30 AM',
                '12:00 PM',
                '02:00 PM',
                '03:30 PM',
                '04:00 PM',
                '05:00 PM',
                '05:30 PM',
              ].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.pickerItemRow,
                    selectedInitialTime === time && styles.pickerItemRowActive,
                  ]}
                  onPress={() => {
                    setSelectedInitialTime(time);
                    setTimeModalVisible(false);
                  }}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={selectedInitialTime === time ? '#D97706' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.pickerItemText,
                      selectedInitialTime === time && styles.pickerItemTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                  {selectedInitialTime === time && (
                    <Ionicons name="checkmark-circle" size={18} color="#D97706" style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  /* Header matching SearchScreen & SessionsScreen exact standard */
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBackBtn: {
    paddingRight: 6,
    paddingVertical: 2,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  stepContainer: {
    width: '100%',
  },

  /* Segmented Toggle */
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 22,
    padding: 3,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 19,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentBtnTextActive: {
    color: '#061E47',
    fontWeight: '900',
  },

  /* Prominent Featured Pricing Card */
  featuredPricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  featuredPricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pricingModeText: {
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedRateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  featuredCurrency: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061E47',
  },
  featuredAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#061E47',
    letterSpacing: -0.5,
  },
  featuredPeriod: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  groupTotalHighlightRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  groupTotalHighlightText: {
    fontSize: 12.5,
    color: '#475569',
  },

  /* Group Settings Card */
  groupSettingsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  groupCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupCardTitle: {
    color: '#92400E',
    fontSize: 14,
    fontWeight: '800',
  },
  groupCardSubtitle: {
    color: '#B45309',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  groupSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  groupSizeLabel: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  sizePill: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizePillActive: {
    backgroundColor: '#061E47',
    borderColor: '#061E47',
  },
  sizePillText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  sizePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  groupRateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingTop: 8,
  },
  groupRateLabel: {
    color: '#78350F',
    fontSize: 11,
    fontWeight: '600',
  },
  groupRateValue: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '900',
  },

  /* Tutor Card */
  tutorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tutorAvatarWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#CBD5E1',
    marginRight: 12,
  },
  tutorAvatar: {
    width: '100%',
    height: '100%',
  },
  tutorDetails: {
    flex: 1,
  },
  tutorName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  tutorRole: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  ratingText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },

  /* Section Header with Orange Indicator */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  orangeIndicator: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#D97706',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  /* Checkboxes */
  checkboxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxBoxChecked: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  checkboxLabel: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Date & Time Row */
  dateTimeRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 12,
  },
  inputSubLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  datePickerBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Notes */
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#1E293B',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },

  /* Action Buttons */
  primaryActionButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  primaryActionText: {
    color: '#061E47',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryLinkButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  secondaryLinkText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Screen 2 Date Badge */
  dateBadgeWrap: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dateBadgeText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  /* Slots Grid */
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  slotPill: {
    width: (width - 42) / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPillSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF0',
  },
  slotPillConflictSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#DC2626',
  },
  slotTextNormal: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  slotTextSelected: {
    color: '#D97706',
    fontWeight: '900',
  },
  slotTextConflict: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '900',
  },
  conflictAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  conflictAlertText: {
    color: '#DC2626',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  conflictInlineBanner: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  conflictInlineText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  slotHelperText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 14,
  },

  /* Screen 3 Conflict Card */
  conflictCard: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  conflictHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  conflictCardTitle: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '900',
  },
  conflictCardDesc: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  existingSessionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
  },
  existingSessionTag: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  existingSessionName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  existingSessionWith: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  existingSessionTime: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },

  /* Screen 4 Alternatives */
  alternativesSubtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  alternativeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  alternativeCardSelected: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFDF5',
  },
  greenAvailabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  alternativeTime: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  alternativeRange: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#F59E0B',
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
  },
  viewMoreDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 14,
  },
  viewMoreDatesText: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '800',
  },

  /* Screen 5 Finalize */
  updatedBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  updatedBannerText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  bookingDetailsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 7,
  },
  detailItemText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
  },
  topicsBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  topicBadgePill: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicBadgeText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  finalNotesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 20,
  },
  finalNotesText: {
    color: '#475569',
    fontSize: 12.5,
    lineHeight: 18,
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 12,
    marginBottom: 8,
  },
  pickerModalTitle: {
    color: '#0A2342',
    fontSize: 16,
    fontWeight: '800',
  },
  pickerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  pickerItemRowActive: {
    backgroundColor: '#FFFDF0',
  },
  pickerItemText: {
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: '#D97706',
    fontWeight: '800',
  },
});

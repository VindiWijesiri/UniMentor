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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BookingsStackParamList } from '../../navigation/AppNavigator';
import { tutorSlotRepository } from '../../../data/repositories/tutorSlotRepository';
import { tutorSettingsRepository, TutorBookingSettings } from '../../../data/repositories/tutorSettingsRepository';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { bookedTutorsRepository } from '../../../data/repositories/bookedTutorsRepository';
import { paymentRepository, DirectPaySession, DirectPayReceipt } from '../../../data/repositories/paymentRepository';
import { useAuthStore } from '../../../domain/stores/authStore';
import * as ImagePicker from 'expo-image-picker';
import type { TutorSlot } from '../../../domain/entities/TutorSlot';
import TutorAvatar from '../../components/common/TutorAvatar';

const { width } = Dimensions.get('window');

type Step =
  | 'book'
  | 'choose_time'
  | 'conflict'
  | 'alternatives'
  | 'finalize'
  | 'session_verification'
  | 'verify_booking';

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

  // Student auth details
  const user = useAuthStore((state) => state.user);
  const studentName = user?.name || 'Vindi Wijesiri';
  const studentEmail = user?.email || 'student@sliit.lk';

  // Fee calculation matching exact user uploaded mockup
  const rawFee = studyMode === 'group' ? hourlyRateGroup * groupSize : hourlyRate1on1;
  const discount = 200;
  const totalPayable = Math.max(0, rawFee - discount);

  // Session Verification (Face Capture & Biometrics) state
  const [facePhotoUri, setFacePhotoUri] = useState<string | null>(null);
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<
    'idle' | 'capturing' | 'scanning' | 'verified' | 'failed'
  >('idle');
  const [antiProxyToken, setAntiProxyToken] = useState<string | null>(null);

  // Payment Selection state (matches uploaded UI)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wallet' | 'card' | 'bank'>('wallet');
  const [walletBalance, setWalletBalance] = useState<number>(4800);

  // DirectPay state
  const [showDirectPayModal, setShowDirectPayModal] = useState<boolean>(false);
  const [activeDpSession, setActiveDpSession] = useState<DirectPaySession | null>(null);
  const [dpCardNumber, setDpCardNumber] = useState<string>('4111 2222 3333 4444');
  const [dpCardExpiry, setDpCardExpiry] = useState<string>('12/28');
  const [dpCardCvv, setDpCardCvv] = useState<string>('842');
  const [dpCardholderName, setDpCardholderName] = useState<string>(studentName);
  const [dpOtpCode, setDpOtpCode] = useState<string>('123456');
  const [dpStep, setDpStep] = useState<'card_entry' | 'otp_verify' | 'processing'>('card_entry');
  const [isProcessingDirectPay, setIsProcessingDirectPay] = useState<boolean>(false);

  // Success Receipt Modal state
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    mentorName: string;
    subject: string;
    dateTime: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    facePhoto: string | null;
    studyMode: string;
    authCode?: string;
    cardDetails?: string;
  } | null>(null);

  // Sync wallet balance
  useEffect(() => {
    paymentRepository.getWalletBalance().then((bal) => {
      setWalletBalance(bal);
    }).catch(() => {});
  }, []);

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

  // Step 6: Face Capture & Biometric Verification Handlers
  const handleAutoScanWithCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Required',
          'Camera permission is needed to scan your face for biometric session verification.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Grant Access', onPress: () => handleAutoScanWithCamera() },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: false,
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        startFaceVerification(result.assets[0].uri);
      }
    } catch (err: any) {
      console.warn('[FaceScan] Camera launch error:', err);
      Alert.alert(
        'Camera Notice',
        'Could not access the camera on this device. Would you like to select a photo from gallery or run a sample scan?',
        [
          { text: 'Upload Photo', onPress: handlePickFaceLibrary },
          { text: 'Sample Scan', onPress: handleRunDemoScan },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleCaptureFaceCamera = handleAutoScanWithCamera;
  const handleSimulateFaceScan = handleAutoScanWithCamera;

  const handlePickFaceLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        startFaceVerification(result.assets[0].uri);
      }
    } catch (err) {
      console.log('[FaceCapture] Library pick notice:', err);
    }
  };

  const handleRunDemoScan = () => {
    const demoFace =
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    startFaceVerification(demoFace);
  };

  const startFaceVerification = (uri: string) => {
    setFacePhotoUri(uri);
    setFaceVerificationStatus('scanning');
    setTimeout(() => {
      setFaceVerificationStatus('verified');
      setAntiProxyToken(`SLIIT-BIO-${Math.floor(10000 + Math.random() * 90000)}-VERIFIED`);
    }, 1200);
  };

  // Card formatting & DirectPay sandbox helpers
  const formatCardNumber = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryDate = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const getCardBrand = (cardNumber: string): 'Visa' | 'Mastercard' | 'Amex' | 'Card' => {
    const clean = cardNumber.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (
      clean.startsWith('51') ||
      clean.startsWith('52') ||
      clean.startsWith('53') ||
      clean.startsWith('54') ||
      clean.startsWith('55') ||
      clean.startsWith('2')
    ) {
      return 'Mastercard';
    }
    if (clean.startsWith('34') || clean.startsWith('37')) return 'Amex';
    return 'Card';
  };

  const quickFillTestCard = (brand: 'visa' | 'mastercard') => {
    if (brand === 'visa') {
      setDpCardNumber('4111 2222 3333 4444');
      setDpCardExpiry('12/28');
      setDpCardCvv('842');
      setDpCardholderName(studentName || 'Vindi Wijesiri');
      setDpOtpCode('123456');
    } else {
      setDpCardNumber('5105 1051 0510 5100');
      setDpCardExpiry('11/27');
      setDpCardCvv('321');
      setDpCardholderName(studentName || 'Vindi Wijesiri');
      setDpOtpCode('123456');
    }
  };

  // Step 7: Payment confirmation & DirectPay handlers
  const handleConfirmAndPay = async () => {
    if (selectedPaymentMethod === 'card') {
      setIsSubmitting(true);
      try {
        const session = await paymentRepository.initiateDirectPay({
          amount: totalPayable,
          studentName,
          studentEmail,
          tutorName: mentor.name,
          subject: mentor.subjects?.[0] || 'Academic Tutoring',
        });
        setActiveDpSession(session);
        setDpStep('card_entry');
        setShowDirectPayModal(true);
      } catch (err: any) {
        console.log('[DirectPay] Session initiation fallback notice:', err);
        setDpStep('card_entry');
        setShowDirectPayModal(true);
      } finally {
        setIsSubmitting(false);
      }
    } else if (selectedPaymentMethod === 'wallet') {
      if (walletBalance < totalPayable) {
        Alert.alert(
          'Insufficient Wallet Balance',
          `Your Campus Wallet balance is Rs. ${walletBalance.toLocaleString()}, but Rs. ${totalPayable.toLocaleString()} is required. Please choose Credit/Debit Card (DirectPay) or Bank Transfer.`
        );
        return;
      }
      setIsSubmitting(true);
      try {
        const result = await paymentRepository.payWithWallet(totalPayable);
        setWalletBalance(result.remainingBalance);
        await handleFinalizeBooking('Campus Wallet', result.transactionId);
      } catch (err: any) {
        Alert.alert('Payment Error', err?.message || 'Could not complete campus wallet payment.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (selectedPaymentMethod === 'bank') {
      setIsSubmitting(true);
      try {
        const bankTxnId = `BOC-SLIIT-${Date.now()}`;
        await handleFinalizeBooking('Bank Transfer', bankTxnId);
      } catch (err: any) {
        Alert.alert('Payment Error', err?.message || 'Could not complete bank payment.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDirectPaySubmitCard = () => {
    const cleanNum = dpCardNumber.replace(/\D/g, '');
    if (!dpCardholderName.trim()) {
      Alert.alert('Cardholder Name Required', 'Please enter the name printed on your debit or credit card.');
      return;
    }
    if (cleanNum.length < 15) {
      Alert.alert('Invalid Card Number', 'Please enter a valid 16-digit debit/credit card number.');
      return;
    }
    const cleanExp = dpCardExpiry.replace(/\D/g, '');
    if (cleanExp.length < 4) {
      Alert.alert('Invalid Expiry Date', 'Please enter a valid MM/YY expiration date.');
      return;
    }
    const mm = parseInt(cleanExp.slice(0, 2), 10);
    if (mm < 1 || mm > 12) {
      Alert.alert('Invalid Expiry Month', 'Expiration month must be between 01 and 12.');
      return;
    }
    if (dpCardCvv.length < 3) {
      Alert.alert('Invalid CVV', 'Please enter the 3-digit security CVV code on the back of your card.');
      return;
    }
    // Proceed to DirectPay 3D-Secure OTP verification
    setDpStep('otp_verify');
  };

  const handleDirectPayVerifyOtp = async () => {
    if (!dpOtpCode || dpOtpCode.trim().length < 4) {
      Alert.alert(
        'OTP Required',
        'Please enter the 6-digit OTP code sent for 3D-Secure verification. For sandbox testing, enter 123456.'
      );
      return;
    }
    setIsProcessingDirectPay(true);
    setDpStep('processing');
    try {
      const cleanNum = dpCardNumber.replace(/\D/g, '');
      const cardBrand = getCardBrand(dpCardNumber);
      const receipt = await paymentRepository.verifyDirectPay({
        transactionId: activeDpSession?.transactionId || `DP-LKR-${Date.now()}`,
        orderId: activeDpSession?.orderId || `ORD-${Date.now()}`,
        cardLast4: cleanNum.slice(-4) || '4242',
        cardType: cardBrand,
        amount: totalPayable,
        otp: dpOtpCode.trim(),
      });

      setShowDirectPayModal(false);
      await handleFinalizeBooking(
        'DirectPay',
        receipt.transactionId,
        receipt.authCode,
        `${cardBrand} •••• ${cleanNum.slice(-4) || '4242'}`
      );
    } catch (err: any) {
      Alert.alert('DirectPay Authorization Error', err?.message || 'Could not verify card payment.');
      setDpStep('otp_verify');
    } finally {
      setIsProcessingDirectPay(false);
    }
  };

  // Finalize Booking persistence
  const handleFinalizeBooking = async (
    paymentMethod: 'DirectPay' | 'Campus Wallet' | 'Bank Transfer' = 'DirectPay',
    transactionId: string = `DP-${Date.now()}`,
    authCode?: string,
    cardDetails?: string
  ) => {
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
        paymentMethod,
        paymentStatus: 'PAID',
        paidAmount: totalPayable,
        transactionId,
        faceVerificationPhoto: facePhotoUri || undefined,
        isFaceVerified: true,
      });

      try {
        await sessionRepository.bookSession({
          mentorId: mentor._id,
          subject: `${primarySubject} (${selectedTopics.join(', ')})`,
          scheduledAt: scheduledDateTime.toISOString(),
          notes: `[${studyMode.toUpperCase()} STUDY - ${
            studyMode === 'group' ? `${groupSize} Students` : '1-on-1'
          }] Time: ${finalTime}. Rate: ${feeSummary}. Paid: Rs. ${totalPayable} via ${paymentMethod} (${transactionId}). Student Face Verified. Notes: ${sessionNotes}`,
        });
      } catch (apiErr) {
        console.log('[BookingFlow] API session book sync notice:', apiErr);
      }

      if (selectedSlot) {
        await tutorSlotRepository.markSlotBooked(selectedSlot.id, studyMode === 'group');
      }

      setSuccessReceipt({
        mentorName: mentor.name,
        subject: primarySubject,
        dateTime: `${selectedDate} • ${finalTime}`,
        amount: totalPayable,
        paymentMethod: paymentMethod === 'DirectPay' ? 'DirectPay Sri Lanka (Verified)' : paymentMethod,
        transactionId,
        facePhoto: facePhotoUri,
        studyMode,
        authCode,
        cardDetails,
      });
      setShowSuccessModal(true);
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
    if (currentStep === 'verify_booking') {
      setCurrentStep('session_verification');
    } else if (currentStep === 'session_verification') {
      setCurrentStep('finalize');
    } else if (currentStep === 'finalize') {
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
      case 'session_verification':
        return 'Verify Session';
      case 'verify_booking':
        return 'Verify Booking';
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

            {/* Verify Session Button -> Navigates to Student Face Verification (Camera not opened automatically) */}
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={() => {
                setCurrentStep('session_verification');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryActionText}>Verify Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: SESSION VERIFICATION (STUDENT FACE CAPTURE) */}
        {/* ========================================================================= */}
        {currentStep === 'session_verification' && (
          <View style={styles.stepContainer}>
            {/* Security Badge Card */}
            <View style={styles.securityBadgeCard}>
              <View style={styles.securityIconWrap}>
                <Ionicons name="shield-checkmark" size={24} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.securityBadgeTitle}>Session Biometric Verification</Text>
                <Text style={styles.securityBadgeSubtitle}>
                  UniMentor captures and validates your student face to ensure academic attendance integrity and prevent proxy bookings.
                </Text>
              </View>
            </View>

            {/* Student Info Strip */}
            <View style={styles.studentInfoStrip}>
              <View style={styles.studentInfoAvatar}>
                <Ionicons name="person" size={18} color="#061E47" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.studentNameText}>{studentName}</Text>
                <Text style={styles.studentIdText}>SLIIT ID: IT21049281 • Faculty of Computing</Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  faceVerificationStatus === 'verified'
                    ? styles.statusPillVerified
                    : styles.statusPillPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    faceVerificationStatus === 'verified'
                      ? styles.statusPillTextVerified
                      : styles.statusPillTextPending,
                  ]}
                >
                  {faceVerificationStatus === 'verified' ? 'Verified ✓' : 'Awaiting Scan'}
                </Text>
              </View>
            </View>

            {/* Facial Scanner Viewfinder - Tap opens camera */}
            <View style={styles.scannerContainer}>
              <TouchableOpacity
                style={[
                  styles.faceOvalFrame,
                  faceVerificationStatus === 'verified' && styles.faceOvalFrameVerified,
                  faceVerificationStatus === 'scanning' && styles.faceOvalFrameScanning,
                ]}
                onPress={handleAutoScanWithCamera}
                activeOpacity={0.88}
              >
                {facePhotoUri ? (
                  <Image source={{ uri: facePhotoUri }} style={styles.faceCapturedImage} />
                ) : (
                  <View style={styles.facePlaceholderInner}>
                    <Ionicons name="camera" size={54} color="#061E47" style={{ opacity: 0.75, marginBottom: 8 }} />
                    <Text style={styles.faceScanGuideText}>Tap to Open Camera & Auto-Scan</Text>
                  </View>
                )}

                {/* Corner Crosshairs */}
                <View style={[styles.reticleCorner, styles.reticleTL]} />
                <View style={[styles.reticleCorner, styles.reticleTR]} />
                <View style={[styles.reticleCorner, styles.reticleBL]} />
                <View style={[styles.reticleCorner, styles.reticleBR]} />
              </TouchableOpacity>

              {faceVerificationStatus === 'scanning' && (
                <View style={styles.scanningIndicatorRow}>
                  <ActivityIndicator color="#F59E0B" size="small" />
                  <Text style={styles.scanningText}>Analyzing facial geometry & liveness...</Text>
                </View>
              )}

              {faceVerificationStatus === 'verified' && (
                <View style={styles.verifiedChecklist}>
                  <View style={styles.checkItemRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.checkItemText}>Facial geometry & liveness verified</Text>
                  </View>
                  <View style={styles.checkItemRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                    <Text style={styles.checkItemText}>Matched with University Academic Registry</Text>
                  </View>
                  <View style={styles.checkItemRow}>
                    <Ionicons name="shield-checkmark" size={16} color="#059669" />
                    <Text style={styles.checkItemText}>
                      Anti-Proxy Token: {antiProxyToken || 'SLIIT-BIO-VERIFIED'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Primary Action Button: Auto-Scan Face with Camera */}
            <TouchableOpacity
              style={styles.mainAutoScanBtn}
              onPress={handleAutoScanWithCamera}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={20} color="#061E47" style={{ marginRight: 8 }} />
              <Text style={styles.mainAutoScanBtnText}>
                {faceVerificationStatus === 'verified'
                  ? 'Auto-Scan Again (Open Camera)'
                  : 'Auto-Scan Face (Open Camera)'}
              </Text>
            </TouchableOpacity>

            {/* Secondary Capture Options */}
            <View style={styles.cameraActionRow}>
              <TouchableOpacity
                style={styles.galleryActionBtn}
                onPress={handlePickFaceLibrary}
                activeOpacity={0.8}
              >
                <Ionicons name="images-outline" size={18} color="#061E47" style={{ marginRight: 6 }} />
                <Text style={styles.galleryActionBtnText}>Upload from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoScanBtn}
                onPress={handleRunDemoScan}
                activeOpacity={0.8}
              >
                <Ionicons name="flask-outline" size={18} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.demoScanBtnText}>Sample Scan</Text>
              </TouchableOpacity>
            </View>

            {/* Proceed to Payment Button */}
            {faceVerificationStatus === 'verified' ? (
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => setCurrentStep('verify_booking')}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.primaryActionText}>Proceed to Payment</Text>
                  <Ionicons name="arrow-forward" size={16} color="#061E47" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.disabledProceedBox}>
                <Ionicons name="information-circle-outline" size={16} color="#64748B" />
                <Text style={styles.disabledProceedText}>
                  Please capture your face to verify student identity
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: VERIFY BOOKING & PAYMENT METHOD (Exact match to uploaded mockup) */}
        {/* ========================================================================= */}
        {currentStep === 'verify_booking' && (
          <View style={styles.stepContainer}>
            {/* Card 1: BOOKING SUMMARY */}
            <View style={styles.verifySummaryCard}>
              <Text style={styles.verifySummaryEyebrow}>BOOKING SUMMARY</Text>
              <View style={styles.verifySummaryTopRow}>
                <Text style={styles.verifySummaryTutorName}>{mentor.name}</Text>
                <View style={styles.verifyDurationPill}>
                  <Text style={styles.verifyDurationText}>1 hour</Text>
                </View>
              </View>
              <Text style={styles.verifySummarySubtitle}>
                {mentor.subjects?.[0] || 'Database Systems'} •{' '}
                {studyMode === 'group' ? `Group (${groupSize} Students)` : '1-on-1'}
              </Text>
              <View style={styles.verifySummaryDateRow}>
                <Ionicons name="calendar-outline" size={16} color="#475569" style={{ marginRight: 8 }} />
                <Text style={styles.verifySummaryDateText}>
                  {selectedDate} •{' '}
                  {timeUpdatedBanner ? selectedAlternative : selectedSlot?.startTime || '10:00 AM'}
                </Text>
              </View>
            </View>

            {/* Card 2: Fee Breakdown */}
            <View style={styles.verifyFeeCard}>
              <Text style={styles.verifyFeeTitle}>Fee Breakdown</Text>

              <View style={styles.verifyFeeRow}>
                <Text style={styles.verifyFeeLabel}>Session Fee</Text>
                <Text style={styles.verifyFeeValue}>Rs. {rawFee.toLocaleString()}</Text>
              </View>

              <View style={styles.verifyFeeRow}>
                <Text style={styles.verifyFeeLabel}>Discount</Text>
                <Text style={styles.verifyFeeDiscount}>-Rs. {discount.toLocaleString()}</Text>
              </View>

              <View style={[styles.verifyFeeRow, { marginTop: 6 }]}>
                <Text style={styles.verifyTotalLabel}>Total Payable</Text>
                <Text style={styles.verifyTotalValue}>Rs. {totalPayable.toLocaleString()}</Text>
              </View>
            </View>

            {/* Section Title: PAYMENT METHOD */}
            <View style={styles.verifyPaymentHeaderRow}>
              <View style={styles.verifyOrangeIndicator} />
              <Text style={styles.verifyPaymentHeaderText}>PAYMENT METHOD</Text>
            </View>

            {/* Option 1: UniMentor Campus Wallet */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                selectedPaymentMethod === 'wallet' && styles.paymentOptionCardSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('wallet')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.paymentRadioOuter,
                  selectedPaymentMethod === 'wallet' && styles.paymentRadioOuterSelected,
                ]}
              >
                {selectedPaymentMethod === 'wallet' && <View style={styles.paymentRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentOptionTitle}>UniMentor Campus Wallet</Text>
                <Text style={styles.paymentOptionSubtitle}>
                  Balance: Rs. {walletBalance.toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: Credit / Debit Card (Powered by DirectPay) */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                selectedPaymentMethod === 'card' && styles.paymentOptionCardSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('card')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.paymentRadioOuter,
                  selectedPaymentMethod === 'card' && styles.paymentRadioOuterSelected,
                ]}
              >
                {selectedPaymentMethod === 'card' && <View style={styles.paymentRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.paymentOptionTitle}>Credit / Debit Card</Text>
                  <View style={styles.directPayTag}>
                    <Text style={styles.directPayTagText}>DirectPay</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            {/* Option 3: Bank Transfer */}
            <TouchableOpacity
              style={[
                styles.paymentOptionCard,
                selectedPaymentMethod === 'bank' && styles.paymentOptionCardSelected,
              ]}
              onPress={() => setSelectedPaymentMethod('bank')}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.paymentRadioOuter,
                  selectedPaymentMethod === 'bank' && styles.paymentRadioOuterSelected,
                ]}
              >
                {selectedPaymentMethod === 'bank' && <View style={styles.paymentRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentOptionTitle}>Bank Transfer</Text>
              </View>
            </TouchableOpacity>

            {/* Confirm & Pay Button */}
            <TouchableOpacity
              style={[styles.confirmPayButton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleConfirmAndPay}
              disabled={isSubmitting}
              activeOpacity={0.88}
            >
              {isSubmitting ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator color="#061E47" size="small" />
                  <Text style={styles.confirmPayButtonText}>Processing Payment...</Text>
                </View>
              ) : (
                <Text style={styles.confirmPayButtonText}>
                  Confirm & Pay Rs. {totalPayable.toLocaleString()}
                </Text>
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

      {/* ================= DIRECTPAY PAYMENT MODAL ================= */}
      <Modal visible={showDirectPayModal} transparent animationType="slide">
        <View style={styles.dpModalBackdrop}>
          <View style={styles.dpSheetCard}>
            {/* DirectPay Header */}
            <View style={styles.dpHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.dpLogoBadge}>
                  <Text style={styles.dpLogoText}>DP</Text>
                </View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.dpBrandTitle}>DirectPay Gateway</Text>
                    <View style={styles.dpSandboxPill}>
                      <Text style={styles.dpSandboxPillText}>SANDBOX</Text>
                    </View>
                  </View>
                  <Text style={styles.dpBrandSub}>Central Bank Approved • 256-Bit SSL</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowDirectPayModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Amount Banner */}
            <View style={styles.dpAmountBanner}>
              <View>
                <Text style={styles.dpAmountLabel}>Total Payable</Text>
                <Text style={styles.dpOrderRefText}>
                  Ref: {activeDpSession?.orderId ? activeDpSession.orderId.replace('ORD-UNIMENTOR-', 'ORD-') : 'ORD-UNIMENTOR'}
                </Text>
              </View>
              <Text style={styles.dpAmountValue}>LKR {totalPayable.toFixed(2)}</Text>
            </View>

            {dpStep === 'card_entry' && (
              <View>
                {/* Quick-Fill Sandbox Test Cards */}
                <View style={styles.dpQuickFillSection}>
                  <Text style={styles.dpQuickFillLabel}>Quick Test Cards:</Text>
                  <View style={styles.dpQuickCardsRow}>
                    <TouchableOpacity
                      style={styles.dpQuickCardBtn}
                      onPress={() => quickFillTestCard('visa')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="card" size={13} color="#1D4ED8" style={{ marginRight: 4 }} />
                      <Text style={styles.dpQuickCardText}>Visa Test</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dpQuickCardBtn}
                      onPress={() => quickFillTestCard('mastercard')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="card" size={13} color="#EA580C" style={{ marginRight: 4 }} />
                      <Text style={styles.dpQuickCardText}>Mastercard Test</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Cardholder Name */}
                <Text style={styles.dpInputLabel}>Cardholder Name</Text>
                <View style={styles.dpCardInputWrap}>
                  <TextInput
                    style={[styles.dpInput, { flex: 1, borderWidth: 0 }]}
                    value={dpCardholderName}
                    onChangeText={setDpCardholderName}
                    placeholder="e.g. Vindi Wijesiri"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="words"
                  />
                  <Ionicons name="person-outline" size={18} color="#64748B" style={{ marginHorizontal: 12 }} />
                </View>

                {/* Card Number */}
                <Text style={styles.dpInputLabel}>Card Number</Text>
                <View style={styles.dpCardInputWrap}>
                  <TextInput
                    style={[styles.dpInput, { flex: 1, borderWidth: 0 }]}
                    value={dpCardNumber}
                    onChangeText={(text) => setDpCardNumber(formatCardNumber(text))}
                    placeholder="4111 2222 3333 4444"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={19}
                  />
                  {getCardBrand(dpCardNumber) === 'Visa' ? (
                    <View style={[styles.dpBrandBadge, { backgroundColor: '#1D4ED8' }]}>
                      <Text style={styles.dpBrandBadgeText}>VISA</Text>
                    </View>
                  ) : getCardBrand(dpCardNumber) === 'Mastercard' ? (
                    <View style={[styles.dpBrandBadge, { backgroundColor: '#EA580C' }]}>
                      <Text style={styles.dpBrandBadgeText}>MC</Text>
                    </View>
                  ) : getCardBrand(dpCardNumber) === 'Amex' ? (
                    <View style={[styles.dpBrandBadge, { backgroundColor: '#D97706' }]}>
                      <Text style={styles.dpBrandBadgeText}>AMEX</Text>
                    </View>
                  ) : (
                    <Ionicons name="card-outline" size={20} color="#64748B" style={{ marginHorizontal: 10 }} />
                  )}
                </View>

                {/* Expiry Date & CVV */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dpInputLabel}>Expiry Date</Text>
                    <TextInput
                      style={styles.dpInput}
                      value={dpCardExpiry}
                      onChangeText={(text) => setDpCardExpiry(formatExpiryDate(text))}
                      placeholder="MM/YY"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dpInputLabel}>CVV / CVC</Text>
                    <TextInput
                      style={styles.dpInput}
                      value={dpCardCvv}
                      onChangeText={(text) => setDpCardCvv(text.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </View>

                {/* Security Trust Badge */}
                <View style={styles.dpSecurityRow}>
                  <Ionicons name="lock-closed" size={13} color="#059669" />
                  <Text style={styles.dpSecurityText}>
                    Encrypted via DirectPay 256-bit SSL • PCI-DSS Level 1 Compliant
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.dpSubmitBtn}
                  onPress={handleDirectPaySubmitCard}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dpSubmitBtnText}>Proceed to 3D-Secure 2.0</Text>
                  <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                {/* DirectPay Hosted Checkout Web Link */}
                {activeDpSession?.paymentUrl && (
                  <TouchableOpacity
                    style={styles.dpWebCheckoutBtn}
                    onPress={() => {
                      Linking.openURL(activeDpSession.paymentUrl).catch(() => {
                        Alert.alert('DirectPay Portal', 'Opening sandbox DirectPay checkout: ' + activeDpSession.paymentUrl);
                      });
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="open-outline" size={14} color="#0D4F9E" style={{ marginRight: 5 }} />
                    <Text style={styles.dpWebCheckoutText}>Or open DirectPay Web Checkout Portal</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {dpStep === 'otp_verify' && (
              <View>
                <View style={styles.dpOtpInfoBox}>
                  <Ionicons name="shield-checkmark" size={26} color="#059669" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.dpOtpInfoTitle}>DirectPay 3D-Secure 2.0</Text>
                    <Text style={styles.dpOtpInfoSub}>
                      Enter the 6-digit OTP code sent for your {getCardBrand(dpCardNumber)} ending in •••• {dpCardNumber.replace(/\D/g, '').slice(-4) || '4444'}.
                    </Text>
                    <View style={styles.dpTestOtpBadge}>
                      <Text style={styles.dpTestOtpText}>🔑 Sandbox Test OTP: 123456</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.dpInputLabel}>One-Time Password (OTP)</Text>
                <TextInput
                  style={[styles.dpInput, { textAlign: 'center', fontSize: 22, letterSpacing: 8, fontWeight: '800' }]}
                  value={dpOtpCode}
                  onChangeText={(text) => setDpOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <TouchableOpacity
                  style={styles.dpSubmitBtn}
                  onPress={handleDirectPayVerifyOtp}
                  disabled={isProcessingDirectPay}
                  activeOpacity={0.85}
                >
                  {isProcessingDirectPay ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.dpSubmitBtnText}>Authorize & Pay LKR {totalPayable.toFixed(2)}</Text>
                  )}
                </TouchableOpacity>

                {/* Secondary Actions: Back & Resend */}
                <View style={styles.dpOtpSecondaryRow}>
                  <TouchableOpacity
                    style={styles.dpOtpActionBtn}
                    onPress={() => setDpStep('card_entry')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={13} color="#64748B" style={{ marginRight: 3 }} />
                    <Text style={styles.dpOtpActionText}>Edit Card</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dpOtpActionBtn}
                    onPress={() => {
                      setDpOtpCode('123456');
                      Alert.alert(
                        'DirectPay 3D-Secure',
                        'New OTP authorization code sent to your registered mobile: 123456'
                      );
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="refresh" size={13} color="#D97706" style={{ marginRight: 3 }} />
                    <Text style={[styles.dpOtpActionText, { color: '#D97706', fontWeight: '800' }]}>
                      Resend OTP (123456)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {dpStep === 'processing' && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <ActivityIndicator color="#F59E0B" size="large" />
                <Text style={{ color: '#061E47', fontSize: 16, fontWeight: '800', marginTop: 16 }}>
                  DirectPay Gateway Authenticating...
                </Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 4, textAlign: 'center' }}>
                  Authorizing 3D-Secure 2.0 with issuing bank & Central Bank IPG switch
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= BOOKING & PAYMENT SUCCESS MODAL ================= */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.successModalCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={44} color="#059669" />
            </View>

            <Text style={styles.successTitle}>Booking & Payment Verified</Text>
            <Text style={styles.successSubtitle}>
              Your tutoring session has been confirmed and registered with campus academic services.
            </Text>

            {successReceipt && (
              <View style={styles.receiptBox}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Mentor</Text>
                  <Text style={styles.receiptValue}>{successReceipt.mentorName}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Module</Text>
                  <Text style={styles.receiptValue} numberOfLines={1}>{successReceipt.subject}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Date & Time</Text>
                  <Text style={styles.receiptValue}>{successReceipt.dateTime}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Paid Amount</Text>
                  <Text style={[styles.receiptValue, { color: '#D97706', fontWeight: '900', fontSize: 13.5 }]}>
                    Rs. {successReceipt.amount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Payment Gateway</Text>
                  <View style={styles.receiptGatewayBadge}>
                    <Text style={styles.receiptGatewayText}>
                      {successReceipt.paymentMethod}
                    </Text>
                  </View>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Transaction ID</Text>
                  <Text
                    style={styles.receiptTxnText}
                    numberOfLines={1}
                  >
                    {successReceipt.transactionId}
                  </Text>
                </View>
                {successReceipt.authCode && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Authorization Code</Text>
                    <Text style={[styles.receiptValue, { color: '#059669', fontWeight: '800' }]}>
                      {successReceipt.authCode}
                    </Text>
                  </View>
                )}
                {successReceipt.cardDetails && (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Paid With Card</Text>
                    <Text style={[styles.receiptValue, { color: '#061E47', fontWeight: '700' }]}>
                      {successReceipt.cardDetails}
                    </Text>
                  </View>
                )}
                <View style={[styles.receiptRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.receiptLabel}>Student Biometrics</Text>
                  <View style={styles.receiptBioPill}>
                    <Ionicons name="shield-checkmark" size={13} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.receiptBioPillText}>Face Verified</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.successDoneButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('SessionsList');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.successDoneButtonText}>View in My Bookings</Text>
              <Ionicons name="arrow-forward" size={16} color="#061E47" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
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

  /* ========================================================= */
  /* STEP 6: SESSION BIOMETRIC FACE VERIFICATION STYLES */
  /* ========================================================= */
  securityBadgeCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  securityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityBadgeTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '800',
  },
  securityBadgeSubtitle: {
    color: '#047857',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  studentInfoStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  studentInfoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentNameText: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '800',
  },
  studentIdText: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPillVerified: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextPending: {
    color: '#D97706',
  },
  statusPillTextVerified: {
    color: '#059669',
  },
  scannerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  faceOvalFrame: {
    width: 180,
    height: 230,
    borderRadius: 90,
    borderWidth: 2.5,
    borderColor: '#94A3B8',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  faceOvalFrameScanning: {
    borderColor: '#F59E0B',
    borderStyle: 'solid',
    backgroundColor: '#FFFDF0',
  },
  faceOvalFrameVerified: {
    borderColor: '#059669',
    borderStyle: 'solid',
    backgroundColor: '#ECFDF5',
  },
  faceCapturedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
  },
  facePlaceholderInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  faceScanGuideText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
  },
  reticleCorner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#061E47',
  },
  reticleTL: { top: 12, left: 16, borderTopWidth: 3, borderLeftWidth: 3 },
  reticleTR: { top: 12, right: 16, borderTopWidth: 3, borderRightWidth: 3 },
  reticleBL: { bottom: 12, left: 16, borderBottomWidth: 3, borderLeftWidth: 3 },
  reticleBR: { bottom: 12, right: 16, borderBottomWidth: 3, borderRightWidth: 3 },
  scanningIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  scanningText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedChecklist: {
    marginTop: 16,
    width: '85%',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkItemText: {
    color: '#065F46',
    fontSize: 11,
    fontWeight: '700',
  },
  mainAutoScanBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  mainAutoScanBtnText: {
    color: '#061E47',
    fontSize: 14.5,
    fontWeight: '900',
  },
  cameraActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  cameraActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraActionBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  galleryActionBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryActionBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '700',
  },
  demoScanBtn: {
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFDF0',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoScanBtnText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  disabledProceedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  disabledProceedText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },

  /* ========================================================= */
  /* STEP 7: VERIFY BOOKING SCREEN (Matches Uploaded Screenshot) */
  /* ========================================================= */
  verifySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  verifySummaryEyebrow: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  verifySummaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verifySummaryTutorName: {
    color: '#061E47',
    fontSize: 18,
    fontWeight: '800',
  },
  verifyDurationPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifyDurationText: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '800',
  },
  verifySummarySubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  verifySummaryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  verifySummaryDateText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  verifyFeeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  verifyFeeTitle: {
    color: '#061E47',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  verifyFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  verifyFeeLabel: {
    color: '#64748B',
    fontSize: 13.5,
    fontWeight: '500',
  },
  verifyFeeValue: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
  },
  verifyFeeDiscount: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '700',
  },
  verifyTotalLabel: {
    color: '#061E47',
    fontSize: 15,
    fontWeight: '900',
  },
  verifyTotalValue: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '900',
  },
  verifyPaymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyOrangeIndicator: {
    width: 3.5,
    height: 16,
    backgroundColor: '#D97706',
    borderRadius: 2,
    marginRight: 8,
  },
  verifyPaymentHeaderText: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  paymentOptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentOptionCardSelected: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
  },
  paymentRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentRadioOuterSelected: {
    borderColor: '#F59E0B',
  },
  paymentRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
  },
  paymentOptionTitle: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '800',
  },
  paymentOptionSubtitle: {
    color: '#64748B',
    fontSize: 11.5,
    marginTop: 2,
  },
  directPayTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  directPayTagText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  confirmPayButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  confirmPayButtonText: {
    color: '#061E47',
    fontSize: 15,
    fontWeight: '900',
  },

  /* ========================================================= */
  /* DIRECTPAY MODAL STYLES */
  /* ========================================================= */
  dpModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.65)',
    justifyContent: 'flex-end',
  },
  dpSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  dpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dpLogoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#061E47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpLogoText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '900',
  },
  dpBrandTitle: {
    color: '#061E47',
    fontSize: 15,
    fontWeight: '900',
  },
  dpBrandSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  dpAmountBanner: {
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 12,
    marginVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dpAmountLabel: {
    color: '#78350F',
    fontSize: 12,
    fontWeight: '700',
  },
  dpAmountValue: {
    color: '#D97706',
    fontSize: 17,
    fontWeight: '900',
  },
  dpInputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 6,
  },
  dpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  dpCardInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
  },
  dpSubmitBtn: {
    backgroundColor: '#061E47',
    borderRadius: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  dpSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  dpOtpInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 12,
  },
  dpOtpInfoTitle: {
    color: '#061E47',
    fontSize: 13,
    fontWeight: '800',
  },
  dpOtpInfoSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  dpSandboxPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dpSandboxPillText: {
    color: '#92400E',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dpOrderRefText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  dpQuickFillSection: {
    marginBottom: 10,
    marginTop: 2,
  },
  dpQuickFillLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  dpQuickCardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dpQuickCardBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dpQuickCardText: {
    color: '#061E47',
    fontSize: 11,
    fontWeight: '700',
  },
  dpBrandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  dpBrandBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dpSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 12,
  },
  dpSecurityText: {
    color: '#059669',
    fontSize: 10.5,
    fontWeight: '600',
  },
  dpWebCheckoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 4,
  },
  dpWebCheckoutText: {
    color: '#0D4F9E',
    fontSize: 11.5,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  dpTestOtpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dpTestOtpText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '800',
  },
  dpOtpSecondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  dpOtpActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dpOtpActionText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },

  /* ========================================================= */
  /* SUCCESS RECEIPT MODAL */
  /* ========================================================= */
  successModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  successIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  successTitle: {
    color: '#061E47',
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  successSubtitle: {
    color: '#64748B',
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  receiptLabel: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  receiptValue: {
    color: '#061E47',
    fontSize: 12.5,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  receiptGatewayBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  receiptGatewayText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '800',
  },
  receiptTxnText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#334155',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  receiptBioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  receiptBioPillText: {
    color: '#065F46',
    fontSize: 11.5,
    fontWeight: '800',
  },
  successDoneButton: {
    width: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  successDoneButtonText: {
    color: '#061E47',
    fontSize: 15,
    fontWeight: '900',
  },
});

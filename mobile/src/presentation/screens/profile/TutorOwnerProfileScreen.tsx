import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../domain/stores/authStore';
import { useUserStore } from '../../../domain/stores/userStore';
import { tutorSettingsRepository, TutorBookingSettings } from '../../../data/repositories/tutorSettingsRepository';
import { tutorSlotRepository } from '../../../data/repositories/tutorSlotRepository';
import { TutorSlot } from '../../../domain/entities/TutorSlot';
import {
  SvgUser,
  SvgWallet,
  SvgCalendar,
  SvgStar,
  SvgChevronRight,
  SvgPricetag,
  SvgPeople,
  SvgShieldCheck,
  SvgClose,
  SvgTrash,
  SvgBook,
} from '../../components/common/SvgIcons';
import { Ionicons } from '@expo/vector-icons';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export default function TutorOwnerProfileScreen() {
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  const authUser = useAuthStore((state) => state.user);
  const { logout } = useAuthStore();
  const { profile, fetchProfile, updateProfile } = useUserStore();

  const user = profile || authUser;

  // Tutor Specific State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [tutorSettings, setTutorSettings] = useState<TutorBookingSettings | null>(null);
  const [tutorSlots, setTutorSlots] = useState<TutorSlot[]>([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  // Form edit fields
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editRate1on1, setEditRate1on1] = useState('2500');
  const [editRateGroup, setEditRateGroup] = useState('1200');

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const tutorMentorId = authUser?._id || (authUser as any)?.id || 'demo-tutor-1';
  const tutorMentorName = authUser?.name || 'Tharushi Perera';

  const loadTutorData = useCallback(async () => {
    try {
      const [settings, slots] = await Promise.all([
        tutorSettingsRepository.getSettings(tutorMentorId, tutorMentorName),
        tutorSlotRepository.getAllSlots(tutorMentorId, tutorMentorName),
      ]);
      setTutorSettings(settings);
      setTutorSlots(slots);
      setEditRate1on1(String(settings.hourlyRate1on1 || 2500));
      setEditRateGroup(String(settings.hourlyRateGroup || 1200));
    } catch (e) {
      console.warn('Error loading tutor profile data:', e);
    }
  }, [tutorMentorId, tutorMentorName]);

  useEffect(() => {
    loadTutorData();
    const unsub = tutorSlotRepository.subscribe(() => {
      loadTutorData();
    });
    return unsub;
  }, [loadTutorData]);

  const name = user?.name || 'Tharushi Perera';
  const email = user?.email || 'tharushi.perera@sliit.lk';
  const bio =
    user?.bio ||
    'Senior Peer Mentor specializing in Database Optimization, Normalization, and Algorithms. Passionate about empowering students to excel in midterms and finals.';
  const avatarUri =
    user?.profilePicture ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

  const openEditModal = () => {
    setEditName(name);
    setEditBio(bio);
    setEditAvatar(avatarUri);
    if (tutorSettings) {
      setEditRate1on1(String(tutorSettings.hourlyRate1on1 || 2500));
      setEditRateGroup(String(tutorSettings.hourlyRateGroup || 1200));
    }
    setShowEditModal(true);
  };

  const handlePickFromGallery = async () => {
    try {
      setIsPickingImage(true);
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow photo library access to choose a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setEditAvatar(newUri);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to select image.');
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        name: editName.trim(),
        bio: editBio.trim(),
        profilePicture: editAvatar.trim(),
      });

      await tutorSettingsRepository.saveSettings({
        mentorId: tutorMentorId,
        mentorName: editName.trim(),
        hourlyRate1on1: Number(editRate1on1) || 2500,
        hourlyRateGroup: Number(editRateGroup) || 1200,
        profileImage: editAvatar.trim(),
      });
      await loadTutorData();

      setShowEditModal(false);
      Alert.alert('Profile Saved', 'Your tutor profile details have been updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTutorModule = async () => {
    if (!newModuleTitle.trim() || !tutorSettings) return;
    const currentMods = tutorSettings.teachingModules || [];
    if (currentMods.includes(newModuleTitle.trim())) {
      Alert.alert('Already Added', 'This module is already in your teaching portfolio.');
      return;
    }
    const updated = [...currentMods, newModuleTitle.trim()];
    await tutorSettingsRepository.saveSettings({
      mentorId: tutorMentorId,
      mentorName: tutorMentorName,
      teachingModules: updated,
    });
    setNewModuleTitle('');
    setShowAddModuleModal(false);
    await loadTutorData();
  };

  const handleRemoveTutorModule = async (mod: string) => {
    if (!tutorSettings) return;
    Alert.alert('Remove Module', `Remove "${mod}" from your tutoring portfolio?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const updated = (tutorSettings.teachingModules || []).filter((m) => m !== mod);
          await tutorSettingsRepository.saveSettings({
            mentorId: tutorMentorId,
            mentorName: tutorMentorName,
            teachingModules: updated,
          });
          await loadTutorData();
        },
      },
    ]);
  };

  const handleLogoutPrompt = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of UniMentor?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const totalBookedAttendees = tutorSlots.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
  const totalSlotsCount = tutorSlots.length;
  const estimatedRevenue = tutorSlots.reduce((acc, s) => {
    const attendees = s.registeredAttendees || [];
    const attendeesPaid = attendees.reduce((sum, a) => sum + (a.feePaid || s.fee || 2500), 0);
    return acc + attendeesPaid;
  }, 0);

  return (
    <View style={styles.screen}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Tutor Profile</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tutor Hero Card */}
        <View style={styles.profileHeroCard}>
          <View style={styles.profileSummaryRow}>
            <TouchableOpacity style={styles.avatarWrap} onPress={openEditModal} activeOpacity={0.85}>
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              <View style={styles.onlineDot} />
              <View style={styles.avatarCameraBadgeSmall}>
                <Ionicons name="camera" size={11} color="#061E47" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileCopyWrap}>
              <View style={styles.roleRow}>
                <Text style={styles.profileName} numberOfLines={1}>{name}</Text>
                <View style={styles.tutorVerifiedBadge}>
                  <SvgShieldCheck size={11} color="#059669" />
                  <Text style={styles.tutorVerifiedBadgeText}>VERIFIED</Text>
                </View>
              </View>

              <View style={styles.tutorRatingRow}>
                <SvgStar size={13} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.tutorRatingText}>4.9 (48 student reviews)</Text>
              </View>

              <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
              <Text style={styles.tutorRoleExperienceText}>Senior Peer Mentor • Faculty of Computing</Text>
            </View>
          </View>

          {/* Edit Tutor Details Button */}
          <TouchableOpacity style={styles.editProfileLowerBtn} onPress={openEditModal} activeOpacity={0.85}>
            <Ionicons name="create-outline" size={14} color="#061E47" />
            <Text style={styles.editProfileLowerBtnText}>Edit Tutor Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Tutor Earnings & Tutoring Metrics Card */}
        <View style={styles.tutorEarningsCard}>
          <View style={styles.tutorEarningsHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <SvgWallet size={18} color="#059669" />
              <Text style={styles.tutorEarningsHeaderTitle}>Tutoring Earnings & Payouts</Text>
            </View>
            <View style={styles.payoutConnectedBadge}>
              <Text style={styles.payoutConnectedText}>BANK CONNECTED</Text>
            </View>
          </View>

          <View style={styles.tutorMetricsGrid}>
            <View style={styles.tutorMetricBox}>
              <Text style={[styles.tutorMetricVal, { color: '#059669' }]}>
                LKR {(estimatedRevenue > 0 ? estimatedRevenue : 42500).toLocaleString()}
              </Text>
              <Text style={styles.tutorMetricLbl}>Total Earnings</Text>
            </View>
            <View style={styles.tutorMetricBox}>
              <Text style={[styles.tutorMetricVal, { color: '#0284C7' }]}>
                LKR 8,400
              </Text>
              <Text style={styles.tutorMetricLbl}>Pending Payout</Text>
            </View>
            <View style={styles.tutorMetricBox}>
              <Text style={[styles.tutorMetricVal, { color: '#D97706' }]}>
                {36 + totalBookedAttendees * 2} hrs
              </Text>
              <Text style={styles.tutorMetricLbl}>Tutoring Hours</Text>
            </View>
            <View style={styles.tutorMetricBox}>
              <Text style={[styles.tutorMetricVal, { color: '#7C3AED' }]}>
                {52 + totalBookedAttendees}
              </Text>
              <Text style={styles.tutorMetricLbl}>Students Taught</Text>
            </View>
          </View>
        </View>

        {/* Tutoring Rates & Modality Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>TUTORING RATES & MODALITY</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.actionLink}>Adjust Rates</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ratesRow}>
            <View style={styles.rateCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SvgPricetag size={14} color="#1D4ED8" />
                <Text style={styles.rateCardTitle}>1-on-1 Mentoring</Text>
              </View>
              <Text style={styles.rateCardValue}>
                LKR {Number(editRate1on1).toLocaleString()} <Text style={styles.rateCardSub}>/ hr</Text>
              </Text>
              <Text style={styles.rateCardNote}>Personalized syllabus walkthrough & code debugging</Text>
            </View>

            <View style={styles.rateCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <SvgPeople size={14} color="#059669" />
                <Text style={styles.rateCardTitle}>Group Study Pod</Text>
              </View>
              <Text style={styles.rateCardValue}>
                LKR {Number(editRateGroup).toLocaleString()} <Text style={styles.rateCardSub}>/ hr / student</Text>
              </Text>
              <Text style={styles.rateCardNote}>Collaborative peer exam revision (Max 5 students)</Text>
            </View>
          </View>
        </View>

        {/* Tutor Slot Allocation Management Hero Banner */}
        <View style={styles.tutorSlotBannerCard}>
          <View style={styles.tutorSlotBannerHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SvgCalendar size={18} color="#061E47" />
              <Text style={styles.tutorSlotBannerTitle}>My Timetable & Slot Allocations</Text>
            </View>
          </View>

          <View style={styles.tutorAllocationBadgesRow}>
            <View style={styles.allocationBadge}>
              <SvgCalendar size={14} color="#061E47" />
              <Text style={styles.allocationBadgeText}>{totalSlotsCount} Scheduled Slots</Text>
            </View>
            <View style={styles.allocationBadgeGreen}>
              <SvgPeople size={14} color="#059669" />
              <Text style={styles.allocationBadgeGreenText}>{totalBookedAttendees} Booked Students</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.tutorManageSlotsHeroBtn}
            onPress={() => navigation.navigate('Scheduling')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <SvgCalendar size={18} color="#FFFFFF" />
              <View>
                <Text style={styles.tutorManageSlotsHeroBtnTitle}>Open Slot Allocation & Bookings</Text>
                <Text style={styles.tutorManageSlotsHeroBtnSub}>
                  Set timetable, capacities, review attendees & facial verifications
                </Text>
              </View>
            </View>
            <SvgChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Teaching Modules Portfolio */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>TEACHING MODULES & SPECIALTIES</Text>
            <TouchableOpacity onPress={() => setShowAddModuleModal(true)}>
              <Text style={styles.actionLink}>+ Add Module</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagWrap}>
            {(tutorSettings?.teachingModules && tutorSettings.teachingModules.length > 0
              ? tutorSettings.teachingModules
              : ['Database Management Systems', 'Data Structures & Algorithms', 'Mobile Application Development']
            ).map((mod) => (
              <TouchableOpacity
                key={mod}
                style={styles.tutorModuleTag}
                onPress={() => handleRemoveTutorModule(mod)}
              >
                <SvgBook size={12} color="#0284C7" />
                <Text style={styles.tutorModuleTagText}>{mod}</Text>
                <SvgClose size={12} color="#94A3B8" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tutor Bio */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>TUTOR BIO & PEDAGOGICAL PHILOSOPHY</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.actionLink}>Edit Bio</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* Student Reviews */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>RECENT STUDENT FEEDBACK</Text>
          <View style={styles.reviewSnippetBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.reviewAuthor}>Kasun D. • 2nd Year SE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <SvgStar size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.reviewRatingVal}>5.0</Text>
              </View>
            </View>
            <Text style={styles.reviewSnippetText}>
              "The BCNF and 3NF normalization revision pod was fantastic! She explained composite candidate keys so clearly."
            </Text>
          </View>

          <View style={styles.reviewSnippetBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.reviewAuthor}>Algorithms Study Pod #3</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <SvgStar size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.reviewRatingVal}>5.0</Text>
              </View>
            </View>
            <Text style={styles.reviewSnippetText}>
              "Very patient mentor for recursion and DFS graph trees. We all scored A grades on our mid-semester assessment!"
            </Text>
          </View>
        </View>

        {/* Account & Security */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>ACCOUNT & SECURITY</Text>

          <TouchableOpacity style={styles.menuRow} onPress={openEditModal} activeOpacity={0.8}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <SvgUser size={16} color="#061E47" />
              </View>
              <Text style={styles.menuLabel}>Edit Tutor Profile Information</Text>
            </View>
            <SvgChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={handleLogoutPrompt} activeOpacity={0.8}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <SvgTrash size={16} color="#EF4444" />
              </View>
              <Text style={[styles.menuLabel, { color: '#EF4444' }]}>Log Out of UniMentor</Text>
            </View>
            <SvgChevronRight size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Edit Tutor Profile</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Avatar Picker */}
              <View style={styles.modalAvatarSection}>
                <TouchableOpacity onPress={handlePickFromGallery} style={styles.modalAvatarWrap}>
                  <Image source={{ uri: editAvatar || avatarUri }} style={styles.modalAvatarImg} />
                  <View style={styles.modalCameraBadge}>
                    <Ionicons name="camera" size={13} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.choosePhotoBtn} onPress={handlePickFromGallery} disabled={isPickingImage}>
                  {isPickingImage ? (
                    <ActivityIndicator size="small" color="#061E47" />
                  ) : (
                    <Text style={styles.choosePhotoBtnText}>Choose from Gallery</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.presetRow}>
                  {AVATAR_PRESETS.map((p, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.presetThumbWrap, editAvatar === p && styles.presetThumbWrapActive]}
                      onPress={() => setEditAvatar(p)}
                    >
                      <Image source={{ uri: p }} style={styles.presetThumb} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Text style={styles.inputLabel}>FULL NAME</Text>
              <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} placeholder="Full Name" />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>1-ON-1 RATE (LKR)</Text>
                  <TextInput style={styles.modalInput} value={editRate1on1} onChangeText={setEditRate1on1} keyboardType="numeric" placeholder="2500" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>GROUP POD RATE (LKR)</Text>
                  <TextInput style={styles.modalInput} value={editRateGroup} onChangeText={setEditRateGroup} keyboardType="numeric" placeholder="1200" />
                </View>
              </View>

              <Text style={styles.inputLabel}>TUTOR PEDAGOGICAL BIO</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Write a brief introduction..."
                multiline
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.modalSaveBtnText}>Save Changes</Text>}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ADD MODULE MODAL */}
      <Modal visible={showAddModuleModal} animationType="fade" transparent onRequestClose={() => setShowAddModuleModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModuleModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Add Teaching Module</Text>
            <Text style={styles.sheetSubheading}>Add a university course or subject you mentor.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Distributed Systems, Computer Networks"
              placeholderTextColor="#94A3B8"
              value={newModuleTitle}
              onChangeText={setNewModuleTitle}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddModuleModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddTutorModule}>
                <Text style={styles.modalSaveBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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

  profileHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
    borderColor: '#061E47',
  },
  onlineDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarCameraBadgeSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileCopyWrap: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  tutorVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tutorVerifiedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  tutorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  tutorRatingText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  profileEmail: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  tutorRoleExperienceText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  editProfileLowerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editProfileLowerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#061E47',
  },

  /* Tutor Earnings Card */
  tutorEarningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  tutorEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tutorEarningsHeaderTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#061E47',
  },
  payoutConnectedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  payoutConnectedText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  tutorMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tutorMetricBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tutorMetricVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  tutorMetricLbl: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  /* Rates Row */
  ratesRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  rateCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rateCardTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#061E47',
  },
  rateCardValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#061E47',
    marginTop: 4,
  },
  rateCardSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  rateCardNote: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 14,
  },

  /* Slot Banner */
  tutorSlotBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tutorSlotBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tutorSlotBannerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#061E47',
  },
  tutorAllocationBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  allocationBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  allocationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E40AF',
  },
  allocationBadgeGreen: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  allocationBadgeGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  tutorManageSlotsHeroBtn: {
    backgroundColor: '#FBBF24',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tutorManageSlotsHeroBtnTitle: {
    color: '#061E47',
    fontSize: 13,
    fontWeight: '800',
  },
  tutorManageSlotsHeroBtnSub: {
    color: '#93C5FD',
    fontSize: 10,
    marginTop: 1,
  },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  actionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tutorModuleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  tutorModuleTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  bioText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  reviewSnippetBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewAuthor: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  reviewRatingVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  reviewSnippetText: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: '#061E47',
    marginBottom: 6,
  },
  sheetSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  modalAvatarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  modalAvatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  modalAvatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#061E47',
  },
  modalCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#061E47',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  choosePhotoBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  choosePhotoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#061E47',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  presetThumbWrap: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetThumbWrapActive: {
    borderColor: '#061E47',
  },
  presetThumb: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: '#FBBF24',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#061E47',
  },
});

import React, { useEffect, useState } from 'react';
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
import { useStudentStore } from '../../../domain/stores/studentStore';
import { paymentRepository } from '../../../data/repositories/paymentRepository';
import {
  SvgUser,
  SvgWallet,
  SvgCalendar,
  SvgChevronRight,
  SvgClose,
  SvgTrash,
  SvgBook,
} from '../../components/common/SvgIcons';
import { Ionicons } from '@expo/vector-icons';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  const authUser = useAuthStore((state) => state.user);
  const { logout } = useAuthStore();
  const { profile, fetchProfile, updateProfile, addSubject, removeSubject } = useUserStore();
  const { dashboard } = useStudentStore();

  const user = profile || authUser || dashboard?.user;

  // Student Modals & Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddInterestModal, setShowAddInterestModal] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Student specific data
  const [studentWalletBalance, setStudentWalletBalance] = useState(4800);
  const [newInterest, setNewInterest] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editYear, setEditYear] = useState('Year 3');
  const [editSem, setEditSem] = useState('Sem 2');

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Sync wallet balance
  useEffect(() => {
    paymentRepository.getWalletBalance().then(setStudentWalletBalance);
  }, []);

  // Student details
  const name = user?.name || 'Nethmi Silva';
  const email = user?.email || 'nethmi.silva@student.unimentor.lk';
  const degree = user?.degreeProgramme || 'BSc (Hons) Software Engineering';
  const academicYear = user?.academicYear || 'Year 3';
  const semester = user?.semester || 'Sem 2';
  const bio =
    user?.bio ||
    'Software Engineering undergraduate passionate about algorithms, clean architecture, and distributed systems. Preparing for upcoming SLIIT examinations.';

  const subjects: string[] = user?.subjects?.length
    ? user.subjects
    : ['Data Structures & Algorithms', 'Software Architecture', 'DBMS', 'Mobile Application Development'];

  const avatarUri =
    user?.profilePicture ||
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80';

  const stats = dashboard?.academicStats || { goals: 4, plans: 3, dueTests: 2, done: 18 };

  const openEditModal = () => {
    setEditName(name);
    setEditBio(bio);
    setEditDegree(degree);
    setEditYear(academicYear);
    setEditSem(semester);
    setEditAvatar(avatarUri);
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
        degreeProgramme: editDegree.trim(),
        academicYear: editYear,
        semester: editSem,
        profilePicture: editAvatar.trim(),
      });

      setShowEditModal(false);
      Alert.alert('Profile Saved', 'Your student profile details have been successfully updated.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = async () => {
    if (!newInterest.trim()) return;
    await addSubject(newInterest.trim());
    setNewInterest('');
    setShowAddInterestModal(false);
  };

  const handleRemoveInterest = (item: string) => {
    Alert.alert('Remove Subject', `Remove "${item}" from your academic subjects?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSubject(item) },
    ]);
  };

  const handleLogoutPrompt = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of UniMentor?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Student Profile</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ====================================================================== */}
        {/* 1. CAMPUS WALLET BALANCE CARD (MOVED MORE UP TO TOP) */}
        {/* ====================================================================== */}
        <View style={styles.studentWalletHeroCard}>
          <View style={styles.studentWalletHeroLeft}>
            <View style={styles.studentWalletHeroIcon}>
              <SvgWallet size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.studentWalletHeroTitle}>UniMentor Campus Wallet</Text>
                <View style={styles.studentWalletActivePill}>
                  <Text style={styles.studentWalletActivePillText}>STUDENT WALLET</Text>
                </View>
              </View>
              <Text style={styles.studentWalletHeroSub}>
                Session fees & instant booking refunds are credited here
              </Text>
            </View>
          </View>

          <View style={styles.studentWalletHeroRight}>
            <Text style={styles.studentWalletHeroVal}>Rs. {studentWalletBalance.toLocaleString()}</Text>
            <Text style={styles.studentWalletHeroLbl}>Campus Balance</Text>
          </View>
        </View>

        {/* ====================================================================== */}
        {/* 2. STUDENT HERO / IDENTITY CARD */}
        {/* ====================================================================== */}
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
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>STUDENT</Text>
                </View>
              </View>

              <Text style={styles.studentIdText}>ID: IT21893402 • Faculty of Computing</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
              <Text style={styles.academicPillText}>{`${degree} • ${academicYear} ${semester}`}</Text>
            </View>
          </View>

          {/* 3. EDIT PROFILE BUTTON (MOVED LITTLE MORE DOWN) */}
          <TouchableOpacity
            style={styles.editProfileLowerBtn}
            onPress={openEditModal}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={14} color="#061E47" />
            <Text style={styles.editProfileLowerBtnText}>Edit Profile Details</Text>
          </TouchableOpacity>
        </View>

        {/* ====================================================================== */}
        {/* 4. ACADEMIC SUMMARY METRICS */}
        {/* ====================================================================== */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionHeading}>ACADEMIC SUMMARY</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#FBBF24' }]}>{stats.goals}</Text>
              <Text style={styles.statLbl}>Goals</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#38BDF8' }]}>{stats.plans}</Text>
              <Text style={styles.statLbl}>Plans</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#FB7185' }]}>{stats.dueTests}</Text>
              <Text style={styles.statLbl}>Due Tests</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statVal, { color: '#34D399' }]}>{stats.done}</Text>
              <Text style={styles.statLbl}>Done</Text>
            </View>
          </View>
        </View>

        {/* ====================================================================== */}
        {/* 5. ABOUT & ACADEMIC BIO */}
        {/* ====================================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>ABOUT & ACADEMIC BIO</Text>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.actionLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.bioText}>{bio}</Text>
        </View>

        {/* ====================================================================== */}
        {/* 6. MY BOOKINGS & STUDY SESSIONS SHORTCUT (FULL WIDTH - NO DUAL) */}
        {/* ====================================================================== */}
        <View style={styles.myBookingsHeroCard}>
          <View style={styles.myBookingsHeroHeader}>
            <View style={styles.myBookingsIconWrap}>
              <SvgCalendar size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.myBookingsHeroTitle}>My Bookings & Sessions</Text>
              <Text style={styles.myBookingsHeroSub}>
                Manage your booked tutors, join live revision rooms, and track modules
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.openBookingsActionBtn}
            onPress={() => (navigation as any).navigate('Bookings', { screen: 'SessionsList' })}
            activeOpacity={0.85}
          >
            <Text style={styles.openBookingsActionBtnText}>Open My Bookings Page →</Text>
            <SvgChevronRight size={15} color="#061E47" />
          </TouchableOpacity>
        </View>

        {/* ====================================================================== */}
        {/* 7. ENROLLED DEGREE MODULES PROGRESS */}
        {/* ====================================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>ENROLLED DEGREE MODULES</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Home')}>
              <Text style={styles.actionLink}>Dashboard →</Text>
            </TouchableOpacity>
          </View>

          {(dashboard?.enrolledModules && dashboard.enrolledModules.length > 0
            ? dashboard.enrolledModules
            : [
                { id: '1', code: 'IT2040', name: 'Data Structures & Algorithms', progress: 85 },
                { id: '2', code: 'IT2020', name: 'Database Management Systems', progress: 70 },
                { id: '3', code: 'IT3020', name: 'Mobile Application Development', progress: 60 },
              ]
          ).map((m: any) => (
            <View key={m.id || m.code} style={styles.moduleProgressItem}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                <Text style={styles.moduleProgressTitle}>{m.code}: {m.name}</Text>
                <Text style={styles.moduleProgressVal}>{m.progress || 75}%</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${m.progress || 75}%` }]} />
              </View>
            </View>
          ))}
        </View>

        {/* ====================================================================== */}
        {/* 8. STUDY FOCUS & ACADEMIC INTERESTS */}
        {/* ====================================================================== */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>ACADEMIC INTERESTS & FOCUS AREAS</Text>
            <TouchableOpacity onPress={() => setShowAddInterestModal(true)}>
              <Text style={styles.actionLink}>+ Add Subject</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagWrap}>
            {subjects.map((item) => (
              <TouchableOpacity key={item} style={styles.tag} onPress={() => handleRemoveInterest(item)}>
                <SvgBook size={12} color="#0284C7" />
                <Text style={styles.tagText}>{item}</Text>
                <SvgClose size={12} color="#64748B" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ====================================================================== */}
        {/* 9. ACCOUNT & SECURITY */}
        {/* ====================================================================== */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>ACCOUNT & SECURITY</Text>

          <TouchableOpacity style={styles.menuRow} onPress={openEditModal} activeOpacity={0.8}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <SvgUser size={16} color="#061E47" />
              </View>
              <Text style={styles.menuLabel}>Edit Student Profile Details</Text>
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

      {/* ====================================================================== */}
      {/* EDIT STUDENT PROFILE MODAL */}
      {/* ====================================================================== */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Edit Student Profile</Text>

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
              <TextInput style={styles.modalInput} value={editName} onChangeText={setEditName} placeholder="Student Name" />

              <Text style={styles.inputLabel}>DEGREE PROGRAMME</Text>
              <TextInput style={styles.modalInput} value={editDegree} onChangeText={setEditDegree} placeholder="e.g. BSc (Hons) Software Engineering" />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ACADEMIC YEAR</Text>
                  <TextInput style={styles.modalInput} value={editYear} onChangeText={setEditYear} placeholder="e.g. Year 3" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>SEMESTER</Text>
                  <TextInput style={styles.modalInput} value={editSem} onChangeText={setEditSem} placeholder="e.g. Sem 2" />
                </View>
              </View>

              <Text style={styles.inputLabel}>ABOUT & ACADEMIC BIO</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 70, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Write a brief academic bio..."
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

      {/* ====================================================================== */}
      {/* ADD STUDENT INTEREST MODAL */}
      {/* ====================================================================== */}
      <Modal visible={showAddInterestModal} animationType="fade" transparent onRequestClose={() => setShowAddInterestModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddInterestModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetHeading}>Add Academic Interest</Text>
            <Text style={styles.sheetSubheading}>Add a topic or technology you want to learn.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Machine Learning, React Native"
              placeholderTextColor="#94A3B8"
              value={newInterest}
              onChangeText={setNewInterest}
              autoFocus
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowAddInterestModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddInterest}>
                <Text style={styles.modalSaveBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const navyDark = '#061E47';
const navyCard = '#0B2754';
const orangeVibrant = '#F59E0B';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  headerBar: {
    backgroundColor: navyDark,
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
    color: orangeVibrant,
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  /* 1. CAMPUS WALLET CARD (AT THE TOP) */
  studentWalletHeroCard: {
    backgroundColor: '#061E47',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  studentWalletHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  studentWalletHeroIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  studentWalletHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  studentWalletActivePill: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  studentWalletActivePillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  studentWalletHeroSub: {
    fontSize: 10.5,
    color: '#93C5FD',
    marginTop: 2,
  },
  studentWalletHeroRight: {
    backgroundColor: '#0F2962',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  studentWalletHeroVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38BDF8',
  },
  studentWalletHeroLbl: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },

  /* 2. STUDENT HERO CARD */
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
  roleBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1D4ED8',
    letterSpacing: 0.3,
  },
  studentIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    marginTop: 2,
  },
  profileEmail: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  academicPillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    marginTop: 3,
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

  /* 4. ACADEMIC STATS */
  statsCard: {
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
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  statLbl: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    marginTop: 2,
  },

  /* 5. SECTION CARD */
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
  actionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  bioText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },

  /* 6. MY BOOKINGS HERO CARD */
  myBookingsHeroCard: {
    backgroundColor: '#061E47',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E3A8A',
  },
  myBookingsHeroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  myBookingsIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myBookingsHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  myBookingsHeroSub: {
    fontSize: 10.5,
    color: '#93C5FD',
    marginTop: 2,
    lineHeight: 15,
  },
  openBookingsActionBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  openBookingsActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#061E47',
  },

  /* 7. MODULE PROGRESS */
  moduleProgressItem: {
    marginBottom: 12,
  },
  moduleProgressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  moduleProgressVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },

  /* 8. TAGS */
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
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
  tagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
  },

  /* 9. MENU ROWS */
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

  /* MODALS */
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
    backgroundColor: '#061E47',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

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
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../../domain/stores/authStore';
import { useUserStore } from '../../../domain/stores/userStore';
import { useStudentStore } from '../../../domain/stores/studentStore';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
];

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const { logout } = useAuthStore();
  const { profile, fetchProfile, updateProfile, addSubject, removeSubject } = useUserStore();
  const { dashboard } = useStudentStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddInterestModal, setShowAddInterestModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editYear, setEditYear] = useState('Year 3');
  const [editSem, setEditSem] = useState('Sem 2');
  const [editAvatar, setEditAvatar] = useState('');

  // Status state
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add interest tag
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const user = profile || dashboard?.user;
  const name = user?.name || 'Nethmi Silva';
  const email = user?.email || 'nethmi.silva@student.unimentor.lk';
  const role = user?.role || 'student';
  const degree = user?.degreeProgramme || 'BSc (Hons) Software Engineering';
  const academicYear = user?.academicYear || 'Year 3';
  const semester = user?.semester || 'Sem 2';
  const bio =
    user?.bio ||
    'Software Engineering undergraduate passionate about algorithms, clean architecture, and distributed systems.';
  const subjects: string[] = user?.subjects?.length
    ? user.subjects
    : ['Data Structures', 'Software Architecture', 'DBMS', 'Mobile Development'];
  const avatarUri =
    user?.profilePicture ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

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
        Alert.alert(
          'Permission Needed',
          'Please allow photo library access to choose a profile picture.'
        );
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

  const handleTakePhoto = async () => {
    try {
      setIsPickingImage(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Please allow camera access to take a profile picture.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
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
      Alert.alert('Error', err?.message || 'Failed to capture photo.');
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
      Alert.alert('Profile Updated', 'Your profile changes have been saved.');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save profile changes.');
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
    Alert.alert('Remove Subject', `Remove "${item}" from your academic interests?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeSubject(item) },
    ]);
  };

  const handleClearBio = () => {
    Alert.alert('Clear Bio', 'Reset your bio to blank?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => updateProfile({ bio: '' }),
      },
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
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Hero Card */}
        <View style={styles.profileHeroCard}>
          <View style={styles.profileSummaryRow}>
            {/* Clickable Avatar to edit picture directly */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={openEditModal}
              activeOpacity={0.85}
            >
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              <View style={styles.onlineDot} />
              <View style={styles.avatarCameraBadgeSmall}>
                <Ionicons name="camera" size={11} color="#061E47" />
              </View>
            </TouchableOpacity>

            <View style={styles.profileCopyWrap}>
              <View style={styles.roleRow}>
                <Text style={styles.profileName}>{name}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.profileEmail}>{email}</Text>
              <Text style={styles.academicPillText}>{`${degree} • ${academicYear} ${semester}`}</Text>
            </View>

            {/* Edit button placed lower down */}
            <TouchableOpacity style={styles.editProfileBtn} onPress={openEditModal} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={13} color="#061E47" />
              <Text style={styles.editProfileBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Academic Stats */}
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

        {/* Bio Section with Update & Delete */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>ABOUT & ACADEMIC BIO</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={openEditModal}>
                <Text style={styles.actionLink}>Edit</Text>
              </TouchableOpacity>
              {bio ? (
                <TouchableOpacity onPress={handleClearBio}>
                  <Text style={[styles.actionLink, { color: '#EF4444' }]}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <Text style={styles.bioText}>
            {bio || 'No bio provided. Tap "Edit" to tell your mentors and peers about your goals!'}
          </Text>
        </View>

        {/* Interests & Subjects Tags (Create, Read, Delete) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>INTERESTS & FOCUS SUBJECTS</Text>
            <TouchableOpacity onPress={() => setShowAddInterestModal(true)}>
              <Text style={styles.actionLink}>+ Add Subject</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagsGrid}>
            {subjects.map((sub: string) => (
              <View key={sub} style={styles.tagPill}>
                <Text style={styles.tagPillText}>{sub}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveInterest(sub)}
                  style={styles.removeTagBtn}
                >
                  <Ionicons name="close-circle" size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionCard}>
          <TouchableOpacity
            style={styles.tutorSlotsNavBtn}
            onPress={() => navigation.navigate('TutorSlotManagement')}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.tutorSlotsNavIconWrap}>
                  <Ionicons name="calendar" size={18} color="#061E47" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tutorSlotsNavTitle}>Tutor Slot Manager</Text>
                  <Text style={styles.tutorSlotsNavSub}>Allocate slots, set fees & view attendees</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#061E47" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleToggleBtn}
            onPress={() => {
              const nextRole = role === 'mentor' ? 'student' : 'mentor';
              useAuthStore.getState().setUser({
                ...(user || {}),
                role: nextRole,
              } as any);
              Alert.alert(
                'Role Switched',
                `Switched active view to ${nextRole === 'mentor' ? 'Tutor/Mentor' : 'Student'}! Return to Home tab to see the updated dashboard.`
              );
            }}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="swap-horizontal" size={18} color="#061E47" />
              <Text style={styles.roleToggleBtnText}>
                Switch View to {role === 'mentor' ? 'Student' : 'Tutor'} Portal
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPrompt} activeOpacity={0.85}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit Student Profile</Text>
            <Text style={styles.sheetSubtitle}>Update your photo, degree, and academic information.</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Profile Image Customization Section */}
              <View style={styles.avatarEditSection}>
                <Text style={styles.avatarSectionTitle}>PROFILE PICTURE</Text>
                <View style={styles.avatarPreviewRow}>
                  <View style={styles.modalAvatarWrapper}>
                    <Image
                      source={{ uri: editAvatar || avatarUri }}
                      style={styles.modalAvatarImg}
                    />
                    <TouchableOpacity
                      style={styles.avatarCameraBadge}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera" size={13} color="#061E47" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.avatarActionBtnsCol}>
                    <TouchableOpacity
                      style={styles.imageActionBtn}
                      onPress={handlePickFromGallery}
                      disabled={isPickingImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="images-outline" size={14} color="#061E47" />
                      <Text style={styles.imageActionBtnText}>Choose Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.imageActionBtnSecondary}
                      onPress={handleTakePhoto}
                      disabled={isPickingImage}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="camera-outline" size={14} color="#061E47" />
                      <Text style={styles.imageActionBtnTextSecondary}>Take Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Preset Avatars */}
                <Text style={styles.presetLabel}>Or choose an avatar:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetsList}
                >
                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected = editAvatar === preset;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => setEditAvatar(preset)}
                        style={[
                          styles.presetAvatarItem,
                          isSelected && styles.presetAvatarItemSelected,
                        ]}
                        activeOpacity={0.8}
                      >
                        <Image source={{ uri: preset }} style={styles.presetImg} />
                        {isSelected && (
                          <View style={styles.presetCheckmarkBadge}>
                            <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Degree Programme</Text>
              <TextInput
                style={styles.modalInput}
                value={editDegree}
                onChangeText={setEditDegree}
                placeholder="e.g. BSc (Hons) Software Engineering"
                placeholderTextColor="#94A3B8"
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Year</Text>
                  <View style={styles.chipsWrap}>
                    {['Year 1', 'Year 2', 'Year 3', 'Year 4'].map((yr) => (
                      <TouchableOpacity
                        key={yr}
                        style={[styles.smallChip, editYear === yr && styles.smallChipActive]}
                        onPress={() => setEditYear(yr)}
                      >
                        <Text style={[styles.smallChipText, editYear === yr && styles.smallChipTextActive]}>
                          {yr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Semester</Text>
                  <View style={styles.chipsWrap}>
                    {['Sem 1', 'Sem 2'].map((sm) => (
                      <TouchableOpacity
                        key={sm}
                        style={[styles.smallChip, editSem === sm && styles.smallChipActive]}
                        onPress={() => setEditSem(sm)}
                      >
                        <Text style={[styles.smallChipText, editSem === sm && styles.smallChipTextActive]}>
                          {sm}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.modalInput, { height: 75, textAlignVertical: 'top' }]}
                value={editBio}
                onChangeText={setEditBio}
                multiline
                placeholder="Tell us about your academic goals..."
                placeholderTextColor="#94A3B8"
              />

              <TouchableOpacity
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={isSaving}
                activeOpacity={0.85}
              >
                {isSaving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Saving Profile...</Text>
                  </View>
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= ADD SUBJECT / INTEREST MODAL ================= */}
      <Modal visible={showAddInterestModal} animationType="slide" transparent onRequestClose={() => setShowAddInterestModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddInterestModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add Academic Interest</Text>
            <Text style={styles.sheetSubtitle}>Add subjects you want mentoring in.</Text>

            <TextInput
              style={styles.modalInput}
              value={newInterest}
              onChangeText={setNewInterest}
              placeholder="e.g. Artificial Intelligence, Cryptography"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddInterest}>
              <Text style={styles.saveBtnText}>+ Add Interest</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
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
  profileHeroCard: {
    backgroundColor: '#061E47',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#061E47',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  editProfileBtn: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginBottom: 4,
    marginLeft: 8,
  },
  editProfileBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FBBF24',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#061E47',
  },
  avatarCameraBadgeSmall: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#061E47',
  },
  profileCopyWrap: {
    flex: 1,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  roleBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  academicPillText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  statsCard: {
    backgroundColor: '#0B2754',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLbl: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLink: {
    color: '#061E47',
    fontSize: 11,
    fontWeight: '700',
  },
  bioText: {
    color: '#334155',
    fontSize: 13,
    lineHeight: 19,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2F8',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
  },
  tagPillText: {
    color: '#061E47',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  removeTagBtn: {
    padding: 3,
  },
  removeTagBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  actionCard: {
    marginTop: 8,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '800',
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
    maxHeight: '90%',
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

  /* Avatar Section in Modal */
  avatarEditSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  avatarSectionTitle: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  avatarPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 14,
  },
  modalAvatarWrapper: {
    position: 'relative',
  },
  modalAvatarImg: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2.5,
    borderColor: '#F59E0B',
  },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarActionBtnsCol: {
    flex: 1,
    gap: 8,
  },
  imageActionBtn: {
    backgroundColor: '#FBBF24',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageActionBtnText: {
    color: '#061E47',
    fontSize: 12,
    fontWeight: '800',
  },
  imageActionBtnSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  imageActionBtnTextSecondary: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  presetLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  presetsList: {
    gap: 10,
    paddingVertical: 2,
  },
  presetAvatarItem: {
    position: 'relative',
    borderRadius: 22,
    borderWidth: 2.5,
    borderColor: 'transparent',
    padding: 1,
  },
  presetAvatarItemSelected: {
    borderColor: '#F59E0B',
  },
  presetImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  presetCheckmarkBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#F59E0B',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  inputLabel: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
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
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  smallChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  smallChipActive: {
    backgroundColor: '#F59E0B',
  },
  smallChipText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  smallChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 6,
  },
  cancelBtnText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  tutorSlotsNavBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    marginBottom: 10,
  },
  tutorSlotsNavIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorSlotsNavTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#061E47',
  },
  tutorSlotsNavSub: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 2,
  },
  roleToggleBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 10,
  },
  roleToggleBtnText: {
    color: '#061E47',
    fontSize: 13,
    fontWeight: '700',
  },
});

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import { useAuthStore } from '../../../domain/stores/authStore';
import { useUserStore } from '../../../domain/stores/userStore';
import { useStudentStore } from '../../../domain/stores/studentStore';
import { Pencil } from 'lucide-react-native';
import PageHeader from '../../components/PageHeader';

export default function ProfileScreen() {
  const { logout } = useAuthStore();
  const { profile, fetchProfile, updateProfile, addSubject, removeSubject } = useUserStore();
  const { dashboard, fetchDashboard } = useStudentStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddInterestModal, setShowAddInterestModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editDegree, setEditDegree] = useState('');
  const [editYear, setEditYear] = useState('Year 3');
  const [editSem, setEditSem] = useState('Sem 2');
  const [editAvatar, setEditAvatar] = useState('');

  // Add interest tag
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    fetchProfile();
    void fetchDashboard();
  }, [fetchProfile, fetchDashboard]);

  const user = profile || dashboard?.user;
  const name = user?.name || 'Student';
  const email = user?.email || '';
  const role = user?.role || 'student';
  const degree = user?.degreeProgramme || '';
  const academicYear = user?.academicYear || '';
  const semester = user?.semester || '';
  const academicLine = [degree, academicYear, semester].filter(Boolean).join(' · ');
  const bio = user?.bio || '';
  const subjects: string[] = user?.subjects ?? [];
  const avatarUri = user?.profilePicture || '';

  const stats = dashboard?.academicStats || { goals: 0, plans: 0, dueTests: 0, done: 0 };

  const openEditModal = () => {
    setEditName(name);
    setEditBio(bio);
    setEditDegree(degree);
    setEditYear(academicYear);
    setEditSem(semester);
    setEditAvatar(avatarUri);
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Required', 'Name cannot be empty.');
      return;
    }

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
      <PageHeader title="My Student Profile" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.editHeaderBtn} onPress={openEditModal}>
          <Pencil size={14} color="#FFFFFF" />
          <Text style={styles.editHeaderBtnText}>Edit</Text>
        </TouchableOpacity>

        {/* Profile Card Summary */}
        <View style={styles.profileSummaryRow}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.profileCopyWrap}>
            <View style={styles.roleRow}>
              <Text style={styles.profileName}>{name}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{role.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.profileEmail}>{email}</Text>
            <Text style={styles.academicPillText}>{academicLine || 'Add your programme'}</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
                  <Text style={styles.removeTagBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionCard}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPrompt}>
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ================= EDIT PROFILE MODAL ================= */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEditModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Edit Student Profile</Text>
            <Text style={styles.sheetSubtitle}>Update your degree and academic information.</Text>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
            />

            <Text style={styles.inputLabel}>Degree Programme</Text>
            <TextInput
              style={styles.modalInput}
              value={editDegree}
              onChangeText={setEditDegree}
              placeholder="e.g. BSc (Hons) Software Engineering"
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
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile}>
              <Text style={styles.saveBtnText}>Save Profile</Text>
            </TouchableOpacity>
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
  header: {
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  editHeaderBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#102B5D',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  editHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  avatarFallback: { backgroundColor: '#102B5D', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#FFF', fontSize: 22, fontWeight: '800' },
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
  profileCopyWrap: {
    flex: 1,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    color: '#102B5D',
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
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
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
    marginTop: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

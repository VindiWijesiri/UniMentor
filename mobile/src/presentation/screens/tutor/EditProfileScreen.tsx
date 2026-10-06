import React, { useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import { useAuthStore } from '../../../domain/stores/authStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function EditProfileScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const { user, updateUserProfile } = useAuthStore();
  const tutor = user ?? { name: '', phone: '', degree: '', hourlyRate: 0, bio: '', availability: '' };

  const [name, setName] = useState(tutor.name);
  const [phone, setPhone] = useState(tutor.phone || '+94 71 987 6543');
  const [degree, setDegree] = useState(tutor.degree || 'MSc in Software Engineering & AI');
  const [hourlyRate, setHourlyRate] = useState(String(tutor.hourlyRate || 2500));
  const [bio, setBio] = useState(tutor.bio || '');
  const [availability, setAvailability] = useState(
    tutor.availability || 'Mon - Thu: 5:00 PM - 9:00 PM | Sat: 10:00 AM - 2:00 PM'
  );

  const handleSave = () => {
    updateUserProfile({
      name,
      phone,
      degree,
      hourlyRate: Number(hourlyRate) || 2500,
      bio,
      availability,
    });
    Alert.alert('Profile Saved', 'Your tutor profile information has been updated.');
    navigation.goBack();
  };

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave}>
            <Text style={styles.saveHeaderText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar edit badge */}
        <View style={styles.avatarEditSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{name.charAt(0)}</Text>
            </View>
            <View style={styles.cameraIconBadge}>
              <Text style={styles.cameraEmoji}>📷</Text>
            </View>
          </View>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        {/* Inputs */}
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.label}>Official University Degree / Title</Text>
        <TextInput
          style={styles.input}
          value={degree}
          onChangeText={setDegree}
          placeholder="Degree"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.label}>Contact Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Hourly Rate (LKR / hr)</Text>
        <TextInput
          style={styles.input}
          value={hourlyRate}
          onChangeText={setHourlyRate}
          placeholder="Rate in LKR"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Availability Schedule</Text>
        <TextInput
          style={styles.input}
          value={availability}
          onChangeText={setAvailability}
          placeholder="e.g. Mon - Thu: 5PM - 9PM"
          placeholderTextColor={colors.textLight}
        />

        <Text style={styles.label}>Teaching Bio & Methodology</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Describe your tutoring methods, expectations, and focus areas..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={4}
        />

        {/* Add / Request Module Notice */}
        <View style={styles.addModuleBox}>
          <View style={styles.addModHeader}>
            <Text style={styles.addModIcon}>➕</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.addModTitle}>Request Additional Teaching Module</Text>
              <Text style={styles.addModSub}>
                Requires uploading transcript proof for faculty admin audit.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.requestModBtn}
            onPress={() => navigation.navigate('VerifyIdentity')}
          >
            <Text style={styles.requestModBtnText}>Upload Transcript for New Module  →</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveButtonText}>Save Changes  ✓</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backArrow: {
    fontSize: 24,
    color: colors.navy,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.secondary,
  },
  saveHeaderText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  avatarEditSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  cameraEmoji: {
    fontSize: 14,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    marginBottom: 14,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  bioInput: {
    height: 90,
    textAlignVertical: 'top',
  },
  addModuleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 6,
    marginBottom: 24,
  },
  addModHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  addModIcon: {
    fontSize: 18,
  },
  addModTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  addModSub: {
    fontSize: 11,
    color: colors.textLight,
  },
  requestModBtn: {
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  requestModBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});

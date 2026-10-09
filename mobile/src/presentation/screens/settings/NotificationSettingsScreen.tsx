import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import { useAuthStore } from '../../../domain/stores/authStore';
import { NotificationPrefs, userRepository } from '../../../data/repositories/userRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function NotificationSettingsScreen({ navigation }: Props) {
  const token = useAuthStore((state) => state.token);
  const realSession = !!token && !token.startsWith('demo_') && !token.startsWith('mock_');
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    sessionReminders: true,
    chatMessages: true,
    bookingUpdates: true,
    verificationAlerts: true,
    semesterRenewals: true,
    facultyNews: false,
  });
  const [loading, setLoading] = useState(realSession);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!realSession) return;
    userRepository.getNotificationSettings()
      .then(setPrefs)
      .catch(() => Alert.alert('Could not load', 'Your saved notification settings could not be loaded.'))
      .finally(() => setLoading(false));
  }, [realSession]);

  const setPref = (key: keyof NotificationPrefs, value: boolean) => {
    setPrefs((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!realSession) {
      Alert.alert('Real sign-in required', 'Notification settings are stored on the account you sign in with.');
      return;
    }
    setSaving(true);
    try {
      const saved = await userRepository.updateNotificationSettings(prefs);
      setPrefs(saved);
      Alert.alert('Preferences saved', 'These notification choices are stored on your account.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Not saved', 'The notification settings could not be stored.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.saveBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
        {/* Session Alerts */}
        <Text style={styles.sectionHeader}>STUDY SESSIONS & MESSAGING</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>Session Reminders</Text>
              <Text style={styles.sub}>Alert 30 minutes before your tutoring session starts</Text>
            </View>
            <Switch
              value={prefs.sessionReminders}
              onValueChange={(value) => setPref('sessionReminders', value)}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>Direct Chat Messages</Text>
              <Text style={styles.sub}>Instant push notifications when tutor/student sends a message</Text>
            </View>
            <Switch
              value={prefs.chatMessages}
              onValueChange={(value) => setPref('chatMessages', value)}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>Booking Confirmations & Changes</Text>
              <Text style={styles.sub}>Alerts when a session is booked, rescheduled, or cancelled</Text>
            </View>
            <Switch
              value={prefs.bookingUpdates}
              onValueChange={(value) => setPref('bookingUpdates', value)}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>
        </View>

        {/* Verification & Compliance Alerts */}
        <Text style={styles.sectionHeader}>VERIFICATION & COMPLIANCE</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>Tutor & ID Verification Status</Text>
              <Text style={styles.sub}>Immediate alerts when modules or IDs are approved or rejected</Text>
            </View>
            <Switch
              value={prefs.verificationAlerts}
              onValueChange={(value) => setPref('verificationAlerts', value)}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>Semester Re-Enrollment Alerts</Text>
              <Text style={styles.sub}>Remind you before annual university verification expires</Text>
            </View>
            <Switch
              value={prefs.semesterRenewals}
              onValueChange={(value) => setPref('semesterRenewals', value)}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>
        </View>

        {/* Academic Community */}
        <Text style={styles.sectionHeader}>ACADEMIC COMMUNITY UPDATES</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>Faculty Mentor Highlights</Text>
              <Text style={styles.sub}>Weekly digest of newly verified top tutors in your department</Text>
            </View>
            <Switch
              value={prefs.facultyNews}
              onValueChange={(value) => setPref('facultyNews', value)}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveActionText}>Apply Notification Preferences</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  saveBtn: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  textWrap: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  sub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  saveActionBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 6,
  },
  saveActionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
});

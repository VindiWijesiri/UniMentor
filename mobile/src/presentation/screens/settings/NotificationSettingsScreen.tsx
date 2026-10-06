import React, { useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function NotificationSettingsScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const [sessionReminders, setSessionReminders] = useState(true);
  const [chatMessages, setChatMessages] = useState(true);
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [verificationAlerts, setVerificationAlerts] = useState(true);
  const [semesterRenewals, setSemesterRenewals] = useState(true);
  const [facultyNews, setFacultyNews] = useState(false);

  const handleSave = () => {
    Alert.alert('Preferences Saved', 'Your notification alert settings have been synchronized.');
    navigation.goBack();
  };

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Session Alerts */}
        <Text style={styles.sectionHeader}>STUDY SESSIONS & MESSAGING</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.textWrap}>
              <Text style={styles.title}>Session Reminders</Text>
              <Text style={styles.sub}>Alert 30 minutes before your tutoring session starts</Text>
            </View>
            <Switch
              value={sessionReminders}
              onValueChange={setSessionReminders}
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
              value={chatMessages}
              onValueChange={setChatMessages}
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
              value={bookingUpdates}
              onValueChange={setBookingUpdates}
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
              value={verificationAlerts}
              onValueChange={setVerificationAlerts}
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
              value={semesterRenewals}
              onValueChange={setSemesterRenewals}
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
              value={facultyNews}
              onValueChange={setFacultyNews}
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
    paddingTop: 12,
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
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
});

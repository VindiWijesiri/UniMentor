import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../shared/theme';
import {
  SvgChevronLeft,
  SvgCheck,
  SvgShieldCheck,
  SvgUserPlus,
} from '../../components/common/SvgIcons';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface ExistingAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  faculty: string;
  status: 'Active' | 'Pending Activation';
  initials: string;
}

const INITIAL_ADMINS: ExistingAdmin[] = [
  {
    id: 'adm-01',
    name: 'Admin Kasun Jayawardena',
    email: 'admin.kasun@unimentor.lk',
    role: 'Campus Super Admin',
    faculty: 'Academic Administration',
    status: 'Active',
    initials: 'KJ',
  },
  {
    id: 'adm-02',
    name: 'Dr. Elena Rostova',
    email: 'elena.rostova@unimentor.lk',
    role: 'Faculty LIC Reviewer',
    faculty: 'Faculty of Computing',
    status: 'Active',
    initials: 'ER',
  },
  {
    id: 'adm-03',
    name: 'Marcus Samaraweera',
    email: 'marcus.s@unimentor.lk',
    role: 'Verification Officer',
    faculty: 'Quality Assurance Board',
    status: 'Pending Activation',
    initials: 'MS',
  },
];

export default function AddAdminScreen({ navigation }: Props) {
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [selectedRole, setSelectedRole] = useState<'super_admin' | 'lic' | 'verification' | 'moderator'>('super_admin');
  const [department, setDepartment] = useState('Faculty of Computing');
  const [clearance, setClearance] = useState<'Tier 1' | 'Tier 2' | 'Tier 3'>('Tier 1');
  const [adminsList, setAdminsList] = useState<ExistingAdmin[]>(INITIAL_ADMINS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permissions state
  const [permissions, setPermissions] = useState({
    approveTutors: true,
    viewSessions: true,
    manageUsers: true,
    auditLogs: true,
  });

  const togglePermission = (key: keyof typeof permissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev [key] }));
  };

  const handleCreateAdmin = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the full name of the staff member.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter an official university email address.');
      return;
    }
    if (!staffId.trim()) {
      Alert.alert('Staff ID Required', 'Please enter the official campus employee ID number.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const roleLabels: Record<typeof selectedRole, string> = {
        super_admin: 'Campus Super Admin',
        lic: 'Faculty LIC Reviewer',
        verification: 'Verification Officer',
        moderator: 'Safety & Dispute Moderator',
      };

      const initials = name
        .trim()
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      const newAdmin: ExistingAdmin = {
        id: `adm-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        role: roleLabels[selectedRole],
        faculty: department,
        status: 'Active',
        initials,
      };

      setAdminsList((prev) => [newAdmin, ...prev]);

      Alert.alert(
        'Admin Access Provisioned! 🛡️',
        `${name.trim()} has been registered as ${roleLabels[selectedRole]}.\nAn activation key has been dispatched to ${email.trim()}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setName('');
              setEmail('');
              setStaffId('');
            },
          },
        ]
      );
    }, 600);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Navy Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            activeOpacity={0.8}
          >
            <SvgChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Add Administrator</Text>
            <Text style={styles.headerSub}>Campus Governance & Faculty Access</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 85 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Security Protocol Banner */}
          <View style={styles.protocolCard}>
            <View style={styles.protocolIconWrap}>
              <SvgShieldCheck size={24} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.protocolTitle}>FACULTY CLEARANCE PROTOCOL</Text>
              <Text style={styles.protocolDesc}>
                Admin access allows approving tutor certifications and monitoring campus sessions. Every action is cryptographically logged.
              </Text>
            </View>
          </View>

          {/* Form Container */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <SvgUserPlus size={20} color="#EAA023" />
              <Text style={styles.formHeading}>Staff Member Details</Text>
            </View>

            {/* Full Name */}
            <Text style={styles.label}>Full Legal Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Prof. Jayantha Vandebona"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />

            {/* Official Email */}
            <Text style={styles.label}>Official University Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. jayantha.v@unimentor.lk"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            {/* Staff ID */}
            <Text style={styles.label}>Campus Staff ID / Employee # *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ADM-2026-084"
              placeholderTextColor="#94A3B8"
              value={staffId}
              onChangeText={setStaffId}
            />

            {/* Department */}
            <Text style={styles.label}>Department / Faculty</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Faculty of Computing / Administration"
              placeholderTextColor="#94A3B8"
              value={department}
              onChangeText={setDepartment}
            />

            {/* Role Selector */}
            <Text style={styles.label}>Administrative Role</Text>
            <View style={styles.roleGrid}>
              {[
                { id: 'super_admin', label: 'Super Admin', sub: 'Full platform governance' },
                { id: 'lic', label: 'Faculty LIC', sub: 'Lecturer review & curriculum' },
                { id: 'verification', label: 'Verification', sub: 'Document & identity audits' },
                { id: 'moderator', label: 'Moderator', sub: 'Safety & session dispute' },
              ].map((item) => {
                const active = selectedRole === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.roleChip, active && styles.roleChipActive]}
                    onPress={() => setSelectedRole(item.id as any)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.roleChipTitle, active && styles.roleChipTitleActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.roleChipSub, active && styles.roleChipSubActive]}>
                      {item.sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Clearance Level */}
            <Text style={[styles.label, { marginTop: 14 }]}>Security Clearance Level</Text>
            <View style={styles.clearanceRow}>
              {(['Tier 1', 'Tier 2', 'Tier 3'] as const).map((tier) => (
                <TouchableOpacity
                  key={tier}
                  style={[styles.clearanceBtn, clearance === tier && styles.clearanceBtnActive]}
                  onPress={() => setClearance(tier)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.clearanceText,
                      clearance === tier && styles.clearanceTextActive,
                    ]}
                  >
                    {tier}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Permissions Matrix */}
            <Text style={[styles.label, { marginTop: 16 }]}>Access Permissions Granted</Text>
            <View style={styles.permsBox}>
              {[
                { key: 'approveTutors', label: 'Approve & Certify Peer Tutors' },
                { key: 'viewSessions', label: 'Inspect Student & Mentor Scheduled Sessions' },
                { key: 'manageUsers', label: 'Manage Accounts, Status & Suspensions' },
                { key: 'auditLogs', label: 'Access System Telemetry & Performance Reports' },
              ].map((perm) => {
                const checked = permissions[perm.key as keyof typeof permissions];
                return (
                  <TouchableOpacity
                    key={perm.key}
                    style={styles.permRow}
                    onPress={() => togglePermission(perm.key as keyof typeof permissions)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                      {checked && <SvgCheck size={13} color="#FFFFFF" strokeWidth={3} />}
                    </View>
                    <Text style={styles.permLabel}>{perm.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
              onPress={handleCreateAdmin}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Provisioning Access...' : 'Authorize & Dispatch Access Key  →'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Active Administrators Section */}
          <View style={styles.activeAdminsHeader}>
            <View style={styles.orangeIndicator} />
            <Text style={styles.sectionTitle}>CURRENT CAMPUS ADMINISTRATORS ({adminsList.length})</Text>
          </View>

          <View style={styles.adminsListCard}>
            {adminsList.map((admin, idx) => (
              <React.Fragment key={admin.id}>
                <View style={styles.adminItemRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarInitials}>{admin.initials}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminItemName}>{admin.name}</Text>
                    <Text style={styles.adminItemRole}>{admin.role} • {admin.faculty}</Text>
                    <Text style={styles.adminItemEmail}>{admin.email}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      admin.status === 'Active' ? styles.statusActive : styles.statusPending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        admin.status === 'Active' ? styles.statusActiveText : styles.statusPendingText,
                      ]}
                    >
                      {admin.status}
                    </Text>
                  </View>
                </View>
                {idx < adminsList.length - 1 && <View style={styles.itemDivider} />}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  brandMentor: {
    color: '#EAA023',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },

  /* Protocol Banner */
  protocolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
    gap: 12,
  },
  protocolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  protocolDesc: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 15,
  },

  /* Form Card */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#061E47',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#061E47',
    marginBottom: 12,
  },

  /* Role Grid */
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  roleChipActive: {
    borderColor: '#EAA023',
    backgroundColor: '#FFFBEB',
  },
  roleChipTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  roleChipTitleActive: {
    color: '#B45309',
  },
  roleChipSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  roleChipSubActive: {
    color: '#92400E',
  },

  /* Clearance Row */
  clearanceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clearanceBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    alignItems: 'center',
  },
  clearanceBtnActive: {
    borderColor: '#061E47',
    backgroundColor: '#061E47',
  },
  clearanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  clearanceTextActive: {
    color: '#FFFFFF',
  },

  /* Permissions Box */
  permsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 16,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#EAA023',
    borderColor: '#EAA023',
  },
  permLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },

  /* Submit Button */
  submitBtn: {
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnText: {
    color: '#061E47',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Current Admins List */
  activeAdminsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  orangeIndicator: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EAA023',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#061E47',
    letterSpacing: 0.8,
  },
  adminsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  adminItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#061E47',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#EAA023',
    fontSize: 13,
    fontWeight: '800',
  },
  adminItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#061E47',
  },
  adminItemRole: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
  },
  adminItemEmail: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusActiveText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
});

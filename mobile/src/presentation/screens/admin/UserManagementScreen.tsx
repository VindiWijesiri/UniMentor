import React, { useEffect, useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import { UserRole, AccountStatus, User } from '../../../domain/entities/User';
import { adminRepository } from '../../../data/repositories/adminRepository';
import { authRepository } from '../../../data/repositories/authRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface UserDirectoryItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  university: string;
  studentId: string;
  faculty: string;
}

function mapDirectory(user: User): UserDirectoryItem {
  const status = (user.accountStatus
    ?? (user.verificationStatus === 'rejected' ? 'rejected' : 'active')) as AccountStatus;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status,
    university: user.university || '—',
    studentId: user.studentId || '—',
    faculty: user.faculty || user.degreeProgramme || '—',
  };
}

export default function UserManagementScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userList, setUserList] = useState<UserDirectoryItem[]>([]);

  useEffect(() => {
    adminRepository.directory()
      .then((users) => setUserList(users.map(mapDirectory)))
      .catch(() => setUserList([]));
  }, []);
  const [selectedUser, setSelectedUser] = useState<UserDirectoryItem | null>(null);

  const filtered = userList.filter((item) => {
    const matchesRole = roleFilter === 'all' || item.role === roleFilter;
    const matchesQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesQuery;
  });

  const handleToggleSuspend = async () => {
    if (!selectedUser) return;
    const nextStatus: AccountStatus = selectedUser.status === 'suspended' ? 'active' : 'suspended';
    try {
      await adminRepository.setAccountStatus(selectedUser.id, nextStatus);
      setUserList((list) =>
        list.map((u) => (u.id === selectedUser.id ? { ...u, status: nextStatus } : u))
      );
      setSelectedUser({ ...selectedUser, status: nextStatus });
    } catch {
      Alert.alert('Not updated', 'The account status could not be saved.');
    }
  };

  const handleSendResetLink = async () => {
    if (!selectedUser?.email) return;
    try {
      const result = await authRepository.forgotPassword(selectedUser.email);
      Alert.alert('Password reset', result.devCode ? `Use this code for ${selectedUser.email}: ${result.devCode}` : result.message);
    } catch {
      Alert.alert('Not sent', 'A reset code could not be created for this account.');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'student':
        return { label: 'STUDENT', bg: '#E0F2FE', text: colors.primary };
      case 'mentor':
        return { label: 'TUTOR', bg: '#FEF3C7', text: '#B45309' };
      case 'admin':
        return { label: 'ADMIN', bg: '#EDE9FE', text: '#6D28D9' };
      case 'lecturer':
      case 'lic':
      default:
        return { label: String(role).toUpperCase(), bg: '#ECFDF5', text: colors.success };
    }
  };

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Directory</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, ID, or email..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Role Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {(['all', 'student', 'mentor', 'lecturer', 'admin'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.tabChip, roleFilter === r && styles.tabChipActive]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={[styles.tabChipText, roleFilter === r && styles.tabChipTextActive]}>
                {r.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* User Cards List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.resultsCount}>Registered Users ({filtered.length})</Text>

        {filtered.map((item) => {
          const roleBadge = getRoleBadge(item.role);
          const isSuspended = item.status === 'suspended';
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.userCard, isSuspended && styles.userCardSuspended]}
              onPress={() => setSelectedUser(item)}
              activeOpacity={0.88}
            >
              <View style={styles.userTop}>
                <View
                  style={[
                    styles.avatar,
                    item.role === 'mentor' && { backgroundColor: '#B45309' },
                    item.role === 'admin' && { backgroundColor: '#6D28D9' },
                    item.role === 'lecturer' && { backgroundColor: colors.success },
                  ]}
                >
                  <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                  <Text style={styles.userMeta}>
                    ID: {item.studentId} • {item.university}
                  </Text>
                </View>

                <View style={styles.badgeColumn}>
                  <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: roleBadge.text }]}>
                      {roleBadge.label}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isSuspended ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#ECFDF5' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        isSuspended ? { color: colors.error } : { color: colors.success },
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User Details & Permissions Action Modal */}
      <Modal visible={selectedUser !== null} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalUserName}>{selectedUser?.name}</Text>
                <Text style={styles.modalUserRole}>
                  {selectedUser?.role?.toUpperCase()} • {selectedUser?.university}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Registration ID:</Text>
                <Text style={styles.infoVal}>{selectedUser?.studentId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Official Email:</Text>
                <Text style={styles.infoVal}>{selectedUser?.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Account Status:</Text>
                <Text
                  style={[
                    styles.infoVal,
                    {
                      color:
                        selectedUser?.status === 'suspended' ? colors.error : colors.success,
                      fontWeight: '800',
                    },
                  ]}
                >
                  {selectedUser?.status?.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={styles.actionsLabel}>ADMINISTRATIVE ACTIONS:</Text>

            <TouchableOpacity style={styles.modalActionBtn} onPress={handleToggleSuspend}>
              <Text style={styles.actionBtnIcon}>
                {selectedUser?.status === 'suspended' ? '✅' : '🚫'}
              </Text>
              <Text
                style={[
                  styles.modalActionText,
                  selectedUser?.status === 'suspended' ? { color: colors.success } : { color: colors.error },
                ]}
              >
                {selectedUser?.status === 'suspended'
                  ? 'Reactivate University Account'
                  : 'Suspend Account & Restrict Sessions'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalActionBtn} onPress={handleSendResetLink}>
              <Text style={styles.actionBtnIcon}>🔑</Text>
              <Text style={styles.modalActionText}>Send Emergency Password Reset Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setSelectedUser(null)}
            >
              <Text style={styles.doneBtnText}>Close Window</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  headerSpacer: {
    width: 38,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  tabsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tabChipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
  },
  tabChipTextActive: {
    color: colors.white,
    fontWeight: '800',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textLight,
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  userCardSuspended: {
    borderColor: '#FECACA',
    backgroundColor: '#FFFBFB',
  },
  userTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  userEmail: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  userMeta: {
    fontSize: 10,
    color: colors.text,
    marginTop: 2,
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 43, 103, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalUserName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  modalUserRole: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  modalClose: {
    fontSize: 18,
    color: colors.textLight,
    padding: 4,
  },
  modalInfoBox: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 16,
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoKey: {
    fontSize: 12,
    color: colors.textLight,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.navy,
  },
  actionsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 8,
  },
  actionBtnIcon: {
    fontSize: 16,
  },
  modalActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  doneBtn: {
    backgroundColor: colors.navy,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  doneBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import { useAuthStore } from '../../../domain/stores/authStore';
import { authRepository } from '../../../data/repositories/authRepository';
import { userRepository } from '../../../data/repositories/userRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function SecurityScreen({ navigation }: Props) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const token = useAuthStore((state) => state.token);
  const setToken = useAuthStore((state) => state.setToken);
  const rememberToken = useAuthStore((state) => state.rememberToken);
  const realSession = !!token && !token.startsWith('demo_') && !token.startsWith('mock_');

  useEffect(() => {
    if (!realSession) return;
    userRepository.getSecurity()
      .then((settings) => {
        setTwoFactorEnabled(settings.twoFactorEnabled);
        setBiometricEnabled(settings.biometricEnabled);
      })
      .catch(() => undefined);
  }, [realSession]);

  const saveSecurity = async (next: { twoFactorEnabled?: boolean; biometricEnabled?: boolean }) => {
    if (!realSession) {
      Alert.alert('Real sign-in required', 'These settings apply to the account you signed in with.');
      return false;
    }
    try {
      const saved = await userRepository.updateSecurity(next);
      setTwoFactorEnabled(saved.twoFactorEnabled);
      setBiometricEnabled(saved.biometricEnabled);
      return true;
    } catch {
      Alert.alert('Not saved', 'The security setting could not be stored.');
      return false;
    }
  };

  const handleTwoFactor = async (value: boolean) => {
    const previous = twoFactorEnabled;
    setTwoFactorEnabled(value);
    const saved = await saveSecurity({ twoFactorEnabled: value });
    if (!saved) setTwoFactorEnabled(previous);
    else Alert.alert(value ? 'Two-factor on' : 'Two-factor off', value
      ? 'The next sign-in will email a 6-digit code.'
      : 'Password sign-in no longer asks for a code.');
  };

  const handleBiometric = async (value: boolean) => {
    if (!realSession) {
      Alert.alert('Real sign-in required', 'Turn this on after signing in with the account email.');
      return;
    }
    if (value) {
      const localAuth = await import('expo-local-authentication');
      const hardware = await localAuth.hasHardwareAsync();
      const enrolled = await localAuth.isEnrolledAsync();
      if (!hardware || !enrolled) {
        Alert.alert('Biometrics unavailable', 'This device has no enrolled fingerprint or face unlock.');
        return;
      }
      const result = await localAuth.authenticateAsync({ promptMessage: 'Confirm biometrics for UniMentor' });
      if (!result.success) return;
      const secure = await import('expo-secure-store');
      await secure.setItemAsync('auth.biometric', '1');
      if (token) await rememberToken(token);
    } else {
      const secure = await import('expo-secure-store');
      await secure.deleteItemAsync('auth.biometric');
    }
    const previous = biometricEnabled;
    setBiometricEnabled(value);
    const saved = await saveSecurity({ biometricEnabled: value });
    if (!saved) {
      setBiometricEnabled(previous);
      if (value) {
        const secure = await import('expo-secure-store');
        await secure.deleteItemAsync('auth.biometric');
      }
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Validation', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Validation', 'New passwords do not match.');
      return;
    }
    if (!token || token.startsWith('demo_') || token.startsWith('mock_')) {
      Alert.alert('Real sign-in required', 'Change the password after signing in with the account email. Demo role switch does not have its own password.');
      return;
    }
    try {
      await authRepository.changePassword(currentPassword, newPassword);
      Alert.alert('Password updated', 'Use the new password the next time you sign in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      Alert.alert('Not updated', error?.response?.data?.message ?? error?.message ?? 'The password could not be changed.');
    }
  };

  const handleRevokeSessions = async () => {
    if (!realSession) {
      Alert.alert('Real sign-in required', 'Demo role switch does not have other device sessions.');
      return;
    }
    try {
      const result = await authRepository.revokeSessions();
      setToken(result.token);
      await rememberToken(result.token);
      Alert.alert('Other sessions ended', 'This device stays signed in. Every other sign-in must enter the password again.');
    } catch {
      Alert.alert('Not updated', 'Other sessions could not be signed out.');
    }
  };

  return (
    <View style={styles.page}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security & Privacy</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Security Shield Banner */}
        <View style={styles.shieldBanner}>
          <Text style={styles.shieldIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.shieldTitle}>Account Protection Level: High</Text>
            <Text style={styles.shieldSub}>
              2FA enabled • Biometric authentication active
            </Text>
          </View>
        </View>

        {/* Change Password Card */}
        <Text style={styles.sectionHeader}>CHANGE PASSWORD</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter current password"
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />

          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.updatePassBtn}
            onPress={handleChangePassword}
            activeOpacity={0.85}
          >
            <Text style={styles.updatePassText}>Update Password</Text>
          </TouchableOpacity>
        </View>

        {/* Biometrics & 2FA */}
        <Text style={styles.sectionHeader}>AUTHENTICATION PREFERENCES</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Two-Factor Authentication (2FA)</Text>
              <Text style={styles.toggleSub}>
              Require an emailed 6-digit code on every password sign-in
              </Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={handleTwoFactor}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Biometric Face ID / Fingerprint</Text>
              <Text style={styles.toggleSub}>
                Fast sign-in using verified device biometrics
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometric}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>
        </View>

        {/* Active Device Sessions */}
        <Text style={styles.sectionHeader}>ACTIVE DEVICE SESSIONS</Text>
        <View style={styles.card}>
          <View style={styles.sessionItem}>
            <Text style={styles.deviceIcon}>📱</Text>
            <View style={styles.sessionDetails}>
              <View style={styles.deviceTitleRow}>
                <Text style={styles.deviceName}>This device</Text>
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>CURRENT</Text>
                </View>
              </View>
              <Text style={styles.deviceMeta}>
                Other phones and browsers are not listed here. Ending other sessions makes those sign-ins ask for the password again.
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.revokeBtn} onPress={handleRevokeSessions}>
            <Text style={styles.revokeText}>Terminate All Other Sessions  ✕</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
  },
  headerSpacer: {
    width: 38,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  shieldBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  shieldIcon: {
    fontSize: 24,
  },
  shieldTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  shieldSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
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
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  updatePassBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  updatePassText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  toggleSub: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  deviceIcon: {
    fontSize: 22,
  },
  sessionDetails: {
    flex: 1,
  },
  deviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  currentBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  deviceMeta: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  revokeBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  revokeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
  },
});

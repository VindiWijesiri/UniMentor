import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';
import { useAuthStore } from '../../../domain/stores/authStore';
import { loginUseCase } from '../../../domain/usecases/auth/loginUseCase';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AdminLoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('admin@unimentor.dev');
  const [password, setPassword] = useState('password123');
  const [securityToken, setSecurityToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setUser, setToken, setPendingRoute } = useAuthStore();

  const handleAdminLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Staff email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const result = await loginUseCase({ email: email.trim(), password });
      if (result.user.role !== 'admin' && result.user.role !== 'lic') {
        Alert.alert('Staff only', 'This portal accepts admin and faculty accounts.');
        return;
      }
      setToken(result.token);
      setPendingRoute('AdminDashboard');
      setUser(result.user);
    } catch (error: any) {
      Alert.alert('Sign in failed', error?.response?.data?.message ?? error?.message ?? 'Those staff credentials were not accepted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff & Admin Portal</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Security Illustration */}
        <View style={styles.illustrationBox}>
          <View style={styles.shieldWrap}>
            <Text style={styles.shieldEmoji}>🛡️</Text>
          </View>
          <Text style={styles.badgeText}>FACULTY VERIFICATION BOARD</Text>
          <Text style={styles.auditNotice}>
            Access is restricted to authorized university administrators. Session IP and device telemetry are monitored.
          </Text>
        </View>

        <Text style={styles.heading}>Staff Sign In</Text>
        <Text style={styles.subheading}>
          Review tutor applications, verify transcripts, and monitor campus safety.
        </Text>

        {/* Fast Fill Demo Button */}
        <TouchableOpacity
          style={styles.demoFillBtn}
          onPress={() => {
            setEmail('admin@unimentor.dev');
            setPassword('password123');
            setSecurityToken('');
          }}
        >
          <Text style={styles.demoFillIcon}>⚡</Text>
          <Text style={styles.demoFillText}>Auto-fill authorized Admin credentials</Text>
        </TouchableOpacity>

        {/* Fields */}
        <Text style={styles.label}>Official Staff Email</Text>
        <TextInput
          style={styles.input}
          placeholder="admin@unimentor.lk"
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Admin Password</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter secure password"
            placeholderTextColor={colors.textLight}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Two-Factor Security Key (2FA)</Text>
        <TextInput
          style={[styles.input, { letterSpacing: 2 }]}
          placeholder="6-digit Authenticator Code"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
          value={securityToken}
          onChangeText={setSecurityToken}
        />

        {/* Login Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleAdminLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Authorize & Enter Console  →</Text>
          )}
        </TouchableOpacity>

        {/* Back to Student Login */}
        <TouchableOpacity
          style={styles.backToUserBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.backToUserText}>Return to Student / Tutor Sign In  ‹</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  illustrationBox: {
    backgroundColor: '#061F5C',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  shieldWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shieldEmoji: {
    fontSize: 30,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD200',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  auditNotice: {
    fontSize: 11,
    color: '#D7E6FA',
    textAlign: 'center',
    lineHeight: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 16,
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  demoFillIcon: {
    fontSize: 14,
  },
  demoFillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
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
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    padding: 13,
    fontSize: 14,
    color: colors.text,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeIcon: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#062B67',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 16,
    shadowColor: colors.navy,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  backToUserBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backToUserText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
});

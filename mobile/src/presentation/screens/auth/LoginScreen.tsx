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
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../../domain/stores/authStore';
import { loginUseCase } from '../../../domain/usecases/auth/loginUseCase';
import Logo from '../../components/Logo';
import DemoSwitcherModal from '../../components/DemoSwitcherModal';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoModalVisible, setDemoModalVisible] = useState(false);

  const { setUser, setToken, switchDemoRole } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter your university email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUseCase({ email, password });
      setToken(result.token);
      setUser(result.user);
    } catch (err: any) {
      const msg = err?.friendlyMessage ?? err?.response?.data?.message ?? err?.message ?? 'Invalid university credentials.';
      Alert.alert(
        'Login Connection Notice',
        `${msg}\n\nYou can also launch Demo Mode to test without backend network setup.`,
        [
          { text: 'Try Again', style: 'cancel' },
          { text: 'Use Demo Mode', onPress: () => switchDemoRole('student') },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'student' | 'mentor' | 'admin') => {
    switchDemoRole(role);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Demo Mode Banner */}
        <View style={styles.demoBar}>
          <Text style={styles.demoTag}>DEMO QUICK LAUNCH</Text>
          <View style={styles.demoBtnRow}>
            <TouchableOpacity style={styles.demoPill} onPress={() => handleDemoLogin('student')}>
              <Text style={styles.demoPillText}>🎓 Student</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoPill} onPress={() => handleDemoLogin('mentor')}>
              <Text style={styles.demoPillText}>👨‍🏫 Tutor</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoPill} onPress={() => handleDemoLogin('admin')}>
              <Text style={styles.demoPillText}>🛡️ Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoNavigatorPill} onPress={() => setDemoModalVisible(true)}>
              <Text style={styles.demoNavigatorPillText}>☰ 24 Screens</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Logo size="large" showText={true} />
          <Text style={styles.tagline}>Connect. Learn. Grow.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subheading}>Sign in with your verified university credentials</Text>

          <Text style={styles.label}>University Email</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. name@campus.ac.lk"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor={colors.textLight}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🔒'}</Text>
            </TouchableOpacity>
          </View>

          {/* Remember me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberWrap}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>Sign In  →</Text>
            )}
          </TouchableOpacity>

          {/* SSO / Google Button */}
          <TouchableOpacity
            style={styles.ssoButton}
            onPress={() => {
              Alert.alert('Campus SSO', 'Connecting to University Single Sign-On portal...');
              setTimeout(() => switchDemoRole('student'), 800);
            }}
          >
            <Text style={styles.ssoIcon}>🏛️</Text>
            <Text style={styles.ssoText}>Continue with Campus Single Sign-On</Text>
          </TouchableOpacity>

          {/* Registration link */}
          <TouchableOpacity
            style={styles.registerWrap}
            onPress={() => navigation.navigate('RoleSelection' as any)}
          >
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>

          {/* Staff & Admin Portal Link */}
          <TouchableOpacity
            style={styles.adminLinkWrap}
            onPress={() => navigation.navigate('AdminLogin' as any)}
          >
            <Text style={styles.adminLinkText}>Access Staff / Admin Portal  →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Demo Switcher Modal */}
      <DemoSwitcherModal
        visible={demoModalVisible}
        onClose={() => setDemoModalVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  demoBar: {
    marginTop: Platform.OS === 'ios' ? 44 : 24,
    padding: 10,
    backgroundColor: '#F0F5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4E2FC',
    marginBottom: 8,
  },
  demoTag: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.8,
    marginBottom: 6,
    textAlign: 'center',
  },
  demoBtnRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  demoPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D9FA',
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.navy,
  },
  demoNavigatorPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  demoNavigatorPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  tagline: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  form: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 20,
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
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
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
    padding: 14,
    fontSize: 15,
    color: colors.text,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeIcon: {
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  rememberText: {
    fontSize: 13,
    color: colors.textLight,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.secondary,
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
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingVertical: 13,
    borderRadius: 10,
    marginBottom: 22,
  },
  ssoIcon: {
    fontSize: 16,
  },
  ssoText: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  registerWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  link: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 14,
  },
  linkBold: {
    color: colors.primary,
    fontWeight: '800',
  },
  adminLinkWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  adminLinkText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.75,
  },
});

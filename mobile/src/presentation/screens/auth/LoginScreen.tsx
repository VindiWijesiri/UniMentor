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
import { authRepository } from '../../../data/repositories/authRepository';
import Logo from '../../components/Logo';
import { colors } from '../../../shared/theme';
import {
  SvgMail,
  SvgLock,
  SvgEye,
  SvgEyeOff,
  SvgBuilding,
  SvgCheck,
  SvgArrowRight,
  SvgChevronRight,
} from '../../components/common/SvgIcons';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [codeStep, setCodeStep] = useState(false);
  const [loginCode, setLoginCode] = useState('');

  const { setUser, setToken, rememberToken } = useAuthStore();

  const finishSignIn = (token: string, user: NonNullable<Awaited<ReturnType<typeof loginUseCase>>['user']>) => {
    setToken(token);
    if (rememberMe) {
      rememberToken(token).catch(() => undefined);
    } else {
      import('expo-secure-store').then((store) => store.deleteItemAsync('auth.token')).catch(() => undefined);
    }
    setUser(user);
  };

  const showCode = (devCode?: string) => {
    setCodeStep(true);
    if (devCode) Alert.alert('Sign-in Code', `Your verification code is ${devCode}.`);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Validation', 'Please enter your university email.');
      return;
    }
    if (codeStep && loginCode.trim().length < 6) {
      Alert.alert('Validation', 'Enter the 6-digit sign-in code.');
      return;
    }
    if (!codeStep && !password) {
      Alert.alert('Validation', 'Please enter your university email and password.');
      return;
    }
    setLoading(true);
    try {
      if (codeStep) {
        const verified = await authRepository.verifyLoginCode(email.trim(), loginCode.trim());
        if (!verified.token || !verified.user) throw new Error('The sign-in code was not accepted.');
        finishSignIn(verified.token, verified.user);
        return;
      }
      const result = await loginUseCase({ email, password });
      if (result.requiresTwoFactor) {
        showCode(result.devCode);
        return;
      }
      if (!result.token || !result.user) throw new Error('Sign-in did not return a session.');
      finishSignIn(result.token, result.user);
    } catch (err: any) {
      const msg = err?.friendlyMessage ?? err?.response?.data?.message ?? err?.message ?? 'Invalid university credentials.';
      Alert.alert('Sign-In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCampusLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Campus Email', 'Enter the university email on your account, then continue.');
      return;
    }
    setLoading(true);
    try {
      const result = await authRepository.campusLogin(email.trim());
      if (!result.requiresTwoFactor) {
        Alert.alert('Check your email', result.message || 'If that campus email is registered, a sign-in code has been sent.');
        return;
      }
      showCode(result.devCode);
    } catch (err: any) {
      Alert.alert('Campus sign-in failed', err?.response?.data?.message ?? err?.message ?? 'The campus email sign-in could not start.');
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
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Logo size={140} showText={false} />
        </View>

        {/* Form Container */}
        <View style={styles.form}>
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subheading}>Sign in with your verified university credentials</Text>

          {/* Email Field with SVG Mail Icon */}
          <Text style={styles.label}>University Email</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconWrap}>
              <SvgMail size={19} color={colors.textLight} />
            </View>
            <TextInput
              style={styles.textInputWithIcon}
              placeholder="e.g. name@campus.ac.lk"
              placeholderTextColor={colors.textLight}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password Field with SVG Lock & Eye Icons */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputIconWrap}>
              <SvgLock size={19} color={colors.textLight} />
            </View>
            <TextInput
              style={styles.textInputWithIcon}
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
              activeOpacity={0.7}
            >
              {showPassword ? (
                <SvgEyeOff size={20} color={colors.textLight} />
              ) : (
                <SvgEye size={20} color={colors.textLight} />
              )}
            </TouchableOpacity>
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberWrap}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <SvgCheck size={13} color={colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* 6-Digit Code Step */}
          {codeStep ? (
            <>
              <Text style={styles.label}>Sign-in Code</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIconWrap}>
                  <SvgLock size={19} color={colors.primary} />
                </View>
                <TextInput
                  style={styles.textInputWithIcon}
                  placeholder="6-digit verification code"
                  placeholderTextColor={colors.textLight}
                  keyboardType="number-pad"
                  value={loginCode}
                  onChangeText={setLoginCode}
                />
              </View>
            </>
          ) : null}

          {/* Sign In Button with SVG Arrow */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>{codeStep ? 'Confirm Code' : 'Sign In'}</Text>
                <SvgArrowRight size={18} color={colors.white} strokeWidth={2.5} />
              </View>
            )}
          </TouchableOpacity>

          {/* SSO / Campus Email Button with SVG Building Icon */}
          <TouchableOpacity
            style={styles.ssoButton}
            onPress={handleCampusLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            <SvgBuilding size={19} color={colors.primary} />
            <Text style={styles.ssoText}>Email a code to this campus address</Text>
          </TouchableOpacity>

          {/* Registration Link */}
          <TouchableOpacity
            style={styles.registerWrap}
            onPress={() => navigation.navigate('RoleSelection' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>

          {/* Staff & Admin Portal Link with SVG Chevron */}
          <TouchableOpacity
            style={styles.adminLinkWrap}
            onPress={() => navigation.navigate('AdminLogin' as any)}
            activeOpacity={0.7}
          >
            <View style={styles.adminLinkContent}>
              <Text style={styles.adminLinkText}>Access Staff / Admin Portal</Text>
              <SvgChevronRight size={14} color={colors.navy} strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 48 : 28,
    paddingBottom: 36,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 14 : 8,
    paddingBottom: 20,
  },
  form: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIconWrap: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputWithIcon: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
  eyeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    paddingVertical: 13,
    borderRadius: 12,
    marginBottom: 22,
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
  adminLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.8,
  },
  adminLinkText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: '700',
  },
});

import React, { useState, useEffect } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { colors } from '../../../shared/theme';
import { useAuthStore, mockStudentUser } from '../../../domain/stores/authStore';
import { authRepository } from '../../../data/repositories/authRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  route?: RouteProp<any, any>;
};

export default function EmailVerificationScreen({ navigation, route }: Props) {
  const email = route?.params?.email || 'student@campus.ac.lk';
  const role = route?.params?.role || 'student';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(59);
  const [loading, setLoading] = useState(false);

  const { setUser, setToken } = useAuthStore();

  const requestOtpFromBackend = async () => {
    try {
      const result = await authRepository.sendVerificationOtp(email);
      if (result.devCode) {
        Alert.alert('Verification code', `Email is not configured on this server. Your code is ${result.devCode}.`);
      }
    } catch (err: any) {
      Alert.alert('Code not sent', err?.response?.data?.message || 'The verification code could not be requested.');
    }
  };

  useEffect(() => {
    requestOtpFromBackend();
  }, [email]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleDigitChange = (val: string, index: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = clean.slice(-1);
    setOtp(newOtp);
  };

  const handleVerify = async () => {
    const code = otp.join('').trim();
    if (code.length < 6) {
      Alert.alert('Incomplete Code', 'Please enter all 6 digits of the verification code sent to your email.');
      return;
    }

    setLoading(true);
    try {
      const verified = await authRepository.verifyEmailOtp(email, code);
      setLoading(false);
      const account = verified.user || route?.params?.user;
      const token = route?.params?.token;

      if (role === 'mentor') {
        navigation.navigate('VerifyIdentity', { email, role, token, user: account });
      } else if (account && token) {
        navigation.navigate('VerificationResult', {
          success: true,
          role: 'student',
          message: 'Your student account has been verified successfully. Welcome to UniMentor!',
          token,
          user: { ...account, isVerified: true, accountStatus: 'active' as const, verificationStatus: 'approved' as const },
        });
      } else {
        setUser({
          ...mockStudentUser,
          email,
          name: route?.params?.name || mockStudentUser.name,
          verificationStatus: 'approved',
          accountStatus: 'active',
        });
        setToken('demo_student_token');
        navigation.navigate('VerificationResult', {
          success: true,
          role: 'student',
          message: 'Your student account has been verified successfully. Welcome to UniMentor!',
        });
      }
    } catch (err: any) {
      setLoading(false);
      const msg = err.response?.data?.message || 'The verification code entered is incorrect or has expired. Please check your email inbox and try again.';
      Alert.alert('Verification Failed', msg);
    }
  };

  const handleResend = async () => {
    setTimer(59);
    setOtp(['', '', '', '', '', '']);
    await requestOtpFromBackend();
    Alert.alert(
      'Verification Code Dispatched',
      'A new 6-digit verification code has been sent to your email address. Please check your inbox.'
    );
  };

  const maskedEmail = email.replace(/^(.{2})(.*)(@.*)$/, (_: string, a: string, _b: string, c: string) => `${a}****${c}`);

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
          <Text style={styles.headerTitle}>Verify Email</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Envelope Graphic */}
        <View style={styles.illustrationBox}>
          <View style={styles.envelopeCard}>
            <Text style={styles.mailIcon}>✉️</Text>
            <View style={styles.shieldBadge}>
              <Text style={styles.shieldIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.illustrationCaption}>University Domain Security Check</Text>
        </View>

        <Text style={styles.heading}>Enter Verification Code</Text>
        <Text style={styles.helperText}>
          We sent a 6-digit verification code to your official address:{' '}
          <Text style={styles.emailHighlight}>{maskedEmail}</Text>
        </Text>

        {/* 6 Digit Input Cells */}
        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              style={[styles.otpCell, digit ? styles.otpCellFilled : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, idx)}
            />
          ))}
        </View>

        {/* Timer / Resend */}
        <View style={styles.timerRow}>
          {timer > 0 ? (
            <Text style={styles.timerText}>
              Resend code in <Text style={styles.timerBold}>{timer}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Didn't receive code? Resend Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleVerify}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Verify & Continue  →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.changeEmailBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.changeEmailText}>Wrong email? Change Address</Text>
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
  headerSpacer: {
    width: 38,
  },
  illustrationBox: {
    alignItems: 'center',
    marginVertical: 24,
  },
  envelopeCard: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: '#F0F5FF',
    borderWidth: 2,
    borderColor: '#D4E2FC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  mailIcon: {
    fontSize: 42,
  },
  shieldBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  shieldIcon: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  illustrationCaption: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
    marginTop: 10,
    letterSpacing: 0.4,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 8,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  emailHighlight: {
    color: colors.navy,
    fontWeight: '800',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpCell: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
  },
  otpCellFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  timerRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 13,
    color: colors.textLight,
  },
  timerBold: {
    fontWeight: '800',
    color: colors.navy,
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
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
  changeEmailBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  changeEmailText: {
    color: colors.textLight,
    fontSize: 13,
    fontWeight: '600',
  },
});

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
import { RouteProp } from '@react-navigation/native';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../../shared/theme';
import { authRepository } from '../../../data/repositories/authRepository';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerifyCode'>;
  route: RouteProp<AuthStackParamList, 'VerifyCode'>;
};

export default function VerifyCodeScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      Alert.alert('Validation', 'Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await authRepository.verifyResetCode(email, code.trim());
      Alert.alert('Success', 'Code verified successfully.');
      navigation.navigate('ResetPassword', { email });
    } catch (error: any) {
      Alert.alert('Verification failed', error?.response?.data?.message ?? error?.message ?? 'Code validation failed.');
    } finally {
      setLoading(false);
    }
  };

  const [resending, setResending] = useState(false);
  const handleResend = async () => {
    setResending(true);
    try {
      await authRepository.forgotPassword(email);
      Alert.alert('Code Dispatched', 'A new verification code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Failed', error?.response?.data?.message ?? error?.message ?? 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verify Code</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.illustrationBox}>
          <View style={styles.phoneCard}>
            <View style={styles.phoneTopDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>Code</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
          </View>
        </View>

        <Text style={styles.heading}>Verification Code</Text>
        <Text style={styles.helperText}>We sent a verification code to {email}.</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
          value={code}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Verify Code</Text>}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resending} activeOpacity={0.7}>
            <Text style={styles.footerLink}>{resending ? 'Sending...' : 'Resend'}</Text>
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
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 14,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 28,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 32,
  },
  illustrationBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 20,
    minHeight: 190,
  },
  phoneCard: {
    width: 220,
    height: 160,
    borderRadius: 24,
    backgroundColor: '#F7F9FC',
    borderWidth: 2,
    borderColor: '#E5EAF5',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneTopDots: {
    position: 'absolute',
    top: 18,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9AA7BF',
  },
  messageBubble: {
    width: 110,
    height: 54,
    backgroundColor: '#FFF6E6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F3D79A',
    marginTop: 24,
  },
  messageText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 18,
    right: 34,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  avatarText: {
    fontSize: 24,
  },
  heading: {
    fontSize: 24,
    color: colors.text,
    marginTop: 6,
    marginBottom: 8,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: 18,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    fontSize: 16,
    backgroundColor: colors.surface,
    color: colors.text,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 13,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
});

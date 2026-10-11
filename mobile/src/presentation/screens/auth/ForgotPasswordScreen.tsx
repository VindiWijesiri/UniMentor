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
import { colors } from '../../../shared/theme';
import { authRepository } from '../../../data/repositories/authRepository';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Validation', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await authRepository.forgotPassword(trimmedEmail);
      Alert.alert(
        'Verification code',
        result.devCode
          ? `Email is not configured on this server. Your code is ${result.devCode}.`
          : 'If that email is registered, a verification code has been sent.',
      );
      navigation.navigate('VerifyCode', { email: trimmedEmail });
    } catch (error: any) {
      Alert.alert(
        'Failed',
        error?.response?.data?.message ?? error?.friendlyMessage ?? error?.message ?? 'Unable to send reset code.'
      );
    } finally {
      setLoading(false);
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
          <Text style={styles.headerTitle}>Reset Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.illustrationBox}>
          <View style={styles.envelopeWrap}>
            <View style={styles.envelopeBody}>
              <View style={styles.envelopeLeftCorner} />
              <View style={styles.envelopeRightCorner} />
              <View style={styles.envelopeLine} />
            </View>
            <View style={styles.lockBadge}>
              <Text style={styles.lockText}>🔒</Text>
            </View>
          </View>
        </View>

        <Text style={styles.heading}>Reset Password</Text>
        <Text style={styles.helperText}>Enter your registered email to receive a verification code.</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="name@slitl.k"
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleSendCode} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Send Code →</Text>}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Trouble receiving code? <Text style={styles.footerLink}>Contact Support</Text>
        </Text>
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
    marginBottom: 12,
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
    marginTop: 20,
    marginBottom: 24,
    minHeight: 190,
  },
  envelopeWrap: {
    width: 220,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  envelopeBody: {
    width: 170,
    height: 110,
    backgroundColor: '#F6F7FB',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E0E6F0',
    position: 'relative',
    overflow: 'hidden',
  },
  envelopeLeftCorner: {
    position: 'absolute',
    left: -28,
    top: 14,
    width: 90,
    height: 90,
    backgroundColor: '#E7ECF7',
    transform: [{ rotate: '45deg' }],
  },
  envelopeRightCorner: {
    position: 'absolute',
    right: -28,
    top: 14,
    width: 90,
    height: 90,
    backgroundColor: '#DCE5F8',
    transform: [{ rotate: '45deg' }],
  },
  envelopeLine: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 54,
    height: 2,
    backgroundColor: '#C8D2E9',
    transform: [{ rotate: '-3deg' }],
  },
  lockBadge: {
    position: 'absolute',
    bottom: 10,
    right: 42,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  lockText: {
    fontSize: 22,
    color: colors.white,
  },
  heading: {
    fontSize: 24,
    color: colors.text,
    marginTop: 8,
    marginBottom: 10,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 15,
    color: colors.textLight,
    marginBottom: 18,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 18,
    textAlign: 'center',
    color: colors.textLight,
    fontSize: 13,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});

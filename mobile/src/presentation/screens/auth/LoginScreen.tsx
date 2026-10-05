import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../../domain/stores/authStore';
import { loginUseCase } from '../../../domain/usecases/auth/loginUseCase';
import Logo from '../../components/Logo';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const enterDemo = (role: 'mentor' | 'student') => {
    setUser({
      _id: role === 'mentor' ? 'mentor-demo-1' : 'student-demo-1',
      name: role === 'mentor' ? 'Tharushi Perera' : 'Student Demo',
      email: role === 'mentor' ? 'kavindu.perera@unimentor.lk' : 'student@unimentor.dev',
      role,
      subjects: ['Data Structures & Algorithms', 'Software Engineering'],
      rating: 4.9,
      reviewCount: 120,
      hourlyRate: 2500,
    } as any);
    setToken('demo-token-preview');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation', 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await loginUseCase({ email, password });
      setToken(result.token);
      setUser(result.user);
    } catch (err: any) {
      const isDbPending =
        err.message?.includes('503') ||
        err.message?.includes('Database connection pending') ||
        err.message?.includes('Network Error');
      if (isDbPending) {
        const isMentor = email.toLowerCase().includes('mentor') || email.toLowerCase().includes('kavindu');
        Alert.alert(
          'Database Pending',
          'MongoDB Atlas is pending IP whitelist. Would you like to enter in Demo Mode to preview the Dashboard immediately?',
          [
            { text: 'Wait for Atlas', style: 'cancel' },
            {
              text: 'Enter Demo Mode',
              onPress: () => enterDemo(isMentor ? 'mentor' : 'student'),
            },
          ]
        );
      } else {
        Alert.alert('Login Failed', err.message ?? 'Something went wrong.');
      }
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
        {/* Logo */}
        <View style={styles.logoSection}>
          <Logo size="large" showText={true} />
          <Text style={styles.tagline}>Connect. Learn. Grow.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.heading}>Welcome Back</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.textLight}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={styles.buttonText}>Login</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>

          {/* Quick Demo Switcher */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Demo Fast Login:</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => {
                  setEmail('student@unimentor.dev');
                  setPassword('password123');
                }}
              >
                <Text style={styles.demoBtnText}>🎓 Student Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.demoBtn, styles.demoBtnMentor]}
                onPress={() => {
                  setEmail('kavindu.perera@unimentor.lk');
                  setPassword('password123');
                }}
              >
                <Text style={[styles.demoBtnText, styles.demoBtnTextMentor]}>⭐ Mentor Account</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.directPreviewBtn}
              onPress={() => enterDemo('mentor')}
            >
              <Text style={styles.directPreviewText}>⚡ Direct Launch: Tutor Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  directPreviewBtn: {
    marginTop: 10,
    backgroundColor: '#0A2342',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  directPreviewText: {
    color: '#F59E0B',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 72,
    paddingBottom: 40,
  },
  tagline: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  form: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
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
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: colors.textLight, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
  demoSection: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  demoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#1E40AF',
    fontSize: 11,
    fontWeight: '800',
  },
  demoBtnMentor: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  demoBtnTextMentor: {
    color: '#92400E',
  },
});

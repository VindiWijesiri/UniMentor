import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { loginUseCase } from '../../../domain/usecases/auth/loginUseCase';
import { beginSession } from '../../../domain/stores/sessionGate';
import Logo from '../../components/Logo';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const DEMOS = [
  { key: 'student', label: 'Student', email: 'student@unimentor.dev', password: 'password123' },
  { key: 'tutor', label: 'Tutor', email: 'tharushi.perera@unimentor.test', password: 'Password123' },
  { key: 'admin', label: 'Admin', email: 'admin@unimentor.dev', password: 'password123' },
  { key: 'lic', label: 'LIC', email: 'lic@unimentor.dev', password: 'password123' },
] as const;

export default function LoginScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'demo' | 'regular'>('demo');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const signIn = async (nextEmail: string, nextPassword: string, key: string) => {
    if (!nextEmail || !nextPassword) {
      Alert.alert('Validation', 'Please enter email and password.');
      return;
    }
    setLoading(key);
    try {
      const result = await loginUseCase({ email: nextEmail, password: nextPassword });
      await beginSession(result.user, result.token);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Something went wrong.');
    } finally {
      setLoading(null);
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
          <Logo size="large" />
          <Text style={styles.tagline}>Connect. Learn. Grow.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.heading}>Welcome</Text>
          <Text style={styles.lead}>Demo fast login opens a ready account. Regular login uses your own email.</Text>
          <View style={styles.modes}>
            <TouchableOpacity style={[styles.mode, mode === 'demo' && styles.modeOn]} onPress={() => setMode('demo')}>
              <Text style={[styles.modeText, mode === 'demo' && styles.modeTextOn]}>Demo fast login</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mode, mode === 'regular' && styles.modeOn]} onPress={() => setMode('regular')}>
              <Text style={[styles.modeText, mode === 'regular' && styles.modeTextOn]}>Regular login</Text>
            </TouchableOpacity>
          </View>

          {mode === 'regular' ? (
            <>
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

              <TouchableOpacity style={styles.button} onPress={() => signIn(email.trim(), password, 'regular')} disabled={loading !== null}>
                {loading === 'regular'
                  ? <ActivityIndicator color="#102B5D" />
                  : <Text style={styles.buttonText}>Login</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>
                  Don't have an account? <Text style={styles.linkBold}>Register</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Tap a role to enter</Text>
              <View style={styles.demoButtonsRow}>
                {DEMOS.map((demo) => (
                  <TouchableOpacity
                    key={demo.key}
                    style={[styles.demoBtn, loading === demo.key && styles.demoBtnBusy]}
                    onPress={() => signIn(demo.email, demo.password, demo.key)}
                    disabled={loading !== null}
                  >
                    {loading === demo.key
                      ? <ActivityIndicator color="#102B5D" />
                      : <Text style={styles.demoBtnText}>{demo.label}</Text>}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>
                  Don't have an account? <Text style={styles.linkBold}>Register</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    fontWeight: '800',
    color: '#102B5D',
    marginBottom: 8,
  },
  lead: { color: colors.textLight, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  modes: { flexDirection: 'row', backgroundColor: '#E8EEF6', borderRadius: 14, padding: 4, marginBottom: 18 },
  mode: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  modeOn: { backgroundColor: '#FFF' },
  modeText: { color: '#64748B', fontWeight: '700', fontSize: 13 },
  modeTextOn: { color: '#102B5D', fontWeight: '800' },
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
    backgroundColor: '#FF8D28',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: { color: '#102B5D', fontSize: 16, fontWeight: '800' },
  link: { textAlign: 'center', color: colors.textLight, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
  demoSection: {
    marginTop: 4,
  },
  demoLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  demoBtn: {
    width: '48%',
    backgroundColor: '#102B5D',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  demoBtnBusy: { opacity: 0.7 },
  demoBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

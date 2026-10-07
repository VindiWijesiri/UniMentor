import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { registerUseCase } from '../../../domain/usecases/auth/registerUseCase';
import { useAuthStore } from '../../../domain/stores/authStore';
import Logo from '../../components/Logo';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [loading, setLoading] = useState(false);
  const { setToken } = useAuthStore();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Validation', 'All fields are required.');
      return;
    }
    setLoading(true);
    try {
      const result = await registerUseCase({ name, email, password, role });
      setToken(result.token);
      navigation.navigate('EmailVerification', {
        email: result.user.email,
        role,
        name: result.user.name,
        token: result.token,
        user: result.user,
      });
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Something went wrong.');
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
          <Logo size="medium" />
        </View>

        <Text style={styles.heading}>Create Account</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your full name"
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />

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
          placeholder="Create a password"
          placeholderTextColor={colors.textLight}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleRow}>
          {([
            ['student', 'Student'],
            ['mentor', 'Tutor'],
          ] as const).map(([r, label]) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have an account? <Text style={styles.linkBold}>Login</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.campusSection}>
          <Text style={styles.campusHint}>Representing a university?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('RegisterCampusIntro')}>
            <Text style={styles.campusLink}>Register my campus</Text>
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
  logoSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
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
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  roleBtn: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.surface,
  },
  roleBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleBtnText: { color: colors.text, fontWeight: '600', fontSize: 14 },
  roleBtnTextActive: { color: colors.white },
  button: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: colors.textLight, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
  campusSection: {
    marginTop: 28,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  campusHint: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  campusLink: { color: colors.primary, fontWeight: '800', fontSize: 15 },
});

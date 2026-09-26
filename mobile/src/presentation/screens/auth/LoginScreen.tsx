import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { useAuthStore } from '../../../domain/stores/authStore';
import { loginUseCase } from '../../../domain/usecases/auth/loginUseCase';
import { apiError } from '../../../shared/format';
import { colors, radius } from '../../../shared/theme';
import { PrimaryButton } from '../../components/Ui';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setSession = useAuthStore((s) => s.setSession);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginUseCase({ email, password });
      await setSession(result.user, result.token);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.hero}>
        <Text style={styles.word}>
          <Text style={styles.uni}>Uni</Text>
          <Text style={styles.mentor}>Mentor</Text>
        </Text>
        <Text style={styles.tag}>Learn with verified campus mentors</Text>
      </View>
      <View style={styles.sheet}>
        <Text style={styles.heading}>Welcome back</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.inactive}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.inactive}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Login" onPress={handleLogin} loading={loading} />
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>New here? Create an account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.navy },
  hero: { paddingTop: 88, paddingBottom: 28, alignItems: 'center' },
  word: { fontSize: 34, fontWeight: '800' },
  uni: { color: colors.white },
  mentor: { color: colors.orange },
  tag: { color: 'rgba(255,255,255,0.75)', marginTop: 8 },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  heading: { fontSize: 22, fontWeight: '800', color: colors.navy, marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, marginBottom: 12 },
  link: { textAlign: 'center', color: colors.navy, marginTop: 18, fontWeight: '600' },
});

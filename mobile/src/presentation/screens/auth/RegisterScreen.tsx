import React, { useState } from 'react';
import {
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { registerUseCase } from '../../../domain/usecases/auth/registerUseCase';
import { useAuthStore } from '../../../domain/stores/authStore';
import { UserRole, ROLE_LABEL } from '../../../domain/entities/User';
import { apiError } from '../../../shared/format';
import { colors, radius } from '../../../shared/theme';
import { PrimaryButton } from '../../components/Ui';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const ROLES: UserRole[] = ['student', 'mentor', 'lic', 'admin'];

export default function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setSession = useAuthStore((s) => s.setSession);

  const handleRegister = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await registerUseCase({ name, email, password, role });
      await setSession(result.user, result.token);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.word}>
        <Text style={styles.uni}>Uni</Text>
        <Text style={styles.mentor}>Mentor</Text>
      </Text>
      <Text style={styles.title}>Create account</Text>
      <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
      <Text style={styles.label}>I am a</Text>
      <View style={styles.roleGrid}>
        {ROLES.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.roleBtn, role === item && styles.roleBtnActive]}
            onPress={() => setRole(item)}
          >
            <Text style={[styles.roleText, role === item && styles.roleTextActive]}>{ROLE_LABEL[item]}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Register" onPress={handleRegister} loading={loading} />
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: colors.background, justifyContent: 'center' },
  word: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  uni: { color: colors.navy },
  mentor: { color: colors.orange },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', color: colors.navy, marginVertical: 20 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  label: { fontSize: 13, fontWeight: '700', color: colors.navy, marginBottom: 8 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  roleBtn: {
    width: '48%',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  roleBtnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  roleText: { color: colors.text, fontWeight: '700' },
  roleTextActive: { color: colors.white },
  error: { color: colors.danger, marginBottom: 12 },
  link: { textAlign: 'center', color: colors.navy, marginTop: 18, fontWeight: '600' },
});

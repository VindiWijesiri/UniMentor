import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { registerCampusUseCase } from '../../../domain/usecases/campus/registerCampusUseCase';
import { useAuthStore } from '../../../domain/stores/authStore';
import Logo from '../../components/Logo';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'RegisterCampus'>;
};

export default function RegisterCampusScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [faculties, setFaculties] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser, setToken } = useAuthStore();

  const submit = async () => {
    setLoading(true);
    try {
      const result = await registerCampusUseCase({
        name,
        shortCode,
        city,
        country,
        address,
        website,
        faculties,
        adminName,
        adminEmail,
        adminPassword,
        adminPhone,
      });
      setToken(result.token);
      setUser(result.user);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not register this campus.';
      Alert.alert('Campus registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <Logo size="medium" />
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Register a campus</Text>
        <Text style={styles.sub}>Save your university to UniMentor and create the campus admin login.</Text>

        <Text style={styles.section}>Campus details</Text>
        <Text style={styles.label}>Campus name</Text>
        <TextInput style={styles.input} placeholder="e.g. SLIIT Malabe" placeholderTextColor={colors.textLight} value={name} onChangeText={setName} />
        <Text style={styles.label}>Campus code</Text>
        <TextInput style={styles.input} placeholder="e.g. SLIIT" placeholderTextColor={colors.textLight} autoCapitalize="characters" value={shortCode} onChangeText={setShortCode} />
        <Text style={styles.label}>City</Text>
        <TextInput style={styles.input} placeholder="e.g. Malabe" placeholderTextColor={colors.textLight} value={city} onChangeText={setCity} />
        <Text style={styles.label}>Country</Text>
        <TextInput style={styles.input} placeholder="Sri Lanka" placeholderTextColor={colors.textLight} value={country} onChangeText={setCountry} />
        <Text style={styles.label}>Address</Text>
        <TextInput style={styles.input} placeholder="Street, city" placeholderTextColor={colors.textLight} value={address} onChangeText={setAddress} />
        <Text style={styles.label}>Website</Text>
        <TextInput style={styles.input} placeholder="https://" placeholderTextColor={colors.textLight} autoCapitalize="none" keyboardType="url" value={website} onChangeText={setWebsite} />
        <Text style={styles.label}>Faculties</Text>
        <TextInput
          style={styles.input}
          placeholder="Computing, Engineering, Business"
          placeholderTextColor={colors.textLight}
          value={faculties}
          onChangeText={setFaculties}
        />

        <Text style={styles.section}>Campus admin</Text>
        <Text style={styles.label}>Admin full name</Text>
        <TextInput style={styles.input} placeholder="LIC / campus admin" placeholderTextColor={colors.textLight} value={adminName} onChangeText={setAdminName} />
        <Text style={styles.label}>Admin email</Text>
        <TextInput style={styles.input} placeholder="admin@campus.edu" placeholderTextColor={colors.textLight} autoCapitalize="none" keyboardType="email-address" value={adminEmail} onChangeText={setAdminEmail} />
        <Text style={styles.label}>Admin password</Text>
        <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor={colors.textLight} secureTextEntry value={adminPassword} onChangeText={setAdminPassword} />
        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} placeholder="Optional" placeholderTextColor={colors.textLight} keyboardType="phone-pad" value={adminPhone} onChangeText={setAdminPhone} />

        <TouchableOpacity style={styles.button} onPress={() => void submit()} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>Register campus</Text>}
        </TouchableOpacity>
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
  logoSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 16 },
  back: { color: colors.primary, fontWeight: '700', marginBottom: 8 },
  heading: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 8 },
  sub: { fontSize: 14, color: colors.textLight, marginBottom: 20, lineHeight: 20 },
  section: { fontSize: 15, fontWeight: '800', color: colors.primary, marginBottom: 12, marginTop: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
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
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});

import React, { useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
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
import { colors } from '../../../shared/theme';
import { authRepository } from '../../../data/repositories/authRepository';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const faculties = ['Computing', 'Engineering', 'Business', 'Architecture', 'Humanities & Sciences'];

export default function StudentRegistrationScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('University of Colombo');
  const [faculty, setFaculty] = useState('Computing');
  const [degree, setDegree] = useState('BSc (Hons) in Computer Science');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !studentId || !password) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    if (!agreed) {
      Alert.alert('Agreement', 'Please agree to the UniMentor Terms and Campus Code of Conduct.');
      return;
    }

    setLoading(true);
    try {
      const result = await authRepository.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'student',
        degreeProgramme: degree,
        university,
        faculty,
        studentId: studentId.trim(),
      });
      navigation.navigate('EmailVerification', {
        email: email.trim(),
        role: 'student',
        name: name.trim(),
        faculty,
        degree,
        token: result.token,
        user: result.user,
      });
    } catch (err: any) {
      Alert.alert('Registration failed', err?.response?.data?.message ?? err?.message ?? 'Could not create this account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[device.frame, { flex: 1, backgroundColor: colors.background, paddingTop: device.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Student Registration</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '50%' }]} />
          </View>
          <Text style={styles.stepText}>Step 2 of 3: Academic Profile</Text>
        </View>

        <Text style={styles.heading}>Create Student Account</Text>
        <Text style={styles.subheading}>
          Join thousands of university peers studying together.
        </Text>

        {/* Fields */}
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Kavindu Perera"
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>University Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. yourname@campus.ac.lk"
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>University / Institute *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. University of Colombo"
          placeholderTextColor={colors.textLight}
          value={university}
          onChangeText={setUniversity}
        />

        <Text style={styles.label}>Student Registration ID *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. CS/2023/089 or IT21004812"
          placeholderTextColor={colors.textLight}
          value={studentId}
          onChangeText={setStudentId}
        />

        <Text style={styles.label}>Faculty *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.facultyChips}>
          {faculties.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, faculty === f && styles.chipActive]}
              onPress={() => setFaculty(f)}
            >
              <Text style={[styles.chipText, faculty === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Degree / Programme *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. BSc (Hons) in Computer Science"
          placeholderTextColor={colors.textLight}
          value={degree}
          onChangeText={setDegree}
        />

        <Text style={styles.label}>Create Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimum 8 characters"
          placeholderTextColor={colors.textLight}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Agreement Checkbox */}
        <TouchableOpacity
          style={styles.agreeWrap}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.agreeText}>
            I confirm I am an enrolled student and agree to the{' '}
            <Text style={styles.agreeLink}>Terms of Service</Text> &{' '}
            <Text style={styles.agreeLink}>Honor Code</Text>.
          </Text>
        </TouchableOpacity>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.button, (!agreed || !name || !email) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Register & Verify Email  →</Text>
          )}
        </TouchableOpacity>

        {/* Sign In link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
  progressContainer: {
    marginBottom: 20,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 13,
    marginBottom: 14,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  facultyChips: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  agreeWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
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
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  agreeText: {
    flex: 1,
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 18,
  },
  agreeLink: {
    color: colors.primary,
    fontWeight: '700',
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
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginText: {
    fontSize: 14,
    color: colors.textLight,
  },
  loginTextBold: {
    color: colors.primary,
    fontWeight: '800',
  },
});

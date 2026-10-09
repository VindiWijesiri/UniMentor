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
import { colors } from '../../../shared/theme';
import { authRepository } from '../../../data/repositories/authRepository';
import { useAuthStore } from '../../../domain/stores/authStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

const moduleOptions = [
  'Data Structures',
  'OOP',
  'Algorithms',
  'DBMS',
  'Machine Learning',
  'Software Architecture',
  'Computer Networks',
  'Web Development',
];

export default function TutorRegistrationScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [degree, setDegree] = useState('BSc (Hons) in Software Engineering');
  const [hourlyRate, setHourlyRate] = useState('2500');
  const [selectedModules, setSelectedModules] = useState<string[]>(['Data Structures', 'OOP']);
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleModule = (mod: string) => {
    if (selectedModules.includes(mod)) {
      setSelectedModules(selectedModules.filter((m) => m !== mod));
    } else {
      setSelectedModules([...selectedModules, mod]);
    }
  };

  const { setToken } = useAuthStore();

  const handleProceed = async () => {
    if (!name || !email || !phone || !degree || !password) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }

    if (selectedModules.length === 0) {
      Alert.alert('Module Selection', 'Please select at least one module you want to teach.');
      return;
    }

    setLoading(true);
    try {
      const result = await authRepository.register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: 'mentor',
        phone: phone.trim(),
        degreeProgramme: degree,
        hourlyRate: Number(hourlyRate) || 2500,
        subjects: selectedModules,
        bio: bio.trim(),
      });
      setToken(result.token);
      navigation.navigate('EmailVerification', {
        email: result.user.email,
        role: 'mentor',
        name: result.user.name,
        degree,
        hourlyRate: Number(hourlyRate) || 2500,
        selectedModules,
        token: result.token,
        user: result.user,
      });
    } catch (error: any) {
      Alert.alert('Registration failed', error?.response?.data?.message ?? error?.message ?? 'The account could not be created.');
    } finally {
      setLoading(false);
    }
  };

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
          <Text style={styles.headerTitle}>Tutor Application</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '40%' }]} />
          </View>
          <Text style={styles.stepText}>Step 2 of 4: Qualifications & Modules</Text>
        </View>

        <Text style={styles.heading}>Peer Tutor Registration</Text>
        <Text style={styles.subheading}>
          Share your academic expertise with fellow students. Module approvals are verified individually.
        </Text>

        {/* Fields */}
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dr. / Mr. Sarah De Silva"
          placeholderTextColor={colors.textLight}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>University Official Email *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. sarah.desilva@campus.ac.lk"
          placeholderTextColor={colors.textLight}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Contact Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+94 77 123 4567"
          placeholderTextColor={colors.textLight}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Degree & Academic Background *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. MSc in Software Engineering & AI (First Class)"
          placeholderTextColor={colors.textLight}
          value={degree}
          onChangeText={setDegree}
        />

        <Text style={styles.label}>Proposed Hourly Fee (LKR / hr) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 2500"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
          value={hourlyRate}
          onChangeText={setHourlyRate}
        />

        {/* Module Selection */}
        <View style={styles.modulesHeaderRow}>
          <Text style={styles.label}>Modules You Wish to Teach *</Text>
          <Text style={styles.modulesCount}>
            {selectedModules.length} selected
          </Text>
        </View>
        <Text style={styles.modulesNotice}>
          Select modules where you achieved an A/A+ grade. Each will be reviewed by faculty admin.
        </Text>

        <View style={styles.modulesGrid}>
          {moduleOptions.map((mod) => {
            const isSelected = selectedModules.includes(mod);
            return (
              <TouchableOpacity
                key={mod}
                style={[styles.modChip, isSelected && styles.modChipActive]}
                onPress={() => toggleModule(mod)}
              >
                <Text style={[styles.modChipText, isSelected && styles.modChipTextActive]}>
                  {isSelected ? '✓ ' : '+ '}
                  {mod}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Teaching Bio & Focus</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          placeholder="Tell students about your teaching method, strengths, and experience..."
          placeholderTextColor={colors.textLight}
          multiline
          numberOfLines={3}
          value={bio}
          onChangeText={setBio}
        />

        <Text style={styles.label}>Account Password *</Text>
        <TextInput
          style={styles.input}
          placeholder="Minimum 8 characters"
          placeholderTextColor={colors.textLight}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Verification Guarantee Notice */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Next step: You will upload your Student ID and Academic Transcript to verify your eligibility for each module.
          </Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleProceed}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Proceed to Identity Verification  →</Text>
          )}
        </TouchableOpacity>

        {/* Sign In link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Already registered? <Text style={styles.loginTextBold}>Sign In</Text>
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
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
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
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navy,
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
    lineHeight: 18,
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
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modulesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modulesCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  modulesNotice: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 10,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  modChipActive: {
    backgroundColor: '#EBF4FF',
    borderColor: colors.primary,
  },
  modChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  modChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
    marginTop: 6,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    color: colors.navy,
    flex: 1,
    lineHeight: 17,
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
    color: colors.primary,
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

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Logo from '../../components/Logo';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'RegisterCampusIntro'>;
};

export default function RegisterCampusIntroScreen({ navigation }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.logoSection}>
        <Logo size="medium" />
      </View>

      <Text style={styles.heading}>Register my campus</Text>
      <Text style={styles.copy}>
        Add your university to UniMentor so students and tutors can join under your campus, faculties, and admin account.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>What you will set up</Text>
        <Text style={styles.cardItem}>1. Campus name, code, city, and faculties</Text>
        <Text style={styles.cardItem}>2. A campus admin account for LIC access</Text>
        <Text style={styles.cardItem}>3. Immediate listing in the UniMentor campus directory</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('RegisterCampus')}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>
          Back to <Text style={styles.linkBold}>Create Account</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 24 },
  heading: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  copy: { fontSize: 15, lineHeight: 22, color: colors.textLight, marginBottom: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 10 },
  cardItem: { fontSize: 13, color: colors.textLight, marginBottom: 6, fontWeight: '600' },
  button: {
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: colors.textLight, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
});

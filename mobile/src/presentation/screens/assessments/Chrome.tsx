import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StackFooterBar from '../../navigation/StackFooterBar';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { card, ink, line, muted, navy, orange, page } from './theme';

export function AssessmentScreen<T extends keyof AppStackParamList>({
  navigation,
  children,
}: {
  navigation: NativeStackNavigationProp<AppStackParamList, T>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.flex}>{children}</View>
      <StackFooterBar navigation={navigation} active="Learning" />
    </View>
  );
}

export function KuppiyaBar({ title }: { title: string }) {
  return <PageHeader title={title} />;
}

export function HeroHeader({
  title,
  onBack,
  children,
}: {
  eyebrow?: string;
  title: string;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View>
      <PageHeader title={title} onBack={onBack} />
      {children ? <View style={styles.heroExtra}>{children}</View> : null}
    </View>
  );
}

export function SearchField({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.search}>
      <MaterialIcons name="search" size={18} color={muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={muted}
        style={styles.searchInput}
      />
    </View>
  );
}

export function OrangeButton({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <TouchableOpacity style={styles.orangeBtn} onPress={onPress}>
      {icon ? <MaterialIcons name={icon} size={18} color={navy} /> : null}
      <Text style={styles.orangeText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function TakeHeader({
  course,
  secondsLeft,
  onBack,
}: {
  course: string;
  secondsLeft: number;
  onBack: () => void;
}) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return (
    <View>
      <PageHeader title={course} onBack={onBack} />
      <View style={styles.timerRow}>
        <MaterialIcons name="timer" size={16} color={navy} />
        <Text style={styles.timerText}>{minutes}:{String(seconds).padStart(2, '0')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: page },
  flex: { flex: 1 },
  bar: {
    backgroundColor: navy,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  barRow: { flexDirection: 'row', alignItems: 'center' },
  logoTile: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: '#0C2048',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2A4A86',
  },
  brand: { flex: 1, marginLeft: 10 },
  brandName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  brandSub: { color: '#C9D4EA', fontSize: 11, marginTop: 1 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: '#31528E',
    alignItems: 'center', justifyContent: 'center',
  },
  hero: {
    backgroundColor: navy,
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1C3E78',
    alignItems: 'center', justifyContent: 'center',
  },
  backSpacer: { width: 36, height: 36 },
  eyebrow: { color: orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
  heroExtra: { backgroundColor: page, paddingHorizontal: 16, paddingTop: 12 },
  search: {
    marginTop: 14, backgroundColor: card, borderRadius: 14, borderWidth: 1, borderColor: line,
    minHeight: 46, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  searchInput: { flex: 1, color: ink, fontSize: 14 },
  orangeBtn: {
    backgroundColor: orange, borderRadius: 14, minHeight: 48,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  orangeText: { color: navy, fontWeight: '800', fontSize: 15 },
  takeBar: {
    backgroundColor: card, paddingHorizontal: 8, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: line,
  },
  takeBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  takeBrand: { color: navy, fontWeight: '800', fontSize: 14 },
  takeOrange: { color: orange },
  takeCourse: { color: muted, fontSize: 12, marginTop: 1 },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    backgroundColor: page,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  timerText: { color: navy, fontWeight: '800', fontSize: 12 },
  takeAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: navy,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
});

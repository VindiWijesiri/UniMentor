import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StackFooterBar from '../../navigation/StackFooterBar';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import {
  SvgChevronLeft,
  SvgClock,
  SvgGraduationCap,
  SvgSearch,
  SvgUser,
} from '../../components/common/SvgIcons';
import { blue, card, ink, line, muted, navy, orange, page, soft } from './theme';

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

export function KuppiyaBar({ onSearch, title }: { onSearch?: () => void; title?: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.logoTile}>
        <SvgGraduationCap size={20} color={orange} />
      </View>
      <View style={styles.brand}>
        <Text style={styles.brandName}>{title || 'Assessment Center'}</Text>
        <Text style={styles.brandSub}>Learning Hub</Text>
      </View>
      {onSearch ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onSearch}>
          <SvgSearch size={18} color="#fff" />
        </TouchableOpacity>
      ) : null}
      <View style={styles.brandRow}>
        <Text style={styles.brandUni}>Uni</Text>
        <Text style={styles.brandMentor}>Mentor</Text>
      </View>
    </View>
  );
}

export function HeroHeader({
  eyebrow,
  title,
  onBack,
  children,
}: {
  eyebrow?: string;
  title: string;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
      <View style={styles.barRow}>
        <View style={styles.logoTile}>
          <SvgGraduationCap size={20} color={orange} />
        </View>
        <View style={styles.brand}>
          <Text style={styles.brandName}>Assessment Hub</Text>
          <Text style={styles.brandSub}>UniMentor Learning</Text>
        </View>
        <View style={styles.brandRow}>
          <Text style={styles.brandUni}>Uni</Text>
          <Text style={styles.brandMentor}>Mentor</Text>
        </View>
      </View>
      <View style={styles.heroTitleRow}>
        {onBack ? (
          <TouchableOpacity style={styles.back} onPress={onBack}>
            <SvgChevronLeft size={18} color="#fff" />
          </TouchableOpacity>
        ) : null}
        <View style={styles.flex}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.heroTitle}>{title}</Text>
        </View>
      </View>
      {children}
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
      <SvgSearch size={16} color={muted} />
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
  svgIcon,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
  svgIcon?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.orangeBtn} onPress={onPress}>
      {svgIcon ? svgIcon : icon ? <MaterialIcons name={icon} size={18} color={navy} /> : null}
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
  const insets = useSafeAreaInsets();
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return (
    <View style={[styles.takeBar, { paddingTop: insets.top + 6 }]}>
      <TouchableOpacity onPress={onBack} style={styles.takeBack}>
        <SvgChevronLeft size={24} color={navy} />
      </TouchableOpacity>
      <View style={styles.flex}>
        <Text style={styles.takeBrand}>Uni<Text style={styles.takeOrange}>Mentor</Text> · Kuppiya</Text>
        <Text style={styles.takeCourse}>{course}</Text>
      </View>
      <View style={styles.timer}>
        <SvgClock size={14} color={navy} />
        <Text style={styles.timerText}>{minutes}:{String(seconds).padStart(2, '0')}</Text>
      </View>
      <View style={styles.takeAvatar}><SvgUser size={16} color="#fff" /></View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  brandMentor: {
    color: orange,
    fontSize: 18,
    fontWeight: '800',
  },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },

  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: blue,
    alignItems: 'center', justifyContent: 'center',
  },
  hero: {
    backgroundColor: navy,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  back: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1C3E78',
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { color: orange, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 2 },
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
  timer: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: soft, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8,
  },
  timerText: { color: navy, fontWeight: '800', fontSize: 12 },
  takeAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: navy,
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
});

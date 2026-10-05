import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { TutorFilters } from '../../../domain/entities/TutorFilters';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Filters'>;
type FilterKey = Exclude<keyof TutorFilters, 'priceRange' | 'minRating'>;

const sections: Array<{
  key: FilterKey;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  options: string[];
}> = [
  { key: 'experience', title: 'Experience', subtitle: 'Teaching experience', icon: 'briefcase-outline', options: ['1-2 years', '3-5 years', '5+ years'] },
  { key: 'language', title: 'Language', subtitle: 'Preferred teaching language', icon: 'language-outline', options: ['English', 'Sinhala', 'Tamil'] },
  { key: 'lessonType', title: 'Lesson Type', subtitle: 'Choose a class type', icon: 'people-outline', options: ['Individual', 'Group'] },
];

function OptionGroup({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.optionGroup}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.option, active && styles.optionActive]}
            onPress={() => onSelect(option)}
            activeOpacity={0.8}
          >
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function FiltersScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<TutorFilters>(route.params?.filters ?? {});

  const updateFilter = <K extends keyof TutorFilters>(key: K, value: TutorFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: current[key] === value ? undefined : value }));
  };

  const applyFilters = () => {
    navigation.navigate('MainTabs', {
      screen: 'Search',
      params: { ...(route.params?.searchParams ?? {}), filters },
    });
  };

  return (
    <View style={styles.page}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
          </View>
          <View style={styles.brandRow}>
            <TouchableOpacity style={styles.clearHeaderBtn} onPress={() => setFilters({})} activeOpacity={0.8}>
              <Text style={styles.clearHeaderText}>Clear</Text>
            </TouchableOpacity>
            <View style={styles.brandTextWrap}>
              <Text style={styles.brandUni}>Uni</Text>
              <Text style={styles.brandMentor}>Mentor</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.belowHeaderSubtitle}>Refine your tutor search criteria</Text>

        <View style={styles.card}>
          <View style={styles.sectionTop}>
            <View style={styles.sectionIcon}>
              <Ionicons name="cash-outline" size={18} color="#D97706" />
            </View>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Price Range (LKR)</Text>
              <Text style={styles.sectionSubtitle}>Hourly rate</Text>
            </View>
          </View>
          <OptionGroup
            options={['LKR 500 – 3,000', 'LKR 3,000 – 5,000']}
            selected={filters.priceRange === '500-3000' ? 'LKR 500 – 3,000' : filters.priceRange === '3000-5000' ? 'LKR 3,000 – 5,000' : undefined}
            onSelect={(value) => updateFilter('priceRange', value.startsWith('LKR 500') ? '500-3000' : '3000-5000')}
          />
          <View style={styles.rangeTrack}><View style={styles.rangeFill} /><View style={styles.rangeThumb} /></View>
          <View style={styles.rangeLabels}><Text style={styles.rangeLabel}>LKR 500</Text><Text style={styles.rangeLabel}>LKR 5,000</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionTop}>
            <View style={styles.sectionIcon}>
              <Ionicons name="star" size={18} color="#D97706" />
            </View>
            <View style={styles.sectionCopy}>
              <Text style={styles.sectionTitle}>Rating</Text>
              <Text style={styles.sectionSubtitle}>Minimum tutor rating</Text>
            </View>
          </View>
          <OptionGroup
            options={['4.5+', '4.0+', '3.5+']}
            selected={filters.minRating ? `${filters.minRating.toFixed(1)}+` : undefined}
            onSelect={(value) => updateFilter('minRating', Number(value.replace('+', '')) as 3.5 | 4 | 4.5)}
          />
        </View>

        {sections.map((section) => (
          <View style={styles.card} key={section.key}>
            <View style={styles.sectionTop}>
              <View style={styles.sectionIcon}>
                <Ionicons name={section.icon} size={18} color="#D97706" />
              </View>
              <View style={styles.sectionCopy}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
              </View>
            </View>
            <OptionGroup
              options={section.options}
              selected={filters[section.key]}
              onSelect={(value) => updateFilter(section.key, value as never)}
            />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters} activeOpacity={0.86}>
          <Text style={styles.applyText}>Apply Filters</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const navy = '#061E47';
const navyCard = '#0B2754';
const amber = '#F59E0B';
const gold = '#FBBF24';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  headerBar: {
    backgroundColor: navy,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearHeaderBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  clearHeaderText: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
  },
  brandTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandMentor: {
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  belowHeaderSubtitle: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 10,
    fontWeight: '500',
  },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 102 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, marginBottom: 9, shadowColor: '#1D3D66', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  sectionIconText: { color: navy, fontSize: 17, fontWeight: '900' },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: navy, fontSize: 15, fontWeight: '900' },
  sectionSubtitle: { color: '#6F83AA', fontSize: 10.5, marginTop: 2 },
  optionGroup: { flexDirection: 'row', gap: 8 },
  option: { flex: 1, minHeight: 38, borderRadius: 11, backgroundColor: '#F0F4FA', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  optionActive: { backgroundColor: amber, shadowColor: amber, shadowOpacity: 0.22, shadowRadius: 7, elevation: 3 },
  optionText: { color: '#27406F', fontSize: 11.5, fontWeight: '700', textAlign: 'center' },
  optionTextActive: { color: '#FFF' },
  rangeTrack: { height: 6, borderRadius: 3, backgroundColor: '#D6DFED', marginHorizontal: 4, marginTop: 14 },
  rangeFill: { width: '55%', height: 6, borderRadius: 3, backgroundColor: amber },
  rangeThumb: { position: 'absolute', left: '53%', top: -5, width: 16, height: 16, borderRadius: 8, backgroundColor: amber, borderWidth: 2, borderColor: '#FFF' },
  rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginHorizontal: 2 },
  rangeLabel: { color: navy, fontSize: 10.5, fontWeight: '800' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFF', paddingHorizontal: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  applyButton: { height: 53, borderRadius: 14, backgroundColor: amber, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: amber, shadowOpacity: 0.25, shadowRadius: 9, elevation: 4 },
  applyText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  applyArrow: { color: '#FFF', fontSize: 22, fontWeight: '900', marginLeft: 13 },
});

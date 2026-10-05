import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TutorFilters } from '../../../domain/entities/TutorFilters';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';

type Props = NativeStackScreenProps<AppStackParamList, 'Filters'>;
type FilterKey = Exclude<keyof TutorFilters, 'priceRange' | 'minRating'>;

const sections: Array<{
  key: FilterKey;
  title: string;
  subtitle: string;
  icon: string;
  options: string[];
}> = [
  { key: 'experience', title: 'Experience', subtitle: 'Teaching experience', icon: 'E', options: ['1-2 years', '3-5 years', '5+ years'] },
  { key: 'language', title: 'Language', subtitle: 'Preferred teaching language', icon: 'L', options: ['English', 'Sinhala', 'Tamil'] },
  { key: 'lessonType', title: 'Lesson Type', subtitle: 'Choose a class type', icon: 'P', options: ['Individual', 'Group'] },
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
    navigation.navigate('Search', { ...(route.params?.searchParams ?? {}), filters });
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Filters" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.clearButton} onPress={() => setFilters({})} activeOpacity={0.8}>
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <View style={styles.sectionTop}>
            <View style={styles.sectionIcon}><Text style={styles.sectionIconText}>₨</Text></View>
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
            <View style={styles.sectionIcon}><Text style={styles.sectionIconText}>★</Text></View>
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
              <View style={styles.sectionIcon}><Text style={styles.sectionIconText}>{section.icon}</Text></View>
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
          <Text style={styles.applyArrow}>→</Text>
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
  header: { minHeight: 124, backgroundColor: navy, paddingHorizontal: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  headerOrbLeft: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: navyCard, left: -78, top: -70, opacity: 0.65 },
  headerOrbRight: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: navyCard, right: -90, top: -92, opacity: 0.5 },
  backButton: { width: 43, height: 43, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  backIcon: { color: '#FFF', fontSize: 35, lineHeight: 36, fontWeight: '300', marginTop: -3 },
  headerCopy: { flex: 1, alignItems: 'center', zIndex: 2 },
  title: { color: '#FFF', fontSize: 25, fontWeight: '900' },
  subtitle: { color: '#C9D8F0', fontSize: 11.5, marginTop: 4 },
  headerSide: { alignItems: 'flex-end', gap: 8, zIndex: 2 },
  clearButton: { alignSelf: 'flex-end', height: 38, borderRadius: 19, backgroundColor: '#FFF', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  clearText: { color: navy, fontSize: 11.5, fontWeight: '900' },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 102 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, marginBottom: 9, shadowColor: '#1D3D66', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EEF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
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

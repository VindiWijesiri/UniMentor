import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { libraryRepository } from '../../../data/repositories/libraryRepository';
import type { LibraryKind, LibraryKindFilter, LibraryMaterial, LibrarySource } from '../../../domain/entities/Library';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import StackFooterBar from '../../navigation/StackFooterBar';
import {
  SvgChevronLeft,
  SvgCode,
  SvgFileText,
  SvgMusic,
  SvgSearch,
  SvgVideocam,
  SvgZap,
} from '../../components/common/SvgIcons';
import MaterialCard from './MaterialCard';
import { ice, ink, muted, navy, pageBg, secondaryBlue, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyMaterials'>;
type KindFilter = 'all' | LibraryKind;
type SourceFilter = 'all' | LibrarySource;

function KindIcon({ name, active }: { name: LibraryKindFilter['icon']; active: boolean }) {
  const color = active ? '#FFF' : navy;
  if (name === 'all') return null;
  if (name === 'video') return <SvgVideocam size={14} color={color} strokeWidth={2} />;
  if (name === 'pdf') return <SvgFileText size={14} color={color} strokeWidth={2} />;
  if (name === 'quiz') return <SvgZap size={14} color={active ? '#FFF' : yellow} strokeWidth={2} />;
  if (name === 'audio') return <SvgMusic size={14} color={color} strokeWidth={2} />;
  if (name === 'code') return <SvgCode size={14} color={color} strokeWidth={2} />;
  return null;
}


export default function StudyMaterialsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const conversationId = route.params?.conversationId;
  const [kind, setKind] = useState<KindFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<LibraryMaterial[]>([]);
  const [kinds, setKinds] = useState<LibraryKindFilter[]>([]);
  const [saved, setSaved] = useState(0);
  const [offlineSize, setOfflineSize] = useState('340 MB');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    libraryRepository.list({
      q: search || undefined,
      source: source === 'all' ? undefined : source,
      conversationId,
    })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setKinds(data.kinds ?? []);
        setSaved(data.saved);
        setOfflineSize(data.offlineSize);
        setError('');
        const available = new Set((data.kinds ?? []).map((item) => item.key));
        setKind((current) => (available.has(current) ? current : 'all'));
      })
      .catch(() => { if (active) setError('Could not load the materials library.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, source, conversationId]);

  useFocusEffect(useCallback(() => load(), [load]));

  const filters = useMemo(() => {
    if (kinds.length) return kinds;
    const tally: Record<string, number> = {};
    items.forEach((item) => { tally[item.kind] = (tally[item.kind] ?? 0) + 1; });
    const fallback: LibraryKindFilter[] = [
      { key: 'all', label: 'All', icon: 'all', count: items.length },
    ];
    ([
      ['video', 'Videos'],
      ['pdf', 'PDF Notes'],
      ['image', 'Images'],
      ['quiz', 'Quizzes'],
      ['audio', 'Audio'],
      ['code', 'Code'],
      ['text', 'Text'],
    ] as const).forEach(([key, label]) => {
      if (tally[key]) fallback.push({ key, label, icon: key, count: tally[key] });
    });
    return fallback;
  }, [kinds, items]);

  const visible = useMemo(() => items.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) return false;
    return true;
  }), [items, kind]);

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <SvgChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Learning Materials</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
        <View style={styles.search}>
          <SvgSearch size={16} color={muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes, videos, past papers, code..."
            placeholderTextColor="#8B98AE"
            style={styles.searchInput}
            returnKeyType="search"
            onSubmitEditing={() => setSearch(query.trim())}
          />
        </View>
      </View>


      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filters.map((item) => {
            const active = kind === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.chip, active && styles.chipOn]}
                onPress={() => setKind(item.key)}
              >
                <KindIcon name={item.icon} active={active} />
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                <Text style={[styles.chipCount, active && styles.chipTextOn]}>{item.count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('StoreMaterial', { conversationId })} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>Add material</Text>
        </TouchableOpacity>

        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>SOURCE:</Text>
          {([
            ['all', 'All Sources'],
            ['group', 'Study Groups'],
            ['session', 'Tutor Sessions'],
            ['live', 'Live'],
          ] as const).map(([key, label]) => (
            <TouchableOpacity key={key} onPress={() => setSource(key)}>
              <Text style={[styles.sourceChip, source === key && styles.sourceOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.offline}>
          <View style={styles.offlineIcon}><Text style={styles.offlineGlyph}>↓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.offlineTitle}>Offline Available: {saved || items.length} Items ({offlineSize})</Text>
            <Text style={styles.offlineMeta}>Auto-synced with Tharushi's Kuppiya & Flash Records</Text>
          </View>
          <View style={styles.sync}><Text style={styles.syncText}>Sync All</Text></View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && items.length === 0 ? (
          <ActivityIndicator color={navy} style={{ marginTop: 24 }} />
        ) : visible.length === 0 ? (
          <Text style={styles.empty}>No materials in this filter yet.</Text>
        ) : visible.map((item) => (
          <MaterialCard
            key={item._id}
            item={item}
            onOpen={() => navigation.navigate('StudyMaterialDetail', { id: item._id })}
          />
        ))}
      </ScrollView>

      <StackFooterBar navigation={navigation} active="Learning" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  headerBar: {
    backgroundColor: navy,
    paddingHorizontal: 16,
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
    flex: 1,
    marginRight: 8,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
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
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandMentor: {
    color: yellow,
    fontSize: 20,
    fontWeight: '800',
  },
  search: {
    marginTop: 12,
    backgroundColor: '#FFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 42,
  },
  searchIcon: { color: muted, fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, color: ink, fontSize: 13, paddingVertical: 8 },
  filterBar: { backgroundColor: ice, paddingVertical: 12, paddingLeft: 12 },
  body: { padding: 14, paddingBottom: 20 },
  chips: { gap: 8, paddingRight: 16, alignItems: 'center' },
  chip: {
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: secondaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipOn: { backgroundColor: navy },
  chipIcon: { color: navy, fontSize: 12, fontWeight: '800' },
  chipIconOn: { color: '#FFF' },
  chipText: { color: navy, fontWeight: '800', fontSize: 13 },
  chipCount: { color: navy, fontWeight: '800', fontSize: 13 },
  chipTextOn: { color: '#FFF' },
  glyph: {
    width: 14,
    height: 10,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphDot: { width: 3, height: 3, borderRadius: 2 },
  docGlyph: { width: 11, height: 13, borderRadius: 2, borderWidth: 1.5 },
  addBtn: { backgroundColor: yellow, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  addBtnText: { color: navy, fontWeight: '900', fontSize: 15 },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
  sourceLabel: { color: muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sourceChip: { color: muted, fontSize: 12, fontWeight: '700' },
  sourceOn: { color: navy, fontWeight: '900', textDecorationLine: 'underline' },
  offline: {
    backgroundColor: '#FFF8DC',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3E3A4',
  },
  offlineIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center' },
  offlineGlyph: { color: navy, fontWeight: '900', fontSize: 16 },
  offlineTitle: { color: ink, fontWeight: '900', fontSize: 12 },
  offlineMeta: { color: muted, fontSize: 10, marginTop: 2 },
  sync: { backgroundColor: yellow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  syncText: { color: navy, fontWeight: '900', fontSize: 11 },
  error: { color: '#A63838', fontWeight: '700', marginBottom: 8 },
  empty: { textAlign: 'center', color: muted, marginTop: 30 },
});

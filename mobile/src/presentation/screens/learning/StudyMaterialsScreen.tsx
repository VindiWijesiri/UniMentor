import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
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
import MaterialCard from './MaterialCard';
import { ice, ink, muted, navy, pageBg, secondaryBlue, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyMaterials'>;
type KindFilter = 'all' | LibraryKind;
type SourceFilter = 'all' | LibrarySource;

const KIND_ICONS: Record<LibraryKindFilter['icon'], string> = {
  all: '',
  video: 'Camcorder',
  pdf: 'Doc',
  quiz: '⚡',
  audio: '♪',
  code: '</>',
};

function KindIcon({ name, active }: { name: LibraryKindFilter['icon']; active: boolean }) {
  const color = active ? '#FFF' : navy;
  if (name === 'all') return null;
  if (name === 'video') {
    return (
      <View style={[styles.glyph, { borderColor: color }]}>
        <View style={[styles.glyphDot, { backgroundColor: color }]} />
      </View>
    );
  }
  if (name === 'pdf') {
    return <View style={[styles.docGlyph, { borderColor: color }]} />;
  }
  return <Text style={[styles.chipIcon, active && styles.chipIconOn]}>{KIND_ICONS[name]}</Text>;
}

export default function StudyMaterialsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
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
    (['video', 'pdf', 'quiz', 'audio', 'code'] as const).forEach((key) => {
      if (tally[key]) fallback.push({ key, label: key === 'pdf' ? 'PDF Notes' : key === 'quiz' ? 'Quizzes' : key === 'video' ? 'Videos' : key === 'audio' ? 'Audio' : 'Code', icon: key, count: tally[key] });
    });
    return fallback;
  }, [kinds, items]);

  const visible = useMemo(() => items.filter((item) => {
    if (kind !== 'all' && item.kind !== kind) return false;
    return true;
  }), [items, kind]);

  return (
    <View style={styles.page}>
      <View style={[styles.hero, { paddingTop: insets.top + 6 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Learning Materials</Text>
          <Text style={styles.brand}>UniMentor</Text>
        </View>
        <View style={styles.search}>
          <Text style={styles.searchIcon}>⌕</Text>
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
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 32, marginRight: 6, marginTop: -4 },
  heroTitle: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: '900' },
  brand: { color: yellow, fontSize: 13, fontWeight: '800' },
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

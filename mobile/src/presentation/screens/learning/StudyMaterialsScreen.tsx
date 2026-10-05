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
import { CircleHelp, Code, FileText, Headphones, Play, Plus, RefreshCw, Search } from 'lucide-react-native';
import { libraryRepository } from '../../../data/repositories/libraryRepository';
import type { LibraryKind, LibraryKindFilter, LibraryMaterial, LibrarySource } from '../../../domain/entities/Library';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import StackFooterBar from '../../navigation/StackFooterBar';
import MaterialCard from './MaterialCard';
import { ice, ink, muted, navy, pageBg, secondaryBlue, yellow } from './learningTheme';
import PageHeader, { PageSubbar } from '../../components/PageHeader';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyMaterials'>;
type KindFilter = 'all' | LibraryKind;
type SourceFilter = 'all' | LibrarySource;

function KindIcon({ name, active }: { name: LibraryKindFilter['icon']; active: boolean }) {
  const color = active ? '#FFF' : navy;
  if (name === 'video') return <Play size={14} color={color} />;
  if (name === 'pdf') return <FileText size={14} color={color} />;
  if (name === 'quiz') return <CircleHelp size={14} color={color} />;
  if (name === 'audio') return <Headphones size={14} color={color} />;
  if (name === 'code') return <Code size={14} color={color} />;
  return null;
}

export default function StudyMaterialsScreen({ navigation, route }: Props) {
  const conversationId = route.params?.conversationId;
  const [kind, setKind] = useState<KindFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<LibraryMaterial[]>([]);
  const [kinds, setKinds] = useState<LibraryKindFilter[]>([]);
  const [saved, setSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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
        setError('');
        const available = new Set((data.kinds ?? []).map((item) => item.key));
        setKind((current) => (available.has(current) ? current : 'all'));
      })
      .catch(() => { if (active) setError('Could not load the materials library.'); })
      .finally(() => { if (active) { setLoading(false); setSyncing(false); } });
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
      <PageHeader title="Learning Materials" onBack={() => navigation.goBack()} />
      <PageSubbar>
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
      </PageSubbar>
      <View style={styles.hero}>
        <View style={styles.heroActions}>
          <View style={styles.search}>
            <Search size={16} color={muted} />
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
          <TouchableOpacity style={styles.add} onPress={() => navigation.navigate('StoreMaterial', { conversationId })}>
            <Plus size={16} color={navy} />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        <View style={styles.sourceRow}>
          <Text style={styles.sourceLabel}>SOURCE:</Text>
          {([
            ['all', 'All Sources'],
            ['group', 'Study Groups'],
            ['session', 'Tutor Sessions'],
            ['live', 'Live'],
            ['library', 'Library'],
          ] as const).map(([key, label]) => (
            <TouchableOpacity key={key} onPress={() => setSource(key)}>
              <Text style={[styles.sourceChip, source === key && styles.sourceOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.offline}>
          <View style={{ flex: 1 }}>
            <Text style={styles.offlineTitle}>{items.length} stored · {saved} saved on your account</Text>
            <Text style={styles.offlineMeta}>Loaded from the UniMentor library</Text>
          </View>
          <TouchableOpacity
            style={styles.sync}
            onPress={() => { setSyncing(true); setLoading(true); load(); }}
          >
            <RefreshCw size={14} color={navy} />
            <Text style={styles.syncText}>{syncing ? 'Syncing' : 'Sync'}</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && items.length === 0 ? (
          <ActivityIndicator color={navy} style={{ marginTop: 24 }} />
        ) : visible.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.empty}>No materials in this filter yet.</Text>
            <TouchableOpacity style={styles.add} onPress={() => navigation.navigate('StoreMaterial', { conversationId })}>
              <Plus size={16} color={navy} />
              <Text style={styles.addText}>Add material</Text>
            </TouchableOpacity>
          </View>
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
  hero: { backgroundColor: pageBg, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 32, marginRight: 6, marginTop: -4 },
  heroTitle: { flex: 1, color: '#FFF', fontSize: 20, fontWeight: '900' },
  brand: { color: yellow, fontSize: 13, fontWeight: '800' },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  search: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    minHeight: 42,
    gap: 6,
  },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: yellow,
    borderRadius: 16,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  addText: { color: navy, fontWeight: '900' },
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
  sync: { backgroundColor: yellow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  syncText: { color: navy, fontWeight: '900', fontSize: 11 },
  emptyWrap: { alignItems: 'center', gap: 12, marginTop: 24 },
  error: { color: '#A63838', fontWeight: '700', marginBottom: 8 },
  empty: { textAlign: 'center', color: muted, marginTop: 30 },
});

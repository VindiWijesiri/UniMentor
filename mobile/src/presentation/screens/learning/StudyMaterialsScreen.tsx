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
import type { LibraryMaterial } from '../../../domain/entities/Library';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'StudyMaterials'>;
type KindFilter = 'all' | 'video' | 'pdf' | 'quiz';
type SourceFilter = 'all' | 'group' | 'session' | 'live';

function actionLabel(item: LibraryMaterial) {
  if (item.kind === 'video') return 'Watch Now';
  if (item.kind === 'pdf') return item.title.toLowerCase().includes('probability') ? 'Download' : 'Open PDF';
  if (item.kind === 'quiz') return 'Retake Quiz';
  if (item.kind === 'audio') return `${item.audioSpeed ?? 1.6}x`;
  return 'View Code';
}

export default function StudyMaterialsScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const conversationId = route.params?.conversationId;
  const [kind, setKind] = useState<KindFilter>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<LibraryMaterial[]>([]);
  const [saved, setSaved] = useState(0);
  const [offlineSize, setOfflineSize] = useState('340 MB');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    libraryRepository.list({
      kind,
      source,
      q: search || undefined,
      conversationId,
    })
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setSaved(data.saved);
        setOfflineSize(data.offlineSize);
        setError('');
      })
      .catch(() => { if (active) setError('Could not load the materials library.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [kind, source, search, conversationId]);

  useFocusEffect(useCallback(() => load(), [load]));

  const role = user?.role === 'mentor' ? 'Tutor' : 'Student';
  const visible = useMemo(() => items, [items]);

  return (
    <View style={styles.page}>
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
          <View style={styles.titleWrap}>
            <View style={styles.titleRow}>
              <Text style={styles.heroTitle}>Learning Materials</Text>
              <View style={styles.libraryPill}><Text style={styles.libraryText}>LIBRARY</Text></View>
            </View>
            <Text style={styles.userLine}>{user?.name ?? 'Student'} · {saved} Saved Resources</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('StoreMaterial', { conversationId })}>
            <Text style={styles.add}>＋</Text>
          </TouchableOpacity>
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

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {([
            ['all', 'All'],
            ['video', 'Videos'],
            ['pdf', 'PDF Notes'],
            ['quiz', 'Quizzes'],
          ] as const).map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.chip, kind === key && styles.chipOn]} onPress={() => setKind(key)}>
              <Text style={[styles.chipText, kind === key && styles.chipTextOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            <Text style={styles.offlineTitle}>Offline Available: {saved} Items ({offlineSize})</Text>
            <Text style={styles.offlineMeta}>Auto-synced with Tharushi's Kuppiya & Flash Records</Text>
          </View>
          <View style={styles.sync}><Text style={styles.syncText}>Sync All</Text></View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && visible.length === 0 ? (
          <ActivityIndicator color={navy} style={{ marginTop: 24 }} />
        ) : visible.length === 0 ? (
          <Text style={styles.empty}>No materials in this filter yet. Store a resource to get started.</Text>
        ) : visible.map((item) => (
          <MaterialCard
            key={item._id}
            item={item}
            onOpen={() => navigation.navigate('StudyMaterialDetail', { id: item._id })}
          />
        ))}
        <Text style={styles.roleHint}>{role} library · same database as Chat Pod and Learning Dashboard</Text>
      </ScrollView>
    </View>
  );
}

function MaterialCard({ item, onOpen }: { item: LibraryMaterial; onOpen: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.88}>
      <View style={styles.cardTop}>
        <View style={styles.modPill}><Text style={styles.modText}>{item.moduleCode ?? 'UNI'}</Text></View>
        {item.kind === 'video' && <View style={styles.hd}><Text style={styles.hdText}>HD · 1080p</Text></View>}
        {item.kind === 'pdf' && (
          <>
            <Text style={styles.metaSoft}>PDF · {item.pageCount ?? 18} Pages</Text>
            {item.tags.includes('Exam Ready') && <View style={styles.exam}><Text style={styles.examText}>Exam Ready</Text></View>}
          </>
        )}
        {item.kind === 'quiz' && <Text style={styles.metaSoft}>{item.questionCount ?? 20} Questions</Text>}
        {item.kind === 'code' && <Text style={styles.metaSoft}>{item.fileCount ?? 14} Source Files</Text>}
        {item.kind === 'audio' && <Text style={styles.metaSoft}>Curated Explanation</Text>}
        {(item.kind === 'video' || item.kind === 'pdf' && item.sizeLabel?.includes('18')) && (
          <Text style={styles.size}>{item.sizeLabel ?? item.durationLabel}</Text>
        )}
      </View>
      {item.kind !== 'video' && item.moduleName ? <Text style={styles.modName}>{item.moduleName}</Text> : null}
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSub}>{item.subtitle}</Text>
      {item.kind === 'audio' ? (
        <View style={styles.audioRow}>
          <View style={styles.play}><Text style={styles.playText}>▶</Text></View>
          <View style={styles.wave} />
          <Text style={styles.time}>{item.durationLabel}</Text>
          <View style={styles.speed}><Text style={styles.speedText}>1.6x</Text></View>
        </View>
      ) : null}
      {item.kind === 'quiz' && item.quizBest ? (
        <Text style={styles.score}>★ Best Score: {item.quizBest}% · Completed</Text>
      ) : null}
      <View style={styles.cardFoot}>
        <Text style={styles.footMeta} numberOfLines={1}>{item.description}</Text>
        <View style={styles.cta}><Text style={styles.ctaText}>{actionLabel(item)}</Text></View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 30, marginRight: 8 },
  titleWrap: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  libraryPill: { backgroundColor: yellow, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  libraryText: { color: navy, fontSize: 10, fontWeight: '900' },
  userLine: { color: '#C5D4EB', fontSize: 11, marginTop: 3 },
  add: { color: yellow, fontSize: 26, fontWeight: '700', paddingLeft: 8 },
  search: { marginTop: 12, backgroundColor: '#FFF', borderRadius: 18, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, minHeight: 42 },
  searchIcon: { color: muted, fontSize: 16, marginRight: 6 },
  searchInput: { flex: 1, color: ink, fontSize: 13, paddingVertical: 8 },
  body: { padding: 14, paddingBottom: 32 },
  chips: { gap: 8, marginBottom: 10, paddingRight: 8 },
  chip: { borderRadius: 16, borderWidth: 1, borderColor: '#D7DEEA', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF' },
  chipOn: { backgroundColor: navy, borderColor: navy },
  chipText: { color: ink, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: '#FFF' },
  sourceRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 12 },
  sourceLabel: { color: muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sourceChip: { color: muted, fontSize: 12, fontWeight: '700' },
  sourceOn: { color: navy, fontWeight: '900', textDecorationLine: 'underline' },
  offline: { backgroundColor: '#FFF8DC', borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, borderWidth: 1, borderColor: '#F3E3A4' },
  offlineIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center' },
  offlineGlyph: { color: navy, fontWeight: '900', fontSize: 16 },
  offlineTitle: { color: ink, fontWeight: '900', fontSize: 12 },
  offlineMeta: { color: muted, fontSize: 10, marginTop: 2 },
  sync: { backgroundColor: yellow, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  syncText: { color: navy, fontWeight: '900', fontSize: 11 },
  card: { backgroundColor: '#FFF', borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E6EAF2' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modPill: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  modText: { color: '#3730A3', fontSize: 10, fontWeight: '900' },
  hd: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  hdText: { color: '#15803D', fontSize: 10, fontWeight: '800' },
  exam: { backgroundColor: '#FFEDD5', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  examText: { color: '#C2410C', fontSize: 10, fontWeight: '800' },
  metaSoft: { color: muted, fontSize: 11, fontWeight: '700' },
  size: { marginLeft: 'auto', color: muted, fontSize: 11, fontWeight: '700' },
  modName: { color: '#4F46E5', fontSize: 11, fontWeight: '800', marginTop: 8 },
  cardTitle: { color: ink, fontSize: 16, fontWeight: '900', marginTop: 6 },
  cardSub: { color: muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, backgroundColor: '#F4F7FB', borderRadius: 14, padding: 10 },
  play: { width: 32, height: 32, borderRadius: 16, backgroundColor: navy, alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#FFF' },
  wave: { flex: 1, height: 18, borderRadius: 8, backgroundColor: '#D6E4FF' },
  time: { color: ink, fontWeight: '800', fontSize: 12 },
  speed: { backgroundColor: yellow, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  speedText: { color: navy, fontWeight: '900', fontSize: 11 },
  score: { color: '#15803D', fontWeight: '800', marginTop: 8, fontSize: 12 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  footMeta: { flex: 1, color: muted, fontSize: 11 },
  cta: { backgroundColor: navy, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  ctaText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  error: { color: '#A63838', fontWeight: '700', marginBottom: 8 },
  empty: { textAlign: 'center', color: muted, marginTop: 30 },
  roleHint: { textAlign: 'center', color: muted, fontSize: 11, marginTop: 8 },
});

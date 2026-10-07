import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import type { AdminPortal, CatalogItem } from '../../../domain/entities/AssessmentWork';
import type { AppTabParamList } from '../../navigation/AppNavigator';
import { HeroHeader, OrangeButton, SearchField } from './Chrome';
import { blue, card, good, ink, line, muted, navy, orange, page, soft } from './theme';

type Props = { navigation: BottomTabNavigationProp<AppTabParamList> };
type Tier = 'all' | 'premium' | 'free' | 'deal' | 'community';

export default function AdminPortalScreen(_props: Props) {
  const [data, setData] = useState<AdminPortal | null>(null);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<Tier>('all');
  const [moduleCode, setModuleCode] = useState('All');
  const [composer, setComposer] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('IT2040');
  const [price, setPrice] = useState('FREE');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    assessmentRepository.adminPortal()
      .then((portal) => { if (active) setData(portal); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const modules = useMemo(() => ['All', ...new Set((data?.catalog ?? []).map((item) => item.moduleCode))], [data]);
  const catalog = useMemo(() => (data?.catalog ?? []).filter((item) => {
    const matchesTier = tier === 'all' || item.tier === tier || (tier === 'free' && item.tier === 'community');
    const matchesModule = moduleCode === 'All' || item.moduleCode === moduleCode;
    const matchesQuery = !query.trim() || `${item.title} ${item.author} ${item.moduleCode}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesTier && matchesModule && matchesQuery;
  }), [data, moduleCode, query, tier]);

  const review = async (paperId: string, decision: 'approve' | 'changes') => {
    try {
      await assessmentRepository.review(paperId, decision, decision === 'approve' ? 'Approved by faculty LIC.' : 'Revise the answer key and resubmit.');
      load();
    } catch {
      Alert.alert('Review failed', 'The decision was not saved.');
    }
  };

  const add = async () => {
    if (!title.trim()) return;
    try {
      await assessmentRepository.addCatalog({ title: title.trim(), moduleCode: code.trim() || 'IT2040', priceLabel: price.trim() || 'FREE', tier: price.toUpperCase() === 'FREE' ? 'free' : 'premium' });
      setTitle('');
      setComposer(false);
      load();
    } catch {
      Alert.alert('Not added', 'The catalog item was not saved.');
    }
  };

  return (
    <View style={styles.page}>
      <HeroHeader eyebrow="Campus Admin Portal" title="Study Material & Pricing">
        <SearchField value={query} onChangeText={setQuery} placeholder="Search materials, modules, author..." />
      </HeroHeader>
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading && !data ? <ActivityIndicator color={navy} /> : null}
        <View style={styles.grid}>
          <Stat label="Total catalog" value={`${data?.stats.catalog ?? 0}`} hint={`${data?.stats.free ?? 0} free · ${data?.stats.premium ?? 0} premium`} />
          <Stat label="Avg pack price" value={`${data?.stats.avgPrice ?? '0'} LKR`} hint={`Span ${data?.stats.span ?? ''} · cap ${data?.stats.cap ?? ''}`} />
          <Stat label="Catalog revenue" value={`${data?.stats.revenue ?? '0'} LKR/mo`} hint={`Tutors ${data?.stats.tutorShare ?? ''} · Kuppiya ${data?.stats.poolShare ?? ''}`} />
          <Stat label="Free access reads" value={`${data?.stats.downloads ?? '0'} dl/term`} hint="Verified LIC · 100% free" />
        </View>

        <View style={styles.policy}>
          <View style={styles.policyIcon}><MaterialIcons name="policy" size={18} color={navy} /></View>
          <View style={styles.flex}>
            <View style={styles.row}>
              <Text style={styles.cardTitle}>Campus pricing policy & caps</Text>
              <Text style={styles.active}>Active</Text>
            </View>
            <Text style={styles.body}>{data?.policy}</Text>
            <View style={styles.row}>
              <TouchableOpacity style={styles.small} onPress={() => Alert.alert('Caps', 'Standard tutor packs stay capped at LKR 2,500.')}><Text style={styles.smallText}>Manage caps</Text></TouchableOpacity>
              <TouchableOpacity style={styles.small} onPress={() => Alert.alert('Audit', 'Royalty split remains tutor 90% and campus pool 10%.')}><Text style={styles.smallText}>Audit logs</Text></TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.section}>Assessment review</Text>
        <Text style={styles.body}>LIC publishes a tutor assessment only after this check. Students cannot open it before approval.</Text>
        {(data?.pendingPapers ?? []).length === 0 ? <Text style={styles.body}>No assessments are waiting.</Text> : null}
        {(data?.pendingPapers ?? []).map((paper) => (
          <View key={paper.paperId} style={styles.card}>
            <Text style={styles.module}>{paper.moduleCode} · {paper.kindLabel} · {paper.status.replace('_', ' ')}</Text>
            <Text style={styles.cardTitle}>{paper.title}</Text>
            <Text style={styles.body}>{paper.tutorName}</Text>
            {paper.reviewNote ? <Text style={styles.body}>{paper.reviewNote}</Text> : null}
            <View style={styles.row}>
              <TouchableOpacity style={styles.approve} onPress={() => review(paper.paperId, 'approve')}><Text style={styles.approveText}>Approve</Text></TouchableOpacity>
              <TouchableOpacity style={styles.changes} onPress={() => review(paper.paperId, 'changes')}><Text style={styles.changesText}>Request changes</Text></TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.campaign}>
          <Text style={styles.cardTitle}>{data?.campaign.title}</Text>
          <Text style={styles.body}>{data?.campaign.detail}</Text>
          <View style={styles.row}>
            <TouchableOpacity style={styles.small} onPress={() => Alert.alert('Simulation', 'A 15% discount keeps tutor royalty whole by drawing from the subsidy pool.')}><Text style={styles.smallText}>Simulate effect</Text></TouchableOpacity>
            <TouchableOpacity style={styles.small} onPress={() => Alert.alert('Applied', 'The exam-season rule is staged for 42 Year 2 IT packs.')}><Text style={styles.smallText}>Apply to 42 packs</Text></TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Chip label={`All (${data?.catalog.length ?? 0})`} on={tier === 'all'} onPress={() => setTier('all')} />
          <Chip label="Paid" on={tier === 'premium' || tier === 'deal'} onPress={() => setTier('premium')} />
          <Chip label="Free" on={tier === 'free'} onPress={() => setTier('free')} />
          <Chip label="Rules" on={tier === 'deal'} onPress={() => setTier('deal')} />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {modules.map((item) => <Chip key={item} label={item} on={moduleCode === item} onPress={() => setModuleCode(item)} />)}
        </ScrollView>

        <Text style={styles.section}>Study materials</Text>
        {catalog.map((item) => <MaterialCard key={item._id} item={item} />)}

        {composer ? (
          <View style={styles.card}>
            <Field label="Title" value={title} onChangeText={setTitle} />
            <Field label="Module code" value={code} onChangeText={setCode} />
            <Field label="Price" value={price} onChangeText={setPrice} />
            <OrangeButton label="Save to catalog" onPress={add} />
          </View>
        ) : null}
        <OrangeButton label="Add study material or rule" icon="add" onPress={() => setComposer((value) => !value)} />
        <Text style={styles.note}>Pricing threshold changes notify module tutors automatically.</Text>
      </ScrollView>
    </View>
  );
}

export function AdminHomeScreen({ navigation }: BottomTabScreenProps<AppTabParamList, 'Home'>) {
  return (
    <View style={styles.page}>
      <HeroHeader eyebrow="Campus Admin Portal" title="Learning Innovation Centre" />
      <View style={styles.scroll}>
        <Text style={styles.cardTitle}>Review assessments and campus pricing</Text>
        <Text style={styles.body}>The LIC desk is on the Learning tab. Approve tutor papers before students can sit them.</Text>
        <View style={{ marginTop: 16 }}>
          <OrangeButton label="Open LIC desk" onPress={() => navigation.navigate('Learning')} />
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statHint}>{hint}</Text>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MaterialCard({ item }: { item: CatalogItem }) {
  return (
    <View style={styles.card}>
      <Text style={styles.module}>{item.moduleCode} · {item.badge}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.body}>{item.author}</Text>
      <View style={styles.row}>
        <Text style={styles.price}>{item.priceLabel}</Text>
        {item.strike ? <Text style={styles.strike}>{item.strike}</Text> : null}
        <Text style={styles.body}>{item.meta}</Text>
      </View>
      <Text style={styles.body}>{item.detail}</Text>
    </View>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.statLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholderTextColor={muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: page },
  scroll: { padding: 16, paddingBottom: 24 },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { width: '48%', backgroundColor: card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: line },
  statLabel: { color: muted, fontWeight: '700', fontSize: 12 },
  statValue: { color: ink, fontSize: 20, fontWeight: '800', marginTop: 4 },
  statHint: { color: muted, marginTop: 4, fontSize: 11 },
  policy: { flexDirection: 'row', gap: 10, backgroundColor: card, borderRadius: 16, padding: 12, marginTop: 12, borderWidth: 1, borderColor: line },
  policyIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  cardTitle: { color: ink, fontWeight: '800', flex: 1 },
  active: { color: good, fontWeight: '800' },
  body: { color: muted, marginTop: 4, lineHeight: 18 },
  small: { backgroundColor: '#EEF3FB', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  smallText: { color: navy, fontWeight: '800' },
  section: { color: ink, fontSize: 18, fontWeight: '800', marginTop: 16 },
  card: { backgroundColor: card, borderRadius: 16, padding: 12, marginTop: 8, borderWidth: 1, borderColor: line },
  module: { color: blue, fontWeight: '800', fontSize: 12 },
  approve: { backgroundColor: orange, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  approveText: { color: navy, fontWeight: '800' },
  changes: { backgroundColor: '#EEF3FB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  changesText: { color: navy, fontWeight: '800' },
  campaign: { backgroundColor: soft, borderRadius: 16, padding: 12, marginTop: 12 },
  filters: { gap: 8, paddingTop: 10 },
  chip: { backgroundColor: '#E7EDF6', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: navy },
  chipText: { color: blue, fontWeight: '700' },
  chipTextOn: { color: '#fff' },
  price: { color: ink, fontWeight: '800', fontSize: 16 },
  strike: { color: muted, textDecorationLine: 'line-through' },
  field: { marginBottom: 8 },
  input: { backgroundColor: page, borderRadius: 12, borderWidth: 1, borderColor: line, padding: 10, color: ink, marginTop: 4 },
  note: { color: muted, textAlign: 'center', marginTop: 8, fontSize: 12 },
});

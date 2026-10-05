import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodConversation, PodInboxFilter, PodInboxFilterKey } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import StackFooterBar from '../../navigation/StackFooterBar';
import { ice, ink, muted, navy, pageBg, secondaryBlue, yellow } from './learningTheme';
import { MessageCircle, Settings, User, Zap } from 'lucide-react-native';
import PageHeader from '../../components/PageHeader';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatPod'>;

function FilterIcon({ name, active }: { name: PodInboxFilter['icon']; active: boolean }) {
  const color = active ? '#FFF' : navy;
  if (name === 'all') return null;
  if (name === 'groups') {
    return (
      <View style={styles.peopleIcon}>
        <View style={[styles.personHead, { borderColor: color, left: 0 }]} />
        <View style={[styles.personHead, { borderColor: color, left: 5 }]} />
      </View>
    );
  }
  if (name === 'tutors') return <Settings size={14} color={color} />;
  return <User size={14} color={color} />;
}

const STACK_COLORS = ['#0B1F4C', '#F5C400', '#2F6FED', '#F97316', '#0F766E'];

function StackedAvatars({ initialsList }: { initialsList: string[] }) {
  const shown = initialsList.slice(0, 4);
  return (
    <View style={styles.stack}>
      {shown.map((value, index) => (
        <View
          key={`${value}-${index}`}
          style={[
            styles.stackAvatar,
            { backgroundColor: STACK_COLORS[index % STACK_COLORS.length], marginLeft: index === 0 ? 0 : -10, zIndex: 10 - index },
          ]}
        >
          <Text style={styles.stackText}>{value.slice(0, 2)}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ChatPodScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<PodInboxFilterKey>('all');
  const [items, setItems] = useState<PodConversation[]>([]);
  const [filters, setFilters] = useState<PodInboxFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composer, setComposer] = useState(false);
  const itemsRef = useRef<PodConversation[]>([]);
  itemsRef.current = items;

  const load = useCallback((silent = false) => {
    let active = true;
    if (!silent || itemsRef.current.length === 0) setLoading(true);
    podRepository.inbox()
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setFilters(data.filters);
        setError('');
        const available = new Set(data.filters.map((item) => item.key));
        setFilter((current) => (available.has(current) ? current : 'all'));
      })
      .catch(() => { if (active) setError('Could not load Chat Pod.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(true), [load]));

  const visible = useMemo(() => {
    if (filter === 'groups') return items.filter((item) => item.category === 'squad' || item.category === 'circle');
    if (filter === 'tutors') return items.filter((item) => item.category === 'tutor');
    if (filter === 'peers') return items.filter((item) => item.category === 'mentor' || item.category === 'kuppiya');
    return items;
  }, [filter, items]);

  return (
    <View style={styles.page}>
      <PageHeader title="Chat POD" onBack={() => navigation.goBack()} />

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((item) => {
            const active = filter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.chip, active && styles.chipOn]}
                onPress={() => setFilter(item.key)}
              >
                <FilterIcon name={item.icon} active={active} />
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{item.label}</Text>
                <Text style={[styles.chipCount, active && styles.chipTextOn]}>{item.count}</Text>
                {item.dot && !active ? <View style={styles.chipDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.state}><ActivityIndicator color={navy} /><Text style={styles.stateText}>Loading conversations...</Text></View>
      ) : error && items.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => load()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {visible.length === 0 && <Text style={styles.empty}>No conversations in this filter yet.</Text>}
          {visible.map((item) => {
            const group = item.type === 'group' || item.category === 'squad' || item.category === 'circle';
            return (
              <TouchableOpacity
                key={item._id}
                style={styles.card}
                onPress={() => navigation.navigate('PodThread', { conversationId: item._id })}
                activeOpacity={0.88}
              >
                {group ? (
                  <StackedAvatars
                    initialsList={[item.meta.leadInitials ?? 'TP', 'KJ', 'SP', 'SH']}
                  />
                ) : (
                  <View style={[styles.avatar, item.category === 'tutor' ? styles.avatarNavy : styles.avatarGold]}>
                    <Text style={[styles.avatarText, item.category !== 'tutor' && styles.avatarTextDark]}>
                      {item.meta.leadInitials ?? item.title.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.copy}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.time}>{item.timeLabel}</Text>
                  </View>
                  <Text style={styles.sub} numberOfLines={1}>
                    {item.meta.subtitle ?? item.lastMessageText}
                  </Text>
                  {item.category === 'squad' && (
                    <View style={styles.tagRow}>
                      <View style={styles.tag}><Text style={styles.tagText}>Live Kuppiya</Text></View>
                      <View style={[styles.tag, styles.tagGreen]}><Text style={styles.tagGreenText}>Audio Room Open</Text></View>
                    </View>
                  )}
                  {item.meta.actionLabel ? (
                    <View style={styles.actionRow}>
                      <View style={styles.flashRow}>
                        <Zap size={12} color={navy} />
                        <Text style={styles.flash} numberOfLines={1}>{item.meta.flashLabel ?? 'Flash session'}</Text>
                      </View>
                      <View style={styles.actionPill}><Text style={styles.actionText}>{item.meta.actionLabel}</Text></View>
                    </View>
                  ) : null}
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.unread}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.newChat} onPress={() => setComposer(true)} activeOpacity={0.9}>
        <MessageCircle size={18} color={navy} />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>

      <Modal visible={composer} transparent animationType="fade" onRequestClose={() => setComposer(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setComposer(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <Text style={styles.sheetTitle}>New Chat</Text>
            <Text style={styles.sheetSub}>Start a hub or message someone in UniMentor.</Text>
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                setComposer(false);
                navigation.navigate('CreateSquad');
              }}
            >
              <View style={styles.optionIcon}><Text style={styles.optionGlyph}>▣</Text></View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Create HUB</Text>
                <Text style={styles.optionMeta}>Open a study squad and invite peers or tutors</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.option}
              onPress={() => {
                setComposer(false);
                navigation.navigate('FindFriend');
              }}
            >
              <View style={[styles.optionIcon, styles.optionIconGold]}><User size={16} color={navy} /></View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>Chat with friend</Text>
                <Text style={styles.optionMeta}>Search by name or user ID and start a DM</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={() => setComposer(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      <StackFooterBar navigation={navigation} active="Learning" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  back: { color: '#FFF', fontSize: 26, marginTop: -2 },
  heroTitle: { flex: 1, color: '#FFF', fontSize: 24, fontWeight: '800' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandUni: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  brandMentor: { color: '#F5A623', fontSize: 16, fontWeight: '800' },
  filterBar: { backgroundColor: ice, paddingVertical: 12, paddingLeft: 12 },
  filters: { gap: 8, paddingRight: 16, alignItems: 'center' },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: secondaryBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  chipOn: { backgroundColor: navy },
  chipIcon: { color: navy, fontSize: 12 },
  chipIconOn: { color: '#FFF' },
  chipText: { color: navy, fontSize: 13, fontWeight: '800' },
  chipCount: { color: navy, fontSize: 13, fontWeight: '800' },
  chipTextOn: { color: '#FFF' },
  chipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: yellow },
  peopleIcon: { width: 16, height: 12, marginRight: 1, position: 'relative' },
  personHead: {
    position: 'absolute',
    top: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.4,
  },
  list: { padding: 14, paddingBottom: 100 },
  newChat: {
    position: 'absolute',
    right: 16,
    bottom: 86,
    backgroundColor: yellow,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  newChatIcon: { fontSize: 14 },
  newChatText: { color: navy, fontWeight: '900', fontSize: 14 },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(6,27,74,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 24,
  },
  sheetTitle: { color: ink, fontSize: 20, fontWeight: '900' },
  sheetSub: { color: muted, fontSize: 13, marginTop: 4, marginBottom: 14 },
  option: {
    backgroundColor: pageBg,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6EAF2',
  },
  optionIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: navy,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  optionIconGold: { backgroundColor: yellow },
  optionGlyph: { fontSize: 16 },
  optionCopy: { flex: 1 },
  optionTitle: { color: ink, fontWeight: '900', fontSize: 15 },
  optionMeta: { color: muted, fontSize: 12, marginTop: 3 },
  cancel: { alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: muted, fontWeight: '800' },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6EAF2',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stack: { flexDirection: 'row', width: 78, marginRight: 8, marginTop: 2 },
  stackAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
  stackText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarNavy: { backgroundColor: navy },
  avatarGold: { backgroundColor: yellow },
  avatarText: { color: '#FFF', fontWeight: '900' },
  avatarTextDark: { color: navy },
  copy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  name: { color: ink, fontSize: 15, fontWeight: '900', flex: 1 },
  time: { color: muted, fontSize: 11, fontWeight: '700' },
  sub: { color: muted, fontSize: 12, marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  tag: { backgroundColor: '#FFF3BC', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { color: '#8A5A00', fontSize: 10, fontWeight: '800' },
  tagGreen: { backgroundColor: '#DCFCE7' },
  tagGreenText: { color: '#15803D', fontSize: 10, fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  flashRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  flash: { color: '#B45309', fontSize: 11, fontWeight: '800', flex: 1 },
  actionPill: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  actionText: { color: '#B91C1C', fontSize: 10, fontWeight: '900' },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center', marginLeft: 6, marginTop: 4 },
  unreadText: { color: navy, fontSize: 10, fontWeight: '900' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { color: muted, marginTop: 8 },
  stateTitle: { color: ink, fontWeight: '800' },
  retry: { marginTop: 12, backgroundColor: yellow, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: navy, fontWeight: '900' },
  empty: { textAlign: 'center', color: muted, marginTop: 40 },
});

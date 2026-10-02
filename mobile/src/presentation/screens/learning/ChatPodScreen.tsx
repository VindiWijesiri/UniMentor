import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodConversation } from '../../../domain/entities/Pod';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatPod'>;
type Filter = 'all' | 'groups' | 'tutors' | 'mentors';

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
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<PodConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    podRepository.list(filter)
      .then((data) => {
        if (!active) return;
        setItems(data);
        setError('');
      })
      .catch(() => { if (active) setError('Could not load Chat Pod.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter]);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <View style={styles.page}>
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
          <Text style={styles.heroTitle}>Chat POD</Text>
          <Text style={styles.brand}>UniMentor</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {([
            ['all', 'All'],
            ['groups', 'Study Groups'],
            ['tutors', 'Tutors'],
            ['mentors', 'Mentors'],
          ] as const).map(([key, label]) => (
            <TouchableOpacity key={key} style={[styles.chip, filter === key && styles.chipOn]} onPress={() => setFilter(key)}>
              <Text style={[styles.chipText, filter === key && styles.chipTextOn]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.state}><ActivityIndicator color={navy} /><Text style={styles.stateText}>Loading conversations...</Text></View>
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={() => load()}><Text style={styles.retryText}>Retry</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {items.length === 0 && <Text style={styles.empty}>No conversations in this filter yet.</Text>}
          {items.map((item) => {
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
                      <Text style={styles.flash} numberOfLines={1}>⚡ {item.meta.flashLabel ?? 'Flash Kuppiya'}</Text>
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

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Text style={styles.lost}>Did you lose contact?</Text>
        <TouchableOpacity style={styles.newChat} onPress={() => navigation.navigate('CreateSquad')}>
          <Text style={styles.newChatText}>+ New Chat</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 14 },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 30, marginRight: 8 },
  heroTitle: { flex: 1, color: '#FFF', fontSize: 22, fontWeight: '900' },
  brand: { color: yellow, fontSize: 13, fontWeight: '800' },
  filters: { gap: 8, marginTop: 12 },
  chip: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: yellow, borderColor: yellow },
  chipText: { color: '#E7EEF8', fontSize: 12, fontWeight: '800' },
  chipTextOn: { color: navy },
  list: { padding: 14, paddingBottom: 24 },
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
  flash: { color: '#B45309', fontSize: 11, fontWeight: '800', flex: 1 },
  actionPill: { backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  actionText: { color: '#B91C1C', fontSize: 10, fontWeight: '900' },
  unread: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center', marginLeft: 6, marginTop: 4 },
  unreadText: { color: navy, fontSize: 10, fontWeight: '900' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E6EAF2' },
  lost: { color: muted, fontSize: 12 },
  newChat: { backgroundColor: yellow, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10 },
  newChatText: { color: navy, fontWeight: '900' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stateText: { color: muted, marginTop: 8 },
  stateTitle: { color: ink, fontWeight: '800' },
  retry: { marginTop: 12, backgroundColor: yellow, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: navy, fontWeight: '900' },
  empty: { textAlign: 'center', color: muted, marginTop: 40 },
});

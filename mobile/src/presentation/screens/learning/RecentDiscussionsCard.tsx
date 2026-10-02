import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodConversation, PodFeed } from '../../../domain/entities/Pod';
import { ink, muted, navy, yellow } from './learningTheme';

type Props = {
  onOpenPod: () => void;
  onOpenConversation: (conversation: PodConversation) => void;
};

export default function RecentDiscussionsCard({ onOpenPod, onOpenConversation }: Props) {
  const [feed, setFeed] = useState<PodFeed | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    podRepository.feed()
      .then((data) => { if (active) setFeed(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []));

  const items = feed?.items ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Recent Discussions</Text>
          <View style={styles.dot} />
        </View>
        <TouchableOpacity onPress={onOpenPod}>
          <Text style={styles.viewAll}>View All ({feed?.total ?? 0})</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 && (
        <Text style={styles.empty}>No live discussions yet. Open Chat Pod to start one.</Text>
      )}
      {items.map((item) => {
        const squad = item.category === 'squad';
        return (
          <TouchableOpacity
            key={item._id}
            style={[styles.row, squad && styles.rowHighlight]}
            onPress={() => onOpenConversation(item)}
            activeOpacity={0.85}
          >
            {squad ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{item.title}</Text></View>
            ) : (
              <View style={styles.kuppiyaRow}>
                <Text style={styles.bolt}>⚡</Text>
                <Text style={styles.kuppiya}>{item.meta.subtitle ?? 'Flash Kuppiya Proposal'}</Text>
              </View>
            )}
            <Text style={styles.time}>{item.timeLabel}</Text>
            <View style={styles.personRow}>
              <View style={[styles.avatar, squad ? styles.avatarNavy : styles.avatarGold]}>
                <Text style={[styles.avatarText, !squad && styles.avatarTextDark]}>{item.meta.leadInitials ?? 'UM'}</Text>
              </View>
              <View style={styles.copy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.meta.leadName ?? item.title}{squad ? ' (Lead)' : ''}
                  </Text>
                  {item.meta.isNew || item.unreadCount > 0 ? (
                    <View style={styles.newPill}><Text style={styles.newText}>New</Text></View>
                  ) : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {squad
                    ? `▶ Voice note: “${item.meta.voicePreview ?? item.lastMessageText}”`
                    : `Proposed: “${item.lastMessageText}”`}
                </Text>
                {!squad && (item.meta.pollVotes ?? 0) > 0 && (
                  <TouchableOpacity
                    onPress={async () => {
                      try {
                        await podRepository.vote(item._id);
                      } catch {
                        // still open the thread
                      }
                      onOpenConversation(item);
                    }}
                  >
                    <Text style={styles.votes}>
                      🔥 {item.meta.pollVotes} voted Yes  <Text style={styles.join}>Join Poll →</Text>
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity style={styles.cta} onPress={onOpenPod} activeOpacity={0.85}>
        <Text style={styles.ctaText}>💬  Open Discussions POD  →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFF', borderRadius: 22, padding: 14, borderWidth: 1, borderColor: '#E6EAF2' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  title: { color: ink, fontSize: 16, fontWeight: '900' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: yellow },
  viewAll: { color: '#2563EB', fontSize: 13, fontWeight: '800' },
  row: { borderRadius: 18, padding: 12, marginBottom: 8, backgroundColor: '#F7F9FC', borderWidth: 1, borderColor: '#EDF1F7' },
  rowHighlight: { backgroundColor: '#FFF8DC', borderColor: '#F3E3A4' },
  badge: { alignSelf: 'flex-start', backgroundColor: '#FFF3B0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 8 },
  badgeText: { color: '#8A5A00', fontSize: 10, fontWeight: '900' },
  kuppiyaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  bolt: { fontSize: 12 },
  kuppiya: { color: '#6B7280', fontSize: 11, fontWeight: '800' },
  time: { position: 'absolute', right: 12, top: 12, color: muted, fontSize: 11, fontWeight: '700' },
  personRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarNavy: { backgroundColor: navy },
  avatarGold: { backgroundColor: yellow },
  avatarText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  avatarTextDark: { color: navy },
  copy: { flex: 1, minWidth: 0, paddingRight: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: ink, fontSize: 14, fontWeight: '900', flexShrink: 1 },
  newPill: { backgroundColor: yellow, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  newText: { color: navy, fontSize: 10, fontWeight: '900' },
  preview: { color: muted, fontSize: 12, marginTop: 4 },
  votes: { color: '#B45309', fontSize: 12, fontWeight: '700', marginTop: 6 },
  join: { color: '#2563EB', fontWeight: '800' },
  empty: { color: muted, textAlign: 'center', paddingVertical: 12 },
  cta: { backgroundColor: yellow, borderRadius: 18, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
  ctaText: { color: navy, fontSize: 15, fontWeight: '900' },
});

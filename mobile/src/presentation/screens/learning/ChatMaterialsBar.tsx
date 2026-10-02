import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { libraryRepository } from '../../../data/repositories/libraryRepository';
import type { LibraryMaterial } from '../../../domain/entities/Library';
import { ink, muted, navy, yellow } from './learningTheme';

type Props = {
  conversationId: string;
  conversationTitle?: string;
  onOpenLibrary: () => void;
  onStore: () => void;
  onOpenItem: (id: string) => void;
};

export default function ChatMaterialsBar({ conversationId, conversationTitle, onOpenLibrary, onStore, onOpenItem }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<LibraryMaterial[]>([]);
  const height = useRef(new Animated.Value(0)).current;

  const load = useCallback(() => {
    libraryRepository.list({ conversationId })
      .then((data) => setItems(data.items.slice(0, 6)))
      .catch(() => {});
  }, [conversationId]);

  useEffect(() => { load(); }, [load]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load();
    Animated.timing(height, { toValue: next ? 210 : 0, duration: 220, useNativeDriver: false }).start();
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.handle} onPress={toggle} activeOpacity={0.85}>
        <View style={styles.grip} />
        <Text style={styles.handleText}>{open ? '▾ Hide materials' : '▴ Materials library'}</Text>
        <Text style={styles.count}>{items.length}</Text>
      </TouchableOpacity>
      <Animated.View style={[styles.sheet, { height }]}>
        <View style={styles.sheetInner}>
          <Text style={styles.sheetTitle}>{conversationTitle ?? 'Chat'} resources</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
            {items.map((item) => (
              <TouchableOpacity key={item._id} style={styles.card} onPress={() => onOpenItem(item._id)}>
                <Text style={styles.kind}>{item.kind.toUpperCase()}</Text>
                <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
              </TouchableOpacity>
            ))}
            {items.length === 0 && <Text style={styles.empty}>No stored materials in this chat yet.</Text>}
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.navyBtn} onPress={onOpenLibrary}><Text style={styles.navyText}>Open library</Text></TouchableOpacity>
            <TouchableOpacity style={styles.yellowBtn} onPress={onStore}><Text style={styles.yellowText}>Store material</Text></TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#DEE6F0' },
  handle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  grip: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#D5DEEA' },
  handleText: { flex: 1, color: navy, fontWeight: '900', fontSize: 12 },
  count: { backgroundColor: yellow, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, color: navy, fontWeight: '900', fontSize: 11 },
  sheet: { overflow: 'hidden' },
  sheetInner: { paddingHorizontal: 14, paddingBottom: 8 },
  sheetTitle: { color: muted, fontWeight: '800', fontSize: 11, marginBottom: 8 },
  cards: { gap: 8, paddingRight: 8 },
  card: { width: 150, backgroundColor: '#F4F7FB', borderRadius: 14, padding: 10, borderWidth: 1, borderColor: '#E6EAF2' },
  kind: { color: '#4F46E5', fontSize: 10, fontWeight: '900' },
  title: { color: ink, fontWeight: '800', fontSize: 12, marginTop: 6 },
  empty: { color: muted, fontSize: 12, paddingVertical: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  navyBtn: { flex: 1, backgroundColor: navy, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  navyText: { color: '#FFF', fontWeight: '900', fontSize: 12 },
  yellowBtn: { flex: 1, backgroundColor: yellow, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  yellowText: { color: navy, fontWeight: '900', fontSize: 12 },
});

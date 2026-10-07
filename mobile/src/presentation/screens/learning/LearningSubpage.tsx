import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  loading?: boolean;
  children: React.ReactNode;
};

export default function LearningSubpage({ eyebrow, title, subtitle, onBack, loading, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.page}>
      <View style={[styles.hero, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.back} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={navy} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  hero: { backgroundColor: navy, paddingHorizontal: 18, paddingBottom: 22 },
  back: { alignSelf: 'flex-start', marginBottom: 10 },
  backText: { color: yellow, fontSize: 15, fontWeight: '800' },
  eyebrow: { color: yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#C5D4EB', fontSize: 12, marginTop: 5 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: muted, fontSize: 12 },
  empty: { color: muted, textAlign: 'center', marginTop: 40 },
});

export const subpageStyles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6EAF2',
  },
  cardTitle: { color: ink, fontSize: 15, fontWeight: '900' },
  cardMeta: { color: muted, fontSize: 12, marginTop: 5, lineHeight: 18 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: yellow,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: { color: navy, fontSize: 14, fontWeight: '900' },
  navyBtn: {
    marginTop: 12,
    backgroundColor: navy,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navyText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  empty: { color: muted, textAlign: 'center', marginTop: 40 },
});

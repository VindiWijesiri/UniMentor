import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';
import PageHeader from '../../components/PageHeader';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  loading?: boolean;
  children: React.ReactNode;
};

export default function LearningSubpage({ title, onBack, loading, children }: Props) {
  return (
    <View style={styles.page}>
      <PageHeader title={title} onBack={onBack} />
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator color={navy} size="small" />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  loading: { alignItems: 'center', paddingTop: 12 },
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

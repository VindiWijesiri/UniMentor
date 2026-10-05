import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { LibraryKind, LibraryMaterial } from '../../../domain/entities/Library';
import { ink, muted, navy, yellow } from './learningTheme';

type Props = {
  item: LibraryMaterial;
  onOpen: () => void;
};

type KindSkin = {
  badge: string;
  icon: string;
  quality: string;
  qualityTone: 'green' | 'orange' | 'blue' | 'gold' | 'purple';
  metric: string;
  locale: string;
  downloaded: string;
  action: string;
};

function headline(item: LibraryMaterial) {
  if (item.fromLabel) {
    return item.fromLabel
      .replace(/^FROM:\s*/i, '')
      .replace(' • ', ' W/ ')
      .replace('(TUTOR)', '[TUTOR SESSION]')
      .replace('(STUDY GROUP)', '[STUDY GROUP]');
  }
  const owner = (item.ownerName ?? 'Tharushi').toUpperCase();
  const group = (item.conversationTitle ?? 'Study Group').toUpperCase();
  if (item.source === 'live') return `LIVE KUPPIYA W/ ${owner} [TUTOR SESSION]`;
  if (item.source === 'group') return `${group} [STUDY GROUP]`;
  if (item.source === 'session') return `POD SESSION W/ ${owner} [TUTOR SESSION]`;
  return `${(item.moduleName ?? 'LIBRARY PACK').toUpperCase()} [LIBRARY]`;
}

function skin(item: LibraryMaterial): KindSkin {
  const size = item.sizeLabel && !/hd|1080|pdf ·/i.test(item.sizeLabel) ? item.sizeLabel : undefined;
  if (item.kind === 'video') {
    return {
      badge: item.source === 'live' ? 'Zoom Live Rec' : 'Video Rec',
      icon: '▶',
      quality: item.sizeLabel?.includes('1080') || item.sizeLabel?.includes('HD') ? 'HD 1080p' : 'HD',
      qualityTone: 'green',
      metric: item.durationLabel ?? '1:12:40',
      locale: 'Bilingual\n(Sinhala/English)',
      downloaded: item.saved ? `Downloaded (${size ?? '192 MB'})` : `${item.downloads || 0} saves`,
      action: 'Watch Now',
    };
  }
  if (item.kind === 'pdf') {
    return {
      badge: item.tags.includes('Exam Ready') ? 'Exam Ready' : 'PDF Notes',
      icon: '▤',
      quality: `PDF · ${item.pageCount ?? 18} Pages`,
      qualityTone: item.tags.includes('Exam Ready') ? 'orange' : 'blue',
      metric: `${item.pageCount ?? 18} pg`,
      locale: 'Print ready\nannotated notes',
      downloaded: item.saved ? `Downloaded (${size ?? `${item.pageCount ?? 18} pg`})` : 'Save offline',
      action: item.title.toLowerCase().includes('probability') ? 'Download' : 'Open PDF',
    };
  }
  if (item.kind === 'quiz') {
    return {
      badge: 'Practice Quiz',
      icon: '☑',
      quality: `${item.questionCount ?? 20} Questions`,
      qualityTone: 'blue',
      metric: `${item.questionCount ?? 20} Q`,
      locale: item.quizBest != null ? `Best score\n${item.quizBest}%` : 'Review after\nsubmit',
      downloaded: item.completed ? 'Attempted' : 'Not started',
      action: item.completed ? 'Retake Quiz' : 'Start Quiz',
    };
  }
  if (item.kind === 'audio') {
    return {
      badge: 'Voice Note',
      icon: '♪',
      quality: `${item.audioSpeed ?? 1.6}x speed`,
      qualityTone: 'gold',
      metric: item.durationLabel ?? '12:40',
      locale: 'Curated\nexplanation',
      downloaded: item.saved ? `Downloaded (${size ?? '2.4 MB'})` : 'Stream / save',
      action: 'Play Now',
    };
  }
  return {
    badge: 'Code Pack',
    icon: '</>',
    quality: item.tags.slice(0, 2).join(' / ') || `${item.fileCount ?? 14} Files`,
    qualityTone: 'purple',
    metric: `${item.fileCount ?? 14} files`,
    locale: item.moduleName || 'Starter\nboilerplate',
    downloaded: item.saved ? 'OFFLINE ready' : `${item.fileCount ?? 14} source files`,
    action: 'View Code',
  };
}

const TONE = {
  green: { bg: '#E8F8EE', text: '#15803D' },
  orange: { bg: '#FFEDD5', text: '#C2410C' },
  blue: { bg: '#E8EEFF', text: '#3730A3' },
  gold: { bg: '#FFF4C2', text: '#92400E' },
  purple: { bg: '#F3E8FF', text: '#6B21A8' },
};

export default function MaterialCard({ item, onOpen }: Props) {
  const look = skin(item);
  const tone = TONE[look.qualityTone];
  const moduleLabel = [item.moduleCode, item.moduleName].filter(Boolean).join(' ');

  const share = () => {
    void Share.share({
      title: item.title,
      message: `${item.title}\n${item.subtitle ?? ''}`.trim(),
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.92}>
      <View style={styles.ribbon}>
        <Text style={styles.star}>★</Text>
        <Text style={styles.from} numberOfLines={2}>FROM: {headline(item)}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{look.badge}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.chips}>
            {moduleLabel ? (
              <View style={styles.moduleChip}>
                <Text style={styles.moduleText}>{moduleLabel}</Text>
              </View>
            ) : null}
            <View style={[styles.qualityChip, { backgroundColor: tone.bg }]}>
              <View style={[styles.qualityDot, { backgroundColor: tone.text }]} />
              <Text style={[styles.qualityText, { color: tone.text }]}>{look.quality}</Text>
            </View>
          </View>
          <View style={styles.media}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{look.icon}</Text>
            </View>
            <Text style={styles.metric}>{look.metric}</Text>
          </View>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        {item.subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text> : null}

        <View style={styles.rule} />

        <View style={styles.foot}>
          <Text style={styles.locale}>{look.locale}</Text>
          <View style={styles.status}>
            <Text style={styles.check}>✓</Text>
            <Text style={styles.downloaded}>{look.downloaded}</Text>
          </View>
          <TouchableOpacity style={styles.share} onPress={share} hitSlop={8}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cta} onPress={onOpen} activeOpacity={0.85}>
            <View style={styles.ctaDot} />
            <Text style={styles.ctaText}>{look.action}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export const materialKinds: LibraryKind[] = ['video', 'pdf', 'quiz', 'audio', 'code'];

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EDF5',
  },
  ribbon: {
    backgroundColor: yellow,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  star: { color: navy, fontSize: 13, fontWeight: '900' },
  from: { flex: 1, color: navy, fontSize: 10, fontWeight: '800', letterSpacing: 0.2, lineHeight: 14 },
  badge: {
    backgroundColor: '#FFF8E1',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: 92,
  },
  badgeText: { color: navy, fontSize: 10, fontWeight: '800', textAlign: 'center', lineHeight: 13 },
  body: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 12 },
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  chips: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingRight: 4 },
  moduleChip: {
    backgroundColor: '#EAF0FF',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  moduleText: { color: '#2F4B8F', fontSize: 11, fontWeight: '800' },
  qualityChip: {
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  qualityDot: { width: 7, height: 7, borderRadius: 4 },
  qualityText: { fontSize: 11, fontWeight: '800' },
  media: { alignItems: 'center', width: 58 },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { color: navy, fontSize: 14, fontWeight: '900' },
  metric: { color: muted, fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  title: { color: ink, fontSize: 20, fontWeight: '900', marginTop: 10, lineHeight: 26 },
  subtitle: { color: muted, fontSize: 13, marginTop: 6, lineHeight: 19 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: '#E6EAF2', marginTop: 14, marginBottom: 12 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locale: { color: muted, fontSize: 10, fontWeight: '700', lineHeight: 14, width: 78 },
  status: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  check: { color: '#16A34A', fontSize: 13, fontWeight: '900' },
  downloaded: { color: '#16A34A', fontSize: 11, fontWeight: '800', flexShrink: 1 },
  share: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: { color: muted, fontSize: 13, fontWeight: '800' },
  cta: {
    backgroundColor: yellow,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: navy },
  ctaText: { color: navy, fontSize: 12, fontWeight: '900' },
});

import React from 'react';
import { Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bookmark, Code, FileText, Headphones, Play, Share2, CircleHelp } from 'lucide-react-native';
import type { LibraryKind, LibraryMaterial } from '../../../domain/entities/Library';
import { ink, muted, navy, yellow } from './learningTheme';

type Props = {
  item: LibraryMaterial;
  onOpen: () => void;
};

const KIND_LABEL: Record<LibraryKind, string> = {
  video: 'Video',
  pdf: 'PDF notes',
  quiz: 'Quiz',
  audio: 'Audio',
  code: 'Code',
};

function KindIcon({ kind }: { kind: LibraryKind }) {
  const color = navy;
  if (kind === 'video') return <Play size={18} color={color} />;
  if (kind === 'pdf') return <FileText size={18} color={color} />;
  if (kind === 'quiz') return <CircleHelp size={18} color={color} />;
  if (kind === 'audio') return <Headphones size={18} color={color} />;
  return <Code size={18} color={color} />;
}

function metric(item: LibraryMaterial) {
  if (item.durationLabel) return item.durationLabel;
  if (item.pageCount) return `${item.pageCount} pages`;
  if (item.questionCount) return `${item.questionCount} questions`;
  if (item.fileCount) return `${item.fileCount} files`;
  if (item.sizeLabel) return item.sizeLabel;
  return KIND_LABEL[item.kind];
}

export default function MaterialCard({ item, onOpen }: Props) {
  const moduleLabel = [item.moduleCode, item.moduleName].filter(Boolean).join(' ');
  const source = item.fromLabel || item.ownerName || 'Library';

  const share = () => {
    void Share.share({
      title: item.title,
      message: [item.title, item.subtitle, moduleLabel].filter(Boolean).join('\n'),
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onOpen} activeOpacity={0.92}>
      <View style={styles.ribbon}>
        <Text style={styles.from} numberOfLines={2}>{source}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{KIND_LABEL[item.kind]}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.top}>
          <View style={styles.iconCircle}>
            <KindIcon kind={item.kind} />
          </View>
          <View style={styles.copy}>
            {moduleLabel ? <Text style={styles.module}>{moduleLabel}</Text> : null}
            <Text style={styles.title}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{item.subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.foot}>
          <Text style={styles.metric}>{metric(item)}</Text>
          <View style={styles.saved}>
            <Bookmark size={14} color={item.saved ? navy : muted} />
            <Text style={styles.savedText}>{item.saved ? 'Saved' : 'In library'}</Text>
          </View>
          <TouchableOpacity onPress={share} hitSlop={8} accessibilityLabel="Share material">
            <Share2 size={16} color={navy} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cta} onPress={onOpen}>
            <Text style={styles.ctaText}>Open</Text>
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
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E3EAF4',
  },
  ribbon: {
    backgroundColor: yellow,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  from: { flex: 1, color: navy, fontSize: 11, fontWeight: '800' },
  badge: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: navy, fontSize: 10, fontWeight: '900' },
  body: { padding: 14 },
  top: { flexDirection: 'row', gap: 12 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#EEF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  module: { color: muted, fontSize: 11, fontWeight: '800', marginBottom: 2 },
  title: { color: ink, fontSize: 16, fontWeight: '900' },
  subtitle: { color: muted, marginTop: 4, lineHeight: 18 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  metric: { flex: 1, color: navy, fontWeight: '800', fontSize: 12 },
  saved: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedText: { color: muted, fontSize: 11, fontWeight: '700' },
  cta: { backgroundColor: navy, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  ctaText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
});

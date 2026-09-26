import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../shared/theme';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export default function BrandedHeader({ title, onBack, right }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 6 }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.brand}>
          {right ?? (
            <Text style={styles.wordmark}>
              <Text style={styles.uni}>Uni</Text>
              <Text style={styles.mentor}>Mentor</Text>
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.navy,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSpacer: { width: 36 },
  backIcon: { color: colors.white, fontSize: 28, marginTop: -2, fontWeight: '300' },
  title: {
    flex: 1,
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  brand: { minWidth: 88, alignItems: 'flex-end' },
  wordmark: { fontSize: 14, fontWeight: '800' },
  uni: { color: colors.white },
  mentor: { color: colors.gold },
});

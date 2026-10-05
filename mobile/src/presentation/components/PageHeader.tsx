import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UniMentorWordmark from './UniMentorWordmark';

type HeaderProps = {
  title: string;
  onBack?: () => void;
  rounded?: boolean;
};

export default function PageHeader({ title, onBack }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const goBack = onBack ?? (() => {
    if (navigation.canGoBack()) navigation.goBack();
  });

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.back} onPress={goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <UniMentorWordmark size={16} />
    </View>
  );
}

type SubbarProps = {
  children: React.ReactNode;
  scroll?: boolean;
};

export function PageSubbar({ children, scroll = true }: SubbarProps) {
  return (
    <View style={styles.subbar}>
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subRow}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.subRow, styles.subRowFill]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#102B5D',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: { color: '#FFFFFF', fontSize: 28, lineHeight: 32, marginTop: -2, fontWeight: '400' },
  title: { flex: 1, color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginRight: 8 },
  subbar: {
    backgroundColor: '#31528E',
    minHeight: 58,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  subRowFill: { width: '100%' },
});

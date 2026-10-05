import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import UniMentorWordmark from './UniMentorWordmark';

type Props = {
  title: string;
  onBack?: () => void;
  rounded?: boolean;
};

export default function PageHeader({ title, onBack, rounded = true }: Props) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const goBack = onBack ?? (() => {
    if (navigation.canGoBack()) navigation.goBack();
  });

  return (
    <View style={[styles.bar, rounded && styles.rounded, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity style={styles.back} onPress={goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <UniMentorWordmark />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#102B5D',
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rounded: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backIcon: { color: '#FFFFFF', fontSize: 28, lineHeight: 30, marginTop: -2, fontWeight: '500' },
  title: { flex: 1, color: '#FFFFFF', fontSize: 22, fontWeight: '800', marginRight: 8 },
});

import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radius } from '../../shared/theme';

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        (disabled || loading) && { opacity: 0.55 },
        pressed && { backgroundColor: colors.orangeDark },
      ]}
    >
      {loading ? <ActivityIndicator color={colors.navy} /> : <Text style={styles.primaryText}>{label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondary}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function Badge({
  text,
  tone = 'navy',
}: {
  text: string;
  tone?: 'navy' | 'orange' | 'success' | 'danger' | 'info';
}) {
  const map = {
    navy: { backgroundColor: colors.infoBg, color: colors.navy },
    orange: { backgroundColor: colors.warningBg, color: '#8A5A00' },
    success: { backgroundColor: colors.successBg, color: colors.success },
    danger: { backgroundColor: colors.dangerBg, color: colors.danger },
    info: { backgroundColor: colors.infoBg, color: colors.info },
  } as const;
  return (
    <View style={[styles.badge, { backgroundColor: map[tone].backgroundColor }]}>
      <Text style={[styles.badgeText, { color: map[tone].color }]}>{text}</Text>
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    shadowColor: colors.navy,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  primary: {
    backgroundColor: colors.orange,
    borderRadius: radius.md,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: { color: colors.navy, fontSize: 16, fontWeight: '800' },
  secondary: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radius.md,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  secondaryText: { color: colors.navy, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 28, paddingHorizontal: 16 },
  label: { fontSize: 13, fontWeight: '700', color: colors.navy, marginBottom: 6 },
});

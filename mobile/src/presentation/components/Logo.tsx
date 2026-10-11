import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../shared/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const dimensions: Record<string, number> = {
    small: 48,
    medium: 80,
    large: 120,
    xlarge: 150,
  };

  const fontSize: Record<string, number> = {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 38,
  };

  const dim = typeof size === 'number' ? size : dimensions[size] ?? 80;
  const fs = typeof size === 'number' ? Math.round(size * 0.25) : fontSize[size] ?? 24;

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/icon.png')}
        style={{ width: dim, height: dim, borderRadius: dim * 0.15 }}
        resizeMode="contain"
      />
      {showText && (
        <View style={styles.textRow}>
          <Text style={[styles.uni, { fontSize: fs }]}>Uni</Text>
          <Text style={[styles.mentor, { fontSize: fs }]}>Mentor</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  textRow: { flexDirection: 'row' },
  uni: { fontWeight: '800', color: colors.primary },
  mentor: { fontWeight: '800', color: colors.secondary },
});

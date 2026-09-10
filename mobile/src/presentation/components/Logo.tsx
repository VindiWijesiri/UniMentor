import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../shared/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'medium', showText = true }: LogoProps) {
  const dimensions = {
    small: 48,
    medium: 80,
    large: 120,
  };

  const fontSize = {
    small: 16,
    medium: 24,
    large: 32,
  };

  const dim = dimensions[size];
  const fs = fontSize[size];

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

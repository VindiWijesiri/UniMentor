import React, { useState } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

interface TutorAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showOnlineDot?: boolean;
}

const AVATAR_COLORS = [
  '#061E47', // Navy
  '#1D4ED8', // Royal Blue
  '#0D9488', // Teal
  '#7C3AED', // Purple
  '#C026D3', // Magenta
  '#D97706', // Amber/Orange
  '#059669', // Emerald
  '#4338CA', // Indigo
];

function getInitials(name: string): string {
  if (!name || !name.trim()) return 'U';
  const clean = name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorForName(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function TutorAvatar({
  name,
  imageUrl,
  size = 50,
  borderRadius,
  style,
  textStyle,
  showOnlineDot = false,
}: TutorAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const radius = borderRadius ?? size / 2;
  const fontSize = Math.max(12, Math.round(size * 0.38));
  const initials = getInitials(name);
  const bgColor = getColorForName(name);

  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0 && !imageError);

  return (
    <View style={[{ width: size, height: size, position: 'relative' }, style]}>
      {hasImage ? (
        <Image
          source={{ uri: imageUrl! }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallbackAvatar,
            {
              width: size,
              height: size,
              borderRadius: radius,
              backgroundColor: bgColor,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              {
                fontSize,
              },
              textStyle,
            ]}
          >
            {initials}
          </Text>
        </View>
      )}

      {showOnlineDot && (
        <View
          style={[
            styles.onlineDot,
            {
              width: Math.max(8, Math.round(size * 0.22)),
              height: Math.max(8, Math.round(size * 0.22)),
              borderRadius: Math.round(size * 0.11),
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E2E8F0',
  },
  fallbackAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  initialsText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

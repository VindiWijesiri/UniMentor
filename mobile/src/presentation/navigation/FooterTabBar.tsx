import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';
import { getFooterTabs } from './tabConfig';

export default function FooterTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const role = useAuthStore((current) => current.user?.role);
  const tabs = getFooterTabs(role);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const tab = tabs.find((item) => item.name === route.name);
        if (!tab) return null;

        const focused = state.index === index;
        const color = focused ? colors.footerActive : colors.footerInactive;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={styles.item}
          >
            <tab.Icon color={color} size={24} />
            <Text style={[styles.label, { color }]} numberOfLines={2}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.footerBorder,
    paddingTop: 10,
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    minHeight: 48,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
});

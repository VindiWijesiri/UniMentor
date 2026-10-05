import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../domain/stores/authStore';
import { colors } from '../../shared/theme';
import type { AppStackParamList } from './AppNavigator';
import { getFooterTabs, type FooterTabName } from './tabConfig';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, any>;
  active?: FooterTabName;
};

export default function StackFooterBar({ navigation, active = 'Learning' }: Props) {
  const insets = useSafeAreaInsets();
  const role = useAuthStore((current) => current.user?.role);
  const tabs = getFooterTabs(role);

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {tabs.map((tab) => {
        const focused = tab.name === active;
        const color = focused ? colors.footerActive : colors.footerInactive;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={() => navigation.navigate('MainTabs', { screen: tab.name })}
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

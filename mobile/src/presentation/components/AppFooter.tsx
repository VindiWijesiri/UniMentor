import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../../shared/theme';
import TabIcon from './TabIcon';

export type TabName = 'Home' | 'Bookings' | 'Learning' | 'Alerts' | 'Profile';

const TABS: { name: TabName; label: string }[] = [
  { name: 'Home', label: 'Home' },
  { name: 'Bookings', label: 'Bookings' },
  { name: 'Learning', label: 'Learning' },
  { name: 'Alerts', label: 'Alerts' },
  { name: 'Profile', label: 'Profile' },
];

type Props = {
  tabBar?: BottomTabBarProps;
  active?: TabName;
};

export default function AppFooter({ tabBar, active }: Props) {
  const navigation = useNavigation<{ navigate: (name: string, params?: object) => void }>();
  const insets = useSafeAreaInsets();
  const current = tabBar ? (tabBar.state.routeNames[tabBar.state.index] as TabName) : active;

  const go = (name: TabName) => {
    if (tabBar) {
      tabBar.navigation.navigate(name);
      return;
    }
    navigation.navigate('MainTabs', { screen: name });
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {TABS.map((tab) => {
        const focused = current === tab.name;
        const color = focused ? colors.gold : colors.inactive;
        return (
          <Pressable key={tab.name} onPress={() => go(tab.name)} style={styles.item}>
            <TabIcon name={tab.name} color={color} focused={focused} />
            <Text style={[styles.label, { color }, focused && styles.labelOn]}>{tab.label}</Text>
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    minHeight: 58,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontSize: 10, fontWeight: '600' },
  labelOn: { fontWeight: '800' },
});

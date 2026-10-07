import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../domain/stores/authStore';
import type { AppStackParamList } from './AppNavigator';
import { getFooterTabs, type FooterTabName } from './tabConfig';

type Props = {
  navigation: NativeStackNavigationProp<AppStackParamList, any> | any;
  active?: FooterTabName | string;
};

export default function StackFooterBar({ navigation, active = 'Learning' }: Props) {
  const insets = useSafeAreaInsets();
  const role = useAuthStore((current) => current.user?.role);
  const tabs = getFooterTabs(role);

  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 10 : 8);
  const barHeight = 56 + bottomInset;

  return (
    <View style={[styles.bar, { height: barHeight, paddingBottom: bottomInset }]}>
      {tabs.map((tab) => {
        const focused = tab.name === active || tab.screen === active;
        const color = focused ? '#EAA023' : '#64748B';
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            onPress={() => {
              if (navigation) {
                if ((tab.name === active || tab.screen === active) && navigation.canGoBack?.()) {
                  navigation.goBack();
                } else {
                  navigation.navigate('MainTabs', { screen: tab.screen as any });
                }
              }
            }}
            style={styles.item}
          >
            <tab.Icon color={color} size={22} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
});

import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../shared/theme';
import BrandedHeader from './BrandedHeader';
import AppFooter, { TabName } from './AppFooter';

type Props = {
  title: string;
  children: React.ReactNode;
  showBack?: boolean;
  activeTab?: TabName;
  showFooter?: boolean;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  right?: React.ReactNode;
  pad?: boolean;
};

export default function ScreenLayout({
  title,
  children,
  showBack,
  activeTab = 'Learning',
  showFooter = true,
  scroll = true,
  refreshing,
  onRefresh,
  right,
  pad = true,
}: Props) {
  const navigation = useNavigation();
  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={pad ? styles.content : styles.grow}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} /> : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, pad && styles.content]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BrandedHeader title={title} onBack={showBack ? () => navigation.goBack() : undefined} right={right} />
      {body}
      {showFooter ? <AppFooter active={activeTab} /> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
  content: { padding: 16, paddingBottom: 28 },
});

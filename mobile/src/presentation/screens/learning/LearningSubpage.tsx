import React from 'react';
import { ActivityIndicator, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgChevronLeft } from '../../components/common/SvgIcons';
import StackFooterBar from '../../navigation/StackFooterBar';
import { ink, muted, navy, pageBg, yellow } from './learningTheme';

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  loading?: boolean;
  navigation?: any;
  hideFooter?: boolean;
  children: React.ReactNode;
};

export default function LearningSubpage({
  eyebrow,
  title,
  subtitle,
  onBack,
  loading,
  navigation,
  hideFooter = false,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const navFromHook = useNavigation();
  const activeNav = navigation || navFromHook;
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />
      {/* Top Header Bar matching StudentDashboardScreen */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            <TouchableOpacity style={styles.headerBackButton} onPress={onBack} activeOpacity={0.7}>
              <SvgChevronLeft size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      {(eyebrow || subtitle) ? (
        <View style={styles.subBanner}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      <View style={styles.bodyWrap}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={navy} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : children}
      </View>

      {!hideFooter && <StackFooterBar navigation={activeNav} active="Learning" />}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: pageBg },
  bodyWrap: { flex: 1 },
  headerBar: {
    backgroundColor: navy,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  brandMentor: {
    color: yellow,
    fontSize: 20,
    fontWeight: '800',
  },
  subBanner: {
    backgroundColor: '#0A2552',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  eyebrow: { color: yellow, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  subtitle: { color: '#C5D4EB', fontSize: 12, marginTop: 3 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: muted, fontSize: 12 },
  empty: { color: muted, textAlign: 'center', marginTop: 40 },
});

export const subpageStyles = StyleSheet.create({
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6EAF2',
  },
  cardTitle: { color: ink, fontSize: 15, fontWeight: '900' },
  cardMeta: { color: muted, fontSize: 12, marginTop: 5, lineHeight: 18 },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: yellow,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryText: { color: navy, fontSize: 14, fontWeight: '900' },
  navyBtn: {
    marginTop: 12,
    backgroundColor: navy,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navyText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  empty: { color: muted, textAlign: 'center', marginTop: 40 },
});

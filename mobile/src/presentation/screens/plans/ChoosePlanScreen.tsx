import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { planRepository } from '../../../data/repositories/planRepository';
import type { ChosenPlan, PlanCode, PlanOffer } from '../../../domain/entities/StudentPlan';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import StackFooterBar from '../../navigation/StackFooterBar';
import { SvgChevronLeft } from '../../components/common/SvgIcons';

type Props = NativeStackScreenProps<AppStackParamList, 'ChoosePlan'>;

const FALLBACK: PlanOffer[] = [
  {
    code: 'free',
    name: 'Free',
    priceLkr: 0,
    period: 'forever',
    tagline: 'Look through tutors and book one session.',
    features: ['Browse tutors', '1 session booking', 'Learning materials'],
  },
  {
    code: 'plus',
    name: 'Student Plus',
    priceLkr: 1490,
    period: 'month',
    tagline: 'More bookings, chat, and study pods.',
    features: ['8 session bookings', 'Tutor chat', 'Study pods', 'Priority matching'],
  },
  {
    code: 'pro',
    name: 'Student Pro',
    priceLkr: 2990,
    period: 'month',
    tagline: 'Full mentoring, live rooms, and unlimited bookings.',
    features: ['Unlimited bookings', 'Live rooms', 'All study materials', 'Priority support'],
  },
];

const ICONS: Record<PlanCode, keyof typeof Ionicons.glyphMap> = {
  free: 'leaf-outline',
  plus: 'star-outline',
  pro: 'diamond-outline',
};

function money(amount: number) {
  return amount === 0 ? 'LKR 0' : `LKR ${amount.toLocaleString('en-LK')}`;
}

export default function ChoosePlanScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const [plans, setPlans] = useState<PlanOffer[]>(FALLBACK);
  const [current, setCurrent] = useState<ChosenPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<PlanCode | 'remove' | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    planRepository.list()
      .then((data) => {
        if (!active) return;
        if (data.plans?.length) setPlans(data.plans);
        setCurrent(data.current ?? null);
        setError('');
      })
      .catch(() => { if (active) setError('Could not load plans.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const goToBooking = () => {
    navigation.navigate('MainTabs', { screen: 'Bookings', params: { screen: 'FindMentor' } });
  };

  const messageOf = (err: unknown) => (
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Could not save this plan.'
  );

  const choose = async (code: PlanCode) => {
    setBusy(code);
    setError('');
    try {
      const saved = current ? await planRepository.update(code) : await planRepository.choose(code);
      setCurrent(saved);
      goToBooking();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (Platform.OS === 'web') {
      if (!window.confirm('Remove your current plan?')) return;
    } else {
      const { Alert } = await import('react-native');
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert('Remove plan', 'Remove your current plan?', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }

    setBusy('remove');
    setError('');
    try {
      await planRepository.remove();
      setCurrent(null);
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.page}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent />
      <View style={[styles.header, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} accessibilityLabel="Back">
            <SvgChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose your plan</Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Pick Free, Student Plus, or Student Pro. Booking opens after you choose.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading && !current ? <ActivityIndicator color="#061E47" style={{ marginVertical: 12 }} /> : null}
        {current ? (
          <View style={styles.currentBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#061E47" />
            <Text style={styles.currentText}>Current plan: {current.name}</Text>
          </View>
        ) : null}

        {plans.map((plan) => {
          const selected = current?.code === plan.code;
          return (
            <View key={plan.code} style={[styles.card, selected && styles.cardOn, plan.code === 'pro' && styles.cardPro]}>
              <View style={styles.cardTop}>
                <View style={[styles.iconWrap, selected && styles.iconWrapOn]}>
                  <Ionicons name={ICONS[plan.code]} size={18} color={selected ? '#061E47' : '#31528E'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.tagline}>{plan.tagline}</Text>
                </View>
                {plan.code === 'plus' ? <Text style={styles.popular}>Popular</Text> : null}
              </View>
              <Text style={styles.price}>
                {money(plan.priceLkr)}
                <Text style={styles.period}>{plan.priceLkr === 0 ? '' : ` / ${plan.period}`}</Text>
              </Text>
              {plan.features.map((feature) => (
                <View key={feature} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={14} color="#15803D" />
                  <Text style={styles.feature}>{feature}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.chooseBtn, selected && styles.chooseBtnOn]}
                activeOpacity={0.85}
                disabled={busy != null}
                onPress={() => { if (!selected) void choose(plan.code); else goToBooking(); }}
              >
                <Text style={[styles.chooseText, selected && styles.chooseTextOn]}>
                  {busy === plan.code ? 'Saving...' : selected ? 'Continue to booking' : current ? `Switch to ${plan.name}` : `Choose ${plan.name}`}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {current ? (
          <TouchableOpacity style={styles.removeBtn} onPress={() => { void remove(); }} disabled={busy != null}>
            <Text style={styles.removeText}>{busy === 'remove' ? 'Removing...' : 'Remove plan'}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      <StackFooterBar navigation={navigation} active="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  header: { backgroundColor: '#061E47', paddingHorizontal: 16, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 36 },
  back: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginLeft: -6 },
  headerTitle: { flex: 1, color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandUni: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  brandMentor: { color: '#FBBF24', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#C9D4EA', fontSize: 13, lineHeight: 18, marginTop: 8 },
  body: { padding: 16, paddingBottom: 28 },
  error: { color: '#A63838', fontWeight: '700', marginBottom: 10 },
  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FBBF24',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  currentText: { color: '#061E47', fontWeight: '800', flex: 1 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E9F2',
    padding: 14,
    marginBottom: 12,
  },
  cardOn: { borderColor: '#FBBF24', borderWidth: 2, backgroundColor: '#FFFDF6' },
  cardPro: {},
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapOn: { backgroundColor: '#FBBF24' },
  planName: { color: '#061E47', fontSize: 17, fontWeight: '800' },
  tagline: { color: '#66758C', fontSize: 12, marginTop: 2 },
  popular: {
    backgroundColor: '#FBBF24',
    color: '#061E47',
    fontWeight: '800',
    fontSize: 11,
    overflow: 'hidden',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  price: { color: '#061E47', fontSize: 22, fontWeight: '800', marginTop: 12 },
  period: { color: '#66758C', fontSize: 13, fontWeight: '700' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  feature: { color: '#0B1F4C', fontSize: 13, fontWeight: '600' },
  chooseBtn: {
    marginTop: 14,
    backgroundColor: '#061E47',
    borderRadius: 12,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseBtnOn: { backgroundColor: '#FBBF24' },
  chooseText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  chooseTextOn: { color: '#061E47' },
  removeBtn: { alignItems: 'center', paddingVertical: 8 },
  removeText: { color: '#B45309', fontWeight: '800' },
});

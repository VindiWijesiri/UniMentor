import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../domain/stores/authStore';
import { tutorPortalRepository, type AppNotice } from '../../../data/repositories/tutorPortalRepository';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorOrange, tutorPage } from '../tutor/theme';

type Props = BottomTabScreenProps<AppTabParamList, 'Alerts'>;

export default function AlertsScreen({ navigation }: Props) {
  const role = useAuthStore((state) => state.user?.role);
  const isMentor = role === 'mentor';
  const stack = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
  const [items, setItems] = useState<AppNotice[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    tutorPortalRepository.notices()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const open = async (item: AppNotice) => {
    if (!item.read) {
      tutorPortalRepository.markRead(item._id).catch(() => {});
      setItems((current) => current.map((notice) => notice._id === item._id ? { ...notice, read: true } : notice));
    }
    if (item.kind === 'booking') {
      navigation.navigate('Sessions');
      return;
    }
    if (item.kind === 'review' && isMentor) {
      stack?.navigate('TutorReviews');
      return;
    }
    if (item.kind === 'payment') {
      stack?.navigate('TutorPayments');
      return;
    }
    if (item.kind === 'session' && item.refId) {
      stack?.navigate('LiveSession', { id: item.refId, title: item.title });
      return;
    }
    if (item.kind === 'grade' && !isMentor) {
      stack?.navigate('Assessments');
    }
  };

  return (
    <View style={styles.page}>
      <PageHeader title={isMentor ? 'Tutor Alerts' : 'Alerts'} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? <ActivityIndicator color={tutorNavy} /> : null}
        {!loading && items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>
              {isMentor
                ? 'Booking requests, reviews, and live sessions show up here.'
                : 'Booking updates, tutor replies, and released grades show up here.'}
            </Text>
          </View>
        ) : null}
        {items.map((item) => (
          <TouchableOpacity key={item._id} style={[styles.card, !item.read && styles.unread]} onPress={() => open(item)}>
            <Text style={styles.kicker}>{item.kind}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  scroll: { padding: 16, paddingBottom: 28, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle: { color: tutorNavy, fontSize: 16, fontWeight: '800' },
  emptyText: { color: tutorMuted, fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 18 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: tutorLine, padding: 14, marginBottom: 10 },
  unread: { borderColor: tutorOrange },
  kicker: { color: tutorOrange, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: tutorNavy, fontSize: 15, fontWeight: '800', marginTop: 4 },
  body: { color: tutorMuted, fontSize: 13, marginTop: 4, lineHeight: 18 },
});

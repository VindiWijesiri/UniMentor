import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../../domain/stores/authStore';
import { tutorPortalRepository, type PaymentRow } from '../../../data/repositories/tutorPortalRepository';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorPage } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorPayments'>;

function who(row: PaymentRow, isMentor: boolean) {
  const person = isMentor ? row.studentId : row.mentorId;
  return person && typeof person === 'object' ? person.name || (isMentor ? 'Student' : 'Tutor') : (isMentor ? 'Student' : 'Tutor');
}

export default function TutorPaymentsScreen({ navigation }: Props) {
  const isMentor = useAuthStore((state) => state.user?.role) === 'mentor';
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    tutorPortalRepository.payments()
      .then((data) => {
        setTotal(data.totalLkr);
        setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []));

  return (
    <View style={styles.page}>
      <PageHeader title="Payments" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.total}>
          <Text style={styles.totalLabel}>{isMentor ? 'Due from completed sessions' : 'Due for completed sessions'}</Text>
          <Text style={styles.totalValue}>LKR {total.toLocaleString()}</Text>
        </View>
        <Text style={styles.lead}>
          {isMentor
            ? 'A payment is recorded when you mark a booking complete, using your hourly rate and the session length.'
            : 'This is the amount due after a tutor marks your session complete.'}
        </Text>
        {loading ? <ActivityIndicator color={tutorNavy} /> : null}
        {!loading && items.length === 0 ? <Text style={styles.lead}>No completed sessions yet.</Text> : null}
        {items.map((item) => (
          <View key={item._id} style={styles.card}>
            <Text style={styles.title}>{item.subject}</Text>
            <Text style={styles.meta}>{who(item, isMentor)} · {item.hours}h · {item.status}</Text>
            <Text style={styles.amount}>LKR {item.amountLkr.toLocaleString()}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  scroll: { padding: 16, paddingBottom: 28 },
  total: { backgroundColor: tutorNavy, borderRadius: 18, padding: 16, marginBottom: 12 },
  totalLabel: { color: '#D5E3F6', fontSize: 12 },
  totalValue: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  lead: { color: tutorMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: tutorLine, padding: 14, marginBottom: 10 },
  title: { color: tutorNavy, fontWeight: '800', fontSize: 15 },
  meta: { color: tutorMuted, fontSize: 12, marginTop: 4 },
  amount: { color: tutorNavy, fontWeight: '800', marginTop: 8 },
});

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { reviewRepository } from '../../../data/repositories/reviewRepository';
import type { Review } from '../../../domain/entities/Review';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import PageHeader from '../../components/PageHeader';
import { tutorLine, tutorMuted, tutorNavy, tutorOrange, tutorPage } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorReviews'>;

export default function TutorReviewsScreen({ navigation }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    reviewRepository.inbox()
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const send = async (review: Review) => {
    const reply = (drafts[review._id] || '').trim();
    if (!reply) return;
    try {
      await reviewRepository.reply(review._id, reply);
      setDrafts((current) => ({ ...current, [review._id]: '' }));
      load();
    } catch {
      Alert.alert('Could not send the reply.');
    }
  };

  return (
    <View style={styles.page}>
      <PageHeader title="Reviews" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.lead}>Student reviews update your public rating. A reply is shown with the review.</Text>
        {loading ? <ActivityIndicator color={tutorNavy} /> : null}
        {!loading && reviews.length === 0 ? <Text style={styles.lead}>No reviews yet.</Text> : null}
        {reviews.map((review) => (
          <View key={review._id} style={styles.card}>
            <Text style={styles.title}>{review.studentName} · {review.rating}/5</Text>
            <Text style={styles.meta}>{review.comment}</Text>
            {review.reply ? <Text style={styles.reply}>You replied: {review.reply}</Text> : (
              <>
                <TextInput
                  value={drafts[review._id] || ''}
                  onChangeText={(value) => setDrafts((current) => ({ ...current, [review._id]: value }))}
                  placeholder="Write a public reply"
                  placeholderTextColor={tutorMuted}
                  style={styles.input}
                />
                <TouchableOpacity style={styles.primary} onPress={() => send(review)}>
                  <Text style={styles.primaryText}>Reply</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: tutorPage },
  scroll: { padding: 16, paddingBottom: 28 },
  lead: { color: tutorMuted, fontSize: 13, lineHeight: 18, marginBottom: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 18, borderWidth: 1, borderColor: tutorLine, padding: 14, marginBottom: 10 },
  title: { color: tutorNavy, fontWeight: '800', fontSize: 15 },
  meta: { color: '#334155', fontSize: 13, marginTop: 6, lineHeight: 18 },
  reply: { color: tutorNavy, fontSize: 13, marginTop: 8 },
  input: { marginTop: 10, borderWidth: 1, borderColor: tutorLine, borderRadius: 12, paddingHorizontal: 12, minHeight: 44, color: tutorNavy },
  primary: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: tutorOrange, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  primaryText: { color: tutorNavy, fontWeight: '800' },
});

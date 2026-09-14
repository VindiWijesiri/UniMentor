import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reviewRepository } from '../../../data/repositories/reviewRepository';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'WriteReview'>;

const ratingLabels = ['', 'Needs improvement', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function WriteReviewScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { mentor } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async () => {
    if (!rating) {
      Alert.alert('Rating required', 'Please choose a star rating.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Review required', 'Please write a short review.');
      return;
    }

    setSubmitting(true);
    try {
      await reviewRepository.save(mentor._id, rating, comment.trim());
      Alert.alert('Review submitted', 'Thank you for helping other students choose a tutor.', [
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      let message = 'Could not submit your review. Please try again.';
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          message = 'Cannot reach the server. Check that the backend is running and your phone is on the same network.';
        } else if (error.response.status === 401) {
          message = 'Your login has expired. Please sign in again.';
        } else if (error.response.status === 403) {
          message = 'Only student accounts can submit reviews.';
        } else {
          message = error.response.data?.message || message;
        }
      }
      Alert.alert('Submission failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 18) + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <Text style={styles.eyebrow}>STUDENT REVIEW</Text>
          <Text style={styles.title}>Share your experience</Text>
          <Text style={styles.subtitle}>Your feedback helps students make a confident choice.</Text>
        </View>

        <View style={styles.tutorCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{mentor.name.charAt(0).toUpperCase()}</Text></View>
          <View style={styles.tutorCopy}>
            <Text style={styles.tutorLabel}>REVIEWING</Text>
            <Text style={styles.tutorName}>{mentor.name}</Text>
            <Text style={styles.tutorSubject} numberOfLines={1}>{mentor.subjects.slice(0, 2).join('  •  ')}</Text>
          </View>
          <View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.stepLabel}>01  RATING</Text>
          <Text style={styles.cardTitle}>How was your session?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <TouchableOpacity key={value} style={styles.starButton} onPress={() => setRating(value)} activeOpacity={0.75}>
                <Text style={[styles.star, value <= rating && styles.starActive]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.ratingLabel, rating > 0 && styles.ratingLabelActive]}>{rating ? ratingLabels[rating] : 'Tap a star to rate'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.reviewHeading}>
            <View>
              <Text style={styles.stepLabel}>02  REVIEW</Text>
              <Text style={styles.cardTitle}>Tell other students</Text>
            </View>
            <Text style={styles.counter}>{comment.length}/500</Text>
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            multiline
            textAlignVertical="top"
            placeholder="What did you like about this tutor?"
            placeholderTextColor="#96A3B8"
            style={styles.reviewInput}
          />
          <View style={styles.tipRow}>
            <View style={styles.tipIcon}><Text style={styles.tipIconText}>i</Text></View>
            <Text style={styles.tipText}>Keep your feedback respectful and relevant.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={() => void submitReview()}
          disabled={submitting}
          activeOpacity={0.86}
        >
          {submitting ? <ActivityIndicator color="#061F5C" /> : (
            <><Text style={styles.submitText}>Submit Review</Text><Text style={styles.submitArrow}>→</Text></>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const navy = '#061F5C';
const royal = '#0A4AAB';
const yellow = '#FFD21C';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FC' },
  content: { paddingHorizontal: 16 },
  hero: { marginHorizontal: -16, backgroundColor: navy, paddingHorizontal: 20, paddingTop: 25, paddingBottom: 55, overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: royal, right: -90, top: -110, opacity: 0.58 },
  eyebrow: { color: yellow, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#FFF', fontSize: 25, fontWeight: '900', marginTop: 6, letterSpacing: -0.4 },
  subtitle: { color: '#CAD8ED', fontSize: 12.5, lineHeight: 18, maxWidth: 300, marginTop: 5 },
  tutorCard: { minHeight: 76, marginTop: -34, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2EAF4', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', shadowColor: '#173B69', shadowOpacity: 0.11, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  avatar: { width: 49, height: 49, borderRadius: 16, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarText: { color: navy, fontSize: 21, fontWeight: '900' },
  tutorCopy: { flex: 1, minWidth: 0 },
  tutorLabel: { color: '#8A98AE', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  tutorName: { color: navy, fontSize: 15.5, fontWeight: '900', marginTop: 2 },
  tutorSubject: { color: '#6D7E99', fontSize: 10.5, marginTop: 3 },
  verified: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center' },
  verifiedText: { color: royal, fontSize: 14, fontWeight: '900' },
  card: { backgroundColor: '#FFF', borderRadius: 19, borderWidth: 1, borderColor: '#E3EAF4', padding: 16, marginTop: 13, shadowColor: '#1D3D66', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  stepLabel: { color: royal, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { color: navy, fontSize: 17, fontWeight: '900', marginTop: 4 },
  starsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 17, paddingHorizontal: 5 },
  starButton: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#F3F6FA', alignItems: 'center', justifyContent: 'center' },
  star: { color: '#D4DCE8', fontSize: 29 },
  starActive: { color: '#FFBF00' },
  ratingLabel: { color: '#8996AA', fontSize: 11.5, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  ratingLabelActive: { color: '#9A6A00', fontWeight: '900' },
  reviewHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  counter: { color: '#929FB3', fontSize: 10.5, fontWeight: '700' },
  reviewInput: { minHeight: 135, borderRadius: 14, backgroundColor: '#F7F9FC', borderWidth: 1, borderColor: '#DDE5F0', color: '#263A5C', fontSize: 13.5, lineHeight: 20, padding: 13, marginTop: 14 },
  tipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  tipIcon: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  tipIconText: { color: royal, fontSize: 11, fontWeight: '900' },
  tipText: { color: '#7B899F', fontSize: 10.5 },
  submitButton: { height: 53, borderRadius: 15, backgroundColor: yellow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, shadowColor: '#D4A300', shadowOpacity: 0.24, shadowRadius: 9, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  submitButtonDisabled: { opacity: 0.65 },
  submitText: { color: navy, fontSize: 15.5, fontWeight: '900' },
  submitArrow: { color: navy, fontSize: 21, fontWeight: '900', marginLeft: 11 },
});

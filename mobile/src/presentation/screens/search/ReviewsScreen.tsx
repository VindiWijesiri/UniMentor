import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { mentorRepository } from '../../../data/repositories/mentorRepository';
import type { Mentor } from '../../../domain/entities/Mentor';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Reviews'>;

export default function ReviewsScreen({ navigation }: Props) {
  const [tutors, setTutors] = useState<Mentor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    mentorRepository.search('')
      .then((results) => {
        if (active) {
          setTutors(results.filter((tutor) => {
            const normalizedName = tutor.name.trim().toLowerCase();
            const normalizedEmail = tutor.email.trim().toLowerCase();
            return normalizedName !== 'demo mentor' && !normalizedEmail.startsWith('demo@');
          }));
        }
      })
      .catch(() => {
        if (active) setError('Could not load tutors. Check your connection and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleTutors = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return tutors;
    return tutors.filter((tutor) => [tutor.name, ...tutor.subjects]
      .some((item) => item.toLowerCase().includes(value)));
  }, [query, tutors]);

  const writeReview = (mentor: Mentor) => navigation
    .getParent<NativeStackNavigationProp<AppStackParamList>>()
    ?.navigate('WriteReview', { mentor });

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Text style={styles.eyebrow}>STUDENT FEEDBACK</Text>
        <Text style={styles.title}>Review a Tutor</Text>
        <Text style={styles.subtitle}>Choose a tutor and share your learning experience.</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Search tutor or module"
            placeholderTextColor="#8997AF"
          />
        </View>
      </View>

      <FlatList
        data={visibleTutors}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={(
          <View style={styles.listHeading}>
            <Text style={styles.listTitle}>Select a tutor</Text>
            {!loading && !error && <Text style={styles.resultCount}>{visibleTutors.length} tutors</Text>}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.tutorCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text></View>
            <View style={styles.tutorCopy}>
              <Text style={styles.tutorName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.modules} numberOfLines={1}>{item.subjects.slice(0, 2).join('  •  ')}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.star}>★</Text>
                <Text style={styles.rating}>{item.rating ? item.rating.toFixed(1) : 'New'}</Text>
                <Text style={styles.reviewCount}>  •  {item.reviewCount ?? 0} reviews</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.reviewButton} onPress={() => writeReview(item)} activeOpacity={0.82}>
              <Text style={styles.reviewButtonText}>Review</Text>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={loading ? (
          <View style={styles.stateCard}><ActivityIndicator color="#062B67" /><Text style={styles.stateText}>Loading tutors...</Text></View>
        ) : (
          <View style={styles.stateCard}>
            <Text style={styles.emptyIcon}>★</Text>
            <Text style={styles.emptyTitle}>{error ? 'Unable to load tutors' : 'No tutors found'}</Text>
            <Text style={styles.stateText}>{error || 'Try a different name or module.'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const navy = '#061F5C';
const royal = '#0A4AAB';
const yellow = '#FFD21C';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FC' },
  hero: { backgroundColor: navy, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 25, overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -95, top: -115, backgroundColor: royal, opacity: 0.56 },
  eyebrow: { color: yellow, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: '#FFF', fontSize: 26, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#CAD8ED', fontSize: 12.5, marginTop: 4 },
  searchBox: { height: 50, borderRadius: 15, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, marginTop: 17 },
  searchIcon: { color: royal, fontSize: 25, fontWeight: '900', marginRight: 8 },
  searchInput: { flex: 1, color: navy, fontSize: 13.5, paddingVertical: 0 },
  listContent: { paddingHorizontal: 15, paddingTop: 17, paddingBottom: 28 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  listTitle: { color: navy, fontSize: 18, fontWeight: '900' },
  resultCount: { color: '#7B8AA4', fontSize: 11 },
  tutorCard: { minHeight: 88, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2EAF4', padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#1D3D66', shadowOpacity: 0.06, shadowRadius: 9, elevation: 2 },
  avatar: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarText: { color: navy, fontSize: 22, fontWeight: '900' },
  tutorCopy: { flex: 1, minWidth: 0 },
  tutorName: { color: navy, fontSize: 15, fontWeight: '900' },
  modules: { color: '#71819B', fontSize: 10.5, marginTop: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  star: { color: '#FFB700', fontSize: 12 },
  rating: { color: '#2B3F62', fontSize: 11, fontWeight: '900', marginLeft: 3 },
  reviewCount: { color: '#8794A9', fontSize: 9.5 },
  reviewButton: { height: 38, borderRadius: 12, backgroundColor: navy, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  reviewButtonText: { color: '#FFF', fontSize: 10.5, fontWeight: '900' },
  arrow: { color: yellow, fontSize: 16, fontWeight: '900', marginLeft: 5 },
  stateCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 28, alignItems: 'center' },
  emptyIcon: { color: '#C9D3E1', fontSize: 30 },
  emptyTitle: { color: navy, fontSize: 15, fontWeight: '900', marginTop: 7 },
  stateText: { color: '#7C8AA1', fontSize: 11.5, textAlign: 'center', marginTop: 7, lineHeight: 17 },
});

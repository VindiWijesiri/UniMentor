import React, { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'RecommendedTutor'>;

export default function RecommendedTutorScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { mentor, reviews, comparedCount, isBestMatch } = route.params;

  const summary = useMemo(() => {
    const rating = reviews.length
      ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
      : mentor.rating ?? 0;
    const reviewCount = reviews.length || mentor.reviewCount || 0;
    const positive = reviews.length
      ? Math.round((reviews.filter(({ rating: value }) => value >= 4).length / reviews.length) * 100)
      : rating >= 4 ? 100 : 0;
    return { rating, reviewCount, positive };
  }, [mentor.rating, mentor.reviewCount, reviews]);

  const latestReview = reviews[0];

  const startChat = () => {
    if (!/^[a-f\d]{24}$/i.test(mentor._id)) {
      Alert.alert(
        'Select a registered tutor',
        'This tutor profile is no longer available. Please return to Find Tutors and select a registered tutor.',
        [{ text: 'Find Tutors', onPress: () => navigation.navigate('MainTabs', { screen: 'Search' }) }],
      );
      return;
    }
    navigation.navigate('Chat', { mentor });
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 92 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Recommendation</Text>
              <Text style={styles.headerSubtitle}>Based on student feedback</Text>
            </View>
            <View style={styles.stepBadge}><Text style={styles.stepText}>STEP 3</Text></View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{mentor.name.charAt(0).toUpperCase()}</Text></View>
            <View style={styles.profileCopy}>
              <View style={styles.matchBadge}>
                <Text style={styles.matchBadgeText}>{isBestMatch ? '★ BEST MATCH' : 'YOUR CHOICE'}</Text>
              </View>
              <Text style={styles.mentorName} numberOfLines={1}>{mentor.name}</Text>
              <Text style={styles.mentorMeta}>Compared with {Math.max(comparedCount - 1, 1)} other tutor{comparedCount > 2 ? 's' : ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.sectionEyebrow}>WHY THIS TUTOR?</Text>
          <Text style={styles.title}>A strong match for you</Text>
          <Text style={styles.subtitle}>The recommendation uses verified student reviews and tutor details.</Text>

          <View style={styles.scoreGrid}>
            <View style={styles.scoreCard}>
              <View style={styles.scoreIcon}><Text style={styles.scoreIconText}>★</Text></View>
              <Text style={styles.scoreValue}>{summary.rating ? summary.rating.toFixed(1) : 'New'}</Text>
              <Text style={styles.scoreLabel}>Student rating</Text>
            </View>
            <View style={styles.scoreCard}>
              <View style={styles.scoreIcon}><Text style={styles.scoreIconText}>%</Text></View>
              <Text style={styles.scoreValue}>{summary.reviewCount ? `${summary.positive}%` : '—'}</Text>
              <Text style={styles.scoreLabel}>Positive reviews</Text>
            </View>
            <View style={styles.scoreCard}>
              <View style={styles.scoreIcon}><Text style={styles.scoreIconText}>R</Text></View>
              <Text style={styles.scoreValue}>{summary.reviewCount}</Text>
              <Text style={styles.scoreLabel}>Reviews</Text>
            </View>
          </View>

          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <View style={styles.reasonNumber}><Text style={styles.reasonNumberText}>01</Text></View>
              <View>
                <Text style={styles.reasonTitle}>Student-approved support</Text>
                <Text style={styles.reasonSubtitle}>Feedback from previous learners</Text>
              </View>
            </View>
            <Text style={styles.reasonText}>
              {summary.reviewCount
                ? `${summary.positive}% of submitted reviews rated this tutor 4 stars or higher.`
                : 'This tutor has a strong profile rating. New student reviews will improve the recommendation confidence.'}
            </Text>
          </View>

          <View style={styles.reasonCard}>
            <View style={styles.reasonHeader}>
              <View style={styles.reasonNumber}><Text style={styles.reasonNumberText}>02</Text></View>
              <View>
                <Text style={styles.reasonTitle}>Good academic fit</Text>
                <Text style={styles.reasonSubtitle}>Relevant module coverage</Text>
              </View>
            </View>
            <View style={styles.tags}>
              {mentor.subjects.slice(0, 3).map((subject) => (
                <View key={subject} style={styles.tag}><Text style={styles.tagText}>{subject}</Text></View>
              ))}
            </View>
          </View>

          <View style={styles.valueCard}>
            <View>
              <Text style={styles.valueLabel}>HOURLY RATE</Text>
              <Text style={styles.valuePrice}>LKR {(mentor.hourlyRate ?? 1500).toLocaleString()} <Text style={styles.valueUnit}>/ hour</Text></Text>
            </View>
            <View style={styles.valueDivider} />
            <View style={styles.valueRight}>
              <Text style={styles.valueLabel}>EXPERIENCE</Text>
              <Text style={styles.valueExperience} numberOfLines={2}>{mentor.experience ?? 'Verified tutor'}</Text>
            </View>
          </View>

          {latestReview && (
            <View style={styles.quoteCard}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.quoteText} numberOfLines={3}>{latestReview.comment}</Text>
              <Text style={styles.quoteAuthor}>— {latestReview.studentName}, student review</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={startChat}
          activeOpacity={0.86}
        >
          <View>
            <Text style={styles.confirmLabel}>START CHAT WITH</Text>
            <Text style={styles.confirmText}>{mentor.name}</Text>
          </View>
          <Text style={styles.confirmArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const navy = '#061F5C';
const royal = '#0A57CB';
const yellow = '#FFD21C';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FC' },
  hero: { minHeight: 244, backgroundColor: navy, paddingHorizontal: 17, paddingBottom: 28, overflow: 'hidden' },
  heroOrbLarge: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: royal, right: -90, top: -110, opacity: 0.62 },
  heroOrbSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#1267D5', left: -48, bottom: 8, opacity: 0.4 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,255,255,0.23)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFF', fontSize: 34, lineHeight: 35, marginTop: -3 },
  headerCopy: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#FFF', fontSize: 21, fontWeight: '900' },
  headerSubtitle: { color: '#BFCFE7', fontSize: 10.5, marginTop: 2 },
  stepBadge: { borderRadius: 12, backgroundColor: 'rgba(255,210,28,0.16)', paddingHorizontal: 10, paddingVertical: 6 },
  stepText: { color: yellow, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  profileCard: { minHeight: 106, borderRadius: 20, backgroundColor: '#FFF', padding: 13, marginTop: 21, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, elevation: 5 },
  avatar: { width: 72, height: 72, borderRadius: 23, backgroundColor: '#FFF3BC', borderWidth: 2, borderColor: '#E8D46F', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  avatarText: { color: navy, fontSize: 29, fontWeight: '900' },
  profileCopy: { flex: 1, minWidth: 0 },
  matchBadge: { alignSelf: 'flex-start', borderRadius: 9, backgroundColor: yellow, paddingHorizontal: 8, paddingVertical: 4 },
  matchBadgeText: { color: navy, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
  mentorName: { color: navy, fontSize: 19, fontWeight: '900', marginTop: 7 },
  mentorMeta: { color: '#72819A', fontSize: 10.5, marginTop: 3 },
  body: { paddingHorizontal: 16, paddingTop: 18 },
  sectionEyebrow: { color: royal, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: navy, fontSize: 23, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#71819A', fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  scoreGrid: { flexDirection: 'row', gap: 8, marginTop: 15 },
  scoreCard: { flex: 1, minHeight: 107, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E9F3', alignItems: 'center', justifyContent: 'center' },
  scoreIcon: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center' },
  scoreIconText: { color: '#9A6A00', fontSize: 13, fontWeight: '900' },
  scoreValue: { color: navy, fontSize: 18, fontWeight: '900', marginTop: 6 },
  scoreLabel: { color: '#7A899F', fontSize: 8.5, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  reasonCard: { borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2EAF4', padding: 15, marginTop: 11 },
  reasonHeader: { flexDirection: 'row', alignItems: 'center' },
  reasonNumber: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  reasonNumberText: { color: royal, fontSize: 11, fontWeight: '900' },
  reasonTitle: { color: navy, fontSize: 14, fontWeight: '900' },
  reasonSubtitle: { color: '#8491A6', fontSize: 9.5, marginTop: 2 },
  reasonText: { color: '#5C6D87', fontSize: 11.5, lineHeight: 18, marginTop: 11 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tag: { borderRadius: 11, backgroundColor: '#EDF4FF', paddingHorizontal: 10, paddingVertical: 7 },
  tagText: { color: '#285B97', fontSize: 10, fontWeight: '800' },
  valueCard: { minHeight: 78, borderRadius: 18, backgroundColor: '#FFF8D8', borderWidth: 1, borderColor: '#F0DA78', paddingHorizontal: 15, marginTop: 11, flexDirection: 'row', alignItems: 'center' },
  valueLabel: { color: '#8A6A00', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  valuePrice: { color: navy, fontSize: 16, fontWeight: '900', marginTop: 4 },
  valueUnit: { color: '#7A6B3A', fontSize: 9, fontWeight: '600' },
  valueDivider: { width: 1, height: 42, backgroundColor: '#E2CA68', marginHorizontal: 17 },
  valueRight: { flex: 1 },
  valueExperience: { color: navy, fontSize: 11.5, lineHeight: 15, fontWeight: '800', marginTop: 4 },
  quoteCard: { borderRadius: 18, backgroundColor: navy, padding: 16, marginTop: 11 },
  quoteMark: { color: yellow, fontSize: 28, lineHeight: 22, fontWeight: '900' },
  quoteText: { color: '#FFF', fontSize: 11.5, lineHeight: 18, fontStyle: 'italic', marginTop: 3 },
  quoteAuthor: { color: '#BFCFE7', fontSize: 9.5, fontWeight: '700', marginTop: 9 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFF', paddingHorizontal: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E8F2' },
  confirmButton: { minHeight: 56, borderRadius: 15, backgroundColor: yellow, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#D1A100', shadowOpacity: 0.24, shadowRadius: 8, elevation: 4 },
  confirmLabel: { color: '#806300', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  confirmText: { color: navy, fontSize: 14, fontWeight: '900', marginTop: 2 },
  confirmArrow: { color: navy, fontSize: 24, fontWeight: '900' },
});

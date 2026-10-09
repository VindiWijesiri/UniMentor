import React, { useMemo } from 'react';
import { Alert, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { getMentorRate } from './SearchScreen';

type Props = NativeStackScreenProps<AppStackParamList, 'RecommendedTutor'>;

export default function RecommendedTutorScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
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
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftRow}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recommendation</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 92 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.stepRow}>
            <Text style={styles.headerSubtitle}>Based on verified student feedback</Text>
            <View style={styles.stepBadge}><Text style={styles.stepText}>STEP 3</Text></View>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{mentor.name.charAt(0).toUpperCase()}</Text></View>
            <View style={styles.profileCopy}>
              <View style={styles.matchBadge}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {isBestMatch && <Ionicons name="star" size={10} color="#061E47" style={{ marginRight: 3 }} />}
                  <Text style={styles.matchBadgeText}>{isBestMatch ? 'BEST MATCH' : 'YOUR CHOICE'}</Text>
                </View>
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
              <View style={styles.scoreIcon}>
                <Ionicons name="star" size={14} color="#D97706" />
              </View>
              <Text style={styles.scoreValue}>{summary.rating ? summary.rating.toFixed(1) : 'New'}</Text>
              <Text style={styles.scoreLabel}>Student rating</Text>
            </View>
            <View style={styles.scoreCard}>
              <View style={styles.scoreIcon}>
                <Ionicons name="thumbs-up" size={13} color="#D97706" />
              </View>
              <Text style={styles.scoreValue}>{summary.reviewCount ? `${summary.positive}%` : '—'}</Text>
              <Text style={styles.scoreLabel}>Positive reviews</Text>
            </View>
            <View style={styles.scoreCard}>
              <View style={styles.scoreIcon}>
                <Ionicons name="chatbubbles-outline" size={14} color="#D97706" />
              </View>
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
              <Text style={styles.valuePrice}>LKR {getMentorRate(mentor).toLocaleString()} <Text style={styles.valueUnit}>/ hour</Text></Text>
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
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const navy = '#061E47';
const navyCard = '#0B2754';
const amber = '#FBBF24';
const gold = '#FBBF24';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
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
  },
  headerBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: -6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.2,
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
    color: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
  },
  hero: { minHeight: 180, backgroundColor: navy, paddingHorizontal: 17, paddingTop: 16, paddingBottom: 24, overflow: 'hidden' },
  heroOrbLarge: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: navyCard, right: -90, top: -110, opacity: 0.65 },
  heroOrbSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: '#0D3875', left: -48, bottom: 8, opacity: 0.4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSubtitle: { color: '#BFCFE7', fontSize: 12, fontWeight: '500' },
  stepBadge: { borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 6 },
  stepText: { color: gold, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  profileCard: { minHeight: 106, borderRadius: 20, backgroundColor: '#FFF', padding: 13, marginTop: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, elevation: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  avatar: { width: 72, height: 72, borderRadius: 23, backgroundColor: '#EEF2F8', borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  avatarText: { color: navy, fontSize: 29, fontWeight: '900' },
  profileCopy: { flex: 1, minWidth: 0 },
  matchBadge: { alignSelf: 'flex-start', borderRadius: 9, backgroundColor: amber, paddingHorizontal: 8, paddingVertical: 4 },
  matchBadgeText: { color: '#FFF', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5 },
  mentorName: { color: navy, fontSize: 19, fontWeight: '900', marginTop: 7 },
  mentorMeta: { color: '#72819A', fontSize: 10.5, marginTop: 3 },
  body: { paddingHorizontal: 16, paddingTop: 18 },
  sectionEyebrow: { color: '#64748B', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: navy, fontSize: 23, fontWeight: '900', marginTop: 4 },
  subtitle: { color: '#71819A', fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  scoreGrid: { flexDirection: 'row', gap: 8, marginTop: 15 },
  scoreCard: { flex: 1, minHeight: 107, borderRadius: 17, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  scoreIcon: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  scoreIconText: { color: amber, fontSize: 13, fontWeight: '900' },
  scoreValue: { color: navy, fontSize: 18, fontWeight: '900', marginTop: 6 },
  scoreLabel: { color: '#7A899F', fontSize: 8.5, fontWeight: '700', marginTop: 2, textAlign: 'center' },
  reasonCard: { borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', padding: 15, marginTop: 11 },
  reasonHeader: { flexDirection: 'row', alignItems: 'center' },
  reasonNumber: { width: 37, height: 37, borderRadius: 12, backgroundColor: '#EEF2F8', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  reasonNumberText: { color: navy, fontSize: 11, fontWeight: '900' },
  reasonTitle: { color: navy, fontSize: 14, fontWeight: '900' },
  reasonSubtitle: { color: '#8491A6', fontSize: 9.5, marginTop: 2 },
  reasonText: { color: '#5C6D87', fontSize: 11.5, lineHeight: 18, marginTop: 11 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  tag: { borderRadius: 11, backgroundColor: '#EEF2F8', paddingHorizontal: 10, paddingVertical: 7 },
  tagText: { color: navy, fontSize: 10, fontWeight: '800' },
  valueCard: { minHeight: 78, borderRadius: 18, backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 15, marginTop: 11, flexDirection: 'row', alignItems: 'center' },
  valueLabel: { color: '#D97706', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  valuePrice: { color: navy, fontSize: 16, fontWeight: '900', marginTop: 4 },
  valueUnit: { color: '#7A6B3A', fontSize: 9, fontWeight: '600' },
  valueDivider: { width: 1, height: 42, backgroundColor: '#FDE68A', marginHorizontal: 17 },
  valueRight: { flex: 1 },
  valueExperience: { color: navy, fontSize: 11.5, lineHeight: 15, fontWeight: '800', marginTop: 4 },
  quoteCard: { borderRadius: 18, backgroundColor: navyCard, padding: 16, marginTop: 11 },
  quoteMark: { color: gold, fontSize: 28, lineHeight: 22, fontWeight: '900' },
  quoteText: { color: '#FFF', fontSize: 11.5, lineHeight: 18, fontStyle: 'italic', marginTop: 3 },
  quoteAuthor: { color: '#BFCFE7', fontSize: 9.5, fontWeight: '700', marginTop: 9 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFF', paddingHorizontal: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  confirmButton: { minHeight: 56, borderRadius: 15, backgroundColor: amber, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: amber, shadowOpacity: 0.24, shadowRadius: 8, elevation: 4 },
  confirmLabel: { color: 'rgba(6,30,71,0.75)', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  confirmText: { color: navy, fontSize: 14, fontWeight: '900', marginTop: 2 },
  confirmArrow: { color: navy, fontSize: 24, fontWeight: '900' },
});

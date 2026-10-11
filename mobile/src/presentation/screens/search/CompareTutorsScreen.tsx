/**
 * ============================================================================
 * @file CompareTutorsScreen.tsx
 * @module AcademicSupport / Tutor Discovery & Comparison
 * @author Nethmi Weherawatta (UniMentor Academic Module)
 * @description
 * Side-by-side comparative analysis dashboard for evaluated tutors.
 * Enables students to select up to 3 peer mentors and compare their:
 * - Verified average ratings and review counts from real students
 * - Hourly tutoring rates in
 * - Academic subject specializations
 * - Average response times and session formats (Individual vs Group)
 * - Algorithmically computes a "Best Match" tutor score based on rating and volume
 * ============================================================================
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { reviewRepository } from '../../../data/repositories/reviewRepository';
import type { Mentor } from '../../../domain/entities/Mentor';
import type { Review } from '../../../domain/entities/Review';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { getMentorRate } from './SearchScreen';

type Props = NativeStackScreenProps<AppStackParamList, 'CompareTutors'>;
type ReviewMap = Record<string, Review[]>;

const LABEL_WIDTH = 78;

/**
 * Computes average rating and review count from fetched student reviews.
 * Falls back to mentor's baseline ratings if review history is not yet populated.
 * @param mentor - Target mentor entity
 * @param reviews - Array of review records
 * @returns Average rating number and total count
 */
function reviewSummary(mentor: Mentor, reviews: Review[]) {
  if (reviews.length > 0) {
    return {
      rating: reviews.reduce((total, review) => total + review.rating, 0) / reviews.length,
      count: reviews.length,
    };
  }
  return { rating: mentor.rating ?? 0, count: mentor.reviewCount ?? 0 };
}

/**
 * Reusable matrix comparison row rendering an attribute label and columns for each tutor
 */
function DetailRow({
  label,
  icon,
  values,
  tall = false,
  selectedIndex,
  bestIndex,
  alternate = false,
  columnWidth,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  values: React.ReactNode[];
  tall?: boolean;
  selectedIndex: number;
  bestIndex: number;
  alternate?: boolean;
  columnWidth: number;
}) {
  return (
    <View style={[styles.detailRow, tall && styles.detailRowTall, alternate && styles.alternateRow]}>
      <View style={[styles.labelCell, alternate && styles.alternateLabelCell]}>
        <View style={styles.rowIconBox}>
          <Ionicons name={icon} size={12} color="#0B2754" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {values.map((value, index) => (
        <View
          key={index}
          style={[
            styles.valueCell,
            { width: columnWidth },
            index === bestIndex && styles.bestValueCell,
            index === selectedIndex && styles.selectedValueCell,
          ]}
        >
          {value}
        </View>
      ))}
    </View>
  );
}

/**
 * Main comparative screen component for evaluating selected tutors
 */
export default function CompareTutorsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const { width: screenWidth } = useWindowDimensions();
  // Limit comparison to maximum of 3 tutors for clean mobile viewport density
  const mentors = route.params.mentors.slice(0, 3);
  const [reviews, setReviews] = useState<ReviewMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(mentors[0]?._id);

  // Parallel asynchronous fetching of student reviews for each compared mentor
  useEffect(() => {
    let active = true;
    Promise.all(mentors.map(async (mentor) => {
      try {
        return [mentor._id, await reviewRepository.listForTutor(mentor._id)] as const;
      } catch {
        return [mentor._id, []] as const;
      }
    })).then((entries) => {
      if (active) setReviews(Object.fromEntries(entries));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [mentors.map(({ _id }) => _id).join('|')]);

  /**
   * Evaluates and identifies the highest scoring "Best Match" tutor.
   * Scoring formula factors in verified rating weighted with review volume dampening:
   * Score = Rating + min(ReviewCount, 50) / 500
   */
  const bestTutor = useMemo(() => [...mentors].sort((a, b) => {
    const aSummary = reviewSummary(a, reviews[a._id] ?? []);
    const bSummary = reviewSummary(b, reviews[b._id] ?? []);
    const aScore = aSummary.rating + Math.min(aSummary.count, 50) / 500;
    const bScore = bSummary.rating + Math.min(bSummary.count, 50) / 500;
    return bScore - aScore;
  })[0], [mentors, reviews]);

  useEffect(() => {
    if (!loading && bestTutor) setSelectedId(bestTutor._id);
  }, [bestTutor?._id, loading]);

  const selectedTutor = mentors.find(({ _id }) => _id === selectedId) ?? bestTutor;
  const selectedIndex = mentors.findIndex(({ _id }) => _id === selectedId);
  const bestIndex = mentors.findIndex(({ _id }) => _id === bestTutor?._id);
  const tableWidth = screenWidth - 24;
  const columnWidth = (tableWidth - LABEL_WIDTH) / Math.max(mentors.length, 1);

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
            <Text style={styles.headerTitle}>Compare Tutors</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 88 }}>
        <View style={styles.subHeaderWrap}>
          <Text style={styles.belowHeaderSubtitle}>Student reviews • Up to 3 tutors</Text>
          {loading && <ActivityIndicator color="#F59E0B" size="small" />}
        </View>
        <View style={styles.infoBanner}>
          <View style={styles.infoIcon}>
            <Ionicons name="sparkles" size={14} color="#D97706" />
          </View>
          <Text style={styles.infoText}>Best Match is calculated from student ratings and review count.</Text>
        </View>

        <View style={styles.tableHeading}>
          <View>
            <Text style={styles.tableTitle}>Tutor comparison</Text>
            <Text style={styles.tableSubtitle}>Tap a tutor column to select</Text>
          </View>
          <View style={styles.swipePill}><Text style={styles.swipeText}>{mentors.length} tutors</Text></View>
        </View>

        <View style={styles.tableWrap}>
          <View style={[styles.table, { width: tableWidth }]}>
            <View style={styles.mentorHeaderRow}>
              <View style={styles.compareByCell}>
                <Text style={styles.compareByEyebrow}>COMPARE</Text>
                <Text style={styles.compareByText}>Tutor{`\n`}details</Text>
              </View>
              {mentors.map((mentor) => {
                const isBest = mentor._id === bestTutor?._id;
                const selected = mentor._id === selectedId;
                return (
                  <TouchableOpacity
                    key={mentor._id}
                    style={[styles.mentorHeader, { width: columnWidth }, selected && styles.mentorHeaderSelected]}
                    onPress={() => setSelectedId(mentor._id)}
                    activeOpacity={0.82}
                  >
                    {isBest && (
                      <View style={styles.bestBadge}>
                        <Ionicons name="star" size={10} color="#061E47" style={{ marginRight: 2 }} />
                        <Text style={styles.bestBadgeText}>BEST MATCH</Text>
                      </View>
                    )}
                    <View style={[styles.avatar, selected && styles.avatarSelected]}><Text style={styles.avatarText}>{mentor.name.charAt(0)}</Text></View>
                    <Text style={styles.mentorName} numberOfLines={2}>{mentor.name}</Text>
                    <View style={[styles.selectPill, selected && styles.selectPillActive]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {selected && <Ionicons name="checkmark" size={11} color="#FFFFFF" style={{ marginRight: 2 }} />}
                        <Text style={[styles.selectPillText, selected && styles.selectPillTextActive]}>
                          {selected ? 'Selected' : 'Select'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <DetailRow label="Rating" icon="star" columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => {
              const summary = reviewSummary(mentor, reviews[mentor._id] ?? []);
              return (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 2 }} />
                    <Text style={styles.ratingValue}>{summary.rating ? summary.rating.toFixed(1) : 'New'}</Text>
                  </View>
                  <Text style={styles.muted}>({summary.count} reviews)</Text>
                </>
              );
            })} />
            <DetailRow label="Positive" icon="thumbs-up" alternate columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => {
              const tutorReviews = reviews[mentor._id] ?? [];
              const percentage = tutorReviews.length
                ? Math.round((tutorReviews.filter(({ rating }) => rating >= 4).length / tutorReviews.length) * 100)
                : 0;
              return <><Text style={styles.positiveValue}>{tutorReviews.length ? `${percentage}%` : '—'}</Text><Text style={styles.muted}>4–5 star reviews</Text></>;
            })} />
            <DetailRow label="Price" icon="cash-outline" columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => <Text style={styles.priceValue}>LKR {getMentorRate(mentor).toLocaleString()}<Text style={styles.priceUnit}>{`\n`}/ hour</Text></Text>)} />
            <DetailRow label="Experience" icon="briefcase-outline" alternate columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => <Text style={styles.valueText}>{mentor.experience ?? 'Not provided'}</Text>)} />
            <DetailRow label="Modules" icon="book-outline" tall columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => <Text style={styles.valueText}>{mentor.subjects.slice(0, 3).join('\n')}</Text>)} />
            <DetailRow label="Latest Review" icon="chatbubble-ellipses-outline" tall alternate columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => {
              const latest = reviews[mentor._id]?.[0];
              return <Text style={latest ? styles.reviewText : styles.muted}>{latest ? `“${latest.comment}”` : 'No written reviews yet'}</Text>;
            })} />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => selectedTutor && navigation.navigate('RecommendedTutor', {
            mentor: selectedTutor,
            reviews: reviews[selectedTutor._id] ?? [],
            comparedCount: mentors.length,
            isBestMatch: selectedTutor._id === bestTutor?._id,
          })}
          activeOpacity={0.86}
          disabled={!selectedTutor}
        >
          <View>
            <Text style={styles.selectButtonLabel}>SELECTED TUTOR</Text>
            <Text style={styles.selectButtonText}>{selectedTutor?.name ?? 'Select a tutor'}</Text>
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
  subHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  belowHeaderSubtitle: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  infoBanner: { margin: 14, marginBottom: 6, minHeight: 54, borderRadius: 15, backgroundColor: '#FFFDF0', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: amber, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  infoIconText: { color: '#FFF', fontSize: 14 },
  infoText: { flex: 1, color: '#D97706', fontSize: 10.5, lineHeight: 15, fontWeight: '700' },
  tableHeading: { marginHorizontal: 15, marginTop: 11, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tableTitle: { color: navy, fontSize: 18, fontWeight: '900' },
  tableSubtitle: { color: '#75849D', fontSize: 10.5, marginTop: 2 },
  swipePill: { borderRadius: 13, backgroundColor: '#EEF2F8', paddingHorizontal: 10, paddingVertical: 7 },
  swipeText: { color: navy, fontSize: 9.5, fontWeight: '900' },
  tableWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 14, alignItems: 'center' },
  table: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#1B3B66', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  mentorHeaderRow: { minHeight: 176, flexDirection: 'row', backgroundColor: '#FAFCFF', borderBottomWidth: 1, borderBottomColor: '#DDE6F2' },
  compareByCell: { width: LABEL_WIDTH, backgroundColor: '#EEF2F8', paddingHorizontal: 11, justifyContent: 'center' },
  compareByEyebrow: { color: '#64748B', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  compareByText: { color: navy, fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 4 },
  mentorHeader: { paddingHorizontal: 5, paddingTop: 28, paddingBottom: 11, borderLeftWidth: 1, borderLeftColor: '#E2E8F0', alignItems: 'center' },
  mentorHeaderSelected: { backgroundColor: '#EEF2F8' },
  bestBadge: { position: 'absolute', top: 7, borderRadius: 8, backgroundColor: amber, paddingHorizontal: 7, paddingVertical: 3 },
  bestBadgeText: { color: '#FFF', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.4 },
  avatar: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#EEF2F8', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarSelected: { borderColor: amber },
  avatarText: { color: navy, fontSize: 27, fontWeight: '900' },
  mentorName: { color: navy, fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  selectPill: { minWidth: 66, height: 25, borderRadius: 13, borderWidth: 1, borderColor: '#C4CFDD', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  selectPillActive: { backgroundColor: navy, borderColor: navy },
  selectPillText: { color: '#687A96', fontSize: 8.5, fontWeight: '800' },
  selectPillTextActive: { color: '#FFF' },
  detailRow: { minHeight: 76, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  detailRowTall: { minHeight: 104 },
  alternateRow: { backgroundColor: '#FBFCFE' },
  labelCell: { width: LABEL_WIDTH, backgroundColor: '#F8FAFC', paddingHorizontal: 10, justifyContent: 'center' },
  alternateLabelCell: { backgroundColor: '#EEF2F8' },
  rowIconBox: { width: 27, height: 27, borderRadius: 9, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  rowIcon: { color: navy, fontSize: 13, fontWeight: '900' },
  rowLabel: { color: navy, fontSize: 10.5, lineHeight: 13, fontWeight: '900', marginTop: 5 },
  valueCell: { borderLeftWidth: 1, borderLeftColor: '#E2E8F0', paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  bestValueCell: { backgroundColor: '#FFFDF1' },
  selectedValueCell: { backgroundColor: '#EEF2F8', borderLeftColor: '#CBD5E1' },
  ratingValue: { color: navy, fontSize: 13, fontWeight: '900' },
  positiveValue: { color: '#16A34A', fontSize: 14, fontWeight: '900' },
  priceValue: { color: amber, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  priceUnit: { color: '#8190A8', fontSize: 9, fontWeight: '600' },
  valueText: { color: '#263E69', fontSize: 9.5, lineHeight: 13, textAlign: 'center', fontWeight: '600' },
  reviewText: { color: '#52647F', fontSize: 8.5, lineHeight: 12, textAlign: 'center', fontStyle: 'italic' },
  muted: { color: '#8B98AD', fontSize: 8.5, textAlign: 'center', marginTop: 3 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFF', paddingHorizontal: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  selectButton: { minHeight: 55, borderRadius: 15, backgroundColor: amber, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: amber, shadowOpacity: 0.24, shadowRadius: 8, elevation: 4 },
  selectButtonLabel: { color: 'rgba(6,30,71,0.75)', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  selectButtonText: { color: navy, fontSize: 14, fontWeight: '900', marginTop: 2 },
  selectArrow: { color: navy, fontSize: 24, fontWeight: '900' },
});

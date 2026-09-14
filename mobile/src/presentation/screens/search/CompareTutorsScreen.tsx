import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { reviewRepository } from '../../../data/repositories/reviewRepository';
import type { Mentor } from '../../../domain/entities/Mentor';
import type { Review } from '../../../domain/entities/Review';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'CompareTutors'>;
type ReviewMap = Record<string, Review[]>;

const LABEL_WIDTH = 78;

function reviewSummary(mentor: Mentor, reviews: Review[]) {
  if (reviews.length > 0) {
    return {
      rating: reviews.reduce((total, review) => total + review.rating, 0) / reviews.length,
      count: reviews.length,
    };
  }
  return { rating: mentor.rating ?? 0, count: mentor.reviewCount ?? 0 };
}

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
  icon: string;
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
        <View style={styles.rowIconBox}><Text style={styles.rowIcon}>{icon}</Text></View>
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

export default function CompareTutorsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const mentors = route.params.mentors.slice(0, 3);
  const [reviews, setReviews] = useState<ReviewMap>({});
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(mentors[0]?._id);

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
      <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
        <View style={styles.heroOrb} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}><Text style={styles.backText}>‹</Text></TouchableOpacity>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>Compare Tutors</Text>
          <Text style={styles.subtitle}>Student reviews • Up to 3 tutors</Text>
        </View>
        {loading && <ActivityIndicator color="#FFD21C" />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 88 }}>
        <View style={styles.infoBanner}>
          <View style={styles.infoIcon}><Text style={styles.infoIconText}>★</Text></View>
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
                    {isBest && <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>★ BEST MATCH</Text></View>}
                    <View style={[styles.avatar, selected && styles.avatarSelected]}><Text style={styles.avatarText}>{mentor.name.charAt(0)}</Text></View>
                    <Text style={styles.mentorName} numberOfLines={2}>{mentor.name}</Text>
                    <View style={[styles.selectPill, selected && styles.selectPillActive]}>
                      <Text style={[styles.selectPillText, selected && styles.selectPillTextActive]}>{selected ? '✓ Selected' : 'Select'}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <DetailRow label="Rating" icon="★" columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => {
              const summary = reviewSummary(mentor, reviews[mentor._id] ?? []);
              return <><Text style={styles.ratingValue}>★ {summary.rating ? summary.rating.toFixed(1) : 'New'}</Text><Text style={styles.muted}>({summary.count} reviews)</Text></>;
            })} />
            <DetailRow label="Positive" icon="%" alternate columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => {
              const tutorReviews = reviews[mentor._id] ?? [];
              const percentage = tutorReviews.length
                ? Math.round((tutorReviews.filter(({ rating }) => rating >= 4).length / tutorReviews.length) * 100)
                : 0;
              return <><Text style={styles.positiveValue}>{tutorReviews.length ? `${percentage}%` : '—'}</Text><Text style={styles.muted}>4–5 star reviews</Text></>;
            })} />
            <DetailRow label="Price" icon="₨" columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => <Text style={styles.priceValue}>LKR {(mentor.hourlyRate ?? 1500).toLocaleString()}<Text style={styles.priceUnit}>{`\n`}/ hour</Text></Text>)} />
            <DetailRow label="Experience" icon="E" alternate columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => <Text style={styles.valueText}>{mentor.experience ?? 'Not provided'}</Text>)} />
            <DetailRow label="Modules" icon="M" tall columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => <Text style={styles.valueText}>{mentor.subjects.slice(0, 3).join('\n')}</Text>)} />
            <DetailRow label="Latest Review" icon="R" tall alternate columnWidth={columnWidth} selectedIndex={selectedIndex} bestIndex={bestIndex} values={mentors.map((mentor) => {
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
          <Text style={styles.selectArrow}>→</Text>
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
  hero: { minHeight: 112, backgroundColor: navy, paddingHorizontal: 16, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: royal, right: -80, top: -110, opacity: 0.62 },
  backButton: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFF', fontSize: 34, lineHeight: 35, marginTop: -3 },
  heroCopy: { flex: 1, marginLeft: 13 },
  title: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  subtitle: { color: '#C5D4EB', fontSize: 11.5, marginTop: 3 },
  infoBanner: { margin: 14, marginBottom: 6, minHeight: 54, borderRadius: 15, backgroundColor: '#FFF8D8', borderWidth: 1, borderColor: '#F0DB7D', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  infoIconText: { color: navy, fontSize: 14 },
  infoText: { flex: 1, color: '#5D4B12', fontSize: 10.5, lineHeight: 15, fontWeight: '700' },
  tableHeading: { marginHorizontal: 15, marginTop: 11, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tableTitle: { color: navy, fontSize: 18, fontWeight: '900' },
  tableSubtitle: { color: '#75849D', fontSize: 10.5, marginTop: 2 },
  swipePill: { borderRadius: 13, backgroundColor: '#EAF2FF', paddingHorizontal: 10, paddingVertical: 7 },
  swipeText: { color: royal, fontSize: 9.5, fontWeight: '900' },
  tableWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 14, alignItems: 'center' },
  table: { backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#D7E2F0', shadowColor: '#1B3B66', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  mentorHeaderRow: { minHeight: 176, flexDirection: 'row', backgroundColor: '#FAFCFF', borderBottomWidth: 1, borderBottomColor: '#DDE6F2' },
  compareByCell: { width: LABEL_WIDTH, backgroundColor: '#EDF4FC', paddingHorizontal: 11, justifyContent: 'center' },
  compareByEyebrow: { color: royal, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  compareByText: { color: navy, fontSize: 14, lineHeight: 18, fontWeight: '900', marginTop: 4 },
  mentorHeader: { paddingHorizontal: 5, paddingTop: 28, paddingBottom: 11, borderLeftWidth: 1, borderLeftColor: '#E3EAF3', alignItems: 'center' },
  mentorHeaderSelected: { backgroundColor: '#EEF5FF' },
  bestBadge: { position: 'absolute', top: 7, borderRadius: 8, backgroundColor: yellow, paddingHorizontal: 7, paddingVertical: 3 },
  bestBadgeText: { color: navy, fontSize: 7.5, fontWeight: '900', letterSpacing: 0.4 },
  avatar: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#FFF3BC', borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  avatarSelected: { borderColor: royal },
  avatarText: { color: navy, fontSize: 27, fontWeight: '900' },
  mentorName: { color: navy, fontSize: 11, lineHeight: 14, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  selectPill: { minWidth: 66, height: 25, borderRadius: 13, borderWidth: 1, borderColor: '#C4CFDD', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  selectPillActive: { backgroundColor: royal, borderColor: royal },
  selectPillText: { color: '#687A96', fontSize: 8.5, fontWeight: '800' },
  selectPillTextActive: { color: '#FFF' },
  detailRow: { minHeight: 76, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E3EAF3' },
  detailRowTall: { minHeight: 104 },
  alternateRow: { backgroundColor: '#FBFCFE' },
  labelCell: { width: LABEL_WIDTH, backgroundColor: '#F1F6FC', paddingHorizontal: 10, justifyContent: 'center' },
  alternateLabelCell: { backgroundColor: '#EAF2FB' },
  rowIconBox: { width: 27, height: 27, borderRadius: 9, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  rowIcon: { color: royal, fontSize: 13, fontWeight: '900' },
  rowLabel: { color: navy, fontSize: 10.5, lineHeight: 13, fontWeight: '900', marginTop: 5 },
  valueCell: { borderLeftWidth: 1, borderLeftColor: '#E3EAF3', paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  bestValueCell: { backgroundColor: '#FFFDF1' },
  selectedValueCell: { backgroundColor: '#EEF5FF', borderLeftColor: '#BBD2F2' },
  ratingValue: { color: navy, fontSize: 13, fontWeight: '900' },
  positiveValue: { color: '#0A57CB', fontSize: 14, fontWeight: '900' },
  priceValue: { color: '#9A6A00', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  priceUnit: { color: '#8190A8', fontSize: 9, fontWeight: '600' },
  valueText: { color: '#263E69', fontSize: 9.5, lineHeight: 13, textAlign: 'center', fontWeight: '600' },
  reviewText: { color: '#52647F', fontSize: 8.5, lineHeight: 12, textAlign: 'center', fontStyle: 'italic' },
  muted: { color: '#8B98AD', fontSize: 8.5, textAlign: 'center', marginTop: 3 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#FFF', paddingHorizontal: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E8F2' },
  selectButton: { minHeight: 55, borderRadius: 15, backgroundColor: yellow, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#D2A300', shadowOpacity: 0.24, shadowRadius: 8, elevation: 4 },
  selectButtonLabel: { color: '#806300', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  selectButtonText: { color: navy, fontSize: 14, fontWeight: '900', marginTop: 2 },
  selectArrow: { color: navy, fontSize: 24, fontWeight: '900' },
});

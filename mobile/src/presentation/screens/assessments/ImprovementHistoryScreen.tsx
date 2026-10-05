import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { assessmentRepository } from '../../../data/repositories/assessmentRepository';
import type { ImprovementHistory } from '../../../domain/entities/AssessmentWork';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { AssessmentScreen, KuppiyaBar, OrangeButton } from './Chrome';
import { blue, card, good, ink, line, muted, navy, orange, soft } from './theme';

type Props = NativeStackScreenProps<AppStackParamList, 'AssessmentHistory'>;

export default function ImprovementHistoryScreen({ navigation }: Props) {
  const [data, setData] = useState<ImprovementHistory | null>(null);
  const [moduleName, setModuleName] = useState('All Modules');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    assessmentRepository.history()
      .then((history) => { if (active) setData(history); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useFocusEffect(useCallback(() => load(), [load]));

  const timeline = (data?.timeline ?? []).filter((item) => moduleName === 'All Modules' || `${item.moduleCode} ${item.moduleName}`.includes(moduleName.split(' ')[0]));

  return (
    <AssessmentScreen navigation={navigation}>
      <KuppiyaBar title="History" />
      {loading && !data ? <ActivityIndicator color={navy} style={styles.loader} /> : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.kicker}>{data?.semester}</Text>
          <Text style={styles.title}>Analytics & Growth Trajectory</Text>
          <View style={styles.velocity}>
            <View style={styles.flex}>
              <Text style={styles.velocityKicker}>Mastery velocity · {data?.weekLabel}</Text>
              <Text style={styles.growth}>{data?.growth} growth</Text>
              <Text style={styles.detail}>{data?.growthDetail}</Text>
            </View>
            <View style={styles.rank}><Text style={styles.rankText}>{data?.cohortRank}</Text></View>
          </View>
          <View style={styles.stats}>
            <Mini label="Assessments" value={String(data?.stats.assessments ?? 0)} />
            <Mini label="Kuppiya logs" value={data?.stats.hours ?? ''} />
            <Mini label="Est. GPA" value={data?.stats.gpa ?? ''} />
          </View>

          <Text style={styles.section}>Score velocity</Text>
          <Text style={styles.detail}>Cumulative score progression · target {data?.target}%</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            {(data?.modules ?? []).map((item) => (
              <TouchableOpacity key={item} style={[styles.chip, moduleName === item && styles.chipOn]} onPress={() => setModuleName(item)}>
                <Text style={[styles.chipText, moduleName === item && styles.chipTextOn]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.chart}>
            {(data?.points ?? []).map((point) => (
              <View key={point.label} style={styles.col}>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${point.value}%` }]} />
                </View>
                <View style={styles.dot} />
                <Text style={styles.barLabel}>{point.label}</Text>
                <Text style={styles.barValue}>{point.value}%</Text>
              </View>
            ))}
          </View>

          <Text style={styles.section}>Competency matrix</Text>
          {(data?.competencies ?? []).map((item) => (
            <View key={item.title} style={styles.comp}>
              <View style={styles.compTop}>
                <Text style={styles.compTitle}>{item.title}</Text>
                <Text style={styles.delta}>{item.delta}</Text>
              </View>
              <Text style={styles.score}>{item.score}%</Text>
              <View style={styles.track}><View style={[styles.fill, { width: `${item.score}%` }]} /></View>
              <Text style={styles.detail}>{item.detail}</Text>
            </View>
          ))}

          <Text style={styles.section}>Assessment timeline</Text>
          {timeline.map((item) => (
            <View key={item.id} style={styles.timeCard}>
              <Text style={styles.module}>{item.moduleCode} · {item.moduleName}</Text>
              <View style={styles.compTop}>
                <Text style={styles.compTitle}>{item.title}</Text>
                <Text style={styles.delta}>{item.delta}</Text>
              </View>
              <Text style={styles.detail}>{item.dateLabel}</Text>
              <View style={styles.compare}>
                <Score label={item.beforeLabel} value={item.beforeScore} />
                <Score label={item.midLabel} value={item.midValue} />
                <Score label={item.afterLabel} value={item.afterScore} />
              </View>
              <Text style={styles.quote}>“{item.quote}”</Text>
              <Text style={styles.person}>{item.person} · {item.role}</Text>
              {item.paperId ? (
                <TouchableOpacity onPress={() => navigation.navigate('AssessmentResult', { paperId: item.paperId! })}>
                  <Text style={styles.link}>View result</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}

          <View style={styles.focus}>
            <Text style={styles.velocityKicker}>Next focus milestone</Text>
            <Text style={styles.compTitle}>{data?.focus.title}</Text>
            <Text style={styles.detail}>{data?.focus.detail}</Text>
            <Text style={styles.delta}>{data?.focus.boost}</Text>
            <TouchableOpacity style={styles.book} onPress={() => navigation.navigate('MainTabs', { screen: 'Sessions' })}>
              <Text style={styles.bookText}>Book topic</Text>
            </TouchableOpacity>
          </View>
          <OrangeButton
            label="Download Growth Report"
            icon="file-download"
            onPress={() => Alert.alert('Growth report', `${data?.growth} mastery this semester. ${data?.growthDetail}`)}
          />
          <TouchableOpacity
            style={styles.share}
            onPress={() => Alert.alert('Shared', 'Progress was shared with Tharushi Perera.')}
          >
            <MaterialIcons name="share" size={16} color={blue} />
            <Text style={styles.link}>Share progress with Tharushi</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </AssessmentScreen>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.mini}>
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function Score({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scoreBox}>
      <Text style={styles.miniLabel}>{label}</Text>
      <Text style={styles.scoreValue}>{value}</Text>
    </View>
  );
}

const pageTone = '#F4F6FB';

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  scroll: { padding: 16, paddingBottom: 28 },
  flex: { flex: 1 },
  kicker: { color: blue, fontWeight: '800' },
  title: { color: ink, fontSize: 24, fontWeight: '800', marginTop: 4, marginBottom: 12 },
  velocity: { backgroundColor: navy, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 8 },
  velocityKicker: { color: orange, fontWeight: '800', fontSize: 11, textTransform: 'uppercase' },
  growth: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  detail: { color: muted, marginTop: 4, lineHeight: 18 },
  rank: { backgroundColor: '#1C3E78', borderRadius: 12, padding: 8, alignSelf: 'flex-start' },
  rankText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  mini: { flex: 1, backgroundColor: card, borderRadius: 14, padding: 10, borderWidth: 1, borderColor: line },
  miniValue: { color: ink, fontWeight: '800', fontSize: 16 },
  miniLabel: { color: muted, fontSize: 11, marginTop: 2 },
  section: { color: ink, fontSize: 18, fontWeight: '800', marginTop: 18, marginBottom: 6 },
  filters: { gap: 8, paddingVertical: 8 },
  chip: { backgroundColor: '#E7EDF6', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7 },
  chipOn: { backgroundColor: navy },
  chipText: { color: blue, fontWeight: '700', fontSize: 12 },
  chipTextOn: { color: '#fff' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, backgroundColor: card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: line },
  col: { flex: 1, alignItems: 'center' },
  barTrack: { height: 90, width: 18, backgroundColor: '#E7EDF6', borderRadius: 9, justifyContent: 'flex-end' },
  bar: { width: 18, backgroundColor: orange, borderRadius: 9 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: navy, marginTop: -4 },
  barLabel: { color: muted, fontSize: 9, marginTop: 6, textAlign: 'center' },
  barValue: { color: ink, fontSize: 10, fontWeight: '800' },
  comp: { backgroundColor: card, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: line },
  compTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  compTitle: { color: ink, fontWeight: '800', flex: 1 },
  delta: { color: good, fontWeight: '800' },
  score: { color: ink, fontSize: 22, fontWeight: '800', marginTop: 4 },
  track: { height: 8, backgroundColor: '#E7EDF6', borderRadius: 8, marginVertical: 6 },
  fill: { height: 8, backgroundColor: blue, borderRadius: 8 },
  timeCard: { backgroundColor: card, borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: line },
  module: { color: blue, fontWeight: '800', fontSize: 12 },
  compare: { flexDirection: 'row', gap: 6, marginTop: 8 },
  scoreBox: { flex: 1, backgroundColor: pageTone, borderRadius: 12, padding: 8 },
  scoreValue: { color: ink, fontWeight: '800', marginTop: 2 },
  quote: { color: ink, marginTop: 8, lineHeight: 20 },
  person: { color: muted, marginTop: 4, fontWeight: '700' },
  link: { color: blue, fontWeight: '800' },
  focus: { backgroundColor: soft, borderRadius: 16, padding: 14, marginVertical: 12 },
  book: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: navy, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  bookText: { color: '#fff', fontWeight: '800' },
  share: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12 },
});

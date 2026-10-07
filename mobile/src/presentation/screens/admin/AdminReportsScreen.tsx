import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SvgChevronLeft,
  SvgCalendar,
  SvgClock,
  SvgFileText,
  SvgShieldCheck,
  SvgTrendingUp,
  SvgUser,
} from '../../components/common/SvgIcons';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export default function AdminReportsScreen({ navigation }: Props) {
  const scrollRef = useScrollToTopOnFocus<ScrollView>();
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;

  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'semester' | 'all'>('week');
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);

  const handleExport = (reportName: string, format: 'PDF' | 'CSV') => {
    setDownloadingReport(reportName);
    setTimeout(() => {
      setDownloadingReport(null);
      Alert.alert(
        'Report Export Ready 📑',
        `"${reportName}" has been compiled in ${format} format.\nDownloaded to: UniMentor/Reports/${reportName.replace(/\s+/g, '_')}_2026.${format.toLowerCase()}`
      );
    }, 700);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* Navy Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'))}
            activeOpacity={0.8}
          >
            <SvgChevronLeft size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>System Reports & Audits</Text>
            <Text style={styles.headerSub}>Campus Analytics & Academic Metrics</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 85 }]}
      >
        {/* Time-Range Filter Chips */}
        <View style={styles.rangeRow}>
          {[
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'semester', label: 'Semester 1' },
            { id: 'all', label: 'Academic Year' },
          ].map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.rangeChip, selectedRange === item.id && styles.rangeChipActive]}
              onPress={() => setSelectedRange(item.id as any)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  selectedRange === item.id && styles.rangeChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4 Summary Stats */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Hours */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <SvgClock size={16} color="#EAA023" />
              <Text style={styles.kpiTrendGreen}>+14%</Text>
            </View>
            <Text style={styles.kpiVal}>482.5</Text>
            <Text style={styles.kpiLabel}>Tutoring Hours</Text>
          </View>

          {/* Card 2: Completion Rate */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <SvgTrendingUp size={16} color="#10B981" />
              <Text style={styles.kpiTrendGreen}>+2.1%</Text>
            </View>
            <Text style={styles.kpiVal}>96.4%</Text>
            <Text style={styles.kpiLabel}>Session Completion</Text>
          </View>

          {/* Card 3: Active Tutors */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <SvgUser size={16} color="#EAA023" />
              <Text style={styles.kpiTrendGreen}>+3 New</Text>
            </View>
            <Text style={styles.kpiVal}>34</Text>
            <Text style={styles.kpiLabel}>Verified Mentors</Text>
          </View>

          {/* Card 4: Quality Rating */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiTopRow}>
              <SvgShieldCheck size={16} color="#EAA023" />
              <Text style={styles.kpiTrendGold}>4.9/5</Text>
            </View>
            <Text style={styles.kpiVal}>4.88 ★</Text>
            <Text style={styles.kpiLabel}>Student Rating</Text>
          </View>
        </View>

        {/* Section 1: Subject Demand & Hours */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>MODULE TUTORING HOURS BREAKDOWN</Text>
        </View>

        <View style={styles.breakdownCard}>
          {[
            { code: 'IT3020', name: 'Mobile App Development', hours: 142, pct: 85, color: '#EAA023' },
            { code: 'IT2040', name: 'Database Management Systems', hours: 118, pct: 72, color: '#061E47' },
            { code: 'IT2020', name: 'Data Structures & Algorithms', hours: 96, pct: 58, color: '#10B981' },
            { code: 'IT3010', name: 'Computer Networks', hours: 78, pct: 45, color: '#6366F1' },
            { code: 'SE3040', name: 'Software Architecture', hours: 48, pct: 30, color: '#EC4899' },
          ].map((item, idx) => (
            <View key={item.code} style={[styles.moduleRow, idx > 0 && { marginTop: 14 }]}>
              <View style={styles.moduleMetaRow}>
                <Text style={styles.moduleName}>
                  <Text style={{ fontWeight: '800', color: '#061E47' }}>{item.code}</Text> — {item.name}
                </Text>
                <Text style={styles.moduleHours}>{item.hours} hrs</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${item.pct}%`, backgroundColor: item.color },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Section 2: Downloadable Audit Reports */}
        <View style={styles.sectionHeader}>
          <View style={styles.orangeIndicator} />
          <Text style={styles.sectionTitle}>EXPORT OFFICIAL AUDIT REPORTS</Text>
        </View>

        <View style={styles.reportsGrid}>
          {/* Report 1 */}
          <View style={styles.reportCard}>
            <View style={styles.reportIconWrap}>
              <SvgFileText size={22} color="#EAA023" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>Tutor Performance & Quality Audit</Text>
              <Text style={styles.reportDesc}>
                Detailed ledger of hours logged, student reviews, response latency, and module grades.
              </Text>
              <View style={styles.exportBtnRow}>
                <TouchableOpacity
                  style={styles.exportBtn}
                  onPress={() => handleExport('Tutor Performance & Quality Audit', 'PDF')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportBtnText}>Export PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.exportBtn, styles.exportBtnOutline]}
                  onPress={() => handleExport('Tutor Performance & Quality Audit', 'CSV')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportBtnOutlineText}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Report 2 */}
          <View style={styles.reportCard}>
            <View style={styles.reportIconWrap}>
              <SvgCalendar size={22} color="#061E47" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>Session Attendance & Compliance Log</Text>
              <Text style={styles.reportDesc}>
                Full record of 148 sessions with scheduled vs actual duration, room IDs, and attendee logs.
              </Text>
              <View style={styles.exportBtnRow}>
                <TouchableOpacity
                  style={styles.exportBtn}
                  onPress={() => handleExport('Session Attendance & Compliance Log', 'PDF')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportBtnText}>Export PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.exportBtn, styles.exportBtnOutline]}
                  onPress={() => handleExport('Session Attendance & Compliance Log', 'CSV')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportBtnOutlineText}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Report 3 */}
          <View style={styles.reportCard}>
            <View style={styles.reportIconWrap}>
              <SvgShieldCheck size={22} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportTitle}>Identity Verification & Transcript Ledger</Text>
              <Text style={styles.reportDesc}>
                Academic registry checks, document hashes, and approval status for all registered mentors.
              </Text>
              <View style={styles.exportBtnRow}>
                <TouchableOpacity
                  style={styles.exportBtn}
                  onPress={() => handleExport('Identity Verification & Transcript Ledger', 'PDF')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportBtnText}>Export PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.exportBtn, styles.exportBtnOutline]}
                  onPress={() => handleExport('Identity Verification & Transcript Ledger', 'CSV')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.exportBtnOutlineText}>Export CSV</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  headerBar: {
    backgroundColor: '#061E47',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  brandMentor: {
    color: '#EAA023',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },

  /* Range Chips */
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rangeChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  rangeChipActive: {
    borderColor: '#EAA023',
    backgroundColor: '#FEF3C7',
  },
  rangeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  rangeChipTextActive: {
    color: '#92400E',
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  kpiTrendGreen: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
  },
  kpiTrendGold: {
    color: '#EAA023',
    fontSize: 11,
    fontWeight: '800',
  },
  kpiVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#061E47',
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  /* Section Header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  orangeIndicator: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#EAA023',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#061E47',
    letterSpacing: 0.8,
  },

  /* Breakdown Card */
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  moduleRow: {},
  moduleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  moduleName: {
    fontSize: 12,
    color: '#334155',
  },
  moduleHours: {
    fontSize: 12,
    fontWeight: '800',
    color: '#061E47',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  /* Reports Grid */
  reportsGrid: {
    gap: 12,
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  reportIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#061E47',
  },
  reportDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 15,
  },
  exportBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  exportBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  exportBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  exportBtnOutlineText: {
    color: '#061E47',
    fontSize: 11,
    fontWeight: '700',
  },
});

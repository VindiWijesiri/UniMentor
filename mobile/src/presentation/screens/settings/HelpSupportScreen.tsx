import React, { useState } from 'react';
import { useDeviceFrame } from '../../components/DeviceFrame';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../../shared/theme';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: 'How does module-specific tutor verification work? (FR05 & FR06)',
    a: 'Each requested module requires an official university transcript showing an A or A- grade. Faculty administrators audit every module individually, ensuring students receive guidance only from high-achieving peers.',
  },
  {
    q: 'What should I do if my tutor verification was rejected?',
    a: 'Navigate to your Verification Status screen to review the specific rejection reason logged by the faculty officer. You can then upload a clearer transcript or submit an appeal with supporting coursework.',
  },
  {
    q: 'Where do tutoring sessions take place?',
    a: 'Sessions can be scheduled in authorized campus venues (such as University Library Study Pods, Faculty Common Rooms) or online via UniMentor integrated video rooms.',
  },
  {
    q: 'How are peer tutor hourly fees handled?',
    a: 'Tutors set their own transparent rates (typically LKR 1,500 - 3,500/hr). Payments are held in escrow until the study session is completed satisfactorily.',
  },
  {
    q: 'What is the Campus Academic Honor Code?',
    a: 'UniMentor strictly forbids exam assistance, ghostwriting, or academic misconduct. Mentors provide conceptual explanations, past paper walk-throughs, and study strategies.',
  },
];

export default function HelpSupportScreen({ navigation }: Props) {
  const device = useDeviceFrame();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={[styles.page, device.frame, { paddingTop: device.top, paddingBottom: device.bottom }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Campus Support</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Help Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs, verification rules, or help topics..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Quick Contact Cards */}
        <Text style={styles.sectionHeader}>DIRECT ACADEMIC SUPPORT</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={() =>
              Alert.alert('Support Chat', 'Connecting you to a live Student Support Advisor...')
            }
          >
            <Text style={styles.contactIcon}>💬</Text>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactSub}>8:00 AM - 8:00 PM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() =>
              Alert.alert('Support Email', 'Direct inquiry dispatched to support@unimentor.lk.')
            }
          >
            <Text style={styles.contactIcon}>✉️</Text>
            <Text style={styles.contactTitle}>Campus Email</Text>
            <Text style={styles.contactSub}>help@unimentor.lk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() =>
              Alert.alert('Campus Hotline', 'Dialing University Campus Helpline (+94 11 258 1245)...')
            }
          >
            <Text style={styles.contactIcon}>📞</Text>
            <Text style={styles.contactTitle}>Helpline</Text>
            <Text style={styles.contactSub}>+94 11 258 1245</Text>
          </TouchableOpacity>
        </View>

        {/* FAQs Accordion */}
        <Text style={styles.sectionHeader}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqList}>
          {filteredFaqs.map((faq, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <View key={idx} style={styles.faqCard}>
                <TouchableOpacity
                  style={styles.faqQuestionRow}
                  onPress={() => setExpandedIndex(isExpanded ? null : idx)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestionText}>{faq.q}</Text>
                  <Text style={styles.faqChevron}>{isExpanded ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.faqAnswerWrap}>
                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Verification assistance notice */}
        <View style={styles.verificationCard}>
          <Text style={styles.verCardIcon}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.verCardTitle}>Need Help with Verification?</Text>
            <Text style={styles.verCardSub}>
              If your student ID or transcript verification is delayed, you can check your live queue status anytime.
            </Text>
            <TouchableOpacity
              style={styles.checkStatusBtn}
              onPress={() => navigation.navigate('TutorVerificationStatus')}
            >
              <Text style={styles.checkStatusText}>Check Live Verification Queue  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backArrow: {
    fontSize: 24,
    color: colors.navy,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.navy,
  },
  headerSpacer: {
    width: 38,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: 20,
  },
  searchIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginLeft: 4,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  contactIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  contactTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },
  contactSub: {
    fontSize: 9,
    color: colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  faqList: {
    gap: 10,
    marginBottom: 24,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    flex: 1,
    paddingRight: 10,
  },
  faqChevron: {
    fontSize: 11,
    color: colors.textLight,
  },
  faqAnswerWrap: {
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  faqAnswerText: {
    fontSize: 12,
    color: colors.text,
    lineHeight: 18,
  },
  verificationCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 12,
  },
  verCardIcon: {
    fontSize: 24,
  },
  verCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
  },
  verCardSub: {
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 10,
  },
  checkStatusBtn: {
    alignSelf: 'flex-start',
  },
  checkStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
});

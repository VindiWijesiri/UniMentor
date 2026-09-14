import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Mentor } from '../../../domain/entities/Mentor';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorProfile'>;
type ProfileMentor = Mentor & {
  experience?: string;
  sessionCount?: number;
  availability?: string;
  guidance?: string;
};

function SectionHeading({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionIcon}><Text style={styles.sectionIconText}>{icon}</Text></View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function TutorProfileScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const mentor = route.params.mentor as ProfileMentor;
  const rating = mentor.rating ? mentor.rating.toFixed(1) : 'New';
  const currentRole = useAuthStore((state) => state.user?.role);
  const chatLabel = currentRole === 'mentor' ? 'Chat with Student' : 'Chat with Tutor';

  const openChat = () => {
    if (!/^[a-f\d]{24}$/i.test(mentor._id)) {
      Alert.alert('Chat unavailable', 'Please select a registered tutor from the updated tutor list.');
      return;
    }
    navigation.navigate('Chat', { mentor });
  };

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 82 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroOrbLarge} />
          <View style={styles.heroOrbSmall} />
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{mentor.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.profileCopy}>
              <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ VERIFIED TUTOR</Text></View>
              <Text style={styles.name} numberOfLines={1}>{mentor.name}</Text>
              <Text style={styles.experience} numberOfLines={1}>{mentor.experience ?? 'Senior student tutor'}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}><Text style={styles.star}>★</Text> {rating}</Text>
              <Text style={styles.heroStatLabel}>Rating</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{mentor.sessionCount ?? 0}+</Text>
              <Text style={styles.heroStatLabel}>Sessions</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, styles.onlineText]}>Online</Text>
              <Text style={styles.heroStatLabel}>Status</Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyWrap}>
          <View style={styles.availabilityCard}>
            <View style={styles.calendarBox}><Text style={styles.calendarIcon}>✓</Text></View>
            <View style={styles.availabilityCopy}>
              <Text style={styles.availabilityLabel}>NEXT AVAILABLE</Text>
              <Text style={styles.availabilityValue}>{mentor.availability ?? 'Schedule available'}</Text>
            </View>
            <View style={styles.availableBadge}><Text style={styles.availableBadgeText}>Available</Text></View>
          </View>

          <View style={styles.card}>
            <SectionHeading icon="i" title="About tutor" />
            <Text style={styles.bodyText}>{mentor.bio || 'Friendly academic support with clear, step-by-step explanations.'}</Text>
          </View>

          <View style={styles.card}>
            <SectionHeading icon="M" title="Modules" />
            <View style={styles.tags}>
              {mentor.subjects.map((subject, index) => (
                <View key={subject} style={[styles.tag, index === 0 && styles.primaryTag]}>
                  <View style={[styles.tagDot, index === 0 && styles.primaryTagDot]} />
                  <Text style={[styles.tagText, index === 0 && styles.primaryTagText]}>{subject}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.supportCard}>
            <SectionHeading icon="✓" title="Tutor support" />
            <View style={styles.supportRow}>
              {['Concepts', 'Assignments', 'Exams'].map((item) => (
                <View key={item} style={styles.supportItem}>
                  <View style={styles.supportCheck}><Text style={styles.supportCheckText}>✓</Text></View>
                  <Text style={styles.supportText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.82}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.chatButton} onPress={openChat} activeOpacity={0.84}>
          <View style={styles.chatIcon}><Text style={styles.chatIconText}>•••</Text></View>
          <View>
            <Text style={styles.chatButtonLabel}>DIRECT MESSAGE</Text>
            <Text style={styles.chatButtonText}>{chatLabel}</Text>
          </View>
          <Text style={styles.chatArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const navy = '#061F5C';
const royal = '#0A4AAB';
const yellow = '#FFD21C';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FC' },
  content: { backgroundColor: '#F4F7FC' },
  hero: { backgroundColor: navy, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28, overflow: 'hidden' },
  heroOrbLarge: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: royal, right: -92, top: -104, opacity: 0.58 },
  heroOrbSmall: { position: 'absolute', width: 74, height: 74, borderRadius: 37, backgroundColor: '#1264C9', left: -38, bottom: 8, opacity: 0.42 },
  profileRow: { flexDirection: 'row', alignItems: 'center', zIndex: 2 },
  avatarWrap: { marginRight: 15 },
  avatar: { width: 86, height: 86, borderRadius: 27, backgroundColor: '#FFF3BC', borderWidth: 3, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  avatarText: { color: navy, fontSize: 35, fontWeight: '900' },
  onlineDot: { position: 'absolute', right: -3, bottom: -3, width: 21, height: 21, borderRadius: 11, backgroundColor: yellow, borderWidth: 4, borderColor: navy },
  profileCopy: { flex: 1, minWidth: 0 },
  verifiedBadge: { alignSelf: 'flex-start', borderRadius: 11, backgroundColor: 'rgba(255,210,28,0.16)', borderWidth: 1, borderColor: 'rgba(255,210,28,0.45)', paddingHorizontal: 8, paddingVertical: 4, marginBottom: 7 },
  verifiedText: { color: yellow, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.7 },
  name: { color: '#FFF', fontSize: 23, fontWeight: '900', letterSpacing: -0.3 },
  experience: { color: '#C9D8EF', fontSize: 12, marginTop: 4 },
  heroStats: { height: 70, marginTop: 22, borderRadius: 17, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', zIndex: 2 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  heroStatLabel: { color: '#AFC3E2', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 4 },
  heroDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.18)' },
  star: { color: yellow },
  onlineText: { color: yellow },
  bodyWrap: { paddingHorizontal: 16, paddingTop: 14 },
  availabilityCard: { minHeight: 68, borderRadius: 18, backgroundColor: '#FFF8D5', borderWidth: 1, borderColor: '#F3DC72', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', shadowColor: '#7D6510', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  calendarBox: { width: 42, height: 42, borderRadius: 13, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  calendarIcon: { color: navy, fontSize: 20, fontWeight: '900' },
  availabilityCopy: { flex: 1 },
  availabilityLabel: { color: '#8A6900', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8 },
  availabilityValue: { color: navy, fontSize: 14, fontWeight: '900', marginTop: 3 },
  availableBadge: { borderRadius: 10, backgroundColor: '#FFF', paddingHorizontal: 9, paddingVertical: 5 },
  availableBadgeText: { color: '#8A6900', fontSize: 9, fontWeight: '800' },
  card: { borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E3EAF4', padding: 16, marginTop: 12, shadowColor: '#1D3D66', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 11 },
  sectionIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  sectionIconText: { color: royal, fontSize: 13, fontWeight: '900' },
  sectionTitle: { color: navy, fontSize: 16, fontWeight: '900' },
  bodyText: { color: '#596B87', fontSize: 13, lineHeight: 20 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { minHeight: 33, borderRadius: 12, backgroundColor: '#F1F5FB', borderWidth: 1, borderColor: '#E1E8F2', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center' },
  primaryTag: { backgroundColor: '#EAF2FF', borderColor: '#CFE0F8' },
  tagDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9AA9BF', marginRight: 7 },
  primaryTagDot: { backgroundColor: yellow },
  tagText: { color: '#52647F', fontSize: 11, fontWeight: '700' },
  primaryTagText: { color: royal },
  supportCard: { borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E3EAF4', padding: 16, marginTop: 12 },
  supportRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  supportItem: { flex: 1, alignItems: 'center', borderRadius: 13, backgroundColor: '#F7F9FD', paddingVertical: 11 },
  supportCheck: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  supportCheckText: { color: navy, fontSize: 12, fontWeight: '900' },
  supportText: { color: '#536580', fontSize: 10, fontWeight: '800' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingTop: 10, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E3EAF4', shadowColor: '#17365E', shadowOpacity: 0.10, shadowRadius: 12, elevation: 10, flexDirection: 'row', gap: 8 },
  backButton: { width: 91, height: 52, borderRadius: 15, backgroundColor: yellow, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#D6A700', shadowOpacity: 0.20, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  backArrow: { color: navy, fontSize: 19, fontWeight: '900', marginRight: 6, marginTop: -2 },
  backButtonText: { color: navy, fontSize: 12.5, fontWeight: '900' },
  chatButton: { flex: 1, height: 52, borderRadius: 15, backgroundColor: navy, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', shadowColor: '#062B67', shadowOpacity: 0.18, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  chatIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: 'rgba(255,210,28,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  chatIconText: { color: yellow, fontSize: 12, lineHeight: 12, fontWeight: '900', marginTop: -5 },
  chatButtonLabel: { color: '#AFC2DF', fontSize: 7.5, fontWeight: '900', letterSpacing: 0.6 },
  chatButtonText: { color: '#FFF', fontSize: 12, fontWeight: '900', marginTop: 2 },
  chatArrow: { color: yellow, fontSize: 19, fontWeight: '900', marginLeft: 'auto' },
});

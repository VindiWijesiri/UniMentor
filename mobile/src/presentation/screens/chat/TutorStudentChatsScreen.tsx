import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatRepository, TutorStudentChat, TutorStudentChats } from '../../../data/repositories/chatRepository';
import type { Mentor } from '../../../domain/entities/Mentor';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorStudentChats'>;

const sourceLabel: Record<TutorStudentChat['source'], string> = {
  shortlist: 'Selected you',
  booking: 'Booked a session',
  chat: 'Existing chat',
  student: 'Registered student',
};

function formatWhen(value?: string) {
  if (!value) return '';
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TutorStudentChatsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const statusBarHeight =
    Platform.OS === 'android' ? Math.max(StatusBar.currentHeight || 0, insets.top) : insets.top;
  const authUser = useAuthStore((state) => state.user);
  const [data, setData] = useState<TutorStudentChats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      let next = await chatRepository.getStudentChats();
      if (!next?.students) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        next = await chatRepository.getStudentChats();
      }
      setData(next);
      setError('');
    } catch (err: any) {
      try {
        const next = await chatRepository.getStudentChats();
        setData(next);
        setError('');
      } catch (retryError: any) {
        const message = retryError?.response?.data?.message || retryError?.message || err?.message;
        setError(message && message !== 'Network Error'
          ? message
          : 'Could not load student chats. Check that the API is running, then retry.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  const students = (data?.students ?? []).filter((row) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    const student = row.student;
    return [student.name, student.email, student.degreeProgramme, sourceLabel[row.source]]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
  const selected = students.find((row) => row.student._id === selectedId) ?? students[0];

  const tutorName = data?.tutor.name || authUser?.name || 'Tutor';
  const tutorPhoto = data?.tutor.profilePicture || authUser?.profilePicture;

  const openStudent = (row: TutorStudentChat) => {
    const student = row.student;
    const mentor: Mentor = {
      _id: student._id,
      name: student.name,
      email: student.email,
      role: 'student',
      subjects: student.subjects ?? [],
      bio: student.bio || student.degreeProgramme || '',
      rating: student.rating ?? 0,
      reviewCount: student.reviewCount ?? 0,
      profilePicture: student.profilePicture,
      degreeProgramme: student.degreeProgramme,
      academicYear: student.academicYear,
    };
    navigation.navigate('Chat', { mentor });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent />
      <View style={[styles.headerBar, { paddingTop: Math.max(statusBarHeight, 16) + 4 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>Student Chats</Text>
          </View>
          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#061E47" />}
      >
        <View style={styles.tutorCard}>
          {tutorPhoto ? (
            <Image source={{ uri: tutorPhoto }} style={styles.tutorPhoto} />
          ) : (
            <View style={styles.tutorPhotoFallback}>
              <Text style={styles.tutorInitial}>{tutorName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.tutorKicker}>YOUR TUTOR PROFILE</Text>
            <Text style={styles.tutorName} numberOfLines={1}>{tutorName}</Text>
            <Text style={styles.tutorMeta}>Select a registered student, or someone who already booked or messaged you</Text>
          </View>
        </View>

        {loading && !data ? (
          <View style={styles.state}>
            <ActivityIndicator color="#061E47" />
            <Text style={styles.stateText}>Loading student chats...</Text>
          </View>
        ) : error && !data ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={() => load()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (data?.students.length ?? 0) === 0 ? (
          <View style={styles.state}>
            <Ionicons name="chatbubbles-outline" size={36} color="#94A3B8" />
            <Text style={styles.stateTitle}>No student chats yet</Text>
            <Text style={styles.stateText}>When a student selects you, books a session, or joins your module, they appear here.</Text>
          </View>
        ) : (
          <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search students"
            placeholderTextColor="#8A97AB"
            style={styles.search}
          />
          {students.length === 0 ? (
            <Text style={styles.stateText}>No student matches that search.</Text>
          ) : null}
          {students.map((row) => {
            const preview = row.lastMessage?.text || sourceLabel[row.source];
            return (
              <TouchableOpacity
                key={row.student._id}
                style={[styles.row, selected?.student._id === row.student._id && styles.rowOn]}
                activeOpacity={0.85}
                onPress={() => setSelectedId(row.student._id)}
              >
                {row.student.profilePicture ? (
                  <Image source={{ uri: row.student.profilePicture }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarText}>{row.student.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>{row.student.name}</Text>
                    {row.unreadCount > 0 ? (
                      <View style={styles.badge}><Text style={styles.badgeText}>{row.unreadCount}</Text></View>
                    ) : null}
                  </View>
                  <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {sourceLabel[row.source]}
                    {row.student.degreeProgramme ? ` · ${row.student.degreeProgramme}` : ''}
                    {row.lastMessage ? ` · ${formatWhen(row.lastMessage.createdAt)}` : ''}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={18} color={selected?.student._id === row.student._id ? '#061E47' : '#CBD5E1'} />
              </TouchableOpacity>
            );
          })}
          {selected ? (
            <TouchableOpacity style={styles.openChat} onPress={() => openStudent(selected)} activeOpacity={0.85}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#061E47" />
              <Text style={styles.openChatText}>Chat with {selected.student.name}</Text>
            </TouchableOpacity>
          ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F7FB' },
  headerBar: { backgroundColor: '#061E47', paddingHorizontal: 16, paddingBottom: 14 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', flexShrink: 1 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandUni: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  brandMentor: { color: '#F59E0B', fontSize: 18, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 32 },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#061E47',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  tutorPhoto: { width: 54, height: 54, borderRadius: 16 },
  tutorPhotoFallback: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorInitial: { color: '#061E47', fontSize: 22, fontWeight: '800' },
  tutorKicker: { color: '#FBBF24', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  tutorName: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', marginTop: 2 },
  tutorMeta: { color: '#C4D4EE', fontSize: 12, marginTop: 3 },
  search: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    minHeight: 42,
    color: '#0F172A',
    fontWeight: '700',
    marginBottom: 12,
  },
  rowOn: { borderColor: '#FBBF24', backgroundColor: '#FFFBEB' },
  openChat: {
    marginTop: 4,
    backgroundColor: '#FBBF24',
    borderRadius: 14,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  openChatText: { color: '#061E47', fontSize: 15, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: { width: 46, height: 46, borderRadius: 14 },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FBBF24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#061E47', fontSize: 18, fontWeight: '800' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { color: '#0F172A', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  preview: { color: '#334155', fontSize: 13, marginTop: 2 },
  meta: { color: '#64748B', fontSize: 11, marginTop: 2 },
  badge: { backgroundColor: '#FBBF24', borderRadius: 10, minWidth: 18, paddingHorizontal: 5, alignItems: 'center' },
  badgeText: { color: '#061E47', fontSize: 11, fontWeight: '800' },
  state: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 16 },
  stateTitle: { color: '#0F172A', fontSize: 16, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  stateText: { color: '#64748B', fontSize: 13, textAlign: 'center', marginTop: 6 },
  retry: { marginTop: 14, backgroundColor: '#FBBF24', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  retryText: { color: '#061E47', fontWeight: '800' },
});

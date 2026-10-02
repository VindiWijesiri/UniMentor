import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { chatRepository } from '../../../data/repositories/chatRepository';
import type { ChatConversation } from '../../../domain/entities/ChatMessage';
import type { Mentor } from '../../../domain/entities/Mentor';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList, AppTabParamList } from '../../navigation/AppNavigator';

type Props = BottomTabScreenProps<AppTabParamList, 'Messages'>;
type FilterTab = 'all' | 'unread' | 'voice';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });

export default function ChatInboxScreen({ navigation }: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const isMentor = currentUser?.role === 'mentor';

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const fetchInbox = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await chatRepository.getInbox();
      setConversations(data);
      setError('');
    } catch {
      setError('Could not load messages.');
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInbox();
    }, [])
  );

  const filteredConversations = useMemo(() => {
    let list = conversations;
    if (activeFilter === 'unread') {
      list = list.filter((c) => c.unreadCount > 0);
    } else if (activeFilter === 'voice') {
      list = list.filter((c) => c.lastMessage.messageType === 'voice');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.participant.name.toLowerCase().includes(q) ||
          (c.lastMessage.text && c.lastMessage.text.toLowerCase().includes(q)) ||
          (c.participant.degreeProgramme && c.participant.degreeProgramme.toLowerCase().includes(q))
      );
    }
    return list;
  }, [conversations, activeFilter, searchQuery]);

  const openChat = (conversation: ChatConversation) => {
    const participant = conversation.participant;
    const mentor: Mentor = {
      _id: participant._id,
      name: participant.name,
      email: participant.email,
      role: participant.role,
      subjects: participant.subjects ?? [],
      bio: participant.bio ?? '',
      rating: participant.rating ?? 0,
      reviewCount: participant.reviewCount ?? 0,
      profilePicture: participant.profilePicture,
    };

    const parentNav = navigation.getParent<NativeStackNavigationProp<AppStackParamList>>();
    if (parentNav) {
      parentNav.navigate('Chat', { mentor });
    } else {
      (navigation as any).navigate('Chat', { mentor });
    }
  };

  const handleDeleteConversation = (participantId: string, name: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to remove the conversation with ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatRepository.deleteConversation(participantId);
              setConversations((current) =>
                current.filter((c) => c.participant._id !== participantId)
              );
            } catch {
              Alert.alert('Error', 'Could not delete conversation.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.page}>
      {/* Hero Header */}
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Text style={styles.eyebrow}>
          {isMentor ? 'MENTOR CHAT HUB' : 'DIRECT MESSAGING'}
        </Text>
        <Text style={styles.title}>
          {isMentor ? 'Student Inquiries' : 'Messages'}
        </Text>
        <Text style={styles.subtitle}>
          {isMentor
            ? 'Real-time discussions and voice notes from your peer mentees'
            : 'Chat with verified university peer mentors and tutors'}
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={
              isMentor ? 'Search student name or message...' : 'Search mentor or topic...'
            }
            placeholderTextColor="#8997AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: '#8997AF', paddingHorizontal: 6 }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {[
            { key: 'all' as FilterTab, label: 'All Chats', icon: false },
            { key: 'unread' as FilterTab, label: 'Unread', icon: false },
            { key: 'voice' as FilterTab, label: 'Voice Notes', icon: true },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, activeFilter === tab.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {tab.icon && (
                  <MaterialCommunityIcons
                    name="microphone"
                    size={14}
                    color={activeFilter === tab.key ? '#FFFFFF' : '#E2E8F0'}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    activeFilter === tab.key && styles.filterChipTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.lastMessage.conversationKey}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchInbox(true)}
            tintColor="#061E47"
          />
        }
        renderItem={({ item }) => {
          const isVoice = item.lastMessage.messageType === 'voice';
          const isParticipantStudent = item.participant.role === 'student';

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => openChat(item)}
              onLongPress={() =>
                handleDeleteConversation(item.participant._id, item.participant.name)
              }
              activeOpacity={0.82}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.participant.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.copy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.participant.name}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.lastMessage.createdAt)}</Text>
                </View>

                {/* Subtitle tag */}
                <Text style={styles.role} numberOfLines={1}>
                  {isParticipantStudent
                    ? `🎓 ${item.participant.degreeProgramme || 'Student Peer Mentee'}`
                    : `⭐ Senior Peer Mentor • Batch '24`}
                </Text>

                {/* Last message preview */}
                <View style={styles.previewRow}>
                  {isVoice ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <MaterialCommunityIcons name="microphone" size={15} color="#00A884" />
                      <Text style={styles.voicePreview} numberOfLines={1}>
                        Voice message ({item.lastMessage.voiceDuration || 14}s)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.preview} numberOfLines={1}>
                      {item.lastMessage.text}
                    </Text>
                  )}
                </View>
              </View>

              {item.unreadCount > 0 && (
                <View style={styles.unread}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.deleteConvoBtn}
                onPress={() =>
                  handleDeleteConversation(item.participant._id, item.participant.name)
                }
              >
                <Text style={styles.deleteConvoText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.state}>
              <ActivityIndicator color="#061E47" size="large" />
              <Text style={styles.stateText}>Loading conversations...</Text>
            </View>
          ) : (
            <View style={styles.state}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>💬</Text>
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery || activeFilter !== 'all'
                  ? 'No matching chats found'
                  : isMentor
                  ? 'No student inquiries yet'
                  : 'No conversations yet'}
              </Text>
              <Text style={styles.stateText}>
                {isMentor
                  ? 'When students reach out about your modules, their messages and voice notes will appear here.'
                  : 'Start a conversation with a peer mentor to ask about modules, coursework, or exams.'}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const navy = '#061E47';
const yellow = '#F59E0B';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  hero: {
    backgroundColor: navy,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#0B2754',
    right: -70,
    top: -90,
    opacity: 0.85,
  },
  eyebrow: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 3,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11.5,
    marginTop: 3,
    maxWidth: 320,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
    marginTop: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 13 },

  filterRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  filterChipActive: { backgroundColor: yellow },
  filterChipText: { color: '#E2E8F0', fontSize: 11, fontWeight: '700' },
  filterChipTextActive: { color: '#FFFFFF' },

  listContent: { padding: 14, flexGrow: 1, paddingBottom: 30 },
  card: {
    minHeight: 84,
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  avatarText: { color: '#061E47', fontSize: 20, fontWeight: '900' },
  copy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, color: '#0F172A', fontSize: 14.5, fontWeight: '900' },
  date: { color: '#94A3B8', fontSize: 9.5, fontWeight: '600' },
  role: {
    color: '#0B2754',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  previewRow: { marginTop: 4 },
  preview: { color: '#64748B', fontSize: 12 },
  voicePreview: { color: '#D97706', fontSize: 12, fontWeight: '700' },
  unread: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  deleteConvoBtn: { padding: 6, marginLeft: 6 },
  deleteConvoText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },

  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, marginTop: 40 },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: { fontSize: 26 },
  emptyTitle: { color: '#0F172A', fontSize: 16, fontWeight: '900', marginTop: 12 },
  stateText: { color: '#64748B', fontSize: 12, marginTop: 6, textAlign: 'center', lineHeight: 18 },
});

import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { chatRepository } from '../../../data/repositories/chatRepository';
import type { ChatConversation } from '../../../domain/entities/ChatMessage';
import type { Mentor } from '../../../domain/entities/Mentor';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'TutorInbox'>;

const formatDate = (date: string) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });

export default function ChatInboxScreen({ navigation }: Props) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    chatRepository.getInbox()
      .then((data) => {
        if (active) {
          setConversations(data);
          setError('');
        }
      })
      .catch(() => {
        if (active) setError('Could not load messages.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []));

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
    };
    navigation.navigate('Chat', { mentor });
  };

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <View style={styles.heroOrb} />
        <Text style={styles.eyebrow}>CONVERSATIONS</Text>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Keep learning conversations in one place.</Text>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.lastMessage.conversationKey}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openChat(item)} activeOpacity={0.82}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{item.participant.name.charAt(0).toUpperCase()}</Text></View>
            <View style={styles.copy}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.participant.name}</Text>
                <Text style={styles.date}>{formatDate(item.lastMessage.createdAt)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>{item.lastMessage.text}</Text>
              <Text style={styles.role}>{item.participant.role === 'mentor' ? 'Tutor' : 'Student'}</Text>
            </View>
            {item.unreadCount > 0 && <View style={styles.unread}><Text style={styles.unreadText}>{item.unreadCount}</Text></View>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={loading ? (
          <View style={styles.state}><ActivityIndicator color="#062B67" /><Text style={styles.stateText}>Loading messages...</Text></View>
        ) : (
          <View style={styles.state}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✦</Text></View>
            <Text style={styles.emptyTitle}>{error || 'No conversations yet'}</Text>
            <Text style={styles.stateText}>Your conversations will appear here.</Text>
          </View>
        )}
      />
    </View>
  );
}

const navy = '#061F5C';
const yellow = '#FFD21C';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FC' },
  hero: { backgroundColor: navy, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 24, overflow: 'hidden' },
  heroOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: '#0A57CB', right: -85, top: -110, opacity: 0.56 },
  eyebrow: { color: yellow, fontSize: 9.5, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#FFF', fontSize: 27, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#C5D4EB', fontSize: 11.5, marginTop: 4 },
  listContent: { padding: 14, flexGrow: 1 },
  card: { minHeight: 82, borderRadius: 18, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E1E9F3', padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 51, height: 51, borderRadius: 17, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  avatarText: { color: navy, fontSize: 21, fontWeight: '900' },
  copy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, color: navy, fontSize: 14.5, fontWeight: '900' },
  date: { color: '#8A97AB', fontSize: 9 },
  preview: { color: '#647590', fontSize: 11.5, marginTop: 5 },
  role: { color: '#9A6A00', fontSize: 8.5, fontWeight: '900', marginTop: 5, textTransform: 'uppercase' },
  unread: { minWidth: 21, height: 21, borderRadius: 11, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  unreadText: { color: navy, fontSize: 9, fontWeight: '900' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: navy, fontSize: 22, fontWeight: '900' },
  emptyTitle: { color: navy, fontSize: 16, fontWeight: '900', marginTop: 11 },
  stateText: { color: '#7C8AA1', fontSize: 11, marginTop: 6, textAlign: 'center' },
});

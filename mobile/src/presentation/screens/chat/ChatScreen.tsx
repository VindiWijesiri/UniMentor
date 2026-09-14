import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { chatRepository } from '../../../data/repositories/chatRepository';
import type { ChatMessage } from '../../../domain/entities/ChatMessage';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

const formatTime = (date: string) => new Date(date).toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
});

export default function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { mentor } = route.params;
  const userId = useAuthStore((state) => state.user?._id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    let active = true;
    const loadMessages = async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const data = await chatRepository.getConversation(mentor._id);
        if (active) {
          setMessages(data);
          setError('');
        }
      } catch (requestError) {
        if (active) {
          const message = axios.isAxiosError(requestError)
            ? requestError.response?.data?.message || 'Unable to load this conversation.'
            : 'Unable to load this conversation.';
          setError(message);
        }
      } finally {
        if (active && showLoader) setLoading(false);
      }
    };

    void loadMessages(true);
    const poller = setInterval(() => void loadMessages(), 3000);
    return () => {
      active = false;
      clearInterval(poller);
    };
  }, [mentor._id]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const message = await chatRepository.send(mentor._id, text);
      setMessages((current) => current.some(({ _id }) => _id === message._id) ? current : [...current, message]);
      setDraft('');
      setError('');
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || 'Message could not be sent.'
        : 'Message could not be sent.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 7 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{mentor.name.charAt(0).toUpperCase()}</Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.name} numberOfLines={1}>{mentor.name}</Text>
          <Text style={styles.status}>{mentor.role === 'student' ? 'Student' : 'Tutor'} • Messages refresh automatically</Text>
        </View>
        <View style={styles.verified}><Text style={styles.verifiedText}>✓</Text></View>
      </View>

      {error ? (
        <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {loading ? (
        <View style={styles.loadingState}><ActivityIndicator color="#062B67" /><Text style={styles.loadingText}>Loading conversation...</Text></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={(
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIcon}><Text style={styles.welcomeIconText}>✦</Text></View>
              <Text style={styles.welcomeTitle}>Start your conversation</Text>
              <Text style={styles.welcomeText}>Ask about lessons, availability or the module before booking.</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const mine = String(item.sender) === userId;
            return (
              <View style={[styles.messageRow, mine && styles.messageRowMine]}>
                <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.messageText, mine && styles.myMessageText]}>{item.text}</Text>
                  <View style={styles.messageMeta}>
                    <Text style={[styles.time, mine && styles.myTime]}>{formatTime(item.createdAt)}</Text>
                    {mine && <Text style={styles.readMark}>{item.read ? '✓✓' : '✓'}</Text>}
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 9) }]}>
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#8B98AE"
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!draft.trim() || sending) && styles.sendButtonDisabled]}
            onPress={() => void sendMessage()}
            disabled={!draft.trim() || sending}
            activeOpacity={0.84}
          >
            {sending ? <ActivityIndicator size="small" color="#061F5C" /> : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const navy = '#061F5C';
const royal = '#0A57CB';
const yellow = '#FFD21C';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EDF3FA' },
  header: { minHeight: 92, backgroundColor: navy, paddingHorizontal: 13, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  backButton: { width: 36, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  backText: { color: '#FFF', fontSize: 36, lineHeight: 37, marginTop: -3 },
  avatar: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarText: { color: navy, fontSize: 20, fontWeight: '900' },
  onlineDot: { position: 'absolute', right: -2, bottom: -2, width: 13, height: 13, borderRadius: 7, backgroundColor: yellow, borderWidth: 2, borderColor: navy },
  headerCopy: { flex: 1, minWidth: 0 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  status: { color: '#BFCFE7', fontSize: 9.5, marginTop: 3 },
  verified: { width: 27, height: 27, borderRadius: 14, backgroundColor: 'rgba(255,210,28,0.16)', alignItems: 'center', justifyContent: 'center' },
  verifiedText: { color: yellow, fontSize: 13, fontWeight: '900' },
  errorBar: { backgroundColor: '#FFF0F0', borderBottomWidth: 1, borderBottomColor: '#F4C9C9', paddingHorizontal: 14, paddingVertical: 8 },
  errorText: { color: '#A63838', fontSize: 10.5, textAlign: 'center', fontWeight: '700' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#74839A', fontSize: 11, marginTop: 9 },
  messageList: { paddingHorizontal: 13, paddingTop: 15, paddingBottom: 12 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  welcomeCard: { alignSelf: 'center', width: '84%', borderRadius: 20, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DEE7F2', padding: 21, alignItems: 'center' },
  welcomeIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF3BC', alignItems: 'center', justifyContent: 'center' },
  welcomeIconText: { color: navy, fontSize: 20, fontWeight: '900' },
  welcomeTitle: { color: navy, fontSize: 16, fontWeight: '900', marginTop: 11 },
  welcomeText: { color: '#74839A', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5 },
  messageRow: { alignItems: 'flex-start', marginBottom: 7 },
  messageRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: 17, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 6 },
  myBubble: { backgroundColor: navy, borderBottomRightRadius: 5 },
  theirBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#DFE7F1' },
  messageText: { color: '#293B5B', fontSize: 13, lineHeight: 19 },
  myMessageText: { color: '#FFF' },
  messageMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3 },
  time: { color: '#8A98AC', fontSize: 8 },
  myTime: { color: '#AFC2DF' },
  readMark: { color: yellow, fontSize: 9, fontWeight: '900', marginLeft: 4 },
  composerWrap: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#DEE6F0', paddingHorizontal: 10, paddingTop: 9 },
  composer: { minHeight: 49, borderRadius: 24, backgroundColor: '#F2F5F9', borderWidth: 1, borderColor: '#DCE4EE', paddingLeft: 15, paddingRight: 5, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, maxHeight: 100, color: '#263A5C', fontSize: 13.5, paddingVertical: 9 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center', marginLeft: 7 },
  sendButtonDisabled: { opacity: 0.45 },
  sendIcon: { color: navy, fontSize: 18, fontWeight: '900', marginLeft: 2 },
});

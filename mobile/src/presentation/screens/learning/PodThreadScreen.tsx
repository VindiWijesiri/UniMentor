import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { podRepository } from '../../../data/repositories/podRepository';
import type { PodConversation, PodMessage } from '../../../domain/entities/Pod';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList } from '../../navigation/AppNavigator';
import { ink, muted, navy, yellow } from './learningTheme';

type Props = NativeStackScreenProps<AppStackParamList, 'PodThread'>;

const formatTime = (date: string) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function PodThreadScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((state) => state.user?._id);
  const [tab, setTab] = useState<'chat' | 'notices' | 'analytics'>('chat');
  const [conversation, setConversation] = useState<PodConversation | null>(null);
  const [messages, setMessages] = useState<PodMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<FlatList<PodMessage>>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async (showLoader = false) => {
      if (!showLoader && sendingRef.current) return;
      if (showLoader) setLoading(true);
      try {
        const [thread, history] = await Promise.all([
          podRepository.get(route.params.conversationId),
          podRepository.messages(route.params.conversationId),
        ]);
        if (!active) return;
        setConversation(thread);
        setMessages(history);
        setError('');
      } catch {
        if (active) setError('Unable to load this conversation.');
      } finally {
        if (active && showLoader) setLoading(false);
      }
    };
    void load(true);
    const poller = setInterval(() => void load(), 3000);
    return () => {
      active = false;
      clearInterval(poller);
    };
  }, [route.params.conversationId]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const message = await podRepository.send(route.params.conversationId, text);
      setMessages((current) => current.some(({ _id }) => _id === message._id) ? current : [...current, message]);
      setDraft('');
      setError('');
    } catch {
      setError('Message could not be sent.');
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const respond = async (status: 'accepted' | 'declined') => {
    try {
      const updated = await podRepository.proposal(route.params.conversationId, status);
      setConversation(updated);
      const history = await podRepository.messages(route.params.conversationId);
      setMessages(history);
    } catch {
      Alert.alert('Could not update the booking.');
    }
  };

  const placeholder = conversation?.type === 'group'
    ? `Message ${conversation.title}`
    : `Ask ${conversation?.title.split(' ')[0] ?? 'them'} a question or share code`;
  const group = conversation?.type === 'group' || conversation?.category === 'squad';
  const visibleMessages = tab === 'notices'
    ? messages.filter((item) => item.kind === 'assessment' || item.kind === 'file')
    : messages;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.name} numberOfLines={1}>{conversation?.title ?? 'Chat Pod'}</Text>
          <Text style={styles.status} numberOfLines={1}>
            {conversation?.meta.assessmentTitle ?? conversation?.meta.subtitle ?? 'UniMentor Chat Pod'}
          </Text>
        </View>
        <Text style={styles.brand}>UniMentor</Text>
      </View>
      {group && (
        <View style={styles.tabs}>
          {(['chat', 'notices', 'analytics'] as const).map((key) => (
            <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.tabOn]} onPress={() => setTab(key)}>
              <Text style={[styles.tabText, tab === key && styles.tabTextOn]}>{key[0].toUpperCase() + key.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {error ? <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View> : null}

      {loading ? (
        <View style={styles.loading}><ActivityIndicator color={navy} /><Text style={styles.muted}>Loading conversation...</Text></View>
      ) : tab === 'analytics' ? (
        <View style={styles.analytics}>
          <Text style={styles.analyticsTitle}>Squad activity</Text>
          <Text style={styles.analyticsMeta}>{conversation?.participantCount ?? 0} participants</Text>
          <Text style={styles.analyticsMeta}>{messages.length} messages in this pod</Text>
          <Text style={styles.analyticsMeta}>{conversation?.meta.pollVotes ?? 0} poll votes</Text>
          <Text style={styles.analyticsHint}>{conversation?.meta.assessmentHint ?? conversation?.meta.subtitle ?? ''}</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={visibleMessages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={styles.empty}>{tab === 'notices' ? 'No notices yet.' : 'Start this conversation with a question.'}</Text>}
          renderItem={({ item }) => {
            if (item.kind === 'assessment') {
              return (
                <View style={styles.examCard}>
                  <View style={styles.examHead}>
                    <Text style={styles.examEyebrow}>{conversation?.meta.assessmentTitle ?? 'Mid-Semester Mock Test 01'}</Text>
                    <Text style={styles.examMeta}>{String(item.meta?.progress ?? conversation?.meta.assessmentProgress ?? '')}</Text>
                  </View>
                  <Text style={styles.examHint}>{String(item.meta?.hint ?? conversation?.meta.assessmentHint ?? item.text)}</Text>
                </View>
              );
            }
            if (item.kind === 'proposal') {
              return (
                <View style={styles.proposal}>
                  <View style={styles.proposalHead}>
                    <Text style={styles.proposalTitle}>⚡ Flash Kuppiya Proposed</Text>
                    <Text style={styles.price}>{String(item.meta?.price ?? 'LKR 350')}</Text>
                  </View>
                  <Text style={styles.proposalMeta}>{conversation?.meta.scheduleLabel ?? 'Tomorrow at 7:00 PM'}</Text>
                  {conversation?.meta.proposalStatus === 'pending' && (
                    <View style={styles.proposalActions}>
                      <TouchableOpacity style={styles.accept} onPress={() => void respond('accepted')}><Text style={styles.acceptText}>Accept & Book</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.decline} onPress={() => void respond('declined')}><Text style={styles.declineText}>Decline</Text></TouchableOpacity>
                    </View>
                  )}
                  {conversation?.meta.proposalStatus && conversation.meta.proposalStatus !== 'pending' && (
                    <Text style={styles.booked}>{conversation.meta.proposalStatus === 'accepted' ? 'Booked' : 'Declined'}</Text>
                  )}
                </View>
              );
            }
            const mine = String(item.sender) === userId;
            if (item.kind === 'file' || item.kind === 'voice') {
              return (
                <View style={[styles.row, mine && styles.rowMine]}>
                  {!mine && <Text style={styles.sender}>{item.senderName}</Text>}
                  <View style={styles.fileBubble}>
                    <Text style={styles.fileIcon}>{item.kind === 'voice' ? `▶  ${String(item.meta?.duration ?? '0:42')}` : '📄'}</Text>
                    <Text style={styles.text}>{item.text}</Text>
                    <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View style={[styles.row, mine && styles.rowMine]}>
                {!mine && (
                  <View style={styles.msgMeta}>
                    <View style={styles.tinyAvatar}><Text style={styles.tinyAvatarText}>{item.senderInitials}</Text></View>
                    <Text style={styles.sender}>{item.senderName}</Text>
                  </View>
                )}
                <View style={[styles.bubble, mine ? styles.myBubble : styles.theirBubble]}>
                  <Text style={[styles.text, mine && styles.myText]}>{item.text}</Text>
                  <Text style={[styles.time, mine && styles.myTime]}>{formatTime(item.createdAt)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#8B98AE"
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.send, (!draft.trim() || sending) && styles.sendOff]}
            onPress={() => void send()}
            disabled={!draft.trim() || sending}
          >
            {sending ? <ActivityIndicator size="small" color={navy} /> : <Text style={styles.sendIcon}>➤</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EEF2F8' },
  header: { backgroundColor: navy, paddingHorizontal: 14, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  back: { color: '#FFF', fontSize: 32, marginRight: 8 },
  headerCopy: { flex: 1 },
  name: { color: '#FFF', fontSize: 17, fontWeight: '900' },
  status: { color: '#C5D4EB', fontSize: 11, marginTop: 2 },
  brand: { color: yellow, fontSize: 12, fontWeight: '800' },
  tabs: { flexDirection: 'row', backgroundColor: navy, paddingHorizontal: 16, gap: 18, paddingBottom: 10 },
  tab: { paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabOn: { borderBottomColor: yellow },
  tabText: { color: '#9BB0D0', fontWeight: '800', fontSize: 13 },
  tabTextOn: { color: yellow },
  analytics: { flex: 1, padding: 20 },
  analyticsTitle: { color: ink, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  analyticsMeta: { color: muted, marginBottom: 6, fontWeight: '700' },
  analyticsHint: { color: ink, marginTop: 12, lineHeight: 20 },
  errorBar: { backgroundColor: '#FFF0F0', padding: 8 },
  errorText: { color: '#A63838', textAlign: 'center', fontSize: 12, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: muted, marginTop: 8 },
  list: { padding: 14, paddingBottom: 20 },
  empty: { textAlign: 'center', color: muted, marginTop: 40 },
  examCard: { backgroundColor: '#FFF4C4', borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#F0D56A' },
  examHead: { gap: 2 },
  examEyebrow: { color: navy, fontWeight: '900' },
  examMeta: { color: '#8A5A00', fontSize: 11, marginTop: 3, fontWeight: '700' },
  examHint: { color: ink, fontSize: 12, marginTop: 6, lineHeight: 18 },
  proposal: { backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E6EAF2' },
  proposalHead: { flexDirection: 'row', justifyContent: 'space-between' },
  proposalTitle: { color: ink, fontWeight: '900' },
  price: { color: '#0B6B5B', fontWeight: '900' },
  proposalMeta: { color: muted, marginTop: 6, fontSize: 12 },
  proposalActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  accept: { flex: 1, backgroundColor: yellow, borderRadius: 14, paddingVertical: 11, alignItems: 'center' },
  acceptText: { color: navy, fontWeight: '900' },
  decline: { flex: 1, borderRadius: 14, paddingVertical: 11, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  declineText: { color: muted, fontWeight: '800' },
  booked: { marginTop: 10, color: '#15803D', fontWeight: '800' },
  row: { marginBottom: 10, alignItems: 'flex-start' },
  rowMine: { alignItems: 'flex-end' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  tinyAvatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: navy, alignItems: 'center', justifyContent: 'center' },
  tinyAvatarText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  sender: { color: muted, fontSize: 11, fontWeight: '800' },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 6 },
  myBubble: { backgroundColor: navy, borderBottomRightRadius: 5 },
  theirBubble: { backgroundColor: '#FFF', borderBottomLeftRadius: 5, borderWidth: 1, borderColor: '#DFE7F1' },
  fileBubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 6, backgroundColor: '#E8F0FF', borderWidth: 1, borderColor: '#D5E3F8' },
  fileIcon: { color: navy, fontWeight: '800', marginBottom: 4 },
  text: { color: '#293B5B', fontSize: 13, lineHeight: 19 },
  myText: { color: '#FFF' },
  time: { color: '#8A98AC', fontSize: 9, marginTop: 4, textAlign: 'right' },
  myTime: { color: '#AFC2DF' },
  composerWrap: { backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#DEE6F0', paddingHorizontal: 10, paddingTop: 8 },
  composer: { minHeight: 48, borderRadius: 24, backgroundColor: '#F2F5F9', borderWidth: 1, borderColor: '#DCE4EE', paddingLeft: 15, paddingRight: 5, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, maxHeight: 100, color: '#263A5C', fontSize: 14, paddingVertical: 8 },
  send: { width: 40, height: 40, borderRadius: 20, backgroundColor: yellow, alignItems: 'center', justifyContent: 'center' },
  sendOff: { opacity: 0.45 },
  sendIcon: { color: navy, fontSize: 18, fontWeight: '900' },
});

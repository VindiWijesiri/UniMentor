import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios from 'axios';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { chatRepository } from '../../../data/repositories/chatRepository';
import type { ChatMessage } from '../../../domain/entities/ChatMessage';
import { useAuthStore } from '../../../domain/stores/authStore';
import type { AppStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<AppStackParamList, 'Chat'>;

const formatTime = (date: string) =>
  new Date(date).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { mentor } = route.params;
  const currentUser = useAuthStore((state) => state.user);
  const userId = currentUser?._id;
  const isMentorLoggedIn = currentUser?.role === 'mentor';
  const isPartnerStudent = mentor.role === 'student';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Message Edit Modal
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState('');
  const [updating, setUpdating] = useState(false);

  // Voice Note Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Audio Playback Simulation
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [playbackSeconds, setPlaybackSeconds] = useState<Record<string, number>>({});
  const playbackTimerRef = useRef<any>(null);

  // In-App Live Voice Call Modal
  const [showCallModal, setShowCallModal] = useState(false);
  const [callState, setCallState] = useState<'connecting' | 'ringing' | 'connected'>('connecting');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const callTimerRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Attachment Sheet Modal
  const [showAttachmentSheet, setShowAttachmentSheet] = useState(false);

  // Reactions state (local message reaction mapping)
  const [reactions, setReactions] = useState<Record<string, string>>({});

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
            ? requestError.response?.data?.message || 'Unable to load conversation.'
            : 'Unable to load conversation.';
          setError(message);
        }
      } finally {
        if (active && showLoader) setLoading(false);
      }
    };

    void loadMessages(true);
    const poller = setInterval(() => void loadMessages(), 3500);
    return () => {
      active = false;
      clearInterval(poller);
    };
  }, [mentor._id]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  // Pulsing animation for call screen
  useEffect(() => {
    if (showCallModal) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [showCallModal, pulseAnim]);

  // Send Text Message
  const sendMessage = async (customText?: string) => {
    const text = (customText || draft).trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const message = await chatRepository.send(mentor._id, text);
      setMessages((current) =>
        current.some(({ _id }) => _id === message._id) ? current : [...current, message]
      );
      if (!customText) setDraft('');
      setError('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? requestError.response?.data?.message || 'Message could not be sent.'
        : 'Message could not be sent.';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  // Start Voice Note Recording
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Cancel Voice Note Recording
  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // Send Voice Note
  const finishAndSendVoiceNote = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const duration = Math.max(recordingSeconds, 3);
    setIsRecording(false);
    setRecordingSeconds(0);
    setSending(true);

    try {
      const generatedWaveform = Array.from({ length: 14 }, () =>
        Math.floor(25 + Math.random() * 70)
      );
      const message = await chatRepository.send(mentor._id, {
        text: `Voice note (${duration}s)`,
        messageType: 'voice',
        voiceDuration: duration,
        voiceWaveform: generatedWaveform,
      });

      setMessages((current) =>
        current.some(({ _id }) => _id === message._id) ? current : [...current, message]
      );
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    } catch {
      Alert.alert('Error', 'Could not send voice note.');
    } finally {
      setSending(false);
    }
  };

  // Play / Pause Voice Message
  const togglePlayAudio = (message: ChatMessage) => {
    const isPlayingThis = playingAudioId === message._id;
    if (isPlayingThis) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      setPlayingAudioId(null);
      return;
    }

    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setPlayingAudioId(message._id);

    const totalDuration = message.voiceDuration || 10;
    const startSec =
      (playbackSeconds[message._id] || 0) >= totalDuration
        ? 0
        : playbackSeconds[message._id] || 0;
    setPlaybackSeconds((prev) => ({ ...prev, [message._id]: startSec }));

    playbackTimerRef.current = setInterval(() => {
      setPlaybackSeconds((prev) => {
        const cur = (prev[message._id] || 0) + 1;
        if (cur >= totalDuration) {
          if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
          setPlayingAudioId(null);
          return { ...prev, [message._id]: 0 };
        }
        return { ...prev, [message._id]: cur };
      });
    }, 1000);
  };

  // In-App Call Logic
  const startLiveCall = () => {
    setShowCallModal(true);
    setCallState('connecting');
    setCallSeconds(0);

    setTimeout(() => {
      setCallState('ringing');
    }, 1200);

    setTimeout(() => {
      setCallState('connected');
      callTimerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }, 2800);
  };

  const endLiveCall = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    const durationMins = Math.floor(callSeconds / 60);
    const durationSecs = callSeconds % 60;
    const timeFormatted = `${durationMins}m ${durationSecs}s`;

    setShowCallModal(false);
    setCallSeconds(0);

    if (callSeconds > 2) {
      void sendMessage(`📞 Voice call ended • Duration ${timeFormatted}`);
    }
  };

  // Quick Emoji Reaction
  const handleReactToMessage = (messageId: string, emoji: string) => {
    setReactions((prev) => ({ ...prev, [messageId]: emoji }));
  };

  // Message Edit
  const handleEditPress = (message: ChatMessage) => {
    setEditingMessage(message);
    setEditText(message.text);
  };

  const handleSaveEdit = async () => {
    if (!editingMessage || !editText.trim()) return;
    setUpdating(true);
    try {
      const updated = await chatRepository.update(editingMessage._id, editText.trim());
      setMessages((current) => current.map((m) => (m._id === updated._id ? updated : m)));
      setEditingMessage(null);
      setEditText('');
    } catch {
      Alert.alert('Error', 'Could not update message.');
    } finally {
      setUpdating(false);
    }
  };

  // Message Delete
  const handleDeleteMessage = (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatRepository.delete(messageId);
            setMessages((current) => current.filter((m) => m._id !== messageId));
          } catch {
            Alert.alert('Error', 'Could not delete message.');
          }
        },
      },
    ]);
  };

  // Clear Conversation
  const handleClearConversation = () => {
    Alert.alert('Clear Chat', 'Clear all messages in this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatRepository.deleteConversation(mentor._id);
            setMessages([]);
          } catch {
            Alert.alert('Error', 'Could not clear conversation.');
          }
        },
      },
    ]);
  };

  // Academic Icebreakers
  const icebreakers = isMentorLoggedIn
    ? [
        '📅 Propose Mentoring Session',
        '💡 Let me know your doubts on the module',
        '📝 Send me your code / lab sheet',
        '👍 Well done on completing the exercises!',
      ]
    : [
        '📅 Can we reschedule our session?',
        '❓ Question on Data Structures recursion',
        '💻 Review my code implementation',
        '📚 Do you have past paper model answers?',
        '⏰ Are you free for a 30m review today?',
      ];

  const formatCallDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{mentor.name.charAt(0).toUpperCase()}</Text>
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.headerCopy}>
          <Text style={styles.name} numberOfLines={1}>
            {mentor.name}
          </Text>
          <Text style={styles.status}>
            {isPartnerStudent
              ? `Student • ${mentor.degreeProgramme || 'Peer Mentee'}`
              : `Peer Mentor • ${mentor.hourlyRate ? mentor.hourlyRate + ' LKR/hr' : 'Verified Tutor'}`}
          </Text>
        </View>

        {/* Live Audio Call Button */}
        <TouchableOpacity style={styles.callHeaderBtn} onPress={startLiveCall} activeOpacity={0.8}>
          <Ionicons name="call" size={17} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Clear Chat Button */}
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={handleClearConversation}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Message List */}
      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color="#061E47" size="large" />
          <Text style={styles.loadingText}>Connecting to private peer channel...</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.messageList,
            messages.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIcon}>
                <MaterialCommunityIcons name="chat-processing-outline" size={26} color="#F59E0B" />
              </View>
              <Text style={styles.welcomeTitle}>Private Mentoring Chat</Text>
              <Text style={styles.welcomeText}>
                {isMentorLoggedIn
                  ? `You are in a direct channel with ${mentor.name}. Guide their learning, send voice feedback, and schedule revision sessions.`
                  : `Discuss module concepts, ask questions, send voice notes, and coordinate peer mentoring with ${mentor.name}.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const mine = String(item.sender) === userId;
            const isVoice = item.messageType === 'voice';
            const isSystem = item.messageType === 'system' || item.text.startsWith('📞 Voice call');
            const reaction = reactions[item._id];
            const isPlayingThis = playingAudioId === item._id;
            const playSec = playbackSeconds[item._id] || 0;
            const totalVoiceSec = item.voiceDuration || 12;
            const waveform = item.voiceWaveform || [30, 60, 45, 90, 75, 40, 65, 80, 50, 70, 35, 60];

            if (isSystem) {
              return (
                <View style={styles.systemNoticeWrap}>
                  <View style={styles.systemNoticePill}>
                    <Text style={styles.systemNoticeText}>{item.text}</Text>
                    <Text style={styles.systemNoticeTime}>{formatTime(item.createdAt)}</Text>
                  </View>
                </View>
              );
            }

            return (
              <View style={[styles.messageRow, mine && styles.messageRowMine]}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onLongPress={() => {
                    Alert.alert(
                      'Message Options',
                      item.text,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: '👍 Like', onPress: () => handleReactToMessage(item._id, '👍') },
                        { text: '💡 Helpful', onPress: () => handleReactToMessage(item._id, '💡') },
                        ...(mine
                          ? [
                              { text: '✏️ Edit', onPress: () => handleEditPress(item) },
                              {
                                text: '🗑️ Delete',
                                style: 'destructive' as const,
                                onPress: () => handleDeleteMessage(item._id),
                              },
                            ]
                          : []),
                      ]
                    );
                  }}
                  style={[
                    styles.bubble,
                    mine ? styles.myBubble : styles.theirBubble,
                    isVoice && (mine ? styles.myVoiceBubble : styles.theirVoiceBubble),
                  ]}
                >
                  {/* Voice Note Message Player */}
                  {isVoice ? (
                    <View style={styles.voicePlayerWrap}>
                      <TouchableOpacity
                        style={[styles.voicePlayBtn, mine && styles.voicePlayBtnMine]}
                        onPress={() => togglePlayAudio(item)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isPlayingThis ? 'pause' : 'play'}
                          size={18}
                          color={mine ? '#FFFFFF' : '#061E47'}
                          style={{ marginLeft: isPlayingThis ? 0 : 2 }}
                        />
                      </TouchableOpacity>

                      <View style={styles.waveformWrap}>
                        <View style={styles.waveformBars}>
                          {waveform.map((amp, idx) => {
                            const barProgress = (idx / waveform.length) * totalVoiceSec;
                            const isActive = isPlayingThis && playSec >= barProgress;
                            return (
                              <View
                                key={idx}
                                style={[
                                  styles.waveformBar,
                                  { height: Math.max(amp * 0.28, 6) },
                                  isActive && styles.waveformBarActive,
                                  mine && !isActive && styles.waveformBarMine,
                                ]}
                              />
                            );
                          })}
                        </View>
                        <View style={styles.voiceTimeRow}>
                          <Text style={[styles.voiceTimeText, mine && styles.voiceTimeTextMine]}>
                            {isPlayingThis
                              ? `0:${playSec.toString().padStart(2, '0')}`
                              : `0:${totalVoiceSec.toString().padStart(2, '0')}`}
                          </Text>
                          <View style={styles.voiceTagRow}>
                            <MaterialCommunityIcons
                              name="microphone"
                              size={12}
                              color={mine ? '#FDE68A' : '#64748B'}
                            />
                            <Text style={[styles.voiceTag, mine && styles.voiceTagMine]}>
                              Voice note
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ) : (
                    /* Regular Text Message */
                    <Text style={[styles.messageText, mine && styles.myMessageText]}>
                      {item.text}
                    </Text>
                  )}

                  {/* Reaction Badge */}
                  {reaction ? (
                    <View style={styles.reactionBadge}>
                      <Text style={styles.reactionEmoji}>{reaction}</Text>
                    </View>
                  ) : null}

                  {/* Message Meta Info */}
                  <View style={styles.messageMeta}>
                    <Text style={[styles.time, mine && styles.myTime]}>
                      {formatTime(item.createdAt)}
                    </Text>
                    {mine && <Text style={styles.readMark}>{item.read ? '✓✓' : '✓'}</Text>}
                  </View>

                  {/* Action buttons on my text messages */}
                  {mine && !isVoice && (
                    <View style={styles.bubbleActions}>
                      <TouchableOpacity
                        onPress={() => handleEditPress(item)}
                        style={styles.bubbleActionBtn}
                      >
                        <Text style={styles.bubbleActionText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteMessage(item._id)}
                        style={styles.bubbleActionBtn}
                      >
                        <Text style={styles.bubbleActionText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Academic Quick Action Chips (Icebreakers) */}
      {!isRecording && (
        <View style={styles.icebreakersWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.icebreakersContent}
          >
            {icebreakers.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.icebreakerChip}
                onPress={() => setDraft(chip)}
                activeOpacity={0.8}
              >
                <Text style={styles.icebreakerText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ================= COMPOSER & VOICE RECORDER BAR ================= */}
      <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {isRecording ? (
          /* Live Recording Studio Bar */
          <View style={styles.recordingBar}>
            <View style={styles.recordingIndicator}>
              <View style={styles.redRecordDot} />
              <MaterialCommunityIcons name="microphone" size={16} color="#EF4444" style={{ marginLeft: 2 }} />
              <Text style={styles.recordingTimerText}>
                0:{recordingSeconds.toString().padStart(2, '0')}
              </Text>
            </View>

            <View style={styles.recordingWaveVisual}>
              {[12, 28, 20, 36, 16, 32, 24, 18].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.liveWaveBar,
                    { height: h + (recordingSeconds % 2 === 0 ? 6 : -4) },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity style={styles.cancelRecordBtn} onPress={cancelRecording}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendRecordBtn}
              onPress={finishAndSendVoiceNote}
              activeOpacity={0.85}
            >
              <Ionicons name="send" size={15} color="#FFFFFF" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        ) : (
          /* Standard Composer Bar */
          <View style={styles.composer}>
            {/* Attachment Button */}
            <TouchableOpacity
              style={styles.attachmentBtn}
              onPress={() => setShowAttachmentSheet(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="attach" size={22} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              value={draft}
              onChangeText={setDraft}
              style={styles.input}
              placeholder="Type a message or send voice note..."
              placeholderTextColor="#8B98AE"
              multiline
              maxLength={3000}
            />

            {draft.trim().length > 0 ? (
              /* Send Text Button */
              <TouchableOpacity
                style={[styles.sendButton, sending && styles.sendButtonDisabled]}
                onPress={() => void sendMessage()}
                disabled={sending}
                activeOpacity={0.84}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            ) : (
              /* WhatsApp Voice Record Button */
              <TouchableOpacity
                style={styles.micButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="microphone" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ================= IN-APP LIVE VOICE CALL MODAL ================= */}
      <Modal
        visible={showCallModal}
        animationType="slide"
        transparent={false}
        onRequestClose={endLiveCall}
      >
        <View style={styles.callScreen}>
          {/* Top Info */}
          <View style={[styles.callTop, { paddingTop: insets.top + 20 }]}>
            <Text style={styles.callAppTag}>UNIMENTOR • SECURE PEER CALL</Text>
            <Text style={styles.callPartnerName}>{mentor.name}</Text>
            <Text style={styles.callPartnerRole}>
              {isPartnerStudent ? 'Student Peer Mentee' : 'Verified Peer Mentor'}
            </Text>
            <Text style={styles.callStatusText}>
              {callState === 'connecting' && 'Connecting to peer server...'}
              {callState === 'ringing' && 'Ringing...'}
              {callState === 'connected' && `Call in progress • ${formatCallDuration(callSeconds)}`}
            </Text>
          </View>

          {/* Avatar with Pulsing Soundwave Circles */}
          <View style={styles.callCenter}>
            <Animated.View
              style={[
                styles.pulseCircleOuter,
                { transform: [{ scale: pulseAnim }], opacity: callState === 'connected' ? 0.35 : 0.15 },
              ]}
            />
            <View style={styles.callAvatarCircle}>
              <Text style={styles.callAvatarInitial}>{mentor.name.charAt(0).toUpperCase()}</Text>
            </View>
          </View>

          {/* Interactive Call Controls */}
          <View style={[styles.callControls, { paddingBottom: insets.bottom + 24 }]}>
            {/* Mute Button */}
            <TouchableOpacity
              style={[styles.callControlBtn, isMuted && styles.callControlBtnActive]}
              onPress={() => setIsMuted(!isMuted)}
            >
              <MaterialCommunityIcons
                name={isMuted ? 'microphone-off' : 'microphone'}
                size={26}
                color="#FFFFFF"
              />
              <Text style={styles.callControlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
            </TouchableOpacity>

            {/* Speaker Button */}
            <TouchableOpacity
              style={[styles.callControlBtn, isSpeakerOn && styles.callControlBtnActive]}
              onPress={() => setIsSpeakerOn(!isSpeakerOn)}
            >
              <Ionicons
                name={isSpeakerOn ? 'volume-high' : 'volume-mute'}
                size={26}
                color="#FFFFFF"
              />
              <Text style={styles.callControlLabel}>{isSpeakerOn ? 'Speaker' : 'Earpiece'}</Text>
            </TouchableOpacity>

            {/* End Call Button */}
            <TouchableOpacity style={styles.endCallBtn} onPress={endLiveCall} activeOpacity={0.85}>
              <Ionicons
                name="call"
                size={28}
                color="#FFFFFF"
                style={{ transform: [{ rotate: '135deg' }] }}
              />
              <Text style={styles.endCallLabel}>End Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= ATTACHMENT SHEET MODAL ================= */}
      <Modal
        visible={showAttachmentSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentSheet(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowAttachmentSheet(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Academic Attachments & Sharing</Text>
            <Text style={styles.sheetSubtitle}>
              Share code snippets, exam questions, or schedule mentoring.
            </Text>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setShowAttachmentSheet(false);
                setDraft(
                  "```typescript\n// Code snippet for discussion:\nfunction traverse(node) {\n  if (!node) return;\n  // ...\n}\n```"
                );
              }}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="code-slash" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOptionTitle}>Share Code Snippet</Text>
                <Text style={styles.sheetOptionDesc}>Insert formatted syntax block for peer debugging</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setShowAttachmentSheet(false);
                void sendMessage("📄 Shared Document: Past Paper Solution (June 2025 - IT2040).pdf");
              }}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-text" size={22} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOptionTitle}>Past Paper / Revision Sheet</Text>
                <Text style={styles.sheetOptionDesc}>Send reference lecture notes or question PDF</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setShowAttachmentSheet(false);
                void sendMessage("📅 Peer Session Request: Can we schedule a 1-on-1 session for tomorrow at 10:00 AM?");
              }}
            >
              <View style={[styles.sheetOptionIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="calendar" size={22} color="#15803D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetOptionTitle}>Propose Session Booking</Text>
                <Text style={styles.sheetOptionDesc}>Request or confirm a 1-on-1 peer mentoring slot</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLink}
              onPress={() => setShowAttachmentSheet(false)}
            >
              <Text style={styles.cancelLinkText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ================= EDIT MESSAGE MODAL ================= */}
      <Modal
        visible={editingMessage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingMessage(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setEditingMessage(null)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>✏️ Edit Message</Text>
            <Text style={styles.sheetSubtitle}>Update your sent message text</Text>

            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              placeholder="Edit your message..."
              placeholderTextColor="#94A3B8"
              multiline
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.saveEditBtn,
                (!editText.trim() || updating) && styles.saveEditBtnDisabled,
              ]}
              onPress={handleSaveEdit}
              disabled={!editText.trim() || updating}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveEditBtnText}>Update Message</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelLink} onPress={() => setEditingMessage(null)}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const navy = '#061E47';
const yellow = '#F59E0B';
const onlineGreen = '#22C55E';
const whatsappGreen = '#00A884';

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F4F7FB' },
  header: {
    minHeight: 88,
    backgroundColor: navy,
    paddingHorizontal: 13,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  backText: { color: '#FFF', fontSize: 36, lineHeight: 37, marginTop: -3 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#EEF2F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: navy, fontSize: 19, fontWeight: '900' },
  onlineDot: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: onlineGreen,
    borderWidth: 2,
    borderColor: navy,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  name: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  status: { color: '#BFCFE7', fontSize: 10, marginTop: 2 },
  callHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBar: {
    backgroundColor: '#FFF0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F4C9C9',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  errorText: { color: '#A63838', fontSize: 10.5, textAlign: 'center', fontWeight: '700' },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#74839A', fontSize: 12, marginTop: 9, fontWeight: '600' },
  messageList: { paddingHorizontal: 13, paddingTop: 14, paddingBottom: 10 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },

  welcomeCard: {
    alignSelf: 'center',
    width: '88%',
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  welcomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: { color: navy, fontSize: 17, fontWeight: '900', marginTop: 12 },
  welcomeText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },

  messageRow: { alignItems: 'flex-start', marginBottom: 9 },
  messageRowMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 7,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  myBubble: { backgroundColor: navy, borderBottomRightRadius: 4 },
  theirBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  myVoiceBubble: { width: 235 },
  theirVoiceBubble: { width: 235 },

  messageText: { color: '#0F172A', fontSize: 13.5, lineHeight: 19 },
  myMessageText: { color: '#FFF' },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  time: { color: '#8A98AC', fontSize: 9 },
  myTime: { color: '#AFC2DF' },
  readMark: { color: yellow, fontSize: 10, fontWeight: '900', marginLeft: 4 },

  /* Voice Note Player Inside Bubble */
  voicePlayerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 10,
  },
  voicePlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voicePlayBtnMine: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  waveformWrap: { flex: 1 },
  waveformBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
  },
  waveformBarMine: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  waveformBarActive: {
    backgroundColor: yellow,
  },
  voiceTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  voiceTimeText: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  voiceTimeTextMine: { color: '#E2E8F0' },
  voiceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  voiceTag: { color: '#94A3B8', fontSize: 9, fontWeight: '600' },
  voiceTagMine: { color: '#FDE68A' },

  reactionBadge: {
    position: 'absolute',
    bottom: -8,
    left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  reactionEmoji: { fontSize: 11 },

  systemNoticeWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemNoticePill: {
    backgroundColor: '#EEF2F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  systemNoticeText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  systemNoticeTime: { color: '#94A3B8', fontSize: 9 },

  bubbleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  bubbleActionBtn: { paddingHorizontal: 4, paddingVertical: 2 },
  bubbleActionText: { fontSize: 12 },

  /* Icebreakers */
  icebreakersWrap: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 6,
  },
  icebreakersContent: {
    paddingHorizontal: 12,
    gap: 7,
  },
  icebreakerChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  icebreakerText: { color: '#334155', fontSize: 11, fontWeight: '700' },

  /* Composer & Recorder */
  composerWrap: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  composer: {
    minHeight: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 8,
    paddingRight: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    maxHeight: 90,
    color: '#0F172A',
    fontSize: 13.5,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: yellow,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendButtonDisabled: { opacity: 0.45 },

  /* WhatsApp Voice Button */
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: whatsappGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    shadowColor: whatsappGreen,
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  /* Recording Bar */
  recordingBar: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  redRecordDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
  },
  recordingTimerText: { color: '#B91C1C', fontSize: 12, fontWeight: '800', marginLeft: 3 },
  recordingWaveVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  liveWaveBar: {
    width: 3,
    backgroundColor: '#EF4444',
    borderRadius: 1.5,
  },
  cancelRecordBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sendRecordBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: whatsappGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* In-App Live Call Screen */
  callScreen: {
    flex: 1,
    backgroundColor: '#061E47',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  callTop: {
    alignItems: 'center',
  },
  callAppTag: {
    color: yellow,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  callPartnerName: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 10,
  },
  callPartnerRole: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  callStatusText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  callCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 220,
  },
  pulseCircleOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#38BDF8',
  },
  callAvatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0B2754',
    borderWidth: 3,
    borderColor: yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  callControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  callControlBtnActive: {
    backgroundColor: yellow,
  },
  callControlLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  endCallBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EF4444',
  },
  endCallLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 2,
  },

  /* Modals */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(6,30,71,0.55)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  sheetSubtitle: { color: '#64748B', fontSize: 11, marginTop: 2, marginBottom: 14 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  saveEditBtn: {
    backgroundColor: yellow,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveEditBtnDisabled: { opacity: 0.5 },
  saveEditBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  sheetOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOptionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  sheetOptionDesc: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
});

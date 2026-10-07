import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  sender: 'Alex' | 'You';
  text: string;
  time: string;
  isAttachment?: boolean;
  attachmentName?: string;
  attachmentMeta?: string;
}

interface ResourceItem {
  id: string;
  title: string;
  meta: string;
  type: 'file' | 'link';
  fileType?: 'pdf' | 'sql' | 'doc';
  url?: string;
}

const DEFAULT_SLIDES = [
  {
    title: 'Query Plan Walkthrough',
    slideNum: 'Slide 6 of 12',
    code: 'SELECT * FROM enrollments\nWHERE student_id = 2025;',
    before: 'Sequential Scan',
    after: 'Index Scan • 42x faster',
  },
  {
    title: 'B-Tree Index Architecture',
    slideNum: 'Slide 7 of 12',
    code: 'CREATE INDEX idx_student_enrollment\nON enrollments(student_id, semester);',
    before: 'Unindexed Table Scan',
    after: 'Composite B-Tree Lookup • 8.4ms',
  },
  {
    title: 'Nested Join Execution',
    slideNum: 'Slide 8 of 12',
    code: 'EXPLAIN ANALYZE\nSELECT s.name, c.title FROM students s\nJOIN enrollments e ON s.id = e.student_id\nJOIN courses c ON e.course_id = c.id;',
    before: 'Hash Join (1420ms)',
    after: 'Indexed Merge Join (18ms)',
  },
];

export default function LiveSessionRoomScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const session = route?.params?.session || {};

  const tutorName = session.mentorName || session.mentor?.name || 'Alex Ferreira';
  const sessionTitle = session.title || 'Database Performance Lab';

  // Active sub-tab: 'room' | 'chat' | 'resources'
  const [activeTab, setActiveTab] = useState<'room' | 'chat' | 'resources'>('room');

  // Elapsed Session Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(23 * 60 + 18); // Start at 23:18 as in screenshot
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // In-call controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);

  // Slides State
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Leave Confirmation Overlay Modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'Alex',
      text: 'Before we add the index, what do you notice in the execution plan?',
      time: '10:05 AM',
    },
    {
      id: 'm-2',
      sender: 'You',
      text: "It's doing a sequential scan across the whole enrollments table.",
      time: '10:06 AM',
    },
    {
      id: 'm-3',
      sender: 'Alex',
      text: 'Exactly. Watch what changes when we index student_id.',
      time: '10:07 AM',
    },
    {
      id: 'm-4',
      sender: 'Alex',
      text: '',
      time: '10:08 AM',
      isAttachment: true,
      attachmentName: 'Indexing-Cheat-Sheet.pdf',
      attachmentMeta: 'PDF • 1.6 MB',
    },
    {
      id: 'm-5',
      sender: 'You',
      text: 'Got it — the lookup is much faster now. Can we also compare a composite index?',
      time: '10:12 AM',
    },
  ]);
  const [chatInputText, setChatInputText] = useState('');
  const chatScrollRef = useRef<ScrollView>(null);

  const handleSendChatMessage = () => {
    if (!chatInputText.trim()) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: 'You',
      text: chatInputText.trim(),
      time: timeStr,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInputText('');
    setTimeout(() => {
      chatScrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  // Resources State
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>([
    {
      id: 'r-1',
      title: 'Indexing-Cheat-Sheet.pdf',
      meta: 'PDF • 1.6 MB • Shared 10:21 AM',
      type: 'file',
      fileType: 'pdf',
    },
    {
      id: 'r-2',
      title: 'Query-Plan-Examples.sql',
      meta: 'SQL • 24 KB • Shared 10:24 AM',
      type: 'file',
      fileType: 'sql',
    },
    {
      id: 'r-3',
      title: 'PostgreSQL: Using EXPLAIN',
      meta: 'postgresql.org/docs/explain',
      type: 'link',
      url: 'https://www.postgresql.org/docs/current/using-explain.html',
    },
    {
      id: 'r-4',
      title: 'Visualize your query plan',
      meta: 'explain.dalibo.com',
      type: 'link',
      url: 'https://explain.dalibo.com',
    },
  ]);

  // Share Resource Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceLink, setNewResourceLink] = useState('');

  const handleAddResource = () => {
    if (!newResourceTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a resource title.');
      return;
    }
    const newRes: ResourceItem = {
      id: `r-${Date.now()}`,
      title: newResourceTitle.trim(),
      meta: newResourceLink.trim() || 'Shared just now',
      type: newResourceLink.trim().startsWith('http') ? 'link' : 'file',
      fileType: newResourceTitle.endsWith('.sql') ? 'sql' : 'pdf',
      url: newResourceLink.trim() || undefined,
    };
    setResourcesList((prev) => [newRes, ...prev]);
    setShowShareModal(false);
    setNewResourceTitle('');
    setNewResourceLink('');
    Alert.alert('Resource Shared', `"${newRes.title}" is now visible to all session participants.`);
  };

  const handleLeaveConfirm = () => {
    setShowLeaveModal(false);
    if (navigation?.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MainTabs', { screen: 'Sessions' });
    }
  };

  const currentSlide = DEFAULT_SLIDES[currentSlideIdx] || DEFAULT_SLIDES[0];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#061E47" translucent={true} />

      {/* TOP HEADER */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 16) + 6 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setShowLeaveModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            <Text style={styles.headerTitleText}>
              {activeTab === 'room' ? 'Live Session' : activeTab === 'chat' ? 'Live Chat' : 'Resources'}
            </Text>
            <View style={styles.liveHeaderBadge}>
              <View style={styles.livePulsingDot} />
              <Text style={styles.liveHeaderBadgeText}>LIVE</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.brandRow}>
            <Text style={styles.brandUni}>Uni</Text>
            <Text style={styles.brandMentor}>Mentor</Text>
          </View>
        </View>

        {/* SUBHEADER BANNER STRIP */}
        <View style={styles.subHeaderStrip}>
          <View style={styles.subHeaderLeft}>
            <View style={styles.redLiveDot} />
            <Text style={styles.subHeaderTutorText} numberOfLines={1}>
              Live with {tutorName}
            </Text>
          </View>
          <View style={styles.timerBadge}>
            <Ionicons name="time-outline" size={13} color="#D97706" style={{ marginRight: 4 }} />
            <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
          </View>
        </View>
      </View>

      {/* TAB BODY CONTAINER */}
      <View style={styles.bodyContainer}>
        {/* ================= 1. ROOM TAB ================= */}
        {activeTab === 'room' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.roomScrollContent}
          >
            {/* VIDEO FEED CONTAINER */}
            <View style={styles.videoFeedContainer}>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
                }}
                style={styles.presenterVideoImage}
                resizeMode="cover"
              />

              {/* Video Overlay: Recording & Timer */}
              <View style={styles.videoTopOverlayRow}>
                <View style={styles.recordingTag}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording</Text>
                </View>
                <View style={styles.videoTimerTag}>
                  <Ionicons name="time-outline" size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                  <Text style={styles.videoTimerText}>{formatTimer(elapsedSeconds)}</Text>
                </View>
              </View>

              {/* Video Overlay: Presenter Name Badge */}
              <View style={styles.presenterTagBox}>
                <Text style={styles.presenterNameText}>{tutorName}</Text>
                <Text style={styles.presenterSubText}>Tutor • Presenting</Text>
              </View>

              {/* Video Overlay: Picture-in-Picture (PiP) Student Thumbnail */}
              <View style={styles.pipThumbnailBox}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=300&q=80',
                  }}
                  style={styles.pipImage}
                />
                <View style={styles.pipLabelBadge}>
                  <Text style={styles.pipLabelText}>You</Text>
                </View>
              </View>
            </View>

            {/* INTERACTIVE CODE / PRESENTATION CARD */}
            <View style={styles.presentationCard}>
              <View style={styles.presentationHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.screenShareIconBox}>
                    <Ionicons name="desktop-outline" size={14} color="#D97706" />
                  </View>
                  <Text style={styles.presentationTitleText}>{currentSlide.title}</Text>
                </View>
                <Text style={styles.slideCounterText}>{currentSlide.slideNum}</Text>
              </View>

              {/* Monospace Code Editor View */}
              <View style={styles.codeSnippetBox}>
                <Text style={styles.codeText}>{currentSlide.code}</Text>
                <View style={styles.codeComparisonFooter}>
                  <Text style={styles.codeBeforeScanText}>Before: {currentSlide.before}</Text>
                  <Text style={styles.codeAfterScanText}>After: {currentSlide.after}</Text>
                </View>
              </View>

              {/* Slide Navigation Buttons */}
              <View style={styles.slideControlsRow}>
                <TouchableOpacity
                  style={[styles.slideNavBtn, currentSlideIdx === 0 && styles.slideNavBtnDisabled]}
                  disabled={currentSlideIdx === 0}
                  onPress={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={14} color={currentSlideIdx === 0 ? '#94A3B8' : '#0D4F9E'} />
                  <Text style={[styles.slideNavBtnText, currentSlideIdx === 0 && { color: '#94A3B8' }]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.slideNavBtn,
                    currentSlideIdx === DEFAULT_SLIDES.length - 1 && styles.slideNavBtnDisabled,
                  ]}
                  disabled={currentSlideIdx === DEFAULT_SLIDES.length - 1}
                  onPress={() =>
                    setCurrentSlideIdx((prev) => Math.min(DEFAULT_SLIDES.length - 1, prev + 1))
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.slideNavBtnText,
                      currentSlideIdx === DEFAULT_SLIDES.length - 1 && { color: '#94A3B8' },
                    ]}
                  >
                    Next Slide
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={currentSlideIdx === DEFAULT_SLIDES.length - 1 ? '#94A3B8' : '#0D4F9E'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* IN-CALL CONTROLS ROW */}
            <View style={styles.controlsRow}>
              {/* Mute Button */}
              <TouchableOpacity
                style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
                onPress={() => setIsMuted(!isMuted)}
                activeOpacity={0.8}
              >
                <View style={[styles.controlIconCircle, isMuted && styles.controlIconCircleRed]}>
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={20}
                    color={isMuted ? '#EF4444' : '#0F172A'}
                  />
                </View>
                <Text style={styles.controlBtnLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
              </TouchableOpacity>

              {/* Camera Button */}
              <TouchableOpacity
                style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
                onPress={() => setIsCameraOff(!isCameraOff)}
                activeOpacity={0.8}
              >
                <View style={[styles.controlIconCircle, isCameraOff && styles.controlIconCircleRed]}>
                  <Ionicons
                    name={isCameraOff ? 'videocam-off' : 'videocam'}
                    size={20}
                    color={isCameraOff ? '#EF4444' : '#0F172A'}
                  />
                </View>
                <Text style={styles.controlBtnLabel}>{isCameraOff ? 'Camera On' : 'Camera'}</Text>
              </TouchableOpacity>

              {/* Raise Hand Button */}
              <TouchableOpacity
                style={[styles.controlBtn, isHandRaised && styles.controlBtnActive]}
                onPress={() => {
                  setIsHandRaised(!isHandRaised);
                  if (!isHandRaised) {
                    Alert.alert('Hand Raised', 'Alex has been notified that you have a question.');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.controlIconCircle, isHandRaised && styles.controlIconCircleGold]}>
                  <Ionicons
                    name="hand-right"
                    size={20}
                    color={isHandRaised ? '#D97706' : '#0F172A'}
                  />
                </View>
                <Text style={styles.controlBtnLabel}>{isHandRaised ? 'Lower Hand' : 'Raise Hand'}</Text>
              </TouchableOpacity>
            </View>

            {/* LEAVE SESSION BUTTON */}
            <TouchableOpacity
              style={styles.leaveSessionBtn}
              onPress={() => setShowLeaveModal(true)}
              activeOpacity={0.88}
            >
              <Ionicons name="call-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.leaveSessionBtnText}>Leave session</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        )}

        {/* ================= 2. LIVE CHAT TAB ================= */}
        {activeTab === 'chat' && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatScroll}
              contentContainerStyle={styles.chatContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Date Header Pill */}
              <View style={styles.chatDatePillWrapper}>
                <View style={styles.chatDatePill}>
                  <Text style={styles.chatDatePillText}>TODAY • SESSION CHAT</Text>
                </View>
              </View>

              {/* Chat Message List */}
              {chatMessages.map((msg) => {
                const isMe = msg.sender === 'You';
                return (
                  <View
                    key={msg.id}
                    style={[styles.chatBubbleRow, isMe ? styles.chatBubbleRowMe : styles.chatBubbleRowOther]}
                  >
                    {!isMe && (
                      <View style={styles.chatSenderAvatarCircle}>
                        <Text style={styles.chatSenderAvatarInitial}>{msg.sender.charAt(0)}</Text>
                      </View>
                    )}

                    <View style={{ maxWidth: '78%' }}>
                      <Text style={[styles.chatSenderNameText, isMe && { textAlign: 'right' }]}>
                        {msg.sender} <Text style={styles.chatMsgTimeText}>{msg.time}</Text>
                      </Text>

                      {msg.isAttachment ? (
                        <View style={styles.chatAttachmentCard}>
                          <View style={styles.chatPdfIconBox}>
                            <Ionicons name="document-text" size={20} color="#DC2626" />
                          </View>
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.chatAttachmentNameText} numberOfLines={1}>
                              {msg.attachmentName}
                            </Text>
                            <Text style={styles.chatAttachmentMetaText}>{msg.attachmentMeta}</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.chatDownloadBtn}
                            onPress={() => Alert.alert('Downloaded', `"${msg.attachmentName}" saved to your documents.`)}
                          >
                            <Ionicons name="download-outline" size={16} color="#0D4F9E" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View
                          style={[
                            styles.chatBubbleBox,
                            isMe ? styles.chatBubbleBoxMe : styles.chatBubbleBoxOther,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chatBubbleText,
                              isMe ? styles.chatBubbleTextMe : styles.chatBubbleTextOther,
                            ]}
                          >
                            {msg.text}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              {/* Typing Indicator */}
              <View style={styles.typingIndicatorRow}>
                <View style={styles.chatSenderAvatarCircleMini}>
                  <Text style={styles.chatSenderAvatarInitialMini}>A</Text>
                </View>
                <View style={styles.typingBubble}>
                  <Text style={styles.typingText}>Alex is typing...</Text>
                </View>
              </View>
            </ScrollView>

            {/* Chat Input Bar */}
            <View style={styles.chatInputBar}>
              <TouchableOpacity
                style={styles.chatAttachBtn}
                onPress={() => Alert.alert('Attach File', 'Select document or whiteboard snapshot to share in chat.')}
                activeOpacity={0.7}
              >
                <Ionicons name="attach" size={22} color="#64748B" />
              </TouchableOpacity>
              <TextInput
                style={styles.chatTextInput}
                placeholder={`Message ${tutorName.split(' ')[0]}...`}
                placeholderTextColor="#94A3B8"
                value={chatInputText}
                onChangeText={setChatInputText}
                onSubmitEditing={handleSendChatMessage}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.chatSendBtn, !chatInputText.trim() && styles.chatSendBtnDisabled]}
                onPress={handleSendChatMessage}
                disabled={!chatInputText.trim()}
                activeOpacity={0.85}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {/* ================= 3. RESOURCES TAB ================= */}
        {activeTab === 'resources' && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resourcesScrollContent}
          >
            {/* Header info */}
            <Text style={styles.resourcesSectionLabel}>SHARED DURING THIS SESSION</Text>
            <View style={styles.resourcesHeaderRow}>
              <Text style={styles.resourcesHeading}>Session Resources</Text>
              <View style={styles.resourcesCountPill}>
                <Text style={styles.resourcesCountPillText}>{resourcesList.length} items</Text>
              </View>
            </View>

            {/* Yellow Banner Card */}
            <View style={styles.resourcesNoticeBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resourcesNoticeTitle}>Everything in one place</Text>
                <Text style={styles.resourcesNoticeSub}>Available after the session ends</Text>
              </View>
              <View style={styles.resourcesNoticeStatPill}>
                <Ionicons name="folder-outline" size={13} color="#92400E" style={{ marginRight: 4 }} />
                <Text style={styles.resourcesNoticeStatText}>
                  {resourcesList.filter((r) => r.type === 'file').length} files •{' '}
                  {resourcesList.filter((r) => r.type === 'link').length} links
                </Text>
              </View>
            </View>

            {/* Section: FILES FROM ALEX */}
            <Text style={styles.resourcesSubSectionLabel}>FILES FROM {tutorName.toUpperCase()}</Text>
            {resourcesList
              .filter((r) => r.type === 'file')
              .map((file) => (
                <View key={file.id} style={styles.resourceCardItem}>
                  <View
                    style={[
                      styles.resourceFileIconBox,
                      file.fileType === 'pdf' ? { backgroundColor: '#FEE2E2' } : { backgroundColor: '#EFF6FF' },
                    ]}
                  >
                    <Ionicons
                      name={file.fileType === 'pdf' ? 'document-text' : 'code-slash'}
                      size={20}
                      color={file.fileType === 'pdf' ? '#DC2626' : '#1D4ED8'}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.resourceCardTitle} numberOfLines={1}>
                      {file.title}
                    </Text>
                    <Text style={styles.resourceCardMeta}>{file.meta}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.resourceActionBtn}
                    onPress={() => Alert.alert('Download Started', `"${file.title}" is downloading.`)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="download-outline" size={18} color="#0D4F9E" />
                  </TouchableOpacity>
                </View>
              ))}

            {/* Section: HELPFUL LINKS */}
            <Text style={[styles.resourcesSubSectionLabel, { marginTop: 18 }]}>HELPFUL LINKS</Text>
            {resourcesList
              .filter((r) => r.type === 'link')
              .map((linkItem) => (
                <View key={linkItem.id} style={styles.resourceCardItem}>
                  <View style={[styles.resourceFileIconBox, { backgroundColor: '#F3E8FF' }]}>
                    <Ionicons name="globe-outline" size={20} color="#7E22CE" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.resourceCardTitle} numberOfLines={1}>
                      {linkItem.title}
                    </Text>
                    <Text style={styles.resourceCardMeta}>{linkItem.meta}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.resourceActionBtn}
                    onPress={() => {
                      if (linkItem.url) {
                        Linking.openURL(linkItem.url).catch(() => {
                          Alert.alert('Link Notice', `Opening: ${linkItem.url}`);
                        });
                      } else {
                        Alert.alert('Link Notice', `Opening: ${linkItem.title}`);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="open-outline" size={18} color="#0D4F9E" />
                  </TouchableOpacity>
                </View>
              ))}

            {/* Share a new resource card */}
            <TouchableOpacity
              style={styles.shareNewResourceCard}
              onPress={() => setShowShareModal(true)}
              activeOpacity={0.88}
            >
              <View style={styles.shareResourceLeft}>
                <View style={styles.sharePlusCircle}>
                  <Ionicons name="add" size={18} color="#D97706" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.shareResourceTitle}>Share a new resource</Text>
                  <Text style={styles.shareResourceSub}>Upload a file or paste a helpful link</Text>
                </View>
              </View>
              <View style={styles.shareActionPill}>
                <Text style={styles.shareActionPillText}>Share</Text>
              </View>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        )}
      </View>

      {/* BOTTOM TAB NAVIGATION BAR */}
      <View style={[styles.bottomTabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity
          style={[styles.tabBarItem, activeTab === 'room' && styles.tabBarItemActive]}
          onPress={() => setActiveTab('room')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'room' ? 'videocam' : 'videocam-outline'}
            size={20}
            color={activeTab === 'room' ? '#D97706' : '#64748B'}
          />
          <Text style={[styles.tabBarLabel, activeTab === 'room' && styles.tabBarLabelActive]}>
            Room
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBarItem, activeTab === 'chat' && styles.tabBarItemActive]}
          onPress={() => setActiveTab('chat')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'chat' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
            size={20}
            color={activeTab === 'chat' ? '#D97706' : '#64748B'}
          />
          <Text style={[styles.tabBarLabel, activeTab === 'chat' && styles.tabBarLabelActive]}>
            Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBarItem, activeTab === 'resources' && styles.tabBarItemActive]}
          onPress={() => setActiveTab('resources')}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeTab === 'resources' ? 'folder-open' : 'folder-open-outline'}
            size={20}
            color={activeTab === 'resources' ? '#D97706' : '#64748B'}
          />
          <Text style={[styles.tabBarLabel, activeTab === 'resources' && styles.tabBarLabelActive]}>
            Resources
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================= LEAVE SESSION CONFIRMATION OVERLAY MODAL ================= */}
      <Modal
        visible={showLeaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLeaveModal(false)}
      >
        <View style={styles.leaveModalOverlay}>
          <View style={styles.leaveModalCard}>
            {/* Soft coral icon circle */}
            <View style={styles.leaveIconCircle}>
              <Ionicons name="log-out-outline" size={26} color="#E11D48" />
            </View>

            <Text style={styles.leaveModalTitle}>Leave this session?</Text>
            <Text style={styles.leaveModalSubtitle}>
              You'll disconnect from {tutorName} and the live presentation. You can rejoin while the
              session is still active.
            </Text>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.leaveModalConfirmBtn}
              onPress={handleLeaveConfirm}
              activeOpacity={0.88}
            >
              <Text style={styles.leaveModalConfirmText}>Leave session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.leaveModalCancelBtn}
              onPress={() => setShowLeaveModal(false)}
              activeOpacity={0.75}
            >
              <Text style={styles.leaveModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= SHARE RESOURCE MODAL ================= */}
      <Modal
        visible={showShareModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareModal(false)}
      >
        <View style={styles.leaveModalOverlay}>
          <View style={[styles.leaveModalCard, { width: width * 0.9 }]}>
            <Text style={styles.shareModalHeading}>Share Resource in Session</Text>
            <Text style={styles.shareModalSub}>
              Share cheatsheets, code samples, or reference documentation with the room.
            </Text>

            <Text style={styles.inputFieldLabel}>TITLE / DOCUMENT NAME *</Text>
            <TextInput
              style={styles.modalTextInput}
              value={newResourceTitle}
              onChangeText={setNewResourceTitle}
              placeholder="e.g. Graph-Traversals-Summary.pdf"
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.inputFieldLabel, { marginTop: 12 }]}>OPTIONAL LINK / URL</Text>
            <TextInput
              style={styles.modalTextInput}
              value={newResourceLink}
              onChangeText={setNewResourceLink}
              placeholder="https://..."
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
            />

            <View style={styles.shareModalBtnRow}>
              <TouchableOpacity
                style={styles.shareModalCancelBtn}
                onPress={() => setShowShareModal(false)}
              >
                <Text style={styles.shareModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareModalSubmitBtn}
                onPress={handleAddResource}
              >
                <Text style={styles.shareModalSubmitText}>Share Live</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#061E47',
  },
  headerContainer: {
    backgroundColor: '#061E47',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  liveHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
    marginLeft: 6,
  },
  livePulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandUni: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandMentor: {
    fontSize: 18,
    fontWeight: '900',
    color: '#F59E0B',
  },
  subHeaderStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  subHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  redLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DC2626',
  },
  subHeaderTutorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },

  bodyContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. ROOM TAB STYLES
  roomScrollContent: {
    padding: 16,
  },
  videoFeedContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: { elevation: 4 },
    }),
  },
  presenterVideoImage: {
    width: '100%',
    height: '100%',
  },
  videoTopOverlayRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recordingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoTimerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoTimerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  presenterTagBox: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  presenterNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  presenterSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#93C5FD',
  },
  pipThumbnailBox: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 72,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: '#1E293B',
  },
  pipImage: {
    width: '100%',
    height: '100%',
  },
  pipLabelBadge: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  pipLabelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Presentation card
  presentationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  presentationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  screenShareIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentationTitleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  slideCounterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  codeSnippetBox: {
    backgroundColor: '#061E47',
    borderRadius: 10,
    padding: 12,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#67E8F9',
    lineHeight: 18,
  },
  codeComparisonFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    marginTop: 10,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  codeBeforeScanText: {
    fontSize: 10,
    color: '#FCA5A5',
    fontWeight: '600',
  },
  codeAfterScanText: {
    fontSize: 10,
    color: '#6EE7B7',
    fontWeight: '700',
  },
  slideControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 6,
  },
  slideNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  slideNavBtnDisabled: {
    opacity: 0.5,
  },
  slideNavBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D4F9E',
  },

  // Controls Row
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  controlBtn: {
    alignItems: 'center',
    gap: 5,
  },
  controlBtnActive: {},
  controlIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  controlIconCircleRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  controlIconCircleGold: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  controlBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // Leave Session Button
  leaveSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E11D48',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#E11D48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  leaveSessionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // 2. CHAT TAB STYLES
  chatScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatContentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  chatDatePillWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  chatDatePill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chatDatePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  chatBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 8,
  },
  chatBubbleRowMe: {
    justifyContent: 'flex-end',
  },
  chatBubbleRowOther: {
    justifyContent: 'flex-start',
  },
  chatSenderAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0D4F9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSenderAvatarInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  chatSenderNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 3,
  },
  chatMsgTimeText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#94A3B8',
  },
  chatBubbleBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  chatBubbleBoxMe: {
    backgroundColor: '#061E47',
    borderBottomRightRadius: 4,
  },
  chatBubbleBoxOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatBubbleTextMe: {
    color: '#FFFFFF',
  },
  chatBubbleTextOther: {
    color: '#0F172A',
  },
  chatAttachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minWidth: 220,
  },
  chatPdfIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAttachmentNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  chatAttachmentMetaText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  chatDownloadBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  chatSenderAvatarCircleMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D4F9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSenderAvatarInitialMini: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  typingBubble: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  typingText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  chatInputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  chatAttachBtn: {
    padding: 6,
  },
  chatTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0F172A',
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },

  // 3. RESOURCES TAB STYLES
  resourcesScrollContent: {
    padding: 16,
  },
  resourcesSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  resourcesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  resourcesHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  resourcesCountPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resourcesCountPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  resourcesNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  resourcesNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#78350F',
  },
  resourcesNoticeSub: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 1,
  },
  resourcesNoticeStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resourcesNoticeStatText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78350F',
  },
  resourcesSubSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  resourceCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resourceFileIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  resourceCardMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  resourceActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareNewResourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  shareResourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  sharePlusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareResourceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#78350F',
  },
  shareResourceSub: {
    fontSize: 10,
    color: '#92400E',
    marginTop: 1,
  },
  shareActionPill: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  shareActionPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#061E47',
  },

  // BOTTOM TAB BAR
  bottomTabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  tabBarItem: {
    alignItems: 'center',
    gap: 3,
    flex: 1,
    paddingVertical: 2,
  },
  tabBarItemActive: {},
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBarLabelActive: {
    color: '#D97706',
    fontWeight: '800',
  },

  // LEAVE CONFIRMATION OVERLAY MODAL
  leaveModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 30, 71, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  leaveModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  leaveIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  leaveModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  leaveModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  leaveModalConfirmBtn: {
    width: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  leaveModalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  leaveModalCancelBtn: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  leaveModalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // SHARE RESOURCE MODAL
  shareModalHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  shareModalSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputFieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    alignSelf: 'flex-start',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modalTextInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  shareModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  shareModalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  shareModalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  shareModalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#061E47',
  },
  shareModalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

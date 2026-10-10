import { Platform } from 'react-native';

export interface ParticipantMediaState {
  id: string;
  name: string;
  role: 'mentor' | 'student';
  avatar?: string;
  isCameraOn: boolean;
  isMicOn: boolean;
  isSpeaking: boolean;
  isHandRaised?: boolean;
  audioLevel: number; // 0 - 100
  streamBitrate: number; // kbps
  videoResolution: string;
  joinedAt: string;
}

export interface LiveRoomState {
  sessionId: string;
  sessionTitle: string;
  moduleCode: string;
  moduleName: string;
  tutor: ParticipantMediaState;
  student: ParticipantMediaState;
  activeSpeaker: 'tutor' | 'student' | 'none';
  audioQuality: string;
  videoQuality: string;
  latencyMs: number;
  noiseSuppressionEnabled: boolean;
  audioOutput: 'speaker' | 'earpiece' | 'headphones';
  isRecording: boolean;
  updatedAt: number;
}

type RoomListener = (state: LiveRoomState) => void;

class LiveSessionRoomRepository {
  private rooms: Map<string, LiveRoomState> = new Map();
  private listeners: Map<string, Set<RoomListener>> = new Map();

  private createDefaultRoom(sessionId: string, tutorName = 'Alex Ferreira', studentName = 'Student Attendee'): LiveRoomState {
    return {
      sessionId,
      sessionTitle: 'Interactive Peer Mentoring Session',
      moduleCode: 'IT2040',
      moduleName: 'Data Structures & Algorithms',
      tutor: {
        id: 'tutor-host',
        name: tutorName,
        role: 'mentor',
        isCameraOn: true,
        isMicOn: true,
        isSpeaking: true,
        audioLevel: 72,
        streamBitrate: 2450,
        videoResolution: '1080p FHD • 60 FPS',
        joinedAt: new Date().toISOString(),
      },
      student: {
        id: 'student-client',
        name: studentName,
        role: 'student',
        isCameraOn: true,
        isMicOn: true,
        isSpeaking: false,
        isHandRaised: false,
        audioLevel: 15,
        streamBitrate: 1980,
        videoResolution: '720p HD • 30 FPS',
        joinedAt: new Date().toISOString(),
      },
      activeSpeaker: 'tutor',
      audioQuality: '48 kHz Stereo • Opus HD Voice',
      videoQuality: '1080p 60fps • VP9 Hardware Accel',
      latencyMs: 18,
      noiseSuppressionEnabled: true,
      audioOutput: 'speaker',
      isRecording: true,
      updatedAt: Date.now(),
    };
  }

  getRoomState(sessionId: string, initialTutorName?: string, initialStudentName?: string): LiveRoomState {
    const key = sessionId || 'default-room';
    if (!this.rooms.has(key)) {
      this.rooms.set(key, this.createDefaultRoom(key, initialTutorName, initialStudentName));
    }
    const current = this.rooms.get(key)!;
    if (initialTutorName && (!current.tutor.name || current.tutor.name === 'Alex Ferreira')) {
      current.tutor.name = initialTutorName;
    }
    if (initialStudentName && (!current.student.name || current.student.name === 'Student Attendee')) {
      current.student.name = initialStudentName;
    }
    return { ...current };
  }

  updateParticipantState(
    sessionId: string,
    role: 'tutor' | 'student',
    updates: Partial<ParticipantMediaState>
  ): LiveRoomState {
    const key = sessionId || 'default-room';
    const room = this.getRoomState(key);

    if (role === 'tutor') {
      room.tutor = { ...room.tutor, ...updates };
      if (updates.isSpeaking !== undefined) {
        room.activeSpeaker = updates.isSpeaking ? 'tutor' : room.student.isSpeaking ? 'student' : 'none';
      }
    } else {
      room.student = { ...room.student, ...updates };
      if (updates.isSpeaking !== undefined) {
        room.activeSpeaker = updates.isSpeaking ? 'student' : room.tutor.isSpeaking ? 'tutor' : 'none';
      }
    }

    room.updatedAt = Date.now();
    this.rooms.set(key, room);
    this.notify(key, room);
    return { ...room };
  }

  updateRoomSettings(sessionId: string, updates: Partial<LiveRoomState>): LiveRoomState {
    const key = sessionId || 'default-room';
    const room = this.getRoomState(key);
    const updated = { ...room, ...updates, updatedAt: Date.now() };
    this.rooms.set(key, updated);
    this.notify(key, updated);
    return { ...updated };
  }

  subscribe(sessionId: string, listener: RoomListener): () => void {
    const key = sessionId || 'default-room';
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      this.listeners.get(key)?.delete(listener);
    };
  }

  private notify(sessionId: string, state: LiveRoomState) {
    const key = sessionId || 'default-room';
    this.listeners.get(key)?.forEach((fn) => {
      try {
        fn({ ...state });
      } catch (e) {
        console.error('[LiveSessionRoomRepository] listener error:', e);
      }
    });
  }

  /**
   * Safe audio voice synthesis helper (runs on Web, no native crashing on iOS/Android)
   */
  speakText(text: string, voicePitch = 1.0, voiceRate = 1.0) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = voicePitch;
        utterance.rate = voiceRate;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.log('[LiveSessionRoomRepository] Speech synthesis not available:', err);
      }
    }
  }
}

export const liveSessionRoomRepository = new LiveSessionRoomRepository();
export default liveSessionRoomRepository;

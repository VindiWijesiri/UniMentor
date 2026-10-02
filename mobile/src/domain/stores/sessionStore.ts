import { create } from 'zustand';
import { Session } from '../entities/Session';
import { sessionRepository } from '../../data/repositories/sessionRepository';

interface SessionState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  bookSession: (payload: {
    mentorId: string;
    subject: string;
    scheduledAt: string;
    notes?: string;
  }) => Promise<Session>;
  updateSession: (
    sessionId: string,
    payload: {
      subject?: string;
      scheduledAt?: string;
      notes?: string;
      status?: string;
      mentorId?: string;
    }
  ) => Promise<void>;
  cancelSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  loading: false,
  error: null,

  fetchSessions: async () => {
    set({ loading: true, error: null });
    try {
      const data = await sessionRepository.getMySessions();
      set({ sessions: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load sessions', loading: false });
    }
  },

  bookSession: async (payload) => {
    set({ loading: true, error: null });
    try {
      const newSession = await sessionRepository.bookSession(payload);
      set({
        sessions: [newSession, ...get().sessions],
        loading: false,
      });
      return newSession;
    } catch {
      // Local optimistic fallback
      const localSession: Session = {
        _id: `session-local-${Date.now()}`,
        studentId: 'student-me',
        mentorId: payload.mentorId,
        subject: payload.subject,
        scheduledAt: payload.scheduledAt,
        status: 'pending',
        notes: payload.notes,
      };
      set({
        sessions: [localSession, ...get().sessions],
        loading: false,
      });
      return localSession;
    }
  },

  updateSession: async (sessionId, payload) => {
    const prevSessions = get().sessions;
    const updated = prevSessions.map((s) =>
      s._id === sessionId
        ? {
            ...s,
            ...(payload.subject && { subject: payload.subject }),
            ...(payload.scheduledAt && { scheduledAt: payload.scheduledAt }),
            ...(payload.notes !== undefined && { notes: payload.notes }),
            ...(payload.status && { status: payload.status as any }),
            ...(payload.mentorId && {
              mentorId:
                typeof s.mentorId === 'object' && s.mentorId !== null
                  ? { ...s.mentorId, _id: payload.mentorId }
                  : payload.mentorId,
            }),
          }
        : s
    );
    set({ sessions: updated });

    if (!sessionId.startsWith('session-local-')) {
      try {
        const res = await sessionRepository.updateSession(sessionId, payload);
        if (res && res._id) {
          set({
            sessions: get().sessions.map((s) => (s._id === sessionId ? res : s)),
          });
        }
      } catch (err: any) {
        console.warn('Backend updateSession error:', err?.message);
      }
    }
  },

  cancelSession: async (sessionId) => {
    const updated = get().sessions.map((s) =>
      s._id === sessionId ? { ...s, status: 'cancelled' as const } : s
    );
    set({ sessions: updated });

    if (!sessionId.startsWith('session-local-')) {
      try {
        await sessionRepository.cancelSession(sessionId);
      } catch {
        // Optimistic update retained
      }
    }
  },

  deleteSession: async (sessionId) => {
    const filtered = get().sessions.filter((s) => s._id !== sessionId);
    set({ sessions: filtered });

    if (!sessionId.startsWith('session-local-')) {
      try {
        await sessionRepository.deleteSession(sessionId);
      } catch {
        // Optimistic delete retained
      }
    }
  },
}));

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDynamicDate } from './tutorSettingsRepository';

export interface TutorSlotRequest {
  id: string;
  mentorId: string;
  mentorName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  subject: string;
  date: string;
  time: string;
  duration?: string;
  studyMode: '1-on-1' | 'group';
  notes?: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

const STORAGE_KEY = 'unimentor_tutor_slot_requests_v1';

const INITIAL_REQUESTS: TutorSlotRequest[] = [
  {
    id: 'req-sample-1',
    mentorId: 'demo-tutor-1',
    mentorName: 'Tharushi Perera',
    studentId: 'student-kavindu',
    studentName: 'Kavindu Perera',
    studentEmail: 'kavindu.p@sliit.lk',
    subject: 'Data Structures & Algorithms',
    date: getDynamicDate(0),
    time: '03:30 PM',
    duration: '60 Mins',
    studyMode: '1-on-1',
    notes: 'Need focused assistance understanding recursive tree traversals.',
    requestedAt: '10 mins ago',
    status: 'pending',
  },
];

let inMemoryRequests: TutorSlotRequest[] | null = null;
const listeners = new Set<() => void>();

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch {}
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {}
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('Listener error in tutorRequestRepository:', e);
    }
  });
}

async function ensureLoaded(): Promise<TutorSlotRequest[]> {
  if (inMemoryRequests !== null) {
    return inMemoryRequests;
  }

  try {
    const raw = await getStorageItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        inMemoryRequests = parsed;
        return inMemoryRequests;
      }
    }
  } catch {}

  inMemoryRequests = [...INITIAL_REQUESTS];
  await setStorageItem(STORAGE_KEY, JSON.stringify(inMemoryRequests));
  return inMemoryRequests;
}

export const tutorRequestRepository = {
  async getRequestsForTutor(
    mentorId?: string,
    mentorName?: string
  ): Promise<TutorSlotRequest[]> {
    const list = await ensureLoaded();
    if (!mentorId && !mentorName) return list;

    const mIdClean = (mentorId || '').toLowerCase().trim();
    const mNameClean = (mentorName || '').toLowerCase().trim();

    return list.filter((r) => {
      const rMId = (r.mentorId || '').toLowerCase().trim();
      const rMName = (r.mentorName || '').toLowerCase().trim();

      // Exact or partial ID match
      if (mIdClean && (rMId === mIdClean || rMId.includes(mIdClean) || mIdClean.includes(rMId))) {
        return true;
      }

      // Mentor Name match
      if (mNameClean && rMName && (rMName.includes(mNameClean) || mNameClean.includes(rMName))) {
        return true;
      }

      // Alias matching for demo tutors
      if (
        (mIdClean === 'demo-tutor-1' || mIdClean === 'mentor-demo-1' || mNameClean.includes('tharushi')) &&
        (rMId === 'demo-tutor-1' || rMId === 'mentor-demo-1' || rMName.includes('tharushi'))
      ) {
        return true;
      }

      return false;
    });
  },

  async getAllRequests(): Promise<TutorSlotRequest[]> {
    return await ensureLoaded();
  },

  async createRequest(
    data: Omit<TutorSlotRequest, 'id' | 'requestedAt' | 'status'>
  ): Promise<TutorSlotRequest> {
    const list = await ensureLoaded();
    const newReq: TutorSlotRequest = {
      ...data,
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestedAt: 'Just now',
      status: 'pending',
    };

    const updated = [newReq, ...list];
    inMemoryRequests = updated;
    await setStorageItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
    return newReq;
  },

  async updateRequestStatus(
    requestId: string,
    status: 'accepted' | 'declined'
  ): Promise<void> {
    const list = await ensureLoaded();
    const updated = list.map((r) => (r.id === requestId ? { ...r, status } : r));
    inMemoryRequests = updated;
    await setStorageItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
  },

  async deleteRequest(requestId: string): Promise<void> {
    const list = await ensureLoaded();
    const updated = list.filter((r) => r.id !== requestId);
    inMemoryRequests = updated;
    await setStorageItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

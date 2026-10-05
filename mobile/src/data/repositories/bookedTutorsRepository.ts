import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface BookedTutorItem {
  id: string;
  mentor: {
    id: string;
    name: string;
    roleTitle?: string;
    avatar?: string;
    rating?: number;
    reviewCount?: number;
    hourlyRate?: number;
    subjects?: string[];
    email?: string;
    bio?: string;
  };
  moduleCode: string;
  moduleName: string;
  nextSession: string;
  studyMode?: '1-on-1' | 'group';
  groupSize?: number;
  bookedAt: string;
}

const STORAGE_KEY = 'unimentor_booked_tutors_v1';

const DEFAULT_BOOKED_TUTORS: BookedTutorItem[] = [
  {
    id: 'seed-shenal',
    mentor: {
      id: 'mentor-shenal',
      name: 'Shenal Perera',
      roleTitle: 'Senior Peer Mentor',
      avatar: undefined,
      rating: 4.9,
      reviewCount: 38,
      hourlyRate: 1200,
      subjects: ['Mobile App Development', 'React Native'],
    },
    moduleCode: 'IT3020',
    moduleName: 'Mobile Application Development',
    nextSession: 'Friday, 19 Sep 2025 • 4:00 PM',
    studyMode: 'group',
    groupSize: 3,
    bookedAt: '2025-09-15T09:00:00.000Z',
  },
  {
    id: 'seed-alex',
    mentor: {
      id: 'mentor-alex',
      name: 'Alex Ferreira',
      roleTitle: 'Senior Peer Mentor',
      avatar: undefined,
      rating: 4.9,
      reviewCount: 48,
      hourlyRate: 2500,
      subjects: ['Database Systems', 'SQL'],
    },
    moduleCode: 'IT2020',
    moduleName: 'Database Systems',
    nextSession: 'Monday, 22 Sep 2025 • 6:30 PM',
    studyMode: '1-on-1',
    bookedAt: '2025-09-15T10:00:00.000Z',
  },
];

let inMemoryBookedTutors: BookedTutorItem[] | null = null;
const listeners = new Set<(tutors: BookedTutorItem[]) => void>();

async function getStorageItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setStorageItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    // fallback to memory
  }
}

function notifyListeners(tutors: BookedTutorItem[]) {
  listeners.forEach((listener) => {
    try {
      listener(tutors);
    } catch (e) {
      console.warn('Listener error in bookedTutorsRepository:', e);
    }
  });
}

export const bookedTutorsRepository = {
  async getBookedTutors(): Promise<BookedTutorItem[]> {
    if (inMemoryBookedTutors !== null) {
      return inMemoryBookedTutors;
    }

    try {
      const stored = await getStorageItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasGroup = parsed.some((p: BookedTutorItem) => p.studyMode === 'group');
          if (!hasGroup) {
            const merged = [DEFAULT_BOOKED_TUTORS[0], ...parsed];
            inMemoryBookedTutors = merged;
            await setStorageItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          }
          inMemoryBookedTutors = parsed;
          return parsed;
        }
      }
    } catch {
      // Use defaults
    }

    inMemoryBookedTutors = [...DEFAULT_BOOKED_TUTORS];
    await setStorageItem(STORAGE_KEY, JSON.stringify(inMemoryBookedTutors));
    return inMemoryBookedTutors;
  },

  async addBookedTutor(item: BookedTutorItem): Promise<BookedTutorItem[]> {
    const current = await this.getBookedTutors();
    // Check if tutor is already booked (by mentor id or name)
    const mentorId = item.mentor.id || item.mentor.name;
    const filtered = current.filter(
      (b) => (b.mentor.id || b.mentor.name).toLowerCase() !== mentorId.toLowerCase()
    );

    const updated = [item, ...filtered];
    inMemoryBookedTutors = updated;
    await setStorageItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
    return updated;
  },

  async removeBookedTutor(idOrMentorId: string): Promise<BookedTutorItem[]> {
    const current = await this.getBookedTutors();
    const updated = current.filter(
      (b) => b.id !== idOrMentorId && b.mentor.id !== idOrMentorId
    );
    inMemoryBookedTutors = updated;
    await setStorageItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
    return updated;
  },

  subscribe(callback: (tutors: BookedTutorItem[]) => void): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};

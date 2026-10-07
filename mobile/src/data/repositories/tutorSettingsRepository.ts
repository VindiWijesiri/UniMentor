import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface TutorBookingSettings {
  mentorId: string;
  mentorName: string;
  profileImage?: string | null;
  hourlyRate1on1: number;
  hourlyRateGroup: number;
  teachingModules: string[];
  subjectPreferences: string[];
  availableDates: string[];
}

const STORAGE_KEY = 'unimentor_tutor_settings_v2';

const DEFAULT_SETTINGS: Record<string, TutorBookingSettings> = {
  'mentor-alex': {
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    profileImage: null,
    hourlyRate1on1: 2500,
    hourlyRateGroup: 1200,
    teachingModules: [
      'Database Management Systems',
      'Data Structures & Algorithms',
    ],
    subjectPreferences: [
      'Query Optimization',
      'Indexing',
      'ER Diagrams',
      'Normalization',
      'Transactions & ACID',
      'NoSQL & MongoDB',
    ],
    availableDates: [
      'Friday, 19 Sep 2025',
      'Saturday, 20 Sep 2025',
      'Monday, 22 Sep 2025',
      'Tuesday, 23 Sep 2025',
      'Thursday, 25 Sep 2025',
    ],
  },
  'demo-tutor-1': {
    mentorId: 'demo-tutor-1',
    mentorName: 'Tharushi Perera',
    profileImage: null,
    hourlyRate1on1: 2200,
    hourlyRateGroup: 1100,
    teachingModules: [
      'Data Structures & Algorithms',
      'Object Oriented Programming',
    ],
    subjectPreferences: [
      'Graph Traversals & BFS/DFS',
      'Binary Search Trees',
      'Time Complexity & Big-O',
      'Dynamic Programming',
    ],
    availableDates: [
      'Friday, 19 Sep 2025',
      'Saturday, 20 Sep 2025',
      'Sunday, 21 Sep 2025',
      'Wednesday, 24 Sep 2025',
    ],
  },
  'mentor-tharushi-1': {
    mentorId: 'mentor-tharushi-1',
    mentorName: 'Tharushi Perera',
    profileImage: null,
    hourlyRate1on1: 2200,
    hourlyRateGroup: 1100,
    teachingModules: [
      'Data Structures & Algorithms',
      'Object Oriented Programming',
    ],
    subjectPreferences: [
      'Graph Traversals & BFS/DFS',
      'Binary Search Trees',
      'Time Complexity & Big-O',
      'Dynamic Programming',
    ],
    availableDates: [
      'Friday, 19 Sep 2025',
      'Saturday, 20 Sep 2025',
      'Sunday, 21 Sep 2025',
      'Wednesday, 24 Sep 2025',
    ],
  },
  'mentor-shenal': {
    mentorId: 'mentor-shenal',
    mentorName: 'Shenal Perera',
    profileImage: null,
    hourlyRate1on1: 2400,
    hourlyRateGroup: 1200,
    teachingModules: [
      'Mobile Application Development',
      'Web Development & Cloud',
    ],
    subjectPreferences: [
      'React Native & Expo',
      'State Management (Redux/Zustand)',
      'Async Storage & APIs',
      'Mobile UI/UX Design',
    ],
    availableDates: [
      'Friday, 19 Sep 2025',
      'Saturday, 20 Sep 2025',
      'Monday, 22 Sep 2025',
    ],
  },
  'mentor-kaveen-2': {
    mentorId: 'mentor-kaveen-2',
    mentorName: 'Kaveen De Silva',
    profileImage: null,
    hourlyRate1on1: 2600,
    hourlyRateGroup: 1300,
    teachingModules: [
      'Software Architecture & Design',
      'Web Development & Cloud',
    ],
    subjectPreferences: [
      'Design Patterns & Clean Code',
      'Microservices Architecture',
      'REST & GraphQL APIs',
      'Cloud Deployment',
    ],
    availableDates: [
      'Saturday, 20 Sep 2025',
      'Monday, 22 Sep 2025',
      'Thursday, 25 Sep 2025',
    ],
  },
  'mentor-sanduni-3': {
    mentorId: 'mentor-sanduni-3',
    mentorName: 'Sanduni Fernando',
    profileImage: null,
    hourlyRate1on1: 2200,
    hourlyRateGroup: 1100,
    teachingModules: [
      'Database Management Systems',
      'Machine Learning Systems',
    ],
    subjectPreferences: [
      'Relational Schema Design',
      'SQL Query Optimization',
      'Feature Engineering',
      'Model Evaluation',
    ],
    availableDates: [
      'Friday, 19 Sep 2025',
      'Tuesday, 23 Sep 2025',
      'Wednesday, 24 Sep 2025',
    ],
  },
  'mentor-asanka-4': {
    mentorId: 'mentor-asanka-4',
    mentorName: 'Dr. Asanka Perera',
    profileImage: null,
    hourlyRate1on1: 4500,
    hourlyRateGroup: 2000,
    teachingModules: [
      'Probability & Statistics',
      'Discrete Mathematics',
    ],
    subjectPreferences: [
      'Conditional Probability & Bayes',
      'Distributions & Hypothesis Testing',
      'Graph Theory & Combinatorics',
    ],
    availableDates: [
      'Saturday, 20 Sep 2025',
      'Sunday, 21 Sep 2025',
    ],
  },
};

let inMemorySettings: Record<string, TutorBookingSettings> | null = null;
const listeners = new Set<(settingsMap: Record<string, TutorBookingSettings>) => void>();

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
    // Fallback in memory
  }
}

function notifyListeners(map: Record<string, TutorBookingSettings>) {
  listeners.forEach((listener) => {
    try {
      listener(map);
    } catch (e) {
      console.warn('Listener error in tutorSettingsRepository:', e);
    }
  });
}

async function ensureLoaded(): Promise<Record<string, TutorBookingSettings>> {
  if (inMemorySettings !== null) {
    return inMemorySettings;
  }

  try {
    const raw = await getStorageItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Merge with defaults so new mentors have defaults
        const merged: Record<string, TutorBookingSettings> = { ...DEFAULT_SETTINGS, ...parsed };
        inMemorySettings = merged;
        return merged;
      }
    }
  } catch {
    // Use defaults
  }

  const defaults: Record<string, TutorBookingSettings> = { ...DEFAULT_SETTINGS };
  inMemorySettings = defaults;
  await setStorageItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

export const tutorSettingsRepository = {
  async getAllMentorSettings(): Promise<Record<string, TutorBookingSettings>> {
    return await ensureLoaded();
  },

  async getSettings(
    mentorId: string = 'mentor-alex',
    mentorName: string = 'Alex Ferreira'
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const key = mentorId || 'mentor-alex';

    if (!map[key]) {
      // Find default matching by name if mentorId is dynamically generated
      const matchingByName = Object.values(map).find(
        (m) => m.mentorName.toLowerCase() === mentorName.toLowerCase()
      );

      map[key] = matchingByName
        ? { ...matchingByName, mentorId: key, mentorName }
        : {
            mentorId: key,
            mentorName,
            profileImage: null,
            hourlyRate1on1: 2500,
            hourlyRateGroup: 1200,
            teachingModules: [
              'Database Management Systems',
              'Data Structures & Algorithms',
            ],
            subjectPreferences: [
              'Query Optimization',
              'Indexing',
              'ER Diagrams',
              'Normalization',
            ],
            availableDates: [
              'Friday, 19 Sep 2025',
              'Saturday, 20 Sep 2025',
              'Monday, 22 Sep 2025',
              'Tuesday, 23 Sep 2025',
            ],
          };
      await setStorageItem(STORAGE_KEY, JSON.stringify(map));
      notifyListeners(map);
    }

    return { ...map[key] };
  },

  async saveSettings(
    settings: Partial<TutorBookingSettings> & { mentorId?: string; mentorName?: string }
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const mentorId = settings.mentorId || 'mentor-alex';
    const mentorName = settings.mentorName || 'Alex Ferreira';
    const current = await this.getSettings(mentorId, mentorName);

    const updated: TutorBookingSettings = {
      ...current,
      ...(settings.mentorName !== undefined ? { mentorName: settings.mentorName } : {}),
      ...(settings.profileImage !== undefined ? { profileImage: settings.profileImage } : {}),
      ...(settings.hourlyRate1on1 !== undefined ? { hourlyRate1on1: settings.hourlyRate1on1 } : {}),
      ...(settings.hourlyRateGroup !== undefined ? { hourlyRateGroup: settings.hourlyRateGroup } : {}),
      ...(settings.teachingModules !== undefined ? { teachingModules: [...settings.teachingModules] } : {}),
      ...(settings.subjectPreferences !== undefined ? { subjectPreferences: [...settings.subjectPreferences] } : {}),
      ...(settings.availableDates !== undefined ? { availableDates: [...settings.availableDates] } : {}),
    };

    map[mentorId] = updated;

    // Sync any alias entries with the same mentorName
    Object.keys(map).forEach((k) => {
      if (map[k].mentorName.toLowerCase() === updated.mentorName.toLowerCase()) {
        map[k] = { ...map[k], ...updated, mentorId: k };
      }
    });

    inMemorySettings = map;
    await setStorageItem(STORAGE_KEY, JSON.stringify(map));
    notifyListeners(map);
    return updated;
  },

  async updateTeachingModules(
    mentorId: string = 'mentor-alex',
    teachingModules: string[]
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const current = await this.getSettings(mentorId);
    const updated: TutorBookingSettings = {
      ...current,
      teachingModules: [...teachingModules],
    };
    map[mentorId] = updated;

    // Also update any matching key by mentorName so aliases stay synchronized
    Object.keys(map).forEach((k) => {
      if (map[k].mentorName.toLowerCase() === current.mentorName.toLowerCase()) {
        map[k] = { ...map[k], teachingModules: [...teachingModules] };
      }
    });

    inMemorySettings = map;
    await setStorageItem(STORAGE_KEY, JSON.stringify(map));
    notifyListeners(map);
    return updated;
  },

  async addTeachingModule(
    mentorId: string = 'mentor-alex',
    moduleName: string
  ): Promise<TutorBookingSettings> {
    const current = await this.getSettings(mentorId);
    const trimmed = moduleName.trim();
    if (trimmed && !current.teachingModules.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      const updatedList = [...current.teachingModules, trimmed];
      return await this.updateTeachingModules(mentorId, updatedList);
    }
    return current;
  },

  async removeTeachingModule(
    mentorId: string = 'mentor-alex',
    moduleName: string
  ): Promise<TutorBookingSettings> {
    const current = await this.getSettings(mentorId);
    const updatedList = current.teachingModules.filter(
      (m) => m.toLowerCase() !== moduleName.toLowerCase().trim()
    );
    return await this.updateTeachingModules(mentorId, updatedList);
  },

  async updateProfileImage(
    mentorId: string = 'mentor-alex',
    profileImage: string | null
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const current = await this.getSettings(mentorId);
    const updated: TutorBookingSettings = {
      ...current,
      profileImage,
    };
    map[mentorId] = updated;

    // Also synchronize aliases
    Object.keys(map).forEach((k) => {
      if (map[k].mentorName.toLowerCase() === current.mentorName.toLowerCase()) {
        map[k] = { ...map[k], profileImage };
      }
    });

    inMemorySettings = map;
    await setStorageItem(STORAGE_KEY, JSON.stringify(map));
    notifyListeners(map);
    return updated;
  },

  async updateRates(
    mentorId: string = 'mentor-alex',
    rates: { hourlyRate1on1?: number; hourlyRateGroup?: number }
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const current = await this.getSettings(mentorId);
    const updated: TutorBookingSettings = {
      ...current,
      hourlyRate1on1: rates.hourlyRate1on1 ?? current.hourlyRate1on1,
      hourlyRateGroup: rates.hourlyRateGroup ?? current.hourlyRateGroup,
    };
    map[mentorId] = updated;

    Object.keys(map).forEach((k) => {
      if (map[k].mentorName.toLowerCase() === current.mentorName.toLowerCase()) {
        map[k] = {
          ...map[k],
          hourlyRate1on1: rates.hourlyRate1on1 ?? map[k].hourlyRate1on1,
          hourlyRateGroup: rates.hourlyRateGroup ?? map[k].hourlyRateGroup,
        };
      }
    });

    inMemorySettings = map;
    await setStorageItem(STORAGE_KEY, JSON.stringify(map));
    notifyListeners(map);
    return updated;
  },

  async addSubjectPreference(
    mentorId: string = 'mentor-alex',
    topic: string
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const current = await this.getSettings(mentorId);
    const trimmed = topic.trim();
    if (trimmed && !current.subjectPreferences.includes(trimmed)) {
      current.subjectPreferences.push(trimmed);
      map[mentorId] = { ...current };
      inMemorySettings = map;
      await setStorageItem(STORAGE_KEY, JSON.stringify(map));
      notifyListeners(map);
    }
    return { ...current };
  },

  async removeSubjectPreference(
    mentorId: string = 'mentor-alex',
    topic: string
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const current = await this.getSettings(mentorId);
    current.subjectPreferences = current.subjectPreferences.filter((t) => t !== topic);
    map[mentorId] = { ...current };
    inMemorySettings = map;
    await setStorageItem(STORAGE_KEY, JSON.stringify(map));
    notifyListeners(map);
    return { ...current };
  },

  async addAvailableDate(
    mentorId: string = 'mentor-alex',
    date: string
  ): Promise<TutorBookingSettings> {
    const map = await ensureLoaded();
    const current = await this.getSettings(mentorId);
    if (!current.availableDates.includes(date)) {
      current.availableDates.push(date);
      map[mentorId] = { ...current };
      inMemorySettings = map;
      await setStorageItem(STORAGE_KEY, JSON.stringify(map));
      notifyListeners(map);
    }
    return { ...current };
  },

  subscribe(callback: (settingsMap: Record<string, TutorBookingSettings>) => void): () => void {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};

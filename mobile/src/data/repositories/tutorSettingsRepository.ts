export interface TutorBookingSettings {
  mentorId: string;
  mentorName: string;
  profileImage?: string | null;
  hourlyRate1on1: number;
  hourlyRateGroup: number;
  subjectPreferences: string[];
  availableDates: string[];
}

const DEFAULT_SETTINGS: Record<string, TutorBookingSettings> = {
  'mentor-alex': {
    mentorId: 'mentor-alex',
    mentorName: 'Alex Ferreira',
    profileImage: null,
    hourlyRate1on1: 2500,
    hourlyRateGroup: 1200,
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
};

let inMemorySettings: Record<string, TutorBookingSettings> = { ...DEFAULT_SETTINGS };

export const tutorSettingsRepository = {
  async getSettings(mentorId: string = 'mentor-alex', mentorName: string = 'Alex Ferreira'): Promise<TutorBookingSettings> {
    const key = mentorId || 'mentor-alex';
    if (!inMemorySettings[key]) {
      inMemorySettings[key] = {
        mentorId: key,
        mentorName,
        profileImage: null,
        hourlyRate1on1: 2500,
        hourlyRateGroup: 1200,
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
    }
    return { ...inMemorySettings[key] };
  },

  async updateProfileImage(
    mentorId: string = 'mentor-alex',
    profileImage: string | null
  ): Promise<TutorBookingSettings> {
    const current = await this.getSettings(mentorId);
    inMemorySettings[mentorId] = {
      ...current,
      profileImage,
    };
    return { ...inMemorySettings[mentorId] };
  },

  async updateRates(
    mentorId: string = 'mentor-alex',
    rates: { hourlyRate1on1?: number; hourlyRateGroup?: number }
  ): Promise<TutorBookingSettings> {
    const current = await this.getSettings(mentorId);
    inMemorySettings[mentorId] = {
      ...current,
      hourlyRate1on1: rates.hourlyRate1on1 ?? current.hourlyRate1on1,
      hourlyRateGroup: rates.hourlyRateGroup ?? current.hourlyRateGroup,
    };
    return { ...inMemorySettings[mentorId] };
  },

  async addSubjectPreference(
    mentorId: string = 'mentor-alex',
    topic: string
  ): Promise<TutorBookingSettings> {
    const current = await this.getSettings(mentorId);
    const trimmed = topic.trim();
    if (trimmed && !current.subjectPreferences.includes(trimmed)) {
      current.subjectPreferences.push(trimmed);
      inMemorySettings[mentorId] = { ...current };
    }
    return { ...inMemorySettings[mentorId] };
  },

  async removeSubjectPreference(
    mentorId: string = 'mentor-alex',
    topic: string
  ): Promise<TutorBookingSettings> {
    const current = await this.getSettings(mentorId);
    current.subjectPreferences = current.subjectPreferences.filter((t) => t !== topic);
    inMemorySettings[mentorId] = { ...current };
    return { ...inMemorySettings[mentorId] };
  },

  async addAvailableDate(
    mentorId: string = 'mentor-alex',
    date: string
  ): Promise<TutorBookingSettings> {
    const current = await this.getSettings(mentorId);
    if (!current.availableDates.includes(date)) {
      current.availableDates.push(date);
      inMemorySettings[mentorId] = { ...current };
    }
    return { ...inMemorySettings[mentorId] };
  },
};

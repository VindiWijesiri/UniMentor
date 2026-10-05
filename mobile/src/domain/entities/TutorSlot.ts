export interface ConflictInfo {
  existingSessionTitle: string;
  existingWith: string;
  time: string;
}

export interface TutorSlot {
  id: string;
  mentorId: string;
  mentorName: string;
  date: string; // e.g. "19 Sep 2025" or "Friday, 19 Sep 2025"
  startTime: string; // e.g. "09:00 AM"
  endTime: string; // e.g. "10:00 AM"
  timeRange: string; // e.g. "10:00 AM - 11:00 AM"
  type: '1-on-1' | 'group' | 'both';
  maxCapacity: number;
  bookedCount: number;
  module: string;
  hasConflict?: boolean;
  conflictDetails?: ConflictInfo;
  isAvailable: boolean;
}

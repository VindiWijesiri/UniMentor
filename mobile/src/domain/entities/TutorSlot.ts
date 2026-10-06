export interface ConflictInfo {
  existingSessionTitle: string;
  existingWith: string;
  time: string;
}

export interface RegisteredAttendee {
  id?: string;
  studentId?: string;
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  registeredAt: string;
  status: 'confirmed' | 'pending' | 'attended' | 'cancelled';
  bookingType: 'individual' | 'group';
  groupName?: string;
  groupSize?: number;
  notes?: string;
  feePaid?: number;
}

export interface TutorSlot {
  id: string;
  mentorId: string;
  mentorName: string;
  title?: string;
  module: string;
  date: string; // e.g. "19 Sep 2025" or "Friday, 19 Sep 2025"
  startTime: string; // e.g. "09:00 AM"
  endTime: string; // e.g. "10:30 AM"
  duration?: string; // e.g. "90 Mins"
  timeRange: string; // e.g. "09:00 AM - 10:30 AM"
  fee?: number; // e.g. 2500 in LKR
  type: '1-on-1' | 'group' | 'both';
  maxCapacity: number;
  bookedCount: number;
  description?: string;
  prerequisites?: string;
  mode?: 'Online' | 'In-Person' | 'Hybrid';
  location?: string;
  targetBatch?: string;
  registeredAttendees?: RegisteredAttendee[];
  hasConflict?: boolean;
  conflictDetails?: ConflictInfo;
  isAvailable: boolean;
}

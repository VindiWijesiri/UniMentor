export interface Session {
  _id: string;
  mentorId: string;
  studentId: string;
  subject: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isLive?: boolean;
  durationMin?: number;
  moduleCode?: string;
  sessionKind?: 'booking' | 'tutoring';
}

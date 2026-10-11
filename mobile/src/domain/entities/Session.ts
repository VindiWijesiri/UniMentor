export interface SessionMentor {
  _id: string;
  name: string;
  email?: string;
  experience?: string;
  profilePicture?: string;
}

export interface Session {
  _id: string;
  mentorId: string | SessionMentor;
  studentId: string | { _id: string; name: string; email?: string };
  subject: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

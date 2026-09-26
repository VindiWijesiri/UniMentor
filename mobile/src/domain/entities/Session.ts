export interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  subjects?: string[];
  bio?: string;
  profilePicture?: string;
}

export interface Session {
  _id: string;
  mentorId: string | PopulatedUser;
  studentId: string | PopulatedUser;
  subject: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  verificationCode?: string;
  verifiedAt?: string;
  meetingLink?: string;
}

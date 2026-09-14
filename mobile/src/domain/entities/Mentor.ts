export interface Mentor {
  _id: string;
  name: string;
  email: string;
  subjects: string[];
  bio: string;
  rating: number;
  reviewCount?: number;
  profilePicture?: string;
  hourlyRate?: number;
  experience?: string;
  sessionCount?: number;
  availability?: string;
  qualification?: string;
  languages?: string[];
  teachingMode?: string;
  lessonTypes?: string[];
  role?: 'student' | 'mentor';
}

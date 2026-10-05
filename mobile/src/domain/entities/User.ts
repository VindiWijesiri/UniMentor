export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'mentor' | 'admin' | 'lic';
  profilePicture?: string;
  bio?: string;
  subjects?: string[];
  degreeProgramme?: string;
  academicYear?: string;
  semester?: string;
  academicStats?: {
    goals: number;
    plans: number;
    dueTests: number;
    done: number;
  };
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number;
  campusId?: string;
  createdAt: string;
}

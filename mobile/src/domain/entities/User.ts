export type UserRole = 'student' | 'mentor' | 'admin' | 'lic' | 'lecturer';

export type AccountStatus = 'active' | 'pending' | 'under_review' | 'suspended' | 'rejected' | 'expired';

export type VerificationStatus =
  | 'not_submitted'
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'expired';

export interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  faculty?: string;
  department?: string;
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
  createdAt?: string;

  // University & Student details
  campusId?: string;
  university?: string;
  degree?: string;
  studentId?: string;
  phone?: string;

  // Verification & Status
  accountStatus?: AccountStatus;
  verificationStatus?: VerificationStatus;
  rejectionReason?: string;
  idCardFront?: string;
  idCardBack?: string;
  faceVerified?: boolean;

  // Tutor Specific
  approvedModules?: string[];
  pendingModules?: string[];
  totalReviews?: number;
  completedSessions?: number;
  availability?: string;
  availabilitySlots?: { day: number; start: string; end: string }[];
  languages?: string[];
  teachingMode?: string;
  lessonTypes?: string[];
  qualification?: string;
  experience?: string;
}

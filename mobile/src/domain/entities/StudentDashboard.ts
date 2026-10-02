export interface EnrolledMentor {
  id?: string;
  name: string;
  roleTitle?: string;
  batch?: string;
  rating?: number;
  reviewCount?: number;
  avatar?: string;
  isVerified?: boolean;
  activeStudentsCount?: number;
  activeCount?: number;
  subjects?: string[];
  email?: string;
  bio?: string;
  hourlyRate?: number;
}

export interface EnrolledModule {
  code: string;
  name: string;
  credits?: number;
  faculty?: string;
  department?: string;
  progress?: number;
  status?: string;
  nextSession?: string;
  mentor?: EnrolledMentor;
}

export interface AcademicStats {
  goals: number;
  plans: number;
  dueTests: number;
  done: number;
}

export interface DeadlineAlert {
  id: string;
  tag: string;
  title: string;
  moduleCode: string;
  daysLeft: number;
  reviewAction?: string;
  tutorAction?: string;
  tutorQuery?: string;
}

export interface LiveSession {
  id: string;
  tag: string;
  timeRemaining: string;
  title: string;
  moduleCode: string;
  sessionType: string;
  subtitle: string;
  activeParticipants: number;
  mentor: EnrolledMentor;
  roomAction: string;
}

export interface QuickLaunchpadItem {
  key: string;
  label: string;
  icon: string;
  isHighlighted?: boolean;
  badge?: string;
}

export interface StudentDashboardData {
  user: {
    _id?: string;
    name: string;
    email: string;
    role: string;
    profilePicture?: string;
    bio?: string;
    subjects?: string[];
    degreeProgramme?: string;
    academicYear?: string;
    semester?: string;
  };
  academicStats: AcademicStats;
  deadlineAlert: DeadlineAlert;
  liveSession: LiveSession;
  enrolledModules: EnrolledModule[];
  availableMentors: EnrolledMentor[];
  quickLaunchpad?: QuickLaunchpadItem[];
}

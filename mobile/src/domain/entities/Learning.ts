import type { PodFeed } from './Pod';

export type LearningGoal = {
  _id: string;
  title: string;
  dueLabel: string;
  current: number;
  total: number;
  completed: boolean;
  moduleCode?: string;
  progress?: number;
  priority?: string;
  kind?: 'weekly' | 'module';
};

export type LearningActivity = {
  _id: string;
  moduleCode: string;
  moduleName: string;
  topic: string;
  activityType: string;
  done: number;
  total: number;
  minutesLeft: number;
  percent: number;
};

export type LearningSessionLive = {
  _id: string;
  type: string;
  title: string;
  tutorName: string;
  minutesLeft: number;
  moduleCode?: string;
};

export type LearningSessionUpcoming = {
  _id: string;
  title: string;
  moduleCode?: string;
  scheduledAt: string;
};

export type LearningDiscussion = {
  _id: string;
  title: string;
  group: string;
  authorName: string;
  authorInitials: string;
  preview: string;
  votes: number;
  joined: boolean;
  timeAgo?: string;
  createdAt?: string;
};

export type LearningAssessment = {
  _id: string;
  type: 'exam' | 'assignment';
  title: string;
  subject: string;
  scheduledAt?: string;
  dueDate?: string;
  durationMin?: number;
  marks?: number;
  status: 'upcoming' | 'open' | 'submitted';
};

export type LearningMaterial = {
  _id: string;
  title: string;
  kind: 'pdf' | 'set' | 'notes';
  sourceLabel: string;
  sourceType: 'group' | 'session';
  uploadedAt: string;
};

export type LearningPlan = {
  _id: string;
  title: string;
  moduleCode: string;
  dueDate: string;
  status: 'active' | 'upcoming' | 'done';
  progress: number;
};

export type ChatPodMessage = {
  _id: string;
  authorName: string;
  authorInitials: string;
  text: string;
  unread: boolean;
  createdAt: string;
};

export type LearningDashboard = {
  header: { unreadChat: number; initials: string };
  weeklyStudy: {
    hoursDone: number;
    hoursGoal: number;
    percent: number;
    hoursLeft: number;
    days: { day: string; hours: number }[];
  };
  todayGoals: LearningGoal[];
  continueActivity: LearningActivity | null;
  sessions: {
    total: number;
    live: LearningSessionLive | null;
    upcoming: LearningSessionUpcoming[];
  };
  discussions: { total: number; items: LearningDiscussion[] };
  assessments: { dueSoon: number; items: LearningAssessment[] };
  materials: LearningMaterial[];
  podFeed?: PodFeed;
};

export type TutorStudentStatus = 'review' | 'graded' | 'atRisk';

export type TutorQueueStudent = {
  _id: string;
  studentUserId?: string;
  name: string;
  initials: string;
  studentCode: string;
  year: number;
  programme: string;
  moduleCode: string;
  status: TutorStudentStatus;
  priority: number;
  workTitle: string;
  taskLabel?: string;
  questionCount?: number;
  pdfReady?: boolean;
  score?: number;
  maxScore: number;
  packsDownloaded: number;
  classRank?: number;
  midtermPercent?: number;
  feedbackSent?: boolean;
  submittedAgo?: string;
  gradedAgo?: string;
};

export type TutorLearningDashboard = {
  header: { title: string; enrolled: number; cohort: string };
  stats: {
    activeStudents: number;
    newStudents: number;
    pendingGrading: number;
    assignedPacks: number;
    classMastery: number;
    masteryDelta: number;
  };
  filters: { all: number; needsReview: number; atRisk: number };
  queue: TutorQueueStudent[];
  packs: { _id: string; title: string; kind: 'mock' | 'study' | 'recovery'; assignedCount: number }[];
  tools: { plagiarismFlags: number };
};

export type GoalMilestone = {
  id: string;
  title: string;
  detail: string;
  status: 'done' | 'active' | 'locked';
  dueLabel: string;
  progressLabel?: string;
};

export type GoalAssessmentLink = {
  id: string;
  name: string;
  type: 'Exam' | 'Assignment' | 'Quiz';
  dateLabel: string;
  timeLabel: string;
  totalMarks: number;
  targetMark: number;
  weight: number;
  score: number | null;
  statusLabel: string;
  evidence?: string;
  feedback?: string;
};

export type GoalTask = {
  id: string;
  title: string;
  kind: string;
  minutes: number;
  dueLabel: string;
  status: 'open' | 'done';
  goalId?: string;
};

export type GoalTutor = {
  key: string;
  name: string;
  rating: number;
  price: string;
  specialty: string;
  slot: string;
  verified: boolean;
};

export type GoalPlanView = {
  _id: string;
  moduleCode: string;
  moduleName: string;
  title: string;
  summary: string;
  priority: string;
  progress: number;
  gradeLabel: string;
  targetPercent: number;
  targetGrade: string;
  delta: string;
  daysLeft: number;
  dueLabel: string;
  hoursLogged: number;
  supportLabel: string;
  tutorName: string;
  tutorRole: string;
  tutorSlot: string;
  topics: { title: string; score: number; note: string }[];
  analytics: {
    projected: number;
    projectedGrade: string;
    certainty: number;
    baseline: number;
    midterm: number;
    selfStudy: number;
    tutoring: number;
    groups: number;
    pace: string;
  };
  milestones: GoalMilestone[];
  milestoneDone: number;
  milestoneTotal: number;
  assessments: GoalAssessmentLink[];
  tasks: GoalTask[];
  openTasks: number;
  tutors: GoalTutor[];
  sessions: { id: string; title: string; when: string }[];
  credentialId: string;
  completed: boolean;
  seedKey?: string;
};

export type GoalBoard = {
  moduleLabel: string;
  syncedLabel: string;
  weekLabel: string;
  hoursDone: number;
  hoursGoal: number;
  percent: number;
  weeklyGoalId?: string | null;
  days: { label: string; date: number; hours: number; state: 'done' | 'today' | 'open' }[];
  tasks: GoalTask[];
  sessions: { id: string; title: string; when: string }[];
  goals: GoalPlanView[];
};

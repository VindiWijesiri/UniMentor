export type QuestionType =
  | 'mcq'
  | 'true_false'
  | 'short_answer'
  | 'matching'
  | 'fill_blank'
  | 'ordering'
  | 'essay'
  | 'coding'
  | 'file'
  | 'drag_drop'
  | 'case_study';

export interface Question {
  type: QuestionType;
  prompt: string;
  points: number;
  options?: string[];
  correctIndex?: number;
  correctBoolean?: boolean;
  acceptedAnswers?: string[];
  pairs?: { left: string; right: string }[];
  pairLefts?: string[];
  pairRights?: string[];
  orderItems?: string[];
  starterCode?: string;
  rubric?: string;
  buckets?: string[];
  tokens?: { label: string; bucket: string }[];
  tokenLabels?: string[];
  scenario?: string;
}

export interface Assessment {
  _id: string;
  mentorId: { _id: string; name: string } | string;
  title: string;
  subject: string;
  module?: string;
  instructions?: string;
  durationMinutes: number;
  dueAt?: string;
  published: boolean;
  questions: Question[];
}

export interface Submission {
  _id: string;
  assessmentId: Assessment | string;
  studentId: { _id: string; name: string; email: string } | string;
  answers: Record<string, unknown>[];
  score?: number;
  maxScore: number;
  status: 'submitted' | 'graded';
  feedback?: string;
  autoGraded: boolean;
  createdAt?: string;
}

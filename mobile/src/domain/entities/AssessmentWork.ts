export const ASSESSMENT_KINDS = [
  'mcq',
  'true_false',
  'short_answer',
  'fill_blank',
  'matching',
  'ordering',
  'drag_drop',
  'essay',
  'coding',
  'file_project',
  'scenario',
] as const;

export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

export type WorkAnswer = {
  choiceIds?: string[];
  boolean?: boolean | null;
  text?: string;
  blanks?: Record<string, string>;
  matches?: Record<string, string>;
  order?: string[];
  placements?: Record<string, string>;
  files?: { name: string; sizeMb: number }[];
  repoUrl?: string;
  note?: string;
};

export type WorkQuestion = {
  id: string;
  kind: AssessmentKind;
  prompt: string;
  marks: number;
  topic?: string;
  hint?: string;
  manual?: boolean;
  multi?: boolean;
  choices?: { id: string; label: string; detail?: string }[];
  statement?: string;
  definition?: string;
  trueDetail?: string;
  falseDetail?: string;
  formula?: string;
  remember?: string;
  segments?: { text?: string; blankId?: string }[];
  bank?: string[];
  left?: { id: string; title: string; meta?: string }[];
  right?: { id: string; title: string; meta?: string }[];
  steps?: { id: string; title: string; body: string }[];
  buckets?: { id: string; title: string; subtitle?: string }[];
  tokens?: { id: string; label: string }[];
  tags?: string[];
  rubric?: { title: string; detail: string; points: string }[];
  minWords?: number;
  maxWords?: number;
  starter?: string;
  languages?: string[];
  filename?: string;
  starterCode?: string;
  tests?: { name: string; detail?: string }[];
  constraints?: string[];
  checklist?: { label: string; done?: boolean }[];
  accept?: string;
  maxMb?: number;
  scenarioTitle?: string;
  scenarioBody?: string;
  incident?: string;
  pipeline?: { label: string; value: string }[];
  metrics?: { label: string; value: string; note?: string }[];
  trace?: string[];
  objective?: string;
  codeSnippet?: { filename: string; lines: string[] };
  key?: {
    choiceIds?: string[];
    boolean?: boolean;
    text?: string;
    tolerance?: number;
    blanks?: Record<string, string[]>;
    matches?: Record<string, string>;
    order?: string[];
    placements?: Record<string, string>;
    includes?: string[];
  };
};

export type AssessmentCard = {
  paperId: string;
  title: string;
  moduleCode: string;
  moduleName: string;
  kind: AssessmentKind;
  kindLabel: string;
  chips: string[];
  dueLabel: string;
  detail: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  progress: number;
  score: number | null;
  maxScore: number;
  gradeLabel?: string;
  feedback?: string;
  tutorName?: string;
  urgent: boolean;
  bucket: 'dueSoon' | 'inProgress' | 'completed' | 'upcoming';
  action: string;
};

export type AssessmentCenter = {
  cohort: string;
  health: {
    avgScore: number;
    completed: number;
    pending: number;
    urgent: number;
    percentile: string;
    spotlightTitle: string;
    spotlightDetail: string;
    resumePaperId?: string;
  };
  counts: { all: number; dueSoon: number; inProgress: number; completed: number };
  items: AssessmentCard[];
};

export type ImprovementHistory = {
  semester: string;
  weekLabel: string;
  growth: string;
  growthDetail: string;
  cohortRank: string;
  stats: { assessments: number; hours: string; gpa: string };
  target: number;
  modules: string[];
  points: { label: string; value: number }[];
  competencies: { title: string; delta: string; score: number; detail: string }[];
  timeline: {
    id: string;
    moduleCode: string;
    moduleName: string;
    title: string;
    dateLabel: string;
    delta: string;
    beforeLabel: string;
    beforeScore: string;
    midLabel: string;
    midValue: string;
    afterLabel: string;
    afterScore: string;
    quote: string;
    person: string;
    role: string;
    paperId?: string;
  }[];
  focus: { title: string; detail: string; boost: string };
};

export type TakePayload = {
  paper: {
    _id: string;
    title: string;
    moduleCode: string;
    moduleName: string;
    kind: AssessmentKind;
    kindLabel: string;
    durationMin: number;
    marks: number;
    tutorName?: string;
    status: string;
    questions: WorkQuestion[];
  };
  attempt: {
    answers: Record<string, WorkAnswer>;
    flagged: string[];
    questionIndex: number;
    status: string;
    secondsLeft: number;
    preview?: boolean;
  };
};

export type AssessmentResult = {
  paperId: string;
  title: string;
  moduleCode: string;
  moduleName: string;
  kindLabel: string;
  status: string;
  score: number | null;
  maxScore: number;
  gradeLabel?: string;
  feedback?: string;
  tutorName?: string;
  pendingReview: boolean;
  breakdown: {
    questionId: string;
    prompt: string;
    awarded: number;
    max: number;
    correct: boolean;
    note: string;
    expected?: string;
    given?: string;
  }[];
};

export type TutorHubItem = {
  paperId: string;
  moduleCode: string;
  kindLabel: string;
  title: string;
  submitted: number;
  enrolled: number;
  average: number | null;
  closesLabel: string;
  pendingGrade: number;
  status: string;
  reviewNote?: string;
};

export type TutorAssessmentHub = {
  modules: number;
  enrolled: number;
  pendingGrading: number;
  pendingShort: number;
  pendingProjects: number;
  liveTests: number;
  liveParticipants: number;
  classAverage: number;
  averageDelta: number;
  bankCount: number;
  activeCount: number;
  items: TutorHubItem[];
};

export type CatalogItem = {
  _id: string;
  moduleCode: string;
  badge: string;
  title: string;
  author: string;
  priceLabel: string;
  strike?: string;
  meta: string;
  tier: 'premium' | 'free' | 'deal' | 'community';
  detail: string;
};

export type AdminPortal = {
  stats: {
    catalog: number;
    free: number;
    premium: number;
    avgPrice: string;
    span: string;
    cap: string;
    revenue: string;
    tutorShare: string;
    poolShare: string;
    downloads: string;
  };
  policy: string;
  campaign: { title: string; detail: string };
  pendingPapers: {
    paperId: string;
    title: string;
    tutorName: string;
    kindLabel: string;
    moduleCode: string;
    status: string;
    reviewNote?: string;
  }[];
  catalog: CatalogItem[];
};

export type CreatePaperInput = {
  kind: AssessmentKind;
  title: string;
  moduleCode: string;
  moduleName: string;
  kindLabel: string;
  marks: number;
  durationMin: number;
  chips: string[];
  dueLabel?: string;
  detail?: string;
  questions: WorkQuestion[];
  publish: boolean;
};

export const KIND_META: Record<AssessmentKind, { label: string; blurb: string }> = {
  mcq: { label: 'Quiz (MCQ)', blurb: 'Single or multi-select questions' },
  true_false: { label: 'True / False', blurb: 'Statement the student marks correct or incorrect' },
  short_answer: { label: 'Short Answer', blurb: 'Numeric or one-line responses' },
  fill_blank: { label: 'Fill in the Blanks', blurb: 'Sentences with a word bank' },
  matching: { label: 'Matching Pairs', blurb: 'Link each prompt to its answer' },
  ordering: { label: 'Ordering', blurb: 'Put steps in chronological order' },
  drag_drop: { label: 'Drag & Drop', blurb: 'Sort tokens into buckets' },
  essay: { label: 'Essay & Rubric', blurb: 'Long answer scored with a rubric' },
  coding: { label: 'Coding Challenge', blurb: 'Starter code, limits, and tests' },
  file_project: { label: 'File / Project', blurb: 'Archive, PDF, and repository submission' },
  scenario: { label: 'Scenario Case Study', blurb: 'Incident brief and architecture proposals' },
};

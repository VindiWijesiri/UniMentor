export type LibraryKind = 'video' | 'pdf' | 'quiz' | 'audio' | 'code';
export type LibrarySource = 'group' | 'session' | 'live' | 'library';

export type LibraryMaterial = {
  _id: string;
  kind: LibraryKind;
  source: LibrarySource;
  title: string;
  subtitle?: string;
  description?: string;
  moduleCode?: string;
  moduleName?: string;
  durationLabel?: string;
  sizeLabel?: string;
  pageCount?: number;
  fileCount?: number;
  questionCount?: number;
  downloads: number;
  conversation?: string;
  saved: boolean;
  tags: string[];
  createdAt: string;
  body?: string;
  files?: { name: string; language: string; content: string }[];
  questions?: { prompt: string; options: string[] }[];
  watchedPercent?: number;
  quizScore?: number;
  quizBest?: number;
  audioSpeed?: number;
  completed?: boolean;
};

export type LibraryFeed = {
  saved: number;
  offlineItems: number;
  offlineSize: string;
  items: LibraryMaterial[];
};

export type QuizResult = LibraryMaterial & {
  correct: number;
  total: number;
  review: { prompt: string; options: string[]; picked?: number; answer: number; explanation?: string; correct: boolean }[];
};

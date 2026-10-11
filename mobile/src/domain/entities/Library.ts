export type LibraryKind = 'video' | 'pdf' | 'quiz' | 'audio' | 'code' | 'image' | 'text';
export type LibrarySource = 'group' | 'session' | 'live' | 'library';

export type LibraryMaterial = {
  _id: string;
  kind: LibraryKind;
  source: LibrarySource;
  title: string;
  subtitle?: string;
  fromLabel?: string;
  preview?: string;
  ownerName?: string;
  conversationTitle?: string;
  description?: string;
  moduleCode?: string;
  moduleName?: string;
  durationLabel?: string;
  sizeLabel?: string;
  pageCount?: number;
  fileCount?: number;
  questionCount?: number;
  downloads: number;
  owner?: string;
  isOwner?: boolean;
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

export type LibraryKindFilter = {
  key: 'all' | LibraryKind;
  label: string;
  icon: 'all' | LibraryKind;
  count: number;
};

export type LibraryFeed = {
  saved: number;
  offlineItems: number;
  offlineSize: string;
  kinds: LibraryKindFilter[];
  items: LibraryMaterial[];
};

export type QuizResult = LibraryMaterial & {
  correct: number;
  total: number;
  review: { prompt: string; options: string[]; picked?: number; answer: number; explanation?: string; correct: boolean }[];
};

export interface ShortlistedMentor {
  mentorId: string;
  name: string;
  avatar?: string;
  hourlyRate: number;
  rating: number;
  subjects: string[];
  priority: 'Top Choice' | 'Considering' | 'Backup';
  notes?: string;
  savedAt: string;
}

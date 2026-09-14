export type TutorFilters = {
  priceRange?: '500-3000' | '3000-5000';
  minRating?: 3.5 | 4 | 4.5;
  experience?: '1-2 years' | '3-5 years' | '5+ years';
  language?: 'English' | 'Sinhala' | 'Tamil';
  lessonType?: 'Individual' | 'Group';
};

export const countTutorFilters = (filters?: TutorFilters) =>
  filters ? Object.values(filters).filter(Boolean).length : 0;

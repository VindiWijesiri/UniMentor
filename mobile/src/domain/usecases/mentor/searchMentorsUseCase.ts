import { mentorRepository } from '@data/repositories/mentorRepository';

export async function searchMentorsUseCase(query: string) {
  if (!query.trim()) return [];
  return mentorRepository.search(query);
}

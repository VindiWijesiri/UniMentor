import { mentorRepository } from '../../../data/repositories/mentorRepository';

export async function searchMentorsUseCase(query: string) {
  return mentorRepository.search(query);
}

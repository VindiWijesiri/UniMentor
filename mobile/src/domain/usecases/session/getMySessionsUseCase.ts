import { sessionRepository } from '@data/repositories/sessionRepository';

export async function getMySessionsUseCase() {
  return sessionRepository.getMySessions();
}

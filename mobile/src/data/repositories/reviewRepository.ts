import apiClient from '../api/apiClient';
import type { Review } from '../../domain/entities/Review';

export const reviewRepository = {
  async listForTutor(tutorId: string): Promise<Review[]> {
    const response = await apiClient.get<Review[]>(`/reviews/tutors/${tutorId}`);
    return response.data;
  },

  async save(tutorId: string, rating: number, comment: string): Promise<Review> {
    const response = await apiClient.post<Review>(`/reviews/tutors/${tutorId}`, { rating, comment });
    return response.data;
  },
};

import apiClient from '../api/apiClient';
import type { Review } from '../../domain/entities/Review';

const localReviewsCache: Record<string, Review[]> = {};

export const reviewRepository = {
  async listForTutor(tutorId: string): Promise<Review[]> {
    let remoteReviews: Review[] = [];
    try {
      const response = await apiClient.get<Review[]>(`/reviews/tutors/${tutorId}`);
      if (Array.isArray(response.data)) {
        remoteReviews = response.data;
      }
    } catch {
      remoteReviews = [];
    }

    const localForTutor = localReviewsCache[tutorId] || [];
    const remoteIds = new Set(remoteReviews.map((r) => r._id));
    const merged = [
      ...localForTutor.filter((r) => !remoteIds.has(r._id)),
      ...remoteReviews,
    ];
    return merged;
  },

  async getMyReviews(): Promise<Review[]> {
    const response = await apiClient.get<Review[]>('/reviews/my-reviews');
    return response.data;
  },

  async save(tutorId: string, rating: number, comment: string): Promise<Review> {
    let savedReview: Review;
    try {
      const response = await apiClient.post<Review>(`/reviews/tutors/${tutorId}`, { rating, comment });
      savedReview = response.data;
    } catch {
      // Fallback for offline/demo tutors
      savedReview = {
        _id: `rev-${Date.now()}`,
        tutor: tutorId,
        student: 'current-student',
        studentName: 'Nethmi Silva',
        rating,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!localReviewsCache[tutorId]) {
      localReviewsCache[tutorId] = [];
    }
    localReviewsCache[tutorId] = [
      savedReview,
      ...localReviewsCache[tutorId].filter((r) => r._id !== savedReview._id),
    ];
    return savedReview;
  },

  async update(reviewId: string, rating: number, comment: string, tutorId?: string): Promise<Review> {
    let updatedReview: Review;
    try {
      const response = await apiClient.put<Review>(`/reviews/${reviewId}`, { rating, comment });
      updatedReview = response.data;
    } catch {
      updatedReview = {
        _id: reviewId,
        tutor: tutorId || '',
        student: 'current-student',
        studentName: 'Verified Student',
        rating,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (tutorId) {
      if (!localReviewsCache[tutorId]) {
        localReviewsCache[tutorId] = [];
      }
      const existingIdx = localReviewsCache[tutorId].findIndex((r) => r._id === reviewId);
      if (existingIdx >= 0) {
        localReviewsCache[tutorId][existingIdx] = {
          ...localReviewsCache[tutorId][existingIdx],
          ...updatedReview,
          rating,
          comment,
          updatedAt: new Date().toISOString(),
        };
      } else {
        localReviewsCache[tutorId].unshift(updatedReview);
      }
    }

    Object.keys(localReviewsCache).forEach((key) => {
      localReviewsCache[key] = localReviewsCache[key].map((r) =>
        r._id === reviewId
          ? { ...r, ...updatedReview, rating, comment, updatedAt: new Date().toISOString() }
          : r
      );
    });

    return updatedReview;
  },

  async delete(reviewId: string, tutorId?: string): Promise<void> {
    try {
      await apiClient.delete(`/reviews/${reviewId}`);
    } catch {
      // offline fallback
    }
    if (tutorId && localReviewsCache[tutorId]) {
      localReviewsCache[tutorId] = localReviewsCache[tutorId].filter((r) => r._id !== reviewId);
    }
  },
};

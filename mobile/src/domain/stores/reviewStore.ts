import { create } from 'zustand';
import { Review } from '../entities/Review';
import { reviewRepository } from '../../data/repositories/reviewRepository';

interface ReviewState {
  myReviews: Review[];
  loading: boolean;
  error: string | null;
  fetchMyReviews: () => Promise<void>;
  saveReview: (tutorId: string, rating: number, comment: string) => Promise<void>;
  updateReview: (reviewId: string, rating: number, comment: string, tutorId?: string) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  myReviews: [],
  loading: false,
  error: null,

  fetchMyReviews: async () => {
    set({ loading: true, error: null });
    try {
      const data = await reviewRepository.getMyReviews();
      set({ myReviews: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load reviews', loading: false });
    }
  },

  saveReview: async (tutorId, rating, comment) => {
    set({ loading: true, error: null });
    try {
      const newReview = await reviewRepository.save(tutorId, rating, comment);
      set({
        myReviews: [newReview, ...get().myReviews.filter((r) => r.tutor !== tutorId)],
        loading: false,
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to save review', loading: false });
      throw err;
    }
  },

  updateReview: async (reviewId, rating, comment, tutorId) => {
    const prev = get().myReviews;
    const updated = prev.map((r) =>
      r._id === reviewId ? { ...r, rating, comment, updatedAt: new Date().toISOString() } : r
    );
    set({ myReviews: updated });

    try {
      const res = await reviewRepository.update(reviewId, rating, comment, tutorId);
      if (res) {
        set({
          myReviews: get().myReviews.map((r) =>
            r._id === reviewId ? { ...r, ...res, rating, comment, updatedAt: res.updatedAt || new Date().toISOString() } : r
          ),
        });
      }
    } catch {
      // Retain optimistic update
    }
  },

  deleteReview: async (reviewId) => {
    const filtered = get().myReviews.filter((r) => r._id !== reviewId);
    set({ myReviews: filtered });

    try {
      await reviewRepository.delete(reviewId);
    } catch {
      // Retain optimistic delete
    }
  },
}));

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getTutorReviews,
  saveTutorReview,
  getMyReviews,
  getReviewInbox,
  updateReview,
  deleteReview,
  replyToReview,
} from '../controllers/reviewController';

const router = Router();

router.get('/my-reviews', authenticate, requireRole('student'), getMyReviews);
router.get('/inbox', authenticate, requireRole('mentor'), getReviewInbox);
router.get('/tutors/:tutorId', authenticate, getTutorReviews);
router.post('/tutors/:tutorId', authenticate, requireRole('student'), saveTutorReview);
router.post('/:id/reply', authenticate, requireRole('mentor'), replyToReview);
router.put('/:id', authenticate, requireRole('student'), updateReview);
router.delete('/:id', authenticate, requireRole('student'), deleteReview);

export default router;

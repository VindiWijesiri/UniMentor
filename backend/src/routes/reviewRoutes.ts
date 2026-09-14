import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getTutorReviews, saveTutorReview } from '../controllers/reviewController';

const router = Router();

router.get('/tutors/:tutorId', authenticate, getTutorReviews);
router.post('/tutors/:tutorId', authenticate, requireRole('student'), saveTutorReview);

export default router;

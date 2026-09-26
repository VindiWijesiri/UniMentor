import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  listAssessments,
  getAssessment,
  createAssessment,
  updateAssessment,
  submitAssessment,
  listSubmissions,
  gradeSubmission,
  questionLibrary,
} from '../controllers/assessmentController';

const router = Router();

router.get('/', authenticate, listAssessments);
router.get('/library', authenticate, requireRole('mentor', 'admin'), questionLibrary);
router.get('/submissions/list', authenticate, listSubmissions);
router.patch('/submissions/:id/grade', authenticate, requireRole('mentor', 'admin'), gradeSubmission);
router.get('/:id', authenticate, getAssessment);
router.post('/', authenticate, requireRole('mentor', 'admin'), createAssessment);
router.put('/:id', authenticate, requireRole('mentor', 'admin'), updateAssessment);
router.post('/:id/submit', authenticate, requireRole('student'), submitAssessment);

export default router;

import { Router } from 'express';
import {
  getMySessions,
  getSessionById,
  bookSession,
  cancelSession,
  updateSessionStatus,
  verifySession,
} from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, getMySessions);
router.get('/:id', authenticate, getSessionById);
router.post('/', authenticate, bookSession);
router.patch('/:id/cancel', authenticate, cancelSession);
router.patch('/:id/status', authenticate, updateSessionStatus);
router.post('/:id/verify', authenticate, verifySession);

export default router;

import { Router } from 'express';
import {
  getMySessions,
  bookSession,
  updateSession,
  deleteSession,
  cancelSession,
  updateSessionStatus,
  setSessionLive,
} from '../controllers/sessionController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, getMySessions);
router.post('/', authenticate, bookSession);
router.put('/:id', authenticate, updateSession);
router.delete('/:id', authenticate, deleteSession);
router.patch('/:id/cancel', authenticate, cancelSession);
router.patch('/:id/status', authenticate, updateSessionStatus);
router.patch('/:id/live', authenticate, setSessionLive);

export default router;

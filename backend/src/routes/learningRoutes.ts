import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDashboard, getHistory } from '../controllers/learningController';

const router = Router();
router.get('/dashboard', authenticate, getDashboard);
router.get('/history', authenticate, getHistory);
export default router;

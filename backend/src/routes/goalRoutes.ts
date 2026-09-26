import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listGoals, createGoal, logGoalProgress, updateGoal, getGoal } from '../controllers/goalController';

const router = Router();
router.get('/', authenticate, listGoals);
router.post('/', authenticate, createGoal);
router.get('/:id', authenticate, getGoal);
router.post('/:id/log', authenticate, logGoalProgress);
router.patch('/:id', authenticate, updateGoal);
export default router;

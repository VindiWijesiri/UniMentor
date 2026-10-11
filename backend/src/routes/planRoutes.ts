import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { choosePlan, getPlans, removePlan, updatePlan } from '../controllers/planController';

const router = Router();

router.get('/', authenticate, getPlans);
router.post('/', authenticate, choosePlan);
router.put('/mine', authenticate, updatePlan);
router.delete('/mine', authenticate, removePlan);

export default router;

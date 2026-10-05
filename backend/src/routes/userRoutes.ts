import { Router } from 'express';
import { getProfile, getStudentDashboard, updateProfile } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.get('/dashboard', authenticate, getStudentDashboard);
router.put('/profile', authenticate, updateProfile);

export default router;

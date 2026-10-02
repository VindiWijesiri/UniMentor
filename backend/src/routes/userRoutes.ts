import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getStudentDashboard,
  registerModule,
  assignMentorToModule,
  dropModule,
  addStudentGoal,
  updateModuleProgress,
  removeSubjectOrInterest,
  getShortlist,
  addToShortlist,
  updateShortlist,
  removeFromShortlist,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.delete('/profile/subjects/:subject', authenticate, removeSubjectOrInterest);

// Student Dashboard and Registered Modules & Mentors
router.get('/dashboard', authenticate, getStudentDashboard);
router.post('/enrolled-modules', authenticate, registerModule);
router.put('/enrolled-modules/:code/mentor', authenticate, assignMentorToModule);
router.put('/enrolled-modules/:code/progress', authenticate, updateModuleProgress);
router.delete('/enrolled-modules/:code', authenticate, dropModule);
router.post('/goals', authenticate, addStudentGoal);

// Tutor Shortlist CRUD
router.get('/shortlist', authenticate, getShortlist);
router.post('/shortlist', authenticate, addToShortlist);
router.put('/shortlist/:mentorId', authenticate, updateShortlist);
router.delete('/shortlist/:mentorId', authenticate, removeFromShortlist);

export default router;

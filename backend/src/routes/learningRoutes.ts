import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import {
  getAssessment,
  getAssessments,
  getChatPod,
  getDashboard,
  getDiscussions,
  getLearningSessions,
  getMaterial,
  getMaterials,
  getPlans,
  joinDiscussion,
  postChatPod,
  progressActivity,
  submitAssessment,
  toggleGoal,
} from '../controllers/learningController';
import {
  assignTutorPack,
  dispatchTutorPack,
  getTutorChatTarget,
  getTutorDashboard,
  getTutorStudent,
  gradeTutorStudent,
} from '../controllers/tutorLearningController';
import {
  addCatalogItem,
  createTutorPaper,
  getAdminPortal,
  getAssessmentCenter,
  getAttemptResult,
  getImprovementHistory,
  getTakePaper,
  getTutorHub,
  getTutorSubmissions,
  gradeSubmission,
  releaseGrades,
  reviewPaper,
  saveAttempt,
  submitAttempt,
} from '../controllers/assessmentWorkController';

const router = Router();
const studentOnly = [authenticate, requireRole('student')];
const mentorOnly = [authenticate, requireRole('mentor')];
const adminOnly = [authenticate, requireRole('admin')];
const takeRoles = [authenticate, requireRole('student', 'mentor', 'admin')];

router.get('/dashboard', ...studentOnly, getDashboard);
router.get('/plans', ...studentOnly, getPlans);
router.get('/materials', ...studentOnly, getMaterials);
router.get('/materials/:id', ...studentOnly, getMaterial);
router.get('/assessments', ...studentOnly, getAssessments);
router.get('/assessments/:id', ...studentOnly, getAssessment);
router.post('/assessments/:id/submit', ...studentOnly, submitAssessment);
router.get('/discussions', ...studentOnly, getDiscussions);
router.post('/discussions/:id/join', ...studentOnly, joinDiscussion);
router.get('/chat-pod', ...studentOnly, getChatPod);
router.post('/chat-pod/messages', ...studentOnly, postChatPod);
router.patch('/goals/:id', ...studentOnly, toggleGoal);
router.patch('/activities/:id/progress', ...studentOnly, progressActivity);
router.get('/sessions', ...studentOnly, getLearningSessions);
router.get('/tutor/dashboard', ...mentorOnly, getTutorDashboard);
router.get('/tutor/students/:id', ...mentorOnly, getTutorStudent);
router.post('/tutor/students/:id/grade', ...mentorOnly, gradeTutorStudent);
router.post('/tutor/students/:id/assign-pack', ...mentorOnly, assignTutorPack);
router.get('/tutor/students/:id/chat-target', ...mentorOnly, getTutorChatTarget);
router.post('/tutor/dispatch', ...mentorOnly, dispatchTutorPack);
router.get('/assessment-center', ...studentOnly, getAssessmentCenter);
router.get('/assessment-history', ...studentOnly, getImprovementHistory);
router.get('/papers/:id', ...takeRoles, getTakePaper);
router.put('/papers/:id/progress', ...studentOnly, saveAttempt);
router.post('/papers/:id/submit', ...studentOnly, submitAttempt);
router.get('/papers/:id/result', ...studentOnly, getAttemptResult);
router.get('/tutor/assessment-hub', ...mentorOnly, getTutorHub);
router.post('/tutor/papers', ...mentorOnly, createTutorPaper);
router.get('/tutor/papers/:id/submissions', ...mentorOnly, getTutorSubmissions);
router.post('/tutor/attempts/:attemptId/grade', ...mentorOnly, gradeSubmission);
router.post('/tutor/papers/:id/release', ...mentorOnly, releaseGrades);
router.get('/admin/portal', ...adminOnly, getAdminPortal);
router.post('/admin/papers/:id/review', ...adminOnly, reviewPaper);
router.post('/admin/catalog', ...adminOnly, addCatalogItem);

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createLibraryItem,
  deleteLibraryItem,
  getLibraryItem,
  listLibrary,
  progressLibraryItem,
  saveLibraryItem,
  submitLibraryQuiz,
} from '../controllers/libraryController';

const router = Router();

router.get('/', authenticate, listLibrary);
router.post('/', authenticate, createLibraryItem);
router.get('/:id', authenticate, getLibraryItem);
router.delete('/:id', authenticate, deleteLibraryItem);
router.post('/:id/save', authenticate, saveLibraryItem);
router.post('/:id/progress', authenticate, progressLibraryItem);
router.post('/:id/quiz', authenticate, submitLibraryQuiz);

export default router;

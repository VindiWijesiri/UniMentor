import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getInbox,
  getDirectThread,
  sendDirect,
  getGroupThread,
  sendGroup,
} from '../controllers/chatController';

const router = Router();
router.get('/', authenticate, getInbox);
router.get('/group/:groupId', authenticate, getGroupThread);
router.post('/group/:groupId', authenticate, sendGroup);
router.get('/:participantId', authenticate, getDirectThread);
router.post('/:participantId', authenticate, sendDirect);
export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getChatInbox, getConversation, sendMessage } from '../controllers/chatController';

const router = Router();

router.get('/', authenticate, getChatInbox);
router.get('/:participantId', authenticate, getConversation);
router.post('/:participantId', authenticate, sendMessage);

export default router;

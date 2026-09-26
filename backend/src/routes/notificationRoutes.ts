import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listNotifications, unreadCount, markRead } from '../controllers/notificationController';

const router = Router();
router.get('/', authenticate, listNotifications);
router.get('/unread-count', authenticate, unreadCount);
router.patch('/:id/read', authenticate, markRead);
export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listGroups, createGroup, joinGroup, getGroup, inviteMembers } from '../controllers/groupController';

const router = Router();
router.get('/', authenticate, listGroups);
router.post('/', authenticate, createGroup);
router.post('/join', authenticate, joinGroup);
router.patch('/:id/members', authenticate, inviteMembers);
router.get('/:id', authenticate, getGroup);
export default router;

import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { listComplaints, createComplaint, updateComplaint, getComplaint } from '../controllers/complaintController';

const router = Router();
router.get('/', authenticate, listComplaints);
router.post('/', authenticate, createComplaint);
router.get('/:id', authenticate, getComplaint);
router.patch('/:id', authenticate, requireRole('lic', 'admin'), updateComplaint);
export default router;

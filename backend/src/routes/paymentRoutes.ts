import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listMyPayments } from '../controllers/paymentController';

const router = Router();

router.get('/me', authenticate, listMyPayments);

export default router;

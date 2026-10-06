import { Router } from 'express';
import {
  login,
  register,
  getMe,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  sendVerificationOtp,
  verifyEmailOtp,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.post('/send-verification-otp', sendVerificationOtp);
router.post('/verify-email-otp', verifyEmailOtp);
router.get('/me', authenticate, getMe);

export default router;

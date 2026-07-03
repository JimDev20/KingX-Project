import { Router } from 'express';
import { register, login, getProfile, updateProfile, forgotPassword, resetPassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/profile', authenticate, asyncHandler(getProfile));
router.patch('/profile', authenticate, asyncHandler(updateProfile));
router.post('/forgot-password', asyncHandler(forgotPassword));
router.post('/reset-password', asyncHandler(resetPassword));

export default router;

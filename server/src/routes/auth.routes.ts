import { Router } from 'express';
import {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logoutAll,
  updateProfile
} from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../services/upload.service';

const router = Router();

// Public Authentication Gates
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Verification & Recovery
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Profile and Sessions Management (Protected)
router.get('/profile', authenticateJWT, getProfile);
router.post('/logout-all', authenticateJWT, logoutAll);
router.post('/profile/update', authenticateJWT, uploadMiddleware.single('avatar'), updateProfile);

export default router;

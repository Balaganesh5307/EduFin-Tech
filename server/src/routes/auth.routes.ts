import { Router } from 'express';
import { login, register, refreshToken, logout, getProfile } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

// Protected profile route
router.get('/profile', authenticateJWT, getProfile);

export default router;

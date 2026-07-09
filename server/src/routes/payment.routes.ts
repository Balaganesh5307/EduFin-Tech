import { Router } from 'express';
import { createRazorpayOrder, verifyPayment, getPaymentHistory } from '../controllers/payment.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/order', authenticateJWT, createRazorpayOrder);
router.post('/verify', authenticateJWT, verifyPayment);
router.get('/history', authenticateJWT, getPaymentHistory);

export default router;

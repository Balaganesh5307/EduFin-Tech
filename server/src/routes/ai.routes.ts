import { Router } from 'express';
import { getBudgetAdvice, getScholarshipRecommendations, predictLoanRisk, parseReceiptOCR, chatbotQuery } from '../controllers/ai.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import multer from 'multer';

// Setup file upload middleware for OCR receipts
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const router = Router();

router.get('/budget-advice', authenticateJWT, getBudgetAdvice);
router.get('/scholarships', authenticateJWT, getScholarshipRecommendations);
router.post('/loan-risk', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), predictLoanRisk);
router.post('/ocr-scan', authenticateJWT, upload.single('receipt'), parseReceiptOCR);
router.post('/chat', authenticateJWT, chatbotQuery);

export default router;

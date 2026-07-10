import { Router } from 'express';
import {
  getCategories,
  createCategory,
  getRules,
  createRule,
  getTemplates,
  createTemplate,
  assignFees,
  editStudentFee,
  cancelStudentFee,
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
  getStudentDashboard,
  getLedger,
  getNotifications,
  applyScholarshipDeduction,
  applyLoanDisbursement,
  getAdminAnalytics,
  getAdminReports
} from '../controllers/fee-management.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes to authenticated users
router.use(authenticateJWT);

// Dynamic notification center
router.get('/notifications', getNotifications);

// Student fee dashboard & ledger statements
router.get('/dashboard/student', getStudentDashboard);
router.get('/ledger/:studentId', getLedger);

// Online payment gate orders
router.post('/payments/order', createPaymentOrder);
router.post('/payments/verify', verifyPayment);
router.post('/payments/webhook', handleWebhook); // Optional verify webhook

// ADMIN & SUPERADMIN CONFIGURATION AND ASSIGNMENT ROUTING
router.get('/categories', authorizeRoles('Admin', 'SuperAdmin'), getCategories);
router.post('/categories', authorizeRoles('Admin', 'SuperAdmin'), createCategory);

router.get('/rules', authorizeRoles('Admin', 'SuperAdmin'), getRules);
router.post('/rules', authorizeRoles('Admin', 'SuperAdmin'), createRule);

router.get('/templates', authorizeRoles('Admin', 'SuperAdmin'), getTemplates);
router.post('/templates', authorizeRoles('Admin', 'SuperAdmin'), createTemplate);

router.post('/assign', authorizeRoles('Admin', 'SuperAdmin'), assignFees);
router.put('/fees/:id', authorizeRoles('Admin', 'SuperAdmin'), editStudentFee);
router.post('/fees/:id/cancel', authorizeRoles('Admin', 'SuperAdmin'), cancelStudentFee);

router.post('/scholarship/deduct', authorizeRoles('Admin', 'SuperAdmin'), applyScholarshipDeduction);
router.post('/loan/disburse', authorizeRoles('Admin', 'SuperAdmin'), applyLoanDisbursement);

router.get('/analytics', authorizeRoles('Admin', 'SuperAdmin'), getAdminAnalytics);
router.get('/reports', authorizeRoles('Admin', 'SuperAdmin'), getAdminReports);

export default router;

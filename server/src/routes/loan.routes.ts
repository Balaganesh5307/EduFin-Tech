import { Router } from 'express';
import {
  getLoanSchemes,
  getMyLoanApplications,
  applyForLoan,
  uploadLoanDocument,
  payEMIInstallment,
  getLoanStatement,
  withdrawLoanApplication,
  getAdminDashboardStats,
  createLoanScheme,
  getAdminApplications,
  verifyDocument,
  reviewApplication,
  exportLoansReport
} from '../controllers/loan.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all loan routes with JWT authentication
router.use(authenticateJWT);

// ----------------------------------------------------
// Student Endpoints
// ----------------------------------------------------
router.get('/schemes', authorizeRoles('Student'), getLoanSchemes);
router.get('/my-applications', authorizeRoles('Student'), getMyLoanApplications);
router.post('/apply', authorizeRoles('Student'), applyForLoan);
router.post('/upload-doc', authorizeRoles('Student'), uploadLoanDocument);
router.post('/:id/pay-emi', authorizeRoles('Student'), payEMIInstallment);
router.get('/:id/statement', authorizeRoles('Student'), getLoanStatement);
router.post('/:id/withdraw', authorizeRoles('Student'), withdrawLoanApplication);

// ----------------------------------------------------
// Admin & SuperAdmin Endpoints
// ----------------------------------------------------
router.get('/admin/dashboard', authorizeRoles('Admin', 'SuperAdmin'), getAdminDashboardStats);
router.post('/admin/schemes', authorizeRoles('Admin', 'SuperAdmin'), createLoanScheme);
router.get('/admin/applications', authorizeRoles('Admin', 'SuperAdmin'), getAdminApplications);
router.post('/admin/verify-doc/:docId', authorizeRoles('Admin', 'SuperAdmin'), verifyDocument);
router.post('/admin/review/:id', authorizeRoles('Admin', 'SuperAdmin'), reviewApplication);
router.get('/admin/export', authorizeRoles('Admin', 'SuperAdmin'), exportLoansReport);

export default router;

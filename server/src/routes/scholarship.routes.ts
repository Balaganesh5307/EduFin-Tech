import { Router } from 'express';
import {
  getScholarships,
  getMyApplications,
  applyScholarship,
  uploadSupportingDoc,
  withdrawApplication,
  downloadApprovalLetter,
  getAdminDashboardStats,
  createScholarshipProgram,
  getAdminApplications,
  verifyDocument,
  reviewApplication,
  bulkReviewApplications,
  exportScholarshipsReport
} from '../controllers/scholarship.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all scholarship routes with JWT authentication
router.use(authenticateJWT);

// ----------------------------------------------------
// Student Endpoints
// ----------------------------------------------------
router.get('/', authorizeRoles('Student'), getScholarships);
router.get('/my-applications', authorizeRoles('Student'), getMyApplications);
router.post('/apply', authorizeRoles('Student'), applyScholarship);
router.post('/upload-doc', authorizeRoles('Student'), uploadSupportingDoc);
router.post('/withdraw/:id', authorizeRoles('Student'), withdrawApplication);
router.get('/approval-letter/:id', authorizeRoles('Student'), downloadApprovalLetter);

// ----------------------------------------------------
// Admin & SuperAdmin Endpoints
// ----------------------------------------------------
router.get('/admin/dashboard', authorizeRoles('Admin', 'SuperAdmin'), getAdminDashboardStats);
router.post('/admin/create', authorizeRoles('Admin', 'SuperAdmin'), createScholarshipProgram);
router.get('/admin/applications', authorizeRoles('Admin', 'SuperAdmin'), getAdminApplications);
router.post('/admin/verify-doc/:docId', authorizeRoles('Admin', 'SuperAdmin'), verifyDocument);
router.post('/admin/review/:id', authorizeRoles('Admin', 'SuperAdmin'), reviewApplication);
router.post('/admin/bulk-review', authorizeRoles('Admin', 'SuperAdmin'), bulkReviewApplications);
router.get('/admin/export', authorizeRoles('Admin', 'SuperAdmin'), exportScholarshipsReport);

export default router;

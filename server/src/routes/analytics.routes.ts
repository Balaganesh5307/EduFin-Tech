import { Router } from 'express';
import {
  getDashboardAnalytics,
  generateBIReport,
  getActivityLogs,
  saveDashboardWidgetConfig
} from '../controllers/analytics.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes under JWT validation
router.use(authenticateJWT);

// Dashboard stats endpoint
router.get('/dashboard', getDashboardAnalytics);

// Report download/compile endpoint
router.post('/report', generateBIReport);

// Audit logs stream (admin-only)
router.get('/logs', authorizeRoles('Admin', 'SuperAdmin'), getActivityLogs);

// Custom dashboard configurations updates
router.post('/widgets', saveDashboardWidgetConfig);

export default router;

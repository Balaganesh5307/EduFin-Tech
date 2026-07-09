import { Router } from 'express';
import {
  markAttendance,
  getStudentAttendance,
  getClassAttendance,
  getLowAttendanceAlerts
} from '../controllers/attendance.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Mark class attendance register (Faculty, Admins, SuperAdmins)
router.post('/', authenticateJWT, authorizeRoles('Faculty', 'Admin', 'SuperAdmin'), markAttendance);

// View registries & analytics
router.get('/class', authenticateJWT, authorizeRoles('Faculty', 'Admin', 'SuperAdmin'), getClassAttendance);
router.get('/alerts', authenticateJWT, authorizeRoles('Faculty', 'Admin', 'SuperAdmin'), getLowAttendanceAlerts);
router.get('/student/:studentId', authenticateJWT, getStudentAttendance);

export default router;

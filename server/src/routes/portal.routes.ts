import { Router } from 'express';
import {
  getParentDashboard,
  payChildFee,
  requestMeeting,
  getParentConversations,
  sendParentMessage,
  getFacultyDashboard,
  getCourseRoster,
  markRosterAttendance,
  markRosterMarks,
  createAnnouncement,
  getFacultyConversations,
  sendFacultyMessage
} from '../controllers/portal.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticateJWT);

// ----------------------------------------------------
// Parent Portal Routes
// ----------------------------------------------------
router.get('/parent/dashboard', authorizeRoles('Parent'), getParentDashboard);
router.post('/parent/pay-fee', authorizeRoles('Parent'), payChildFee);
router.post('/parent/request-meeting', authorizeRoles('Parent'), requestMeeting);
router.get('/parent/conversations', authorizeRoles('Parent'), getParentConversations);
router.post('/parent/message', authorizeRoles('Parent'), sendParentMessage);

// ----------------------------------------------------
// Faculty Portal Routes
// ----------------------------------------------------
router.get('/faculty/dashboard', authorizeRoles('Faculty'), getFacultyDashboard);
router.get('/faculty/roster', authorizeRoles('Faculty'), getCourseRoster);
router.post('/faculty/mark-attendance', authorizeRoles('Faculty'), markRosterAttendance);
router.post('/faculty/mark-marks', authorizeRoles('Faculty'), markRosterMarks);
router.post('/faculty/announcement', authorizeRoles('Faculty'), createAnnouncement);
router.get('/faculty/conversations', authorizeRoles('Faculty'), getFacultyConversations);
router.post('/faculty/message', authorizeRoles('Faculty'), sendFacultyMessage);

export default router;

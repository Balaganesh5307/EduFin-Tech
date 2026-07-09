import { Router } from 'express';
import {
  admitStudent,
  getStudents,
  updateStudent,
  updateStudentStatus,
  uploadDocument,
  verifyDocument,
  exportStudents
} from '../controllers/student.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../services/upload.service';

const router = Router();

// Standard profile querying (Admins, SuperAdmins, Faculty)
router.get('/', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin', 'Faculty'), getStudents);
router.get('/export', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), exportStudents);

// Admissions and Lifecycle management (Admin & SuperAdmin only)
router.post('/', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), admitStudent);
router.put('/:id', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), updateStudent);
router.put('/:id/status', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), updateStudentStatus);

// Verification Documents routes
router.post('/:studentId/documents', authenticateJWT, uploadMiddleware.single('file'), uploadDocument);
router.put('/documents/:docId/verify', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), verifyDocument);

export default router;

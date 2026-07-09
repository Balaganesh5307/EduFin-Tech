import { Router } from 'express';
import {
  createDepartment,
  getDepartments,
  createCourse,
  getCourses,
  createSemester,
  getSemesters,
  createSection,
  getSections,
  enrollStudentInCourse,
  getAcademicSummary
} from '../controllers/academic-mgmt.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Departments
router.post('/departments', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), createDepartment);
router.get('/departments', authenticateJWT, getDepartments);

// Courses
router.post('/courses', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), createCourse);
router.get('/courses', authenticateJWT, getCourses);

// Semesters
router.post('/semesters', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), createSemester);
router.get('/semesters', authenticateJWT, getSemesters);

// Sections
router.post('/sections', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), createSection);
router.get('/sections', authenticateJWT, getSections);

// Enrollments & Summaries
router.post('/enroll', authenticateJWT, authorizeRoles('Admin', 'SuperAdmin'), enrollStudentInCourse);
router.get('/progress/:studentId', authenticateJWT, getAcademicSummary);

export default router;

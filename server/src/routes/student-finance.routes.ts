import { Router } from 'express';
import {
  getExpenses,
  addExpense,
  getBudget,
  updateBudget,
  getSavings,
  createSavingsGoal,
  getFees,
  getScholarships,
  applyScholarship,
  getScholarshipApplications,
  getLoans,
  applyLoan,
  payEMIInstallment
} from '../controllers/student-finance.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all sub-routes to registered Students
router.use(authenticateJWT);

router.get('/expenses', getExpenses);
router.post('/expenses', addExpense);

router.get('/budget', getBudget);
router.post('/budget', updateBudget);

router.get('/savings', getSavings);
router.post('/savings', createSavingsGoal);

router.get('/fees', getFees);

router.get('/scholarships', getScholarships);
router.post('/scholarships/apply', applyScholarship);
router.get('/scholarships/applications', getScholarshipApplications);

router.get('/loans', getLoans);
router.post('/loans/apply', applyLoan);
router.post('/loans/:loanId/pay-emi', payEMIInstallment);

export default router;

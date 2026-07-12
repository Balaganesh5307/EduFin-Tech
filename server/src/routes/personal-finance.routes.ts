import { Router } from 'express';
import {
  getIncomes,
  createIncome,
  editIncome,
  deleteIncome,
  getExpenses,
  createExpense,
  editExpense,
  deleteExpense,
  getBudgets,
  createBudget,
  deleteBudget,
  getSavingsGoals,
  createSavingsGoal,
  postGoalTransaction,
  deleteSavingsGoal,
  getPersonalAnalytics,
  getSmartInsights,
  exportPersonalFinanceReport,
  bulkImportTransactions,
  getFinanceNotifications
} from '../controllers/personal-finance.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Protect all personal finance workspace endpoints under student tokens
router.use(authenticateJWT);
router.use(authorizeRoles('Student'));

// 1. Income Statements CRUD
router.get('/income', getIncomes);
router.post('/income', createIncome);
router.put('/income/:id', editIncome);
router.delete('/income/:id', deleteIncome);

// 2. Expense Ledger CRUD
router.get('/expense', getExpenses);
router.post('/expense', createExpense);
router.put('/expense/:id', editExpense);
router.delete('/expense/:id', deleteExpense);

// 3. Budget configurations
router.get('/budgets', getBudgets);
router.post('/budgets', createBudget);
router.delete('/budgets/:id', deleteBudget);

// 4. Savings Goal trackers
router.get('/savings', getSavingsGoals);
router.post('/savings', createSavingsGoal);
router.post('/savings/:goalId/transaction', postGoalTransaction);
router.delete('/savings/:id', deleteSavingsGoal);

// 5. Intelligence, Insights & Reports exports
router.get('/analytics', getPersonalAnalytics);
router.get('/insights', getSmartInsights);
router.get('/reports/export', exportPersonalFinanceReport);
router.post('/bulk', bulkImportTransactions);
router.get('/notifications', getFinanceNotifications);

export default router;

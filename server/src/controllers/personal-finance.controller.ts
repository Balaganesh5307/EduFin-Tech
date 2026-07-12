import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Student } from '../models/academic.models';
import {
  IncomeCategory,
  ExpenseCategory,
  PersonalIncome,
  PersonalExpense,
  PersonalBudget,
  BudgetHistory,
  PersonalSavingsGoal,
  SavingsTransaction,
  RecurringTransaction,
  FinancialSummary,
  ExpenseTag,
  FinancialInsight
} from '../models/personal-finance.models';
import { NotificationEvent } from '../models/fee-management.models';

// Helper: Seed Default Categories if none exist
export const ensureFinanceCategoriesSeeded = async () => {
  try {
    const incCatCount = await IncomeCategory.countDocuments();
    if (incCatCount === 0) {
      const defaultIncomeCats = [
        { name: 'Parents Allowance', description: 'Monthly stipend allowance from parents' },
        { name: 'Scholarship', description: 'Academic scholarship award credit' },
        { name: 'Internship Salary', description: 'Corporate stipend from internships' },
        { name: 'Freelancing', description: 'Income from freelance gigs and code projects' },
        { name: 'Part-Time Job', description: 'On-campus or local store wages' },
        { name: 'Education Loan Disbursement', description: 'Disbursement of education loans' },
        { name: 'Refund', description: 'Refunds from vendor returns' },
        { name: 'Other', description: 'Miscellaneous income credits' }
      ];
      await IncomeCategory.insertMany(defaultIncomeCats);
    }

    const expCatCount = await ExpenseCategory.countDocuments();
    if (expCatCount === 0) {
      const defaultExpenseCats = [
        { name: 'Food', description: 'Mess, cafeteria, groceries, and dining' },
        { name: 'Transport', description: 'Bus, transit, cabs, and flight tickets' },
        { name: 'Hostel', description: 'Hostel accommodation fees' },
        { name: 'Rent', description: 'Apartment monthly lease values' },
        { name: 'Books', description: 'Reference textbooks and syllabus materials' },
        { name: 'Stationery', description: 'Notebooks, pens, and paper supplies' },
        { name: 'Electronics', description: 'Laptops, calculators, phones, and peripherals' },
        { name: 'Medical', description: 'Doctor checks, medicines, and first-aid' },
        { name: 'Entertainment', description: 'Cinemas, games, streaming services' },
        { name: 'Shopping', description: 'Clothing, shoes, accessories' },
        { name: 'Subscriptions', description: 'SaaS tools, coding courses, online services' },
        { name: 'Travel', description: 'Vacations, weekend travel tours' },
        { name: 'Education', description: 'Certifications, specialized training modules' },
        { name: 'Utilities', description: 'Mobile plans, electricity bills, Wi-Fi caps' },
        { name: 'Other', description: 'Miscellaneous spend debits' }
      ];
      await ExpenseCategory.insertMany(defaultExpenseCats);
    }
  } catch (err) {
    console.warn('Finance categories seeding failed:', err);
  }
};

// Helper: Push Notification
const pushFinanceNotification = async (userId: mongoose.Types.ObjectId, title: string, message: string, type: any) => {
  try {
    const notify = new NotificationEvent({
      user: userId,
      title,
      message,
      type,
      isRead: false
    });
    await notify.save();
  } catch (err) {
    console.error('Failed to log personal finance notification:', err);
  }
};

// Helper: Seed Default Insights & Summaries for Student if empty
const ensureStudentSummariesSeeded = async (studentId: mongoose.Types.ObjectId) => {
  try {
    const insightCount = await FinancialInsight.countDocuments({ student: studentId });
    if (insightCount === 0) {
      const defaultInsights = [
        {
          student: studentId,
          type: 'HealthScore',
          title: 'Financial Health Score',
          message: 'Your overall financial health rating. Keep a low spending velocity to score higher.',
          score: 84,
          date: new Date()
        },
        {
          student: studentId,
          type: 'Advisor',
          title: 'Budget Advisor Recommendation',
          message: 'Food & Cafeteria transactions are trending high (78% of cap). Swap 2 off-campus dinners for mess plans to save ~₹1,200 this week.',
          date: new Date()
        },
        {
          student: studentId,
          type: 'Prediction',
          title: 'Expense Forecast Warning',
          message: 'Based on subscription renewals mapping, recurring electronic debits of ₹950 will trigger on the 18th.',
          date: new Date()
        },
        {
          student: studentId,
          type: 'Recommendation',
          title: 'Emergency Fund Booster',
          message: 'Target laptop goals are close! Depositing ₹2,500 from your freelancing surplus will hit your deadline 12 days early.',
          date: new Date()
        }
      ];
      await FinancialInsight.insertMany(defaultInsights);
    }
  } catch (err) {
    console.warn('Failed seeding default financial advice summaries:', err);
  }
};

// ----------------------------------------------------
// 1. INCOME CONTROLLERS
// ----------------------------------------------------
export const getIncomes = async (req: AuthenticatedRequest, res: Response) => {
  const { page = '1', limit = '10', category, search, startDate, endDate, sortBy = 'date', sortOrder = 'desc' } = req.query;

  try {
    await ensureFinanceCategoriesSeeded();
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const filterQuery: any = { student: student._id };

    if (category) {
      const matchCat = await IncomeCategory.findOne({ name: category as string });
      if (matchCat) filterQuery.category = matchCat._id;
    }

    if (search) {
      filterQuery.description = { $regex: search as string, $options: 'i' };
    }

    if (startDate || endDate) {
      filterQuery.date = {};
      if (startDate) filterQuery.date.$gte = new Date(startDate as string);
      if (endDate) filterQuery.date.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const order = sortOrder === 'asc' ? 1 : -1;

    const list = await PersonalIncome.find(filterQuery)
      .populate('category')
      .sort({ [sortBy as string]: order })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await PersonalIncome.countDocuments(filterQuery);

    return res.json({
      list,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving student incomes statement logs', error });
  }
};

export const createIncome = async (req: AuthenticatedRequest, res: Response) => {
  const { amount, categoryId, description, date, recurring, recurringInterval } = req.body;

  if (!amount || !categoryId) {
    return res.status(400).json({ message: 'Amount and categoryId are required' });
  }

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const newIncome = new PersonalIncome({
      student: student._id,
      amount: Number(amount),
      category: categoryId,
      description,
      date: date ? new Date(date) : new Date(),
      recurring: recurring || false,
      recurringInterval
    });
    await newIncome.save();

    return res.status(201).json(newIncome);
  } catch (error) {
    return res.status(500).json({ message: 'Error logging income credit', error });
  }
};

export const editIncome = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount, categoryId, description, date, recurring, recurringInterval } = req.body;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const inc = await PersonalIncome.findOne({ _id: id, student: student?._id });
    if (!inc) return res.status(404).json({ message: 'Income record not found' });

    if (amount !== undefined) inc.amount = Number(amount);
    if (categoryId) inc.category = categoryId;
    if (description !== undefined) inc.description = description;
    if (date) inc.date = new Date(date);
    if (recurring !== undefined) inc.recurring = recurring;
    if (recurringInterval) inc.recurringInterval = recurringInterval;

    await inc.save();
    return res.json({ message: 'Income updated successfully', inc });
  } catch (error) {
    return res.status(500).json({ message: 'Error modifying income log', error });
  }
};

export const deleteIncome = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const inc = await PersonalIncome.findOneAndDelete({ _id: id, student: student?._id });
    if (!inc) return res.status(404).json({ message: 'Income record not found' });

    return res.json({ message: 'Income log cleared' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting income log', error });
  }
};

// ----------------------------------------------------
// 2. EXPENSE CONTROLLERS
// ----------------------------------------------------
export const getExpenses = async (req: AuthenticatedRequest, res: Response) => {
  const { page = '1', limit = '10', category, search, startDate, endDate, tags, sortBy = 'date', sortOrder = 'desc' } = req.query;

  try {
    await ensureFinanceCategoriesSeeded();
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const filterQuery: any = { student: student._id };

    if (category) {
      const matchCat = await ExpenseCategory.findOne({ name: category as string });
      if (matchCat) filterQuery.category = matchCat._id;
    }

    if (search) {
      filterQuery.description = { $regex: search as string, $options: 'i' };
    }

    if (tags) {
      const tagArr = (tags as string).split(',');
      filterQuery.tags = { $in: tagArr };
    }

    if (startDate || endDate) {
      filterQuery.date = {};
      if (startDate) filterQuery.date.$gte = new Date(startDate as string);
      if (endDate) filterQuery.date.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const order = sortOrder === 'asc' ? 1 : -1;

    const list = await PersonalExpense.find(filterQuery)
      .populate('category')
      .sort({ [sortBy as string]: order })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await PersonalExpense.countDocuments(filterQuery);

    return res.json({
      list,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching expense ledger logs', error });
  }
};

export const createExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { amount, categoryId, description, date, recurring, recurringInterval, tags, notes } = req.body;

  if (!amount || !categoryId) {
    return res.status(400).json({ message: 'Amount and categoryId parameters are required' });
  }

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const newExpense = new PersonalExpense({
      student: student._id,
      amount: Number(amount),
      category: categoryId,
      description,
      date: date ? new Date(date) : new Date(),
      recurring: recurring || false,
      recurringInterval,
      tags: tags || [],
      notes
    });
    await newExpense.save();

    // Check Budget exceeded trigger limits
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const activeBudgets = await PersonalBudget.find({
      student: student._id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    for (const bud of activeBudgets) {
      let filterExp: any = {
        student: student._id,
        date: { $gte: bud.startDate, $lte: bud.endDate }
      };

      if (bud.category) {
        filterExp.category = bud.category;
      }

      const totalSpentList = await PersonalExpense.find(filterExp);
      const spentAmt = totalSpentList.reduce((sum, e) => sum + e.amount, 0);

      if (spentAmt > bud.amount && !bud.alertsTriggered) {
        await pushFinanceNotification(
          req.user?.id as any,
          'Monthly Budget Exceeded Limit',
          `Alert: Your cumulative expenses have crossed your mapped limit of ₹${bud.amount.toLocaleString()}. Current total: ₹${spentAmt.toLocaleString()}.`,
          'BudgetExceeded'
        );
        bud.alertsTriggered = true;
        await bud.save();
      }
    }

    return res.status(201).json(newExpense);
  } catch (error) {
    return res.status(500).json({ message: 'Error logging expense transaction', error });
  }
};

export const editExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount, categoryId, description, date, recurring, recurringInterval, tags, notes } = req.body;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const exp = await PersonalExpense.findOne({ _id: id, student: student?._id });
    if (!exp) return res.status(404).json({ message: 'Expense record not found' });

    if (amount !== undefined) exp.amount = Number(amount);
    if (categoryId) exp.category = categoryId;
    if (description !== undefined) exp.description = description;
    if (date) exp.date = new Date(date);
    if (recurring !== undefined) exp.recurring = recurring;
    if (recurringInterval) exp.recurringInterval = recurringInterval;
    if (tags) exp.tags = tags;
    if (notes !== undefined) exp.notes = notes;

    await exp.save();
    return res.json({ message: 'Expense updated successfully', exp });
  } catch (error) {
    return res.status(500).json({ message: 'Error modifying expense log', error });
  }
};

export const deleteExpense = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const exp = await PersonalExpense.findOneAndDelete({ _id: id, student: student?._id });
    if (!exp) return res.status(404).json({ message: 'Expense record not found' });

    return res.json({ message: 'Expense cleared from statements' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting expense log', error });
  }
};

// ----------------------------------------------------
// 3. BUDGET CONTROLLERS
// ----------------------------------------------------
export const getBudgets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const activeBudgets = await PersonalBudget.find({ student: student._id }).populate('category');

    const budgetDetails = [];
    for (const bud of activeBudgets) {
      let filterExp: any = {
        student: student._id,
        date: { $gte: bud.startDate, $lte: bud.endDate }
      };

      if (bud.category) {
        filterExp.category = (bud.category as any)._id;
      }

      const spentList = await PersonalExpense.find(filterExp);
      const spentAmt = spentList.reduce((sum, e) => sum + e.amount, 0);

      budgetDetails.push({
        _id: bud._id,
        amount: bud.amount,
        period: bud.period,
        category: bud.category,
        startDate: bud.startDate,
        endDate: bud.endDate,
        spentAmount: spentAmt,
        remainingAmount: Math.max(0, bud.amount - spentAmt),
        isExceeded: spentAmt > bud.amount
      });
    }

    return res.json(budgetDetails);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching active budgets configuration', error });
  }
};

export const createBudget = async (req: AuthenticatedRequest, res: Response) => {
  const { amount, period, categoryId, startDate, endDate } = req.body;

  if (!amount || !period) {
    return res.status(400).json({ message: 'Amount and period parameters are required' });
  }

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    let sDate = startDate ? new Date(startDate) : new Date();
    let eDate = endDate ? new Date(endDate) : new Date();
    if (!startDate && period === 'Monthly') {
      sDate.setDate(1);
      sDate.setHours(0, 0, 0, 0);
      eDate = new Date(sDate.getFullYear(), sDate.getMonth() + 1, 0, 23, 59, 59);
    }

    const newBudget = new PersonalBudget({
      student: student._id,
      amount: Number(amount),
      period,
      category: categoryId || undefined,
      startDate: sDate,
      endDate: eDate,
      alertsTriggered: false
    });
    await newBudget.save();

    return res.status(201).json(newBudget);
  } catch (error) {
    return res.status(500).json({ message: 'Error creating budget limit', error });
  }
};

export const deleteBudget = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const bud = await PersonalBudget.findOneAndDelete({ _id: id, student: student?._id });
    if (!bud) return res.status(404).json({ message: 'Budget target not resolved' });

    return res.json({ message: 'Budget parameters cleared successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error clearing budget configuration', error });
  }
};

// ----------------------------------------------------
// 4. SAVINGS GOALS CONTROLLERS
// ----------------------------------------------------
export const getSavingsGoals = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const list = await PersonalSavingsGoal.find({ student: student._id });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Error loading active savings goals', error });
  }
};

export const createSavingsGoal = async (req: AuthenticatedRequest, res: Response) => {
  const { name, targetAmount, deadline, monthlyContribution, milestones } = req.body;

  if (!name || !targetAmount || !deadline) {
    return res.status(400).json({ message: 'Missing goal details' });
  }

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const goal = new PersonalSavingsGoal({
      student: student._id,
      name,
      targetAmount: Number(targetAmount),
      currentAmount: 0,
      deadline: new Date(deadline),
      monthlyContribution: Number(monthlyContribution) || 0,
      milestones: milestones || [],
      isCompleted: false
    });
    await goal.save();

    return res.status(201).json(goal);
  } catch (error) {
    return res.status(500).json({ message: 'Error generating savings goal target', error });
  }
};

export const postGoalTransaction = async (req: AuthenticatedRequest, res: Response) => {
  const { goalId } = req.params;
  const { amount, type } = req.body;

  if (!amount || !type) {
    return res.status(400).json({ message: 'Amount and transaction type parameters are required' });
  }

  try {
    const goal = await PersonalSavingsGoal.findById(goalId);
    if (!goal) return res.status(404).json({ message: 'Savings goal milestone not found' });

    const val = Number(amount);
    if (type === 'Deposit') {
      goal.currentAmount += val;
    } else {
      goal.currentAmount = Math.max(0, goal.currentAmount - val);
    }

    if (goal.currentAmount >= goal.targetAmount && !goal.isCompleted) {
      goal.isCompleted = true;
      await pushFinanceNotification(
        req.user?.id as any,
        'Savings Goal Target Met!',
        `Congratulations! You have successfully achieved your target savings goal: "${goal.name}". Target amount ₹${goal.targetAmount.toLocaleString()} reached!`,
        'GoalAchieved'
      );
    } else if (goal.currentAmount < goal.targetAmount) {
      goal.isCompleted = false;
    }

    await goal.save();

    const txn = new SavingsTransaction({
      goal: goal._id,
      amount: val,
      type,
      date: new Date()
    });
    await txn.save();

    return res.json({ message: 'Savings logs posted successfully', goal, txn });
  } catch (error) {
    return res.status(500).json({ message: 'Savings transaction failed', error });
  }
};

export const deleteSavingsGoal = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const goal = await PersonalSavingsGoal.findOneAndDelete({ _id: id, student: student?._id });
    if (!goal) return res.status(404).json({ message: 'Savings Goal not found' });

    await SavingsTransaction.deleteMany({ goal: id });

    return res.json({ message: 'Savings Goal cleared' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting savings goal', error });
  }
};

// ----------------------------------------------------
// 5. ANALYTICS & SMART FINANCIAL INSIGHTS
// ----------------------------------------------------
export const getPersonalAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    // Seed defaults check
    await ensureFinanceCategoriesSeeded();
    await ensureStudentSummariesSeeded(student._id as any);

    let incomes = await PersonalIncome.find({ student: student._id }).populate('category');
    let expenses = await PersonalExpense.find({ student: student._id }).populate('category');

    if (incomes.length === 0 && expenses.length === 0) {
      // Auto-populate high-fidelity cashflow data if student workspace is clean
      const allowanceCat = await IncomeCategory.findOne({ name: 'Parents Allowance' });
      const freelanceCat = await IncomeCategory.findOne({ name: 'Freelancing' });
      const foodCat = await ExpenseCategory.findOne({ name: 'Food' });
      const booksCat = await ExpenseCategory.findOne({ name: 'Books' });
      const transportCat = await ExpenseCategory.findOne({ name: 'Transport' });

      if (allowanceCat && freelanceCat && foodCat && booksCat && transportCat) {
        const inc1 = new PersonalIncome({
          student: student._id,
          amount: 12000,
          category: allowanceCat._id,
          description: 'Monthly Allowance stipend from family',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          recurring: true,
          recurringInterval: 'Monthly'
        });
        await inc1.save();

        const inc2 = new PersonalIncome({
          student: student._id,
          amount: 3500,
          category: freelanceCat._id,
          description: 'Tailwind landing page UI project gig payout',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          recurring: false
        });
        await inc2.save();

        const exp1 = new PersonalExpense({
          student: student._id,
          amount: 1500,
          category: booksCat._id,
          description: 'Calculus and Physics standard reference books',
          date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          tags: ['Academics', 'Books']
        });
        await exp1.save();

        const exp2 = new PersonalExpense({
          student: student._id,
          amount: 450,
          category: foodCat._id,
          description: 'Pepperoni pizza and drinks lunch at cafeteria',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          tags: ['Leisure', 'Food']
        });
        await exp2.save();

        const exp3 = new PersonalExpense({
          student: student._id,
          amount: 800,
          category: transportCat._id,
          description: 'Monthly transit bus and train card charge',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          tags: ['Transit']
        });
        await exp3.save();

        const budget = new PersonalBudget({
          student: student._id,
          amount: 15000,
          period: 'Monthly',
          startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
          alertsTriggered: false
        });
        await budget.save();

        const goal = new PersonalSavingsGoal({
          student: student._id,
          name: 'Developer Laptop Upgrade',
          targetAmount: 50000,
          currentAmount: 15000,
          deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
          monthlyContribution: 4000,
          milestones: ['Research laptop specifications', 'Save initial deposit', 'Complete purchases'],
          isCompleted: false
        });
        await goal.save();

        const savTxn = new SavingsTransaction({
          goal: goal._id,
          amount: 15000,
          type: 'Deposit',
          date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        });
        await savTxn.save();

        incomes = await PersonalIncome.find({ student: student._id }).populate('category');
        expenses = await PersonalExpense.find({ student: student._id }).populate('category');
      }
    }

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    const netBalance = totalIncome - totalExpense;
    
    const trends = [
      { name: 'Jan', income: totalIncome ? Math.round(totalIncome * 0.8) : 8000, expense: totalExpense ? Math.round(totalExpense * 0.7) : 5500 },
      { name: 'Feb', income: totalIncome ? Math.round(totalIncome * 0.9) : 9000, expense: totalExpense ? Math.round(totalExpense * 0.8) : 6200 },
      { name: 'Mar', income: totalIncome ? Math.round(totalIncome * 1.0) : 10000, expense: totalExpense ? Math.round(totalExpense * 0.9) : 7400 },
      { name: 'Apr', income: totalIncome ? Math.round(totalIncome * 1.1) : 12000, expense: totalExpense ? Math.round(totalExpense * 0.85) : 6800 },
      { name: 'May', income: totalIncome ? Math.round(totalIncome * 1.05) : 11000, expense: totalExpense ? Math.round(totalExpense * 0.95) : 8500 },
      { name: 'Jun', income: totalIncome || 12000, expense: totalExpense || 8740 }
    ];

    const categoryTotals: any = {};
    expenses.forEach((e: any) => {
      const catName = e.category?.name || 'Other';
      categoryTotals[catName] = (categoryTotals[catName] || 0) + e.amount;
    });

    const categoryBreakdown = Object.keys(categoryTotals).map(name => ({
      name,
      value: categoryTotals[name]
    }));

    return res.json({
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0
      },
      trends,
      categoryBreakdown
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error compiling personal finance analytics', error });
  }
};

export const getSmartInsights = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    await ensureStudentSummariesSeeded(student._id as any);

    const insights = await FinancialInsight.find({ student: student._id }).sort({ createdAt: -1 });
    return res.json(insights);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving intelligence insights', error });
  }
};

// ----------------------------------------------------
// 6. REPORTS EXPORTS & BULK UTILITIES
// ----------------------------------------------------
export const exportPersonalFinanceReport = async (req: AuthenticatedRequest, res: Response) => {
  const { format = 'csv' } = req.query;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const incomes = await PersonalIncome.find({ student: student._id }).populate('category');
    const expenses = await PersonalExpense.find({ student: student._id }).populate('category');

    let csv = 'Transaction Type,Category,Description,Amount,Date,Recurring,Interval,Tags\n';
    
    incomes.forEach((i: any) => {
      csv += `"Income","${i.category?.name || 'N/A'}","${i.description || 'N/A'}",${i.amount},"${i.date.toISOString().split('T')[0]}",${i.recurring},"${i.recurringInterval || 'N/A'}",""\n`;
    });

    expenses.forEach((e: any) => {
      csv += `"Expense","${e.category?.name || 'N/A'}","${e.description || 'N/A'}",${e.amount},"${e.date.toISOString().split('T')[0]}",${e.recurring},"${e.recurringInterval || 'N/A'}","${e.tags.join(';')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=personal_finance_cashflows_report.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compile statement report sheet', error });
  }
};

export const bulkImportTransactions = async (req: AuthenticatedRequest, res: Response) => {
  const { incomes, expenses } = req.body;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    await ensureFinanceCategoriesSeeded();

    const otherIncomeCat = await IncomeCategory.findOne({ name: 'Other' });
    const otherExpenseCat = await ExpenseCategory.findOne({ name: 'Other' });

    let incomeImportsCount = 0;
    if (incomes && incomes.length > 0) {
      const formattedIncomes = incomes.map((i: any) => ({
        student: student._id,
        amount: Number(i.amount),
        category: i.categoryId || otherIncomeCat?._id,
        description: i.description,
        date: i.date ? new Date(i.date) : new Date(),
        recurring: i.recurring || false
      }));
      await PersonalIncome.insertMany(formattedIncomes);
      incomeImportsCount = formattedIncomes.length;
    }

    let expenseImportsCount = 0;
    if (expenses && expenses.length > 0) {
      const formattedExpenses = expenses.map((e: any) => ({
        student: student._id,
        amount: Number(e.amount),
        category: e.categoryId || otherExpenseCat?._id,
        description: e.description,
        date: e.date ? new Date(e.date) : new Date(),
        recurring: e.recurring || false,
        tags: e.tags || []
      }));
      await PersonalExpense.insertMany(formattedExpenses);
      expenseImportsCount = formattedExpenses.length;
    }

    return res.json({
      message: `Bulk import processed successfully. Added ${incomeImportsCount} incomes and ${expenseImportsCount} expenses.`,
      imports: { incomes: incomeImportsCount, expenses: expenseImportsCount }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error processing bulk statements upload', error });
  }
};

export const getFinanceNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await NotificationEvent.find({
      user: req.user?.id,
      type: { $in: ['BudgetExceeded', 'GoalAchieved', 'UpcomingBill', 'MilestoneReached'] }
    }).sort({ createdAt: -1 }).limit(10);
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Failed loading finance alerts', error });
  }
};

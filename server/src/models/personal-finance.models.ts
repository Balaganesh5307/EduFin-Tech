import mongoose, { Schema, Document } from 'mongoose';

// 1. Income Category Schema
export interface IIncomeCategory extends Document {
  name: string; // e.g. "Parents Allowance", "Freelancing", "Scholarship"
  description?: string;
}

const IncomeCategorySchema = new Schema<IIncomeCategory>({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

export const IncomeCategory = mongoose.model<IIncomeCategory>('IncomeCategory', IncomeCategorySchema);

// 2. Expense Category Schema
export interface IExpenseCategory extends Document {
  name: string; // e.g. "Food", "Books", "Travel", "Subscriptions"
  description?: string;
}

const ExpenseCategorySchema = new Schema<IExpenseCategory>({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

export const ExpenseCategory = mongoose.model<IExpenseCategory>('ExpenseCategory', ExpenseCategorySchema);

// 3. Expense Tag Schema
export interface IExpenseTag extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  name: string;
}

const ExpenseTagSchema = new Schema<IExpenseTag>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  name: { type: String, required: true }
}, { timestamps: true });

ExpenseTagSchema.index({ student: 1, name: 1 }, { unique: true });
export const ExpenseTag = mongoose.model<IExpenseTag>('ExpenseTag', ExpenseTagSchema);

// 4. Income Schema
export interface IIncome extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  amount: number;
  category: mongoose.Types.ObjectId; // IncomeCategory ref
  description?: string;
  date: Date;
  recurring: boolean;
  recurringInterval?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
}

const IncomeSchema = new Schema<IIncome>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'IncomeCategory', required: true },
  description: { type: String },
  date: { type: Date, required: true, default: Date.now },
  recurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'] }
}, { timestamps: true });

export const PersonalIncome = mongoose.model<IIncome>('PersonalIncome', IncomeSchema);

// 5. Expense Schema
export interface IExpense extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  amount: number;
  category: mongoose.Types.ObjectId; // ExpenseCategory ref
  description?: string;
  date: Date;
  recurring: boolean;
  recurringInterval?: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  tags: string[]; // custom tags
  notes?: string;
}

const ExpenseSchema = new Schema<IExpense>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  description: { type: String },
  date: { type: Date, required: true, default: Date.now },
  recurring: { type: Boolean, default: false },
  recurringInterval: { type: String, enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'] },
  tags: [{ type: String }],
  notes: { type: String }
}, { timestamps: true });

export const PersonalExpense = mongoose.model<IExpense>('PersonalExpense', ExpenseSchema);

// 6. Budget Schema
export interface IBudget extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  amount: number;
  period: 'Monthly' | 'Semester' | 'Yearly';
  category?: mongoose.Types.ObjectId; // Optional category-wise budget
  startDate: Date;
  endDate: Date;
  alertsTriggered: boolean;
}

const BudgetSchema = new Schema<IBudget>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  period: { type: String, required: true, enum: ['Monthly', 'Semester', 'Yearly'], default: 'Monthly' },
  category: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  alertsTriggered: { type: Boolean, default: false }
}, { timestamps: true });

export const PersonalBudget = mongoose.model<IBudget>('PersonalBudget', BudgetSchema);

// 7. Budget History Schema
export interface IBudgetHistory extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  budget: mongoose.Types.ObjectId; // Budget ref
  amount: number;
  spent: number;
  period: 'Monthly' | 'Semester' | 'Yearly';
  startDate: Date;
  endDate: Date;
  status: 'Met' | 'Exceeded';
}

const BudgetHistorySchema = new Schema<IBudgetHistory>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  budget: { type: Schema.Types.ObjectId, ref: 'PersonalBudget', required: true },
  amount: { type: Number, required: true },
  spent: { type: Number, required: true },
  period: { type: String, required: true, enum: ['Monthly', 'Semester', 'Yearly'] },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, required: true, enum: ['Met', 'Exceeded'] }
}, { timestamps: true });

export const BudgetHistory = mongoose.model<IBudgetHistory>('BudgetHistory', BudgetHistorySchema);

// 8. Savings Goal Schema
export interface ISavingsGoal extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  name: string; // e.g. "Laptop", "Emergency Fund"
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  monthlyContribution: number;
  milestones: string[]; // Checklist
  isCompleted: boolean;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  name: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: Date, required: true },
  monthlyContribution: { type: Number, default: 0 },
  milestones: [{ type: String }],
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

export const PersonalSavingsGoal = mongoose.model<ISavingsGoal>('PersonalSavingsGoal', SavingsGoalSchema);

// 9. Savings Transaction Schema
export interface ISavingsTransaction extends Document {
  goal: mongoose.Types.ObjectId; // SavingsGoal ref
  amount: number;
  type: 'Deposit' | 'Withdrawal';
  date: Date;
}

const SavingsTransactionSchema = new Schema<ISavingsTransaction>({
  goal: { type: Schema.Types.ObjectId, ref: 'PersonalSavingsGoal', required: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: ['Deposit', 'Withdrawal'], default: 'Deposit' },
  date: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

export const SavingsTransaction = mongoose.model<ISavingsTransaction>('SavingsTransaction', SavingsTransactionSchema);

// 10. Recurring Transaction Schema (Auto-applied actions templates)
export interface IRecurringTransaction extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  type: 'Income' | 'Expense';
  amount: number;
  category: string; // Income/Expense Category ID representation
  description: string;
  interval: 'Daily' | 'Weekly' | 'Monthly';
  nextRunDate: Date;
  isActive: boolean;
}

const RecurringTransactionSchema = new Schema<IRecurringTransaction>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  type: { type: String, required: true, enum: ['Income', 'Expense'] },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  interval: { type: String, required: true, enum: ['Daily', 'Weekly', 'Monthly'] },
  nextRunDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const RecurringTransaction = mongoose.model<IRecurringTransaction>('RecurringTransaction', RecurringTransactionSchema);

// 11. Financial Summary Schema (Aggregated metrics cached)
export interface IFinancialSummary extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  budgetUtilization: number;
  healthScore: number;
}

const FinancialSummarySchema = new Schema<IFinancialSummary>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: String, required: true },
  totalIncome: { type: Number, default: 0 },
  totalExpense: { type: Number, default: 0 },
  totalSavings: { type: Number, default: 0 },
  budgetUtilization: { type: Number, default: 0 },
  healthScore: { type: Number, default: 100 }
}, { timestamps: true });

FinancialSummarySchema.index({ student: 1, month: 1 }, { unique: true });
export const FinancialSummary = mongoose.model<IFinancialSummary>('FinancialSummary', FinancialSummarySchema);

// 12. Financial Insight Schema (AI placeholders)
export interface IFinancialInsight extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  type: 'Advisor' | 'HealthScore' | 'Prediction' | 'Recommendation' | 'Pattern' | 'Risk';
  title: string;
  message: string;
  score?: number;
  date: Date;
}

const FinancialInsightSchema = new Schema<IFinancialInsight>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  type: {
    type: String,
    required: true,
    enum: ['Advisor', 'HealthScore', 'Prediction', 'Recommendation', 'Pattern', 'Risk']
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  score: { type: Number },
  date: { type: Date, required: true, default: Date.now }
}, { timestamps: true });

export const FinancialInsight = mongoose.model<IFinancialInsight>('FinancialInsight', FinancialInsightSchema);

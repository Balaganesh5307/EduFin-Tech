import mongoose, { Schema, Document } from 'mongoose';

// 1. Expense Model
export interface IExpense extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  title: string;
  amount: number;
  category: 'Food' | 'Accommodation' | 'Academics' | 'Entertainment' | 'Travel' | 'Medical' | 'Other';
  date: Date;
  description?: string;
}

const ExpenseSchema = new Schema<IExpense>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Accommodation', 'Academics', 'Entertainment', 'Travel', 'Medical', 'Other'],
    default: 'Other'
  },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String }
}, { timestamps: true });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);


// 2. Budget Model
export interface IBudget extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  category: 'Total' | 'Food' | 'Accommodation' | 'Academics' | 'Entertainment' | 'Travel' | 'Medical' | 'Other';
  limitAmount: number;
  spentAmount: number;
  startDate: Date;
  endDate: Date;
}

const BudgetSchema = new Schema<IBudget>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  category: {
    type: String,
    required: true,
    enum: ['Total', 'Food', 'Accommodation', 'Academics', 'Entertainment', 'Travel', 'Medical', 'Other'],
    default: 'Total'
  },
  limitAmount: { type: Number, required: true },
  spentAmount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true }
}, { timestamps: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);


// 3. Savings Goal Model
export interface ISavingsGoal extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  isActive: boolean;
}

const SavingsGoalSchema = new Schema<ISavingsGoal>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  targetDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const SavingsGoal = mongoose.model<ISavingsGoal>('SavingsGoal', SavingsGoalSchema);

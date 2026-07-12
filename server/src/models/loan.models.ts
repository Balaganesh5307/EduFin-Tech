import mongoose, { Schema, Document } from 'mongoose';

// 1. Loan Scheme Schema
export interface ILoanScheme extends Document {
  name: string; // e.g. "Government Education Loan", "Private Bank Loan", "Emergency Student Loan", etc.
  description: string;
  maxAmount: number;
  minAmount: number;
  interestRate: number; // e.g. 7.5% per annum
  processingFee: number;
  repaymentPeriodMonths: number;
  gracePeriodMonths: number;
  eligibilityRules: {
    minGpa: number;
    maxFamilyIncome: number;
    requireCollateral: boolean;
  };
  status: 'Active' | 'Inactive';
}

const LoanSchemeSchema = new Schema<ILoanScheme>({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  maxAmount: { type: Number, required: true },
  minAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  processingFee: { type: Number, required: true, default: 0 },
  repaymentPeriodMonths: { type: Number, required: true },
  gracePeriodMonths: { type: Number, required: true, default: 6 },
  eligibilityRules: {
    minGpa: { type: Number, default: 0 },
    maxFamilyIncome: { type: Number, default: 99999999 },
    requireCollateral: { type: Boolean, default: false }
  },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const LoanScheme = mongoose.model<ILoanScheme>('LoanScheme', LoanSchemeSchema);

// 2. Loan Program Application Schema (Namespaced to avoid collision with legacy model)
export interface ILoanProgramApplication extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  scheme: mongoose.Types.ObjectId; // LoanScheme ref
  amountRequested: number;
  amountSanctioned?: number;
  purpose: string;
  status: 'Draft' | 'Submitted' | 'Verified' | 'Pending' | 'Approved' | 'Rejected' | 'Disbursed' | 'Closed' | 'Withdrawn';
  submissionDate: Date;
  sanctionDate?: Date;
  repaymentStartDate?: Date;
  riskScore?: number; // Placeholder for AI Risk Prediction (0-100)
  approvalProbability?: number; // Placeholder for AI Approval Probability (0-100)
  defaultProbability?: number; // Placeholder for AI Default Prediction (0-100)
}

const LoanProgramApplicationSchema = new Schema<ILoanProgramApplication>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  scheme: { type: Schema.Types.ObjectId, ref: 'LoanScheme', required: true },
  amountRequested: { type: Number, required: true },
  amountSanctioned: { type: Number },
  purpose: { type: String, required: true },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Verified', 'Pending', 'Approved', 'Rejected', 'Disbursed', 'Closed', 'Withdrawn'],
    default: 'Submitted'
  },
  submissionDate: { type: Date, default: Date.now },
  sanctionDate: { type: Date },
  repaymentStartDate: { type: Date },
  riskScore: { type: Number, default: 10 },
  approvalProbability: { type: Number, default: 90 },
  defaultProbability: { type: Number, default: 5 }
}, { timestamps: true });

export const LoanProgramApplication = mongoose.model<ILoanProgramApplication>('LoanProgramApplication', LoanProgramApplicationSchema);

// 3. Loan Program Document Schema
export interface ILoanProgramDocument extends Document {
  application: mongoose.Types.ObjectId; // LoanProgramApplication ref
  documentType: 'IncomeCertificate' | 'IdentityProof' | 'AddressProof' | 'AdmissionLetter' | 'FeeStructure' | 'BankPassbook' | 'ParentIncomeProof' | 'CollateralDocuments';
  filePath: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  rejectedReason?: string;
}

const LoanProgramDocumentSchema = new Schema<ILoanProgramDocument>({
  application: { type: Schema.Types.ObjectId, ref: 'LoanProgramApplication', required: true },
  documentType: {
    type: String,
    required: true,
    enum: [
      'IncomeCertificate',
      'IdentityProof',
      'AddressProof',
      'AdmissionLetter',
      'FeeStructure',
      'BankPassbook',
      'ParentIncomeProof',
      'CollateralDocuments'
    ]
  },
  filePath: { type: String, required: true },
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  rejectedReason: { type: String }
}, { timestamps: true });

export const LoanProgramDocument = mongoose.model<ILoanProgramDocument>('LoanProgramDocument', LoanProgramDocumentSchema);

// 4. Loan Program Approval Schema
export interface ILoanProgramApproval extends Document {
  application: mongoose.Types.ObjectId; // LoanProgramApplication ref
  reviewer: mongoose.Types.ObjectId; // User ref
  decision: 'Approved' | 'Rejected';
  comments: string;
  interestRateConfigured: number;
  repaymentPeriodMonthsConfigured: number;
  gracePeriodMonthsConfigured: number;
  date: Date;
}

const LoanProgramApprovalSchema = new Schema<ILoanProgramApproval>({
  application: { type: Schema.Types.ObjectId, ref: 'LoanProgramApplication', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  decision: { type: String, required: true, enum: ['Approved', 'Rejected'] },
  comments: { type: String, required: true },
  interestRateConfigured: { type: Number, required: true },
  repaymentPeriodMonthsConfigured: { type: Number, required: true },
  gracePeriodMonthsConfigured: { type: Number, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export const LoanProgramApproval = mongoose.model<ILoanProgramApproval>('LoanProgramApproval', LoanProgramApprovalSchema);

// 5. Loan Program EMI Schedule Schema
export interface ILoanProgramEMISchedule extends Document {
  application: mongoose.Types.ObjectId; // LoanProgramApplication ref
  student: mongoose.Types.ObjectId; // Student ref
  installmentNumber: number;
  dueDate: Date;
  emiAmount: number;
  principalAmount: number;
  interestAmount: number;
  lateFeeApplied: number;
  status: 'Unpaid' | 'Paid' | 'Overdue';
  paidDate?: Date;
  transactionReference?: string;
}

const LoanProgramEMIScheduleSchema = new Schema<ILoanProgramEMISchedule>({
  application: { type: Schema.Types.ObjectId, ref: 'LoanProgramApplication', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  installmentNumber: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  emiAmount: { type: Number, required: true },
  principalAmount: { type: Number, required: true },
  interestAmount: { type: Number, required: true },
  lateFeeApplied: { type: Number, default: 0 },
  status: { type: String, enum: ['Unpaid', 'Paid', 'Overdue'], default: 'Unpaid' },
  paidDate: { type: Date },
  transactionReference: { type: String }
}, { timestamps: true });

export const LoanProgramEMISchedule = mongoose.model<ILoanProgramEMISchedule>('LoanProgramEMISchedule', LoanProgramEMIScheduleSchema);

// 6. Loan Program Repayment Schema
export interface ILoanProgramRepayment extends Document {
  application: mongoose.Types.ObjectId; // LoanProgramApplication ref
  student: mongoose.Types.ObjectId; // Student ref
  emiSchedule: mongoose.Types.ObjectId; // LoanProgramEMISchedule ref
  amountPaid: number;
  principalPaid: number;
  interestPaid: number;
  lateFeePaid: number;
  paymentDate: Date;
  paymentMethod: string; // e.g. "NetBanking", "UPI", "Razorpay"
  transactionId: string;
}

const LoanProgramRepaymentSchema = new Schema<ILoanProgramRepayment>({
  application: { type: Schema.Types.ObjectId, ref: 'LoanProgramApplication', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  emiSchedule: { type: Schema.Types.ObjectId, ref: 'LoanProgramEMISchedule', required: true },
  amountPaid: { type: Number, required: true },
  principalPaid: { type: Number, required: true },
  interestPaid: { type: Number, required: true },
  lateFeePaid: { type: Number, default: 0 },
  paymentDate: { type: Date, default: Date.now },
  paymentMethod: { type: String, required: true },
  transactionId: { type: String, required: true }
}, { timestamps: true });

export const LoanProgramRepayment = mongoose.model<ILoanProgramRepayment>('LoanProgramRepayment', LoanProgramRepaymentSchema);

// 7. Loan Program Transaction Schema
export interface ILoanProgramTransaction extends Document {
  application: mongoose.Types.ObjectId; // LoanProgramApplication ref
  student: mongoose.Types.ObjectId; // Student ref
  type: 'Disbursement' | 'Repayment' | 'Penalty';
  amount: number;
  date: Date;
  description: string;
  referenceId: mongoose.Types.ObjectId; // ref to Repayment or Approval
}

const LoanProgramTransactionSchema = new Schema<ILoanProgramTransaction>({
  application: { type: Schema.Types.ObjectId, ref: 'LoanProgramApplication', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  type: { type: String, enum: ['Disbursement', 'Repayment', 'Penalty'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  referenceId: { type: Schema.Types.ObjectId, required: true }
}, { timestamps: true });

export const LoanProgramTransaction = mongoose.model<ILoanProgramTransaction>('LoanProgramTransaction', LoanProgramTransactionSchema);

// 8. Loan Program Statement Schema
export interface ILoanProgramStatement extends Document {
  application: mongoose.Types.ObjectId; // LoanProgramApplication ref
  student: mongoose.Types.ObjectId; // Student ref
  statementPeriodStart: Date;
  statementPeriodEnd: Date;
  totalDisbursed: number;
  totalRepaid: number;
  outstandingBalance: number;
  generatedDate: Date;
  statementPdfPath?: string;
}

const LoanProgramStatementSchema = new Schema<ILoanProgramStatement>({
  application: { type: Schema.Types.ObjectId, ref: 'LoanProgramApplication', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  statementPeriodStart: { type: Date, required: true },
  statementPeriodEnd: { type: Date, required: true },
  totalDisbursed: { type: Number, required: true },
  totalRepaid: { type: Number, required: true },
  outstandingBalance: { type: Number, required: true },
  generatedDate: { type: Date, default: Date.now },
  statementPdfPath: { type: String }
}, { timestamps: true });

export const LoanProgramStatement = mongoose.model<ILoanProgramStatement>('LoanProgramStatement', LoanProgramStatementSchema);

// 9. Loan Program Notification Schema
export interface ILoanProgramNotification extends Document {
  user: mongoose.Types.ObjectId; // User ref
  title: string;
  message: string;
  type: 'ApplicationSubmitted' | 'DocumentsMissing' | 'LoanApproved' | 'LoanRejected' | 'EMIReminder' | 'PaymentSuccessful' | 'LoanClosed';
  isRead: boolean;
}

const LoanProgramNotificationSchema = new Schema<ILoanProgramNotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'ApplicationSubmitted',
      'DocumentsMissing',
      'LoanApproved',
      'LoanRejected',
      'EMIReminder',
      'PaymentSuccessful',
      'LoanClosed'
    ],
    required: true
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const LoanProgramNotification = mongoose.model<ILoanProgramNotification>('LoanProgramNotification', LoanProgramNotificationSchema);

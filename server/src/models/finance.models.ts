import mongoose, { Schema, Document } from 'mongoose';

// 1. Fee Category Schema
export interface IFeeCategory extends Document {
  name: string; // Tuition, Hostel, Lab, Library, Exam
  description?: string;
}

const FeeCategorySchema = new Schema<IFeeCategory>({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

export const FeeCategory = mongoose.model<IFeeCategory>('FeeCategory', FeeCategorySchema);


// 2. Fee Structure Schema
export interface IFeeItem {
  category: mongoose.Types.ObjectId; // FeeCategory ref
  amount: number;
}

export interface IFeeStructure extends Document {
  name: string; // e.g., "B.Tech CSE - Semester 1 - 2026 Batch"
  course: mongoose.Types.ObjectId; // Course ref
  semester: mongoose.Types.ObjectId; // Semester ref
  items: IFeeItem[];
  totalAmount: number;
}

const FeeStructureSchema = new Schema<IFeeStructure>({
  name: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  items: [{
    category: { type: Schema.Types.ObjectId, ref: 'FeeCategory', required: true },
    amount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true }
}, { timestamps: true });

export const FeeStructure = mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);


// 3. Fee Collection (Student Invoice) Schema
export interface IFeeCollection extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  feeStructure: mongoose.Types.ObjectId; // FeeStructure ref
  totalAmount: number;
  discountAmount: number; // e.g., applied from scholarships
  paidAmount: number;
  balanceAmount: number;
  dueDate: Date;
  status: 'Paid' | 'PartiallyPaid' | 'Unpaid' | 'Overdue';
}

const FeeCollectionSchema = new Schema<IFeeCollection>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  feeStructure: { type: Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
  totalAmount: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Paid', 'PartiallyPaid', 'Unpaid', 'Overdue'],
    default: 'Unpaid'
  }
}, { timestamps: true });

export const FeeCollection = mongoose.model<IFeeCollection>('FeeCollection', FeeCollectionSchema);


// 4. Payment Schema
export interface IPayment extends Document {
  feeCollection: mongoose.Types.ObjectId; // FeeCollection ref
  student: mongoose.Types.ObjectId; // Student ref
  amount: number;
  paymentMethod: 'Razorpay' | 'BankTransfer' | 'Cash' | 'Card';
  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';
  transactionId: string; // Unique transaction token
  receiptNumber: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paidAt?: Date;
}

const PaymentSchema = new Schema<IPayment>({
  feeCollection: { type: Schema.Types.ObjectId, ref: 'FeeCollection', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['Razorpay', 'BankTransfer', 'Cash', 'Card'] },
  status: { type: String, required: true, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
  transactionId: { type: String, required: true, unique: true },
  receiptNumber: { type: String, required: true, unique: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  paidAt: { type: Date }
}, { timestamps: true });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);


// 5. Scholarship & Applications
export interface IScholarship extends Document {
  name: string;
  description: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: number; // e.g. 50% or 20000 INR
  eligibilityCriteria: string;
  isActive: boolean;
}

const ScholarshipSchema = new Schema<IScholarship>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  discountType: { type: String, required: true, enum: ['Percentage', 'Fixed'] },
  discountValue: { type: Number, required: true },
  eligibilityCriteria: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Scholarship = mongoose.model<IScholarship>('Scholarship', ScholarshipSchema);

export interface IScholarshipApplication extends Document {
  scholarship: mongoose.Types.ObjectId; // Scholarship ref
  student: mongoose.Types.ObjectId; // Student ref
  gpa: number;
  familyIncome: number;
  documentUrl?: string; // Proof of eligibility
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: mongoose.Types.ObjectId; // Admin ref
  remarks?: string;
}

const ScholarshipApplicationSchema = new Schema<IScholarshipApplication>({
  scholarship: { type: Schema.Types.ObjectId, ref: 'Scholarship', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  gpa: { type: Number, required: true },
  familyIncome: { type: Number, required: true },
  documentUrl: { type: String },
  status: { type: String, required: true, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  remarks: { type: String }
}, { timestamps: true });

export const ScholarshipApplication = mongoose.model<IScholarshipApplication>('ScholarshipApplication', ScholarshipApplicationSchema);


// 6. Education Loan Schema
export interface ILoanInstallment {
  dueDate: Date;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  paidAt?: Date;
}

export interface IEducationLoan extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  coApplicantName: string;
  coApplicantRelationship: string;
  coApplicantIncome: number;
  loanAmount: number;
  interestRate: number; // e.g. 7.5% per annum
  durationMonths: number;
  emiAmount: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Disbursed' | 'Closed';
  documentUrl?: string; // Loan collateral/documents
  installments: ILoanInstallment[];
  remarks?: string;
}

const EducationLoanSchema = new Schema<IEducationLoan>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  coApplicantName: { type: String, required: true },
  coApplicantRelationship: { type: String, required: true },
  coApplicantIncome: { type: Number, required: true },
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  durationMonths: { type: Number, required: true },
  emiAmount: { type: Number, required: true },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Approved', 'Rejected', 'Disbursed', 'Closed'],
    default: 'Pending'
  },
  documentUrl: { type: String },
  installments: [{
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    status: { type: String, required: true, enum: ['Paid', 'Unpaid', 'Overdue'], default: 'Unpaid' },
    paidAt: { type: Date }
  }],
  remarks: { type: String }
}, { timestamps: true });

export const EducationLoan = mongoose.model<IEducationLoan>('EducationLoan', EducationLoanSchema);

import mongoose, { Schema, Document } from 'mongoose';

// 1. Late Fee Rule Schema
export interface ILateFeeRule extends Document {
  name: string;
  gracePeriodDays: number;
  penaltyType: 'Fixed' | 'Percentage';
  penaltyValue: number;
  frequency: 'Once' | 'Daily' | 'Weekly';
  isActive: boolean;
}

const LateFeeRuleSchema = new Schema<ILateFeeRule>({
  name: { type: String, required: true },
  gracePeriodDays: { type: Number, required: true, default: 0 },
  penaltyType: { type: String, required: true, enum: ['Fixed', 'Percentage'], default: 'Fixed' },
  penaltyValue: { type: Number, required: true, default: 0 },
  frequency: { type: String, required: true, enum: ['Once', 'Daily', 'Weekly'], default: 'Once' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const LateFeeRule = mongoose.model<ILateFeeRule>('LateFeeRule', LateFeeRuleSchema);

// 2. Fee Template Schema
export interface IFeeTemplateItem {
  category: mongoose.Types.ObjectId; // FeeCategory ref
  amount: number;
}

export interface IFeeTemplate extends Document {
  name: string;
  academicYear: string;
  items: IFeeTemplateItem[];
  totalAmount: number;
  lateFeeRule?: mongoose.Types.ObjectId; // LateFeeRule ref
}

const FeeTemplateSchema = new Schema<IFeeTemplate>({
  name: { type: String, required: true },
  academicYear: { type: String, required: true },
  items: [{
    category: { type: Schema.Types.ObjectId, ref: 'FeeCategory', required: true },
    amount: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  lateFeeRule: { type: Schema.Types.ObjectId, ref: 'LateFeeRule' }
}, { timestamps: true });

export const FeeTemplate = mongoose.model<IFeeTemplate>('FeeTemplate', FeeTemplateSchema);

// 3. Student Fee Schema (assigned fee schedule)
export interface IInstallment {
  _id?: mongoose.Types.ObjectId;
  dueDate: Date;
  amount: number;
  paidAmount: number;
  penaltyAmount: number;
  status: 'Paid' | 'PartiallyPaid' | 'Unpaid' | 'Overdue';
  paidAt?: Date;
}

export interface IStudentFee extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  academicYear: string;
  semester: mongoose.Types.ObjectId; // Semester ref
  title: string;
  totalAmount: number;
  discountAmount: number; // Scholarship, waivers
  paidAmount: number;
  balanceAmount: number;
  dueDate: Date;
  status: 'Paid' | 'PartiallyPaid' | 'Unpaid' | 'Overdue';
  lateFeeRule?: mongoose.Types.ObjectId; // LateFeeRule ref
  lateFeeApplied: number;
  installments: IInstallment[];
  source: 'Template' | 'Custom';
  template?: mongoose.Types.ObjectId; // FeeTemplate ref
  fundingSource: 'Self' | 'Scholarship' | 'Loan' | 'Sponsor' | 'Institution';
}

const StudentFeeSchema = new Schema<IStudentFee>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  academicYear: { type: String, required: true },
  semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  title: { type: String, required: true },
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
  },
  lateFeeRule: { type: Schema.Types.ObjectId, ref: 'LateFeeRule' },
  lateFeeApplied: { type: Number, default: 0 },
  installments: [{
    dueDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    penaltyAmount: { type: Number, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ['Paid', 'PartiallyPaid', 'Unpaid', 'Overdue'],
      default: 'Unpaid'
    },
    paidAt: { type: Date }
  }],
  source: { type: String, enum: ['Template', 'Custom'], default: 'Custom' },
  template: { type: Schema.Types.ObjectId, ref: 'FeeTemplate' },
  fundingSource: {
    type: String,
    enum: ['Self', 'Scholarship', 'Loan', 'Sponsor', 'Institution'],
    default: 'Self'
  }
}, { timestamps: true });

export const StudentFee = mongoose.model<IStudentFee>('StudentFee', StudentFeeSchema);

// 4. Invoice Schema
export interface IInvoice extends Document {
  invoiceNumber: string;
  student: mongoose.Types.ObjectId; // Student ref
  studentFee: mongoose.Types.ObjectId; // StudentFee ref
  amount: number;
  issueDate: Date;
  dueDate: Date;
  status: 'Unpaid' | 'Paid' | 'Cancelled';
}

const InvoiceSchema = new Schema<IInvoice>({
  invoiceNumber: { type: String, required: true, unique: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  studentFee: { type: Schema.Types.ObjectId, ref: 'StudentFee', required: true },
  amount: { type: Number, required: true },
  issueDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date, required: true },
  status: { type: String, required: true, enum: ['Unpaid', 'Paid', 'Cancelled'], default: 'Unpaid' }
}, { timestamps: true });

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);

// 5. Ledger (Chronological Student Statement)
export interface ILedgerEntry {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  type: 'Debit' | 'Credit';
  amount: number;
  description: string;
  balance: number;
  referenceType: 'StudentFee' | 'Payment' | 'Refund' | 'Scholarship' | 'Loan';
  referenceId: mongoose.Types.ObjectId;
}

export interface ILedger extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  entries: ILedgerEntry[];
}

const LedgerSchema = new Schema<ILedger>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
  entries: [{
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, required: true, enum: ['Debit', 'Credit'] },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    balance: { type: Number, required: true },
    referenceType: {
      type: String,
      required: true,
      enum: ['StudentFee', 'Payment', 'Refund', 'Scholarship', 'Loan']
    },
    referenceId: { type: Schema.Types.ObjectId, required: true }
  }]
}, { timestamps: true });

export const Ledger = mongoose.model<ILedger>('Ledger', LedgerSchema);

// 6. Refund Schema
export interface IRefund extends Document {
  payment: mongoose.Types.ObjectId; // Payment ref
  student: mongoose.Types.ObjectId; // Student ref
  amount: number;
  status: 'Pending' | 'Completed' | 'Failed';
  reason: string;
  refundedAt?: Date;
}

const RefundSchema = new Schema<IRefund>({
  payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true, enum: ['Pending', 'Completed', 'Failed'], default: 'Pending' },
  reason: { type: String, required: true },
  refundedAt: { type: Date }
}, { timestamps: true });

export const Refund = mongoose.model<IRefund>('Refund', RefundSchema);

// 7. Payment Gateway Logs Schema (for tracking API order checkouts and webhooks)
export interface IPaymentGateway extends Document {
  orderId: string;
  paymentId?: string;
  student: mongoose.Types.ObjectId; // Student ref
  amount: number;
  event: 'OrderCreated' | 'PaymentCaptured' | 'PaymentFailed' | 'WebhookReceived';
  payload: Schema.Types.Mixed;
}

const PaymentGatewaySchema = new Schema<IPaymentGateway>({
  orderId: { type: String, required: true },
  paymentId: { type: String },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  event: {
    type: String,
    required: true,
    enum: ['OrderCreated', 'PaymentCaptured', 'PaymentFailed', 'WebhookReceived']
  },
  payload: { type: Schema.Types.Mixed }
}, { timestamps: true });

export const PaymentGateway = mongoose.model<IPaymentGateway>('PaymentGateway', PaymentGatewaySchema);

// 8. Notification Event Schema
export interface INotificationEvent extends Document {
  user: mongoose.Types.ObjectId; // User ref
  title: string;
  message: string;
  type: 'FeeAssigned' | 'PaymentSuccess' | 'PaymentFailed' | 'DueTomorrow' | 'LateFeeApplied' | 'ReceiptGenerated';
  isRead: boolean;
}

const NotificationEventSchema = new Schema<INotificationEvent>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['FeeAssigned', 'PaymentSuccess', 'PaymentFailed', 'DueTomorrow', 'LateFeeApplied', 'ReceiptGenerated']
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const NotificationEvent = mongoose.model<INotificationEvent>('NotificationEvent', NotificationEventSchema);

// 9. Receipt Schema (proof of payment)
export interface IReceipt extends Document {
  receiptNumber: string;
  payment: mongoose.Types.ObjectId; // Payment ref
  student: mongoose.Types.ObjectId; // Student ref
  invoice: mongoose.Types.ObjectId; // Invoice ref
  amount: number;
  date: Date;
  qrCodeData: string; // QR verification hash string
}

const ReceiptSchema = new Schema<IReceipt>({
  receiptNumber: { type: String, required: true, unique: true },
  payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  qrCodeData: { type: String, required: true }
}, { timestamps: true });

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);

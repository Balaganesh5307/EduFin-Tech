import mongoose, { Schema, Document } from 'mongoose';

// 1. Notification Model
export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId; // User ref
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Success' | 'Alert' | 'Finance';
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['Info', 'Warning', 'Success', 'Alert', 'Finance'],
    default: 'Info'
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);


// 2. Document Model
export interface IDocument extends Document {
  user: mongoose.Types.ObjectId; // User ref
  title: string;
  documentType: 'Receipt' | 'IDProof' | 'GradeSheet' | 'LoanCollateral' | 'ScholarshipProof' | 'Other';
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  remarks?: string;
}

const DocumentSchema = new Schema<IDocument>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  documentType: {
    type: String,
    required: true,
    enum: ['Receipt', 'IDProof', 'GradeSheet', 'LoanCollateral', 'ScholarshipProof', 'Other'],
    default: 'Other'
  },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  remarks: { type: String }
}, { timestamps: true });

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);


// 3. Audit Log Model
export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId; // User ref (optional for anonymous actions like failed logins)
  action: string; // e.g. "USER_LOGIN", "FEE_PAYMENT", "LOAN_APPROVE"
  description: string;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  description: { type: String, required: true },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: true });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

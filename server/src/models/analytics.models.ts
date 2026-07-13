import mongoose, { Schema, Document } from 'mongoose';

// 1. Analytics Snapshot (daily aggregate stats)
export interface IAnalyticsSnapshot extends Document {
  snapshotDate: Date;
  totalStudents: number;
  totalFaculty: number;
  totalRevenue: number;
  pendingFees: number;
  scholarshipDistributed: number;
  loanPortfolio: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
  growthRate: number;
  systemHealth: string;
}

const AnalyticsSnapshotSchema = new Schema<IAnalyticsSnapshot>({
  snapshotDate: { type: Date, required: true, default: Date.now, unique: true },
  totalStudents: { type: Number, default: 0 },
  totalFaculty: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  pendingFees: { type: Number, default: 0 },
  scholarshipDistributed: { type: Number, default: 0 },
  loanPortfolio: { type: Number, default: 0 },
  dailyActiveUsers: { type: Number, default: 12 },
  monthlyActiveUsers: { type: Number, default: 45 },
  growthRate: { type: Number, default: 5.4 },
  systemHealth: { type: String, default: 'Healthy' }
}, { timestamps: true });

export const AnalyticsSnapshot = mongoose.model<IAnalyticsSnapshot>('AnalyticsSnapshot', AnalyticsSnapshotSchema);

// 2. Dashboard Widget Configuration
export interface IDashboardWidget extends Document {
  userId: mongoose.Types.ObjectId; // User ref
  widgetId: string;
  title: string;
  type: string; // e.g. 'LineChart', 'PieChart'
  position: { x: number; y: number; w: number; h: number };
  isVisible: boolean;
}

const DashboardWidgetSchema = new Schema<IDashboardWidget>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  widgetId: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    w: { type: Number, required: true },
    h: { type: Number, required: true }
  },
  isVisible: { type: Boolean, default: true }
}, { timestamps: true });

export const DashboardWidget = mongoose.model<IDashboardWidget>('DashboardWidget', DashboardWidgetSchema);

// 3. KPI Schema
export interface IKPI extends Document {
  name: string;
  category: 'Finance' | 'Academic' | 'System';
  targetValue: number;
  actualValue: number;
  unit: string; // e.g., 'INR', '%', 'Users'
  trend: 'Up' | 'Down' | 'Stable';
}

const KPISchema = new Schema<IKPI>({
  name: { type: String, required: true },
  category: { type: String, enum: ['Finance', 'Academic', 'System'], required: true },
  targetValue: { type: Number, required: true },
  actualValue: { type: Number, required: true },
  unit: { type: String, required: true },
  trend: { type: String, enum: ['Up', 'Down', 'Stable'], default: 'Stable' }
}, { timestamps: true });

export const KPI = mongoose.model<IKPI>('KPI', KPISchema);

// 4. Report Template
export interface IReportTemplate extends Document {
  name: string;
  description: string;
  type: 'Revenue' | 'Attendance' | 'Student' | 'Department' | 'Scholarship' | 'Loan' | 'Expense' | 'Budget' | 'FinancialStatement' | 'Audit';
  filters: {
    dateRange?: boolean;
    department?: boolean;
    semester?: boolean;
  };
}

const ReportTemplateSchema = new Schema<IReportTemplate>({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['Revenue', 'Attendance', 'Student', 'Department', 'Scholarship', 'Loan', 'Expense', 'Budget', 'FinancialStatement', 'Audit'],
    required: true
  },
  filters: {
    dateRange: { type: Boolean, default: true },
    department: { type: Boolean, default: false },
    semester: { type: Boolean, default: false }
  }
}, { timestamps: true });

export const ReportTemplate = mongoose.model<IReportTemplate>('ReportTemplate', ReportTemplateSchema);

// 5. Report History
export interface IReportHistory extends Document {
  template: mongoose.Types.ObjectId; // ReportTemplate ref
  generatedBy: mongoose.Types.ObjectId; // User ref
  format: 'PDF' | 'Excel' | 'CSV';
  fileUrl: string;
  fileSize?: number;
}

const ReportHistorySchema = new Schema<IReportHistory>({
  template: { type: Schema.Types.ObjectId, ref: 'ReportTemplate', required: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  format: { type: String, enum: ['PDF', 'Excel', 'CSV'], required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number }
}, { timestamps: true });

export const ReportHistory = mongoose.model<IReportHistory>('ReportHistory', ReportHistorySchema);

// 6. Activity Log
export interface IActivityLog extends Document {
  user: mongoose.Types.ObjectId; // User ref
  role: string;
  action: string;
  module: string;
  description: string;
  ipAddress?: string;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  module: { type: String, required: true },
  description: { type: String, required: true },
  ipAddress: { type: String }
}, { timestamps: true });

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

// 7. Financial Metrics
export interface IFinancialMetrics extends Document {
  month: string; // e.g. "2026-07"
  revenue: number;
  collectionsRate: number;
  outstandingBalance: number;
  scholarshipPayouts: number;
  loanRecoveries: number;
  cashFlow: number;
}

const FinancialMetricsSchema = new Schema<IFinancialMetrics>({
  month: { type: String, required: true, unique: true },
  revenue: { type: Number, default: 0 },
  collectionsRate: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  scholarshipPayouts: { type: Number, default: 0 },
  loanRecoveries: { type: Number, default: 0 },
  cashFlow: { type: Number, default: 0 }
}, { timestamps: true });

export const FinancialMetrics = mongoose.model<IFinancialMetrics>('FinancialMetrics', FinancialMetricsSchema);

// 8. Academic Metrics
export interface IAcademicMetrics extends Document {
  semesterId: mongoose.Types.ObjectId; // Semester ref
  courseId: mongoose.Types.ObjectId; // Course ref
  averageGPA: number;
  passingRate: number;
  attendanceRate: number;
}

const AcademicMetricsSchema = new Schema<IAcademicMetrics>({
  semesterId: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  averageGPA: { type: Number, default: 0 },
  passingRate: { type: Number, default: 0 },
  attendanceRate: { type: Number, default: 0 }
}, { timestamps: true });

AcademicMetricsSchema.index({ semesterId: 1, courseId: 1 }, { unique: true });
export const AcademicMetrics = mongoose.model<IAcademicMetrics>('AcademicMetrics', AcademicMetricsSchema);

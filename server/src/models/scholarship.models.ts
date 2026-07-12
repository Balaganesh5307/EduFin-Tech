import mongoose, { Schema, Document } from 'mongoose';

// 1. Scholarship Category Schema
export interface IScholarshipCategory extends Document {
  name: string; // e.g. "Government Scholarship", "Merit Scholarship", "Sports Scholarship", etc.
  description?: string;
}

const ScholarshipCategorySchema = new Schema<IScholarshipCategory>({
  name: { type: String, required: true, unique: true },
  description: { type: String }
}, { timestamps: true });

export const ScholarshipCategory = mongoose.model<IScholarshipCategory>('ScholarshipCategory', ScholarshipCategorySchema);

// 2. Scholarship Rule Schema (Configurable Eligibility Engine)
export interface IEligibilityRule extends Document {
  minGpa: number;
  minAttendance: number;
  maxFamilyIncome: number;
  allowedDepartments: string[]; // matches Department name or ID
  allowedCourses: string[]; // matches Course name or ID
  allowedSemesters: string[]; // matches Semester name or ID
  allowedCommunities: string[]; // e.g. General, OBC, SC, ST
  sportsAchievementRequired: boolean;
  disabilityAllowed: boolean;
  academicStandingRequired: 'Good' | 'Probation' | 'Suspended';
}

export const EligibilityRuleSchema = new Schema<IEligibilityRule>({
  minGpa: { type: Number, default: 0 },
  minAttendance: { type: Number, default: 0 },
  maxFamilyIncome: { type: Number, default: 99999999 },
  allowedDepartments: [{ type: String }],
  allowedCourses: [{ type: String }],
  allowedSemesters: [{ type: String }],
  allowedCommunities: [{ type: String }],
  sportsAchievementRequired: { type: Boolean, default: false },
  disabilityAllowed: { type: Boolean, default: false },
  academicStandingRequired: { type: String, enum: ['Good', 'Probation', 'Suspended'], default: 'Good' }
}, { _id: false });

// 3. Scholarship Program Schema (Renamed from Scholarship to avoid mongoose collision)
export interface IScholarshipProgram extends Document {
  title: string;
  description: string;
  provider: string; // E.g., "State Welfare Department", "Corporate CSR", etc.
  category: mongoose.Types.ObjectId; // ScholarshipCategory ref
  amount: number;
  maxBeneficiaries: number;
  applicationDeadline: Date;
  eligibilityRules: IEligibilityRule;
  requiredDocuments: string[]; // Array of docTypes, e.g. ['IncomeCertificate', 'MarkSheets']
  status: 'Draft' | 'Active' | 'Closed';
  academicYear: string;
}

const ScholarshipProgramSchema = new Schema<IScholarshipProgram>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  provider: { type: String, required: true },
  category: { type: Schema.Types.ObjectId, ref: 'ScholarshipCategory', required: true },
  amount: { type: Number, required: true },
  maxBeneficiaries: { type: Number, required: true, default: 100 },
  applicationDeadline: { type: Date, required: true },
  eligibilityRules: { type: EligibilityRuleSchema, required: true },
  requiredDocuments: [{ type: String }],
  status: { type: String, enum: ['Draft', 'Active', 'Closed'], default: 'Draft' },
  academicYear: { type: String, required: true }
}, { timestamps: true });

export const ScholarshipProgram = mongoose.model<IScholarshipProgram>('ScholarshipProgram', ScholarshipProgramSchema);

// 4. Scholarship Aid Application Schema (Renamed from ScholarshipApplication to avoid collision)
export interface IScholarshipAidApplication extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  scholarship: mongoose.Types.ObjectId; // ScholarshipProgram ref
  status: 'Draft' | 'Submitted' | 'Verified' | 'PendingReview' | 'Approved' | 'Rejected' | 'Waitlisted' | 'Withdrawn';
  currentGpa: number;
  familyIncome: number;
  motivationStatement: string;
  submissionDate: Date;
  approvalLetterPath?: string;
  matchesScore: number; // Placeholder for Student Scholarship Match Score (0-100)
  eligibilityScore: number; // Placeholder for Eligibility Score (0-100)
  approvalProbability: number; // Placeholder for Approval Probability (0-100)
}

const ScholarshipAidApplicationSchema = new Schema<IScholarshipAidApplication>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  scholarship: { type: Schema.Types.ObjectId, ref: 'ScholarshipProgram', required: true },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Verified', 'PendingReview', 'Approved', 'Rejected', 'Waitlisted', 'Withdrawn'],
    default: 'Submitted'
  },
  currentGpa: { type: Number, required: true },
  familyIncome: { type: Number, required: true },
  motivationStatement: { type: String, required: true },
  submissionDate: { type: Date, default: Date.now },
  approvalLetterPath: { type: String },
  matchesScore: { type: Number, default: 100 },
  eligibilityScore: { type: Number, default: 100 },
  approvalProbability: { type: Number, default: 100 }
}, { timestamps: true });

export const ScholarshipAidApplication = mongoose.model<IScholarshipAidApplication>('ScholarshipAidApplication', ScholarshipAidApplicationSchema);

// 5. Scholarship Aid Document Schema
export interface IScholarshipAidDocument extends Document {
  application: mongoose.Types.ObjectId; // ScholarshipAidApplication ref
  documentType: 'IncomeCertificate' | 'CommunityCertificate' | 'SportsCertificate' | 'DisabilityCertificate' | 'MarkSheets' | 'RecommendationLetter' | 'IdentityProof' | 'BankPassbook';
  filePath: string;
  verificationStatus: 'Pending' | 'Verified' | 'Rejected';
  rejectedReason?: string;
}

const ScholarshipAidDocumentSchema = new Schema<IScholarshipAidDocument>({
  application: { type: Schema.Types.ObjectId, ref: 'ScholarshipAidApplication', required: true },
  documentType: {
    type: String,
    required: true,
    enum: [
      'IncomeCertificate',
      'CommunityCertificate',
      'SportsCertificate',
      'DisabilityCertificate',
      'MarkSheets',
      'RecommendationLetter',
      'IdentityProof',
      'BankPassbook'
    ]
  },
  filePath: { type: String, required: true },
  verificationStatus: { type: String, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
  rejectedReason: { type: String }
}, { timestamps: true });

export const ScholarshipAidDocument = mongoose.model<IScholarshipAidDocument>('ScholarshipAidDocument', ScholarshipAidDocumentSchema);

// 6. Scholarship Aid Award Schema
export interface IScholarshipAidAward extends Document {
  application: mongoose.Types.ObjectId; // ScholarshipAidApplication ref
  student: mongoose.Types.ObjectId; // Student ref
  scholarship: mongoose.Types.ObjectId; // ScholarshipProgram ref
  amount: number;
  academicYear: string;
  awardDate: Date;
  ledgerEntryId?: mongoose.Types.ObjectId; // References the index within LedgerEntries
  isDisbursed: boolean;
}

const ScholarshipAidAwardSchema = new Schema<IScholarshipAidAward>({
  application: { type: Schema.Types.ObjectId, ref: 'ScholarshipAidApplication', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  scholarship: { type: Schema.Types.ObjectId, ref: 'ScholarshipProgram', required: true },
  amount: { type: Number, required: true },
  academicYear: { type: String, required: true },
  awardDate: { type: Date, default: Date.now },
  ledgerEntryId: { type: Schema.Types.ObjectId },
  isDisbursed: { type: Boolean, default: false }
}, { timestamps: true });

export const ScholarshipAidAward = mongoose.model<IScholarshipAidAward>('ScholarshipAidAward', ScholarshipAidAwardSchema);

// 7. Scholarship Aid Timeline Schema
export interface IScholarshipAidTimeline extends Document {
  application: mongoose.Types.ObjectId; // ScholarshipAidApplication ref
  status: string;
  description: string;
  date: Date;
  performedBy: string; // e.g. "Student", "System", "Chief Financial Officer"
}

const ScholarshipAidTimelineSchema = new Schema<IScholarshipAidTimeline>({
  application: { type: Schema.Types.ObjectId, ref: 'ScholarshipAidApplication', required: true },
  status: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  performedBy: { type: String, required: true }
}, { timestamps: true });

export const ScholarshipAidTimeline = mongoose.model<IScholarshipAidTimeline>('ScholarshipAidTimeline', ScholarshipAidTimelineSchema);

// 8. Scholarship Application Review Schema
export interface IScholarshipApplicationReview extends Document {
  application: mongoose.Types.ObjectId; // ScholarshipAidApplication ref
  reviewer: mongoose.Types.ObjectId; // User ref
  decision: 'Approved' | 'Rejected' | 'Waitlisted';
  comments: string;
  date: Date;
}

const ScholarshipApplicationReviewSchema = new Schema<IScholarshipApplicationReview>({
  application: { type: Schema.Types.ObjectId, ref: 'ScholarshipAidApplication', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  decision: { type: String, required: true, enum: ['Approved', 'Rejected', 'Waitlisted'] },
  comments: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export const ScholarshipApplicationReview = mongoose.model<IScholarshipApplicationReview>('ScholarshipApplicationReview', ScholarshipApplicationReviewSchema);

// 9. Scholarship Aid History Schema
export interface IScholarshipAidHistory extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  scholarshipAward?: mongoose.Types.ObjectId; // ScholarshipAidAward ref
  type: 'Scholarship' | 'Grant' | 'Waiver';
  amount: number;
  academicYear: string;
  status: 'Applied' | 'Approved' | 'Disbursed';
  details: string;
  date: Date;
}

const ScholarshipAidHistorySchema = new Schema<IScholarshipAidHistory>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  scholarshipAward: { type: Schema.Types.ObjectId, ref: 'ScholarshipAidAward' },
  type: { type: String, required: true, enum: ['Scholarship', 'Grant', 'Waiver'], default: 'Scholarship' },
  amount: { type: Number, required: true },
  academicYear: { type: String, required: true },
  status: { type: String, required: true, enum: ['Applied', 'Approved', 'Disbursed'] },
  details: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export const ScholarshipAidHistory = mongoose.model<IScholarshipAidHistory>('ScholarshipAidHistory', ScholarshipAidHistorySchema);

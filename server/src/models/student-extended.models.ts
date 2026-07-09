import mongoose, { Schema, Document } from 'mongoose';

// 1. Student Document Schema
export type DocumentType =
  | 'Aadhaar'
  | 'TransferCertificate'
  | 'CommunityCertificate'
  | 'IncomeCertificate'
  | 'PassportPhoto'
  | 'BirthCertificate'
  | 'SemesterMarkSheet'
  | 'StudentSignature';

export interface IStudentDocument extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  documentType: DocumentType;
  fileUrl: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  verifiedBy?: mongoose.Types.ObjectId; // User ref (Admin)
  remarks?: string;
}

const StudentDocumentSchema = new Schema<IStudentDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    documentType: {
      type: String,
      required: true,
      enum: [
        'Aadhaar',
        'TransferCertificate',
        'CommunityCertificate',
        'IncomeCertificate',
        'PassportPhoto',
        'BirthCertificate',
        'SemesterMarkSheet',
        'StudentSignature'
      ]
    },
    fileUrl: { type: String, required: true },
    status: { type: String, required: true, enum: ['Pending', 'Verified', 'Rejected'], default: 'Pending' },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String }
  },
  { timestamps: true }
);

export const StudentDocument = mongoose.model<IStudentDocument>('StudentDocument', StudentDocumentSchema);


// 2. Academic Record Schema
export interface ISemesterGpa {
  semester: mongoose.Types.ObjectId; // Semester ref
  gpa: number;
}

export interface IAcademicRecord extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  gpaHistory: ISemesterGpa[];
  cgpa: number;
  creditsEarned: number;
  backlogCount: number;
}

const AcademicRecordSchema = new Schema<IAcademicRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    gpaHistory: [
      {
        semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
        gpa: { type: Number, required: true }
      }
    ],
    cgpa: { type: Number, required: true, default: 0.0 },
    creditsEarned: { type: Number, required: true, default: 0 },
    backlogCount: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

export const AcademicRecord = mongoose.model<IAcademicRecord>('AcademicRecord', AcademicRecordSchema);


// 3. Student Activity Schema
export type ActivityAction =
  | 'Admitted'
  | 'Suspended'
  | 'Restored'
  | 'Graduated'
  | 'SectionAssigned'
  | 'CourseChanged'
  | 'DocumentUploaded';

export interface IStudentActivity extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  action: ActivityAction;
  details: string;
  performedBy?: mongoose.Types.ObjectId; // User ref (Admin/Faculty)
  date: Date;
}

const StudentActivitySchema = new Schema<IStudentActivity>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    action: {
      type: String,
      required: true,
      enum: ['Admitted', 'Suspended', 'Restored', 'Graduated', 'SectionAssigned', 'CourseChanged', 'DocumentUploaded']
    },
    details: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const StudentActivity = mongoose.model<IStudentActivity>('StudentActivity', StudentActivitySchema);


// 4. Enrollment Schema
export interface IEnrollment extends Document {
  student: mongoose.Types.ObjectId; // Student ref
  course: mongoose.Types.ObjectId; // Course ref
  semester: mongoose.Types.ObjectId; // Semester ref
  section?: mongoose.Types.ObjectId; // Section ref
  status: 'Enrolled' | 'Dropped' | 'Completed';
  grade?: string;
  credits: number;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
    section: { type: Schema.Types.ObjectId, ref: 'Section' },
    status: { type: String, required: true, enum: ['Enrolled', 'Dropped', 'Completed'], default: 'Enrolled' },
    grade: { type: String },
    credits: { type: Number, required: true, default: 4 }
  },
  { timestamps: true }
);

// Unique student course enrollment per semester
EnrollmentSchema.index({ student: 1, course: 1, semester: 1 }, { unique: true });

export const Enrollment = mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);

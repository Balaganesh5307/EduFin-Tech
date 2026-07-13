import mongoose, { Schema, Document } from 'mongoose';

// 1. ParentStudentRelation Schema
export interface IParentStudentRelation extends Document {
  parent: mongoose.Types.ObjectId; // Parent ref
  student: mongoose.Types.ObjectId; // Student ref
  relation: string; // e.g. "Father", "Mother"
  expenseVisibilityApproved: boolean; // Flag to authorize parent tracking student's personal expenses
  status: 'Active' | 'Inactive';
}

const ParentStudentRelationSchema = new Schema<IParentStudentRelation>({
  parent: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  relation: { type: String, required: true },
  expenseVisibilityApproved: { type: Boolean, default: false },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

ParentStudentRelationSchema.index({ parent: 1, student: 1 }, { unique: true });
export const ParentStudentRelation = mongoose.model<IParentStudentRelation>('ParentStudentRelation', ParentStudentRelationSchema);

// 2. FacultyDepartment Junction Schema
export interface IFacultyDepartment extends Document {
  faculty: mongoose.Types.ObjectId; // Faculty ref
  department: mongoose.Types.ObjectId; // Department ref
  role: 'Member' | 'HOD' | 'Dean';
  status: 'Active' | 'Inactive';
}

const FacultyDepartmentSchema = new Schema<IFacultyDepartment>({
  faculty: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  role: { type: String, enum: ['Member', 'HOD', 'Dean'], default: 'Member' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

FacultyDepartmentSchema.index({ faculty: 1, department: 1 }, { unique: true });
export const FacultyDepartment = mongoose.model<IFacultyDepartment>('FacultyDepartment', FacultyDepartmentSchema);

// 3. FacultySubject (Faculty to Course mapping)
export interface IFacultySubject extends Document {
  faculty: mongoose.Types.ObjectId; // Faculty ref
  course: mongoose.Types.ObjectId; // Course ref
  semester: mongoose.Types.ObjectId; // Semester ref
  batchSection: string; // e.g. "Sec A", "Batch 2026"
  status: 'Active' | 'Inactive';
}

const FacultySubjectSchema = new Schema<IFacultySubject>({
  faculty: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  semester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  batchSection: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

export const FacultySubject = mongoose.model<IFacultySubject>('FacultySubject', FacultySubjectSchema);

// 4. SubjectMaterial (Course Materials)
export interface ISubjectMaterial extends Document {
  title: string;
  description?: string;
  fileUrl: string; // PDF/DOC URL
  course: mongoose.Types.ObjectId; // Course ref
  uploadedBy: mongoose.Types.ObjectId; // User/Faculty ref
}

const SubjectMaterialSchema = new Schema<ISubjectMaterial>({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const SubjectMaterial = mongoose.model<ISubjectMaterial>('SubjectMaterial', SubjectMaterialSchema);

// 5. Announcement Model
export interface IAnnouncement extends Document {
  title: string;
  content: string;
  audience: 'All' | 'Students' | 'Parents' | 'Faculty';
  course?: mongoose.Types.ObjectId; // Optional link to specific course batch
  createdBy: mongoose.Types.ObjectId; // User ref
  date: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  audience: { type: String, enum: ['All', 'Students', 'Parents', 'Faculty'], default: 'All' },
  course: { type: Schema.Types.ObjectId, ref: 'Course' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export const Announcement = mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);

// 6. MeetingRequest (Parent-Faculty Meetings)
export interface IMeetingRequest extends Document {
  parent: mongoose.Types.ObjectId; // Parent ref
  faculty: mongoose.Types.ObjectId; // Faculty ref
  student: mongoose.Types.ObjectId; // Student ref
  title: string;
  description: string;
  dateTime: Date;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  feedback?: string;
}

const MeetingRequestSchema = new Schema<IMeetingRequest>({
  parent: { type: Schema.Types.ObjectId, ref: 'Parent', required: true },
  faculty: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dateTime: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  feedback: { type: String }
}, { timestamps: true });

export const MeetingRequest = mongoose.model<IMeetingRequest>('MeetingRequest', MeetingRequestSchema);

// 7. Conversation Model (Messaging Chat Session)
export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[]; // User refs
  lastMessage?: string;
  lastMessageAt?: Date;
}

const ConversationSchema = new Schema<IConversation>({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String },
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

// 8. CommunicationLog Model (Messaging records in Conversation)
export interface ICommunicationLog extends Document {
  conversation: mongoose.Types.ObjectId; // Conversation ref
  sender: mongoose.Types.ObjectId; // User ref
  message: string;
  attachments?: string[];
  isRead: boolean;
}

const CommunicationLogSchema = new Schema<ICommunicationLog>({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export const CommunicationLog = mongoose.model<ICommunicationLog>('CommunicationLog', CommunicationLogSchema);

// 9. NotificationPreference Model
export interface INotificationPreference extends Document {
  user: mongoose.Types.ObjectId; // User ref
  emailAlerts: boolean;
  pushAlerts: boolean;
  feeReminders: boolean;
  academicAlerts: boolean;
}

const NotificationPreferenceSchema = new Schema<INotificationPreference>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  emailAlerts: { type: Boolean, default: true },
  pushAlerts: { type: Boolean, default: true },
  feeReminders: { type: Boolean, default: true },
  academicAlerts: { type: Boolean, default: true }
}, { timestamps: true });

export const NotificationPreference = mongoose.model<INotificationPreference>('NotificationPreference', NotificationPreferenceSchema);

import mongoose, { Schema, Document } from 'mongoose';

// 1. Department Schema
export interface IDepartment extends Document {
  name: string;
  code: string;
  description?: string;
  headOfDepartment?: mongoose.Types.ObjectId; // Faculty ref
}

const DepartmentSchema = new Schema<IDepartment>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  description: { type: String },
  headOfDepartment: { type: Schema.Types.ObjectId, ref: 'Faculty' }
}, { timestamps: true });

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);


// 2. Course Schema
export interface ICourse extends Document {
  name: string;
  code: string;
  credits: number;
  department: mongoose.Types.ObjectId; // Department ref
  syllabus?: string;
}

const CourseSchema = new Schema<ICourse>({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  credits: { type: Number, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  syllabus: { type: String }
}, { timestamps: true });

export const Course = mongoose.model<ICourse>('Course', CourseSchema);


// 3. Semester Schema
export interface ISemester extends Document {
  name: string; // e.g., "Fall 2026", "Semester 3"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

const SemesterSchema = new Schema<ISemester>({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false }
}, { timestamps: true });

export const Semester = mongoose.model<ISemester>('Semester', SemesterSchema);


// 4. Faculty Schema
export interface IFaculty extends Document {
  user: mongoose.Types.ObjectId; // User ref
  employeeId: string;
  department: mongoose.Types.ObjectId; // Department ref
  designation: string;
  joiningDate: Date;
}

const FacultySchema = new Schema<IFaculty>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  employeeId: { type: String, required: true, unique: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  designation: { type: String, required: true },
  joiningDate: { type: Date, default: Date.now }
}, { timestamps: true });

export const Faculty = mongoose.model<IFaculty>('Faculty', FacultySchema);


// 5. Parent Schema
export interface IParent extends Document {
  user: mongoose.Types.ObjectId; // User ref
  children: mongoose.Types.ObjectId[]; // Student refs
  relation: string; // Father, Mother, Guardian
  occupation?: string;
}

const ParentSchema = new Schema<IParent>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  children: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  relation: { type: String, required: true },
  occupation: { type: String }
}, { timestamps: true });

export const Parent = mongoose.model<IParent>('Parent', ParentSchema);


// 6. Student Schema
export interface IStudent extends Document {
  user: mongoose.Types.ObjectId; // User ref
  studentId: string; // Enrollment / Register number
  rollNumber: string;
  department: mongoose.Types.ObjectId; // Department ref
  course: mongoose.Types.ObjectId; // Course ref
  currentSemester: mongoose.Types.ObjectId; // Semester ref
  parent?: mongoose.Types.ObjectId; // Parent ref
  admissionDate: Date;
}

const StudentSchema = new Schema<IStudent>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentId: { type: String, required: true, unique: true },
  rollNumber: { type: String, required: true },
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  currentSemester: { type: Schema.Types.ObjectId, ref: 'Semester', required: true },
  parent: { type: Schema.Types.ObjectId, ref: 'Parent' },
  admissionDate: { type: Date, default: Date.now }
}, { timestamps: true });

export const Student = mongoose.model<IStudent>('Student', StudentSchema);


// 7. Attendance Schema
export interface IAttendance extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  date: Date;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  markedBy: mongoose.Types.ObjectId; // Faculty ref
  remarks?: string;
}

const AttendanceSchema = new Schema<IAttendance>({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  date: { type: Date, required: true },
  status: { type: String, required: true, enum: ['Present', 'Absent', 'Late', 'Excused'] },
  markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String }
}, { timestamps: true });

// Combined index to avoid marking attendance multiple times for a student on the same day for the same course
AttendanceSchema.index({ student: 1, course: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);

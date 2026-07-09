import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User } from '../models/user.model';
import { Student } from '../models/academic.models';
import { Parent } from '../models/academic.models';
import { AcademicRecord, StudentDocument, StudentActivity, DocumentType } from '../models/student-extended.models';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { uploadToCloudinary } from '../services/upload.service';

export const admitStudent = async (req: Request, res: Response) => {
  const {
    email,
    password,
    name,
    department,
    course,
    currentSemester,
    section,
    rollNumber,
    // Parent info
    parentName,
    parentEmail,
    parentPhone,
    parentRelation,
    // Optional details
    phoneNumber
  } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'A user account already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'password123', salt);

    // 1. Create User account
    const user = new User({
      email,
      passwordHash,
      name,
      role: 'Student',
      status: 'Active',
      isEmailVerified: true, // Auto-verified during admin admission
      phoneNumber
    });
    await user.save();

    // Generate roll number & studentId if not provided
    const nextId = Math.floor(1000 + Math.random() * 9000).toString();
    const finalStudentId = `STU-2026-${nextId}`;
    const finalRollNo = rollNumber || `26-CSE-${nextId}`;

    // 2. Create Student profile
    const student = new Student({
      user: user._id,
      studentId: finalStudentId,
      rollNumber: finalRollNo,
      department,
      course,
      currentSemester,
      admissionDate: new Date()
    });
    await student.save();

    // 3. Create Parent profile if parent details provided
    if (parentEmail && parentName) {
      const parentUser = new User({
        email: parentEmail,
        passwordHash, // Set standard password
        name: parentName,
        role: 'Parent',
        status: 'Active',
        isEmailVerified: true
      });
      await parentUser.save();

      const parent = new Parent({
        user: parentUser._id,
        children: [student._id],
        relation: parentRelation || 'Father'
      });
      await parent.save();

      student.parent = parent._id;
      await student.save();
    }

    // 4. Initialize Academic Record
    const academicRecord = new AcademicRecord({
      student: student._id,
      gpaHistory: [],
      cgpa: 0.0,
      creditsEarned: 0,
      backlogCount: 0
    });
    await academicRecord.save();

    // 5. Log Activity
    const activity = new StudentActivity({
      student: student._id,
      action: 'Admitted',
      details: 'Student admitted to course and department by administrator'
    });
    await activity.save();

    return res.status(201).json({
      message: 'Student admitted successfully',
      studentId: student.studentId,
      rollNumber: student.rollNumber
    });
  } catch (error) {
    return res.status(500).json({ message: 'Admission transaction failed', error });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const department = (req.query.department as string) || '';
  const semester = (req.query.semester as string) || '';
  const status = (req.query.status as string) || '';

  const skip = (page - 1) * limit;

  try {
    const filterQuery: any = {};

    // Filter by student profile details
    if (department) filterQuery.department = department;
    if (semester) filterQuery.currentSemester = semester;

    // Search query mapping (Student ID or Roll Number)
    if (search) {
      filterQuery.$or = [
        { studentId: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Load students populated with user information
    let students = await Student.find(filterQuery)
      .populate({
        path: 'user',
        match: status ? { status } : {},
        select: '-passwordHash'
      })
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('currentSemester', 'name')
      .populate({
        path: 'parent',
        populate: { path: 'user', select: 'name email phoneNumber' }
      });

    // Remove records where populated user didn't match status query
    students = students.filter((s) => s.user !== null);

    // Apply custom pagination
    const totalCount = students.length;
    const paginatedStudents = students.slice(skip, skip + limit);

    return res.json({
      students: paginatedStudents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve student directory', error });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, phoneNumber, rollNumber, currentSemester, parentName, parentPhone } = req.body;

  try {
    const student = await Student.findById(id).populate('user').populate('parent');
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Update Roll Number / Semester
    if (rollNumber) student.rollNumber = rollNumber;
    if (currentSemester) student.currentSemester = currentSemester;
    await student.save();

    // Update User account
    const user = await User.findById((student.user as any)._id);
    if (user) {
      if (name) user.name = name;
      if (phoneNumber) user.phoneNumber = phoneNumber;
      await user.save();
    }

    // Update Parent details
    if (student.parent && (parentName || parentPhone)) {
      const parent = await Parent.findById(student.parent).populate('user');
      if (parent && parent.user) {
        const parentUser = await User.findById((parent.user as any)._id);
        if (parentUser) {
          if (parentName) parentUser.name = parentName;
          if (parentPhone) parentUser.phoneNumber = parentPhone;
          await parentUser.save();
        }
      }
    }

    return res.json({ message: 'Student record updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating student record', error });
  }
};

export const updateStudentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // Active, Suspended, Inactive

  try {
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const user = await User.findById(student.user);
    if (user) {
      user.status = status;
      await user.save();
    }

    const activity = new StudentActivity({
      student: student._id,
      action: status === 'Active' ? 'Restored' : 'Suspended',
      details: `Student account status updated to ${status} by administrator`
    });
    await activity.save();

    return res.json({ message: `Student status updated to ${status}` });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update student status', error });
  }
};

export const uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
  const { documentType } = req.body;
  const studentId = req.params.studentId || req.user?.id; // If not provided, assume current student user

  if (!req.file || !documentType) {
    return res.status(400).json({ message: 'File buffer and documentType are required' });
  }

  try {
    let student = await Student.findOne({ user: studentId });
    if (!student) {
      student = await Student.findById(studentId); // Try direct student ID
    }

    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const fileUrl = await uploadToCloudinary(req.file.buffer, 'student-documents');

    const document = new StudentDocument({
      student: student._id,
      documentType: documentType as DocumentType,
      fileUrl,
      status: 'Pending'
    });
    await document.save();

    const activity = new StudentActivity({
      student: student._id,
      action: 'DocumentUploaded',
      details: `Verification document uploaded: ${documentType}`
    });
    await activity.save();

    return res.json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload document', error });
  }
};

export const verifyDocument = async (req: AuthenticatedRequest, res: Response) => {
  const { docId } = req.params;
  const { status, remarks } = req.body; // Verified, Rejected

  try {
    const document = await StudentDocument.findById(docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = status;
    document.verifiedBy = req.user?.id as any;
    if (remarks) document.remarks = remarks;
    await document.save();

    return res.json({ message: `Document status verified as: ${status}` });
  } catch (error) {
    return res.status(500).json({ message: 'Document verification failed', error });
  }
};

export const exportStudents = async (req: Request, res: Response) => {
  try {
    const students = await Student.find()
      .populate('user', 'name email phoneNumber')
      .populate('department', 'name code')
      .populate('course', 'name code');

    // Create simple CSV layout
    let csv = 'StudentID,Name,Email,RollNumber,Department,Course,AdmissionDate\n';
    
    students.forEach((s) => {
      const u = s.user as any;
      const deptName = s.department ? (s.department as any).name : 'N/A';
      const courseName = s.course ? (s.course as any).name : 'N/A';
      
      csv += `"${s.studentId}","${u?.name}","${u?.email}","${s.rollNumber}","${deptName}","${courseName}","${s.admissionDate.toISOString().split('T')[0]}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_directory.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'CSV exportation failed', error });
  }
};

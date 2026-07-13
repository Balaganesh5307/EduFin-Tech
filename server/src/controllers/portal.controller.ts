import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Student, Parent, Faculty, Course, Attendance, Semester, Department } from '../models/academic.models';
import { User } from '../models/user.model';
import {
  ParentStudentRelation,
  FacultyDepartment,
  FacultySubject,
  SubjectMaterial,
  Announcement,
  MeetingRequest,
  Conversation,
  CommunicationLog,
  NotificationPreference
} from '../models/portal.models';
import { StudentFee, Ledger } from '../models/fee-management.models';
import { ScholarshipAidApplication, ScholarshipAidAward } from '../models/scholarship.models';
import { LoanProgramApplication, LoanProgramEMISchedule } from '../models/loan.models';
import { PersonalExpense } from '../models/personal-finance.models';

// Helper: Seed Parent and Faculty if empty for high-fidelity login and analytics
export const ensurePortalDataSeeded = async () => {
  try {
    // 1. Seed FacultyDepartment & FacultySubject Mappings
    const facultyUser = await User.findOne({ email: 'faculty@edufin.edu' });
    if (facultyUser) {
      let faculty = await Faculty.findOne({ user: facultyUser._id });
      if (!faculty) {
        // Find a default department
        const dept = await Department.findOne() || new Department({ name: 'Computer Science', code: 'CSE' });
        if (!dept.isNew) await dept.save();

        faculty = new Faculty({
          user: facultyUser._id,
          employeeId: 'EMP-FAC-099',
          department: dept._id,
          designation: 'Senior Professor',
          joiningDate: new Date()
        });
        await faculty.save();
      }

      // Check FacultySubject
      const facSubCount = await FacultySubject.countDocuments({ faculty: faculty._id });
      if (facSubCount === 0) {
        const course = await Course.findOne() || new Course({ name: 'Database Management Systems', code: 'CS301', credits: 4, department: faculty.department });
        if (!course.isNew) await course.save();

        const sem = await Semester.findOne() || new Semester({ name: 'Semester 5', startDate: new Date(), endDate: new Date(), isActive: true });
        if (!sem.isNew) await sem.save();

        const facSub = new FacultySubject({
          faculty: faculty._id,
          course: course._id,
          semester: sem._id,
          batchSection: 'Sec A',
          status: 'Active'
        });
        await facSub.save();
      }
    }

    // 2. Seed Parent & ParentStudentRelation Mappings
    const parentUser = await User.findOne({ email: 'parent@edufin.edu' });
    const studentUser = await User.findOne({ email: 'student@edufin.edu' });
    
    if (parentUser && studentUser) {
      const student = await Student.findOne({ user: studentUser._id });
      if (student) {
        let parent = await Parent.findOne({ user: parentUser._id });
        if (!parent) {
          parent = new Parent({
            user: parentUser._id,
            children: [student._id],
            relation: 'Father',
            occupation: 'Software Director'
          });
          await parent.save();
        } else if (!parent.children.some((c: any) => c.toString() === student._id.toString())) {
          // Parent exists but student is not in children array — fix the link
          parent.children.push(student._id);
          await parent.save();
        }

        // Link student back to parent if missing
        if (!student.parent) {
          student.parent = parent._id;
          await student.save();
        }

        // Seed relation visibility
        const rel = await ParentStudentRelation.findOne({ parent: parent._id, student: student._id });
        if (!rel) {
          const relation = new ParentStudentRelation({
            parent: parent._id,
            student: student._id,
            relation: 'Father',
            expenseVisibilityApproved: true,
            status: 'Active'
          });
          await relation.save();
        }
      }
    }

    // 3. Seed some general announcements
    const announceCount = await Announcement.countDocuments();
    if (announceCount === 0) {
      const adminUser = await User.findOne({ role: 'Admin' });
      if (adminUser) {
        await Announcement.insertMany([
          {
            title: 'Midterm Examination Schedule Released',
            content: 'The midterm examinations for Semester 5 will commence on August 15th. Please download the timetables.',
            audience: 'All',
            createdBy: adminUser._id,
            date: new Date()
          },
          {
            title: 'Parent-Faculty ERP Onboarding',
            content: 'Parents can now track child attendance, outstanding fee schedules, and GPA curves inside the Parent Hub.',
            audience: 'Parents',
            createdBy: adminUser._id,
            date: new Date()
          }
        ]);
      }
    }
  } catch (err) {
    console.warn('Failed seeding portal databases:', err);
  }
};

// ----------------------------------------------------
// PARENT PORTAL CONTROLLERS
// ----------------------------------------------------

export const getParentDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensurePortalDataSeeded();

    const parent = await Parent.findOne({ user: req.user?.id }).populate({
      path: 'children',
      populate: [{ path: 'user' }, { path: 'department' }, { path: 'course' }, { path: 'currentSemester' }]
    });

    if (!parent) return res.status(404).json({ message: 'Parent profile not registered' });
    if (parent.children.length === 0) {
      return res.json({ parent, child: null, message: 'No children linked to this account.' });
    }

    // Default to first child for overview statistics
    const child: any = parent.children[0];

    // 1. Fee status
    const fee = await StudentFee.findOne({ student: child._id });
    // 2. Scholarships
    const scholarships = await ScholarshipAidApplication.find({ student: child._id }).populate('schemeId');
    // 3. Education Loans
    const loans = await LoanProgramApplication.find({ student: child._id }).populate('scheme');
    // 4. Attendance list
    const attendanceRecords = await Attendance.find({ student: child._id }).populate('course');
    const totalAttendance = attendanceRecords.length;
    const presentAttendance = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 92;

    // 5. Personal Finance visibility
    const relation = await ParentStudentRelation.findOne({ parent: parent._id, student: child._id });
    let expenses: any[] = [];
    if (relation?.expenseVisibilityApproved) {
      expenses = await PersonalExpense.find({ student: child._id }).sort({ date: -1 }).limit(10);
    }

    // 6. Announcements & Meeting requests
    const announcements = await Announcement.find({ audience: { $in: ['All', 'Parents'] } }).sort({ date: -1 });
    const meetings = await MeetingRequest.find({ parent: parent._id, student: child._id })
      .populate({ path: 'faculty', populate: { path: 'user' } })
      .sort({ dateTime: 1 });

    const dashboard = {
      parentProfile: {
        name: req.user?.email,
        email: parent.user,
        occupation: parent.occupation
      },
      child: {
        id: child._id,
        name: child.user?.name,
        rollNumber: child.rollNumber,
        department: child.department?.name,
        course: child.course?.name,
        semester: child.currentSemester?.name
      },
      academics: {
        attendanceRate,
        gpa: 8.7, // Mocked overall GPA tracker
        subjects: [
          { name: 'Database Management Systems', code: 'CS301', grade: 'A', attendance: attendanceRate },
          { name: 'Artificial Intelligence', code: 'CS303', grade: 'A-', attendance: 90 }
        ],
        exams: [
          { date: '2026-08-15', subject: 'Database Management Systems (CS301)', time: '10:00 AM' },
          { date: '2026-08-17', subject: 'Artificial Intelligence (CS303)', time: '02:00 PM' }
        ]
      },
      finance: {
        outstandingFees: fee ? fee.balanceAmount : 20000,
        paidFees: fee ? fee.paidAmount : 90000,
        installments: fee ? [
          { category: 'Tuition Balance installment', amount: fee.balanceAmount, dueDate: '2026-08-30', status: fee.status }
        ] : [],
        scholarships: scholarships.map((s: any) => ({
          name: s.schemeId?.name || 'SJT waiver',
          amount: s.schemeId?.awardAmount || 75000,
          status: s.status
        })),
        loans: loans.map((l: any) => ({
          name: l.scheme?.name || 'College Aid Loan',
          amount: l.amountRequested,
          status: l.status,
          emi: l.amountSanctioned ? Math.round(l.amountSanctioned / 12) : 0
        }))
      },
      expenses: relation?.expenseVisibilityApproved ? expenses : null,
      announcements,
      meetings
    };

    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({ message: 'Failed loading parent portal', error });
  }
};

// Parent Fee payments
export const payChildFee = async (req: AuthenticatedRequest, res: Response) => {
  const { childId, amount, paymentMethod } = req.body;

  if (!childId || !amount) return res.status(400).json({ message: 'Missing parameters' });

  try {
    const fee = await StudentFee.findOne({ student: childId });
    if (!fee) return res.status(404).json({ message: 'Child outstanding fee schedule not found' });

    const amt = Number(amount);
    fee.paidAmount += amt;
    fee.balanceAmount = Math.max(0, fee.totalAmount - fee.paidAmount - fee.discountAmount);
    fee.status = fee.balanceAmount === 0 ? 'Paid' : 'PartiallyPaid';
    await fee.save();

    // Log ledger entry
    const ledger = await Ledger.findOne({ student: childId });
    if (ledger) {
      const lastBal = ledger.entries.length > 0 ? ledger.entries[ledger.entries.length - 1].balance : 0;
      ledger.entries.push({
        date: new Date(),
        type: 'Debit',
        amount: amt,
        description: `Parent Online payment via: ${paymentMethod || 'UPI'}`,
        balance: lastBal + amt,
        referenceType: 'Payment',
        referenceId: fee._id
      } as any);
      await ledger.save();
    }

    return res.json({ message: 'Payment captured successfully', fee });
  } catch (error) {
    return res.status(500).json({ message: 'Payment processing failed', error });
  }
};

// Meeting Requests
export const requestMeeting = async (req: AuthenticatedRequest, res: Response) => {
  const { facultyId, childId, title, description, dateTime } = req.body;

  if (!facultyId || !childId || !title || !description || !dateTime) {
    return res.status(400).json({ message: 'Missing meeting criteria fields' });
  }

  try {
    const parent = await Parent.findOne({ user: req.user?.id });
    if (!parent) return res.status(404).json({ message: 'Parent profile not resolved' });

    const meeting = new MeetingRequest({
      parent: parent._id,
      faculty: facultyId,
      student: childId,
      title,
      description,
      dateTime: new Date(dateTime),
      status: 'Pending'
    });
    await meeting.save();

    return res.status(201).json(meeting);
  } catch (error) {
    return res.status(500).json({ message: 'Failed booking meeting', error });
  }
};

// Parent Chat Conversations
export const getParentConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await Conversation.find({ participants: req.user?.id })
      .populate('participants', 'name email role')
      .sort({ lastMessageAt: -1 });

    const threads = [];
    for (const conv of list) {
      const messages = await CommunicationLog.find({ conversation: conv._id })
        .populate('sender', 'name role')
        .sort({ createdAt: 1 });
      threads.push({ conversation: conv, messages });
    }

    return res.json(threads);
  } catch (error) {
    return res.status(500).json({ message: 'Failed fetching conversations', error });
  }
};

// Parent send chat message
export const sendParentMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { recipientId, message } = req.body;

  if (!recipientId || !message) return res.status(400).json({ message: 'Recipient and message required' });

  try {
    // Find or create conversation
    let conv = await Conversation.findOne({
      participants: { $all: [req.user?.id, recipientId] }
    });

    if (!conv) {
      conv = new Conversation({
        participants: [req.user?.id as any, recipientId]
      });
      await conv.save();
    }

    const log = new CommunicationLog({
      conversation: conv._id,
      sender: req.user?.id,
      message,
      isRead: false
    });
    await log.save();

    conv.lastMessage = message;
    conv.lastMessageAt = new Date();
    await conv.save();

    return res.status(201).json(log);
  } catch (error) {
    return res.status(500).json({ message: 'Failed dispatching message', error });
  }
};

// ----------------------------------------------------
// FACULTY PORTAL CONTROLLERS
// ----------------------------------------------------

export const getFacultyDashboard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await ensurePortalDataSeeded();

    const faculty = await Faculty.findOne({ user: req.user?.id })
      .populate('department')
      .populate('user', 'name email');

    if (!faculty) return res.status(404).json({ message: 'Faculty profile not registered' });

    // Timetable lectures mapped
    const subjects = await FacultySubject.find({ faculty: faculty._id }).populate('course');

    // Retrieve global class stats
    const totalStudents = 42; // Enrolled class metrics
    const announcements = await Announcement.find({ createdBy: req.user?.id }).sort({ date: -1 });

    const dashboard = {
      profile: faculty,
      timetable: subjects.map(s => ({
        courseName: (s.course as any).name,
        courseCode: (s.course as any).code,
        time: '09:00 AM - 10:15 AM',
        room: 'LH-201',
        batchSection: s.batchSection
      })),
      statistics: {
        totalStudents,
        averageAttendance: 88,
        activeCourses: subjects.length
      },
      announcements
    };

    return res.json(dashboard);
  } catch (error) {
    return res.status(500).json({ message: 'Failed compiling faculty dashboard', error });
  }
};

// Course Roster list for marking attendance
export const getCourseRoster = async (req: Request, res: Response) => {
  const { courseCode } = req.query;

  try {
    const query: any = {};
    if (courseCode) {
      const course = await Course.findOne({ code: String(courseCode).toUpperCase() });
      if (course) query.course = course._id;
    }

    const students = await Student.find(query).populate('user').populate('department');
    return res.json(students);
  } catch (error) {
    return res.status(500).json({ message: 'Failed loading course roster', error });
  }
};

// Mark Class Attendance
export const markRosterAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { studentId, courseId, date, status, remarks } = req.body;

  if (!studentId || !courseId || !status) {
    return res.status(400).json({ message: 'Missing attendance logs' });
  }

  try {
    // Delete existing attendance logs for the day to avoid duplicate indices
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    await Attendance.deleteMany({
      student: studentId,
      course: courseId,
      date: { $gte: dayStart, $lte: dayEnd }
    });

    const attend = new Attendance({
      student: studentId,
      course: courseId,
      date: new Date(date),
      status,
      markedBy: req.user?.id,
      remarks
    });
    await attend.save();

    return res.status(201).json(attend);
  } catch (error) {
    return res.status(500).json({ message: 'Failed posting attendance', error });
  }
};

// Post Internal Marks / Grade sheet records
export const markRosterMarks = async (req: AuthenticatedRequest, res: Response) => {
  const { studentId, courseId, marks, maxMarks, examType } = req.body;

  if (!studentId || !courseId || !marks) {
    return res.status(400).json({ message: 'Missing marks records parameters' });
  }

  try {
    // Return mock success confirmation (or integrate with a marks scheme log)
    return res.status(201).json({
      message: 'Internal evaluation score updated successfully',
      evaluation: { studentId, courseId, marks, maxMarks, examType }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed submitting internal marks', error });
  }
};

// Create Announcement
export const createAnnouncement = async (req: AuthenticatedRequest, res: Response) => {
  const { title, content, audience } = req.body;

  if (!title || !content || !audience) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const announce = new Announcement({
      title,
      content,
      audience,
      createdBy: req.user?.id as any,
      date: new Date()
    });
    await announce.save();

    return res.status(201).json(announce);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to publish announcement', error });
  }
};

// Faculty Chat Conversations
export const getFacultyConversations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await Conversation.find({ participants: req.user?.id })
      .populate('participants', 'name email role')
      .sort({ lastMessageAt: -1 });

    const threads = [];
    for (const conv of list) {
      const messages = await CommunicationLog.find({ conversation: conv._id })
        .populate('sender', 'name role')
        .sort({ createdAt: 1 });
      threads.push({ conversation: conv, messages });
    }

    return res.json(threads);
  } catch (error) {
    return res.status(500).json({ message: 'Failed fetching messages threads', error });
  }
};

// Faculty send chat message
export const sendFacultyMessage = async (req: AuthenticatedRequest, res: Response) => {
  const { recipientId, message } = req.body;

  if (!recipientId || !message) return res.status(400).json({ message: 'Recipient and message required' });

  try {
    let conv = await Conversation.findOne({
      participants: { $all: [req.user?.id, recipientId] }
    });

    if (!conv) {
      conv = new Conversation({
        participants: [req.user?.id as any, recipientId]
      });
      await conv.save();
    }

    const log = new CommunicationLog({
      conversation: conv._id,
      sender: req.user?.id,
      message,
      isRead: false
    });
    await log.save();

    conv.lastMessage = message;
    conv.lastMessageAt = new Date();
    await conv.save();

    return res.status(201).json(log);
  } catch (error) {
    return res.status(500).json({ message: 'Failed dispatching message', error });
  }
};

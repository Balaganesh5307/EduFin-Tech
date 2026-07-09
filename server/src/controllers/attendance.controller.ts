import { Request, Response } from 'express';
import { Attendance, Student } from '../models/academic.models';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import mongoose from 'mongoose';

export const markAttendance = async (req: AuthenticatedRequest, res: Response) => {
  const { records, courseId, date } = req.body; // records is array of { studentId, status, remarks }

  if (!records || !courseId || !date) {
    return res.status(400).json({ message: 'Records list, courseId, and date are required' });
  }

  const sessionFaculty = req.user?.id || 'faculty_system_id';

  try {
    const attendanceDate = new Date(date);
    attendanceDate.setUTCHours(0, 0, 0, 0); // Normalize date to day boundary

    const results = [];

    for (const record of records) {
      const updateData = {
        status: record.status,
        markedBy: sessionFaculty,
        remarks: record.remarks || ''
      };

      // Upsert: Find attendance for student + course + day, update or insert
      const attRecord = await Attendance.findOneAndUpdate(
        {
          student: record.studentId,
          course: courseId,
          date: attendanceDate
        },
        updateData,
        { upsert: true, new: true }
      );
      results.push(attRecord);
    }

    return res.json({ message: 'Attendance marked successfully', count: results.length });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record attendance', error });
  }
};

export const getStudentAttendance = async (req: Request, res: Response) => {
  const { studentId } = req.params;

  try {
    const student = await Student.findOne({ $or: [{ _id: studentId }, { user: studentId }] });
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const attendanceRecords = await Attendance.find({ student: student._id })
      .populate('course', 'name code credits')
      .populate('markedBy', 'name');

    // Calculate percentage per course
    const courseBreakdown: Record<string, { name: string; code: string; present: number; total: number }> = {};
    let totalPresent = 0;
    let totalClasses = attendanceRecords.length;

    attendanceRecords.forEach((record) => {
      const course = record.course as any;
      if (!course) return;

      const courseIdStr = course._id.toString();

      if (!courseBreakdown[courseIdStr]) {
        courseBreakdown[courseIdStr] = {
          name: course.name,
          code: course.code,
          present: 0,
          total: 0
        };
      }

      courseBreakdown[courseIdStr].total += 1;
      if (record.status === 'Present' || record.status === 'Late') {
        courseBreakdown[courseIdStr].present += 1;
        totalPresent += 1;
      }
    });

    const averagePercentage = totalClasses > 0 ? parseFloat(((totalPresent / totalClasses) * 100).toFixed(1)) : 100.0;

    return res.json({
      averagePercentage,
      totalClasses,
      totalPresent,
      coursewiseBreakdown: Object.values(courseBreakdown),
      history: attendanceRecords
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to calculate attendance rates', error });
  }
};

export const getClassAttendance = async (req: Request, res: Response) => {
  const { courseId, date } = req.query;

  if (!courseId || !date) {
    return res.status(400).json({ message: 'courseId and date parameters are required' });
  }

  try {
    const queryDate = new Date(date as string);
    queryDate.setUTCHours(0, 0, 0, 0);

    const records = await Attendance.find({
      course: courseId,
      date: queryDate
    }).populate({
      path: 'student',
      populate: { path: 'user', select: 'name' }
    });

    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving class attendance', error });
  }
};

export const getLowAttendanceAlerts = async (req: Request, res: Response) => {
  try {
    // Collect attendance aggregates grouped by student
    const result = await Attendance.aggregate([
      {
        $group: {
          _id: '$student',
          total: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $in: ['$status', ['Present', 'Late']] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          student: '$_id',
          total: 1,
          present: 1,
          percentage: {
            $multiply: [{ $divide: ['$present', '$total'] }, 100]
          }
        }
      },
      {
        $match: {
          percentage: { $lt: 75.0 } // below standard university 75% limit
        }
      }
    ]);

    // Populate student user records manually
    const alerts = [];
    for (const r of result) {
      const student = await Student.findById(r.student)
        .populate('user', 'name email avatar')
        .populate('department', 'name code');
      
      if (student) {
        alerts.push({
          student,
          percentage: parseFloat(r.percentage.toFixed(1)),
          totalClasses: r.total,
          presentClasses: r.present
        });
      }
    }

    return res.json({ alerts });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compile low attendance rates', error });
  }
};

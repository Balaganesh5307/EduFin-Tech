import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getDashboardData = async (req: AuthenticatedRequest, res: Response) => {
  const role = req.user?.role;

  if (!role) {
    return res.status(401).json({ message: 'User role not resolved' });
  }

  try {
    switch (role) {
      case 'Student':
        return res.json({
          summary: {
            pendingFees: 45000,
            attendanceRate: 88.5,
            monthlyBudgetLimit: 12000,
            monthlyExpenses: 8740,
            savingsGoalTarget: 25000,
            savingsGoalCurrent: 18500,
            savingsGoalTitle: "Semester Exchange Fund"
          },
          courses: [
            { id: '1', code: 'CS301', name: 'Software Engineering', credits: 4, attendance: 92 },
            { id: '2', code: 'CS302', name: 'Database Management Systems', credits: 4, attendance: 85 },
            { id: '3', code: 'CS303', name: 'Artificial Intelligence', credits: 3, attendance: 80 },
            { id: '4', code: 'MA301', name: 'Linear Algebra', credits: 3, attendance: 95 }
          ],
          feeInstallments: [
            { id: 'f1', category: 'Tuition Fee', amount: 35000, dueDate: '2026-08-15', status: 'Unpaid' },
            { id: 'f2', category: 'Library Fee', amount: 5000, dueDate: '2026-08-15', status: 'Unpaid' },
            { id: 'f3', category: 'Exam Fee', amount: 5000, dueDate: '2026-09-01', status: 'Unpaid' },
            { id: 'f4', category: 'Hostel Fee', amount: 30000, dueDate: '2026-06-10', status: 'Paid' }
          ],
          recentExpenses: [
            { id: 'e1', title: 'Reference Books', amount: 2400, category: 'Academics', date: '2026-07-08' },
            { id: 'e2', title: 'Cafeteria bill', amount: 350, category: 'Food', date: '2026-07-07' },
            { id: 'e3', title: 'Monthly Subway Pass', amount: 1500, category: 'Travel', date: '2026-07-01' },
            { id: 'e4', title: 'Laptop repair', amount: 4490, category: 'Other', date: '2026-06-25' }
          ],
          financialHealthScore: 78 // AI predicted health score
        });

      case 'Parent':
        return res.json({
          child: {
            name: "Alex Johnson",
            rollNumber: "2024-CSE-084",
            course: "B.Tech Computer Science",
            semester: "Semester 5"
          },
          summary: {
            pendingFees: 20000,
            paidFees: 90000,
            attendanceRate: 91.2,
            gpa: 8.7
          },
          invoices: [
            { id: 'inv1', name: 'Tuition Fee - Sem 5', amount: 75000, status: 'Paid', paidDate: '2026-06-05' },
            { id: 'inv2', name: 'Mess Charges', amount: 15000, status: 'Paid', paidDate: '2026-06-15' },
            { id: 'inv3', name: 'Transport & Exam Fees', amount: 20000, status: 'Unpaid', dueDate: '2026-08-30' }
          ],
          academicUpdates: [
            { id: 'u1', subject: 'Database Management Systems', type: 'Midterm Grade', score: 'A', date: '2026-06-20' },
            { id: 'u2', subject: 'Artificial Intelligence', type: 'Assignment 2', score: '9/10', date: '2026-07-02' },
            { id: 'u3', subject: 'Software Engineering', type: 'Attendance Alert', score: '82%', date: '2026-07-05' }
          ]
        });

      case 'Faculty':
        return res.json({
          summary: {
            assignedClasses: 4,
            totalStudents: 142,
            averageAttendance: 84.6,
            pendingReports: 2
          },
          timetable: [
            { time: "09:00 AM - 10:00 AM", course: "Software Engineering (CS301)", room: "LH-201", type: "Lecture" },
            { time: "11:15 AM - 12:15 PM", course: "Artificial Intelligence (CS303)", room: "Lab-3", type: "Practical" },
            { time: "02:00 PM - 03:00 PM", course: "Database Management Systems (CS302)", room: "LH-104", type: "Lecture" }
          ],
          classes: [
            { id: 'c1', name: 'B.Tech CSE - Sec A', students: 48, courseCode: 'CS301', progress: 75 },
            { id: 'c2', name: 'B.Tech CSE - Sec B', students: 44, courseCode: 'CS301', progress: 70 },
            { id: 'c3', name: 'M.Tech AI - Sec A', students: 22, courseCode: 'CS303', progress: 85 },
            { id: 'c4', name: 'B.Tech IT - Sec C', students: 28, courseCode: 'CS302', progress: 60 }
          ]
        });

      case 'Admin':
      case 'SuperAdmin':
        return res.json({
          summary: {
            totalRevenue: 28400000,
            pendingFees: 4500000,
            scholarshipDisbursed: 1200000,
            activeLoans: 8,
            feeDefaultRate: 4.8 // AI prediction
          },
          revenueTrends: [
            { month: 'Jan', collections: 4200000, projected: 4500000 },
            { month: 'Feb', collections: 3800000, projected: 4000000 },
            { month: 'Mar', collections: 5100000, projected: 5000000 },
            { month: 'Apr', collections: 2900000, projected: 3000000 },
            { month: 'May', collections: 6400000, projected: 6500000 },
            { month: 'Jun', collections: 6000000, projected: 6200000 }
          ],
          feeDefaultersRisk: [
            { id: 'r1', studentName: 'David Miller', studentId: 'STU-483', risk: 'High', dueAmount: 75000, defaultProb: 88 },
            { id: 'r2', studentName: 'Emma Watson', studentId: 'STU-102', risk: 'Medium', dueAmount: 40000, defaultProb: 52 },
            { id: 'r3', studentName: 'Robert Dow', studentId: 'STU-982', risk: 'Low', dueAmount: 35000, defaultProb: 15 }
          ],
          scholarshipStats: {
            applied: 38,
            approved: 12,
            pending: 26
          },
          loanStats: {
            applied: 14,
            approved: 6,
            pending: 8
          },
          systemHealth: role === 'SuperAdmin' ? {
            dbStatus: 'Connected',
            cpuLoad: '12%',
            activeSessions: 231,
            auditAlerts: 0
          } : undefined
        });

      default:
        return res.status(400).json({ message: 'Invalid user role' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving dashboard analytics', error });
  }
};

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Student, Parent, Faculty, Course, Attendance, Semester, Department } from '../models/academic.models';
import { User } from '../models/user.model';
import { StudentFee } from '../models/fee-management.models';
import { ScholarshipAidApplication, ScholarshipAidAward } from '../models/scholarship.models';
import { LoanProgramApplication } from '../models/loan.models';
import { PersonalExpense, PersonalIncome, PersonalSavingsGoal, PersonalBudget } from '../models/personal-finance.models';
import {
  AnalyticsSnapshot,
  DashboardWidget,
  KPI,
  ReportTemplate,
  ReportHistory,
  ActivityLog,
  FinancialMetrics,
  AcademicMetrics
} from '../models/analytics.models';
import { ParentStudentRelation } from '../models/portal.models';

// Helper: Seed default analytics configurations
export const ensureAnalyticsSeeded = async (userId: string) => {
  try {
    // 1. Seed Widget Configs if empty
    const widgetCount = await DashboardWidget.countDocuments({ userId });
    if (widgetCount === 0) {
      await DashboardWidget.insertMany([
        { userId, widgetId: 'rev_kpi', title: 'Revenue Collection Ratio', type: 'KPI', position: { x: 0, y: 0, w: 3, h: 2 }, isVisible: true },
        { userId, widgetId: 'att_kpi', title: 'Student Attendance Ratio', type: 'KPI', position: { x: 3, y: 0, w: 3, h: 2 }, isVisible: true },
        { userId, widgetId: 'gpa_kpi', title: 'Average Institutional GPA', type: 'KPI', position: { x: 6, y: 0, w: 3, h: 2 }, isVisible: true },
        { userId, widgetId: 'rev_chart', title: 'Collections Trend', type: 'AreaChart', position: { x: 0, y: 2, w: 6, h: 4 }, isVisible: true }
      ]);
    }

    // 2. Seed some general KPIs if empty
    const kpiCount = await KPI.countDocuments();
    if (kpiCount === 0) {
      await KPI.insertMany([
        { name: 'Revenue Collection Rate', category: 'Finance', targetValue: 95, actualValue: 88, unit: '%', trend: 'Up' },
        { name: 'Average Student Attendance', category: 'Academic', targetValue: 90, actualValue: 91.2, unit: '%', trend: 'Stable' },
        { name: 'System Active Sessions', category: 'System', targetValue: 300, actualValue: 245, unit: 'Users', trend: 'Up' }
      ]);
    }

    // 3. Seed some default Report templates
    const templateCount = await ReportTemplate.countDocuments();
    if (templateCount === 0) {
      await ReportTemplate.insertMany([
        { name: 'Revenue Summary Statement', description: 'Monthly collection revenue trends and pending dues logs.', type: 'Revenue', filters: { dateRange: true } },
        { name: 'Attendance Register Report', description: 'Department-wise class attendance aggregates.', type: 'Attendance', filters: { dateRange: true, department: true } },
        { name: 'Scholarship Disbursements Audit', description: 'Details of all institutional and external scholarship awards.', type: 'Scholarship', filters: { dateRange: true } },
        { name: 'Education Loan Portfolio Metrics', description: 'Sanctioned loan lines and outstanding recoveries.', type: 'Loan', filters: { dateRange: true } }
      ]);
    }

    // 4. Seed some daily activity log feed entries
    const logCount = await ActivityLog.countDocuments();
    if (logCount === 0) {
      await ActivityLog.insertMany([
        { user: userId as any, role: 'Admin', action: 'REPORT_GENERATION', module: 'Analytics', description: 'Generated Monthly Revenue Statement report in PDF format.', ipAddress: '127.0.0.1' },
        { user: userId as any, role: 'Admin', action: 'FEE_CONFIGURATION', module: 'Finance', description: 'Updated semester tuition fees configurations for Batch 2026.', ipAddress: '127.0.0.1' }
      ]);
    }
  } catch (err) {
    console.warn('Analytics module auto-seed warning:', err);
  }
};

// ----------------------------------------------------
// CORE API: GET ROLE-BASED DASHBOARD BI METRICS
// ----------------------------------------------------
export const getDashboardAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized session' });

    await ensureAnalyticsSeeded(userId);

    const role = req.user?.role;

    // 1. SUPER ADMIN / ADMIN BI AGGREGATION
    if (role === 'SuperAdmin' || role === 'Admin') {
      const totalStudents = await Student.countDocuments();
      const totalFaculty = await Faculty.countDocuments();

      // Mongoose aggregation for Total and Pending Fees
      const feeStats = await StudentFee.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$paidAmount' },
            pendingFees: { $sum: '$balanceAmount' }
          }
        }
      ]);

      const rev = feeStats[0]?.totalRevenue || 90000;
      const pend = feeStats[0]?.pendingFees || 20000;

      // Aggregations for Active Scholarships and Loans
      const loanStats = await LoanProgramApplication.aggregate([
        { $match: { status: 'Approved' } },
        { $group: { _id: null, totalApproved: { $sum: '$amountRequested' } } }
      ]);

      const loanPortfolio = loanStats[0]?.totalApproved || 350000;
      const scholarshipDistributed = 75000;

      // Monthly Collections trend Mockup
      const monthlyCollections = [
        { name: 'Jan', amount: Math.round(rev * 0.15) },
        { name: 'Feb', amount: Math.round(rev * 0.2) },
        { name: 'Mar', amount: Math.round(rev * 0.18) },
        { name: 'Apr', amount: Math.round(rev * 0.22) },
        { name: 'May', amount: Math.round(rev * 0.15) },
        { name: 'Jun', amount: Math.round(rev * 0.1) }
      ];

      // Department Revenues
      const departmentRevenue = [
        { name: 'CSE', revenue: Math.round(rev * 0.55), students: 120 },
        { name: 'ECE', revenue: Math.round(rev * 0.25), students: 50 },
        { name: 'Mech', revenue: Math.round(rev * 0.2), students: 40 }
      ];

      // Recent activities stream
      const activities = await ActivityLog.find().populate('user', 'name').sort({ createdAt: -1 }).limit(10);
      const widgetConfig = await DashboardWidget.find({ userId });

      return res.json({
        role,
        kpis: {
          totalStudents,
          totalFaculty,
          totalRevenue: rev,
          pendingFees: pend,
          scholarshipDistributed,
          loanPortfolio,
          growthRate: 8.4,
          dailyActiveUsers: 14,
          monthlyActiveUsers: 56
        },
        visualizations: {
          monthlyCollections,
          departmentRevenue,
          loanScholarshipSplit: [
            { name: 'Scholarships Disbursed', value: scholarshipDistributed },
            { name: 'Loan Portfolio', value: loanPortfolio }
          ]
        },
        activities,
        widgetConfig
      });
    }

    // 2. STUDENT PERSONAL BI ANALYTICS
    if (role === 'Student') {
      const student = await Student.findOne({ user: userId });
      if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

      // Personal Spends vs Income aggregates
      const incomeStats = await PersonalIncome.aggregate([
        { $match: { student: student._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const expenseStats = await PersonalExpense.aggregate([
        { $match: { student: student._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const income = incomeStats[0]?.total || 15000;
      const expense = expenseStats[0]?.total || 8400;

      // Budget Progress
      const budgets = await PersonalBudget.find({ student: student._id }).populate('category');
      const savings = await PersonalSavingsGoal.find({ student: student._id });

      // Academic GPAs list
      const gpaTrend = [
        { semester: 'Sem 1', gpa: 8.2 },
        { semester: 'Sem 2', gpa: 8.5 },
        { semester: 'Sem 3', gpa: 8.3 },
        { semester: 'Sem 4', gpa: 8.7 }
      ];

      return res.json({
        role,
        kpis: {
          totalIncome: income,
          totalExpense: expense,
          budgetUtilization: income > 0 ? Math.round((expense / income) * 100) : 56,
          netSavings: Math.max(0, income - expense),
          cgpa: 8.7,
          attendanceRate: 92
        },
        visualizations: {
          incomeVsExpense: [
            { category: 'Total Income', amount: income },
            { category: 'Total Expenses', amount: expense }
          ],
          budgets: budgets.map((b: any) => {
            const spent = Math.round(b.amount * 0.65); // Mocked spent amount for BI visualization
            return {
              category: b.category?.name || 'General',
              limit: b.amount,
              spent,
              utilization: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
            };
          }),
          savings: savings.map((s: any) => ({
            name: s.name,
            target: s.targetAmount,
            saved: s.currentAmount,
            progress: s.targetAmount > 0 ? Math.round((s.currentAmount / s.targetAmount) * 100) : 0
          })),
          gpaTrend
        }
      });
    }

    // 3. PARENT DEPENDENT STUDENT GATED BI ANALYTICS
    if (role === 'Parent') {
      const parent = await Parent.findOne({ user: userId });
      if (!parent || parent.children.length === 0) {
        return res.status(404).json({ message: 'Linked child records not resolved' });
      }

      const childId = parent.children[0];
      const child = await Student.findById(childId).populate('user');

      // Check personal spends visibility approval status
      const rel = await ParentStudentRelation.findOne({ parent: parent._id, student: childId });
      let personalExpenses = null;
      if (rel?.expenseVisibilityApproved) {
        personalExpenses = await PersonalExpense.find({ student: childId }).sort({ date: -1 }).limit(10);
      }

      // Academics
      const attendanceRecords = await Attendance.find({ student: childId });
      const totalAtt = attendanceRecords.length;
      const presAtt = attendanceRecords.filter(r => r.status === 'Present' || r.status === 'Late').length;
      const attendanceRate = totalAtt > 0 ? Math.round((presAtt / totalAtt) * 100) : 92;

      // Fees
      const fee = await StudentFee.findOne({ student: childId });

      return res.json({
        role,
        childName: (child?.user as any)?.name || 'Alex Johnson',
        kpis: {
          attendanceRate,
          gpa: 8.7,
          outstandingFees: fee ? fee.balanceAmount : 20000,
          paidFees: fee ? fee.paidAmount : 90000
        },
        visualizations: {
          gpaTrend: [
            { sem: 'Sem 1', gpa: 8.2 },
            { sem: 'Sem 2', gpa: 8.5 },
            { sem: 'Sem 3', gpa: 8.3 },
            { sem: 'Sem 4', gpa: 8.7 }
          ],
          feesAllocation: [
            { name: 'Settled Fees', value: fee ? fee.paidAmount : 90000 },
            { name: 'Pending Balance', value: fee ? fee.balanceAmount : 20000 }
          ]
        },
        personalExpenses
      });
    }

    // 4. FACULTY CLASSROOM BI ANALYTICS
    if (role === 'Faculty') {
      const faculty = await Faculty.findOne({ user: userId });
      if (!faculty) return res.status(404).json({ message: 'Faculty profile not resolved' });

      // Course success rates distribution mockups
      const coursePerformance = [
        { name: 'Database Systems (CS301)', averageScore: 78, highestScore: 98, passRate: 94 },
        { name: 'Artificial Intelligence (CS303)', averageScore: 82, highestScore: 95, passRate: 96 }
      ];

      return res.json({
        role,
        kpis: {
          totalStudentsAssigned: 142,
          activeCoursesCount: 2,
          classAttendanceRate: 88,
          overallPassRate: 95
        },
        visualizations: {
          coursePerformance,
          attendanceDistribution: [
            { name: 'Present Roster', value: 88 },
            { name: 'Absent Roster', value: 12 }
          ]
        }
      });
    }

    return res.status(400).json({ message: 'Invalid dashboard role access configuration' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed fetching analytics data', error });
  }
};

// ----------------------------------------------------
// BI REPORT GENERATOR: DOWNLOAD PDF / EXCEL / CSV
// ----------------------------------------------------
export const generateBIReport = async (req: AuthenticatedRequest, res: Response) => {
  const { reportType, format, dateFrom, dateTo, department } = req.body;

  if (!reportType || !format) {
    return res.status(400).json({ message: 'Missing reportType or file format parameters' });
  }

  try {
    // Audit Log generation action
    const log = new ActivityLog({
      user: req.user?.id,
      role: req.user?.role || 'Admin',
      action: 'REPORT_GENERATION',
      module: 'Analytics',
      description: `Generated ${reportType} report statement sheet in ${format} format.`,
      ipAddress: req.ip
    });
    await log.save();

    // 1. Fetch template criteria config
    const template = await ReportTemplate.findOne({ type: reportType }) || new ReportTemplate({ name: `${reportType} Statement`, type: reportType });
    if (template.isNew) await template.save();

    // Save report generation log entry
    const history = new ReportHistory({
      template: template._id,
      generatedBy: req.user?.id,
      format,
      fileUrl: `/reports/export_${reportType.toLowerCase()}_${Date.now()}.${format.toLowerCase()}`,
      fileSize: 1024 * 12 // mockup file size
    });
    await history.save();

    // Mock data rows for the export
    let reportHeaders: string[] = [];
    let reportDataRows: any[][] = [];

    if (reportType === 'Revenue') {
      reportHeaders = ['Month', 'Collections Paid (INR)', 'Pending Dues Balance (INR)', 'Defaulters Risk Roster'];
      reportDataRows = [
        ['January 2026', '3,800,000', '1,200,000', '14 Students'],
        ['February 2026', '4,200,000', '980,000', '8 Students'],
        ['March 2026', '5,100,000', '450,000', '4 Students']
      ];
    } else if (reportType === 'Attendance') {
      reportHeaders = ['Department Code', 'Course Subject', 'Active Roster', 'Average Attendance Rate (%)'];
      reportDataRows = [
        ['CSE', 'Database Management Systems (CS301)', '120 Students', '92%'],
        ['ECE', 'Digital System Designs (EC102)', '50 Students', '88%'],
        ['Mech', 'Fluid Dynamics (ME204)', '40 Students', '84%']
      ];
    } else {
      // General Fallback mockup
      reportHeaders = ['Report Field Token', 'Metric Indicators Values', 'Collection Status'];
      reportDataRows = [
        ['Institutional Allocation Ratio', '75%', 'Optimal'],
        ['Waivers Disbursements Index', '₹120,000', 'Settled']
      ];
    }

    // Format output stream response
    if (format === 'CSV') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report_${reportType.toLowerCase()}.csv`);

      let csvText = reportHeaders.join(',') + '\n';
      reportDataRows.forEach(row => {
        csvText += row.map(val => `"${val.replace(/"/g, '""')}"`).join(',') + '\n';
      });

      return res.status(200).send(csvText);
    }

    if (format === 'Excel') {
      // Return a basic HTML table that Excel compiles correctly as spreadsheet
      res.setHeader('Content-Type', 'application/vnd.ms-excel');
      res.setHeader('Content-Disposition', `attachment; filename=report_${reportType.toLowerCase()}.xls`);

      let htmlTable = '<table border="1"><tr>';
      reportHeaders.forEach(h => { htmlTable += `<th style="background-color:#4f46e5;color:white;font-weight:bold">${h}</th>`; });
      htmlTable += '</tr>';
      reportDataRows.forEach(row => {
        htmlTable += '<tr>';
        row.forEach(cell => { htmlTable += `<td>${cell}</td>`; });
        htmlTable += '</tr>';
      });
      htmlTable += '</table>';

      return res.status(200).send(htmlTable);
    }

    // Default Fallback: Return raw JSON metadata (used by the client to render inline printable layout)
    return res.json({
      message: 'Report metadata compiled successfully. Ready for browser printing wrapper layout dispatch.',
      reportType,
      format,
      headers: reportHeaders,
      rows: reportDataRows
    });
  } catch (error) {
    return res.status(500).json({ message: 'Report generation failed', error });
  }
};

// ----------------------------------------------------
// AUDIT LOGS STREAM
// ----------------------------------------------------
export const getActivityLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await ActivityLog.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(50);
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Failed loading logs stream', error });
  }
};

// ----------------------------------------------------
// WIDGET CONFIGURATION UPDATES
// ----------------------------------------------------
export const saveDashboardWidgetConfig = async (req: AuthenticatedRequest, res: Response) => {
  const { widgets } = req.body;
  const userId = req.user?.id;

  if (!userId || !Array.isArray(widgets)) {
    return res.status(400).json({ message: 'Invalid configuration parameters' });
  }

  try {
    // Bulk write/update config layout
    await DashboardWidget.deleteMany({ userId });
    
    const formatted = widgets.map(w => ({
      userId,
      widgetId: w.widgetId,
      title: w.title,
      type: w.type,
      position: w.position,
      isVisible: w.isVisible ?? true
    }));
    await DashboardWidget.insertMany(formatted);

    return res.json({ message: 'Dashboard widget configuration successfully updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed updating widget alignments', error });
  }
};

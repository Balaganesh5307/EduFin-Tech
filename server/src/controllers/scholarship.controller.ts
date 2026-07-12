import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Student } from '../models/academic.models';
import { User } from '../models/user.model';
import {
  ScholarshipCategory,
  ScholarshipProgram,
  ScholarshipAidApplication,
  ScholarshipAidDocument,
  ScholarshipAidAward,
  ScholarshipAidTimeline,
  ScholarshipApplicationReview,
  ScholarshipAidHistory
} from '../models/scholarship.models';
import { StudentFee, Ledger, NotificationEvent } from '../models/fee-management.models';

// Helper: Seed categories and initial catalog items if empty
export const ensureScholarshipsSeeded = async () => {
  try {
    const catCount = await ScholarshipCategory.countDocuments();
    if (catCount === 0) {
      const categories = [
        { name: 'Government Scholarship', description: 'Grants disbursed by state or central welfare departments.' },
        { name: 'Merit Scholarship', description: 'Awarded to students with high CGPA ratings.' },
        { name: 'Sports Scholarship', description: 'Fellowships for athletes and tournament winners.' },
        { name: 'Minority Scholarship', description: 'Support programs for minority communities.' },
        { name: 'Community Scholarship', description: 'Support programs based on community category classifications.' },
        { name: 'Need-Based Scholarship', description: 'Grants for students based on household family income.' },
        { name: 'Research Scholarship', description: 'Fellowships for outstanding academic research projects.' },
        { name: 'Private Scholarship', description: 'Private trust funds and corporate CSR awards.' },
        { name: 'Alumni Scholarship', description: 'Alumni association grants and donations.' },
        { name: 'International Scholarship', description: 'Grants awarded for global study exchange support.' }
      ];
      await ScholarshipCategory.insertMany(categories);
      console.log('Scholarship categories seeded successfully.');
    }

    const schCount = await ScholarshipProgram.countDocuments();
    if (schCount === 0) {
      const meritCat = await ScholarshipCategory.findOne({ name: 'Merit Scholarship' });
      const governmentCat = await ScholarshipCategory.findOne({ name: 'Government Scholarship' });
      const sportsCat = await ScholarshipCategory.findOne({ name: 'Sports Scholarship' });
      const needCat = await ScholarshipCategory.findOne({ name: 'Need-Based Scholarship' });

      if (meritCat && governmentCat && sportsCat && needCat) {
        const catalog = [
          {
            title: 'Merit-Cum-Means Scholarship',
            description: 'Awarded to students with excellent academic records (GPA > 8.5) and family income under ₹4,0,0,000.',
            provider: 'University Excellence Trust',
            category: meritCat._id,
            amount: 35000,
            maxBeneficiaries: 50,
            applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            eligibilityRules: {
              minGpa: 8.5,
              minAttendance: 75,
              maxFamilyIncome: 400000,
              allowedDepartments: [],
              allowedCourses: [],
              allowedSemesters: [],
              allowedCommunities: [],
              sportsAchievementRequired: false,
              disabilityAllowed: false,
              academicStandingRequired: 'Good'
            },
            requiredDocuments: ['IncomeCertificate', 'MarkSheets'],
            status: 'Active',
            academicYear: '2026-2027'
          },
          {
            title: 'SJT Trust Tuition Waiver',
            description: 'Full 100% tuition fee waiver for top performing computer science branch students.',
            provider: 'SJT Endowment Trust',
            category: needCat._id,
            amount: 75000,
            maxBeneficiaries: 10,
            applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            eligibilityRules: {
              minGpa: 9.0,
              minAttendance: 85,
              maxFamilyIncome: 600000,
              allowedDepartments: ['Computer Science & Engineering', 'CSE'],
              allowedCourses: [],
              allowedSemesters: [],
              allowedCommunities: [],
              sportsAchievementRequired: false,
              disabilityAllowed: false,
              academicStandingRequired: 'Good'
            },
            requiredDocuments: ['IncomeCertificate', 'MarkSheets', 'RecommendationLetter'],
            status: 'Active',
            academicYear: '2026-2027'
          },
          {
            title: 'National Scholarship Portal Support',
            description: 'Government assistance for minorities and backward classes with family income limit of ₹2,50,000.',
            provider: 'State Welfare Ministry',
            category: governmentCat._id,
            amount: 20000,
            maxBeneficiaries: 200,
            applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            eligibilityRules: {
              minGpa: 7.0,
              minAttendance: 75,
              maxFamilyIncome: 250000,
              allowedDepartments: [],
              allowedCourses: [],
              allowedSemesters: [],
              allowedCommunities: ['OBC', 'SC', 'ST'],
              sportsAchievementRequired: false,
              disabilityAllowed: false,
              academicStandingRequired: 'Good'
            },
            requiredDocuments: ['IncomeCertificate', 'CommunityCertificate', 'MarkSheets', 'BankPassbook'],
            status: 'Active',
            academicYear: '2026-2027'
          },
          {
            title: 'Sports Fellowship Award',
            description: 'Waiver for students representing the university at state or national sports tournaments.',
            provider: 'University Sports Board',
            category: sportsCat._id,
            amount: 15000,
            maxBeneficiaries: 25,
            applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            eligibilityRules: {
              minGpa: 6.0,
              minAttendance: 60,
              maxFamilyIncome: 99999999,
              allowedDepartments: [],
              allowedCourses: [],
              allowedSemesters: [],
              allowedCommunities: [],
              sportsAchievementRequired: true,
              disabilityAllowed: false,
              academicStandingRequired: 'Good'
            },
            requiredDocuments: ['SportsCertificate', 'MarkSheets'],
            status: 'Active',
            academicYear: '2026-2027'
          }
        ];
        await ScholarshipProgram.insertMany(catalog);
        console.log('Scholarship catalog seeded successfully.');
      }
    }
  } catch (err) {
    console.warn('Failed seeding default scholarship metrics:', err);
  }
};

// Dispatch alerts to notification collection
const pushNotify = async (userId: mongoose.Types.ObjectId, title: string, message: string, type: any) => {
  try {
    const notify = new NotificationEvent({
      user: userId,
      title,
      message,
      type,
      isRead: false
    });
    await notify.save();
  } catch (err) {
    console.error('Failed dispatching notification:', err);
  }
};

// ----------------------------------------------------
// STUDENT ENDPOINTS
// ----------------------------------------------------

// Get available scholarships
export const getScholarships = async (req: Request, res: Response) => {
  try {
    await ensureScholarshipsSeeded();
    const list = await ScholarshipProgram.find({ status: 'Active' }).populate('category');
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Error loading scholarships catalog', error });
  }
};

// Get current student applications
export const getMyApplications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const apps = await ScholarshipAidApplication.find({ student: student._id }).populate({
      path: 'scholarship',
      populate: { path: 'category' }
    });

    const detailedApps = [];
    for (const app of apps) {
      const docs = await ScholarshipAidDocument.find({ application: app._id });
      const timeline = await ScholarshipAidTimeline.find({ application: app._id }).sort({ date: 1 });
      detailedApps.push({
        application: app,
        documents: docs,
        timeline
      });
    }

    return res.json(detailedApps);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving scholarship applications', error });
  }
};

// Apply for a scholarship
export const applyScholarship = async (req: AuthenticatedRequest, res: Response) => {
  const { scholarshipId, currentGpa, familyIncome, motivationStatement } = req.body;

  if (!scholarshipId || !currentGpa || !familyIncome || !motivationStatement) {
    return res.status(400).json({ message: 'Missing scholarship application parameters' });
  }

  try {
    const student = await Student.findOne({ user: req.user?.id }).populate('department');
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const scholarship = await ScholarshipProgram.findById(scholarshipId);
    if (!scholarship) return res.status(404).json({ message: 'Scholarship program not found' });

    // AI Match calculations (Simulating parameters)
    const gpa = Number(currentGpa);
    const income = Number(familyIncome);
    const rules = scholarship.eligibilityRules;

    let isEligible = true;
    let matchScore = 100;

    // Standard evaluations
    if (gpa < rules.minGpa) {
      isEligible = false;
      matchScore -= 30;
    }
    if (income > rules.maxFamilyIncome) {
      isEligible = false;
      matchScore -= 40;
    }

    const eligibilityScore = isEligible ? Math.round(75 + Math.random() * 25) : Math.round(30 + Math.random() * 30);
    const approvalProbability = isEligible ? Math.round(50 + Math.random() * 45) : Math.round(5 + Math.random() * 20);

    const newApp = new ScholarshipAidApplication({
      student: student._id,
      scholarship: scholarship._id,
      status: 'Submitted',
      currentGpa: gpa,
      familyIncome: income,
      motivationStatement,
      submissionDate: new Date(),
      matchesScore: Math.max(10, matchScore),
      eligibilityScore,
      approvalProbability
    });
    await newApp.save();

    // Log timeline
    const timeline = new ScholarshipAidTimeline({
      application: newApp._id,
      status: 'Submitted',
      description: 'Scholarship application successfully submitted to administrative review queue.',
      performedBy: 'Student'
    });
    await timeline.save();

    await pushNotify(
      req.user?.id as any,
      'Scholarship Application Submitted',
      `Your application for "${scholarship.title}" has been successfully logged. ID: ${newApp._id}`,
      'FeeAssigned'
    );

    return res.status(201).json(newApp);
  } catch (error) {
    return res.status(500).json({ message: 'Error posting scholarship application', error });
  }
};

// Upload mock supporting document
export const uploadSupportingDoc = async (req: AuthenticatedRequest, res: Response) => {
  const { applicationId, documentType, filename } = req.body;

  if (!applicationId || !documentType || !filename) {
    return res.status(400).json({ message: 'Missing document parameters' });
  }

  try {
    const doc = new ScholarshipAidDocument({
      application: applicationId,
      documentType,
      filePath: `/uploads/documents/${filename}`,
      verificationStatus: 'Pending'
    });
    await doc.save();

    // Add event timeline entry
    const timeline = new ScholarshipAidTimeline({
      application: applicationId,
      status: 'Document Uploaded',
      description: `Supporting attachment "${documentType}" uploaded by applicant.`,
      performedBy: 'Student'
    });
    await timeline.save();

    return res.status(201).json(doc);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record document upload', error });
  }
};

// Withdraw application
export const withdrawApplication = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const app = await ScholarshipAidApplication.findOne({ _id: id, student: student?._id });

    if (!app) return res.status(404).json({ message: 'Scholarship application not resolved' });

    app.status = 'Withdrawn';
    await app.save();

    const timeline = new ScholarshipAidTimeline({
      application: app._id,
      status: 'Withdrawn',
      description: 'Application retracted by student.',
      performedBy: 'Student'
    });
    await timeline.save();

    return res.json({ message: 'Application retracted successfully', app });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retract application', error });
  }
};

// Download mock approval letter PDF
export const downloadApprovalLetter = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const app = await ScholarshipAidApplication.findOne({ _id: id, student: student?._id }).populate('scholarship');

    if (!app || app.status !== 'Approved') {
      return res.status(400).json({ message: 'Approval certificate not available' });
    }

    res.setHeader('Content-Type', 'text/plain');
    return res.send(`MOCK_APPROVAL_LETTER_PDF_BASE64_CERTIFICATE_FOR_${app._id}`);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to retrieve approval letter', error });
  }
};

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// Get Admin dashboard statistics
export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    await ensureScholarshipsSeeded();

    const totalPrograms = await ScholarshipProgram.countDocuments();
    const totalApps = await ScholarshipAidApplication.countDocuments();
    const pendingReview = await ScholarshipAidApplication.countDocuments({ status: 'Submitted' });
    const approved = await ScholarshipAidApplication.countDocuments({ status: 'Approved' });
    const rejected = await ScholarshipAidApplication.countDocuments({ status: 'Rejected' });

    const awards = await ScholarshipAidAward.find();
    const totalAwardedAmount = awards.reduce((sum, a) => sum + a.amount, 0);

    const stats = {
      totalPrograms,
      totalApps,
      pendingReview,
      approved,
      rejected,
      totalAwardedAmount,
      distribution: [
        { name: 'Computer Science & Engineering', value: 4 },
        { name: 'Electronics Engineering', value: 2 },
        { name: 'Mechanical Engineering', value: 1 }
      ],
      monthlyTrends: [
        { name: 'Jan', applied: 10, approved: 4 },
        { name: 'Feb', applied: 15, approved: 8 },
        { name: 'Mar', applied: 30, approved: 12 },
        { name: 'Apr', applied: 25, approved: 10 }
      ]
    };

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: 'Failed compiling statistics dashboard', error });
  }
};

// Create a new scholarship program catalog
export const createScholarshipProgram = async (req: Request, res: Response) => {
  const { title, description, provider, categoryId, amount, maxBeneficiaries, deadline, eligibilityRules, requiredDocuments, status, academicYear } = req.body;

  if (!title || !categoryId || !amount || !deadline || !academicYear) {
    return res.status(400).json({ message: 'Required fields are missing' });
  }

  try {
    const rules = eligibilityRules || {
      minGpa: 0,
      minAttendance: 0,
      maxFamilyIncome: 99999999,
      allowedDepartments: [],
      allowedCourses: [],
      allowedSemesters: [],
      allowedCommunities: [],
      sportsAchievementRequired: false,
      disabilityAllowed: false,
      academicStandingRequired: 'Good'
    };

    const sch = new ScholarshipProgram({
      title,
      description: description || title,
      provider: provider || 'Institution Aid',
      category: categoryId,
      amount: Number(amount),
      maxBeneficiaries: Number(maxBeneficiaries) || 100,
      applicationDeadline: new Date(deadline),
      eligibilityRules: rules,
      requiredDocuments: requiredDocuments || [],
      status: status || 'Draft',
      academicYear
    });
    await sch.save();

    return res.status(201).json(sch);
  } catch (error) {
    return res.status(500).json({ message: 'Failed creating program', error });
  }
};

// Retrieve all applications in the system
export const getAdminApplications = async (req: Request, res: Response) => {
  try {
    const list = await ScholarshipAidApplication.find()
      .populate({
        path: 'student',
        populate: [{ path: 'user' }, { path: 'department' }, { path: 'course' }]
      })
      .populate({
        path: 'scholarship',
        populate: { path: 'category' }
      })
      .sort({ createdAt: -1 });

    const results = [];
    for (const app of list) {
      const docs = await ScholarshipAidDocument.find({ application: app._id });
      const timeline = await ScholarshipAidTimeline.find({ application: app._id }).sort({ date: 1 });
      results.push({
        application: app,
        documents: docs,
        timeline
      });
    }

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Failed retrieving applications', error });
  }
};

// Update Document verification status
export const verifyDocument = async (req: Request, res: Response) => {
  const { docId } = req.params;
  const { verificationStatus, rejectedReason } = req.body;

  if (!verificationStatus) return res.status(400).json({ message: 'Status required' });

  try {
    const doc = await ScholarshipAidDocument.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Supporting document not found' });

    doc.verificationStatus = verificationStatus;
    if (rejectedReason) doc.rejectedReason = rejectedReason;
    await doc.save();

    // Log timeline
    const timeline = new ScholarshipAidTimeline({
      application: doc.application,
      status: `Doc ${verificationStatus}`,
      description: `Supporting attachment "${doc.documentType}" marked as ${verificationStatus} by Admin review board.${rejectedReason ? ' Reason: ' + rejectedReason : ''}`,
      performedBy: 'Admin'
    });
    await timeline.save();

    return res.json({ message: 'Document updated successfully', doc });
  } catch (error) {
    return res.status(500).json({ message: 'Failed modifying document', error });
  }
};

// Review Application decision
export const reviewApplication = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { decision, comments } = req.body; // decision: Approved, Rejected, Waitlisted

  if (!decision || !comments) {
    return res.status(400).json({ message: 'Missing review metrics' });
  }

  try {
    const app = await ScholarshipAidApplication.findById(id).populate('student').populate('scholarship');
    if (!app) return res.status(404).json({ message: 'Application not resolved' });

    app.status = decision;
    await app.save();

    // Log administrative review
    const review = new ScholarshipApplicationReview({
      application: app._id,
      reviewer: req.user?.id as any,
      decision,
      comments,
      date: new Date()
    });
    await review.save();

    const timeline = new ScholarshipAidTimeline({
      application: app._id,
      status: decision,
      description: `Review completed. Application set to ${decision}. Admin comments: "${comments}"`,
      performedBy: 'Admin'
    });
    await timeline.save();

    // FINANCIAL INTEGRATION
    if (decision === 'Approved') {
      const awardAmount = (app.scholarship as any).amount || 0;

      // 1. Create ScholarshipAidAward
      const award = new ScholarshipAidAward({
        application: app._id,
        student: (app.student as any)._id,
        scholarship: (app.scholarship as any)._id,
        amount: awardAmount,
        academicYear: (app.scholarship as any).academicYear,
        awardDate: new Date(),
        isDisbursed: true
      });
      await award.save();

      // 2. Reduce outstanding StudentFee
      const studentFee = await StudentFee.findOne({
        student: (app.student as any)._id,
        status: { $in: ['Unpaid', 'PartiallyPaid', 'Overdue'] }
      });

      if (studentFee) {
        studentFee.discountAmount += awardAmount;
        studentFee.balanceAmount = Math.max(0, studentFee.totalAmount - studentFee.paidAmount - studentFee.discountAmount);
        
        if (studentFee.balanceAmount === 0) {
          studentFee.status = 'Paid';
        } else {
          studentFee.status = 'PartiallyPaid';
        }
        studentFee.fundingSource = 'Scholarship';
        await studentFee.save();
      }

      // 3. Register Credit entry in chronological student Ledger
      const ledger = await Ledger.findOne({ student: (app.student as any)._id });
      if (ledger) {
        const lastBalance = ledger.entries.length > 0 ? ledger.entries[ledger.entries.length - 1].balance : 0;
        const newBalance = lastBalance - awardAmount; // credit reduces outstanding balance liability
        
        ledger.entries.push({
          date: new Date(),
          type: 'Credit',
          amount: awardAmount,
          description: `Educational Credit Disbursed: ${(app.scholarship as any).title}`,
          balance: newBalance,
          referenceType: 'Scholarship',
          referenceId: award._id as any
        });
        await ledger.save();

        award.ledgerEntryId = ledger.entries[ledger.entries.length - 1]._id;
        await award.save();
      }

      // 4. Log Financial Aid history
      const aidHistory = new ScholarshipAidHistory({
        student: (app.student as any)._id,
        scholarshipAward: award._id,
        type: 'Scholarship',
        amount: awardAmount,
        academicYear: (app.scholarship as any).academicYear,
        status: 'Disbursed',
        details: `Disbursed scholarship grant under ${(app.scholarship as any).title}`
      });
      await aidHistory.save();

      await pushNotify(
        (app.student as any).user,
        'Scholarship Approved & Disbursed',
        `Congratulations! Your application for "${(app.scholarship as any).title}" has been approved. ₹${awardAmount.toLocaleString()} has been credited to your academic ledger.`,
        'PaymentSuccess'
      );
    } else if (decision === 'Rejected') {
      await pushNotify(
        (app.student as any).user,
        'Scholarship Application Update',
        `Your application for "${(app.scholarship as any).title}" was reviewed and rejected. Comments: ${comments}`,
        'PaymentFailed'
      );
    }

    return res.json({ message: `Application status set to ${decision}`, app });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record application review', error });
  }
};

// Bulk applications reviews
export const bulkReviewApplications = async (req: AuthenticatedRequest, res: Response) => {
  const { applicationIds, decision, comments } = req.body;

  if (!applicationIds || !applicationIds.length || !decision || !comments) {
    return res.status(400).json({ message: 'Required fields missing for bulk reviews' });
  }

  try {
    const results = [];
    for (const appId of applicationIds) {
      // Re-use single review method logic securely
      try {
        const app = await ScholarshipAidApplication.findById(appId).populate('student').populate('scholarship');
        if (app) {
          app.status = decision;
          await app.save();

          const review = new ScholarshipApplicationReview({
            application: app._id,
            reviewer: req.user?.id as any,
            decision,
            comments,
            date: new Date()
          });
          await review.save();

          const timeline = new ScholarshipAidTimeline({
            application: app._id,
            status: decision,
            description: `Bulk review processed: marked as ${decision}. Remarks: "${comments}"`,
            performedBy: 'Admin'
          });
          await timeline.save();

          if (decision === 'Approved') {
            const awardAmount = (app.scholarship as any).amount || 0;
            const award = new ScholarshipAidAward({
              application: app._id,
              student: (app.student as any)._id,
              scholarship: (app.scholarship as any)._id,
              amount: awardAmount,
              academicYear: (app.scholarship as any).academicYear,
              awardDate: new Date(),
              isDisbursed: true
            });
            await award.save();

            const studentFee = await StudentFee.findOne({
              student: (app.student as any)._id,
              status: { $in: ['Unpaid', 'PartiallyPaid', 'Overdue'] }
            });
            if (studentFee) {
              studentFee.discountAmount += awardAmount;
              studentFee.balanceAmount = Math.max(0, studentFee.totalAmount - studentFee.paidAmount - studentFee.discountAmount);
              studentFee.status = studentFee.balanceAmount === 0 ? 'Paid' : 'PartiallyPaid';
              studentFee.fundingSource = 'Scholarship';
              await studentFee.save();
            }

            const ledger = await Ledger.findOne({ student: (app.student as any)._id });
            if (ledger) {
              const lastBalance = ledger.entries.length > 0 ? ledger.entries[ledger.entries.length - 1].balance : 0;
              ledger.entries.push({
                date: new Date(),
                type: 'Credit',
                amount: awardAmount,
                description: `Educational Credit Disbursed: ${(app.scholarship as any).title}`,
                balance: lastBalance - awardAmount,
                referenceType: 'Scholarship',
                referenceId: award._id as any
              });
              await ledger.save();
              award.ledgerEntryId = ledger.entries[ledger.entries.length - 1]._id;
              await award.save();
            }

            const aidHistory = new ScholarshipAidHistory({
              student: (app.student as any)._id,
              scholarshipAward: award._id,
              type: 'Scholarship',
              amount: awardAmount,
              academicYear: (app.scholarship as any).academicYear,
              status: 'Disbursed',
              details: `Disbursed scholarship grant under ${(app.scholarship as any).title}`
            });
            await aidHistory.save();

            await pushNotify(
              (app.student as any).user,
              'Scholarship Approved (Bulk)',
              `Congratulations! Your application for "${(app.scholarship as any).title}" has been approved. ₹${awardAmount.toLocaleString()} has been credited to your academic ledger.`,
              'PaymentSuccess'
            );
          }
          results.push({ appId, success: true });
        }
      } catch (err) {
        results.push({ appId, success: false, error: err });
      }
    }
    return res.json({ message: 'Bulk processing completed', results });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process bulk decisions', error });
  }
};

// Export applications log spreadsheet CSV
export const exportScholarshipsReport = async (req: Request, res: Response) => {
  try {
    const list = await ScholarshipAidApplication.find()
      .populate('student')
      .populate('scholarship');

    let csv = 'Application ID,Student ID,Scholarship Name,CGPA,Family Income,Status,Submission Date\n';
    list.forEach((app: any) => {
      csv += `"${app._id}","${app.student?.studentId || 'N/A'}","${app.scholarship?.title || 'N/A'}",${app.currentGpa},${app.familyIncome},"${app.status}","${app.submissionDate.toISOString().split('T')[0]}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=scholarships_aid_report.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compile report', error });
  }
};

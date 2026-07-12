import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Student } from '../models/academic.models';
import { User } from '../models/user.model';
import {
  LoanScheme,
  LoanProgramApplication,
  LoanProgramDocument,
  LoanProgramApproval,
  LoanProgramEMISchedule,
  LoanProgramRepayment,
  LoanProgramTransaction,
  LoanProgramStatement,
  LoanProgramNotification
} from '../models/loan.models';
import { StudentFee, Ledger, NotificationEvent } from '../models/fee-management.models';

// Helper: Seed Loan Schemes if empty
export const ensureLoanSchemesSeeded = async () => {
  try {
    const count = await LoanScheme.countDocuments();
    if (count === 0) {
      const schemes = [
        {
          name: 'Government Education Loan',
          description: 'Low-interest government subsidized loan for engineering and medical streams with 1 year moratorium.',
          maxAmount: 750000,
          minAmount: 50000,
          interestRate: 6.5,
          processingFee: 500,
          repaymentPeriodMonths: 60,
          gracePeriodMonths: 12,
          eligibilityRules: { minGpa: 6.5, maxFamilyIncome: 450000, requireCollateral: false },
          status: 'Active'
        },
        {
          name: 'Private Bank Loan',
          description: 'Higher limit collateralized loan for national and international campus programs.',
          maxAmount: 1500000,
          minAmount: 100000,
          interestRate: 10.5,
          processingFee: 1500,
          repaymentPeriodMonths: 48,
          gracePeriodMonths: 6,
          eligibilityRules: { minGpa: 6.0, maxFamilyIncome: 99999999, requireCollateral: true },
          status: 'Active'
        },
        {
          name: 'College Financial Aid Loan',
          description: 'Interest-free emergency campus credit for tuition balance settlement.',
          maxAmount: 150000,
          minAmount: 10000,
          interestRate: 0.0,
          processingFee: 0,
          repaymentPeriodMonths: 12,
          gracePeriodMonths: 3,
          eligibilityRules: { minGpa: 7.5, maxFamilyIncome: 300000, requireCollateral: false },
          status: 'Active'
        },
        {
          name: 'Emergency Student Loan',
          description: 'Short term loan for hostel charges, laptops, or textbooks with immediate sanction.',
          maxAmount: 50000,
          minAmount: 5000,
          interestRate: 5.5,
          processingFee: 100,
          repaymentPeriodMonths: 6,
          gracePeriodMonths: 1,
          eligibilityRules: { minGpa: 5.5, maxFamilyIncome: 99999999, requireCollateral: false },
          status: 'Active'
        }
      ];
      await LoanScheme.insertMany(schemes);
      console.log('Loan Schemes seeded successfully.');
    }
  } catch (err) {
    console.warn('Failed seeding default loan schemes:', err);
  }
};

// Dispatch standard notifications
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

// Helper: Amortization math
const calculateEMI = (principal: number, annualRate: number, months: number): { emi: number; schedule: Array<{ principal: number; interest: number; balance: number }> } => {
  const r = annualRate / 12 / 100;
  let emi = 0;
  if (r === 0) {
    emi = principal / months;
  } else {
    emi = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  }

  const schedule = [];
  let remaining = principal;
  for (let i = 1; i <= months; i++) {
    const interest = r === 0 ? 0 : remaining * r;
    const princ = emi - interest;
    remaining = Math.max(0, remaining - princ);
    schedule.push({
      principal: Math.round(princ),
      interest: Math.round(interest),
      balance: Math.round(remaining)
    });
  }

  return { emi: Math.round(emi), schedule };
};

// ----------------------------------------------------
// STUDENT ENDPOINTS
// ----------------------------------------------------

// Get available schemes
export const getLoanSchemes = async (req: Request, res: Response) => {
  try {
    await ensureLoanSchemesSeeded();
    const list = await LoanScheme.find({ status: 'Active' });
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ message: 'Failed loading loan schemes catalog', error });
  }
};

// Get current student loan applications
export const getMyLoanApplications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const apps = await LoanProgramApplication.find({ student: student._id }).populate('scheme');

    const results = [];
    for (const app of apps) {
      const schedule = await LoanProgramEMISchedule.find({ application: app._id }).sort({ installmentNumber: 1 });
      const repayments = await LoanProgramRepayment.find({ application: app._id }).sort({ paymentDate: -1 });
      const documents = await LoanProgramDocument.find({ application: app._id });

      const paidAmount = repayments.reduce((sum, r) => sum + r.amountPaid, 0);
      const remainingAmount = app.amountSanctioned ? Math.max(0, app.amountSanctioned - paidAmount) : app.amountRequested;

      results.push({
        application: app,
        schedule,
        repayments,
        documents,
        paidAmount,
        remainingAmount
      });
    }

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Failed retrieving loans history', error });
  }
};

// Apply for a loan
export const applyForLoan = async (req: AuthenticatedRequest, res: Response) => {
  const { schemeId, amountRequested, purpose } = req.body;

  if (!schemeId || !amountRequested || !purpose) {
    return res.status(400).json({ message: 'Missing loan application parameters' });
  }

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const scheme = await LoanScheme.findById(schemeId);
    if (!scheme) return res.status(404).json({ message: 'Loan scheme not found' });

    const amt = Number(amountRequested);
    if (amt < scheme.minAmount || amt > scheme.maxAmount) {
      return res.status(400).json({ message: `Amount must be between ₹${scheme.minAmount} and ₹${scheme.maxAmount}` });
    }

    // AI risk simulations
    const riskScore = Math.round(15 + Math.random() * 20); // 15-35 (Low-medium risk)
    const defaultProbability = Math.round(2 + Math.random() * 8); // 2-10% probability
    const approvalProbability = Math.round(70 + Math.random() * 25); // 70-95% probability

    const application = new LoanProgramApplication({
      student: student._id,
      scheme: scheme._id,
      amountRequested: amt,
      purpose,
      status: 'Submitted',
      submissionDate: new Date(),
      riskScore,
      defaultProbability,
      approvalProbability
    });
    await application.save();

    await pushNotify(
      req.user?.id as any,
      'Loan Application Submitted',
      `Your application for "${scheme.name}" of ₹${amt.toLocaleString()} has been logged. Status is under verification.`,
      'FeeAssigned'
    );

    return res.status(201).json(application);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to post loan request', error });
  }
};

// Upload supporting document copy files
export const uploadLoanDocument = async (req: AuthenticatedRequest, res: Response) => {
  const { applicationId, documentType, filename } = req.body;

  if (!applicationId || !documentType || !filename) {
    return res.status(400).json({ message: 'Missing document parameters' });
  }

  try {
    const doc = new LoanProgramDocument({
      application: applicationId,
      documentType,
      filePath: `/uploads/documents/${filename}`,
      verificationStatus: 'Pending'
    });
    await doc.save();

    return res.status(201).json(doc);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record document upload', error });
  }
};

// Settle a scheduled EMI installment
export const payEMIInstallment = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params; // application ID
  const { installmentId, paymentMethod } = req.body;

  if (!installmentId || !paymentMethod) {
    return res.status(400).json({ message: 'Missing EMI payment details' });
  }

  try {
    const student = await Student.findOne({ user: req.user?.id });
    if (!student) return res.status(404).json({ message: 'Student profile not resolved' });

    const app = await LoanProgramApplication.findOne({ _id: id, student: student._id }).populate('scheme');
    if (!app) return res.status(404).json({ message: 'Active loan not found' });

    const emi = await LoanProgramEMISchedule.findById(installmentId);
    if (!emi || emi.status === 'Paid') {
      return res.status(400).json({ message: 'EMI installment is invalid or already paid' });
    }

    // Process repayment record
    emi.status = 'Paid';
    emi.paidDate = new Date();
    emi.transactionReference = `TXN_EMI_${Date.now()}`;
    await emi.save();

    const repayment = new LoanProgramRepayment({
      application: app._id,
      student: student._id,
      emiSchedule: emi._id,
      amountPaid: emi.emiAmount + emi.lateFeeApplied,
      principalPaid: emi.principalAmount,
      interestPaid: emi.interestAmount,
      lateFeePaid: emi.lateFeeApplied,
      paymentDate: new Date(),
      paymentMethod,
      transactionId: emi.transactionReference
    });
    await repayment.save();

    // Log transactional ledger
    const txn = new LoanProgramTransaction({
      application: app._id,
      student: student._id,
      type: 'Repayment',
      amount: repayment.amountPaid,
      date: new Date(),
      description: `EMI Installment #${emi.installmentNumber} paid successfully.`,
      referenceId: repayment._id as any
    });
    await txn.save();

    // Check if all EMIs are paid to auto-close the loan
    const unpaidEMIs = await LoanProgramEMISchedule.countDocuments({ application: app._id, status: { $ne: 'Paid' } });
    if (unpaidEMIs === 0) {
      app.status = 'Closed';
      await app.save();
      await pushNotify(
        req.user?.id as any,
        'Loan Account Closed',
        `Congratulations! Your education loan account under "${(app.scheme as any).name}" has been fully settled and closed.`,
        'PaymentSuccess'
      );
    } else {
      await pushNotify(
        req.user?.id as any,
        'EMI Payment Success',
        `EMI installment #${emi.installmentNumber} of ₹${repayment.amountPaid.toLocaleString()} paid successfully.`,
        'PaymentSuccess'
      );
    }

    return res.json({ message: 'EMI paid successfully', emi });
  } catch (error) {
    return res.status(500).json({ message: 'EMI payment processing failed', error });
  }
};

// Generate base64 statement
export const getLoanStatement = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const app = await LoanProgramApplication.findOne({ _id: id, student: student?._id }).populate('scheme');

    if (!app) return res.status(404).json({ message: 'Loan application not resolved' });

    const txns = await LoanProgramTransaction.find({ application: app._id }).sort({ date: 1 });
    const repayments = await LoanProgramRepayment.find({ application: app._id });

    const totalRepaid = repayments.reduce((sum, r) => sum + r.amountPaid, 0);
    const balance = app.amountSanctioned ? Math.max(0, app.amountSanctioned - totalRepaid) : 0;

    let statementText = `==================================================\n`;
    statementText += `          EDUCATION LOAN ACCOUNT STATEMENT        \n`;
    statementText += `==================================================\n`;
    statementText += `Loan ID: ${app._id}\n`;
    statementText += `Scheme: ${(app.scheme as any).name}\n`;
    statementText += `Student: ${student?.rollNumber}\n`;
    statementText += `Sanction Amount: ₹${app.amountSanctioned?.toLocaleString() || 'N/A'}\n`;
    statementText += `Total Paid Amount: ₹${totalRepaid.toLocaleString()}\n`;
    statementText += `Outstanding Balance: ₹${balance.toLocaleString()}\n`;
    statementText += `--------------------------------------------------\n`;
    statementText += `DATE       TYPE         DESCRIPTION               AMOUNT\n`;
    statementText += `--------------------------------------------------\n`;
    txns.forEach(t => {
      statementText += `${t.date.toISOString().split('T')[0]}  ${t.type.padEnd(10)}  ${t.description.padEnd(25)}  ₹${t.amount.toLocaleString()}\n`;
    });
    statementText += `==================================================\n`;

    res.setHeader('Content-Type', 'text/plain');
    return res.send(Buffer.from(statementText).toString('base64'));
  } catch (error) {
    return res.status(500).json({ message: 'Failed generating statement', error });
  }
};

// Withdraw application
export const withdrawLoanApplication = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const student = await Student.findOne({ user: req.user?.id });
    const app = await LoanProgramApplication.findOne({ _id: id, student: student?._id });

    if (!app || app.status !== 'Submitted') {
      return res.status(400).json({ message: 'Request not eligible for retraction' });
    }

    app.status = 'Withdrawn';
    await app.save();

    return res.json({ message: 'Loan application withdrawn successfully', app });
  } catch (error) {
    return res.status(500).json({ message: 'Failed withdrawing application', error });
  }
};

// ----------------------------------------------------
// ADMIN ENDPOINTS
// ----------------------------------------------------

// Get Admin dashboard statistics
export const getAdminDashboardStats = async (req: Request, res: Response) => {
  try {
    await ensureLoanSchemesSeeded();

    const totalApplications = await LoanProgramApplication.countDocuments();
    const pendingReview = await LoanProgramApplication.countDocuments({ status: 'Submitted' });
    const approvedLoans = await LoanProgramApplication.countDocuments({ status: 'Disbursed' });
    const rejectedLoans = await LoanProgramApplication.countDocuments({ status: 'Rejected' });

    // Portfolio & Recovery
    const activeLoans = await LoanProgramApplication.find({ status: 'Disbursed' });
    const totalPortfolio = activeLoans.reduce((sum, l) => sum + (l.amountSanctioned || 0), 0);

    const repayments = await LoanProgramRepayment.find();
    const totalCollected = repayments.reduce((sum, r) => sum + r.amountPaid, 0);

    const defaultRate = activeLoans.length > 0 ? 4.2 : 0; // Simulated static credit default probability rating

    const stats = {
      totalPortfolio,
      totalCollected,
      totalApplications,
      pendingReview,
      approvedLoans,
      rejectedLoans,
      defaultRate,
      monthlyCollections: [
        { month: 'Jan', collected: 250000 },
        { month: 'Feb', collected: 340000 },
        { month: 'Mar', collected: 450000 },
        { month: 'Apr', collected: 410000 }
      ],
      recoveryTrends: [
        { name: 'Disbursed Principal', value: totalPortfolio, color: '#6366f1' },
        { name: 'Collected EMIs', value: totalCollected, color: '#10b981' }
      ]
    };

    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ message: 'Failed compiling statistics dashboard', error });
  }
};

// Create a new loan scheme
export const createLoanScheme = async (req: Request, res: Response) => {
  const { name, description, minAmount, maxAmount, interestRate, processingFee, repaymentPeriodMonths, gracePeriodMonths, minGpa, maxFamilyIncome, requireCollateral } = req.body;

  if (!name || !description || !minAmount || !maxAmount || !interestRate || !repaymentPeriodMonths) {
    return res.status(400).json({ message: 'Missing required schema fields' });
  }

  try {
    const scheme = new LoanScheme({
      name,
      description,
      minAmount: Number(minAmount),
      maxAmount: Number(maxAmount),
      interestRate: Number(interestRate),
      processingFee: Number(processingFee) || 0,
      repaymentPeriodMonths: Number(repaymentPeriodMonths),
      gracePeriodMonths: Number(gracePeriodMonths) || 6,
      eligibilityRules: {
        minGpa: Number(minGpa) || 0,
        maxFamilyIncome: Number(maxFamilyIncome) || 99999999,
        requireCollateral: !!requireCollateral
      },
      status: 'Active'
    });
    await scheme.save();

    return res.status(201).json(scheme);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to configure loan scheme', error });
  }
};

// Retrieve all applications in the system
export const getAdminApplications = async (req: Request, res: Response) => {
  try {
    const list = await LoanProgramApplication.find()
      .populate({
        path: 'student',
        populate: [{ path: 'user' }, { path: 'department' }, { path: 'course' }]
      })
      .populate('scheme')
      .sort({ createdAt: -1 });

    const results = [];
    for (const app of list) {
      const documents = await LoanProgramDocument.find({ application: app._id });
      results.push({
        application: app,
        documents
      });
    }

    return res.json(results);
  } catch (error) {
    return res.status(500).json({ message: 'Failed loading application queues', error });
  }
};

// Update Document verification status
export const verifyDocument = async (req: Request, res: Response) => {
  const { docId } = req.params;
  const { verificationStatus, rejectedReason } = req.body;

  if (!verificationStatus) return res.status(400).json({ message: 'Status required' });

  try {
    const doc = await LoanProgramDocument.findById(docId);
    if (!doc) return res.status(404).json({ message: 'Supporting document not found' });

    doc.verificationStatus = verificationStatus;
    if (rejectedReason) doc.rejectedReason = rejectedReason;
    await doc.save();

    return res.json({ message: 'Document updated successfully', doc });
  } catch (error) {
    return res.status(500).json({ message: 'Failed modifying document', error });
  }
};

// Review Application decision
export const reviewApplication = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { decision, comments } = req.body; // decision: Approved, Rejected

  if (!decision || !comments) {
    return res.status(400).json({ message: 'Missing review metrics' });
  }

  try {
    const app = await LoanProgramApplication.findById(id).populate('student').populate('scheme');
    if (!app) return res.status(404).json({ message: 'Application not resolved' });

    const scheme = app.scheme as any;

    if (decision === 'Approved') {
      app.status = 'Disbursed';
      app.amountSanctioned = app.amountRequested;
      app.sanctionDate = new Date();
      
      const morMonths = scheme.gracePeriodMonths || 6;
      const repDate = new Date();
      repDate.setMonth(repDate.getMonth() + morMonths);
      app.repaymentStartDate = repDate;
      await app.save();

      // Log admin approval parameters
      const approval = new LoanProgramApproval({
        application: app._id,
        reviewer: req.user?.id as any,
        decision: 'Approved',
        comments,
        interestRateConfigured: scheme.interestRate,
        repaymentPeriodMonthsConfigured: scheme.repaymentPeriodMonths,
        gracePeriodMonthsConfigured: morMonths
      });
      await approval.save();

      // 1. Generate EMISchedule installments
      const { emi, schedule } = calculateEMI(app.amountRequested, scheme.interestRate, scheme.repaymentPeriodMonths);
      
      const baseDate = new Date(repDate);
      const scheduleEntries = schedule.map((inst, index) => {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + index);
        return {
          application: app._id,
          student: (app.student as any)._id,
          installmentNumber: index + 1,
          dueDate,
          emiAmount: emi,
          principalAmount: inst.principal,
          interestAmount: inst.interest,
          lateFeeApplied: 0,
          status: 'Unpaid'
        };
      });
      await LoanProgramEMISchedule.insertMany(scheduleEntries);

      // 2. Log first Disbursement transaction
      const txn = new LoanProgramTransaction({
        application: app._id,
        student: (app.student as any)._id,
        type: 'Disbursement',
        amount: app.amountRequested,
        date: new Date(),
        description: `Moratorium loan sanctioned under ${scheme.name}.`,
        referenceId: approval._id as any
      });
      await txn.save();

      // 3. Integrate with Finance Module: Reduce Student Outstanding Fees
      const studentFee = await StudentFee.findOne({
        student: (app.student as any)._id,
        status: { $in: ['Unpaid', 'PartiallyPaid', 'Overdue'] }
      });

      if (studentFee) {
        studentFee.paidAmount += app.amountRequested;
        studentFee.balanceAmount = Math.max(0, studentFee.totalAmount - studentFee.paidAmount - studentFee.discountAmount);
        studentFee.status = studentFee.balanceAmount === 0 ? 'Paid' : 'PartiallyPaid';
        studentFee.fundingSource = 'Loan';
        await studentFee.save();
      }

      // 4. Register Credit entry in chronological student Ledger
      const ledger = await Ledger.findOne({ student: (app.student as any)._id });
      if (ledger) {
        const lastBalance = ledger.entries.length > 0 ? ledger.entries[ledger.entries.length - 1].balance : 0;
        ledger.entries.push({
          date: new Date(),
          type: 'Credit',
          amount: app.amountRequested,
          description: `Education Credit Line: ${scheme.name}`,
          balance: lastBalance - app.amountRequested, // credit reduces the outstanding liability
          referenceType: 'Loan',
          referenceId: approval._id as any
        });
        await ledger.save();
      }

      await pushNotify(
        (app.student as any).user,
        'Loan Approved & Sanctioned',
        `Congratulations! Your education loan for "${scheme.name}" of ₹${app.amountRequested.toLocaleString()} is sanctioned. Ledger updated!`,
        'PaymentSuccess'
      );
    } else {
      app.status = 'Rejected';
      await app.save();

      const approval = new LoanProgramApproval({
        application: app._id,
        reviewer: req.user?.id as any,
        decision: 'Rejected',
        comments,
        interestRateConfigured: scheme.interestRate,
        repaymentPeriodMonthsConfigured: scheme.repaymentPeriodMonths,
        gracePeriodMonthsConfigured: scheme.gracePeriodMonths
      });
      await approval.save();

      await pushNotify(
        (app.student as any).user,
        'Loan Application Update',
        `Your education loan application for "${scheme.name}" has been rejected. Comments: ${comments}`,
        'PaymentFailed'
      );
    }

    return res.json({ message: `Application status set to ${decision}`, app });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to record application review', error });
  }
};

// Export loan applications CSV spreadsheet report
export const exportLoansReport = async (req: Request, res: Response) => {
  try {
    const list = await LoanProgramApplication.find()
      .populate('student')
      .populate('scheme');

    let csv = 'Application ID,Student ID,Scheme Name,Requested,Sanctioned,Status,Sanction Date\n';
    list.forEach((app: any) => {
      csv += `"${app._id}","${app.student?.studentId || 'N/A'}","${app.scheme?.name || 'N/A'}",${app.amountRequested},${app.amountSanctioned || 0},"${app.status}","${app.sanctionDate ? app.sanctionDate.toISOString().split('T')[0] : 'N/A'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=loans_report.csv');
    return res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to compile report', error });
  }
};

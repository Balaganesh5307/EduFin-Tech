import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getBudgetAdvice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // In production, this would parse the student's Expense and Budget collections
    // and query the FastAPI service or Gemini model.
    return res.json({
      advice: "Your academics category accounts for 27% of your budget this month, which is within the safe limit. However, your food expenses are trending 14% higher than last week. We recommend reducing leisure food ordering to save about ₹1,500 and hit your 'Semester Exchange Fund' savings goal 6 days ahead of schedule.",
      tips: [
        "Use university library subscription instead of buying new course text books.",
        "Consider opting for the campus meal plan subscription instead of separate cafeteria bills."
      ],
      healthScore: 78
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error from AI Budget Advisor', error });
  }
};

export const getScholarshipRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json({
      recommendations: [
        {
          id: 'schol_1',
          name: 'Merit-Cum-Means Engineering Scholarship',
          matchRate: 95,
          reason: "Your GPA is 8.7 (min requirement: 8.5) and your family annual income matches the means category criteria.",
          benefit: "50% Tuition Fee Waiver",
          deadline: "2026-08-30"
        },
        {
          id: 'schol_2',
          name: 'Tech Pioneers Women/Diversity Fellowship',
          matchRate: 80,
          reason: "Active participation in college coding clubs and academic achievements in semesters 3 and 4.",
          benefit: "Flat ₹25,000 allowance per semester",
          deadline: "2026-09-15"
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving AI recommendations', error });
  }
};

export const predictLoanRisk = async (req: Request, res: Response) => {
  const { coApplicantIncome, loanAmount, gpa } = req.body;

  try {
    // Placeholder for ML classifier / LLM evaluator
    const debtToIncome = loanAmount / (coApplicantIncome * 12);
    let riskLevel = 'Low';
    let approvalProb = 92;

    if (debtToIncome > 1.5 || gpa < 6.5) {
      riskLevel = 'High';
      approvalProb = 28;
    } else if (debtToIncome > 0.8) {
      riskLevel = 'Medium';
      approvalProb = 65;
    }

    return res.json({
      riskLevel,
      approvalProbability: approvalProb,
      factors: [
        `Co-applicant debt-to-income ratio is ${(debtToIncome * 100).toFixed(1)}%`,
        gpa >= 8.0 ? "Excellent student GPA history mitigates credit risk" : "Average GPA increases default probability"
      ]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error calculating loan risk parameters', error });
  }
};

export const parseReceiptOCR = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Multer uploads file under req.file. 
    // In production, we send the file buffer to FastAPI OCR receipt scanner.
    return res.json({
      success: true,
      data: {
        vendorName: "University Bookstore",
        totalAmount: 1850,
        taxAmount: 92,
        detectedDate: new Date().toISOString().split('T')[0],
        category: "Academics",
        itemsDetected: [
          { name: "Advanced Data Structures & Algorithms Book", price: 1200 },
          { name: "Graph Notebook A4 (3-pack)", price: 650 }
        ]
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'OCR analysis failed', error });
  }
};

export const chatbotQuery = async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message query is required' });
  }

  try {
    // Process input. Here is a responsive rule-based routing for chat demonstration
    let reply = "I am the EduFin AI Assistant. I can help you track fee invoices, scholarship eligibility, personal budgets, and student loan applications. Could you please specify your query?";
    
    const msg = message.toLowerCase();
    if (msg.includes('fee') || msg.includes('invoice') || msg.includes('pay')) {
      reply = "Your upcoming Tuition Fee for Semester 5 is ₹35,000, due on 15th August 2026. You can pay online via Razorpay directly from your Finance section.";
    } else if (msg.includes('budget') || msg.includes('expense') || msg.includes('saving')) {
      reply = "According to your expense trackers, you have spent ₹8,740 of your ₹12,000 monthly limit. You're doing great! You've saved ₹18,500 towards your Semester Exchange Goal.";
    } else if (msg.includes('scholarship') || msg.includes('grant')) {
      reply = "I recommend the 'Merit-Cum-Means Engineering Scholarship'. You match 95% of the qualifications based on your 8.7 CGPA. Applications are open until 30th August.";
    } else if (msg.includes('loan') || msg.includes('emi')) {
      reply = "You can submit an Education Loan application with an interest rate starting at 7.5% p.a. Enter your details in the Loans tab to calculate EMI rates.";
    }

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({ message: 'AI Chatbot error', error });
  }
};

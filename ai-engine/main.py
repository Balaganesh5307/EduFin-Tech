import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="EduFin AI Engine",
    description="Microservice supporting predictive modeling, receipt scans, and chatbot logic",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------
class ChatRequest(BaseModel):
    message: str
    userId: Optional[str] = None
    role: Optional[str] = "Student"

class BudgetAdvisorRequest(BaseModel):
    monthlyExpenses: float
    budgetLimit: float
    savingsGoalTarget: float
    savingsGoalCurrent: float
    categoryBreakdown: dict

class LoanRiskRequest(BaseModel):
    gpa: float
    coApplicantIncome: float
    loanAmount: float
    durationMonths: int

# ---------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "service": "EduFin AI Engine",
        "status": "active",
        "gemini_configured": bool(os.getenv("GEMINI_API_KEY"))
    }

@app.post("/ai/chatbot")
def chatbot_agent(payload: ChatRequest):
    # Future Ready: Bind to Gemini API model (e.g. genai.GenerativeModel('gemini-1.5-flash'))
    # using LangChain structured prompt templates.
    message = payload.message.lower()
    
    reply = "I am the EduFin AI Assistant running on FastAPI. How can I help you manage your college fee schedule or budgets today?"
    if "fee" in message or "pay" in message:
        reply = "You can view your current pending bills in your dashboard overview. Online transactions can be completed securely via credit cards or Razorpay netbanking."
    elif "budget" in message or "expense" in message:
        reply = "Your monthly expenditures are monitored inside the tracker page. Let me know if you would like me to review high-cost items!"
        
    return {"reply": reply}

@app.post("/ai/budget-advisor")
def budget_advisor(payload: BudgetAdvisorRequest):
    spent_ratio = payload.monthlyExpenses / payload.budgetLimit
    savings_ratio = payload.savingsGoalCurrent / payload.savingsGoalTarget
    
    advice = "Your spending is within safe margins. Keep investing in your savings milestones!"
    health_score = 80
    
    if spent_ratio > 0.85:
        advice = "Alert: You have exhausted 85% of your monthly allocation. We recommend freezing leisure shopping transactions to secure your savings goals."
        health_score = 55
    elif spent_ratio > 0.65:
        advice = "Warning: Expenses are trending high. Consider shifting dining transactions to campus meal options to save money."
        health_score = 72

    return {
        "advice": advice,
        "healthScore": health_score,
        "recommends": [
            "Opt for library textbooks instead of direct bookstore purchasing.",
            "Utilize digital wallets with cashback options on transit costs."
        ]
    }

@app.post("/ai/loan-risk-prediction")
def predict_loan_risk(payload: LoanRiskRequest):
    # Debt-to-income and GPA risk check classifier placeholder
    debt_to_income = payload.loanAmount / (payload.coApplicantIncome * 12)
    
    risk_level = "Low"
    prob = 90.5
    factors = []

    if debt_to_income > 1.2:
        risk_level = "High"
        prob = 22.4
        factors.append("Debt-to-income ratio exceeds safe thresholds (>120%).")
    elif debt_to_income > 0.7:
        risk_level = "Medium"
        prob = 61.8
        factors.append("Moderate debt load observed.")
        
    if payload.gpa < 7.0:
        if risk_level != "High":
            risk_level = "Medium"
        prob = max(10.0, prob - 30.0)
        factors.append("Student academic GPA history presents risk indicators.")
    else:
        factors.append("Strong GPA metrics mitigate credit risks.")

    return {
        "riskLevel": risk_level,
        "approvalProbability": prob,
        "factors": factors
    }

@app.post("/ai/ocr-receipt-scanner")
async def ocr_receipt_scanner(receipt: UploadFile = File(...)):
    # Future Ready: Use Pillow + Gemini LLM multimodal capabilities to parse receipt attachments:
    # model = genai.GenerativeModel('gemini-1.5-flash')
    # response = model.generate_content([image, "Extract vendor name, total price, and expense categories from this receipt"])
    
    return {
        "success": True,
        "vendor": "Campus Foodcourt",
        "detectedAmount": 650.0,
        "detectedDate": "2026-07-09",
        "category": "Food",
        "items": [
            {"item": "Pepperoni Pizza Slice", "price": 450.0},
            {"item": "Vanilla Milkshake", "price": 200.0}
        ]
      }

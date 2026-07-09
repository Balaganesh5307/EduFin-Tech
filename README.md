# EduFin - AI-Powered Smart Education Finance & Campus Management Ecosystem

EduFin is a premium, modern SaaS platform engineered for university campuses. It brings together student data, fee structures, personal expense tracking, scholarship applications, and educational loan pipelines with role-specific dashboards and supportive AI features.

---

## 🚀 Key Modules & Features

- **Academic Hub**: Handles student and faculty mappings, attendance rosters, semesters, and performance indexes.
- **Dynamic Fee Management**: Custom structures, installment options, payment history, and auto-generated receipts.
- **SaaS Payment Gateway**: Simulates Razorpay transaction flows directly from billing cards.
- **Personal Budget Tracker**: Student-centered expense loggers, categorical limits, and savings trackers.
- **Scholarship & Loan Pipelines**: GPA-matching grants recommendations and co-applicant credit evaluation pipelines.
- **AI Financial Assistant**: Multi-role chatbot advisors and receipt scanners (FastAPI support).
- **Double Theme System**: Seamless transitions between dark and light modes.

---

## 📂 Project Structure

```
EduFin/
├── docs/                 # Architectural specifications and API tables
├── client/               # React 19, Vite, TS, Tailwind, Recharts & Framer Motion
├── server/               # Node.js, Express, Mongoose database models & JWT controllers
└── ai-engine/            # FastAPI, Python & Gemini/LangChain skeletons
```

---

## 🛠️ Getting Started

### 1. Database & Express Server (Backend)
1. Navigate to the backend directory:
   ```bash
   cd server
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Configure your MongoDB connection string in `.env` (a local database check runs by default).
4. Launch the backend API server:
   ```bash
   npm run dev
   ```
   *The server runs on http://localhost:5000 and automatically seeds testing accounts if the collections are empty.*

### 2. Vite Interface (Client)
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Boot up the Vite preview server:
   ```bash
   npm run dev
   ```
   *The UI opens on http://localhost:3000.*

### 3. AI engine (FastAPI)
1. Navigate to the AI directory:
   ```bash
   cd ai-engine
   ```
2. Create and source a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate   # On Windows: venv\Scripts\activate
   ```
3. Install Python requirements:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the engine server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

---

## 🔐 Sandbox Demo Logins

All accounts use the password **`password123`**:

- **Student Workspace**: `student@edufin.edu`
- **Parent Workspace**: `parent@edufin.edu`
- **Faculty Workspace**: `faculty@edufin.edu`
- **Admin Workspace**: `admin@edufin.edu`
- **Super Admin Workspace**: `superadmin@edufin.edu`

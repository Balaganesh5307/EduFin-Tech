import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import {
  User,
  GraduationCap,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Award,
  QrCode,
  Check
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const StudentProfile: React.FC = () => {
  const { user, accessToken } = useAuth();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [academicSummary, setAcademicSummary] = useState<any>(null);
  const [attendancePercent, setAttendancePercent] = useState<number>(88.5);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form upload fields
  const [uploadType, setUploadType] = useState<string>('Aadhaar');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const fetchStudentProfile = async () => {
    setLoading(true);
    try {
      // 1. Fetch student data matching authenticated user
      const sUrl = `/api/students?search=${user?.email}`;
      const sResponse = await fetch(sUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (sResponse.ok) {
        const sData = await sResponse.json();
        const studentInfo = sData.students[0];
        if (studentInfo) {
          setProfileData(studentInfo);

          // 2. Fetch academic CGPA / enrollments details
          const aResponse = await fetch(`/api/academic/progress/${studentInfo._id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (aResponse.ok) {
            setAcademicSummary(await aResponse.json());
          }

          // 3. Fetch attendance stats
          const attResponse = await fetch(`/api/attendance/student/${studentInfo._id}`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (attResponse.ok) {
            const attData = await attResponse.json();
            setAttendancePercent(attData.averagePercentage);
          }
        }
      }
    } catch (err) {
      console.warn('API error retrieving student profile, loading mock dataset...', err);
    }
    
    // Set fallback data if offline or API mock mode is active
    if (!profileData) {
      setProfileData({
        _id: 'mock_stu_123',
        studentId: 'STU-2026-8041',
        rollNumber: '26-CSE-041',
        user: { name: user?.name || 'Alex Johnson', email: user?.email || 'student@edufin.edu', phoneNumber: '+91 98765 43210' },
        department: { name: 'Computer Science', code: 'CSE' },
        course: { name: 'B.Tech CSE', code: 'CSE' },
        currentSemester: { name: 'Semester 5' }
      });

      setAcademicSummary({
        cgpa: 8.7,
        creditsEarned: 76,
        backlogCount: 0,
        gpaHistory: [
          { semester: { name: 'Sem 1' }, gpa: 8.2 },
          { semester: { name: 'Sem 2' }, gpa: 8.5 },
          { semester: { name: 'Sem 3' }, gpa: 8.3 },
          { semester: { name: 'Sem 4' }, gpa: 8.7 }
        ]
      });

      setDocuments([
        { id: '1', documentType: 'Aadhaar', fileUrl: '#', status: 'Verified' },
        { id: '2', documentType: 'PassportPhoto', fileUrl: '#', status: 'Verified' },
        { id: '3', documentType: 'SemesterMarkSheet', fileUrl: '#', status: 'Pending' }
      ]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchStudentProfile();
  }, [user]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('documentType', uploadType);

    try {
      const response = await fetch(`/api/students/${profileData._id}/documents`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        alert('Document uploaded successfully!');
        setDocuments(prev => [result.document, ...prev]);
        setUploadFile(null);
      } else {
        throw new Error();
      }
    } catch (_) {
      // Mock local upload success offline
      const mockDoc = {
        id: 'mock_doc_' + Date.now(),
        documentType: uploadType,
        fileUrl: '#',
        status: 'Pending'
      };
      setDocuments(prev => [mockDoc, ...prev]);
      setUploadFile(null);
      alert('Demo Mock: Document posted to upload queue (Offline mode).');
    } finally {
      setUploading(false);
    }
  };

  if (loading || !profileData) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-[400px] bg-slate-900 rounded-2xl md:col-span-1"></div>
          <div className="h-[400px] bg-slate-900 rounded-2xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  const gpaTrend = academicSummary?.gpaHistory?.map((item: any) => ({
    sem: item.semester?.name || 'N/A',
    gpa: item.gpa
  })) || [];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Student Profile Hub
          <GraduationCap className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">Review your digital ID badge, grades logs, and verify registration papers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: ID CARD BADGE */}
        <div className="md:col-span-5 flex flex-col items-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3 text-center w-full">Digital Campus ID Card</span>
          
          {/* ID Card Shell Container */}
          <div className="glass-panel w-full max-w-[340px] rounded-3xl overflow-hidden shadow-2xl relative border-glow bg-gradient-to-b from-indigo-950/20 via-slate-950/90 to-slate-950 p-6 flex flex-col items-center text-center space-y-5">
            {/* Glossy Header Bar */}
            <div className="w-full flex justify-between items-center border-b border-slate-800/80 pb-3">
              <span className="text-xs font-black tracking-widest text-indigo-400">EDUFIN UNIVERSITY</span>
              <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 px-2.5 py-0.5 rounded-full font-bold uppercase">Member</span>
            </div>

            {/* Photo Avatar */}
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.role}`}
              alt={profileData.user?.name}
              className="h-24 w-24 rounded-2xl object-cover bg-slate-900 border border-slate-800 ring-4 ring-indigo-500/10 shadow-lg"
            />

            {/* Details */}
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-100">{profileData.user?.name}</h3>
              <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block">{profileData.course?.name}</span>
            </div>

            {/* Card Metadata Grid */}
            <div className="w-full bg-slate-900/40 border border-slate-900/60 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left text-[11px] text-slate-400">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Student ID</span>
                <span className="font-semibold text-slate-200">{profileData.studentId}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Roll Number</span>
                <span className="font-semibold text-slate-200">{profileData.rollNumber}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Department</span>
                <span className="font-semibold text-slate-200">{profileData.department?.name}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Current Cycle</span>
                <span className="font-semibold text-slate-200">{profileData.currentSemester?.name}</span>
              </div>
            </div>

            {/* Visual QR Code Vector */}
            <div className="w-full border-t border-slate-800/80 pt-4 flex flex-col items-center gap-2">
              <div className="h-16 w-16 bg-white rounded-xl p-1.5 flex items-center justify-center shadow-md">
                <QrCode className="h-full w-full text-slate-950" />
              </div>
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase">Scan to Verify credentials</span>
            </div>
          </div>
        </div>

        {/* Right Side: Academic Charts & Document Center */}
        <div className="md:col-span-7 space-y-6">
          
          {/* GPA and stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-panel border-slate-900 p-4 rounded-2xl text-left space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Cumulative CGPA</span>
              <h4 className="text-xl font-bold text-slate-100">{academicSummary?.cgpa || 0.0}</h4>
            </div>
            <div className="glass-panel border-slate-900 p-4 rounded-2xl text-left space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Earned Credits</span>
              <h4 className="text-xl font-bold text-slate-100">{academicSummary?.creditsEarned || 0}</h4>
            </div>
            <div className="glass-panel border-slate-900 p-4 rounded-2xl text-left space-y-1">
              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Semester Attendance</span>
              <h4 className="text-xl font-bold text-slate-100">{attendancePercent}%</h4>
            </div>
          </div>

          {/* Academic progress line chart */}
          {gpaTrend.length > 0 && (
            <div className="glass-panel border-slate-900 rounded-2xl p-6 text-left space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> Academic GPA Ledger
              </h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gpaTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="sem" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Verification documents center */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Document Upload queue form */}
            <div className="glass-panel border-slate-900 rounded-2xl p-5 text-left space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Upload className="h-4 w-4 text-indigo-400" /> Upload Verification Papers
              </h4>
              <form onSubmit={handleUploadSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Document Category</label>
                  <select
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Aadhaar">Aadhaar Card (ID)</option>
                    <option value="TransferCertificate">Transfer Certificate</option>
                    <option value="CommunityCertificate">Community Certificate</option>
                    <option value="IncomeCertificate">Income Certificate</option>
                    <option value="BirthCertificate">Birth Certificate</option>
                    <option value="SemesterMarkSheet">Semester Mark Sheets</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Select PDF / Image File</label>
                  <input
                    type="file"
                    required
                    accept=".pdf,image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-40"
                >
                  {uploading ? 'Uploading Paper...' : 'Submit to Queue'}
                </button>
              </form>
            </div>

            {/* Uploaded Documents List */}
            <div className="glass-panel border-slate-900 rounded-2xl p-5 text-left space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" /> Active Verification Status
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {documents.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic py-6 text-center">No documents uploaded yet.</p>
                ) : (
                  documents.map((doc: any) => (
                    <div key={doc.id || doc._id} className="p-2.5 rounded-xl border border-slate-850 bg-slate-950/20 flex justify-between items-center text-[11px]">
                      <div className="overflow-hidden">
                        <span className="font-semibold text-slate-200 block truncate">{doc.documentType}</span>
                        <span className="text-[9px] text-slate-500">File uploaded</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        doc.status === 'Verified'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : doc.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

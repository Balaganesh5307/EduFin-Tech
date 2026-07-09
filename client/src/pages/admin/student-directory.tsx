import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import {
  Users,
  Search,
  SlidersHorizontal,
  Download,
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MoreVertical,
  Activity
} from 'lucide-react';

export const StudentDirectory: React.FC = () => {
  const { accessToken } = useAuth();
  
  // Lists data
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Dropdown options
  const [depts, setDepts] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);

  // Drawer Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [rollNo, setRollNo] = useState<string>('');
  const [deptId, setDeptId] = useState<string>('');
  const [courseId, setCourseId] = useState<string>('');
  const [semId, setSemId] = useState<string>('');
  const [parentName, setParentName] = useState<string>('');
  const [parentEmail, setParentEmail] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [parentRelation, setParentRelation] = useState<string>('Father');

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Fetch Directory & Options
  const fetchDirectory = async () => {
    setLoading(true);
    try {
      const url = `/api/students?page=${page}&limit=8&search=${search}&department=${selectedDept}&status=${selectedStatus}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
        setTotalCount(data.pagination.totalCount);
      }
    } catch (err) {
      console.warn('API error listing directory, loading mock entries...', err);
      // Mock Fallback
      setStudents([
        {
          _id: 'mock_1',
          studentId: 'STU-2026-8041',
          rollNumber: '26-CSE-041',
          user: { name: 'Alex Johnson', email: 'student@edufin.edu', status: 'Active' },
          department: { name: 'Computer Science', code: 'CSE' },
          course: { name: 'B.Tech CSE', code: 'CSE' },
          currentSemester: { name: 'Semester 5' },
          admissionDate: '2026-06-12'
        },
        {
          _id: 'mock_2',
          studentId: 'STU-2026-1029',
          rollNumber: '26-IT-129',
          user: { name: 'Emily Clark', email: 'emily@edufin.edu', status: 'Suspended' },
          department: { name: 'Information Technology', code: 'IT' },
          course: { name: 'B.Tech IT', code: 'IT' },
          currentSemester: { name: 'Semester 3' },
          admissionDate: '2026-06-15'
        }
      ]);
      setTotalCount(2);
    }
    setLoading(false);
  };

  const fetchOptions = async () => {
    try {
      const dRes = await fetch('/api/academic/departments', { headers: { Authorization: `Bearer ${accessToken}` } });
      const cRes = await fetch('/api/academic/courses', { headers: { Authorization: `Bearer ${accessToken}` } });
      const sRes = await fetch('/api/academic/semesters', { headers: { Authorization: `Bearer ${accessToken}` } });
      
      if (dRes.ok) setDepts((await dRes.json()).departments);
      if (cRes.ok) setCourses((await cRes.json()).courses);
      if (sRes.ok) setSemesters((await sRes.json()).semesters);
    } catch (_) {
      // Mock options for offline previews
      setDepts([{ _id: 'cse_id', name: 'Computer Science', code: 'CSE' }]);
      setCourses([{ _id: 'course_cse_id', name: 'B.Tech CSE', code: 'CSE' }]);
      setSemesters([{ _id: 'sem_5_id', name: 'Semester 5' }]);
    }
  };

  useEffect(() => {
    fetchDirectory();
  }, [page, search, selectedDept, selectedStatus]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const openAddDrawer = () => {
    setEditingStudent(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRollNo('');
    setDeptId(depts[0]?._id || '');
    setCourseId(courses[0]?._id || '');
    setSemId(semesters[0]?._id || '');
    setParentName('');
    setParentEmail('');
    setParentPhone('');
    setParentRelation('Father');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (s: any) => {
    setEditingStudent(s);
    setName(s.user.name);
    setEmail(s.user.email);
    setPassword(''); // leave empty
    setPhone(s.user.phoneNumber || '');
    setRollNo(s.rollNumber);
    setDeptId(s.department?._id || '');
    setCourseId(s.course?._id || '');
    setSemId(s.currentSemester?._id || '');
    setParentName(s.parent?.user?.name || '');
    setParentEmail(s.parent?.user?.email || '');
    setParentPhone(s.parent?.user?.phoneNumber || '');
    setParentRelation(s.parent?.relation || 'Father');
    setIsDrawerOpen(true);
  };

  const handleStatusChange = async (studentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const response = await fetch(`/api/students/${studentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.ok) {
        fetchDirectory();
      }
    } catch (_) {
      // Mock update
      setStudents(prev =>
        prev.map(s =>
          s._id === studentId ? { ...s, user: { ...s.user, status: nextStatus } } : s
        )
      );
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/students/export', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'students_directory.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      alert('CSV Export failed.');
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);

    const payload = {
      name,
      email,
      password,
      rollNumber: rollNo,
      department: deptId,
      course: courseId,
      currentSemester: semId,
      phoneNumber: phone,
      parentName,
      parentEmail,
      parentPhone,
      parentRelation
    };

    try {
      let response;
      if (editingStudent) {
        response = await fetch(`/api/students/${editingStudent._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        setIsDrawerOpen(false);
        fetchDirectory();
      } else {
        const errData = await response.json();
        alert(errData.message || 'Transaction failed');
      }
    } catch (_) {
      // Mock creation offline
      const mockNew = {
        _id: editingStudent?._id || 'mock_new_' + Date.now(),
        studentId: editingStudent?.studentId || 'STU-2026-' + Math.floor(1000 + Math.random() * 9000),
        rollNumber: rollNo || '26-CSE-102',
        user: { name, email, status: editingStudent?.user?.status || 'Active' },
        department: depts.find(d => d._id === deptId) || { name: 'Computer Science', code: 'CSE' },
        course: courses.find(c => c._id === courseId) || { name: 'B.Tech CSE', code: 'CSE' },
        currentSemester: semesters.find(s => s._id === semId) || { name: 'Semester 5' },
        admissionDate: new Date().toISOString().split('T')[0]
      };

      if (editingStudent) {
        setStudents(prev => prev.map(s => s._id === editingStudent._id ? mockNew : s));
      } else {
        setStudents(prev => [mockNew, ...prev]);
        setTotalCount(prev => prev + 1);
      }
      setIsDrawerOpen(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
            Student Management Directory
            <Users className="h-5 w-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage enrollments, statuses, emergency contacts, and document checks.</p>
        </div>
        
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button
            onClick={openAddDrawer}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all active:scale-98"
          >
            <Plus className="h-4 w-4" /> Admit Student
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Admissions</span>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">{totalCount} Students</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Attendance Rate</span>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">87.4%</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Flagged / Low Attendance</span>
            <h4 className="text-2xl font-bold text-slate-100 mt-1">4 Accounts</h4>
          </div>
          <div className="h-10 w-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-panel border-slate-900 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student registration ID or roll number..."
            className="w-full bg-slate-900/60 border border-slate-900 rounded-xl px-4 py-3 pl-11 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-900 px-3.5 py-2.5 rounded-xl text-xs text-slate-400">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-900 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="">All Departments</option>
            {depts.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Directory Grid Table */}
      <div className="glass-panel border-slate-900 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-xs text-slate-500 animate-pulse">Retrieving campus registries...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
            <span className="text-4xl">📁</span>
            <h4 className="text-base font-bold text-slate-200">No Student Records Found</h4>
            <p className="text-xs text-slate-500">Try modifying your filters or submit a new admission form.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-900 text-slate-400">
                  <th className="p-4 font-bold uppercase tracking-wider">Student ID</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Name</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Department</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Semester</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Admission Date</th>
                  <th className="p-4 font-bold uppercase tracking-wider">Status</th>
                  <th className="p-4 font-bold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="p-4 font-bold text-slate-200">
                      <div>{s.studentId}</div>
                      <span className="text-[10px] text-slate-500 font-normal">Roll: {s.rollNumber}</span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{s.user?.name}</div>
                      <span className="text-[10px] text-slate-500">{s.user?.email}</span>
                    </td>
                    <td className="p-4 text-slate-300">
                      <div>{s.department?.name}</div>
                      <span className="text-[10px] text-slate-500 uppercase">{s.course?.code}</span>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{s.currentSemester?.name || 'N/A'}</td>
                    <td className="p-4 text-slate-500">{s.admissionDate?.split('T')[0]}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        s.user?.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {s.user?.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditDrawer(s)}
                          className="p-2 border border-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                          title="Edit Student Info"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(s._id, s.user?.status)}
                          className={`p-2 border rounded-lg transition-colors ${
                            s.user?.status === 'Active'
                              ? 'border-rose-500/10 text-rose-400 hover:bg-rose-500/15'
                              : 'border-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15'
                          }`}
                          title={s.user?.status === 'Active' ? 'Suspend Account' : 'Restore Account'}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {totalCount > 8 && (
        <div className="flex justify-between items-center text-xs text-slate-500 pt-2">
          <span>Showing 8 of {totalCount} records</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 bg-slate-900 rounded-lg border border-slate-900 hover:bg-slate-800 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={students.length < 8}
              className="px-3.5 py-2 bg-slate-900 rounded-lg border border-slate-900 hover:bg-slate-800 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Slide-out Drawer Form Panel */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs" onClick={() => setIsDrawerOpen(false)}></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col h-full overflow-y-auto animate-slide-in">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="absolute top-5 right-5 text-slate-400 p-1.5 hover:bg-slate-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-6 border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                {editingStudent ? 'Edit Student Details' : 'Student Admission Form'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {editingStudent ? 'Update fields to save changes to database records.' : 'Admit a new student to a department and generate credential files.'}
              </p>
            </div>

            <form onSubmit={submitForm} className="space-y-5 flex-1 flex flex-col">
              
              {/* Primary User Details */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Personal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Student Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Johnson"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@campus.edu"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  {!editingStudent && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Password</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Academic Allotments */}
              <div className="space-y-3.5 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Academic Allocations</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Department</label>
                    <select
                      value={deptId}
                      onChange={(e) => setDeptId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                    >
                      {depts.map(d => (
                        <option key={d._id} value={d._id}>{d.code}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Course</label>
                    <select
                      value={courseId}
                      onChange={(e) => setCourseId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                    >
                      {courses.map(c => (
                        <option key={c._id} value={c._id}>{c.code}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Semester</label>
                    <select
                      value={semId}
                      onChange={(e) => setSemId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                    >
                      {semesters.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Roll Number (Optional)</label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="Auto-generated if blank"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Parent Info */}
              <div className="space-y-3.5 border-t border-slate-800 pt-4">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Parent / Guardian details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Parent Name</label>
                    <input
                      type="text"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Robert Johnson"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Relationship</label>
                    <select
                      value={parentRelation}
                      onChange={(e) => setParentRelation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Parent Email</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      placeholder="parent@edufin.edu"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Parent Phone</label>
                    <input
                      type="text"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+91 99999 88888"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-auto pt-6 border-t border-slate-800 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-1/2 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold px-4 py-3 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-3 rounded-xl text-xs shadow-md active:scale-98 transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Posting Records...' : editingStudent ? 'Save Changes' : 'Confirm Admission'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

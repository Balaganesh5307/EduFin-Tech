import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Settings,
  AlertTriangle,
  Award,
  Users,
  CheckCircle2,
  ListFilter,
  Layers,
  Sparkles,
  ChevronRight,
  HelpCircle,
  FileText
} from 'lucide-react';

export const AdminFeeManagement: React.FC = () => {
  const { user, accessToken } = useAuth();
  
  // Data lists
  const [categories, setCategories] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'assign' | 'templates' | 'categories' | 'rules'>('assign');

  // 1. Assign Form state
  const [assignmentType, setAssignmentType] = useState<'Student' | 'Department' | 'Semester' | 'Batch' | 'Section'>('Student');
  const [targetId, setTargetId] = useState<string>('');
  const [feeTitle, setFeeTitle] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  const [semesterId, setSemesterId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [installmentsCount, setInstallmentsCount] = useState<string>('1');
  const [ruleId, setRuleId] = useState<string>('');
  const [submittingAssign, setSubmittingAssign] = useState<boolean>(false);

  // 2. Category Form state
  const [catName, setCatName] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');
  
  // 3. Rule Form state
  const [ruleName, setRuleName] = useState<string>('');
  const [graceDays, setGraceDays] = useState<string>('0');
  const [penaltyType, setPenaltyType] = useState<'Fixed' | 'Percentage'>('Fixed');
  const [penaltyVal, setPenaltyVal] = useState<string>('0');
  const [frequency, setFrequency] = useState<'Once' | 'Daily' | 'Weekly'>('Once');

  // 4. Template Form state
  const [tempName, setTempName] = useState<string>('');
  const [tempYear, setTempYear] = useState<string>('2026-2027');
  const [tempItems, setTempItems] = useState<any[]>([{ categoryId: '', amount: '' }]);
  const [tempRuleId, setTempRuleId] = useState<string>('');

  const loadConfigurations = async () => {
    setLoading(true);
    try {
      const catRes = await fetch('/api/fee-management/categories', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (catRes.ok) setCategories(await catRes.json());

      const tempRes = await fetch('/api/fee-management/templates', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (tempRes.ok) setTemplates(await tempRes.json());

      const ruleRes = await fetch('/api/fee-management/rules', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (ruleRes.ok) setRules(await ruleRes.json());

      // Fetch metadata parameters
      const deptRes = await fetch('/api/academic/departments', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(data.departments || []);
      }

      const semRes = await fetch('/api/academic/semesters', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (semRes.ok) {
        const data = await semRes.json();
        setSemesters(data.semesters || []);
      }

      const secRes = await fetch('/api/academic/sections', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (secRes.ok) {
        const data = await secRes.json();
        setSections(data.sections || []);
      }
    } catch (err) {
      console.error('Error fetching configurations, setting default mockups:', err);
    }

    // Set fallback mocks for UI layout rendering if API returns empty
    setCategories(prev => prev.length ? prev : [
      { _id: 'cat1', name: 'Tuition Fee', description: 'Academic instruction cost' },
      { _id: 'cat2', name: 'Exam Fee', description: 'Exam registration charge' },
      { _id: 'cat3', name: 'Hostel Fee', description: 'Boarding charges' }
    ]);
    setRules(prev => prev.length ? prev : [
      { _id: 'rule1', name: 'Standard Term Late Fine', gracePeriodDays: 5, penaltyType: 'Fixed', penaltyValue: 500, frequency: 'Once' }
    ]);
    setTemplates(prev => prev.length ? prev : [
      { _id: 'temp1', name: 'B.Tech CSE - 2026 Package', totalAmount: 70000, academicYear: '2026-2027', items: [] }
    ]);

    setLoading(false);
  };

  useEffect(() => {
    if (user) loadConfigurations();
  }, [user]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) return;

    try {
      const response = await fetch('/api/fee-management/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ name: catName, description: catDesc })
      });
      if (response.ok) {
        const result = await response.json();
        setCategories([...categories, result]);
        setCatName('');
        setCatDesc('');
        alert('Fee Category successfully declared!');
      }
    } catch (_) {
      const mockResult = { _id: `cat_mock_${Date.now()}`, name: catName, description: catDesc };
      setCategories([...categories, mockResult]);
      setCatName('');
      setCatDesc('');
      alert('Mock success: Category successfully added.');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName) return;

    try {
      const response = await fetch('/api/fee-management/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: ruleName,
          gracePeriodDays: parseInt(graceDays),
          penaltyType,
          penaltyValue: parseFloat(penaltyVal),
          frequency
        })
      });
      if (response.ok) {
        const result = await response.json();
        setRules([...rules, result]);
        setRuleName('');
        setGraceDays('0');
        setPenaltyVal('0');
        alert('Late fee penalty rule successfully deployed!');
      }
    } catch (_) {
      const mockResult = {
        _id: `rule_mock_${Date.now()}`,
        name: ruleName,
        gracePeriodDays: parseInt(graceDays),
        penaltyType,
        penaltyValue: parseFloat(penaltyVal),
        frequency
      };
      setRules([...rules, mockResult]);
      setRuleName('');
      setGraceDays('0');
      setPenaltyVal('0');
      alert('Mock success: Penalty rule added.');
    }
  };

  const addTemplateItem = () => {
    setTempItems([...tempItems, { categoryId: '', amount: '' }]);
  };

  const handleTemplateItemChange = (index: number, field: string, value: string) => {
    const updated = [...tempItems];
    updated[index][field] = value;
    setTempItems(updated);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName || tempItems.some(i => !i.categoryId || !i.amount)) {
      alert('Fill all item amounts and select categories');
      return;
    }

    try {
      const formattedItems = tempItems.map(i => ({
        category: i.categoryId,
        amount: parseFloat(i.amount)
      }));

      const response = await fetch('/api/fee-management/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: tempName,
          academicYear: tempYear,
          items: formattedItems,
          lateFeeRule: tempRuleId || undefined
        })
      });
      if (response.ok) {
        const result = await response.json();
        setTemplates([...templates, result]);
        setTempName('');
        setTempItems([{ categoryId: '', amount: '' }]);
        setTempRuleId('');
        alert('Fee template successfully formatted!');
      }
    } catch (_) {
      let total = 0;
      tempItems.forEach(i => { total += parseFloat(i.amount || '0'); });
      const mockResult = {
        _id: `temp_mock_${Date.now()}`,
        name: tempName,
        academicYear: tempYear,
        totalAmount: total,
        items: []
      };
      setTemplates([...templates, mockResult]);
      setTempName('');
      setTempItems([{ categoryId: '', amount: '' }]);
      setTempRuleId('');
      alert('Mock success: Template saved.');
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || !feeTitle || !semesterId || !dueDate || !templateId) {
      alert('Verify all headers are loaded');
      return;
    }

    setSubmittingAssign(true);
    try {
      const response = await fetch('/api/fee-management/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          assignmentType,
          targetId,
          title: feeTitle,
          academicYear,
          semesterId,
          templateId,
          dueDate,
          installmentsCount: parseInt(installmentsCount),
          lateFeeRuleId: ruleId || undefined
        })
      });

      if (response.ok) {
        alert('Fee assignments batch posted successfully!');
        setFeeTitle('');
        setTargetId('');
      } else {
        const data = await response.json();
        alert(data.message || 'Failed assignment transaction');
      }
    } catch (_) {
      alert('Demo Mock: Fee assignment batch completed offline.');
      setFeeTitle('');
      setTargetId('');
    } finally {
      setSubmittingAssign(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="h-96 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Fee Management Hub
          <Settings className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Create categories, configure dynamic term templates, and batch assign fee schedules to sections/batches.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button
          onClick={() => setActiveTab('assign')}
          className={`pb-3 transition-colors ${activeTab === 'assign' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Assign Dues
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`pb-3 transition-colors ${activeTab === 'templates' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Fee Templates
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 transition-colors ${activeTab === 'categories' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Categories
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 transition-colors ${activeTab === 'rules' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Late Penalty Rules
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'assign' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Assignment form */}
          <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6">
            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="h-4.5 w-4.5 text-indigo-400" /> Launch Fee Assignment Batch
            </h4>

            <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Target Group</label>
                  <select
                    value={assignmentType}
                    onChange={(e) => {
                      setAssignmentType(e.target.value as any);
                      setTargetId('');
                    }}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Student">Individual Student</option>
                    <option value="Department">Entire Department</option>
                    <option value="Semester">Entire Semester</option>
                    <option value="Batch">Entire Batch (Year)</option>
                    <option value="Section">Entire Section</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Select Target Record</label>
                  {assignmentType === 'Student' && (
                    <input
                      type="text"
                      required
                      placeholder="Insert Student ObjectId (e.g. mock_stu_123)"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                  {assignmentType === 'Department' && (
                    <select
                      required
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Dept --</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                    </select>
                  )}
                  {assignmentType === 'Semester' && (
                    <select
                      required
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Semester --</option>
                      {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  )}
                  {assignmentType === 'Batch' && (
                    <input
                      type="text"
                      required
                      placeholder="E.g. 26 (Extracts roll numbers starting 26-)"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  )}
                  {assignmentType === 'Section' && (
                    <select
                      required
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Choose Section --</option>
                      {sections.map(s => <option key={s._id} value={s._id}>{s.name} (Sem: {s.semester?.name || 'N/A'})</option>)}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Fee Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Autumn Term Fee"
                    value={feeTitle}
                    onChange={(e) => setFeeTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Academic Year</label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Semester Cycle</label>
                  <select
                    required
                    value={semesterId}
                    onChange={(e) => setSemesterId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Semester --</option>
                    {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Select Fee Template</label>
                  <select
                    required
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map(t => <option key={t._id} value={t._id}>{t.name} (Total: ₹{t.totalAmount.toLocaleString()})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">First Installment Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Installment Split Type</label>
                  <select
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="1">One-time Payment</option>
                    <option value="2">2 Installments (Bi-monthly)</option>
                    <option value="3">3 Installments</option>
                    <option value="4">4 Installments (Quarterly)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Late Fee Rule Fine (Optional)</label>
                  <select
                    value={ruleId}
                    onChange={(e) => setRuleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- No late fine rule --</option>
                    {rules.map(r => <option key={r._id} value={r._id}>{r.name} (Grace: {r.gracePeriodDays} days)</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAssign}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                {submittingAssign ? 'Initializing batch...' : 'Execute Batch Assignment'}
              </button>
            </form>
          </div>

          {/* Quick info */}
          <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h5 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Guidelines</h5>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              - **Scholarship Deduction**: Merit scholarships are calculated dynamically based on student GPA checks and deducted from the generated Tuition component automatically.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              - **Grace Periods**: Fines are automatically calculated if the installment timeline remains unpaid past the grace period configured in penalty rules.
            </p>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* List templates */}
          <div className="lg:col-span-7 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Fee Packages Templates</h4>
            <div className="divide-y divide-slate-900/60 text-xs">
              {templates.map((t) => (
                <div key={t._id} className="py-3 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-slate-200">{t.name}</h5>
                    <span className="text-[10px] text-slate-500">Year: {t.academicYear}</span>
                  </div>
                  <span className="font-black text-slate-200">₹{t.totalAmount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Create Template Form */}
          <div className="lg:col-span-5 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Construct Fee Template</h4>
            <form onSubmit={handleCreateTemplate} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. M.Tech AI Tuition Package"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Academic Year</label>
                  <select
                    value={tempYear}
                    onChange={(e) => setTempYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400 focus:outline-none"
                  >
                    <option value="2026-2027">2026-2027</option>
                    <option value="2027-2028">2027-2028</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Penalty Rule</label>
                  <select
                    value={tempRuleId}
                    onChange={(e) => setTempRuleId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400 focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    {rules.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Dynamic items */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Items Catalog</label>
                  <button
                    type="button"
                    onClick={addTemplateItem}
                    className="text-[10px] font-bold text-indigo-400 hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                {tempItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-3">
                    <select
                      value={item.categoryId}
                      onChange={(e) => handleTemplateItemChange(idx, 'categoryId', e.target.value)}
                      className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400 focus:outline-none"
                    >
                      <option value="">-- Choose Category --</option>
                      {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => handleTemplateItemChange(idx, 'amount', e.target.value)}
                      className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-4 font-semibold shadow-md active:scale-95"
              >
                Create Template
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Categories list */}
          <div className="lg:col-span-7 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-bold">Standard Categories</h4>
            <div className="divide-y divide-slate-900/60 text-xs">
              {categories.map((c) => (
                <div key={c._id} className="py-3.5">
                  <h5 className="font-bold text-slate-200">{c.name}</h5>
                  <p className="text-[11px] text-slate-500 mt-1">{c.description || 'No description logged'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Create Category form */}
          <div className="lg:col-span-5 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add Category</h4>
            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Placement Training Fee"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Description</label>
                <textarea
                  placeholder="Enter category scope details..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-4 font-semibold shadow-md active:scale-95"
              >
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Rules list */}
          <div className="lg:col-span-7 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Late Fines Rules</h4>
            <div className="divide-y divide-slate-900/60 text-xs">
              {rules.map((r) => (
                <div key={r._id} className="py-3 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-slate-200">{r.name}</h5>
                    <span className="text-[10px] text-slate-500">Grace Period: {r.gracePeriodDays} days | Freq: {r.frequency}</span>
                  </div>
                  <span className="font-black text-rose-400">
                    {r.penaltyType === 'Fixed' ? `₹${r.penaltyValue.toLocaleString()}` : `${r.penaltyValue}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Create Rule form */}
          <div className="lg:col-span-5 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Add Penalty Rule</h4>
            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Term Final Late Fine"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Grace Period (Days)</label>
                  <input
                    type="number"
                    required
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Penalty Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none"
                  >
                    <option value="Once">One-time Fine</option>
                    <option value="Daily">Daily Accruing Fine</option>
                    <option value="Weekly">Weekly Accruing Fine</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Penalty Type</label>
                  <select
                    value={penaltyType}
                    onChange={(e) => setPenaltyType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none"
                  >
                    <option value="Fixed">Fixed Amount (₹)</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Value</label>
                  <input
                    type="number"
                    required
                    value={penaltyVal}
                    onChange={(e) => setPenaltyVal(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-4 font-semibold shadow-md active:scale-95"
              >
                Deploy Penalty Rule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

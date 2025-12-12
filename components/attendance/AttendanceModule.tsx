import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Download, Filter, Search, CheckCircle2, XCircle, ArrowRightLeft, Loader2 } from 'lucide-react';
import { AttendanceRecord, Employee } from '../../shared/types';
import { attendanceService } from '../../shared/services/attendanceService';
import { employeeService } from '../../shared/services/employeeService';

const todayISO = new Date().toISOString().slice(0, 10);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const computeHours = (rec: AttendanceRecord) => {
  if (!rec.checkOut || !rec.checkIn) return 0;
  const start = new Date(rec.checkIn).getTime();
  const end = new Date(rec.checkOut).getTime();
  return Math.max(0, (end - start) / (1000 * 60 * 60));
};

const AttendanceModule: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(todayISO);
  const [toDate, setToDate] = useState(todayISO);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const emps = await employeeService.getAllEmployees();
        const activeOnly = emps.filter(e => (e.employmentStatus || 'active') === 'active');
        setEmployees(activeOnly);
        setSelectedEmployee(activeOnly[0] ?? null);
      } catch (err) {
        console.error('Failed to load employees', err);
        setError('Unable to load employees.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!selectedEmployee) return;
      setLoading(true);
      try {
        const data = await attendanceService.getByUserAndRange(selectedEmployee.id, fromDate, toDate);
        setRecords(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load attendance', err);
        setError('Unable to load attendance records.');
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [selectedEmployee, fromDate, toDate]);

  const handleCheck = async (present: boolean) => {
    if (!selectedEmployee) return;
    setSaving(true);
    setError(null);
    try {
      const existing = records.find(r => r.userId === selectedEmployee.id && r.date === todayISO);
      const nowIso = new Date().toISOString();
      const record: Omit<AttendanceRecord, "id" | "createdAt" | "updatedAt"> & { id?: string } = existing ? {
        ...existing,
        checkOut: present ? nowIso : existing.checkOut,
        status: present ? 'present' : 'absent',
        userId: selectedEmployee.id,
        date: todayISO,
        totalHours: present ? computeHours({ ...existing, checkOut: nowIso }) : existing.totalHours
      } : {
        userId: selectedEmployee.id,
        date: todayISO,
        checkIn: present ? nowIso : undefined,
        status: present ? 'present' : 'absent',
        totalHours: 0
      };
      const id = await attendanceService.upsert(record);
      const updated = { ...record, id };
      setRecords(prev => {
        const idx = prev.findIndex(r => r.id === id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated as AttendanceRecord;
          return copy;
        }
        return [updated as AttendanceRecord, ...prev];
      });
    } catch (err) {
      console.error('Failed to record attendance', err);
      setError('Unable to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return records.filter(rec => {
      const inRange = rec.date >= fromDate && rec.date <= toDate;
      const matches = rec.userId.toLowerCase().includes(search.toLowerCase());
      return inRange && matches;
    });
  }, [records, fromDate, toDate, search]);

  const summary = useMemo(() => {
    const totalPresent = filtered.filter(r => r.status === 'present').length;
    const totalAbsent = filtered.filter(r => r.status === 'absent').length;
    const totalHalf = filtered.filter(r => r.status === 'half-day').length;
    const totalHours = filtered.reduce((sum, r) => sum + computeHours(r), 0);
    return { totalPresent, totalAbsent, totalHalf, totalHours };
  }, [filtered]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
          <p className="text-sm text-slate-500 mt-1">Check-in/out, filters, and quick summaries.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500 font-semibold">Present</div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2"><CheckCircle2 size={18} className="text-emerald-500" /> {summary.totalPresent}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500 font-semibold">Absent</div>
          <div className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2"><XCircle size={18} className="text-red-500" /> {summary.totalAbsent}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500 font-semibold">Half Day</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.totalHalf}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500 font-semibold">Total Hours</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{summary.totalHours.toFixed(1)}h</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Daily Records</h3>
              <p className="text-xs text-slate-500">Date range and quick search by Employee ID.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              <span className="text-slate-400">to</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee ID..."
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 flex flex-wrap gap-2 items-center">
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={() => handleCheck(true)}
            disabled={saving || !selectedEmployee}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />} Check-in/Out
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60"
            onClick={() => handleCheck(false)}
            disabled={saving || !selectedEmployee}
          >
            <ArrowRightLeft size={16} /> Mark Absent
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Employee ID</th>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Check-in</th>
                <th className="px-4 py-3 text-left font-semibold">Check-out</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Loading records...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">No records for this range.</td></tr>
                ) : (
                filtered.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-semibold text-slate-800">{rec.userId}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(rec.date)}</td>
                    <td className="px-4 py-3 text-slate-700">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        rec.status === 'present'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : rec.status === 'half-day'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800">{computeHours(rec).toFixed(1)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600 flex items-center gap-2">
            <span>Employee</span>
            <select
              value={selectedEmployee?.id || ''}
              onChange={(e) => {
                const emp = employees.find(emp => emp.id === e.target.value) || null;
                setSelectedEmployee(emp);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.basicDetails?.firstName || emp.firstName} {emp.basicDetails?.lastName || emp.lastName}</option>
              ))}
            </select>
          </label>
          {loading && <Loader2 className="animate-spin text-slate-400" size={16} />}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
  );
};

export default AttendanceModule;

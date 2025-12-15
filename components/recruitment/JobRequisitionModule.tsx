import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Filter, Plus, RefreshCw, Search, FileText, Building2, Users, Briefcase, MapPin } from 'lucide-react';
import Button from '../shared/ui/Button';
import { JobRequisition, RequisitionApprovalStep, RequisitionAuditEntry, SalaryBand, ApprovalStatus, User } from '../../shared/types';
import { requisitionService } from '../../shared/services/requisitionService';

type Props = {
  currentUser: User;
};

const statusBadge = (status: JobRequisition['status']) => {
  const map: Record<JobRequisition['status'], string> = {
    draft: 'bg-slate-100 text-slate-700 border border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border border-amber-100',
    approved: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    changes_requested: 'bg-blue-50 text-blue-700 border border-blue-100',
    rejected: 'bg-red-50 text-red-700 border border-red-100',
    closed: 'bg-slate-100 text-slate-700 border border-slate-200'
  };
  return map[status];
};

const defaultApprovals: RequisitionApprovalStep[] = [
  { role: 'Department Head', status: 'pending' },
  { role: 'HR', status: 'pending' },
  { role: 'Management', status: 'pending' }
];

const JobRequisitionModule: React.FC<Props> = ({ currentUser }) => {
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [selected, setSelected] = useState<JobRequisition | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<{
    title: string;
    department: string;
    location: string;
    employmentType: string;
    grade: string;
    openings: number;
    salaryRange: SalaryBand;
    justification: string;
    costCenter: string;
    hiringManager: string;
    targetStartDate: string;
  }>({
    title: '',
    department: '',
    location: '',
    employmentType: 'Full-time',
    grade: '',
    openings: 1,
    salaryRange: { min: 0, max: 0, currency: 'AED' },
    justification: '',
    costCenter: '',
    hiringManager: '',
    targetStartDate: ''
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await requisitionService.getAll();
        setRequisitions(data);
        setSelected(data[0] ?? null);
      } catch (err) {
        console.error('Failed to load requisitions', err);
        setError('Unable to load requisitions.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return requisitions.filter(r =>
      r.title.toLowerCase().includes(term) ||
      r.department.toLowerCase().includes(term) ||
      (r.location || '').toLowerCase().includes(term)
    );
  }, [requisitions, search]);

  const counts = useMemo(() => {
    const total = requisitions.length;
    const pending = requisitions.filter(r => r.status === 'pending').length;
    const approved = requisitions.filter(r => r.status === 'approved').length;
    const openHeadcount = requisitions.reduce((sum, r) => sum + (r.openings || 0), 0);
    return { total, pending, approved, openHeadcount };
  }, [requisitions]);

  const addAudit = (action: string, details?: string): RequisitionAuditEntry => ({
    action,
    by: currentUser.id,
    byName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
    at: new Date(),
    details
  });

  const handleCreate = async () => {
    if (!form.title || !form.department || !form.location) {
      setError('Title, department, and location are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const req: Omit<JobRequisition, "id" | "createdAt" | "updatedAt"> = {
      title: form.title,
      department: form.department,
      location: form.location,
      employmentType: form.employmentType,
      grade: form.grade,
      openings: form.openings,
      salaryRange: form.salaryRange,
      justification: form.justification,
      costCenter: form.costCenter,
      hiringManager: form.hiringManager,
      targetStartDate: form.targetStartDate,
      status: 'pending',
      approvals: defaultApprovals,
      timeline: [addAudit('Created requisition', form.justification)],
      createdBy: currentUser.id,
      createdByName: `${currentUser.firstName} ${currentUser.lastName}`.trim()
    };
    try {
      const created = await requisitionService.create(req);
      setRequisitions(prev => [created, ...prev]);
      setSelected(created);
      setIsModalOpen(false);
      setForm({
        title: '',
        department: '',
        location: '',
        employmentType: 'Full-time',
        grade: '',
        openings: 1,
        salaryRange: { min: 0, max: 0, currency: 'AED' },
        justification: '',
        costCenter: '',
        hiringManager: '',
        targetStartDate: ''
      });
    } catch (err) {
      console.error('Failed to create requisition', err);
      setError('Unable to create requisition.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (status: ApprovalStatus, comment?: string) => {
    if (!selected) return;
    setSaving(true);
    setError(null);

    const firstPendingIdx = selected.approvals.findIndex(a => a.status === 'pending');

    // Advance the first pending approval step
    const approvals = selected.approvals.map((step, idx) => {
      if (idx === firstPendingIdx && step.status === 'pending') {
        return {
          ...step,
          status,
          comment,
          updatedAt: new Date(),
          userId: currentUser.id,
          name: currentUser.firstName
        };
      }
      return step;
    });

    // Overall requisition status logic
    let nextStatus: JobRequisition['status'] = selected.status;
    if (status === 'approved') {
      const stillPending = approvals.some(a => a.status === 'pending');
      nextStatus = stillPending ? 'pending' : 'approved';
    } else if (status === 'rejected') {
      nextStatus = 'rejected';
    } else {
      nextStatus = 'changes_requested';
    }

    const timeline = [...selected.timeline, addAudit(`Approval: ${status}`, comment)];
    const updated: JobRequisition = { ...selected, approvals, timeline, status: nextStatus };

    try {
      await requisitionService.update(selected.id, { approvals, timeline, status: nextStatus });
      setRequisitions(prev => prev.map(r => r.id === selected.id ? updated : r));
      setSelected(updated);
    } catch (err) {
      console.error('Failed to update requisition', err);
      setError('Unable to update requisition.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Requisitions & Approvals</h1>
          <p className="text-sm text-slate-500">Create, approve, and track requisitions with audit trail.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-blue-500/20">
            <Plus size={16} className="mr-2" /> New Requisition
          </Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            <RefreshCw size={16} className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard label="Total Reqs" value={counts.total} icon={<FileText size={18} />} />
        <SummaryCard label="Pending Approval" value={counts.pending} icon={<Clock3 size={18} />} />
        <SummaryCard label="Approved" value={counts.approved} icon={<CheckCircle2 size={18} />} />
        <SummaryCard label="Open Headcount" value={counts.openHeadcount} icon={<Users size={18} />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Requisition List</h3>
              <p className="text-xs text-slate-500">Search by title, department, or location.</p>
            </div>
          </div>
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requisitions..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-full focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Location</th>
                <th className="px-4 py-3 text-left font-semibold">Openings</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">No requisitions found.</td></tr>
              ) : (
                filtered.map(req => (
                  <tr
                    key={req.id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${selected?.id === req.id ? 'bg-blue-50/40' : ''}`}
                    onClick={() => setSelected(req)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{req.title}</div>
                      <div className="text-[11px] text-slate-500">Created by {req.createdByName || req.createdBy}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{req.department}</td>
                    <td className="px-4 py-3 text-slate-700">{req.location}</td>
                    <td className="px-4 py-3 text-slate-700">{req.openings}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">Requisition Detail</p>
                <h3 className="text-lg font-semibold text-slate-800">{selected.title}</h3>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(selected.status)}`}>
                {selected.status.replace('_', ' ')}
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoRow label="Department" value={selected.department} />
                <InfoRow label="Location" value={selected.location} />
                <InfoRow label="Employment Type" value={selected.employmentType} />
                <InfoRow label="Grade" value={selected.grade || '-'} />
                <InfoRow label="Headcount" value={selected.openings.toString()} />
                <InfoRow label="Cost Center" value={selected.costCenter || '-'} />
                <InfoRow label="Hiring Manager" value={selected.hiringManager || '-'} />
                <InfoRow label="Target Start Date" value={selected.targetStartDate || '-'} />
                <InfoRow label="Salary Range" value={selected.salaryRange ? `${selected.salaryRange.currency} ${selected.salaryRange.min} - ${selected.salaryRange.max}` : '-'} />
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-semibold text-slate-600 uppercase">Justification</div>
                <p className="text-sm text-slate-700 mt-1">{selected.justification || '—'}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Approvals</h4>
                <div className="space-y-2">
                  {selected.approvals.map((step, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                      <div>
                        <div className="font-semibold text-slate-800">{step.role}</div>
                        <div className="text-xs text-slate-500">Status: {step.status}</div>
                        {step.comment && <div className="text-xs text-slate-500">Comment: {step.comment}</div>}
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(step.status === 'approved' ? 'approved' : step.status === 'pending' ? 'pending' : 'changes_requested')}`}>
                        {step.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 mb-2">Audit Trail</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[...selected.timeline].sort((a, b) => (new Date(b.at).getTime() - new Date(a.at).getTime())).map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <Clock3 size={14} className="text-slate-400 mt-1" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">{log.action}</div>
                        <div className="text-xs text-slate-500">{log.byName || log.by} • {new Date(log.at).toLocaleString()}</div>
                        {log.details && <div className="text-xs text-slate-600 mt-1">{log.details}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">Actions</h3>
            <p className="text-sm text-slate-600">Approve/reject and keep the trail clean.</p>
            <div className="flex flex-col gap-2">
              <Button variant="primary" disabled={saving} onClick={() => updateStatus('approved')}>
                Approve
              </Button>
              <Button variant="outline" disabled={saving} onClick={() => updateStatus('changes_requested', 'Changes requested')}>
                Request Changes
              </Button>
              <Button variant="danger" disabled={saving} onClick={() => updateStatus('rejected', 'Rejected')}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">New Requisition</p>
                <h3 className="text-xl font-bold text-slate-900">Create Job Requisition</h3>
                <p className="text-sm text-slate-500 mt-1">Fill the basics to kick off approvals.</p>
              </div>
              <button
                className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Title" value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} required />
                <Field label="Department" value={form.department} onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))} required />
                <Field label="Location" value={form.location} onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))} required />
                <Select label="Employment Type" value={form.employmentType} onChange={(e) => setForm(prev => ({ ...prev, employmentType: e.target.value }))} options={['Full-time','Part-time','Contract','Intern']} />
                <Field label="Grade/Level" value={form.grade} onChange={(e) => setForm(prev => ({ ...prev, grade: e.target.value }))} />
                <Field label="Hiring Manager" value={form.hiringManager} onChange={(e) => setForm(prev => ({ ...prev, hiringManager: e.target.value }))} />
                <Field label="Cost Center" value={form.costCenter} onChange={(e) => setForm(prev => ({ ...prev, costCenter: e.target.value }))} />
                <Field label="Target Start Date" type="date" value={form.targetStartDate} onChange={(e) => setForm(prev => ({ ...prev, targetStartDate: e.target.value }))} />
                <Field label="Openings" type="number" value={form.openings.toString()} onChange={(e) => setForm(prev => ({ ...prev, openings: Number(e.target.value) || 1 }))} />
                <Field label="Salary Min" type="number" value={form.salaryRange.min.toString()} onChange={(e) => setForm(prev => ({ ...prev, salaryRange: { ...prev.salaryRange, min: Number(e.target.value) || 0 } }))} />
                <Field label="Salary Max" type="number" value={form.salaryRange.max.toString()} onChange={(e) => setForm(prev => ({ ...prev, salaryRange: { ...prev.salaryRange, max: Number(e.target.value) || 0 } }))} />
                <Field label="Currency" value={form.salaryRange.currency} onChange={(e) => setForm(prev => ({ ...prev, salaryRange: { ...prev.salaryRange, currency: e.target.value } }))} />
              </div>
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                <span className="font-semibold">Justification / Business Need</span>
                <textarea
                  value={form.justification}
                  onChange={(e) => setForm(prev => ({ ...prev, justification: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                  rows={4}
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} type="button">Cancel</Button>
              <Button onClick={handleCreate} isLoading={saving}>Create & Submit</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; required?: boolean; }> = ({ label, value, onChange, type = 'text', required }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-700">
    <span className="font-semibold">{label}{required ? ' *' : ''}</span>
    <input value={value} onChange={onChange} type={type} required={required} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
  </label>
);

const Select: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; }> = ({ label, value, onChange, options }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-700">
    <span className="font-semibold">{label}</span>
    <select value={value} onChange={onChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </label>
);

const InfoRow: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</span>
    <span className="text-slate-800 font-semibold">{value}</span>
  </div>
);

const SummaryCard: React.FC<{ label: string; value: number; icon: React.ReactNode; }> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="text-blue-600">{icon}</span>
      <span>{label}</span>
    </div>
    <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
  </div>
);

export default JobRequisitionModule;

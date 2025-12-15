import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Plus, Search, User, Briefcase, FileText, Clock3, CheckCircle2, AlertTriangle, Upload, Link2, Hash } from 'lucide-react';
import Button from '../shared/ui/Button';
import { BackgroundCheck, BackgroundStatus, JobPosting, JobRequisition, Offer, JobApplication } from '../../shared/types';
import { backgroundService } from '../../shared/services/backgroundService';
import { jobPostingService } from '../../shared/services/jobPostingService';
import { requisitionService } from '../../shared/services/requisitionService';
import { offerService } from '../../shared/services/offerService';
import { onboardingService } from '../../shared/services/onboardingService';

const STATUSES: BackgroundStatus[] = ['Initiated', 'In progress', 'Completed', 'Flagged', 'Cleared', 'Rejected'];

type FormState = {
  candidate: string;
  candidateEmail: string;
  jobTitle: string;
  postingId: string;
  requisitionId: string;
  offerId: string;
  applicationId: string;
  packageType: string;
  vendor: string;
  consentVersion: string;
  consentAt: string;
  notes: string;
};

const defaultForm: FormState = {
  candidate: '',
  candidateEmail: '',
  jobTitle: '',
  postingId: '',
  requisitionId: '',
  offerId: '',
  applicationId: '',
  packageType: 'Standard',
  vendor: '',
  consentVersion: 'v1.0',
  consentAt: '',
  notes: ''
};

const BackgroundChecksModule: React.FC = () => {
  const [checks, setChecks] = useState<BackgroundCheck[]>([]);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [recentAttachments, setRecentAttachments] = useState<string[]>([]);

  const defaultTasks = () => ([
    { id: crypto.randomUUID(), title: 'Collect pre-boarding documents', status: 'todo' as const },
    { id: crypto.randomUUID(), title: 'Create accounts & tools access', status: 'todo' as const },
    { id: crypto.randomUUID(), title: 'Assign buddy/manager welcome', status: 'todo' as const }
  ]);

  const createOnboardingIfReady = async (check: BackgroundCheck) => {
    if (check.status !== 'Cleared') return;
    const acceptedOffer = offers.find(o => {
      const nameMatch = o.candidate.toLowerCase() === check.candidate.toLowerCase();
      const emailMatch = o.candidateEmail && check.candidateEmail
        ? o.candidateEmail.toLowerCase() === check.candidateEmail.toLowerCase()
        : false;
      const jobMatch = check.jobTitle ? (o.jobTitle || '').toLowerCase() === check.jobTitle.toLowerCase() : true;
      return o.status === 'Accepted' && (emailMatch || nameMatch) && jobMatch;
    });
    if (!acceptedOffer) return;
    const existing = await onboardingService.getByOfferId(acceptedOffer.id);
    if (existing) return;
    await onboardingService.create({
      candidate: check.candidate,
      candidateEmail: check.candidateEmail,
      jobTitle: check.jobTitle,
      postingId: check.postingId,
      requisitionId: check.requisitionId,
      applicationId: check.applicationId,
      offerId: acceptedOffer.id,
      backgroundCheckId: check.id,
      status: 'pending',
      tasks: defaultTasks()
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [allChecks, posts, reqs, offs] = await Promise.all([
          backgroundService.getAll(),
          jobPostingService.getAll(),
          requisitionService.getAll(),
          offerService.getAll()
        ]);
        setChecks(allChecks);
        setPostings(posts);
        setRequisitions(reqs);
        setOffers(offs);
        const apps: JobApplication[] = [];
        for (const post of posts) {
          const appsForPost = await jobPostingService.getApplications(post.id);
          apps.push(...appsForPost);
        }
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load background checks', err);
        setError('Unable to load background checks right now.');
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return checks.filter(c =>
      c.candidate.toLowerCase().includes(term) ||
      (c.jobTitle || '').toLowerCase().includes(term) ||
      (c.status || '').toLowerCase().includes(term)
    );
  }, [checks, search]);

  const stats = useMemo(() => ({
    total: checks.length,
    inProgress: checks.filter(c => c.status === 'In progress').length,
    flagged: checks.filter(c => c.status === 'Flagged').length
  }), [checks]);

  const handleSave = async () => {
    if (!form.candidate || !form.jobTitle) {
      setError('Candidate and job title are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Omit<BackgroundCheck, "id" | "createdAt" | "updatedAt"> = {
      candidate: form.candidate.trim(),
      candidateEmail: form.candidateEmail.trim() || undefined,
      jobTitle: form.jobTitle.trim(),
      postingId: form.postingId || undefined,
      requisitionId: form.requisitionId || undefined,
      offerId: form.offerId || undefined,
      applicationId: form.applicationId || undefined,
      packageType: form.packageType || undefined,
      vendor: form.vendor || undefined,
      consentVersion: form.consentVersion || undefined,
      consentAt: form.consentAt ? new Date(form.consentAt) : undefined,
      status: 'Initiated',
      startedAt: new Date(),
      attachments: [],
      audit: [{
        action: 'Created background check',
        by: 'system',
        at: new Date(),
        details: form.vendor ? `Vendor: ${form.vendor}` : undefined
      }],
      resultSummary: form.notes || undefined
    };
    try {
      const created = await backgroundService.create(payload);
      setChecks(prev => [created, ...prev]);
      setShowForm(false);
      setForm(defaultForm);
    } catch (err) {
      console.error('Failed to create background check', err);
      setError('Unable to create background check.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (check: BackgroundCheck, status: BackgroundStatus) => {
    setStatusUpdating(check.id);
    const auditEntry = {
      action: `Status -> ${status}`,
      by: 'system',
      at: new Date(),
      details: undefined
    };
    const updatedAudit = [...(check.audit || []), auditEntry];
    try {
      await backgroundService.update(check.id, { status, audit: updatedAudit, completedAt: status === 'Completed' ? new Date() : check.completedAt });
      const updated = { ...check, status, audit: updatedAudit, completedAt: status === 'Completed' ? new Date() : check.completedAt };
      setChecks(prev => prev.map(c => c.id === check.id ? updated : c));
      if (status === 'Cleared') {
        await createOnboardingIfReady(updated);
      }
    } catch (err) {
      console.error('Failed to update status', err);
      setError('Unable to update status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleUpload = async (check: BackgroundCheck, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const names = Array.from(files as FileList).map((f: File) => f.name);
    const updatedAttachments = [...(check.attachments || []), ...names];
    try {
      await backgroundService.update(check.id, { attachments: updatedAttachments });
      setChecks(prev => prev.map(c => c.id === check.id ? { ...c, attachments: updatedAttachments } : c));
      setRecentAttachments(names);
      e.target.value = '';
    } catch (err) {
      console.error('Failed to attach files', err);
      setError('Unable to upload files.');
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Background Checks</h1>
          <p className="text-sm text-slate-500">Track vendor checks, consent, and audit trail before onboarding.</p>
        </div>
        <Button className="shadow-lg shadow-blue-500/20" onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-2" /> New Background Check
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} icon={<ShieldCheck size={18} />} />
        <StatCard label="In Progress" value={stats.inProgress} icon={<Clock3 size={18} />} />
        <StatCard label="Flagged" value={stats.flagged} icon={<AlertTriangle size={18} />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Checks</h3>
              <p className="text-xs text-slate-500">Search by candidate, role, or status.</p>
            </div>
          </div>
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search checks..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-full focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No background checks yet.</div>
          ) : (
            filtered.map(check => (
              <div key={check.id} className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-slate-900 inline-flex items-center gap-2">
                      <User size={16} className="text-blue-600" /> {check.candidate}
                    </span>
                    <StatusBadge status={check.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1"><Briefcase size={14} /> {check.jobTitle || '—'}</span>
                    {check.packageType && <span className="inline-flex items-center gap-1"><FileText size={14} /> {check.packageType}</span>}
                    {check.vendor && <span className="inline-flex items-center gap-1"><ShieldCheck size={14} /> {check.vendor}</span>}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                    {check.postingId && <span className="inline-flex items-center gap-1"><Link2 size={12} /> Posting {check.postingId.slice(0, 6)}</span>}
                    {check.requisitionId && <span className="inline-flex items-center gap-1"><Hash size={12} /> Req {check.requisitionId.slice(0, 6)}</span>}
                    {check.offerId && <span className="inline-flex items-center gap-1"><CheckCircle2 size={12} /> Offer {check.offerId.slice(0, 6)}</span>}
                  </div>
                  {check.resultSummary && <div className="text-sm text-slate-700">{check.resultSummary}</div>}
                  {(check.attachments || []).length > 0 && (
                    <div className="text-xs text-slate-500">Attachments: {(check.attachments || []).join(', ')}</div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={check.status}
                    onChange={(e) => handleStatusChange(check, e.target.value as BackgroundStatus)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    disabled={statusUpdating === check.id}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <label className="inline-flex items-center gap-1 text-xs text-blue-600 cursor-pointer">
                    <Upload size={14} />
                    Upload
                    <input type="file" multiple className="hidden" onChange={(e) => handleUpload(check, e)} />
                  </label>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {recentAttachments.length > 0 && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 text-slate-600 px-3 py-2 text-sm">
          Just added: {recentAttachments.join(', ')}
        </div>
      )}

      {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="New Background Check">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Candidate" value={form.candidate} onChange={(e) => setForm(prev => ({ ...prev, candidate: e.target.value }))} required />
            <Field label="Candidate Email" value={form.candidateEmail} onChange={(e) => setForm(prev => ({ ...prev, candidateEmail: e.target.value }))} />
            <Field label="Job Title" value={form.jobTitle} onChange={(e) => setForm(prev => ({ ...prev, jobTitle: e.target.value }))} required />
            <Field label="Package" value={form.packageType} onChange={(e) => setForm(prev => ({ ...prev, packageType: e.target.value }))} />
            <Field label="Vendor" value={form.vendor} onChange={(e) => setForm(prev => ({ ...prev, vendor: e.target.value }))} />
            <Field label="Consent Version" value={form.consentVersion} onChange={(e) => setForm(prev => ({ ...prev, consentVersion: e.target.value }))} />
            <Field label="Consent Timestamp" type="datetime-local" value={form.consentAt} onChange={(e) => setForm(prev => ({ ...prev, consentAt: e.target.value }))} />
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Link Offer (optional)</span>
              <select
                value={form.offerId}
                onChange={(e) => setForm(prev => ({ ...prev, offerId: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unlinked</option>
                {offers.map(o => <option key={o.id} value={o.id}>{o.candidate} - {o.jobTitle}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Link Posting (optional)</span>
              <select
                value={form.postingId}
                onChange={(e) => {
                  const p = postings.find(post => post.id === e.target.value);
                  setForm(prev => ({ ...prev, postingId: e.target.value, jobTitle: p?.title || prev.jobTitle }));
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unlinked</option>
                {postings.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Link Application (optional)</span>
              <select
                value={form.applicationId}
                onChange={(e) => {
                  const app = applications.find(a => a.id === e.target.value);
                  const posting = app ? postings.find(p => p.id === app.postingId) : undefined;
                  setForm(prev => ({
                    ...prev,
                    applicationId: e.target.value,
                    postingId: posting?.id || prev.postingId,
                    jobTitle: app?.postingTitle || app?.name || prev.jobTitle,
                    candidate: app?.name || prev.candidate,
                    candidateEmail: app?.email || prev.candidateEmail
                  }));
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unlinked</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} • {a.postingTitle || a.postingId || ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Link Requisition (optional)</span>
              <select
                value={form.requisitionId}
                onChange={(e) => setForm(prev => ({ ...prev, requisitionId: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unlinked</option>
                {requisitions.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700 mt-3">
            <span className="font-semibold">Notes / Result summary</span>
            <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>Create</Button>
          </div>
        </Modal>
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

const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode; }> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10 overflow-y-auto">
    <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Background</p>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <button className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100" onClick={onClose} aria-label="Close modal">✕</button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; }> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="text-blue-600">{icon}</span>
      <span>{label}</span>
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
  </div>
);

const StatusBadge: React.FC<{ status: BackgroundStatus; }> = ({ status }) => {
  const styles: Record<BackgroundStatus, string> = {
    Initiated: 'bg-slate-100 text-slate-700 border-slate-200',
    'In progress': 'bg-blue-50 text-blue-700 border-blue-100',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Flagged: 'bg-amber-50 text-amber-700 border-amber-100',
    Cleared: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-100'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[status] || styles.Initiated}`}>
      {status}
    </span>
  );
};

export default BackgroundChecksModule;

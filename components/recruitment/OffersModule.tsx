import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, FileSignature, User, Briefcase, DollarSign, CalendarClock, CheckCircle2, Clock3, Link2, Hash } from 'lucide-react';
import Button from '../shared/ui/Button';
import { Offer, OfferStatus, JobPosting, JobRequisition, BackgroundCheck, JobApplication } from '../../shared/types';
import { offerService } from '../../shared/services/offerService';
import { jobPostingService } from '../../shared/services/jobPostingService';
import { requisitionService } from '../../shared/services/requisitionService';
import { backgroundService } from '../../shared/services/backgroundService';
import { onboardingService } from '../../shared/services/onboardingService';

const STATUSES: OfferStatus[] = ['Drafted', 'Approved', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired', 'Withdrawn'];

type FormState = {
  candidate: string;
  candidateEmail: string;
  jobTitle: string;
  postingId: string;
  requisitionId: string;
  applicationId: string;
  salary: number;
  currency: string;
  startDate: string;
  notes: string;
};

const defaultForm: FormState = {
  candidate: '',
  candidateEmail: '',
  jobTitle: '',
  postingId: '',
  requisitionId: '',
  applicationId: '',
  salary: 0,
  currency: 'USD',
  startDate: '',
  notes: ''
};

const OffersModule: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [backgrounds, setBackgrounds] = useState<BackgroundCheck[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const defaultTasks = () => ([
    { id: crypto.randomUUID(), title: 'Collect pre-boarding documents', status: 'todo' as const },
    { id: crypto.randomUUID(), title: 'Create accounts & tools access', status: 'todo' as const },
    { id: crypto.randomUUID(), title: 'Assign buddy/manager welcome', status: 'todo' as const }
  ]);

  const createOnboardingIfReady = async (offer: Offer) => {
    if (offer.status !== 'Accepted') return;
    const cleared = backgrounds.find(bg => {
      const nameMatch = bg.candidate.toLowerCase() === offer.candidate.toLowerCase();
      const emailMatch = bg.candidateEmail && offer.candidateEmail
        ? bg.candidateEmail.toLowerCase() === offer.candidateEmail.toLowerCase()
        : false;
      const jobMatch = offer.jobTitle ? (bg.jobTitle || '').toLowerCase() === offer.jobTitle.toLowerCase() : true;
      return (emailMatch || nameMatch) && jobMatch && bg.status === 'Cleared';
    });
    if (!cleared) return;
    const existing = await onboardingService.getByOfferId(offer.id);
    if (existing) return;
    await onboardingService.create({
      candidate: offer.candidate,
      candidateEmail: offer.candidateEmail,
      jobTitle: offer.jobTitle,
      postingId: offer.postingId,
      requisitionId: cleared.requisitionId,
      applicationId: cleared.applicationId,
      offerId: offer.id,
      backgroundCheckId: cleared.id,
      status: 'pending',
      tasks: defaultTasks()
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [allOffers, posts, reqs, bgs] = await Promise.all([
          offerService.getAll(),
          jobPostingService.getAll(),
          requisitionService.getAll(),
          backgroundService.getAll()
        ]);
        setOffers(allOffers);
        setPostings(posts);
        setRequisitions(reqs);
        setBackgrounds(bgs);
        const apps: JobApplication[] = [];
        for (const post of posts) {
          const appsForPost = await jobPostingService.getApplications(post.id);
          apps.push(...appsForPost);
        }
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load offers', err);
        setError('Unable to load offers.');
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return offers.filter(o =>
      o.candidate.toLowerCase().includes(term) ||
      (o.jobTitle || '').toLowerCase().includes(term) ||
      (o.status || '').toLowerCase().includes(term)
    );
  }, [offers, search]);

  const stats = useMemo(() => ({
    total: offers.length,
    sent: offers.filter(o => ['Sent', 'Viewed'].includes(o.status)).length,
    accepted: offers.filter(o => o.status === 'Accepted').length
  }), [offers]);

  const handleSave = async () => {
    if (!form.candidate || !form.jobTitle || !form.salary) {
      setError('Candidate, job title, and salary are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const payload: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'> = {
      candidate: form.candidate.trim(),
      candidateEmail: form.candidateEmail.trim() || undefined,
      jobTitle: form.jobTitle.trim(),
      postingId: form.postingId || undefined,
      applicationId: form.applicationId || undefined,
      requisitionId: form.requisitionId || undefined,
      salary: Number(form.salary),
      currency: form.currency,
      startDate: form.startDate || undefined,
      status: 'Drafted',
      version: 1,
      notes: form.notes.trim() || undefined
    };
    try {
      const created = await offerService.create(payload);
      setOffers(prev => [created, ...prev]);
      setShowForm(false);
      setForm(defaultForm);
    } catch (err) {
      console.error('Failed to create offer', err);
      setError('Unable to create offer.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (offer: Offer, status: OfferStatus) => {
    setStatusUpdating(offer.id);
    try {
      await offerService.update(offer.id, { status, version: offer.version + 1 });
      const updatedOffer = { ...offer, status, version: offer.version + 1 };
      setOffers(prev => prev.map(o => o.id === offer.id ? updatedOffer : o));
      if (status === 'Accepted') {
        await createOnboardingIfReady(updatedOffer);
      }
    } catch (err) {
      console.error('Failed to update status', err);
      setError('Unable to update status.');
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offer Management</h1>
          <p className="text-sm text-slate-500">Track offers from draft to acceptance with approvals and versions.</p>
        </div>
        <Button className="shadow-lg shadow-blue-500/20" onClick={() => setShowForm(true)}>
          <Plus size={16} className="mr-2" /> New Offer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Total Offers" value={stats.total} icon={<FileSignature size={18} />} />
        <StatCard label="Sent / Viewed" value={stats.sent} icon={<Clock3 size={18} />} />
        <StatCard label="Accepted" value={stats.accepted} icon={<CheckCircle2 size={18} />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileSignature size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Offers</h3>
              <p className="text-xs text-slate-500">Search by candidate, title, or status.</p>
            </div>
          </div>
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search offers..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-full focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No offers yet.</div>
          ) : (
            filtered.map(offer => (
              <div key={offer.id} className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-slate-900 inline-flex items-center gap-2">
                      <User size={16} className="text-blue-600" /> {offer.candidate}
                    </span>
                    <StatusBadge status={offer.status} />
                    <span className="text-xs text-slate-500">v{offer.version}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1"><Briefcase size={14} /> {offer.jobTitle}</span>
                    <span className="inline-flex items-center gap-1"><DollarSign size={14} /> {offer.salary.toLocaleString()} {offer.currency}</span>
                    {offer.startDate && <span className="inline-flex items-center gap-1"><CalendarClock size={14} /> {offer.startDate}</span>}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                    {offer.postingId && <span className="inline-flex items-center gap-1"><Link2 size={12} /> Posting {offer.postingId.slice(0, 6)}</span>}
                    {offer.requisitionId && <span className="inline-flex items-center gap-1"><Hash size={12} /> Req {offer.requisitionId.slice(0, 6)}</span>}
                  </div>
                  {offer.notes && <div className="text-sm text-slate-700">{offer.notes}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={offer.status}
                    onChange={(e) => handleStatusChange(offer, e.target.value as OfferStatus)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    disabled={statusUpdating === offer.id}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(offer, 'Sent')} disabled={statusUpdating === offer.id}>Send</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title="Create Offer">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Candidate" value={form.candidate} onChange={(e) => setForm(prev => ({ ...prev, candidate: e.target.value }))} required />
            <Field label="Candidate Email" value={form.candidateEmail} onChange={(e) => setForm(prev => ({ ...prev, candidateEmail: e.target.value }))} />
            <Field label="Job Title" value={form.jobTitle} onChange={(e) => setForm(prev => ({ ...prev, jobTitle: e.target.value }))} required />
            <Field label="Salary" type="number" value={String(form.salary)} onChange={(e) => setForm(prev => ({ ...prev, salary: Number(e.target.value) }))} required />
            <Field label="Currency" value={form.currency} onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))} />
            <Field label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))} />
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
            <span className="font-semibold">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} isLoading={saving}>Create Offer</Button>
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
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Offer</p>
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

const StatusBadge: React.FC<{ status: OfferStatus; }> = ({ status }) => {
  const styles: Record<OfferStatus, string> = {
    Drafted: 'bg-slate-100 text-slate-700 border-slate-200',
    Approved: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    Sent: 'bg-blue-50 text-blue-700 border-blue-100',
    Viewed: 'bg-amber-50 text-amber-700 border-amber-100',
    Accepted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Rejected: 'bg-rose-50 text-rose-700 border-rose-100',
    Expired: 'bg-slate-100 text-slate-600 border-slate-200',
    Withdrawn: 'bg-slate-100 text-slate-600 border-slate-200'
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[status] || styles.Drafted}`}>
      {status}
    </span>
  );
};

export default OffersModule;

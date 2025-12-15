import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Globe, Upload, CheckSquare, FileText, Building2, MapPin, Briefcase, Users, Link2 } from 'lucide-react';
import Button from '../shared/ui/Button';
import { jobPostingService } from '../../shared/services/jobPostingService';
import { requisitionService } from '../../shared/services/requisitionService';
import { JobApplication, JobPosting, JobRequisition } from '../../shared/types';

const JobPostingModule: React.FC = () => {
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [search, setSearch] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState<JobPosting | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [postingForm, setPostingForm] = useState<Omit<JobPosting, 'id' | 'status' | 'createdAt' | 'updatedAt'>>({
    title: '',
    department: '',
    location: '',
    employmentType: 'Full-time',
    description: '',
    internalOnly: false,
    consentVersion: 'v1.0',
    status: 'published',
    requisitionId: '',
    requisitionTitle: ''
  });

  const [applicationForm, setApplicationForm] = useState<Omit<JobApplication, 'id' | 'submittedAt' | 'files'>>({
    name: '',
    email: '',
    phone: '',
    cover: '',
    consentAccepted: false,
    consentVersion: ''
  });
  const [uploadedNames, setUploadedNames] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [posts, reqs] = await Promise.all([jobPostingService.getAll(), requisitionService.getAll()]);
        const approvedReqs = reqs.filter(r => r.status === 'approved');
        setRequisitions(approvedReqs);
        setPostings(posts);
      } catch (err) {
        console.error('Failed to load job postings', err);
        setError('Unable to load job postings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return postings.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.department.toLowerCase().includes(term) ||
      (p.location || '').toLowerCase().includes(term)
    );
  }, [postings, search]);

  const handleCreatePosting = async () => {
    if (!postingForm.title || !postingForm.department || !postingForm.location) {
      setError('Title, department, and location are required.');
      return;
    }
    if (postingForm.requisitionId && !requisitions.find(r => r.id === postingForm.requisitionId)) {
      setError('Select a valid approved requisition.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await jobPostingService.create(postingForm);
      setPostings(prev => [created, ...prev]);
      setShowPostModal(false);
      setPostingForm({
        title: '',
        department: '',
        location: '',
        employmentType: 'Full-time',
        description: '',
        internalOnly: false,
        consentVersion: 'v1.0',
        status: 'published',
        requisitionId: '',
        requisitionTitle: ''
      });
    } catch (err) {
      console.error('Failed to create posting', err);
      setError('Unable to create posting.');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    if (!showApplyModal) return;
    if (!applicationForm.name || !applicationForm.email || !applicationForm.consentAccepted) {
      setError('Name, email, and consent are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const app: Omit<JobApplication, 'id' | 'submittedAt'> & { postingId: string } = {
        ...applicationForm,
        consentVersion: showApplyModal.consentVersion,
        files: uploadedNames,
        postingId: showApplyModal.id
      };
      const saved = await jobPostingService.submitApplication(app);
      setApplications(prev => [saved, ...prev]);
      setPostings(prev => prev.map(p => p.id === showApplyModal.id ? { ...p, applications: [...(p as any).applications || [], saved] } : p));
      setApplicationForm({ name: '', email: '', phone: '', cover: '', consentAccepted: false, consentVersion: showApplyModal.consentVersion });
      setUploadedNames([]);
      setShowApplyModal(null);
    } catch (err) {
      console.error('Failed to submit application', err);
      setError('Unable to submit application.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const names = Array.from(files as FileList).map((f: File) => f.name);
    setUploadedNames(prev => [...prev, ...names]);
    e.target.value = '';
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Job Posting & Applications</h1>
          <p className="text-sm text-slate-500">Publish roles linked to approved requisitions and intake applications with consent and uploads.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPostModal(true)} className="shadow-lg shadow-blue-500/20">
            <Plus size={16} className="mr-2" /> New Posting
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <SummaryCard label="Published" value={postings.filter(p => p.status === 'published').length} icon={<Globe size={18} />} />
        <SummaryCard label="Applications" value={applications.length} icon={<Users size={18} />} />
        <SummaryCard label="Linked Requisitions" value={postings.filter(p => p.requisitionId).length} icon={<Link2 size={18} />} />
        <SummaryCard label="Drafts" value={postings.filter(p => p.status === 'draft').length} icon={<FileText size={18} />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Postings</h3>
              <p className="text-xs text-slate-500">Search by title, department, or location.</p>
            </div>
          </div>
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search postings..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-full focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No postings yet.</div>
          ) : (
            filtered.map(post => (
              <div key={post.id} className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{post.title}</div>
                  <div className="text-sm text-slate-600 flex flex-wrap gap-3">
                    <span className="inline-flex items-center gap-1"><Building2 size={14} /> {post.department}</span>
                    <span className="inline-flex items-center gap-1"><MapPin size={14} /> {post.location}</span>
                    <span className="inline-flex items-center gap-1"><Briefcase size={14} /> {post.employmentType}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Consent version: {post.consentVersion} • {post.internalOnly ? 'Internal only' : 'External/Internal'} •
                    {post.requisitionTitle ? ` Req: ${post.requisitionTitle}` : ' Unlinked'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                    {post.status}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setShowApplyModal(post)}>Application Intake</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showPostModal && (
        <Modal onClose={() => setShowPostModal(false)} title="Create Job Posting">
          {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Job Title" value={postingForm.title} onChange={(e) => setPostingForm(prev => ({ ...prev, title: e.target.value }))} required />
            <Field label="Department" value={postingForm.department} onChange={(e) => setPostingForm(prev => ({ ...prev, department: e.target.value }))} required />
            <Field label="Location" value={postingForm.location} onChange={(e) => setPostingForm(prev => ({ ...prev, location: e.target.value }))} required />
            <Select label="Employment Type" value={postingForm.employmentType} onChange={(e) => setPostingForm(prev => ({ ...prev, employmentType: e.target.value }))} options={['Full-time','Part-time','Contract','Intern']} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={postingForm.internalOnly} onChange={(e) => setPostingForm(prev => ({ ...prev, internalOnly: e.target.checked }))} />
              <span>Internal only</span>
            </label>
            <Field label="Consent Version" value={postingForm.consentVersion} onChange={(e) => setPostingForm(prev => ({ ...prev, consentVersion: e.target.value }))} />
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Link to approved requisition (optional)</span>
              <select
                value={postingForm.requisitionId}
                onChange={(e) => {
                  const req = requisitions.find(r => r.id === e.target.value);
                  setPostingForm(prev => ({ ...prev, requisitionId: e.target.value, requisitionTitle: req?.title || '' }));
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Select approved requisition</option>
                {requisitions.map(req => (
                  <option key={req.id} value={req.id}>{req.title} ({req.department})</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700 mt-3">
            <span className="font-semibold">Job Description</span>
            <textarea value={postingForm.description} onChange={(e) => setPostingForm(prev => ({ ...prev, description: e.target.value }))} rows={5} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowPostModal(false)}>Cancel</Button>
            <Button onClick={handleCreatePosting} isLoading={saving}>Publish</Button>
          </div>
        </Modal>
      )}

      {showApplyModal && (
        <Modal onClose={() => setShowApplyModal(null)} title={`Apply: ${showApplyModal.title}`}>
          {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full Name" value={applicationForm.name} onChange={(e) => setApplicationForm(prev => ({ ...prev, name: e.target.value }))} required />
            <Field label="Email" value={applicationForm.email} onChange={(e) => setApplicationForm(prev => ({ ...prev, email: e.target.value }))} required />
            <Field label="Phone" value={applicationForm.phone || ''} onChange={(e) => setApplicationForm(prev => ({ ...prev, phone: e.target.value }))} />
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold">Cover / Motivation</span>
              <textarea value={applicationForm.cover || ''} onChange={(e) => setApplicationForm(prev => ({ ...prev, cover: e.target.value }))} rows={3} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              <span className="font-semibold">Upload CV / Documents</span>
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Upload size={16} />
                <span className="text-blue-600 cursor-pointer">
                  Choose files
                  <input type="file" multiple className="hidden" onChange={handleUpload} />
                </span>
              </div>
              {uploadedNames.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {uploadedNames.map((name) => (
                    <span key={name} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">{name}</span>
                  ))}
                </div>
              )}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={applicationForm.consentAccepted} onChange={(e) => setApplicationForm(prev => ({ ...prev, consentAccepted: e.target.checked }))} />
              <span>I consent to data processing (policy {showApplyModal.consentVersion})</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowApplyModal(null)}>Cancel</Button>
            <Button onClick={handleApply} disabled={!applicationForm.consentAccepted} isLoading={saving}>Submit Application</Button>
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

const Select: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; }> = ({ label, value, onChange, options }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-700">
    <span className="font-semibold">{label}</span>
    <select value={value} onChange={onChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
      {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  </label>
);

const Modal: React.FC<{ onClose: () => void; title: string; children: React.ReactNode; }> = ({ onClose, title, children }) => (
  <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10 overflow-y-auto">
    <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Job Posting</p>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        </div>
        <button className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100" onClick={onClose} aria-label="Close modal">✕</button>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
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

export default JobPostingModule;

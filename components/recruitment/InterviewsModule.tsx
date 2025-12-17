import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Plus, Search, User, Briefcase, Video, Clock, CheckSquare, CheckCircle2, XCircle, MessageSquare, Link2, AlertCircle } from 'lucide-react';
import Button from '../shared/ui/Button';
import { Interview, InterviewStatus, JobPosting, JobApplication } from '../../shared/types';
import { interviewService } from '../../shared/services/interviewService';
import { jobPostingService } from '../../shared/services/jobPostingService';

const STAGES = ['Screening', 'Technical', 'Hiring Manager', 'HR', 'Final'];
const STATUSES: InterviewStatus[] = ['Scheduled', 'Completed', 'Cancelled', 'No-show'];

type FormState = {
  candidate: string;
  candidateEmail: string;
  candidatePhone: string;
  jobTitle: string;
  postingId: string;
  applicationId: string;
  stage: string;
  date: string;
  time: string;
  durationMinutes: number;
  format: Interview['format'];
  interviewers: string;
  location: string;
  videoLink: string;
  notes: string;
};

const defaultForm: FormState = {
  candidate: '',
  candidateEmail: '',
  candidatePhone: '',
  jobTitle: '',
  postingId: '',
  applicationId: '',
  stage: STAGES[0],
  date: '',
  time: '',
  durationMinutes: 30,
  format: 'Video',
  interviewers: '',
  location: '',
  videoLink: '',
  notes: ''
};

const InterviewsModule: React.FC = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Interview | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [feedbackFor, setFeedbackFor] = useState<Interview | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(3);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [allInterviews, allPostings] = await Promise.all([
          interviewService.getAll(),
          jobPostingService.getAll()
        ]);
        setInterviews(allInterviews);
        setPostings(allPostings);
        const apps: JobApplication[] = [];
        for (const post of allPostings) {
          const appsForPost = await jobPostingService.getApplications(post.id);
          apps.push(...appsForPost.map(a => ({ ...a, postingTitle: post.title })));
        }
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load interviews', err);
        setError('Unable to load interviews right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return interviews
      .filter(i =>
        i.candidate.toLowerCase().includes(term) ||
        (i.jobTitle || '').toLowerCase().includes(term) ||
        (i.stage || '').toLowerCase().includes(term) ||
        (i.status || '').toLowerCase().includes(term)
      )
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [interviews, search]);

  const stats = useMemo(() => ({
    scheduled: interviews.filter(i => i.status === 'Scheduled').length,
    today: interviews.filter(i => i.date === new Date().toISOString().slice(0, 10)).length,
    completed: interviews.filter(i => i.status === 'Completed').length
  }), [interviews]);

  const handleOpenForm = (interview?: Interview) => {
    if (interview) {
      setEditing(interview);
      setForm({
        candidate: interview.candidate,
        candidateEmail: interview.candidateEmail || '',
        candidatePhone: interview.candidatePhone || '',
        jobTitle: interview.jobTitle,
        postingId: interview.postingId || '',
        applicationId: interview.applicationId || '',
        stage: interview.stage,
        date: interview.date,
        time: interview.time,
        durationMinutes: interview.durationMinutes,
        format: interview.format,
        interviewers: (interview.interviewers || []).join(', '),
        location: interview.location || '',
        videoLink: interview.videoLink || '',
        notes: interview.notes || ''
      });
    } else {
      setEditing(null);
      setForm({
        ...defaultForm,
        date: new Date().toISOString().slice(0, 10),
        time: '10:00'
      });
    }
    setShowForm(true);
  };

  const handleSaveInterview = async () => {
    if (!form.candidate || !form.jobTitle || !form.date || !form.time) {
      setError('Candidate, job title, date, and time are required.');
      return;
    }
    const payload: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'> = {
      candidate: form.candidate.trim(),
      candidateEmail: form.candidateEmail.trim() || undefined,
      candidatePhone: form.candidatePhone.trim() || undefined,
      jobTitle: form.jobTitle.trim(),
      postingId: form.postingId || undefined,
      applicationId: form.applicationId || editing?.applicationId || undefined,
      stage: form.stage,
      date: form.date,
      time: form.time,
      durationMinutes: Number(form.durationMinutes) || 30,
      format: form.format,
      interviewers: form.interviewers.split(',').map(i => i.trim()).filter(Boolean),
      location: form.location.trim() || undefined,
      videoLink: form.videoLink.trim() || undefined,
      notes: form.notes.trim() || undefined,
      status: editing?.status || 'Scheduled',
      feedback: editing?.feedback || []
    };

    try {
      if (editing) {
        await interviewService.update(editing.id, payload);
        setInterviews(prev => prev.map(i => i.id === editing.id ? { ...i, ...payload } : i));
      } else {
        const created = await interviewService.create(payload);
        setInterviews(prev => [...prev, created]);
      }
      setShowForm(false);
      setEditing(null);
      setForm(defaultForm);
      setError(null);
    } catch (err) {
      console.error('Failed to save interview', err);
      setError('Unable to save interview.');
    }
  };

  const handleStatusChange = async (interview: Interview, status: InterviewStatus) => {
    try {
      await interviewService.update(interview.id, { status });
      setInterviews(prev => prev.map(i => i.id === interview.id ? { ...i, status } : i));
    } catch (err) {
      console.error('Failed to update status', err);
      setError('Unable to update status.');
    }
  };

  const handleFeedbackSave = async () => {
    if (!feedbackFor || !feedbackNotes.trim()) return;
    const newFeedback = {
      id: crypto.randomUUID(),
      author: 'system',
      notes: feedbackNotes.trim(),
      rating: feedbackRating,
      submittedAt: new Date()
    };
    const updatedFeedback = [...(feedbackFor.feedback || []), newFeedback];
    try {
      await interviewService.update(feedbackFor.id, { feedback: updatedFeedback, status: 'Completed' });
      setInterviews(prev => prev.map(i => i.id === feedbackFor.id ? { ...i, feedback: updatedFeedback, status: 'Completed' } : i));
      setFeedbackFor(null);
      setFeedbackNotes('');
      setFeedbackRating(3);
    } catch (err) {
      console.error('Failed to save feedback', err);
      setError('Unable to save feedback.');
    }
  };

  const duplicates = useMemo(() => {
    const counts: Record<string, number> = {};
    interviews.forEach(i => {
      const key = i.candidate.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [interviews]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Interviews & Scheduling</h1>
          <p className="text-sm text-slate-500">Schedule, reschedule, capture feedback, and keep an audit trail.</p>
        </div>
        <Button className="shadow-lg shadow-blue-500/20" onClick={() => handleOpenForm()}>
          <Plus size={16} className="mr-2" /> Schedule Interview
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard label="Scheduled" value={stats.scheduled} icon={<CalendarClock size={18} />} />
        <StatCard label="Today" value={stats.today} icon={<Clock size={18} />} />
        <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2 size={18} />} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarClock size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Interview Calendar</h3>
              <p className="text-xs text-slate-500">Search by candidate, role, or stage.</p>
            </div>
          </div>
          <div className="relative max-w-sm w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search interviews..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-full focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-6 text-center text-slate-500">Loading interviews...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No interviews scheduled.</div>
          ) : (
            filtered.map(item => (
              <div key={item.id} className="p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <User size={16} className="text-blue-600" /> {item.candidate}
                    </div>
                    {duplicates[item.candidate.toLowerCase()] > 1 && (
                      <span className="text-[11px] rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5">Multiple rounds</span>
                    )}
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1"><Briefcase size={14} /> {item.jobTitle}</span>
                    <span className="inline-flex items-center gap-1"><CheckSquare size={14} /> {item.stage}</span>
                    <span className="inline-flex items-center gap-1"><Clock size={14} /> {item.date} • {item.time} • {item.durationMinutes}m</span>
                    <span className="inline-flex items-center gap-1"><Video size={14} /> {item.format}</span>
                    {item.postingId && <span className="inline-flex items-center gap-1"><Link2 size={14} /> {item.postingId.slice(0, 6)}</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    Panel: {item.interviewers?.join(', ') || '—'} {item.location ? `• ${item.location}` : ''} {item.videoLink ? `• ${item.videoLink}` : ''}
                  </div>
                  {item.notes && <div className="text-sm text-slate-700">{item.notes}</div>}
                  {(item.feedback || []).length > 0 && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 space-y-1">
                      <div className="text-xs font-semibold text-slate-600 uppercase">Feedback</div>
                      {item.feedback?.map(f => (
                        <div key={f.id} className="flex items-center justify-between">
                          <span>{f.notes}</span>
                          <span className="text-xs text-slate-500">Score: {f.rating ?? '—'} • {new Date(f.submittedAt).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChange(item, e.target.value as InterviewStatus)}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => handleOpenForm(item)}>Reschedule</Button>
                  <Button size="sm" variant="outline" onClick={() => { setFeedbackFor(item); setFeedbackNotes(''); }}>Add Feedback</Button>
                  {item.status !== 'Cancelled' && (
                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(item, 'Cancelled')}>
                      <XCircle size={14} className="mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {showForm && (
        <Modal onClose={() => setShowForm(false)} title={editing ? 'Reschedule interview' : 'Schedule interview'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Candidate" value={form.candidate} onChange={(e) => setForm(prev => ({ ...prev, candidate: e.target.value }))} required />
            <Field label="Candidate Email" value={form.candidateEmail} onChange={(e) => setForm(prev => ({ ...prev, candidateEmail: e.target.value }))} />
            <Field label="Candidate Phone" value={form.candidatePhone} onChange={(e) => setForm(prev => ({ ...prev, candidatePhone: e.target.value }))} />
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Job Posting (optional)</span>
              <select
                value={form.postingId}
                onChange={(e) => {
                  const post = postings.find(p => p.id === e.target.value);
                  setForm(prev => ({ ...prev, postingId: e.target.value, jobTitle: post?.title || prev.jobTitle }));
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unlinked</option>
                {postings.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Application (optional)</span>
              <select
                value={form.applicationId}
                onChange={(e) => {
                  const app = applications.find(a => a.id === e.target.value);
                  const post = app ? postings.find(p => p.id === app.postingId) : undefined;
                  setForm(prev => ({
                    ...prev,
                    applicationId: e.target.value,
                    postingId: post?.id || prev.postingId,
                    candidate: app?.name || prev.candidate,
                    candidateEmail: app?.email || prev.candidateEmail,
                    jobTitle: app?.postingTitle || prev.jobTitle
                  }));
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Unlinked</option>
                {applications.map(a => (
                  <option key={a.id} value={a.id}>{a.name} • {a.postingTitle || a.postingId || ''}</option>
                ))}
              </select>
            </label>
            <Field label="Job Title" value={form.jobTitle} onChange={(e) => setForm(prev => ({ ...prev, jobTitle: e.target.value }))} required />
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Stage</span>
              <select value={form.stage} onChange={(e) => setForm(prev => ({ ...prev, stage: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <Field label="Date" type="date" value={form.date} onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))} required />
            <Field label="Time" type="time" value={form.time} onChange={(e) => setForm(prev => ({ ...prev, time: e.target.value }))} required />
            <Field label="Duration (minutes)" type="number" value={String(form.durationMinutes)} onChange={(e) => setForm(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))} />
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Format</span>
              <select value={form.format} onChange={(e) => setForm(prev => ({ ...prev, format: e.target.value as Interview['format'] }))} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
                <option value="Video">Video</option>
                <option value="In-person">In-person</option>
                <option value="Phone">Phone</option>
              </select>
            </label>
            <Field label="Interviewers (comma separated)" value={form.interviewers} onChange={(e) => setForm(prev => ({ ...prev, interviewers: e.target.value }))} />
            <Field label="Location" value={form.location} onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))} />
            <Field label="Video Link" value={form.videoLink} onChange={(e) => setForm(prev => ({ ...prev, videoLink: e.target.value }))} />
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-700 mt-3">
            <span className="font-semibold">Notes</span>
            <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
          </label>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSaveInterview}>{editing ? 'Save changes' : 'Schedule'}</Button>
          </div>
        </Modal>
      )}

      {feedbackFor && (
        <Modal onClose={() => setFeedbackFor(null)} title={`Feedback for ${feedbackFor.candidate}`}>
          <div className="space-y-3">
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Rating (1-5)</span>
              <input type="number" min={1} max={5} value={feedbackRating} onChange={(e) => setFeedbackRating(Number(e.target.value))} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none w-32" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              <span className="font-semibold">Feedback</span>
              <textarea value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)} rows={4} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Interview feedback, recommendations, red flags" />
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setFeedbackFor(null)}>Cancel</Button>
            <Button onClick={handleFeedbackSave} disabled={!feedbackNotes.trim()}><MessageSquare size={16} className="mr-1" /> Save feedback</Button>
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
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Interviews</p>
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

const StatusBadge: React.FC<{ status: InterviewStatus; }> = ({ status }) => {
  const styles: Record<InterviewStatus, string> = {
    Scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
    'No-show': 'bg-amber-50 text-amber-700 border-amber-100'
  };
  const iconMap: Record<InterviewStatus, React.ReactNode> = {
    Scheduled: <CalendarClock size={12} />,
    Completed: <CheckCircle2 size={12} />,
    Cancelled: <XCircle size={12} />,
    'No-show': <AlertCircle size={12} />
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[status] || styles.Scheduled}`}>
      {iconMap[status]}
      {status}
    </span>
  );
};

export default InterviewsModule;

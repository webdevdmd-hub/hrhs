import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, BadgeCheck, Mail, Phone, Tag, ArrowRightLeft, Upload, StickyNote } from 'lucide-react';
import Button from '../shared/ui/Button';
import { JobApplication, JobPosting, ApplicationNote } from '../../shared/types';
import { jobPostingService } from '../../shared/services/jobPostingService';

const STAGES: JobApplication['stage'][] = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected', 'On hold'];

const ATSModule: React.FC = () => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<JobApplication['stage'] | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [noteText, setNoteText] = useState('');
  const [uploadNames, setUploadNames] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const posts = await jobPostingService.getAll();
        setPostings(posts);
        // Gather apps for all postings
        const allApps: JobApplication[] = [];
        for (const post of posts) {
          const apps = await jobPostingService.getApplications(post.id);
          allApps.push(...apps.map(a => ({ ...a, postingTitle: post.title })));
        }
        setApplications(allApps);
      } catch (err) {
        console.error('Failed to load applications', err);
        setError('Unable to load applications.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return applications.filter(app => {
      const matchesSearch =
        app.name.toLowerCase().includes(term) ||
        (app.email || '').toLowerCase().includes(term) ||
        (app.postingTitle || '').toLowerCase().includes(term);
      const matchesStage = stageFilter === 'all' ? true : app.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [applications, search, stageFilter]);

  const handleStageChange = async (id: string, stage: JobApplication['stage']) => {
    try {
      await jobPostingService.updateApplication(id, { stage });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, stage } : a));
    } catch (err) {
      console.error('Failed to update stage', err);
      setError('Unable to update stage.');
    }
  };

  const duplicateEmails = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      const key = (app.email || '').toLowerCase();
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const handleAddNote = async () => {
    if (!selectedApp || !noteText.trim()) return;
    const newNote: ApplicationNote = {
      id: crypto.randomUUID(),
      text: noteText.trim(),
      author: 'system',
      createdAt: new Date()
    };
    const updatedNotes = [...(selectedApp.notes || []), newNote];
    try {
      await jobPostingService.updateApplication(selectedApp.id, { notes: updatedNotes });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, notes: updatedNotes } : a));
      setSelectedApp(prev => prev ? { ...prev, notes: updatedNotes } : prev);
      setNoteText('');
    } catch (err) {
      console.error('Failed to add note', err);
      setError('Unable to add note.');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedApp) return;
    const files = e.target.files;
    if (!files || !files.length) return;
    const names = Array.from(files as FileList).map((f: File) => f.name);
    const updatedFiles = [...(selectedApp.files || []), ...names];
    try {
      await jobPostingService.updateApplication(selectedApp.id, { files: updatedFiles });
      setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, files: updatedFiles } : a));
      setSelectedApp(prev => prev ? { ...prev, files: updatedFiles } : prev);
      setUploadNames(names);
      e.target.value = '';
    } catch (err) {
      console.error('Failed to attach files', err);
      setError('Unable to attach files.');
    }
  };

  const stageColumns = useMemo(() => {
    const map: Record<string, JobApplication[]> = {};
    STAGES.forEach(s => { map[s] = []; });
    filtered.forEach(app => {
      const key = app.stage || 'Applied';
      (map[key] || map.Applied).push(app);
    });
    return map;
  }, [filtered]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ATS - Applications</h1>
          <p className="text-sm text-slate-500">Track candidates through the pipeline with quick stage updates.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-slate-800">Applications</h3>
              <p className="text-xs text-slate-500">Search by candidate or job, filter by stage.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate or job..."
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as JobApplication['stage'] | 'all')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading applications...</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No applications found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
            {STAGES.map(stage => (
              <div key={stage} className="rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
                  <span className="text-sm font-semibold text-slate-800">{stage}</span>
                  <span className="text-xs text-slate-500">{stageColumns[stage]?.length || 0}</span>
                </div>
                <div className="space-y-2 p-2 max-h-[420px] overflow-y-auto">
                  {stageColumns[stage]?.map(app => (
                    <div key={app.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:border-blue-200 transition cursor-pointer" onClick={() => setSelectedApp(app)}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                          {app.name} {app.stage === 'Hired' && <BadgeCheck size={14} className="text-emerald-500" />}
                        </div>
                        {duplicateEmails[(app.email || '').toLowerCase()] > 1 && (
                          <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-[10px] uppercase">Possible duplicate</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">Job: {app.postingTitle || '—'}</div>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-600 mt-1">
                        {app.email && <span className="inline-flex items-center gap-1"><Mail size={12} /> {app.email}</span>}
                        {app.source && <span className="inline-flex items-center gap-1"><Tag size={12} /> {app.source}</span>}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <select
                          value={app.stage || 'Applied'}
                          onChange={(e) => handleStageChange(app.id, e.target.value as JobApplication['stage'])}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Candidate Profile</p>
                <h3 className="text-xl font-bold text-slate-900">{selectedApp.name}</h3>
                <p className="text-xs text-slate-500">Stage: {selectedApp.stage || 'Applied'} • Job: {selectedApp.postingTitle || selectedApp.postingId || '—'}</p>
              </div>
              <button className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100" onClick={() => setSelectedApp(null)} aria-label="Close">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoRow label="Email" value={selectedApp.email || '-'} />
                <InfoRow label="Phone" value={selectedApp.phone || '-'} />
                <InfoRow label="Source" value={selectedApp.source || '-'} />
                <InfoRow label="Consent" value={selectedApp.consentVersion} />
                <InfoRow label="Stage" value={selectedApp.stage || 'Applied'} />
              </div>
              {selectedApp.cover && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-600 uppercase">Cover / Motivation</div>
                  <p className="text-sm text-slate-700 mt-1">{selectedApp.cover}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><StickyNote size={14} /> Notes</h4>
                    <Button size="sm" variant="outline" onClick={handleAddNote} disabled={!noteText.trim()}>Add</Button>
                  </div>
                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" rows={3} placeholder="Add internal note" />
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(selectedApp.notes || []).map(note => (
                      <div key={note.id} className="rounded-lg border border-slate-200 bg-white p-2 text-sm">
                        <div className="text-slate-800">{note.text}</div>
                        <div className="text-[11px] text-slate-500 mt-1">{note.authorName || note.author} • {new Date(note.createdAt).toLocaleString()}</div>
                      </div>
                    ))}
                    {(selectedApp.notes || []).length === 0 && <div className="text-xs text-slate-500">No notes yet.</div>}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Upload size={14} /> Attachments</h4>
                    <label className="inline-flex items-center gap-2 text-sm text-blue-600 cursor-pointer">
                      <Upload size={14} />
                      <span>Upload</span>
                      <input type="file" multiple className="hidden" onChange={handleUpload} />
                    </label>
                  </div>
                  <div className="space-y-2">
                    {(selectedApp.files || []).map((file, idx) => (
                      <div key={idx} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{file}</div>
                    ))}
                    {(selectedApp.files || []).length === 0 && <div className="text-xs text-slate-500">No attachments yet.</div>}
                  </div>
                  {uploadNames.length > 0 && (
                    <div className="text-xs text-slate-500">Just added: {uploadNames.join(', ')}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</span>
    <span className="text-slate-800 font-semibold">{value}</span>
  </div>
);

export default ATSModule;

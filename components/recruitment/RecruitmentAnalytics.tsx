import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Target, Users, Briefcase, FileSignature, CheckCircle2, Activity } from 'lucide-react';
import Button from '../shared/ui/Button';
import { requisitionService } from '../../shared/services/requisitionService';
import { jobPostingService } from '../../shared/services/jobPostingService';
import { offerService } from '../../shared/services/offerService';
import { JobApplication, JobPosting, JobRequisition, Offer } from '../../shared/types';

type FunnelSlice = {
  label: string;
  count: number;
  pctOfPrev: number;
};

const RecruitmentAnalytics: React.FC = () => {
  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [postings, setPostings] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [reqs, posts, offs] = await Promise.all([
          requisitionService.getAll(),
          jobPostingService.getAll(),
          offerService.getAll()
        ]);
        setRequisitions(reqs);
        setPostings(posts);
        setOffers(offs);
        const apps: JobApplication[] = [];
        for (const post of posts) {
          const appsForPost = await jobPostingService.getApplications(post.id);
          apps.push(...appsForPost);
        }
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load analytics data', err);
        setError('Unable to load analytics right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const funnel: FunnelSlice[] = useMemo(() => {
    const hired = offers.filter(o => o.status === 'Accepted').length;
    const stages = [
      { label: 'Requisitions', count: requisitions.length },
      { label: 'Postings', count: postings.length },
      { label: 'Applications', count: applications.length },
      { label: 'Offers', count: offers.length },
      { label: 'Hires (Accepted Offers)', count: hired }
    ];
    return stages.map((slice, idx) => {
      const prev = idx === 0 ? slice.count || 1 : stages[idx - 1].count || 1;
      return { ...slice, pctOfPrev: Math.round((slice.count / prev) * 100) };
    });
  }, [requisitions, postings, applications, offers]);

  const totals = {
    requisitions: requisitions.length,
    postings: postings.length,
    applications: applications.length,
    offers: offers.length,
    accepted: offers.filter(o => o.status === 'Accepted').length
  };

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Recruitment Analytics</h1>
          <p className="text-sm text-slate-500">Simple funnel from requisition to hire.</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <BarChart3 size={16} className="mr-2" /> Refresh
        </Button>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-center text-slate-500">Loading analytics…</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <StatCard label="Requisitions" value={totals.requisitions} icon={<Target size={18} />} />
            <StatCard label="Postings" value={totals.postings} icon={<Briefcase size={18} />} />
            <StatCard label="Applications" value={totals.applications} icon={<Users size={18} />} />
            <StatCard label="Offers" value={totals.offers} icon={<FileSignature size={18} />} />
            <StatCard label="Hires (accepted)" value={totals.accepted} icon={<CheckCircle2 size={18} />} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
              <Activity size={18} className="text-blue-600" />
              <div>
                <h3 className="font-semibold text-slate-800">Funnel</h3>
                <p className="text-xs text-slate-500">Conversion by stage (per previous stage).</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {funnel.map(slice => (
                <div key={slice.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{slice.label}</span>
                    <span className="text-slate-600">{slice.count} • {slice.pctOfPrev}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-3 rounded-full bg-blue-500"
                      style={{ width: `${Math.min(slice.pctOfPrev, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; icon: React.ReactNode; }> = ({ label, value, icon }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
      <span className="text-blue-600">{icon}</span>
      <span>{label}</span>
    </div>
    <div className="text-2xl font-bold text-slate-900">{value}</div>
  </div>
);

export default RecruitmentAnalytics;

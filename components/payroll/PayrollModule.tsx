import React, { useMemo, useState, ChangeEvent } from 'react';
import { Banknote, Shield, Receipt, Gift, Download, Search, CalendarClock } from 'lucide-react';

type SalaryRevision = {
  effectiveDate: string;
  amount: number;
  notes?: string;
};

type SalaryInfo = {
  employee: string;
  base: number;
  allowances: number;
  deductions: number;
  frequency: 'Monthly' | 'Bi-Weekly' | 'Weekly';
  bank: string;
  account: string;
  method: 'Bank Transfer' | 'Check' | 'Cash';
  revisions: SalaryRevision[];
};

type Benefit = {
  name: string;
  coverage: string;
  employeeShare: number;
  employerShare: number;
  dependents?: number;
  status: 'Active' | 'Pending' | 'Ended';
};

type TaxDoc = {
  type: string;
  year: number;
  status: 'Ready' | 'In Progress' | 'Filed';
  downloadUrl?: string;
};

type Bonus = {
  program: string;
  period: string;
  target: number;
  achieved: number;
  status: 'Scheduled' | 'Paid' | 'Pending';
};

const currency = (value: number) =>
  value.toLocaleString('en-AE', { style: 'currency', currency: 'AED', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-slate-800 font-semibold">
      <span className="text-blue-600">{icon}</span>
      <span>{title}</span>
    </div>
    <div className="p-4 space-y-4">{children}</div>
  </div>
);

const InputLine: React.FC<{
  label: string;
  name: string;
  value: string | number;
  type?: string;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  options?: string[];
}> = ({ label, name, value, onChange, type = 'text', options }) => (
  <label className="flex flex-col gap-1 text-sm text-slate-600">
    <span>{label}</span>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    ) : (
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
      />
    )}
  </label>
);

const PayrollModule: React.FC = () => {
  const [search, setSearch] = useState('');
  const [salaryInfo, setSalaryInfo] = useState<SalaryInfo>({
    employee: 'Christopher Brown',
    base: 85000,
    allowances: 7500,
    deductions: 4500,
    frequency: 'Monthly',
    bank: 'First National Bank',
    account: '**** 5543',
    method: 'Bank Transfer',
    revisions: [
      { effectiveDate: '2024-06-01', amount: 82000, notes: 'Annual merit increase' },
      { effectiveDate: '2023-06-01', amount: 78000, notes: 'Promotion to Team Member' }
    ]
  });

  const [benefits, setBenefits] = useState<Benefit[]>([
    { name: 'Health Insurance', coverage: 'PPO - Employee + Family', employeeShare: 250, employerShare: 550, dependents: 3, status: 'Active' },
    { name: 'Retirement Plan', coverage: '401(k) with 4% match', employeeShare: 400, employerShare: 340, status: 'Active' },
    { name: 'Life Insurance', coverage: 'AED 150,000', employeeShare: 35, employerShare: 80, status: 'Pending' }
  ]);

  const [taxDocs] = useState<TaxDoc[]>([
    { type: 'W-2', year: 2024, status: 'Ready' },
    { type: 'W-2', year: 2023, status: 'Filed', downloadUrl: '#' },
    { type: '1099', year: 2022, status: 'Filed', downloadUrl: '#' }
  ]);

  const [bonuses] = useState<Bonus[]>([
    { program: 'Annual Bonus', period: 'FY2024', target: 8000, achieved: 7200, status: 'Scheduled' },
    { program: 'Quarterly Incentive', period: 'Q2 2024', target: 2000, achieved: 2100, status: 'Paid' },
    { program: 'Referral Bonus', period: '2024', target: 1000, achieved: 1000, status: 'Paid' }
  ]);

  const filteredBenefits = useMemo(
    () => benefits.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.coverage.toLowerCase().includes(search.toLowerCase())),
    [benefits, search]
  );

  const handleSalaryChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSalaryInfo(prev => ({
      ...prev,
      [name]: name === 'base' || name === 'allowances' || name === 'deductions' ? Number(value) || 0 : value
    }) as SalaryInfo);
  };

  const handleBenefitChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBenefits(prev => prev.map((item, i) =>
      i === index
        ? { ...item, [name]: name.includes('Share') || name === 'dependents' ? Number(value) || 0 : value }
        : item
    ));
  };

  const totalComp = useMemo(() => salaryInfo.base + salaryInfo.allowances - salaryInfo.deductions, [salaryInfo]);

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payroll & Compensation</h1>
          <p className="text-sm text-slate-500 mt-1">Manage salary, benefits, taxes, and incentives.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search benefits..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      <SectionCard title="Salary Information & Payment" icon={<Banknote size={18} />}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase text-slate-500 font-semibold">Compensation</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="flex justify-between"><span>Base Pay</span><span className="font-semibold">{currency(salaryInfo.base)}</span></div>
              <div className="flex justify-between"><span>Allowances</span><span className="font-semibold text-green-700">{currency(salaryInfo.allowances)}</span></div>
              <div className="flex justify-between"><span>Deductions</span><span className="font-semibold text-amber-700">-{currency(salaryInfo.deductions)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span>Total (per period)</span><span className="font-semibold text-blue-700">{currency(totalComp)}</span></div>
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputLine label="Base Salary (AED)" name="base" value={salaryInfo.base} type="number" onChange={handleSalaryChange} />
            <InputLine label="Allowances (AED)" name="allowances" value={salaryInfo.allowances} type="number" onChange={handleSalaryChange} />
            <InputLine label="Deductions (AED)" name="deductions" value={salaryInfo.deductions} type="number" onChange={handleSalaryChange} />
            <InputLine label="Payment Frequency" name="frequency" value={salaryInfo.frequency} onChange={handleSalaryChange} options={['Monthly','Bi-Weekly','Weekly']} />
            <InputLine label="Payment Method" name="method" value={salaryInfo.method} onChange={handleSalaryChange} options={['Bank Transfer','Check','Cash']} />
            <InputLine label="Bank" name="bank" value={salaryInfo.bank} onChange={handleSalaryChange} />
            <InputLine label="Account" name="account" value={salaryInfo.account} onChange={handleSalaryChange} />
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 text-sm font-semibold text-slate-700">
            <span>Salary Revision History</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500"><CalendarClock size={14} /> Effective Dates</span>
          </div>
          <div className="divide-y divide-slate-100">
            {salaryInfo.revisions.map((rev, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold">{currency(rev.amount)}</div>
                <div className="text-slate-500">{rev.effectiveDate}</div>
                <div className="text-slate-600">{rev.notes || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Benefits Enrollment & Management" icon={<Shield size={18} />}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-800">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Benefit</th>
                <th className="px-3 py-2 text-left font-semibold">Coverage</th>
                <th className="px-3 py-2 text-left font-semibold">Emp. Share (AED)</th>
                <th className="px-3 py-2 text-left font-semibold">Employer (AED)</th>
                <th className="px-3 py-2 text-left font-semibold">Dependents</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBenefits.map((benefit, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2">
                    <InputLine label="" name="name" value={benefit.name} onChange={(e) => handleBenefitChange(idx, e)} />
                  </td>
                  <td className="px-3 py-2">
                    <InputLine label="" name="coverage" value={benefit.coverage} onChange={(e) => handleBenefitChange(idx, e)} />
                  </td>
                  <td className="px-3 py-2">
                    <InputLine label="" type="number" name="employeeShare" value={benefit.employeeShare} onChange={(e) => handleBenefitChange(idx, e)} />
                  </td>
                  <td className="px-3 py-2">
                    <InputLine label="" type="number" name="employerShare" value={benefit.employerShare} onChange={(e) => handleBenefitChange(idx, e)} />
                  </td>
                  <td className="px-3 py-2">
                    <InputLine label="" type="number" name="dependents" value={benefit.dependents ?? 0} onChange={(e) => handleBenefitChange(idx, e)} />
                  </td>
                  <td className="px-3 py-2">
                    <InputLine label="" name="status" value={benefit.status} onChange={(e) => handleBenefitChange(idx, e)} options={['Active','Pending','Ended']} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Tax Documents" icon={<Receipt size={18} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {taxDocs.map((doc, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <div className="flex items-center justify-between text-sm text-slate-700">
                <span className="font-semibold">{doc.type}</span>
                <span className="text-xs text-slate-500">{doc.year}</span>
              </div>
              <div className="mt-2 text-sm">
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                  doc.status === 'Ready' ? 'bg-green-50 text-green-700' :
                  doc.status === 'Filed' ? 'bg-blue-50 text-blue-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {doc.status}
                </span>
              </div>
              {doc.downloadUrl && (
                <a href={doc.downloadUrl} className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                  <Download size={14} /> Download
                </a>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Bonuses & Incentives" icon={<Gift size={18} />}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-slate-800">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Program</th>
                <th className="px-3 py-2 text-left font-semibold">Period</th>
                <th className="px-3 py-2 text-left font-semibold">Target (AED)</th>
                <th className="px-3 py-2 text-left font-semibold">Achieved (AED)</th>
                <th className="px-3 py-2 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bonuses.map((bonus, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-3 py-2">{bonus.program}</td>
                  <td className="px-3 py-2">{bonus.period}</td>
                  <td className="px-3 py-2">{currency(bonus.target)}</td>
                  <td className="px-3 py-2">{currency(bonus.achieved)}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      bonus.status === 'Paid' ? 'bg-green-50 text-green-700' :
                      bonus.status === 'Scheduled' ? 'bg-blue-50 text-blue-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {bonus.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};

export default PayrollModule;

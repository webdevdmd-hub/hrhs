import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Edit2,
  Filter,
  Plus,
  Search,
  UserMinus,
  Users,
  Trash,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import Button from '../shared/ui/Button';
import { Employee, EmployeeStatus } from '../../shared/types';
import { employeeService } from '../../shared/services/employeeService';

type FormState = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

const defaultForm: FormState = {
  employeeId: '',
  firstName: '',
  lastName: '',
  preferredName: '',
  email: '',
  personalEmail: '',
  workPhone: '',
  personalPhone: '',
  department: '',
  designation: '',
  employmentType: 'Permanent',
  employmentStatus: 'active',
  dateOfJoining: '',
  dateOfExit: '',
  managerName: '',
  location: '',
  seatingLocation: '',
  tags: '',
  presentAddress: '',
  permanentAddress: '',
  dateOfBirth: '',
  age: '',
  gender: '',
  maritalStatus: '',
  about: '',
  expertise: '',
  onboardingStatus: 'Active',
  currentExperience: '',
  totalExperience: '',
  notes: ''
};

const statusBadge = (status: EmployeeStatus) =>
  status === 'active'
    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    : 'bg-amber-50 text-amber-700 border border-amber-100';

const Field: React.FC<{
  label: string;
  name: keyof FormState;
  value?: string;
  type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}> = ({ label, name, value = '', type = 'text', onChange, required, placeholder, options }) => (
  <label className="flex flex-col gap-2 text-sm text-slate-600">
    <span className="font-semibold text-slate-700">{label}{required ? ' *' : ''}</span>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
        rows={3}
      />
    ) : (
      <input
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        type={type}
        className="rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-blue-500 focus:outline-none bg-white"
      />
    )}
  </label>
);

const EmployeesModule: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await employeeService.getAllEmployees();
        setEmployees(list);
        setSelectedEmployee(list[0] ?? null);
      } catch (err) {
        console.error('Failed to load employees', err);
        setError('Unable to load employees from Firestore. Check credentials or rules.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = search.toLowerCase();
    return employees.filter(emp => {
      const matchesSearch =
        (emp.firstName || '').toLowerCase().includes(term) ||
        (emp.lastName || '').toLowerCase().includes(term) ||
        (emp.email?.toLowerCase().includes(term)) ||
        (emp.department?.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all' ? true : emp.employmentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, search, statusFilter]);

  useEffect(() => {
    if (!selectedEmployee && filteredEmployees.length) {
      setSelectedEmployee(filteredEmployees[0]);
    } else if (selectedEmployee && !filteredEmployees.find(e => e.id === selectedEmployee.id)) {
      setSelectedEmployee(filteredEmployees[0] ?? null);
    }
  }, [filteredEmployees, selectedEmployee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSnapshotOpen = (emp: Employee) => {
    setSelectedEmployee(emp);
    setShowSnapshot(true);
    setShowDeleteConfirm(false);
  };

  const generateEmployeeId = () => {
    const random = Math.floor(100 + Math.random() * 900);
    return `EMP-${Date.now().toString().slice(-6)}-${random}`;
  };

  const handleGenerateId = () => {
    const newId = generateEmployeeId();
    setFormData(prev => ({ ...prev, employeeId: newId }));
  };

  const openModal = (emp?: Employee) => {
    setError(null);
    setShowSnapshot(false);
    setShowDeleteConfirm(false);
    if (emp) {
      const { id: _, createdAt: __, updatedAt: ___, ...rest } = emp;
      setEditingId(emp.id);
      setFormData({ ...defaultForm, ...rest });
    } else {
      setEditingId(null);
      setFormData({ ...defaultForm, employeeId: generateEmployeeId() });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const employeeIdValue = (formData.employeeId || '').trim() || generateEmployeeId();
    const payload = { ...formData, employeeId: employeeIdValue };

    try {
      if (editingId) {
        await employeeService.updateEmployee(editingId, payload);
        setEmployees(prev => prev.map(emp => (emp.id === editingId ? { ...emp, ...payload } : emp)));
        if (selectedEmployee?.id === editingId) {
          setSelectedEmployee(prev => (prev ? { ...prev, ...payload } : prev));
        }
      } else {
        const created = await employeeService.addEmployee(payload);
        setEmployees(prev => [created, ...prev]);
        setSelectedEmployee(created);
      }
      closeModal();
    } catch (err) {
      console.error('Failed to save employee', err);
      setError('Could not save employee. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (emp: Employee) => {
    const exitDate = new Date().toISOString().slice(0, 10);
    setStatusChangingId(emp.id);
    setError(null);
    try {
      if (emp.employmentStatus === 'active') {
        await employeeService.markInactive(emp.id, exitDate);
        setEmployees(prev =>
          prev.map(item =>
            item.id === emp.id
              ? { ...item, employmentStatus: 'inactive', onboardingStatus: 'Inactive', dateOfExit: exitDate }
              : item
          )
        );
        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee({ ...emp, employmentStatus: 'inactive', onboardingStatus: 'Inactive', dateOfExit: exitDate });
        }
      } else {
        await employeeService.updateEmployee(emp.id, {
          employmentStatus: 'active',
          onboardingStatus: 'Active',
          dateOfExit: ''
        });
        setEmployees(prev =>
          prev.map(item =>
            item.id === emp.id
              ? { ...item, employmentStatus: 'active', onboardingStatus: 'Active', dateOfExit: '' }
              : item
          )
        );
        if (selectedEmployee?.id === emp.id) {
          setSelectedEmployee({ ...emp, employmentStatus: 'active', onboardingStatus: 'Active', dateOfExit: '' });
        }
      }
    } catch (err) {
      console.error('Failed to update status', err);
      setError('Unable to update employee status.');
    } finally {
      setStatusChangingId(null);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;
    setIsDeleting(true);
    setError(null);
    try {
      await employeeService.deleteEmployee(selectedEmployee.id);
      setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
      setShowDeleteConfirm(false);
      setShowSnapshot(false);
      setSelectedEmployee(null);
    } catch (err) {
      console.error('Failed to delete employee', err);
      setError('Unable to delete employee. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCount = employees.filter(e => e.employmentStatus === 'active').length;
  const inactiveCount = employees.filter(e => e.employmentStatus === 'inactive').length;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Employees</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Employee Lifecycle & Records</h1>
          <p className="text-sm text-slate-500 mt-1">
            Add, edit, or offboard team members. Active vs Inactive filters make status changes clear.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:inline-flex" onClick={() => setStatusFilter('all')}>
            <Filter size={16} className="mr-2" /> Reset Filters
          </Button>
          <Button onClick={() => openModal()} className="shadow-lg shadow-blue-500/20">
            <Plus size={16} className="mr-2" /> Add Employee
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-2"><BadgeCheck size={16} className="text-emerald-500" /> Active</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-semibold">{activeCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Currently onboarded employees</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-2"><UserMinus size={16} className="text-amber-500" /> Inactive</span>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700 font-semibold">{inactiveCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Exited / offboarded employees</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Employment Roster</h2>
              <p className="text-xs text-slate-500">Filter by status or search by name/department.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'inactive'].map(val => (
              <button
                key={val}
                onClick={() => setStatusFilter(val as 'all' | EmployeeStatus)}
                className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                  statusFilter === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {val === 'all' ? 'All' : val === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-xl w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department"
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm w-full focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => openModal()}>
              <Plus size={14} className="mr-2" /> Add Employee
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Employee</th>
                <th className="px-4 py-3 text-left font-semibold">Department</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Manager</th>
                <th className="px-4 py-3 text-left font-semibold">Join Date</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>Loading employees...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>No employees found.</td></tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr
                    key={emp.id}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${selectedEmployee?.id === emp.id ? 'bg-blue-50/40' : ''}`}
                    onClick={() => handleSnapshotOpen(emp)}
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">{emp.firstName} {emp.lastName}</div>
                      <div className="text-xs text-slate-500">{emp.email || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-medium">{emp.department || '-'}</div>
                      <div className="text-xs text-slate-500">{emp.designation || '—'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(emp.employmentStatus)}`}>
                        {emp.employmentStatus === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{emp.managerName || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{emp.dateOfJoining || '-'}</td>
                    <td className="px-4 py-4 text-right space-x-1">
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300"
                        onClick={(e) => { e.stopPropagation(); openModal(emp); }}
                        aria-label="Edit employee"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                          emp.employmentStatus === 'inactive'
                            ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                        }`}
                        onClick={(e) => { e.stopPropagation(); handleStatusToggle(emp); }}
                        aria-label={emp.employmentStatus === 'inactive' ? 'Activate employee' : 'Mark employee inactive with Date of Exit'}
                        disabled={statusChangingId === emp.id}
                        title={emp.employmentStatus === 'inactive' ? 'Activate employee' : 'Mark employee inactive (sets Date of Exit)'}
                      >
                        {emp.employmentStatus === 'inactive' ? <BadgeCheck size={16} /> : <UserMinus size={16} />}
                        <span>{emp.employmentStatus === 'inactive' ? 'Activate' : 'Deactivate'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showSnapshot && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Profile Snapshot</p>
                <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</h3>
                <p className="text-sm text-slate-500 mt-1">Click any employee row to open this snapshot pop-up.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(selectedEmployee.employmentStatus)}`}>
                  {selectedEmployee.employmentStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteConfirm(true)}
                  aria-label="Delete employee"
                >
                  <Trash size={14} /> Delete
                </button>
                <button
                  className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  onClick={() => { setShowSnapshot(false); setShowDeleteConfirm(false); }}
                  aria-label="Close snapshot"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="max-h-[75vh] overflow-y-auto divide-y divide-slate-200">
              <Section title="Hierarchy Information">
                <InfoRow label="Reporting Manager" value={selectedEmployee.managerName || '-'} />
              </Section>

              <Section title="Basic Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Employee ID" value={selectedEmployee.employeeId || '-'} />
                  <InfoRow label="Preferred / Nickname" value={selectedEmployee.preferredName || '-'} />
                  <InfoRow label="Email Address" value={selectedEmployee.email || '-'} />
                  <InfoRow label="Personal Email" value={selectedEmployee.personalEmail || '-'} />
                </div>
              </Section>

              <Section title="Work Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Department" value={selectedEmployee.department || '-'} />
                  <InfoRow label="Designation" value={selectedEmployee.designation || '-'} />
                  <InfoRow label="Employment Type" value={selectedEmployee.employmentType || '-'} />
                  <InfoRow label="Employment Status" value={selectedEmployee.employmentStatus === 'active' ? 'Active' : 'Inactive'} />
                  <InfoRow label="Onboarding Status" value={selectedEmployee.onboardingStatus || '-'} />
                  <InfoRow label="Date of Joining" value={selectedEmployee.dateOfJoining || '-'} />
                  <InfoRow label="Date of Exit" value={selectedEmployee.dateOfExit || '-'} />
                  <InfoRow label="Location" value={selectedEmployee.location || '-'} />
                </div>
              </Section>

              <Section title="Contact Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Work Phone" value={selectedEmployee.workPhone || '-'} />
                  <InfoRow label="Personal Phone" value={selectedEmployee.personalPhone || '-'} />
                  <InfoRow label="Seating Location" value={selectedEmployee.seatingLocation || '-'} />
                  <InfoRow label="Tags" value={selectedEmployee.tags || '-'} />
                  <InfoRow label="Present Address" value={selectedEmployee.presentAddress || '-'} />
                  <InfoRow label="Permanent Address" value={selectedEmployee.permanentAddress || '-'} />
                </div>
              </Section>

              <Section title="Personal Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Date of Birth" value={selectedEmployee.dateOfBirth || '-'} />
                  <InfoRow label="Age" value={selectedEmployee.age || '-'} />
                  <InfoRow label="Gender" value={selectedEmployee.gender || '-'} />
                  <InfoRow label="Marital Status" value={selectedEmployee.maritalStatus || '-'} />
                  <InfoRow label="About" value={selectedEmployee.about || '-'} />
                  <InfoRow label="Ask me about / Expertise" value={selectedEmployee.expertise || '-'} />
                </div>
              </Section>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && selectedEmployee && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-3 px-6 py-5">
              <div className="rounded-full bg-red-50 p-2 text-red-600">
                <AlertTriangle size={18} />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-slate-900">Delete employee record?</h4>
                <p className="text-sm text-slate-600">
                  This will permanently remove {selectedEmployee.firstName} {selectedEmployee.lastName} from the dedicated <span className="font-semibold">employees</span> database collection. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60"
                onClick={handleDeleteEmployee}
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Add / Edit Employment Details</p>
                <h3 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Employee' : 'Add New Employee'}</h3>
                <p className="text-sm text-slate-500 mt-1">Fields mirror the employment profile cards shown in the screenshots.</p>
              </div>
              <button
                className="rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Field label="Employee ID" name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="EMP-123456-321" required />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateId}>
                      Auto-generate
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Generated IDs use timestamp + random suffix for uniqueness.</p>
                </div>
                <Field label="Employment Status" name="employmentStatus" value={formData.employmentStatus} onChange={handleChange} options={['active', 'inactive']} />
                <Field label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <Field label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <Field label="Preferred / Nickname" name="preferredName" value={formData.preferredName} onChange={handleChange} />
                <Field label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" required />
                <Field label="Personal Email" name="personalEmail" value={formData.personalEmail} onChange={handleChange} type="email" />
                <Field label="Department" name="department" value={formData.department} onChange={handleChange} placeholder="Management" />
                <Field label="Designation" name="designation" value={formData.designation} onChange={handleChange} placeholder="Administration" />
                <Field label="Employment Type" name="employmentType" value={formData.employmentType} onChange={handleChange} options={['Permanent', 'Contract', 'Intern', 'Consultant']} />
                <Field label="Onboarding Status" name="onboardingStatus" value={formData.onboardingStatus} onChange={handleChange} options={['Active', 'Inactive', 'In Progress']} />
                <Field label="Date of Joining" name="dateOfJoining" value={formData.dateOfJoining} onChange={handleChange} type="date" />
                <Field label="Date of Exit" name="dateOfExit" value={formData.dateOfExit} onChange={handleChange} type="date" />
                <Field label="Manager" name="managerName" value={formData.managerName} onChange={handleChange} placeholder="DMD WebDev 1" />
                <Field label="Location" name="location" value={formData.location} onChange={handleChange} placeholder="FL_ADMIN_4" />
                <Field label="Seating Location" name="seatingLocation" value={formData.seatingLocation} onChange={handleChange} />
                <Field label="Tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="Hybrid, HQ" />
                <Field label="Work Phone" name="workPhone" value={formData.workPhone} onChange={handleChange} />
                <Field label="Personal Phone" name="personalPhone" value={formData.personalPhone} onChange={handleChange} />
                <Field label="Present Address" name="presentAddress" value={formData.presentAddress} onChange={handleChange} />
                <Field label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} />
                <Field label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} type="date" />
                <Field label="Age" name="age" value={formData.age} onChange={handleChange} placeholder="38 years" />
                <Field label="Gender" name="gender" value={formData.gender} onChange={handleChange} options={['Male', 'Female', 'Other', 'Prefer not to say']} />
                <Field label="Marital Status" name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} options={['Single', 'Married', 'Divorced', 'Widowed']} />
                <Field label="Ask me about / Expertise" name="expertise" value={formData.expertise} onChange={handleChange} />
                <Field label="About" name="about" value={formData.about} onChange={handleChange} type="textarea" />
                <Field label="Current Experience" name="currentExperience" value={formData.currentExperience} onChange={handleChange} placeholder="10 year(s) 11 month(s)" />
                <Field label="Total Experience" name="totalExperience" value={formData.totalExperience} onChange={handleChange} placeholder="18 year(s) 9 month(s)" />
                <Field label="Notes" name="notes" value={formData.notes} onChange={handleChange} type="textarea" />
              </div>

              {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Building2 size={14} className="text-blue-600" />
                  Saved to Firestore collection <span className="font-semibold text-slate-800">employees</span>. Removing = set inactive with Date of Exit.
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={closeModal} type="button">Cancel</Button>
                  <Button type="submit" isLoading={saving}>{editingId ? 'Save Changes' : 'Create Employee'}</Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
  <div className="p-5">
    <h4 className="text-base font-semibold text-slate-800 mb-3">{title}</h4>
    <div className="space-y-3 text-sm text-slate-700">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</span>
    <span className="text-slate-800 font-semibold">{value}</span>
  </div>
);

export default EmployeesModule;

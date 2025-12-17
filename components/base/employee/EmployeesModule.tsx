import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Edit2,
  Filter,
  Plus,
  Search,
  UserMinus,
  Users,
  Trash,
  AlertTriangle,
  Loader2,
  Check
} from 'lucide-react';
import Button from '../../shared/ui/Button';
import { Employee, EmployeeStatus, EmployeeBasicDetails, EmployeeSalaryDetails, EmployeePersonalDetails, EmployeePaymentInformation, EmployeeDocumentItem, Role, User } from '../../../shared/types';
import { employeeService } from '../../../shared/services/employeeService';
import { userService } from '../../../shared/services/userService';

type FormState = {
  basicDetails: EmployeeBasicDetails;
  salaryDetails: EmployeeSalaryDetails;
  personalDetails: EmployeePersonalDetails;
  paymentInformation: EmployeePaymentInformation;
  documents: EmployeeDocumentItem[];
  employmentStatus: EmployeeStatus;
  onboardingStatus?: string;
  userId?: string;
  companyId?: string;
  companyName?: string;
  companyRoleId?: string;
  companyRoleName?: string;
};

const defaultForm: FormState = {
  basicDetails: {
    firstName: '',
    middleName: '',
    lastName: '',
    firstNameArabic: '',
    employeeId: '',
    employmentType: 'Permanent',
    dateOfJoining: '',
    confirmationDate: '',
    workEmail: '',
    mobileNumber: '',
    gender: '',
    workLocation: '',
    designation: '',
    department: '',
    portalAccessEnabled: false,
    language: 'English',
    socialSecurityGcc: true,
    originCountry: ''
  },
  salaryDetails: {
    base: 0,
    housingAllowance: 0,
    costOfLivingAllowance: 0,
    childrenAllowance: 0,
    otherAllowance: 0,
    fixedAllowance: 0,
    frequency: 'Monthly'
  },
  personalDetails: {},
  paymentInformation: {},
  documents: [],
  employmentStatus: 'pending',
  onboardingStatus: 'Incomplete Profile',
  userId: undefined,
  companyId: undefined,
  companyName: undefined,
  companyRoleId: undefined,
  companyRoleName: undefined
};

const statusBadge = (status: EmployeeStatus) => {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
  if (status === 'inactive') return 'bg-amber-50 text-amber-700 border border-amber-100';
  return 'bg-blue-50 text-blue-700 border border-blue-100';
};

const wizardSteps = [
  'Basic Details',
  'Salary Details',
  'Personal Details',
  'Payment Information',
  'Documents'
];

const calculateAge = (dobString: string): string => {
  if (!dobString) return '';
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 0 ? age.toString() : '';
};

const EmployeesModule: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | EmployeeStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [hydratingEmployees, setHydratingEmployees] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(defaultForm);
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() => Array(wizardSteps.length).fill(false));
  const [error, setError] = useState<string | null>(null);
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [statusChangingId, setStatusChangingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const earningFields = [
    { key: 'base', label: 'Basic' },
    { key: 'housingAllowance', label: 'Housing Allowance' },
    { key: 'costOfLivingAllowance', label: 'Cost of Living Allowance' },
    { key: 'childrenAllowance', label: 'Children Social Allowance' },
    { key: 'otherAllowance', label: 'Other Allowance' },
    { key: 'fixedAllowance', label: 'Fixed Allowance' },
  ] as const;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await employeeService.getAllEmployees();
        setEmployees(list);
        setSelectedEmployee(list[0] ?? null);
        await hydrateEmployees(list);
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
      const firstName = emp.basicDetails?.firstName || emp.firstName || '';
      const lastName = emp.basicDetails?.lastName || emp.lastName || '';
      const email = emp.basicDetails?.workEmail || emp.email || '';
      const department = emp.basicDetails?.department || emp.department || '';
      const status = emp.employmentStatus || 'pending';
      const matchesSearch =
        firstName.toLowerCase().includes(term) ||
        lastName.toLowerCase().includes(term) ||
        (email.toLowerCase().includes(term)) ||
        (department.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all' ? true : status === statusFilter;
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

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      basicDetails: {
        ...prev.basicDetails,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  const handlePersonalChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const ageValue = name === 'dateOfBirth' ? calculateAge(value) : undefined;
    setFormData(prev => ({
      ...prev,
      personalDetails: {
        ...prev.personalDetails,
        [name]: value,
        ...(ageValue !== undefined ? { age: ageValue } : {})
      }
    }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      paymentInformation: {
        ...prev.paymentInformation,
        [name]: value
      }
    }));
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const uploaded: EmployeeDocumentItem[] = Array.from(files as FileList).map((file: File) => ({
      name: file.name,
      url: ''
    }));
    setFormData(prev => ({
      ...prev,
      documents: [...(prev.documents || []), ...uploaded]
    }));
    e.target.value = '';
  };

  const handleSnapshotOpen = (emp: Employee) => {
    const isIncomplete = emp.employmentStatus === 'pending' || emp.onboardingStatus === 'Incomplete Profile';
    if (isIncomplete) {
      openModal(emp);
      return;
    }
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
    setFormData(prev => ({ ...prev, basicDetails: { ...prev.basicDetails, employeeId: newId } }));
  };

  const openModal = (emp?: Employee) => {
    setError(null);
    setShowSnapshot(false);
    setShowDeleteConfirm(false);
    const resetCompletion = Array(wizardSteps.length).fill(false);
    if (emp) {
      setEditingId(emp.id);
      setFormData({
        basicDetails: {
          firstName: emp.basicDetails?.firstName || emp.firstName || '',
          middleName: emp.basicDetails?.middleName || '',
          lastName: emp.basicDetails?.lastName || emp.lastName || '',
          firstNameArabic: emp.basicDetails?.firstNameArabic || '',
          employeeId: emp.basicDetails?.employeeId || emp.employeeId || '',
          employmentType: emp.basicDetails?.employmentType || emp.employmentType || 'Permanent',
          dateOfJoining: emp.basicDetails?.dateOfJoining || emp.dateOfJoining || '',
          confirmationDate: emp.basicDetails?.confirmationDate || '',
          workEmail: emp.basicDetails?.workEmail || emp.email || '',
          mobileNumber: emp.basicDetails?.mobileNumber || emp.personalPhone || '',
          gender: emp.basicDetails?.gender || emp.gender || '',
          workLocation: emp.basicDetails?.workLocation || emp.location || '',
          designation: emp.basicDetails?.designation || emp.designation || '',
          department: emp.basicDetails?.department || emp.department || '',
          portalAccessEnabled: emp.basicDetails?.portalAccessEnabled || false,
          language: emp.basicDetails?.language || 'English',
          socialSecurityGcc: emp.basicDetails?.socialSecurityGcc ?? true,
          originCountry: emp.basicDetails?.originCountry || ''
        },
        salaryDetails: emp.salaryDetails || {},
        personalDetails: emp.personalDetails || { dateOfBirth: emp.dateOfBirth, age: emp.age || calculateAge(emp.dateOfBirth || ''), maritalStatus: emp.maritalStatus, about: emp.about, expertise: emp.expertise },
        paymentInformation: emp.paymentInformation || {},
        documents: emp.documents || [],
        employmentStatus: emp.employmentStatus || 'active',
        onboardingStatus: emp.onboardingStatus || 'Active',
        userId: emp.userId,
        companyId: emp.companyId,
        companyName: emp.companyName,
        companyRoleId: emp.companyRoleId,
        companyRoleName: emp.companyRoleName
      });
      setCompletedSteps(resetCompletion);
    } else {
      setEditingId(null);
      setFormData({
        ...defaultForm,
        basicDetails: { ...defaultForm.basicDetails, employeeId: generateEmployeeId() }
      });
      setCompletedSteps(resetCompletion);
    }
    setActiveStep(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setActiveStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const isLastStep = activeStep >= wizardSteps.length - 1;
    const payload = buildPayload();

    // Finalize onboarding on last step
    if (isLastStep) {
      payload.employmentStatus = 'active';
      payload.onboardingStatus = 'Active';
      setFormData(prev => ({
        ...prev,
        employmentStatus: 'active',
        onboardingStatus: 'Active'
      }));
    }

    try {
      // Decide whether to create (only on step 0 with no existing doc) or update
      const targetId = editingId || selectedEmployee?.id || null;

      if (!targetId && activeStep > 0) {
        throw new Error("Employee record missing. Please complete Basic Details first.");
      }

      if (!targetId && activeStep === 0) {
        const created = await employeeService.addEmployee(payload);
        setEmployees(prev => [created, ...prev]);
        setSelectedEmployee(created);
        setEditingId(created.id);
        await syncUserFromEmployee({ ...payload, id: created.id } as Employee);
      } else if (targetId) {
        await employeeService.updateEmployee(targetId, payload);
        setEmployees(prev => prev.map(emp => (emp.id === targetId ? { ...emp, ...payload } : emp)));
        if (selectedEmployee?.id === targetId) {
          setSelectedEmployee(prev => (prev ? { ...prev, ...payload } : prev));
        }
        if (!editingId) setEditingId(targetId);
        await syncUserFromEmployee({ ...payload, id: targetId } as Employee);
      }
      setCompletedSteps(prev => {
        const next = [...prev];
        next[activeStep] = true;
        return next;
      });
      if (isLastStep) {
        setShowSnapshot(true);
        setIsModalOpen(false);
        setActiveStep(0);
        setEditingId(targetId || editingId || null);
        if (payload.employmentStatus === 'active' && selectedEmployee) {
          setSelectedEmployee(prev => (prev ? { ...prev, ...payload, id: targetId || prev.id } : prev));
        }
      } else {
        setActiveStep(prev => Math.min(prev + 1, wizardSteps.length - 1));
      }
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
    const currentStatus = emp.employmentStatus || 'active';
    try {
      if (currentStatus === 'active') {
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

  const totalMonthly = useMemo(() => {
    const s = formData.salaryDetails;
    return (s.base || 0) + (s.housingAllowance || 0) + (s.costOfLivingAllowance || 0) + (s.childrenAllowance || 0) + (s.otherAllowance || 0) + (s.fixedAllowance || 0);
  }, [formData.salaryDetails]);

  const totalAnnual = useMemo(() => totalMonthly * 12, [totalMonthly]);

  const hydrateEmployees = async (existingEmployees: Employee[]) => {
    setHydratingEmployees(true);
    try {
      const users = await userService.getAllUsers();
      const employeeUsers = users.filter((u: User) => (u.companyRoleSystemRole || u.role) === Role.EMPLOYEE);
      const byUserId = new Map(existingEmployees.map(emp => [emp.userId, emp]));
      const creations: Promise<Employee | null>[] = [];

      employeeUsers.forEach(user => {
        const hasRecord = user.employeeRecordId || byUserId.has(user.id);
        if (hasRecord) return;
        const employeeId = generateEmployeeId();
        const payload = {
          userId: user.id,
          companyId: user.companyId,
          companyName: user.companyName,
          companyRoleId: user.companyRoleId,
          companyRoleName: user.companyRoleName,
          employeeId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          department: user.department,
          designation: user.designation,
          employmentStatus: 'pending' as const,
          onboardingStatus: 'Incomplete Profile',
          basicDetails: {
            employeeId,
            firstName: user.firstName,
            lastName: user.lastName,
            workEmail: user.email,
            department: user.department,
            designation: user.designation,
            employmentType: 'Permanent',
            dateOfJoining: ''
          }
        };
        creations.push(
          employeeService.addEmployee(payload).then(async created => {
            await userService.updateUser(user.id, { employeeRecordId: created.id });
            return created;
          }).catch(err => {
            console.error('Failed to auto-create employee from user', user.id, err);
            return null;
          })
        );
      });

      const created = (await Promise.all(creations)).filter(Boolean) as Employee[];
      if (created.length) {
        setEmployees(prev => [...created, ...prev]);
        if (!selectedEmployee && created[0]) {
          setSelectedEmployee(created[0]);
        }
      }
    } catch (err) {
      console.error('Failed to hydrate employees from users', err);
    } finally {
      setHydratingEmployees(false);
    }
  };

  const syncUserFromEmployee = async (emp: Employee) => {
    if (!emp.userId) return;
    try {
      await userService.updateUser(emp.userId, {
        firstName: emp.firstName || emp.basicDetails?.firstName || '',
        lastName: emp.lastName || emp.basicDetails?.lastName || '',
        department: emp.department || emp.basicDetails?.department || '',
        designation: emp.designation || emp.basicDetails?.designation || '',
        status: emp.employmentStatus === 'inactive' ? 'inactive' : 'active',
        companyId: emp.companyId,
        companyName: emp.companyName,
        companyRoleId: emp.companyRoleId,
        companyRoleName: emp.companyRoleName
      });
    } catch (err) {
      console.error('Failed to sync user profile from employee update', err);
    }
  };

  const buildPayload = (): Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> => {
    const { basicDetails, salaryDetails, personalDetails, paymentInformation, documents, employmentStatus, onboardingStatus } = formData;
    return {
      userId: formData.userId,
      companyId: formData.companyId,
      companyName: formData.companyName,
      companyRoleId: formData.companyRoleId,
      companyRoleName: formData.companyRoleName,
      employeeId: basicDetails.employeeId,
      firstName: basicDetails.firstName,
      lastName: basicDetails.lastName,
      email: basicDetails.workEmail || '',
      personalPhone: basicDetails.mobileNumber,
      department: basicDetails.department,
      designation: basicDetails.designation,
      employmentType: basicDetails.employmentType,
      employmentStatus,
      dateOfJoining: basicDetails.dateOfJoining,
      dateOfExit: '',
      gender: basicDetails.gender,
      location: basicDetails.workLocation,
      onboardingStatus,
      basicDetails,
      salaryDetails,
      personalDetails,
      paymentInformation,
      documents
    };
  };

  const handleSalaryChange = (key: keyof EmployeeSalaryDetails, value: number) => {
    setFormData(prev => ({
      ...prev,
      salaryDetails: {
        ...prev.salaryDetails,
        [key]: value
      }
    }));
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
  const pendingCount = employees.filter(e => e.employmentStatus === 'pending').length;

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-2"><BadgeCheck size={16} className="text-emerald-500" /> Active</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-semibold">{activeCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Currently onboarded employees</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span className="font-semibold text-slate-700 flex items-center gap-2"><BadgeCheck size={16} className="text-blue-500" /> Onboarding</span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-semibold">{pendingCount}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Incomplete profiles awaiting completion</p>
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
            {['all', 'active', 'pending', 'inactive'].map(val => (
              <button
                key={val}
                onClick={() => setStatusFilter(val as 'all' | EmployeeStatus)}
                className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                  statusFilter === val
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {val === 'all' ? 'All' : val === 'active' ? 'Active' : val === 'pending' ? 'Onboarding' : 'Inactive'}
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
                      <div className="font-semibold text-slate-800">{emp.basicDetails?.firstName || emp.firstName} {emp.basicDetails?.lastName || emp.lastName}</div>
                      <div className="text-xs text-slate-500">{emp.basicDetails?.workEmail || emp.email || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-slate-800 font-medium">{emp.basicDetails?.department || emp.department || '-'}</div>
                      <div className="text-xs text-slate-500">{emp.basicDetails?.designation || emp.designation || '—'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(emp.employmentStatus || 'pending')}`}>
                        {emp.employmentStatus === 'active' ? 'Active' : emp.employmentStatus === 'inactive' ? 'Inactive' : 'Onboarding'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{emp.managerName || '-'}</td>
                    <td className="px-4 py-4 text-slate-700">{emp.basicDetails?.dateOfJoining || emp.dateOfJoining || '-'}</td>
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
                <h3 className="text-xl font-bold text-slate-900">{selectedEmployee.basicDetails?.firstName || selectedEmployee.firstName} {selectedEmployee.basicDetails?.lastName || selectedEmployee.lastName}</h3>
                <p className="text-sm text-slate-500 mt-1">Click any employee row to open this snapshot pop-up.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(selectedEmployee.employmentStatus || 'active')}`}>
                  {(selectedEmployee.employmentStatus || 'active') === 'active' ? 'Active' : 'Inactive'}
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
                  <InfoRow label="Employee ID" value={selectedEmployee.basicDetails?.employeeId || selectedEmployee.employeeId || '-'} />
                  <InfoRow label="Preferred / Nickname" value={selectedEmployee.preferredName || '-'} />
                  <InfoRow label="Email Address" value={selectedEmployee.basicDetails?.workEmail || selectedEmployee.email || '-'} />
                  <InfoRow label="Personal Email" value={selectedEmployee.personalEmail || '-'} />
                </div>
              </Section>

              <Section title="Work Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Department" value={selectedEmployee.basicDetails?.department || selectedEmployee.department || '-'} />
                  <InfoRow label="Designation" value={selectedEmployee.basicDetails?.designation || selectedEmployee.designation || '-'} />
                  <InfoRow label="Employment Type" value={selectedEmployee.basicDetails?.employmentType || selectedEmployee.employmentType || '-'} />
                  <InfoRow label="Employment Status" value={(selectedEmployee.employmentStatus || 'active') === 'active' ? 'Active' : 'Inactive'} />
                  <InfoRow label="Onboarding Status" value={selectedEmployee.onboardingStatus || '-'} />
                  <InfoRow label="Date of Joining" value={selectedEmployee.basicDetails?.dateOfJoining || selectedEmployee.dateOfJoining || '-'} />
                  <InfoRow label="Date of Exit" value={selectedEmployee.dateOfExit || '-'} />
                  <InfoRow label="Location" value={selectedEmployee.basicDetails?.workLocation || selectedEmployee.location || '-'} />
                </div>
              </Section>

              <Section title="Contact Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Work Phone" value={selectedEmployee.workPhone || '-'} />
                  <InfoRow label="Personal Phone" value={selectedEmployee.personalPhone || selectedEmployee.basicDetails?.mobileNumber || '-'} />
                  <InfoRow label="Seating Location" value={selectedEmployee.seatingLocation || '-'} />
                  <InfoRow label="Tags" value={selectedEmployee.tags || '-'} />
                  <InfoRow label="Present Address" value={selectedEmployee.presentAddress || '-'} />
                  <InfoRow label="Permanent Address" value={selectedEmployee.permanentAddress || '-'} />
                </div>
              </Section>

              <Section title="Personal Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <InfoRow label="Date of Birth" value={selectedEmployee.personalDetails?.dateOfBirth || selectedEmployee.dateOfBirth || '-'} />
                  <InfoRow label="Age" value={selectedEmployee.personalDetails?.age || selectedEmployee.age || '-'} />
                  <InfoRow label="Gender" value={selectedEmployee.basicDetails?.gender || selectedEmployee.gender || '-'} />
                  <InfoRow label="Marital Status" value={selectedEmployee.personalDetails?.maritalStatus || selectedEmployee.maritalStatus || '-'} />
                  <InfoRow label="About" value={selectedEmployee.personalDetails?.about || selectedEmployee.about || '-'} />
                  <InfoRow label="Ask me about / Expertise" value={selectedEmployee.personalDetails?.expertise || selectedEmployee.expertise || '-'} />
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
                  This will permanently remove {selectedEmployee.basicDetails?.firstName || selectedEmployee.firstName} {selectedEmployee.basicDetails?.lastName || selectedEmployee.lastName} from the dedicated <span className="font-semibold">employees</span> database collection. This action cannot be undone.
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
              <div className="flex flex-wrap items-center gap-3">
                {wizardSteps.map((label, idx) => {
                  const isCompleted = completedSteps[idx];
                  const isActive = idx === activeStep;
                  return (
                    <div key={label} className="flex items-center gap-2">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold ${
                        isCompleted ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                        isActive ? 'border-blue-500 text-blue-600' :
                        'border-slate-200 text-slate-500'
                      }`}>
                        {isCompleted ? <Check size={16} /> : idx + 1}
                      </div>
                      <span className={`text-sm ${isActive ? 'text-slate-900 font-semibold' : isCompleted ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>{label}</span>
                      {idx < wizardSteps.length - 1 && <div className="h-px w-10 bg-slate-200"></div>}
                    </div>
                  );
                })}
              </div>

              {activeStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">First Name *</span>
                      <input name="firstName" value={formData.basicDetails.firstName} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Last Name *</span>
                      <input name="lastName" value={formData.basicDetails.lastName} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Middle Name</span>
                      <input name="middleName" value={formData.basicDetails.middleName} onChange={handleBasicChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Employee Name (Arabic)</span>
                      <input name="firstNameArabic" value={formData.basicDetails.firstNameArabic} onChange={handleBasicChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Employment Type *</span>
                      <select name="employmentType" value={formData.basicDetails.employmentType} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
                        <option value="">Select</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                        <option value="Consultant">Consultant</option>
                      </select>
                    </label>
                    <div className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Employee ID *</span>
                      <div className="flex gap-2">
                        <input name="employeeId" value={formData.basicDetails.employeeId} onChange={handleBasicChange} required className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="EMP-123456-321" />
                        <button type="button" onClick={handleGenerateId} className="whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Auto</button>
                      </div>
                    </div>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Date of Joining *</span>
                      <input type="date" name="dateOfJoining" value={formData.basicDetails.dateOfJoining} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">Confirmation Date *</span>
                        <span className="text-xs text-slate-400">(for probation)</span>
                      </div>
                      <input type="date" name="confirmationDate" value={formData.basicDetails.confirmationDate} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Work Email *</span>
                      <input type="email" name="workEmail" value={formData.basicDetails.workEmail} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="abc@xyz.com" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Mobile Number</span>
                      <input name="mobileNumber" value={formData.basicDetails.mobileNumber} onChange={handleBasicChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Gender *</span>
                      <select name="gender" value={formData.basicDetails.gender} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Work Location *</span>
                      <input name="workLocation" value={formData.basicDetails.workLocation} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Organization address" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Designation *</span>
                      <input name="designation" value={formData.basicDetails.designation} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Designer" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Department *</span>
                      <input name="department" value={formData.basicDetails.department} onChange={handleBasicChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Marketing" />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="checkbox" name="portalAccessEnabled" checked={!!formData.basicDetails.portalAccessEnabled} onChange={handleBasicChange} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="font-semibold">Enable Portal Access</span>
                    </label>
                    <p className="text-xs text-slate-500">Allows the employee to view payslips and benefits through the portal.</p>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Employee Language</span>
                      <select name="language" value={formData.basicDetails.language} onChange={handleBasicChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
                        <option value="English">English</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </label>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <h4 className="font-semibold text-slate-800">Social Security Benefit Details *</h4>
                    <p className="text-sm text-slate-600">Tell us about the origin country to enable applicable benefits.</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="radio" name="socialSecurityGcc" value="true" checked={!!formData.basicDetails.socialSecurityGcc} onChange={() => setFormData(prev => ({ ...prev, basicDetails: { ...prev.basicDetails, socialSecurityGcc: true } }))} />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input type="radio" name="socialSecurityGcc" value="false" checked={!formData.basicDetails.socialSecurityGcc} onChange={() => setFormData(prev => ({ ...prev, basicDetails: { ...prev.basicDetails, socialSecurityGcc: false } }))} />
                        No
                      </label>
                      <label className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-700 flex-1">
                        <span className="font-semibold">Origin Country</span>
                        <input name="originCountry" value={formData.basicDetails.originCountry} onChange={handleBasicChange} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Select Origin Country" />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">Salary Components</div>
                    <div className="px-4 py-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        <span className="md:col-span-2">Earnings</span>
                        <span>Calculation Type</span>
                        <span className="text-right">Monthly Amount</span>
                      </div>
                      <div className="space-y-3">
                        {earningFields.map(field => (
                          <div key={field.key} className="grid grid-cols-1 md:grid-cols-4 items-center text-sm text-slate-800">
                            <span className="md:col-span-2">{field.label}</span>
                            <span className="text-slate-500">Fixed amount</span>
                            <div className="flex items-center justify-end">
                              <input
                                type="number"
                                step="0.01"
                                value={(formData.salaryDetails[field.key] as number | undefined) ?? 0}
                                onChange={(e) => handleSalaryChange(field.key, parseFloat(e.target.value) || 0)}
                                className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-right focus:border-blue-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-xl bg-blue-50 px-4 py-3 flex items-center justify-between text-sm font-semibold text-slate-800">
                        <span>Total Gross Pay</span>
                        <div className="flex items-center gap-6 text-right">
                          <span className="text-slate-700">AED{totalMonthly.toFixed(2)}</span>
                          <span className="text-slate-700">AED{totalAnnual.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Date of Birth *</span>
                      <input type="date" name="dateOfBirth" value={formData.personalDetails.dateOfBirth || ''} onChange={handlePersonalChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Age</span>
                      <input name="age" value={formData.personalDetails.age || ''} readOnly className="rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 text-slate-700" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Father's Name</span>
                      <input name="fatherName" value={formData.personalDetails.fatherName || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">MOL ID</span>
                      <input name="molId" value={formData.personalDetails.molId || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Personal Email Address</span>
                      <input type="email" name="personalEmail" value={formData.personalDetails.personalEmail || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="abc@xyz.com" />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h4 className="font-semibold text-slate-800">Present Residential Address</h4>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Address Line 1</span>
                      <input name="presentAddressLine1" value={formData.personalDetails.presentAddressLine1 || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Address Line 2</span>
                      <input name="presentAddressLine2" value={formData.personalDetails.presentAddressLine2 || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input name="presentCity" value={formData.personalDetails.presentCity || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="City" />
                      <input name="presentState" value={formData.personalDetails.presentState || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="State" />
                      <input name="presentCountry" value={formData.personalDetails.presentCountry || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Country" />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h4 className="font-semibold text-slate-800">Present Residential Address (Arabic)</h4>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Address Line 1</span>
                      <input name="presentAddressArabicLine1" value={formData.personalDetails.presentAddressArabicLine1 || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Address Line 2</span>
                      <input name="presentAddressArabicLine2" value={formData.personalDetails.presentAddressArabicLine2 || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                  </div>

                  <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                    <h4 className="font-semibold text-slate-800">Permanent Address</h4>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Address Line 1</span>
                      <input name="permanentAddressLine1" value={formData.personalDetails.permanentAddressLine1 || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Address Line 2</span>
                      <input name="permanentAddressLine2" value={formData.personalDetails.permanentAddressLine2 || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input name="permanentCity" value={formData.personalDetails.permanentCity || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="City" />
                      <input name="permanentState" value={formData.personalDetails.permanentState || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="State" />
                      <input name="permanentCountry" value={formData.personalDetails.permanentCountry || ''} onChange={handlePersonalChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Country" />
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex flex-col gap-1 text-sm text-slate-700">
                      <span className="font-semibold">Payment Method *</span>
                      <select name="method" value={formData.paymentInformation.method || ''} onChange={handlePaymentChange} required className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none">
                        <option value="">Select method</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Check">Check</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </label>
                    {formData.paymentInformation.method === 'Bank Transfer' && (
                      <>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span className="font-semibold">Bank Name</span>
                          <input name="bankName" value={formData.paymentInformation.bankName || ''} onChange={handlePaymentChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Bank name" />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span className="font-semibold">Account Holder Name</span>
                          <input name="accountHolderName" value={formData.paymentInformation.accountHolderName || ''} onChange={handlePaymentChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Account holder name" />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span className="font-semibold">Account Number</span>
                          <input name="accountNumber" value={formData.paymentInformation.accountNumber || ''} onChange={handlePaymentChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="Account number" />
                        </label>
                        <label className="flex flex-col gap-1 text-sm text-slate-700">
                          <span className="font-semibold">IBAN</span>
                          <input name="iban" value={formData.paymentInformation.iban || ''} onChange={handlePaymentChange} className="rounded-lg border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none" placeholder="IBAN" />
                        </label>
                      </>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Payment info saves with this employee record and will be used for payroll processing.
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-5">
                  <div className="text-lg font-semibold text-slate-900">Personal Documents</div>
                  <p className="text-sm text-slate-600">Safely upload scanned personal documents of this employee for record-keeping purposes.</p>

                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-slate-600">
                      <div className="text-2xl">⬆️</div>
                      <div className="text-sm">
                        Drag & Drop file here or{' '}
                        <label className="text-blue-600 font-semibold cursor-pointer">
                          choose file
                          <input type="file" className="hidden" multiple onChange={handleDocumentUpload} />
                        </label>
                      </div>
                      {formData.documents.length > 0 && (
                        <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                          <div className="font-semibold mb-2">Selected documents</div>
                          <div className="flex flex-wrap gap-2">
                            {formData.documents.map((doc, idx) => (
                              <span key={idx} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{doc.name}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="text-sm font-semibold text-slate-800">Don’t know where to start? You can upload documents like these</div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      {['Passport','Visa','Insurance Card','Emirates ID','Employee Contract Document','Offer Letter'].map(tag => (
                        <span key={tag} className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="rounded-lg bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 pt-4">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <Building2 size={14} className="text-blue-600" />
                  Saved to database collection <span className="font-semibold text-slate-800">employees</span>. Steps are sequential.
                </div>
                <div className="flex gap-2">
                  {activeStep > 0 && (
                    <Button variant="ghost" type="button" onClick={() => setActiveStep(prev => Math.max(prev - 1, 0))}>
                      Previous
                    </Button>
                  )}
                  <Button variant="ghost" onClick={closeModal} type="button">Cancel</Button>
                  <Button type="submit" isLoading={saving}>{activeStep >= wizardSteps.length - 1 ? 'Save' : 'Save & Continue'}</Button>
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

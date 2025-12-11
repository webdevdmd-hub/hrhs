import React, { useEffect, useMemo, useState, ChangeEvent, FormEvent } from 'react';
import { userService } from '../../shared/services/userService';
import { employmentService } from '../../shared/services/employmentService';
import { EmploymentDetails, Role, User } from '../../shared/types';
import Button from '../shared/ui/Button';
import { Search, Loader2, ShieldCheck, Sparkles, Plus } from 'lucide-react';

type EmploymentFormState = Omit<EmploymentDetails, 'createdAt' | 'updatedAt'>;
type AddUserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  role: Role;
};

const baseDetail = (userId: string, user: User): EmploymentFormState => ({
  userId,
  employeeId: '',
  nickName: '',
  jobTitle: user.designation || '',
  department: user.department || '',
  designation: user.designation || '',
  employmentType: '',
  employmentStatus: 'Active',
  hireDate: '',
  dateOfExit: '',
  sourceOfHire: '',
  location: '',
  managerName: '',
  zohoRole: '',
  currentExperience: '',
  totalExperience: '',
  dateOfBirth: '',
  age: '',
  gender: '',
  maritalStatus: '',
  about: '',
  expertise: '',
  extension: '',
  seatingLocation: '',
  tags: '',
  presentAddress: '',
  permanentAddress: '',
  workPhone: '',
  personalPhone: '',
  personalEmail: '',
  addedBy: '',
  modifiedBy: '',
  addedTime: '',
  modifiedTime: '',
  onboardingStatus: '',
  workExperienceCompany: '',
  workExperienceJobTitle: '',
  workExperienceFrom: '',
  workExperienceTo: '',
  workExperienceJobDescription: '',
  workExperienceRelevant: '',
  educationInstituteName: '',
  educationDegree: '',
  educationSpecialization: '',
  educationCompletionDate: '',
  notes: ''
});

interface EmployeeManagementProps {
  currentUser: User;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [details, setDetails] = useState<Record<string, EmploymentDetails>>({});
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<EmploymentFormState | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const emptyAddUser: AddUserFormState = {
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    designation: '',
    role: Role.USER
  };
  const [creatingNewUser, setCreatingNewUser] = useState(false);
  const [addUserForm, setAddUserForm] = useState<AddUserFormState>(emptyAddUser);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchUsers(), fetchEmploymentDetails()]);
    };
    load();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await userService.getAllUsers();
      const nonAdmins = data.filter(u => u.role !== Role.ADMIN);
      setUsers(nonAdmins);
      // hydrate option lists from user data
      const deptSet = new Set<string>();
      const desigSet = new Set<string>();
      nonAdmins.forEach(u => {
        if (u.department) deptSet.add(u.department);
        if (u.designation) desigSet.add(u.designation);
      });
      setDepartmentOptions(Array.from(deptSet));
      setDesignationOptions(Array.from(desigSet));
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch users", err);
      setError("Could not load users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchEmploymentDetails = async () => {
    try {
      setLoadingDetails(true);
      const data = await employmentService.getAll();
      const mapped: Record<string, EmploymentDetails> = {};
      data.forEach(item => {
        mapped[item.userId] = item;
      });
      setDetails(mapped);
    } catch (err) {
      console.error("Failed to fetch employment details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter(user => 
      user.firstName.toLowerCase().includes(term) ||
      user.lastName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      (user.department || '').toLowerCase().includes(term) ||
      (details[user.id]?.employeeId || '').toLowerCase().includes(term) ||
      (details[user.id]?.jobTitle || '').toLowerCase().includes(term)
    );
  }, [users, details, search]);

  const openModal = (user: User) => {
    setCreatingNewUser(false);
    const detail = details[user.id];
    setSelectedUser(user);
    setFormData(detail ? { ...baseDetail(user.id, user), ...detail } : baseDetail(user.id, user));
    setModalError(null);
    setShowModal(true);
  };

  const startAddEmployee = () => {
    const placeholder: User = {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      role: Role.USER,
      designation: '',
      department: '',
      status: 'active',
      checkInStatus: 'out'
    };
    setCreatingNewUser(true);
    setAddUserForm(emptyAddUser);
    setSelectedUser(placeholder);
    setFormData(baseDetail('new', placeholder));
    setModalError(null);
    setShowModal(true);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const next = new Set(filteredUsers.map(u => u.id));
      setSelectedIds(next);
      setSelectAll(true);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      setSelectAll(next.size === filteredUsers.length);
      return next;
    });
  };

  const handleModalChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => prev ? ({ ...prev, [name]: value } as EmploymentFormState) : prev);

    // Keep the user creation fields in sync so inputs stay controlled while typing.
    if (creatingNewUser && ['firstName', 'lastName', 'email', 'department', 'designation'].includes(name)) {
      setAddUserForm(prev => ({ ...prev, [name]: value }));
      setSelectedUser(prev => prev ? ({ ...prev, [name]: value }) : prev);
    }
  };

  const SectionCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">{title}</div>
      <div className="px-4 py-4 space-y-4">{children}</div>
    </div>
  );

  type FieldLineProps = {
    label: string;
    name?: string;
    value?: string;
    type?: string;
    placeholder?: string;
    textarea?: boolean;
    options?: string[];
    readOnly?: boolean;
    onChange?: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  };

  const underlineInputClass =
    "w-full border-0 border-b border-slate-200 bg-transparent px-0 pb-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-0 focus:shadow-none focus:border-slate-300 rounded-none";

  const FieldLine: React.FC<FieldLineProps> = ({
    label,
    name,
    value = '',
    type = 'text',
    placeholder = '',
    textarea = false,
    options,
    readOnly,
    onChange
  }) => {
    const changeHandler = !readOnly && name ? (evt: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (onChange) return onChange(evt);
      return handleModalChange(evt);
    } : undefined;

    return (
      <div className="space-y-1">
        <label className="text-sm text-slate-600">{label}</label>
        {options ? (
          <select
            name={name}
            value={value || ''}
            onChange={changeHandler}
            className={`${underlineInputClass} pr-6`}
          >
            <option value="">Select</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : textarea ? (
          <textarea
            name={name}
            value={value || ''}
            onChange={changeHandler}
            className={`${underlineInputClass} min-h-[54px]`}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value || ''}
            onChange={changeHandler}
            className={underlineInputClass}
            placeholder={placeholder}
            readOnly={readOnly}
          />
        )}
      </div>
    );
  };

  const addOption = (type: 'department' | 'designation') => {
    if (currentUser.role !== Role.ADMIN) return;
    const label = type === 'department' ? 'Department name' : 'Designation name';
    const next = prompt(`Add a new ${label}:`)?.trim();
    if (!next) return;
    if (type === 'department') {
      setDepartmentOptions(prev => prev.includes(next) ? prev : [...prev, next]);
      setFormData(prev => prev ? { ...prev, department: next } : prev);
    } else {
      setDesignationOptions(prev => prev.includes(next) ? prev : [...prev, next]);
      setFormData(prev => prev ? { ...prev, designation: next } : prev);
    }
  };

  const getNextEmployeeId = () => {
    const existingIds = Object.values(details)
      .map(d => d.employeeId)
      .filter((id): id is string => !!id);

    const maxNum = existingIds.reduce((max, id) => {
      const match = id.match(/^EMP-(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        return Math.max(max, num);
      }
      return max;
    }, 0);

    const nextNum = maxNum + 1;
    const formatted = `EMP-${String(nextNum).padStart(3, '0')}`;
    setFormData(prev => prev ? { ...prev, employeeId: formatted } : prev);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !formData) return;
    setSaving(true);
    setModalError(null);
    try {
      let userId = selectedUser.id;

      if (creatingNewUser) {
        const first = addUserForm.firstName.trim();
        const last = addUserForm.lastName.trim();
        const email = addUserForm.email.trim().toLowerCase();
        if (!first || !last || !email) {
          setModalError("Please enter first name, last name, and email for the new employee.");
          setSaving(false);
          return;
        }

        const newUser: Omit<User, "id"> = {
          firstName: first,
          lastName: last,
          email,
          role: Role.USER,
          designation: formData.designation || '',
          department: formData.department || '',
          status: 'active',
          checkInStatus: 'out'
        };

        const created = await userService.addUser(newUser);
        userId = created.id;
        setUsers(prev => [...prev, created]);
        setSelectedUser(created);
        setFormData(prev => prev ? ({ ...prev, userId }) : prev);
      }

      const payload: EmploymentDetails = { ...formData, userId };
      await employmentService.upsert(userId, payload);
      setDetails(prev => ({ ...prev, [userId]: payload }));
      await fetchUsers();
      setShowModal(false);
      setCreatingNewUser(false);
    } catch (err) {
      console.error("Failed to save employment details", err);
      setModalError("Could not save employment details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderStatusBadge = (status?: string) => {
    if (!status) return <span className="text-xs text-slate-500">Not set</span>;
    const isActive = status.toLowerCase() === 'active';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
        isActive ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20'
      }`}>
        <ShieldCheck size={12} /> {status}
      </span>
    );
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="text-lg font-semibold text-slate-800">Employee View</span>
        <button className="text-sm text-blue-600 font-semibold hover:text-blue-700">Edit</button>
        <div className="ml-auto flex items-center gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={startAddEmployee}>Add Employee(s)</Button>
          <button className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700">↔</button>
          <button className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700">🔍</button>
          <button className="h-10 w-10 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700">⋮</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search employees by name, email, role..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">Total Record Count: <span className="font-semibold text-slate-800">{filteredUsers.length}</span></div>
      </div>

      {(loadingUsers || loadingDetails) ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm text-gray-500">Loading employees...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500 font-bold tracking-wide">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={selectAll} onChange={toggleSelectAll} />
                </th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">First Name</th>
                <th className="px-4 py-3">Last Name</th>
                <th className="px-4 py-3">Nick name</th>
                <th className="px-4 py-3">Email address</th>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Zoho Role</th>
                <th className="px-4 py-3">Employment Type</th>
                <th className="px-4 py-3">Employee Status</th>
                <th className="px-4 py-3">Source of Hire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-8 text-center text-gray-500">No employees found.</td>
                </tr>
              ) : filteredUsers.map(user => {
                const detail = details[user.id];
                const selected = selectedIds.has(user.id);
                return (
                  <tr 
                    key={user.id} 
                    className="hover:bg-blue-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 accent-blue-600"
                        checked={selected}
                        onChange={() => toggleRow(user.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{detail?.employeeId || '—'}</td>
                    <td className="px-4 py-3 text-gray-900 font-semibold cursor-pointer" onClick={() => openModal(user)}>{user.firstName}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => openModal(user)}>{user.lastName || '—'}</td>
                    <td className="px-4 py-3 cursor-pointer" onClick={() => openModal(user)}>{user.firstName || '—'}</td>
                    <td className="px-4 py-3 text-blue-600 cursor-pointer" onClick={() => openModal(user)}>{user.email}</td>
                    <td className="px-4 py-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                          {user.firstName[0]}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">{detail?.department || user.department || '—'}</td>
                    <td className="px-4 py-3">{detail?.designation || user.designation || '—'}</td>
                    <td className="px-4 py-3">{user.role || '—'}</td>
                    <td className="px-4 py-3">{detail?.employmentType || '—'}</td>
                    <td className="px-4 py-3">{renderStatusBadge(detail?.employmentStatus || user.status)}</td>
                    <td className="px-4 py-3">{detail?.sourceOfHire || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-10 overflow-y-auto">
          <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200">
            {(!selectedUser || !formData) ? (
              <div className="p-10 flex items-center justify-center text-slate-500">
                <Loader2 className="animate-spin mr-3" /> Preparing form...
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold tracking-wide">Add / Edit Employment Details</p>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedUser.firstName} {selectedUser.lastName}</h2>
                    <p className="text-sm text-slate-500">{selectedUser.email}</p>
                  </div>
                  <Button variant="ghost" onClick={() => { setShowModal(false); setCreatingNewUser(false); }} className="text-slate-600">Close</Button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6 bg-slate-50">
                  {modalError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {modalError}
                    </div>
                  )}

                  <SectionCard title="Basic information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-600">Employee ID</label>
                          {currentUser.role === Role.ADMIN && (
                            <button
                              type="button"
                              onClick={getNextEmployeeId}
                              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              <Sparkles size={14} /> Generate
                            </button>
                          )}
                        </div>
                        <input
                          name="employeeId"
                          value={formData.employeeId || ''}
                          onChange={handleModalChange}
                          className={underlineInputClass}
                          placeholder="EMP-001"
                        />
                      </div>
                      <FieldLine label="Nick name" name="nickName" value={formData.nickName} placeholder="Enter nick name" />
                      <FieldLine
                        label="First Name"
                        name="firstName"
                        value={creatingNewUser ? addUserForm.firstName : selectedUser.firstName}
                        readOnly={!creatingNewUser}
                        placeholder="First name"
                      />
                      <FieldLine
                        label="Email address"
                        name="email"
                        value={creatingNewUser ? addUserForm.email : selectedUser.email}
                        readOnly={!creatingNewUser}
                        placeholder="email@example.com"
                      />
                      <FieldLine
                        label="Last Name"
                        name="lastName"
                        value={creatingNewUser ? addUserForm.lastName : selectedUser.lastName}
                        readOnly={!creatingNewUser}
                        placeholder="Last name"
                      />
                    </div>
                  </SectionCard>

                  <SectionCard title="Work Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-600">Department</label>
                          {currentUser.role === Role.ADMIN && (
                            <button type="button" onClick={() => addOption('department')} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                              <Plus size={14} /> Add
                            </button>
                          )}
                        </div>
                        <select
                          name="department"
                          value={formData.department || ''}
                          onChange={handleModalChange}
                          className={`${underlineInputClass} pr-6`}
                        >
                          <option value="">Select</option>
                          {departmentOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <FieldLine label="Role" name="zohoRole" value={formData.zohoRole} placeholder="Team member" />
                      <FieldLine label="Location" name="location" value={formData.location} placeholder="Location" />
                      <FieldLine label="Employment Type" name="employmentType" value={formData.employmentType} options={['Permanent', 'Contract', 'Intern', 'Part-time']} />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-slate-600">Designation</label>
                          {currentUser.role === Role.ADMIN && (
                            <button type="button" onClick={() => addOption('designation')} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                              <Plus size={14} /> Add
                            </button>
                          )}
                        </div>
                        <select
                          name="designation"
                          value={formData.designation || ''}
                          onChange={handleModalChange}
                          className={`${underlineInputClass} pr-6`}
                        >
                          <option value="">Select</option>
                          {designationOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <FieldLine label="Employment Status" name="employmentStatus" value={formData.employmentStatus} options={['Active', 'On Leave', 'Terminated']} />
                      <FieldLine label="Source of Hire" name="sourceOfHire" value={formData.sourceOfHire} placeholder="Referral, Web, Campus..." />
                      <FieldLine label="Date of Joining" type="date" name="hireDate" value={formData.hireDate} />
                      <FieldLine label="Current Experience" name="currentExperience" value={formData.currentExperience} placeholder="10 year(s) 11 month(s)" />
                      <FieldLine label="Total Experience" name="totalExperience" value={formData.totalExperience} placeholder="18 year(s) 9 month(s)" />
                      <div className="md:col-span-2">
                        <FieldLine label="Job Title" name="jobTitle" value={formData.jobTitle} placeholder="Job title" />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Hierarchy Information">
                    <FieldLine label="Reporting Manager" name="managerName" value={formData.managerName} placeholder="Manager name" />
                  </SectionCard>

                  <SectionCard title="Personal Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      <FieldLine label="Date of Birth" type="date" name="dateOfBirth" value={formData.dateOfBirth} />
                      <FieldLine label="Ask me about/Expertise" name="expertise" value={formData.expertise} placeholder="Expertise" />
                      <FieldLine label="Age" name="age" value={formData.age} placeholder="38 year(s) 10 month(s)" />
                      <div className="hidden md:block" aria-hidden />
                      <FieldLine label="Gender" name="gender" value={formData.gender} placeholder="Gender" />
                      <div className="hidden md:block" aria-hidden />
                      <FieldLine label="Marital Status" name="maritalStatus" value={formData.maritalStatus} placeholder="Married" />
                      <div className="hidden md:block" aria-hidden />
                      <FieldLine label="About Me" name="about" value={formData.about} textarea placeholder="Short bio" />
                    </div>
                  </SectionCard>

                  <SectionCard title="Contact Details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      <FieldLine label="Work Phone Number" name="workPhone" value={formData.workPhone} placeholder="727-555-5656" />
                      <FieldLine label="Personal Mobile Number" name="personalPhone" value={formData.personalPhone} placeholder="239-222-4633" />
                      <FieldLine label="Extension" name="extension" value={formData.extension} placeholder="5" />
                      <FieldLine label="Personal Email Address" type="email" name="personalEmail" value={formData.personalEmail} placeholder="name@example.com" />
                      <FieldLine label="Seating Location" name="seatingLocation" value={formData.seatingLocation} placeholder="FL_ADMIN_4" />
                      <FieldLine label="Tags" name="tags" value={formData.tags} placeholder="-" />
                      <div className="md:col-span-2">
                        <FieldLine label="Present Address" name="presentAddress" value={formData.presentAddress} textarea placeholder="Street, City, Country" />
                      </div>
                      <div className="md:col-span-2">
                        <FieldLine label="Permanent Address" name="permanentAddress" value={formData.permanentAddress} textarea placeholder="Street, City, Country" />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Separation Information">
                    <FieldLine label="Date of Exit" type="date" name="dateOfExit" value={formData.dateOfExit} />
                  </SectionCard>

                  <SectionCard title="System Fields">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                      <FieldLine label="Added By" name="addedBy" value={formData.addedBy} placeholder="1 - DMD - WebDev" />
                      <FieldLine label="Modified By" name="modifiedBy" value={formData.modifiedBy} placeholder="1 - DMD - WebDev" />
                      <FieldLine label="Added Time" name="addedTime" value={formData.addedTime} placeholder="07-Dec-2025 11:33 PM" />
                      <FieldLine label="Modified Time" name="modifiedTime" value={formData.modifiedTime} placeholder="07-Dec-2025 11:33 PM" />
                      <FieldLine label="Onboarding Status" name="onboardingStatus" value={formData.onboardingStatus} />
                    </div>
                  </SectionCard>

                  <SectionCard title="Work experience">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-slate-800">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">Company name</th>
                            <th className="px-3 py-2 text-left font-semibold">Job Title</th>
                            <th className="px-3 py-2 text-left font-semibold">From Date</th>
                            <th className="px-3 py-2 text-left font-semibold">To Date</th>
                            <th className="px-3 py-2 text-left font-semibold">Job Description</th>
                            <th className="px-3 py-2 text-left font-semibold">Relevant</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-slate-200">
                            <td className="px-3 py-2">
                              <input name="workExperienceCompany" value={formData.workExperienceCompany || ''} onChange={handleModalChange} className={underlineInputClass} placeholder="Company name" />
                            </td>
                            <td className="px-3 py-2">
                              <input name="workExperienceJobTitle" value={formData.workExperienceJobTitle || ''} onChange={handleModalChange} className={underlineInputClass} placeholder="Job Title" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="date" name="workExperienceFrom" value={formData.workExperienceFrom || ''} onChange={handleModalChange} className={underlineInputClass} />
                            </td>
                            <td className="px-3 py-2">
                              <input type="date" name="workExperienceTo" value={formData.workExperienceTo || ''} onChange={handleModalChange} className={underlineInputClass} />
                            </td>
                            <td className="px-3 py-2">
                              <input name="workExperienceJobDescription" value={formData.workExperienceJobDescription || ''} onChange={handleModalChange} className={underlineInputClass} placeholder="Job Description" />
                            </td>
                            <td className="px-3 py-2">
                              <input name="workExperienceRelevant" value={formData.workExperienceRelevant || ''} onChange={handleModalChange} className={underlineInputClass} placeholder="Yes / No" />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>

                  <SectionCard title="Education Details">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-slate-800">
                        <thead className="bg-slate-50 text-slate-600">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">Institute Name</th>
                            <th className="px-3 py-2 text-left font-semibold">Degree/Diploma</th>
                            <th className="px-3 py-2 text-left font-semibold">Specialization</th>
                            <th className="px-3 py-2 text-left font-semibold">Date of Completion</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-slate-200">
                            <td className="px-3 py-2">
                              <input name="educationInstituteName" value={formData.educationInstituteName || ''} onChange={handleModalChange} className={underlineInputClass} placeholder="Institute Name" />
                            </td>
                            <td className="px-3 py-2">
                              <input name="educationDegree" value={formData.educationDegree || ''} onChange={handleModalChange} className={underlineInputClass} placeholder="Degree/Diploma" />
                            </td>
                            <td className="px-3 py-2">
                              <input name="educationSpecialization" value={formData.educationSpecialization || ''} onChange={handleModalChange} className={underlineInputClass} placeholder="Specialization" />
                            </td>
                            <td className="px-3 py-2">
                              <input type="date" name="educationCompletionDate" value={formData.educationCompletionDate || ''} onChange={handleModalChange} className={underlineInputClass} />
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>All employment data is saved with the same UID as the user.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="ghost" className="text-slate-600 hover:text-slate-800" onClick={() => { setShowModal(false); setCreatingNewUser(false); }} disabled={saving}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20" isLoading={saving}>
                        Save Details
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

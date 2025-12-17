
import React, { useState, useEffect, ChangeEvent, FormEvent, useRef } from 'react';
import { MOCK_USERS } from '../../../shared/services/mockData';
import { Company, CompanyRole, Role, User } from '../../../shared/types';
import Button from '../../shared/ui/Button';
import { userService } from '../../../shared/services/userService';
import { companyService } from '../../../shared/services/companyService';
import { employeeService } from '../../../shared/services/employeeService';
import { authService } from '../../../shared/services/authService';
import { Search, Filter, Edit2, Mail, Shield, Loader2, AlertCircle, Download, Upload, RefreshCcw } from 'lucide-react';

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  department: string;
  designation: string;
  companyId: string;
  companyRoleId: string;
  role: Role;
}

const UserManagement: React.FC = () => {
  const formatRoleLabel = (role?: Role | string) => {
    switch (role) {
      case Role.CEO:
        return 'CEO';
      case Role.ADMIN:
        return 'Admin';
      case Role.MANAGER:
        return 'Manager';
      case Role.HR:
        return 'HR';
      case Role.EMPLOYEE:
      case Role.USER:
        return 'Employee';
      default:
        return role || 'Unknown';
    }
  };

  const generateEmployeeId = () => {
    const random = Math.floor(100 + Math.random() * 900);
    return `EMP-${Date.now().toString().slice(-6)}-${random}`;
  };

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const emptyForm: UserFormData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    designation: '',
    companyId: '',
    companyRoleId: '',
    role: Role.EMPLOYEE
  };
  const [formData, setFormData] = useState<UserFormData>(emptyForm);

  // Fetch users from Firebase on mount
  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'role' ? value as Role : value 
    } as UserFormData));
  };

  const handleCompanyChange = (companyId: string) => {
    setFormData(prev => ({
      ...prev,
      companyId,
      companyRoleId: '',
      role: Role.EMPLOYEE
    }));
  };

  const handleCompanyRoleChange = (roleId: string) => {
    const company = companies.find(c => c.id === formData.companyId);
    const selectedRole = company?.roles?.find(r => r.id === roleId);
    setFormData(prev => ({
      ...prev,
      companyRoleId: roleId,
      role: selectedRole?.systemRole || Role.EMPLOYEE
    }));
  };

  const resetForm = () => setFormData({ ...emptyForm });
  const clearNotices = () => {
    setImportError(null);
    setImportSuccess(null);
    setActionNotice(null);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch users", err);
      // Fallback to MOCK_USERS if firebase fails
      console.warn("Falling back to mock data.");
      setUsers(MOCK_USERS);
      
      let errorMessage = "Could not connect to database. Showing local data.";
      if (err.code === 'permission-denied') {
        errorMessage = "Permission denied. Check your Firestore Security Rules.";
      } else if (err.code === 'unavailable') {
        errorMessage = "Service unavailable. Check your internet connection.";
      } else if (err.message && err.message.includes("Service firestore is not available")) {
        errorMessage = "Firestore service not initialized properly.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const data = await companyService.getAll();
      setCompanies(data);
      setCompanyError(null);
    } catch (err) {
      console.error("Failed to fetch companies", err);
      setCompanyError("Unable to load companies. Company selection is required for new users.");
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['firstName','lastName','email','companyName','companyRoleName','role','department','designation','status','archived'];
    const rows = users.map(u => headers.map(h => {
      const v = (u as any)[h];
      return typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v ?? '';
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'users-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCsv = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!companies.length) {
      setImportError("Add at least one company before importing users.");
      return;
    }
    clearNotices();
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) throw new Error('File has no data rows.');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const required = ['firstname','lastname','email','department','designation','company','companyrole'];
      const missing = required.filter(r => !headers.includes(r));
      if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`);

      const companyByName = new Map(companies.map(c => [c.name.toLowerCase(), c]));

      let success = 0;
      let skipped = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
        if (values.length === 0 || values.every(v => !v)) { skipped++; continue; }
        const record: Record<string, string> = {};
        headers.forEach((h, idx) => record[h] = values[idx] ?? '');
        const email = (record['email'] || '').toLowerCase();
        if (!email) { skipped++; continue; }
        const password = record['password'] || 'Temp123!';
        const companyNameCell = (record['company'] || '').toLowerCase();
        const roleNameCell = (record['companyrole'] || '').toLowerCase();
        const company = companyByName.get(companyNameCell) || companies[0];
        const companyRole = company.roles?.find(r => r.name.toLowerCase() === roleNameCell) || company.roles?.[0];
        if (!company || !companyRole) { skipped++; continue; }
        const systemRole = companyRole.systemRole || Role.EMPLOYEE;
        const status = record['status'] === 'inactive' ? 'inactive' : 'active';
        try {
          const { user: authUser } = await authService.createAuthUser(email, password);
          const newUser: Omit<User, 'id'> = {
            firstName: record['firstname'] || 'First',
            lastName: record['lastname'] || 'Last',
            email,
            role: systemRole,
            department: record['department'] || '',
            designation: record['designation'] || '',
            companyId: company.id,
            companyName: company.name,
            companyRoleId: companyRole.id,
            companyRoleName: companyRole.name,
            companyRoleSystemRole: companyRole.systemRole,
            status,
            checkInStatus: 'out',
            archived: status === 'inactive' || record['archived'] === 'true'
          };
          await userService.addUserWithId(authUser.uid, newUser);
          if (systemRole === Role.EMPLOYEE) {
            const employeeId = generateEmployeeId();
            const created = await employeeService.addEmployee({
              userId: authUser.uid,
              companyId: company.id,
              companyName: company.name,
              companyRoleId: companyRole.id,
              companyRoleName: companyRole.name,
              employeeId,
              firstName: newUser.firstName,
              lastName: newUser.lastName,
              email: newUser.email,
              department: newUser.department,
              designation: newUser.designation,
              employmentStatus: 'pending',
              onboardingStatus: 'Incomplete Profile',
              basicDetails: {
                employeeId,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                workEmail: newUser.email,
                department: newUser.department,
                designation: newUser.designation,
                employmentType: 'Permanent',
                dateOfJoining: ''
              }
            });
            await userService.updateUser(authUser.uid, { employeeRecordId: created.id });
          }
          success++;
        } catch (err) {
          console.error(`Row ${i + 1} import failed`, err);
          skipped++;
        }
      }
      await fetchUsers();
      setImportSuccess(`Import complete: ${success} added, ${skipped} skipped/failed.`);
    } catch (err: any) {
      setImportError(err?.message || 'Import failed. Please check the file and try again.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasswordReset = async (user: User) => {
    clearNotices();
    setResettingUserId(user.id);
    try {
      await authService.sendPasswordReset(user.email);
      setActionNotice(`Password reset email sent to ${user.email}.`);
    } catch (err: any) {
      setActionNotice(err?.message || 'Could not send password reset.');
    } finally {
      setResettingUserId(null);
    }
  };

  const handleAddUser = async (event?: FormEvent) => {
    event?.preventDefault();
    setFormError(null);
    clearNotices();

    const trimmedFirst = formData.firstName.trim();
    const trimmedLast = formData.lastName.trim();
    const trimmedEmail = formData.email.trim().toLowerCase();
    const trimmedDept = formData.department.trim();
    const trimmedDesignation = formData.designation.trim();
    const selectedCompany = companies.find(c => c.id === formData.companyId);
    const selectedCompanyRole = selectedCompany?.roles?.find((r: CompanyRole) => r.id === formData.companyRoleId);
    const systemRole = selectedCompanyRole?.systemRole || Role.EMPLOYEE;

    const missingCore = !trimmedFirst || !trimmedLast || !trimmedEmail || !trimmedDept || !trimmedDesignation;
    const missingCompany = !formData.companyId || !formData.companyRoleId || !selectedCompany || !selectedCompanyRole;
    const missingPassword = !editingUserId && !formData.password;
    if (missingCore || missingPassword || missingCompany) {
      setFormError("Please fill in all required fields, including company and company role.");
      return;
    }

    setIsAddingUser(true);

    const newUser: Omit<User, "id"> = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: trimmedEmail,
      role: systemRole,
      designation: trimmedDesignation,
      department: trimmedDept,
      companyId: selectedCompany?.id,
      companyName: selectedCompany?.name,
      companyRoleId: selectedCompanyRole?.id,
      companyRoleName: selectedCompanyRole?.name,
      companyRoleSystemRole: selectedCompanyRole?.systemRole,
      status: 'active',
      checkInStatus: 'out'
    };

    const createEmployeeForUser = async (userId: string) => {
      if (systemRole !== Role.EMPLOYEE) return null;
      const employeeId = generateEmployeeId();
      const employeePayload = {
        userId,
        companyId: selectedCompany?.id,
        companyName: selectedCompany?.name,
        companyRoleId: selectedCompanyRole?.id,
        companyRoleName: selectedCompanyRole?.name,
        employeeId,
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
        department: trimmedDept,
        designation: trimmedDesignation,
        employmentStatus: 'pending' as const,
        onboardingStatus: 'Incomplete Profile',
        basicDetails: {
          employeeId,
          firstName: trimmedFirst,
          lastName: trimmedLast,
          workEmail: trimmedEmail,
          department: trimmedDept,
          designation: trimmedDesignation,
          employmentType: 'Permanent',
          dateOfJoining: ''
        }
      };
      const created = await employeeService.addEmployee(employeePayload);
      await userService.updateUser(userId, { employeeRecordId: created.id });
      return created;
    };

    try {
      if (editingUserId) {
        const existing = users.find(u => u.id === editingUserId);
        await userService.updateUser(editingUserId, { ...newUser, archived: false });
        if (systemRole === Role.EMPLOYEE && !(existing?.employeeRecordId)) {
          await createEmployeeForUser(editingUserId);
        }
        await fetchUsers();
        setActionNotice(`Updated ${newUser.firstName} ${newUser.lastName}.`);
        setEditingUserId(null);
        setShowAddForm(false);
        resetForm();
      } else {
        const { user: authUser } = await authService.createAuthUser(trimmedEmail, formData.password);
        await userService.addUserWithId(authUser.uid, newUser);
        await createEmployeeForUser(authUser.uid);
        await fetchUsers(); // Refresh list from DB
        resetForm();
        setShowAddForm(false);
      }
    } catch (err: any) {
      console.error("Failed to add/update user", err);

      let msg = editingUserId ? "Failed to update user." : "Failed to add user.";
      if (!editingUserId) {
        if (err.message === 'secondary-auth-unavailable') msg = "User creation is temporarily unavailable. Please refresh and try again.";
        if (err.code === 'auth/email-already-in-use') msg = "Email is already registered in Firebase Auth.";
        else if (err.code === 'auth/invalid-email') msg = "Email address is invalid.";
        else if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
      }
      if (err.code === 'permission-denied') msg = "Permission denied. Check Firestore Security Rules.";
      else if (err.message && !msg.includes(err.message)) msg = `${msg} ${err.message}`;
      setFormError(msg);
    } finally {
      setIsAddingUser(false);
    }
  };

  const searchValue = searchTerm.toLowerCase();
  const filteredUsers = users.filter(user => {
    const companyName = (user.companyName || '').toLowerCase();
    const companyRoleName = (user.companyRoleName || '').toLowerCase();
    return (
      user.firstName.toLowerCase().includes(searchValue) ||
      user.lastName.toLowerCase().includes(searchValue) ||
      user.email.toLowerCase().includes(searchValue) ||
      companyName.includes(searchValue) ||
      companyRoleName.includes(searchValue)
    );
  });

  const selectedCompany = companies.find(c => c.id === formData.companyId);
  const availableCompanyRoles = selectedCompany?.roles || [];
  const selectedCompanyRole = availableCompanyRoles.find(r => r.id === formData.companyRoleId);

  const startEditUser = (user: User) => {
    clearNotices();
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      department: user.department || '',
      designation: user.designation || '',
      companyId: user.companyId || '',
      companyRoleId: user.companyRoleId || '',
      role: user.companyRoleSystemRole || user.role || Role.EMPLOYEE
    });
    setEditingUserId(user.id);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    resetForm();
    setShowAddForm(false);
    setEditingUserId(null);
    clearNotices();
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employee access, roles, and profiles.</p>
          {(error || importError || importSuccess || actionNotice) && (
            <div className="mt-3 space-y-2">
              {error && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-sm text-orange-700 border border-orange-200">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}
              {importError && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
                  <AlertCircle size={16} />
                  <span>{importError}</span>
                </div>
              )}
              {importSuccess && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 border border-green-200">
                  <AlertCircle size={16} />
                  <span>{importSuccess}</span>
                </div>
              )}
              {actionNotice && (
                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 border border-blue-200">
                  <AlertCircle size={16} />
                  <span>{actionNotice}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportCsv} />
          <Button 
            variant="outline"
            size="md"
            className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            <Upload size={16} /> Import CSV
          </Button>
          <Button 
            variant="outline" 
            size="md" 
            className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
            onClick={handleExportCsv}
          >
            <Download size={16} /> Export CSV
          </Button>
          <Button 
            size="md" 
            className="w-full sm:w-auto shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowAddForm(prev => !prev)}
            type="button"
          >
            {showAddForm ? (editingUserId ? 'Cancel Edit' : 'Close Add Form') : '+ Add Team Member'}
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Add new member</h2>
          <p className="text-sm text-gray-500 mb-4">Creates a Firebase Auth user and stores their profile in Firestore.</p>
          {formError && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Alex"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Morgan"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email (Auth)</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="alex@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Password (Auth)</label>
                <input 
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="••••••••"
                  required={!editingUserId}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Company *</label>
                <select
                  name="companyId"
                  value={formData.companyId}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  disabled={companiesLoading || !companies.length}
                >
                  <option value="">{companiesLoading ? 'Loading companies...' : 'Select company'}</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
                {companyError && <p className="text-xs text-orange-600">{companyError}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Company Role *</label>
                <select
                  name="companyRoleId"
                  value={formData.companyRoleId}
                  onChange={(e) => handleCompanyRoleChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  disabled={!formData.companyId || availableCompanyRoles.length === 0}
                >
                  <option value="">{formData.companyId ? 'Select company role' : 'Choose company first'}</option>
                  {availableCompanyRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  System access: {formatRoleLabel(selectedCompanyRole?.systemRole) || 'Employee'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input 
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Marketing"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input 
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Associate"
                  required
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10" isLoading={isAddingUser}>
                {editingUserId ? 'Update User' : 'Create User'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="text-gray-600" 
                onClick={cancelForm}
                disabled={isAddingUser}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-12">
        <div className="relative sm:col-span-8 lg:col-span-9">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name, email, or role..." 
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm font-medium placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:col-span-4 lg:col-span-3">
           <Button variant="outline" className="w-full h-full flex items-center justify-center gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
             <Filter size={18} /> <span>Filter Users</span>
           </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm text-gray-500">Loading users...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile & Tablet View: Cards (Visible up to lg) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full py-10 text-center text-gray-500">No users found.</div>
            ) : filteredUsers.map((user) => {
              const effectiveRole = user.companyRoleSystemRole || user.role;
              const roleLabel = formatRoleLabel(effectiveRole);
              const roleClass = effectiveRole === Role.ADMIN || effectiveRole === Role.CEO
                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                : effectiveRole === Role.MANAGER
                ? 'bg-orange-50 text-orange-700 border border-orange-100'
                : 'bg-blue-50 text-blue-700 border border-blue-100';

              return (
              <div key={user.id} className="group relative bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-200/50 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-gray-100 p-0.5 overflow-hidden ring-2 ring-white shadow-sm">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover rounded-[14px]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600 font-bold text-lg rounded-[14px]">
                          {user.firstName[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{user.firstName} {user.lastName}</h3>
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail size={12} /> {user.email}
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-400 p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => handlePasswordReset(user)} title="Send password reset">
                    <RefreshCcw size={18} />
                  </button>
                </div>
                
                <div className="mt-5 flex flex-wrap gap-2">
                  {user.companyName && (
                    <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700 border border-gray-200">
                      {user.companyName}
                    </span>
                  )}
                  {user.companyRoleName && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                      <Shield size={12} /> {user.companyRoleName}
                    </span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${roleClass}`}>
                    <Shield size={12} /> {roleLabel}
                  </span>
                  <span className="inline-flex items-center rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100">
                    {user.department}
                  </span>
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium 
                    ${user.status === 'active' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100 flex gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 disabled:opacity-50" 
                    onClick={() => handlePasswordReset(user)}
                    disabled={resettingUserId === user.id}
                  >
                      {resettingUserId === user.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200" onClick={() => startEditUser(user)}>
                      <Edit2 size={16} />
                  </Button>
                </div>
              </div>
            )})}
          </div>

          {/* Desktop View: Table (Visible lg+) */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-5">Employee</th>
                  <th className="px-6 py-5">Company</th>
                  <th className="px-6 py-5">Role & Dept</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5">Last Activity</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      No users found. Try adding a new team member.
                    </td>
                  </tr>
                ) : filteredUsers.map((user) => {
                  const effectiveRole = user.companyRoleSystemRole || user.role;
                  const roleLabel = formatRoleLabel(effectiveRole);
                  const roleClass = effectiveRole === Role.ADMIN || effectiveRole === Role.CEO
                    ? 'bg-purple-100 text-purple-700'
                    : effectiveRole === Role.MANAGER
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-blue-100 text-blue-700';
                  return (
                  <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-gray-100 p-0.5 ring-1 ring-gray-200">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover rounded-[10px]" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-blue-50 text-blue-600 font-bold rounded-[10px]">
                              {user.firstName[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={10}/> {user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-gray-900">{user.companyName || '—'}</span>
                        {user.companyRoleName && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-100">
                            <Shield size={12} /> {user.companyRoleName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleClass}`}>
                            {roleLabel}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{user.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium 
                        ${user.status === 'active' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/10' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-500/10'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        {user.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                      {user.lastCheckIn ? (
                        <span>Checked in today<br/><span className="text-gray-400">9:02 AM</span></span>
                      ) : (
                        <span className="text-orange-500 font-medium">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50" 
                          onClick={() => handlePasswordReset(user)} 
                          title="Send password reset"
                          disabled={resettingUserId === user.id}
                        >
                          {resettingUserId === user.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                        </button>
                        <button className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" onClick={() => startEditUser(user)} title="Edit user">
                          <Edit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            <div className="border-t border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Showing <span className="text-gray-900 font-bold">{filteredUsers.length}</span> employees</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled className="bg-white">Previous</Button>
                <Button variant="outline" size="sm" className="bg-white">Next</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;

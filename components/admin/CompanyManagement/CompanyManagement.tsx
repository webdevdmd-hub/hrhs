import React, { useEffect, useMemo, useState } from 'react';
import { Building2, Mail, MapPin, Phone, Plus, Shield, X, Pencil, Loader2 } from 'lucide-react';
import Button from '../../shared/ui/Button';
import { Company, CompanyRole, Role } from '../../../shared/types';
import { companyService } from '../../../shared/services/companyService';

type CompanyFormState = {
  name: string;
  legalName: string;
  registrationNumber: string;
  taxId: string;
  industry: string;
  status: 'active' | 'inactive';
  primaryContact: { name: string; email: string; phone: string; };
  addresses: {
    type?: string;
    line1: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }[];
  roles: CompanyRole[];
};

const emptyAddress = {
  type: 'HQ',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: ''
};

const emptyForm: CompanyFormState = {
  name: '',
  legalName: '',
  registrationNumber: '',
  taxId: '',
  industry: '',
  status: 'active',
  primaryContact: { name: '', email: '', phone: '' },
  addresses: [emptyAddress],
  roles: []
};

const CompanyManagement: React.FC = () => {
  const formatSystemRole = (role?: Role) => {
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
        return role || '';
    }
  };

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [roleDraft, setRoleDraft] = useState<{ name: string; description: string; systemRole?: Role }>({
    name: '',
    description: '',
    systemRole: undefined
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await companyService.getAll();
        setCompanies(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load companies', err);
        setError('Unable to load companies right now.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => ({
    total: companies.length,
    active: companies.filter(c => c.status !== 'inactive').length,
    roles: companies.reduce((acc, c) => acc + (c.roles?.length || 0), 0)
  }), [companies]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setRoleDraft({ name: '', description: '', systemRole: undefined });
  };

  const startEdit = (company: Company) => {
    setEditingId(company.id);
    setForm({
      name: company.name || '',
      legalName: company.legalName || '',
      registrationNumber: company.registrationNumber || '',
      taxId: company.taxId || '',
      industry: company.industry || '',
      status: company.status || 'active',
      primaryContact: {
        name: company.primaryContact?.name || '',
        email: company.primaryContact?.email || '',
        phone: company.primaryContact?.phone || ''
      },
      addresses: company.addresses && company.addresses.length ? company.addresses : [emptyAddress],
      roles: company.roles || []
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addRole = () => {
    const trimmed = roleDraft.name.trim();
    if (!trimmed) return;
    setForm(prev => ({
      ...prev,
      roles: [
        ...prev.roles,
        {
          id: crypto.randomUUID(),
          name: trimmed,
          description: roleDraft.description.trim(),
          systemRole: roleDraft.systemRole
        }
      ]
    }));
    setRoleDraft({ name: '', description: '', systemRole: undefined });
  };

  const removeRole = (id: string) => {
    setForm(prev => ({ ...prev, roles: prev.roles.filter(r => r.id !== id) }));
  };

  const handleSave = async () => {
    const trimmedName = form.name.trim();
    const contactName = form.primaryContact.name.trim();
    const contactEmail = form.primaryContact.email.trim();
    if (!trimmedName || !contactName || !contactEmail) {
      setError('Company name and primary contact (name + email) are required.');
      return;
    }
    if (!form.roles.length) {
      setError('Add at least one role for this company.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      name: trimmedName,
      primaryContact: {
        name: contactName,
        email: contactEmail,
        phone: form.primaryContact.phone.trim()
      },
      roles: form.roles.map(r => ({
        ...r,
        id: r.id || crypto.randomUUID(),
        name: r.name.trim(),
        description: r.description?.trim() || undefined
      }))
    } as Omit<Company, "id" | "createdAt" | "updatedAt">;

    try {
      if (editingId) {
        await companyService.update(editingId, payload);
        setCompanies(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c));
      } else {
        const created = await companyService.create(payload);
        setCompanies(prev => [...prev, created]);
      }
      resetForm();
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save company', err);
      setError('Unable to save company. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Company Management</h1>
          <p className="text-sm text-gray-500 mt-1">Source of truth for companies, addresses, and company-specific roles.</p>
          {error && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
              <Shield size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            onClick={() => setShowForm(prev => !prev)}
          >
            {showForm ? 'Close' : (
              <span className="inline-flex items-center gap-2">
                <Plus size={16} /> Add Company
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Total Companies</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Active</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.active}</div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-gray-500">Roles Defined</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{stats.roles}</div>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Company' : 'Add New Company'}</h2>
              <p className="text-sm text-gray-500">Define company profile, contact, address, and roles.</p>
            </div>
            <Button variant="ghost" className="text-gray-500" onClick={() => { resetForm(); setShowForm(false); }}>
              <X size={16} /> Close
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  placeholder="Acme Holdings"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Legal Name</label>
                  <input
                    value={form.legalName}
                    onChange={e => setForm(prev => ({ ...prev, legalName: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Acme Holdings LLC"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Industry</label>
                  <input
                    value={form.industry}
                    onChange={e => setForm(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Technology"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Registration #</label>
                  <input
                    value={form.registrationNumber}
                    onChange={e => setForm(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="REG-12345"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Tax ID</label>
                  <input
                    value={form.taxId}
                    onChange={e => setForm(prev => ({ ...prev, taxId: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="TAX-9876"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Primary Contact *</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    value={form.primaryContact.name}
                    onChange={e => setForm(prev => ({ ...prev, primaryContact: { ...prev.primaryContact, name: e.target.value } }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="Name"
                  />
                  <input
                    value={form.primaryContact.email}
                    onChange={e => setForm(prev => ({ ...prev, primaryContact: { ...prev.primaryContact, email: e.target.value } }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="contact@company.com"
                  />
                  <input
                    value={form.primaryContact.phone}
                    onChange={e => setForm(prev => ({ ...prev, primaryContact: { ...prev.primaryContact, phone: e.target.value } }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    placeholder="+1 555 0100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      value={form.addresses[0]?.type || ''}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        addresses: [{ ...prev.addresses[0], type: e.target.value }]
                      }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Type (HQ, Billing)"
                    />
                    <input
                      value={form.addresses[0]?.line1 || ''}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        addresses: [{ ...prev.addresses[0], line1: e.target.value }]
                      }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Address line 1"
                    />
                    <input
                      value={form.addresses[0]?.line2 || ''}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        addresses: [{ ...prev.addresses[0], line2: e.target.value }]
                      }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Address line 2"
                    />
                    <input
                      value={form.addresses[0]?.city || ''}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        addresses: [{ ...prev.addresses[0], city: e.target.value }]
                      }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="City"
                    />
                    <input
                      value={form.addresses[0]?.state || ''}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        addresses: [{ ...prev.addresses[0], state: e.target.value }]
                      }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="State/Province"
                    />
                    <input
                      value={form.addresses[0]?.postalCode || ''}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        addresses: [{ ...prev.addresses[0], postalCode: e.target.value }]
                      }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Postal Code"
                    />
                    <input
                      value={form.addresses[0]?.country || ''}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        addresses: [{ ...prev.addresses[0], country: e.target.value }]
                      }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Roles for this company *</h3>
                <span className="text-xs text-gray-500">{form.roles.length} defined</span>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={roleDraft.name}
                      onChange={e => setRoleDraft(prev => ({ ...prev, name: e.target.value }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Role name (e.g., Company Admin)"
                    />
                  <select
                    value={roleDraft.systemRole || ''}
                    onChange={e => setRoleDraft(prev => ({
                      ...prev,
                      systemRole: e.target.value ? e.target.value as Role : undefined
                    }))}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="">System access (optional)</option>
                    <option value={Role.CEO}>CEO</option>
                    <option value={Role.ADMIN}>Admin</option>
                    <option value={Role.MANAGER}>Manager</option>
                    <option value={Role.HR}>HR</option>
                    <option value={Role.EMPLOYEE}>Employee</option>
                  </select>
                    <input
                      value={roleDraft.description}
                      onChange={e => setRoleDraft(prev => ({ ...prev, description: e.target.value }))}
                      className="sm:col-span-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Short description or permissions"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      onClick={addRole}
                      type="button"
                    >
                      Add Role
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {form.roles.length === 0 && (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-500">
                      No roles added yet.
                    </div>
                  )}
                  {form.roles.map(role => (
                    <div
                      key={role.id}
                      className="flex items-start justify-between rounded-xl border border-gray-200 bg-white px-3 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{role.name}</span>
                          {role.systemRole && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                              <Shield size={12} /> {formatSystemRole(role.systemRole)}
                            </span>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRole(role.id)}
                        className="text-gray-400 hover:text-red-500 rounded-lg p-1"
                        aria-label="Remove role"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/10"
              isLoading={saving}
            >
              {editingId ? 'Update Company' : 'Create Company'}
            </Button>
            <Button variant="ghost" className="text-gray-600" onClick={resetForm} disabled={saving}>
              Reset
            </Button>
          </div>
        </div>
      )}

      {/* Company list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {companies.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
              No companies yet. Click “Add Company” to create the first one.
            </div>
          )}
          {companies.map(company => (
            <div key={company.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">{company.name}</h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${company.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {company.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {company.industry && <p className="text-xs text-gray-500">{company.industry}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(company)}
                  className="rounded-lg bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 border border-gray-200"
                >
                  <Pencil size={14} className="inline mr-1" /> Edit
                </button>
              </div>

              <div className="mt-3 space-y-2 text-sm text-gray-700">
                {company.primaryContact?.name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={14} /> {company.primaryContact.name} {company.primaryContact.email ? `· ${company.primaryContact.email}` : ''}
                  </div>
                )}
                {company.primaryContact?.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} /> {company.primaryContact.phone}
                  </div>
                )}
                {company.addresses?.[0]?.line1 && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin size={14} className="mt-0.5" />
                    <div>
                      <div>{company.addresses[0].line1}</div>
                      {company.addresses[0].city && (
                        <div className="text-xs text-gray-500">{company.addresses[0].city}{company.addresses[0].country ? `, ${company.addresses[0].country}` : ''}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">Company Roles</span>
                  <span className="text-[11px] text-gray-500">{company.roles?.length || 0} roles</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(company.roles || []).map(role => (
                    <span key={role.id} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                      {role.systemRole && <Shield size={12} className="text-blue-500" />}
                      {role.name}
                      {role.systemRole && <span className="text-[10px] text-gray-500">· {formatSystemRole(role.systemRole)}</span>}
                    </span>
                  ))}
                  {(company.roles || []).length === 0 && (
                    <span className="text-xs text-gray-500">No roles defined.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;

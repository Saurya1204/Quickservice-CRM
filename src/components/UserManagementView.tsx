'use client';

import React, { useState, useEffect } from 'react';
import PincodeField from '@/components/common/PincodeLookup';

interface UserManagementProps {
  initialMode?: 'createUser' | 'updateUser' | string;
  currentUser?: any;
}

export default function UserManagementView({ initialMode = 'createUser', currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const initialForm = {
    role: 'Super Admin',
    roleId: '',
    reportingTo: '',
    assignedZone: 'All',
    assignedBranch: '',
    assignedArea: '',
    branch: '',
    categoryClientRegion: '',
    name: '',
    address: '',
    landmark: '',
    pincode: '',
    state: '',
    district: '',
    city: '',
    locality: '',
    mobile: '',
    email: '',
    username: '',
    password: '',
    rePassword: '',
    status: 'ACTIVE',
  };

  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const [branchRes, rolesRes] = await Promise.all([
        fetch('/api/masters/branches'),
        fetch('/api/roles'),
      ]);
      const branchJson = await branchRes.json();
      const rolesJson = await rolesRes.json();

      if (branchJson.success) setBranches(branchJson.data || []);
      if (rolesJson.success) setRoles(rolesJson.data || []);
    } catch (e) {
      console.error('Failed to load dropdown data:', e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData(initialForm);
    setEditingUserId(null);
    setMessage(null);
  };

  const handleLocationFound = (loc: { state: string; district: string; city: string; locality: string }) => {
    setFormData((prev) => ({
      ...prev,
      state: loc.state,
      district: loc.district,
      city: loc.city,
      locality: loc.locality,
      assignedArea: prev.assignedArea || loc.city,
    }));
  };

  const handleEdit = (u: any) => {
    setEditingUserId(u._id);
    setFormData({
      role: u.role || 'Super Admin',
      roleId: u.roleId || '',
      reportingTo: u.reportingTo || '',
      assignedZone: u.assignedZone || 'All',
      assignedBranch: u.assignedBranch || u.branch || '',
      assignedArea: u.assignedArea || '',
      branch: u.branch || u.assignedBranch || '',
      categoryClientRegion: u.categoryClientRegion || '',
      name: u.fullName || '',
      address: u.address || '',
      landmark: u.landmark || '',
      pincode: u.pincode || '',
      state: u.state || '',
      district: u.district || '',
      city: u.city || '',
      locality: u.locality || '',
      mobile: u.mobile || '',
      email: u.email || '',
      username: u.username || '',
      password: '',
      rePassword: '',
      status: u.status || 'ACTIVE',
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (id: string, uname: string) => {
    if (uname === 'admin') {
      alert('Primary admin account cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${uname}"?`)) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
        setMessage({ type: 'success', text: `User ${uname} deleted.` });
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.username.trim()) {
      setMessage({ type: 'error', text: 'Username is required.' });
      return;
    }
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Full Name is required.' });
      return;
    }

    if (!editingUserId) {
      if (!formData.password) {
        setMessage({ type: 'error', text: 'Password is required for new user.' });
        return;
      }
      if (formData.password !== formData.rePassword) {
        setMessage({ type: 'error', text: 'Passwords do not match.' });
        return;
      }
    } else {
      if (formData.password && formData.password !== formData.rePassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        fullName: formData.name,
        role: formData.role,
        roleId: formData.roleId || undefined,
        reportingTo: formData.reportingTo,
        assignedZone: formData.assignedZone,
        assignedBranch: formData.assignedBranch,
        assignedArea: formData.assignedArea,
        branch: formData.assignedBranch,
        address: formData.address,
        landmark: formData.landmark,
        pincode: formData.pincode,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        locality: formData.locality,
        mobile: formData.mobile,
        email: formData.email,
        status: formData.status,
        updatedBy: currentUser?.fullName || 'Super Admin',
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUserId) {
        payload.id = editingUserId;
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: 'User details updated successfully!' });
          handleReset();
          fetchUsers();
        } else {
          setMessage({ type: 'error', text: json.message });
        }
      } else {
        payload.username = formData.username.trim();
        payload.createdBy = currentUser?.fullName || 'Super Admin';
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: 'User created successfully with assigned role & scope!' });
          handleReset();
          fetchUsers();
        } else {
          setMessage({ type: 'error', text: json.message });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mobile?.includes(searchTerm) ||
      u.assignedBranch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-8">
      {/* 1. User Creation/Edit Card */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-slate-200">
              {editingUserId ? `Edit User: ${formData.username}` : 'Create New User with Role & Scope'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Provision user accounts, assign dynamic roles from Role Master, and configure organizational scopes
            </p>
          </div>
          {editingUserId && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-mono">
              Editing: {formData.username}
            </span>
          )}
        </div>

        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section 1: Role, Reporting & Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-emerald-500/20 pb-1">
              1. Role & Reporting Hierarchy
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => {
                    const selName = e.target.value;
                    const r = roles.find((item) => item.name === selName);
                    setFormData({
                      ...formData,
                      role: selName,
                      roleId: r ? r._id : '',
                      reportingTo: r?.reportingTo || formData.reportingTo,
                    });
                  }}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name} (Level {r.hierarchyLevel} - {r.code})
                    </option>
                  ))}
                  {roles.length === 0 && (
                    <>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="HOD">HOD</option>
                      <option value="ZSM">ZSM</option>
                      <option value="BSM">BSM</option>
                      <option value="ASM">ASM</option>
                      <option value="CCO">CCO</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Reports To</label>
                <input
                  type="text"
                  placeholder="e.g. ZSM North / Super Admin"
                  value={formData.reportingTo}
                  onChange={(e) => setFormData({ ...formData, reportingTo: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Organizational & Geographical Scope */}
          <div className="space-y-3 pt-3 border-t border-[#334155]">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
              2. Organizational Scope & Geographic Assignment
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Zone / Region</label>
                <select
                  value={formData.assignedZone}
                  onChange={(e) => setFormData({ ...formData, assignedZone: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="All">All Zones (National)</option>
                  <option value="North">North Zone</option>
                  <option value="South">South Zone</option>
                  <option value="East">East Zone</option>
                  <option value="West">West Zone</option>
                  <option value="Central">Central Zone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Branch</label>
                <select
                  value={formData.assignedBranch}
                  onChange={(e) => setFormData({ ...formData, assignedBranch: e.target.value, branch: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All Branches / Non-Branch Specific</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b.branchName}>
                      {b.branchName} ({b.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Area / Territory</label>
                <input
                  type="text"
                  placeholder="e.g. Ghaziabad / Indirapuram Area"
                  value={formData.assignedArea}
                  onChange={(e) => setFormData({ ...formData, assignedArea: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Personal & Address Details with Automatic PIN Code Lookup */}
          <div className="space-y-3 pt-3 border-t border-[#334155]">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
              3. Personal Details & Address (Automatic PIN Code Lookup)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email ID</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@quickserves.com"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="House/Plot No, Street, Landmark"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PIN Code (Auto-Fetches City, State, District)
                </label>
                <PincodeField
                  pincode={formData.pincode}
                  onPincodeChange={(pin) => setFormData((prev) => ({ ...prev, pincode: pin }))}
                  onLocationFound={handleLocationFound}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">State (Auto)</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">District (Auto)</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">City (Auto)</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Locality (Auto)</label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  placeholder="Locality"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Login Credentials */}
          <div className="space-y-3 pt-3 border-t border-[#334155]">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-1">
              4. System Authentication Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">User Name *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUserId}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username (e.g. zsm_north)"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {editingUserId ? 'New Password (Leave blank to keep)' : 'Password *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter Password"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={formData.rePassword}
                  onChange={(e) => setFormData({ ...formData, rePassword: e.target.value })}
                  placeholder="Re-Enter Password"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-[#334155]">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition font-medium shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {saving ? 'Persisting...' : editingUserId ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. User Directory Table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#334155] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Authorized CRM User Directory</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {users.length} Users
              </span>
            </h3>
            <p className="text-xs text-slate-400">Manage user status, inspect assigned roles & scopes</p>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search user, name, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#172033] border border-[#334155] text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-emerald-500 w-48"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-[#172033] border border-[#334155] text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-none"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r._id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#334155]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                <tr>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Assigned Zone</th>
                  <th className="px-4 py-3">Assigned Branch</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-[#1e2a3e]/50 transition">
                    <td className="px-4 py-3 font-mono text-emerald-400 font-semibold">{u.username}</td>
                    <td className="px-4 py-3 text-white font-medium">{u.fullName}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded text-[11px] font-medium">
                        {u.role || 'Super Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.assignedZone || 'All'}</td>
                    <td className="px-4 py-3 text-slate-300">{u.assignedBranch || u.branch || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{u.mobile || u.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded border border-slate-700 transition"
                      >
                        Edit
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id, u.username)}
                          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded border border-rose-500/20 transition"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';

interface UserManagementProps {
  initialMode?: 'createUser' | 'updateUser' | string;
}

export default function UserManagementView({ initialMode = 'createUser' }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const initialForm = {
    role: '',
    branch: '',
    categoryClientRegion: '',
    name: '',
    address: '',
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
      const [branchRes, catRes] = await Promise.all([
        fetch('/api/masters/branches'),
        fetch('/api/masters/categories'),
      ]);
      const branchJson = await branchRes.json();
      const catJson = await catRes.json();
      if (branchJson.success) setBranches(branchJson.data || []);
      if (catJson.success) setCategories(catJson.data || []);
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

  const handleEdit = (u: any) => {
    setEditingUserId(u._id);
    setFormData({
      role: u.role || '',
      branch: u.branch || '',
      categoryClientRegion: u.categoryClientRegion || '',
      name: u.fullName || '',
      address: u.address || '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.username.trim()) {
      setMessage({ type: 'error', text: 'User Name is required.' });
      return;
    }
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required.' });
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
      if (editingUserId) {
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingUserId,
            fullName: formData.name,
            role: formData.role || 'Super Admin',
            branch: formData.branch,
            categoryClientRegion: formData.categoryClientRegion,
            address: formData.address,
            mobile: formData.mobile,
            email: formData.email,
            password: formData.password || undefined,
            status: formData.status,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: 'User updated successfully!' });
          handleReset();
          fetchUsers();
        } else {
          setMessage({ type: 'error', text: json.message });
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
            fullName: formData.name,
            role: formData.role || 'Super Admin',
            branch: formData.branch,
            categoryClientRegion: formData.categoryClientRegion,
            address: formData.address,
            mobile: formData.mobile,
            email: formData.email,
            status: formData.status,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: 'User created successfully!' });
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `User "${name}" deleted successfully.` });
        fetchUsers();
      } else {
        setMessage({ type: 'error', text: json.message });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }
  };

  return (
    <div className="space-y-8">
      {/* New User Form matching Screenshot 4 */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-slate-200">
              {editingUserId ? 'Edit User Details' : 'New User'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Create and manage authorized CRM personnel and assign operational branches
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Row 1: Role & Branch */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">----Select----</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Branch Manager">Branch Manager</option>
                <option value="Franchise Admin">Franchise Admin</option>
                <option value="CCO">Call Center Operator (CCO)</option>
                <option value="Technician">Technician</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Branch</label>
              <select
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">----Select----</option>
                {branches.map((b) => (
                  <option key={b._id} value={b.branchName}>
                    {b.branchName} ({b.branchCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Row 2: Category/Client/Region */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category/Client/Region</label>
              <select
                value={formData.categoryClientRegion}
                onChange={(e) => setFormData({ ...formData, categoryClientRegion: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">----Select----</option>
                {categories.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {/* Optional secondary field or spacer */}
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            {/* Row 3: Name & Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Residential / Branch Address"
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>

            {/* Row 4: Mob. No. & Mail_ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mob. No.</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mail_ID</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@quickserves.com"
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>

            {/* Row 5: User Name & Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">User Name *</label>
              <input
                type="text"
                required
                disabled={!!editingUserId}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g. admin"
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white disabled:opacity-60 focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {editingUserId ? 'Password (Leave blank to keep existing)' : 'Password *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••"
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>

            {/* Row 6: Re Enter Password */}
            <div className="md:col-start-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Re Enter Password</label>
              <input
                type="password"
                value={formData.rePassword}
                onChange={(e) => setFormData({ ...formData, rePassword: e.target.value })}
                placeholder="••••••"
                className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
              </input>
            </div>
          </div>

          {/* Action Buttons: Green Save and Yellow Reset as per Screenshot 4 */}
          <div className="flex justify-end items-center space-x-3 pt-4 border-t border-[#334155]">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#28a745] hover:bg-[#218838] text-white text-xs px-6 py-2 rounded font-semibold shadow transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingUserId ? 'Update User' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="bg-[#ffc107] hover:bg-[#e0a800] text-slate-900 text-xs px-6 py-2 rounded font-semibold shadow transition"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      {/* Users Listing Table with dynamic Edit and Delete buttons */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Registered CRM Users</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live user database synchronized with central database
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-emerald-400 border border-slate-700 px-3 py-1 rounded-full font-mono">
            {users.length} Active Accounts
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading user accounts...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No users found.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Mobile No.</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{u.username}</td>
                    <td className="p-3 font-medium text-white">{u.fullName}</td>
                    <td className="p-3">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {u.role || 'Super Admin'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{u.branch || 'Head Office'}</td>
                    <td className="p-3 font-mono text-slate-300">{u.mobile || '-'}</td>
                    <td className="p-3 text-slate-400">{u.email || '-'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1 rounded text-xs transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u._id, u.username)}
                        className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 px-3 py-1 rounded text-xs transition font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

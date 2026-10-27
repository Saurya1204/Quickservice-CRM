'use client';

import React, { useState, useEffect } from 'react';

export default function BranchMasterView() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    region: 'North',
    branchName: '',
    contactNumber: '',
    emailId: '',
    status: 'A',
    address: '',
    landmark: '',
    pincode: '',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: '',
    branchManagerName: '',
    managerContactNumber: '',
    managerEmailId: '',
  });

  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/branches');
      const json = await res.json();
      if (json.success) {
        setBranches(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBranch) {
        const res = await fetch('/api/masters/branches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBranch._id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          setEditingBranch(null);
          fetchBranches();
          alert('Branch updated successfully!');
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          fetchBranches();
          alert('Branch saved successfully!');
        } else {
          alert(json.message);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (b: any) => {
    setEditingBranch(b);
    setFormData({
      region: b.region || 'North',
      branchName: b.branchName || '',
      contactNumber: b.contactNumber || '',
      emailId: b.emailId || '',
      status: b.status || 'A',
      address: b.address || '',
      landmark: b.landmark || '',
      pincode: b.pincode || '',
      state: b.state || 'UTTAR PRADESH',
      district: b.district || 'GHAZIABAD',
      city: b.city || 'GHAZIABAD',
      locality: b.locality || '',
      branchManagerName: b.branchManagerName || '',
      managerContactNumber: b.managerContactNumber || '',
      managerEmailId: b.managerEmailId || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/branches?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchBranches();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-[#334155] pb-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Branch Master</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {branches.length}
            </span>
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded font-medium transition"
          >
            {showAddForm ? '✕ Back to List' : '+ ADD BRANCH'}
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#172033] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-sm font-semibold text-emerald-400">1. Branch & Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                >
                  <option>North</option><option>South</option><option>East</option><option>West</option><option>Central</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Branch Name"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Branch Mobile Number"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email ID</label>
                <input
                  type="email"
                  placeholder="branch@quickserves.com"
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Branch Full Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address details"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Pincode"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <h3 className="text-sm font-semibold text-emerald-400 pt-2 border-t border-[#334155]">2. Management Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Manager Name</label>
                <input
                  type="text"
                  value={formData.branchManagerName}
                  onChange={(e) => setFormData({ ...formData, branchManagerName: e.target.value })}
                  placeholder="Manager Full Name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Manager Contact</label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.managerContactNumber}
                  onChange={(e) => setFormData({ ...formData, managerContactNumber: e.target.value })}
                  placeholder="Manager Mobile"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Manager Email</label>
                <input
                  type="email"
                  value={formData.managerEmailId}
                  onChange={(e) => setFormData({ ...formData, managerEmailId: e.target.value })}
                  placeholder="Manager Email"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-[#334155]">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-6 py-2.5 rounded font-medium transition shadow-lg"
              >
                {saving ? 'Saving...' : 'Save Branch'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-600 hover:bg-slate-700 text-white text-xs px-6 py-2.5 rounded font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading branches...</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                  <tr>
                    <th className="p-3">CRM Code</th>
                    <th className="p-3">Region</th>
                    <th className="p-3">Branch Name</th>
                    <th className="p-3">City</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Manager</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {branches.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-emerald-400 font-mono text-xs">{b.crmCode}</td>
                      <td className="p-3 font-medium text-white">{b.region}</td>
                      <td className="p-3 text-slate-300">{b.branchName}</td>
                      <td className="p-3 text-slate-300">{b.city}</td>
                      <td className="p-3 text-slate-300">{b.state}</td>
                      <td className="p-3 text-slate-300">{b.branchManagerName}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(b)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b._id, b.branchName)}
                          className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
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
        )}
      </div>
    </div>
  );
}

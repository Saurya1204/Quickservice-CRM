'use client';

import React, { useState, useEffect } from 'react';

export default function FranchiseMasterView() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    region: 'North',
    firmType: 'Proprietorship',
    firmName: '',
    contactNumber: '',
    emailId: '',
    status: 'A',
    firmAddress: '',
    landmark: '',
    pincode: '',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: '',
    proprietorName: '',
    propContactNumber: '',
    propEmailId: '',
    ccoName: '',
    ccoContactNumber: '',
  });

  const [editingFranchise, setEditingFranchise] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFranchises();
  }, []);

  const fetchFranchises = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/franchises');
      const json = await res.json();
      if (json.success) {
        setFranchises(json.data);
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
      if (editingFranchise) {
        const res = await fetch('/api/masters/franchises', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingFranchise._id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          setEditingFranchise(null);
          fetchFranchises();
          alert('Franchise updated successfully!');
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/franchises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          fetchFranchises();
          alert('Franchise saved successfully!');
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

  const handleEdit = (f: any) => {
    setEditingFranchise(f);
    setFormData({
      region: f.region || 'North',
      firmType: f.firmType || 'Proprietorship',
      firmName: f.firmName || '',
      contactNumber: f.contactNumber || '',
      emailId: f.emailId || '',
      status: f.status || 'A',
      firmAddress: f.firmAddress || '',
      landmark: f.landmark || '',
      pincode: f.pincode || '',
      state: f.state || 'UTTAR PRADESH',
      district: f.district || 'GHAZIABAD',
      city: f.city || 'GHAZIABAD',
      locality: f.locality || '',
      proprietorName: f.proprietorName || '',
      propContactNumber: f.propContactNumber || '',
      propEmailId: f.propEmailId || '',
      ccoName: f.ccoName || '',
      ccoContactNumber: f.ccoContactNumber || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete franchise "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/franchises?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchFranchises();
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
            <span>Franchise Master</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {franchises.length}
            </span>
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded font-medium transition"
          >
            {showAddForm ? '✕ Back to List' : '+ ADD FRANCHISE'}
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#172033] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-sm font-semibold text-emerald-400">1. Firm & Location Details</h3>
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Firm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Firm Name"
                  value={formData.firmName}
                  onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Mobile"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email ID</label>
                <input
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  placeholder="Email"
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Firm Address</label>
                <input
                  type="text"
                  value={formData.firmAddress}
                  onChange={(e) => setFormData({ ...formData, firmAddress: e.target.value })}
                  placeholder="Address"
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

            <h3 className="text-sm font-semibold text-emerald-400 pt-2 border-t border-[#334155]">2. Proprietor & CCO Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Proprietor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.proprietorName}
                  onChange={(e) => setFormData({ ...formData, proprietorName: e.target.value })}
                  placeholder="Owner Name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Proprietor Contact</label>
                <input
                  type="text"
                  maxLength={10}
                  value={formData.propContactNumber}
                  onChange={(e) => setFormData({ ...formData, propContactNumber: e.target.value })}
                  placeholder="Mobile"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">CCO Name</label>
                <input
                  type="text"
                  value={formData.ccoName}
                  onChange={(e) => setFormData({ ...formData, ccoName: e.target.value })}
                  placeholder="CCO Name"
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
                {saving ? 'Saving...' : 'Save Franchise'}
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
              <div className="p-8 text-center text-slate-400">Loading franchises...</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                  <tr>
                    <th className="p-3">CRM Code</th>
                    <th className="p-3">Firm Name</th>
                    <th className="p-3">Proprietor</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">CCO</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {franchises.map((f) => (
                    <tr key={f._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-emerald-400 font-mono text-xs">{f.crmCode}</td>
                      <td className="p-3 font-medium text-white">{f.firmName}</td>
                      <td className="p-3 text-slate-300">{f.proprietorName}</td>
                      <td className="p-3 text-slate-300">{f.city}</td>
                      <td className="p-3 text-slate-300">{f.contactNumber}</td>
                      <td className="p-3 text-slate-300">{f.ccoName || '—'}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(f)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(f._id, f.firmName)}
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

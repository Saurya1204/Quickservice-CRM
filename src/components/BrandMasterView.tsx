'use client';

import React, { useState, useEffect } from 'react';

export default function BrandMasterView() {
  const [brands, setBrands] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    brandName: '',
    brandCode: '',
    clientId: '',
    status: 'A',
  });

  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBrands();
    fetchClients();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/brands');
      const json = await res.json();
      if (json.success) {
        setBrands(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/masters/clients');
      const json = await res.json();
      if (json.success) {
        setClients(json.data);
        if (json.data.length > 0) {
          setFormData((prev) => ({ ...prev, clientId: json.data[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingBrand) {
        const res = await fetch('/api/masters/brands', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingBrand._id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          setEditingBrand(null);
          fetchBrands();
          alert('Brand updated successfully!');
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          fetchBrands();
          alert('Brand saved successfully!');
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
    setEditingBrand(b);
    setFormData({
      brandName: b.brandName || '',
      brandCode: b.brandCode || '',
      clientId: b.clientId || (clients[0]?._id || ''),
      status: b.status || 'A',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/brands?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchBrands();
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
            <span>Brand Master</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {brands.length}
            </span>
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded font-medium transition"
          >
            {showAddForm ? '✕ Back to List' : '+ ADD BRAND'}
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#172033] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-sm font-semibold text-emerald-400">Add Brand Master</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SAMSUNG, LG, VOLTAS"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Brand Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={formData.brandCode}
                  onChange={(e) => setFormData({ ...formData, brandCode: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Associated Client *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.clientCode} - {c.clientName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-[#334155]">
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-6 py-2.5 rounded font-medium transition shadow-lg"
              >
                {saving ? 'Saving...' : 'Save Brand'}
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
              <div className="p-8 text-center text-slate-400">Loading brands...</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                  <tr>
                    <th className="p-3">Brand Code</th>
                    <th className="p-3">Brand Name</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {brands.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-emerald-400 font-mono text-xs">{b.brandCode}</td>
                      <td className="p-3 font-semibold text-white">{b.brandName}</td>
                      <td className="p-3 text-slate-300">{b.clientName || '—'}</td>
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
                          onClick={() => handleDelete(b._id, b.brandName)}
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

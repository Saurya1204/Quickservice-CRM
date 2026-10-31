'use client';

import React, { useState, useEffect } from 'react';

export default function BrandMasterView() {
  const [brands, setBrands] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Form State
  const initialForm = {
    brandCode: '',
    brandName: '',
    clientId: '',
    brandLogo: '',
    status: 'A',
  };

  const [formData, setFormData] = useState(initialForm);
  const [logoPreview, setLogoPreview] = useState<string>('');

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
        setBrands(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching brands:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/masters/clients');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const activeClients = json.data.filter((c: any) => c.status === 'A');
        setClients(activeClients);
        if (activeClients.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: activeClients[0]._id }));
        }
      }
    } catch (e) {
      console.error('Error fetching clients:', e);
    }
  };

  const handleOpenAdd = () => {
    setEditingBrand(null);
    setFormData({
      ...initialForm,
      clientId: clients.length > 0 ? clients[0]._id : '',
    });
    setLogoPreview('');
    setShowAddForm(true);
  };

  const handleEdit = (b: any) => {
    setEditingBrand(b);
    setFormData({
      brandCode: b.brandCode || '',
      brandName: b.brandName || '',
      clientId: b.clientId || '',
      brandLogo: b.brandLogo || '',
      status: b.status || 'A',
    });
    setLogoPreview(b.brandLogo || '');
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete brand "${name}"?`)) return;
    try {
      const res = await fetch(`/api/masters/brands?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchBrands();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogoPreview(base64);
        setFormData((prev) => ({ ...prev, brandLogo: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.clientId) {
      alert('Brand Name and Client are required.');
      return;
    }

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
          alert('Brand updated successfully!');
          setShowAddForm(false);
          setEditingBrand(null);
          fetchBrands();
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
          alert(json.message || 'Brand created successfully!');
          setShowAddForm(false);
          fetchBrands();
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

  // Filtered Brands
  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      !searchTerm ||
      (b.brandName && b.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.brandCode && b.brandCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.clientName && b.clientName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClient = filterClient === 'all' || b.clientId === filterClient;
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;

    return matchesSearch && matchesClient && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111c2e] p-5 rounded-2xl border border-[#24344d]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Brand Master</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {filteredBrands.length} Brands Registered
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Client-Brand Hierarchy, Product Line Identities &amp; Brand Logos
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition active:scale-95"
        >
          <span>+</span>
          <span>ADD</span>
        </button>
      </div>

      {!showAddForm ? (
        /* Listing View */
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[260px]">
              <input
                type="text"
                placeholder="Search by brand name, code, client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Clients</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientName}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d1624] border-b border-[#24344d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Brand ID</th>
                    <th className="py-3 px-4">Brand Logo</th>
                    <th className="py-3 px-4">Brand Name</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24344d]/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Loading Brands...
                      </td>
                    </tr>
                  ) : filteredBrands.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No brands found. Click &quot;+ ADD&quot; to create a new brand.
                      </td>
                    </tr>
                  ) : (
                    filteredBrands.map((b) => (
                      <tr key={b._id} className="hover:bg-[#16233b]/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {b.brandCode}
                        </td>
                        <td className="py-3 px-4">
                          {b.brandLogo ? (
                            <img
                              src={b.brandLogo}
                              alt={b.brandName}
                              className="h-8 w-14 object-contain rounded bg-white/5 border border-[#24344d] p-1"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">No Logo</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">{b.brandName}</td>
                        <td className="py-3 px-4 text-blue-400 font-medium">{b.clientName || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'A'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {b.status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(b)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-medium transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(b._id, b.brandName)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-medium transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Add / Edit Brand Form */
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-[#111c2e] p-6 rounded-2xl border border-[#24344d]">
          <div className="border-b border-[#24344d] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                {editingBrand ? 'EDIT BRAND' : 'ADD BRAND'}
              </h2>
              <p className="text-xs text-slate-400">
                Assign brand identity under an active Client principal.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* Field A: Client Dropdown */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Client <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">--- Select Client ---</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientName} ({c.clientCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Field B: Brand Name */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Brand Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                placeholder="e.g. Voltas Beko, Samsung, Havells"
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Field C: Brand Logo */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Brand Logo (PNG, JPG, JPEG, WebP)
              </label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleLogoFile}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
              {logoPreview && (
                <div className="mt-3 flex items-center gap-3 bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-10 w-20 object-contain rounded bg-white/5 border border-[#24344d] p-1"
                  />
                  <span className="text-slate-400 text-[11px]">Logo Preview Active</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </select>
            </div>
          </div>

          {/* Buttons: Save (Green), Abort (Yellow) */}
          <div className="flex items-center gap-3 justify-end pt-3 border-t border-[#24344d]">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition active:scale-95"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
            >
              Abort
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';

export default function TechnicianMasterView() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    region: 'North',
    technicianName: '',
    contactNumber: '',
    emailId: '',
    status: 'A',
    residentialAddress: '',
    landmark: '',
    pincode: '',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: '',
    educationalQualification: '',
    technicalQualification: '',
  });

  const [editingTechnician, setEditingTechnician] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/technicians');
      const json = await res.json();
      if (json.success) {
        setTechnicians(json.data);
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
      if (editingTechnician) {
        const res = await fetch('/api/masters/technicians', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTechnician._id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          setEditingTechnician(null);
          fetchTechnicians();
          alert('Technician updated successfully!');
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          fetchTechnicians();
          alert('Technician saved successfully!');
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

  const handleEdit = (t: any) => {
    setEditingTechnician(t);
    setFormData({
      region: t.region || 'North',
      technicianName: t.technicianName || '',
      contactNumber: t.contactNumber || '',
      emailId: t.emailId || '',
      status: t.status || 'A',
      residentialAddress: t.residentialAddress || '',
      landmark: t.landmark || '',
      pincode: t.pincode || '',
      state: t.state || 'UTTAR PRADESH',
      district: t.district || 'GHAZIABAD',
      city: t.city || 'GHAZIABAD',
      locality: t.locality || '',
      educationalQualification: t.educationalQualification || '',
      technicalQualification: t.technicalQualification || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete technician "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/technicians?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchTechnicians();
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
            <span>Technician Master</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {technicians.length}
            </span>
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded font-medium transition"
          >
            {showAddForm ? '✕ Back to List' : '+ ADD TECHNICIAN'}
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#172033] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-sm font-semibold text-emerald-400">1. Technician Information</h3>
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Technician Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
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
                <label className="block text-xs font-medium text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.residentialAddress}
                  onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                  placeholder="Address"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Technical Skill / ITI</label>
                <input
                  type="text"
                  value={formData.technicalQualification}
                  onChange={(e) => setFormData({ ...formData, technicalQualification: e.target.value })}
                  placeholder="e.g. HVAC, Refrigerator"
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
                {saving ? 'Saving...' : 'Save Technician'}
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
              <div className="p-8 text-center text-slate-400">Loading technicians...</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                  <tr>
                    <th className="p-3">CRM Code</th>
                    <th className="p-3">Technician Name</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Technical Skill</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {technicians.map((t) => (
                    <tr key={t._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-emerald-400 font-mono text-xs">{t.crmCode}</td>
                      <td className="p-3 font-medium text-white">{t.technicianName}</td>
                      <td className="p-3 text-slate-300">{t.contactNumber}</td>
                      <td className="p-3 text-slate-300">{t.city}</td>
                      <td className="p-3 text-slate-300 text-xs">{t.technicalQualification || '—'}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(t)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t._id, t.technicianName)}
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

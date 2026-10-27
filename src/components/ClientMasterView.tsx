'use client';

import React, { useState, useEffect } from 'react';

export default function ClientMasterView() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const initialFormState = {
    clientName: '',
    proprietorName: '',
    contactPerson: '',
    mobileNumber: '',
    emailId: '',
    serviceArea: 'Pan India',
    registeredAddress: '',
    city: 'NEW DELHI',
    state: 'DELHI',
    district: 'DELHI',
    locality: 'NEW DELHI',
    pincode: '',
    gstNumber: '',
    panNumber: '',
    callCenter: 'Quickserves',
    paymentTerms: 'Within 15 Days',
    creditLimit: '6 Lac',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/clients');
      const json = await res.json();
      if (json.success) {
        setClients(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData(initialFormState);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingClient(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClient) {
        const res = await fetch('/api/masters/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClient._id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          handleCancel();
          fetchClients();
          alert('Client updated successfully!');
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          handleCancel();
          fetchClients();
          alert('Client saved successfully!');
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

  const handleEdit = (c: any) => {
    setEditingClient(c);
    setFormData({
      clientName: c.clientName || '',
      proprietorName: c.proprietorName || '',
      contactPerson: c.contactPerson || '',
      mobileNumber: c.mobileNumber || '',
      emailId: c.emailId || '',
      serviceArea: c.serviceArea || 'Pan India',
      registeredAddress: c.registeredAddress || '',
      city: c.city || 'NEW DELHI',
      state: c.state || 'DELHI',
      district: c.district || 'DELHI',
      locality: c.locality || 'NEW DELHI',
      pincode: c.pincode || '',
      gstNumber: c.gstNumber || '',
      panNumber: c.panNumber || '',
      callCenter: c.callCenter || 'Quickserves',
      paymentTerms: c.paymentTerms || 'Within 15 Days',
      creditLimit: c.creditLimit || '6 Lac',
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete client "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/clients?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchClients();
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
            <span>Client Master</span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
              {clients.length}
            </span>
          </h2>
          <button
            onClick={() => {
              if (showAddForm) {
                handleCancel();
              } else {
                handleOpenAdd();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded font-medium transition"
          >
            {showAddForm ? '✕ Back to List' : '+ ADD CLIENT'}
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#172033] p-6 rounded-xl border border-[#334155]">
            <h3 className="text-sm font-semibold text-emerald-400">
              {editingClient ? 'Edit Client Details' : '1. Client Details'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Full Corporate Name"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Contact Person *</label>
                <input
                  type="text"
                  required
                  placeholder="Contact Person Name"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Mobile Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Mobile"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email ID *</label>
                <input
                  type="email"
                  required
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  placeholder="corporate@client.com"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Service Area</label>
                <select
                  value={formData.serviceArea}
                  onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                >
                  <option>Pan India</option><option>North India</option><option>South India</option><option>East India</option><option>West India</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      city: val,
                      district: val,
                      locality: val,
                    });
                  }}
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
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">GST Number</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="GSTIN"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white font-mono"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1">Registered Address</label>
                <input
                  type="text"
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  placeholder="Full Corporate Address"
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
                {saving ? 'Saving...' : editingClient ? 'Update Client' : 'Save Client'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-slate-600 hover:bg-slate-700 text-white text-xs px-6 py-2.5 rounded font-medium transition"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading clients...</div>
            ) : (
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                  <tr>
                    <th className="p-3">Client Code</th>
                    <th className="p-3">Client Name</th>
                    <th className="p-3">Contact Person</th>
                    <th className="p-3">Mobile No</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Service Area</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {clients.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-emerald-400 font-mono text-xs">{c.clientCode}</td>
                      <td className="p-3 font-medium text-white">{c.clientName}</td>
                      <td className="p-3 text-slate-300">{c.contactPerson}</td>
                      <td className="p-3 text-slate-300">{c.mobileNumber}</td>
                      <td className="p-3 text-slate-300">{c.city}</td>
                      <td className="p-3 text-slate-300 text-xs">{c.serviceArea}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.clientName)}
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

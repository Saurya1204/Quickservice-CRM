'use client';

import React, { useState, useEffect } from 'react';

interface DynamicMasterProps {
  type: string;
  title: string;
  subTitle: string;
  nameLabel?: string;
  categoryLabel?: string;
  subTextLabel?: string;
  field1Label?: string;
  field2Label?: string;
}

export default function DynamicMasterView({
  type,
  title,
  subTitle,
  nameLabel = 'Name / Description',
  categoryLabel = 'Category / Parent',
  subTextLabel = 'Specification / Remarks',
  field1Label = 'Reference / Contact',
  field2Label = 'Location / Extra',
}: DynamicMasterProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    subText: '',
    field1: '',
    field2: '',
    status: 'Active',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [type]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/masters/dynamic?type=${type}`);
      const json = await res.json();
      if (json.success) {
        setItems(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    setSaving(true);

    try {
      if (editingItem) {
        // Update
        const res = await fetch('/api/masters/dynamic', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingItem._id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddModal(false);
          setEditingItem(null);
          fetchItems();
        } else {
          alert(json.message);
        }
      } else {
        // Create
        const res = await fetch('/api/masters/dynamic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entityType: type, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddModal(false);
          setFormData({ code: '', name: '', category: '', subText: '', field1: '', field2: '', status: 'Active' });
          fetchItems();
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

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category || '',
      subText: item.subText || '',
      field1: item.field1 || '',
      field2: item.field2 || '',
      status: item.status || 'Active',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/dynamic?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchItems();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-4 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#334155] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>{title}</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {items.length} records
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{subTitle}</p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={`Search ${title}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#172033] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-48"
            />
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({ code: '', name: '', category: '', subText: '', field1: '', field2: '', status: 'Active' });
                setShowAddModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition whitespace-nowrap shadow-lg"
            >
              + ADD NEW
            </button>
          </div>
        </div>

        {/* Modal / Form */}
        {showAddModal && (
          <form onSubmit={handleSave} className="bg-[#172033] border border-[#334155] p-5 rounded-xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h3 className="text-sm font-semibold text-emerald-400">
                {editingItem ? `Edit ${title}` : `Add to ${title}`}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Code</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{nameLabel} *</label>
                <input
                  type="text"
                  required
                  placeholder={`Enter ${nameLabel}`}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{categoryLabel}</label>
                <input
                  type="text"
                  placeholder={`Enter ${categoryLabel}`}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{subTextLabel}</label>
                <input
                  type="text"
                  placeholder={`Enter ${subTextLabel}`}
                  value={formData.subText}
                  onChange={(e) => setFormData({ ...formData, subText: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{field1Label}</label>
                <input
                  type="text"
                  placeholder={`Enter ${field1Label}`}
                  value={formData.field1}
                  onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{field2Label}</label>
                <input
                  type="text"
                  placeholder={`Enter ${field2Label}`}
                  value={formData.field2}
                  onChange={(e) => setFormData({ ...formData, field2: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-6 py-2 rounded-lg font-medium transition shadow-lg"
              >
                {saving ? 'Saving...' : editingItem ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading {title}...</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="p-3">CRM Code</th>
                  <th className="p-3">{nameLabel}</th>
                  <th className="p-3">{categoryLabel}</th>
                  <th className="p-3">{subTextLabel}</th>
                  <th className="p-3">{field1Label}</th>
                  <th className="p-3">{field2Label}</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      No records found. Click "+ ADD NEW" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-emerald-400 font-mono text-xs">{item.code}</td>
                      <td className="p-3 font-semibold text-white">{item.name}</td>
                      <td className="p-3 text-slate-300 text-xs">{item.category || '—'}</td>
                      <td className="p-3 text-slate-400 text-xs max-w-xs truncate">{item.subText || '—'}</td>
                      <td className="p-3 text-slate-300 text-xs">{item.field1 || '—'}</td>
                      <td className="p-3 text-slate-300 text-xs">{item.field2 || '—'}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
                          {item.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.name)}
                          className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

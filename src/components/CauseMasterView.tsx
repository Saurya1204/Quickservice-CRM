'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CauseItem {
  _id: string;
  causeCode: string;
  categoryId: string;
  categoryName?: string;
  symptomId: string;
  symptomName?: string;
  causeName: string;
  status: 'A' | 'I';
  createdAt?: string;
}

export default function CauseMasterView() {
  const [causes, setCauses] = useState<CauseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSymptom, setFilterSymptom] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Master lists
  const [categories, setCategories] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const initialForm = {
    _id: '',
    categoryId: '',
    symptomId: '',
    causeName: '',
    status: 'A' as 'A' | 'I',
  };
  const [formData, setFormData] = useState(initialForm);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadMasterData = async () => {
    try {
      const [resCat, resSym] = await Promise.all([
        fetch('/api/masters/categories'),
        fetch('/api/masters/symptoms?limit=500'),
      ]);
      const [dataCat, dataSym] = await Promise.all([resCat.json(), resSym.json()]);

      if (dataCat.success) setCategories(dataCat.data || []);
      if (dataSym.success) setSymptoms(dataSym.data || []);
    } catch (e) {
      console.error('Error loading categories & symptoms:', e);
    }
  };

  const fetchCauses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory !== 'all') params.append('categoryId', filterCategory);
      if (filterSymptom !== 'all') params.append('symptomId', filterSymptom);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/masters/causes?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCauses(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching causes:', e);
      showToast('error', 'Failed to load causes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    fetchCauses();
  }, [search, filterCategory, filterSymptom, filterStatus]);

  // Symptoms dependent on selected category in form
  const formSymptoms = useMemo(() => {
    if (!formData.categoryId) return [];
    return symptoms.filter((s) => s.categoryId === formData.categoryId || s.categoryId?._id === formData.categoryId);
  }, [symptoms, formData.categoryId]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (item: CauseItem) => {
    setFormData({
      _id: item._id,
      categoryId: item.categoryId,
      symptomId: item.symptomId,
      causeName: item.causeName,
      status: item.status || 'A',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.symptomId || !formData.causeName) {
      showToast('error', 'Product Category, Symptom, and Cause Name are required');
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/masters/causes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Cause saved successfully');
        setShowModal(false);
        fetchCauses();
      } else {
        showToast('error', json.message || 'Failed to save cause');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete cause "${name}"?`)) return;
    try {
      const res = await fetch(`/api/masters/causes?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Cause deleted');
        fetchCauses();
      } else {
        showToast('error', json.message || 'Delete failed');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error deleting');
    }
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium transition-all ${
            notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#111c2e] p-5 rounded-xl border border-[#24344d]">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Cause Master</h1>
            <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {causes.length} Causes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain technical root causes linked to specific categories and failure symptoms
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD</span>
          </button>

          <a
            href="/api/masters/symptom-cause-analysis/export"
            download
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export SCA (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Cause, Symptom, Category..."
            className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.categoryName}
            </option>
          ))}
        </select>

        <select
          value={filterSymptom}
          onChange={(e) => setFilterSymptom(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Symptoms</option>
          {symptoms.map((s) => (
            <option key={s._id} value={s._id}>
              {s.symptomName}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="A">Active</option>
          <option value="I">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0d1624] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-[#24344d]">
              <tr>
                <th className="px-4 py-3">Cause ID</th>
                <th className="px-4 py-3">Product Category</th>
                <th className="px-4 py-3">Symptom</th>
                <th className="px-4 py-3">Cause</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2c42]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span> Loading causes...
                  </td>
                </tr>
              ) : causes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No causes found. Click &quot;ADD&quot; to create a new cause.
                  </td>
                </tr>
              ) : (
                causes.map((item) => (
                  <tr key={item._id} className="hover:bg-[#16233a] transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-400 font-bold">{item.causeCode}</td>
                    <td className="px-4 py-3 text-slate-300">{item.categoryName || '-'}</td>
                    <td className="px-4 py-3 text-white font-medium">{item.symptomName || '-'}</td>
                    <td className="px-4 py-3 text-white font-bold">{item.causeName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'A'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item.status === 'A' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Cause"
                        className="p-1.5 bg-[#0e1726] hover:bg-amber-600/20 text-amber-400 rounded border border-[#24344d] hover:border-amber-500/40 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.causeName)}
                        title="Delete Cause"
                        className="p-1.5 bg-[#0e1726] hover:bg-rose-600/20 text-rose-400 rounded border border-[#24344d] hover:border-rose-500/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-lg shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold tracking-wide">{isEditing ? `EDIT CAUSE` : 'ADD CAUSE'}</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Product Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => {
                    setFormData({ ...formData, categoryId: e.target.value, symptomId: '' });
                  }}
                  required
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">---Select Category---</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Symptom *</label>
                <select
                  value={formData.symptomId}
                  onChange={(e) => setFormData({ ...formData, symptomId: e.target.value })}
                  required
                  disabled={!formData.categoryId}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">---Select Symptom---</option>
                  {formSymptoms.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.symptomName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Cause *</label>
                <input
                  type="text"
                  value={formData.causeName}
                  onChange={(e) => setFormData({ ...formData, causeName: e.target.value })}
                  placeholder="e.g. Wire Issue, Motor Defective, Fuse Blown"
                  required
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'A' | 'I' })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#24344d]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg font-semibold text-xs text-black bg-[#ca8a04] hover:bg-[#a16207]"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg font-semibold text-xs text-white bg-[#16a34a] hover:bg-[#15803d]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

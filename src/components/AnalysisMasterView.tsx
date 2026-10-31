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
  FileSearch,
} from 'lucide-react';

interface AnalysisItem {
  _id: string;
  analysisCode: string;
  categoryId: string;
  categoryName?: string;
  symptomId: string;
  symptomName?: string;
  causeId: string;
  causeName?: string;
  analysisName: string;
  status: 'A' | 'I';
  createdAt?: string;
}

export default function AnalysisMasterView() {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSymptom, setFilterSymptom] = useState('all');
  const [filterCause, setFilterCause] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Master lists
  const [categories, setCategories] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [causes, setCauses] = useState<any[]>([]);

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
    causeId: '',
    analysisName: '',
    status: 'A' as 'A' | 'I',
  };
  const [formData, setFormData] = useState(initialForm);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadMasterData = async () => {
    try {
      const [resCat, resSym, resCau] = await Promise.all([
        fetch('/api/masters/categories'),
        fetch('/api/masters/symptoms?limit=500'),
        fetch('/api/masters/causes?limit=500'),
      ]);
      const [dataCat, dataSym, dataCau] = await Promise.all([resCat.json(), resSym.json(), resCau.json()]);

      if (dataCat.success) setCategories(dataCat.data || []);
      if (dataSym.success) setSymptoms(dataSym.data || []);
      if (dataCau.success) setCauses(dataCau.data || []);
    } catch (e) {
      console.error('Error loading diagnostic masters:', e);
    }
  };

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory !== 'all') params.append('categoryId', filterCategory);
      if (filterSymptom !== 'all') params.append('symptomId', filterSymptom);
      if (filterCause !== 'all') params.append('causeId', filterCause);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/masters/analyses?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAnalyses(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching analyses:', e);
      showToast('error', 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [search, filterCategory, filterSymptom, filterCause, filterStatus]);

  // Dependent dropdowns inside form
  const formSymptoms = useMemo(() => {
    if (!formData.categoryId) return [];
    return symptoms.filter((s) => s.categoryId === formData.categoryId || s.categoryId?._id === formData.categoryId);
  }, [symptoms, formData.categoryId]);

  const formCauses = useMemo(() => {
    if (!formData.symptomId) return [];
    return causes.filter((c) => c.symptomId === formData.symptomId || c.symptomId?._id === formData.symptomId);
  }, [causes, formData.symptomId]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (item: AnalysisItem) => {
    setFormData({
      _id: item._id,
      categoryId: item.categoryId,
      symptomId: item.symptomId,
      causeId: item.causeId,
      analysisName: item.analysisName,
      status: item.status || 'A',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.symptomId || !formData.causeId || !formData.analysisName) {
      showToast('error', 'Category, Symptom, Cause, and Analysis are all mandatory');
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/masters/analyses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Analysis saved successfully');
        setShowModal(false);
        fetchAnalyses();
      } else {
        showToast('error', json.message || 'Failed to save analysis');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete analysis "${name}"?`)) return;
    try {
      const res = await fetch(`/api/masters/analyses?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Analysis deleted');
        fetchAnalyses();
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
            <h1 className="text-xl font-bold text-white tracking-wide">Analysis Master</h1>
            <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {analyses.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain corrective action and resolution analysis bound to categories, symptoms, and causes
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
      <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Analysis, Cause, Symptom..."
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
          value={filterCause}
          onChange={(e) => setFilterCause(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Causes</option>
          {causes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.causeName}
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
                <th className="px-4 py-3">Analysis ID</th>
                <th className="px-4 py-3">Product Category</th>
                <th className="px-4 py-3">Symptom</th>
                <th className="px-4 py-3">Cause</th>
                <th className="px-4 py-3">Analysis</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2c42]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span> Loading analyses...
                  </td>
                </tr>
              ) : analyses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No analysis records found. Click &quot;ADD&quot; to create one.
                  </td>
                </tr>
              ) : (
                analyses.map((item) => (
                  <tr key={item._id} className="hover:bg-[#16233a] transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-400 font-bold">{item.analysisCode}</td>
                    <td className="px-4 py-3 text-slate-300">{item.categoryName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.symptomName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.causeName || '-'}</td>
                    <td className="px-4 py-3 text-white font-bold">{item.analysisName}</td>
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
                        title="Edit Analysis"
                        className="p-1.5 bg-[#0e1726] hover:bg-amber-600/20 text-amber-400 rounded border border-[#24344d] hover:border-amber-500/40 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.analysisName)}
                        title="Delete Analysis"
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
                <FileSearch className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold tracking-wide">
                  {isEditing ? `EDIT ANALYSIS` : 'ADD ANALYSIS'}
                </h2>
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
                    setFormData({
                      ...formData,
                      categoryId: e.target.value,
                      symptomId: '',
                      causeId: '',
                    });
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
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      symptomId: e.target.value,
                      causeId: '',
                    });
                  }}
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
                <select
                  value={formData.causeId}
                  onChange={(e) => setFormData({ ...formData, causeId: e.target.value })}
                  required
                  disabled={!formData.symptomId}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">---Select Cause---</option>
                  {formCauses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.causeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Analysis (Corrective Action) *</label>
                <textarea
                  rows={3}
                  value={formData.analysisName}
                  onChange={(e) => setFormData({ ...formData, analysisName: e.target.value })}
                  placeholder="e.g. Wire Change, Motor Replacement Required, PCB Repair"
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

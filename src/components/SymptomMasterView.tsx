'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

interface SymptomItem {
  _id: string;
  symptomCode: string;
  categoryId: string;
  categoryName?: string;
  symptomName: string;
  status: 'A' | 'I';
  createdAt?: string;
}

export default function SymptomMasterView() {
  const [symptoms, setSymptoms] = useState<SymptomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Categories
  const [categories, setCategories] = useState<any[]>([]);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Excel Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Form
  const initialForm = {
    _id: '',
    categoryId: '',
    symptomName: '',
    status: 'A' as 'A' | 'I',
  };
  const [formData, setFormData] = useState(initialForm);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/masters/categories');
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchSymptoms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterCategory !== 'all') params.append('categoryId', filterCategory);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/masters/symptoms?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSymptoms(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching symptoms:', e);
      showToast('error', 'Failed to load symptoms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    fetchSymptoms();
  }, [search, filterCategory, filterStatus]);

  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (item: SymptomItem) => {
    setFormData({
      _id: item._id,
      categoryId: item.categoryId,
      symptomName: item.symptomName,
      status: item.status || 'A',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.symptomName) {
      showToast('error', 'Product Category and Symptom are required');
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/masters/symptoms', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Symptom saved successfully');
        setShowModal(false);
        fetchSymptoms();
      } else {
        showToast('error', json.message || 'Failed to save symptom');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete symptom "${name}"?`)) return;
    try {
      const res = await fetch(`/api/masters/symptoms?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Symptom deleted');
        fetchSymptoms();
      } else {
        showToast('error', json.message || 'Delete failed');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error deleting');
    }
  };

  // Preview Symptom-Cause-Analysis Excel
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const fd = new FormData();
    fd.append('file', file);

    setImporting(true);
    try {
      const res = await fetch('/api/masters/symptom-cause-analysis/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setImportPreview(json);
        showToast('success', `Parsed ${json.summary.validCount} rows from troubleshooting file`);
      } else {
        showToast('error', json.message || 'Failed to parse file');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error parsing file');
    } finally {
      setImporting(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!importPreview?.validRows || importPreview.validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch('/api/masters/symptom-cause-analysis/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importPreview.validRows }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Import successful');
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview(null);
        fetchSymptoms();
      } else {
        showToast('error', json.message || 'Import failed');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error confirming import');
    } finally {
      setImporting(false);
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
            <h1 className="text-xl font-bold text-white tracking-wide">Symptom Master</h1>
            <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {symptoms.length} Symptoms
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain issue symptoms reported by customers and callers across product categories
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

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import SCA Excel</span>
          </button>

          <a
            href="/api/masters/symptom-cause-analysis/export"
            download
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Symptom Name, Code, Category..."
            className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Product Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.categoryName}
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

      {/* Listing Table */}
      <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0d1624] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-[#24344d]">
              <tr>
                <th className="px-4 py-3">Symptom ID</th>
                <th className="px-4 py-3">Product Category</th>
                <th className="px-4 py-3">Symptom</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2c42]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span> Loading symptoms...
                  </td>
                </tr>
              ) : symptoms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400">
                    No symptoms found. Click &quot;ADD&quot; to create a new symptom.
                  </td>
                </tr>
              ) : (
                symptoms.map((item) => (
                  <tr key={item._id} className="hover:bg-[#16233a] transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-400 font-bold">{item.symptomCode}</td>
                    <td className="px-4 py-3 text-slate-300 font-medium">{item.categoryName || '-'}</td>
                    <td className="px-4 py-3 text-white font-bold">{item.symptomName}</td>
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
                        title="Edit Symptom"
                        className="p-1.5 bg-[#0e1726] hover:bg-amber-600/20 text-amber-400 rounded border border-[#24344d] hover:border-amber-500/40 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.symptomName)}
                        title="Delete Symptom"
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
                <Activity className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold tracking-wide">
                  {isEditing ? `EDIT SYMPTOM` : 'ADD SYMPTOM'}
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
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                <input
                  type="text"
                  value={formData.symptomName}
                  onChange={(e) => setFormData({ ...formData, symptomName: e.target.value })}
                  placeholder="e.g. Main Motor Problem, No Power, Water Leakage"
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

      {/* EXCEL IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Import Symptom Cause Analysis Excel (.xls / .xlsx)</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="p-4 bg-[#0d1624] border border-dashed border-[#24344d] rounded-xl text-center">
                <input
                  type="file"
                  id="scaFileInput"
                  accept=".xls,.xlsx"
                  onChange={handleImportFileChange}
                  className="hidden"
                />
                <label htmlFor="scaFileInput" className="cursor-pointer inline-flex flex-col items-center justify-center space-y-2 py-4">
                  <Upload className="w-8 h-8 text-emerald-400 animate-bounce" />
                  <span className="text-sm font-semibold text-white">Select Symptom Cause Analysis Master Data (.xls/.xlsx)</span>
                  <span className="text-xs text-slate-400">7-column legacy format (Product, Symptom, Cause, Aanalysis)</span>
                  {importFile && (
                    <span className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </label>
              </div>

              {importPreview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Total Rows</span>
                      <span className="text-base font-bold text-white">{importPreview.summary.totalRows}</span>
                    </div>
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Unique Symptoms</span>
                      <span className="text-base font-bold text-blue-400">{importPreview.summary.uniqueSymptomsCount}</span>
                    </div>
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Unique Causes</span>
                      <span className="text-base font-bold text-purple-400">{importPreview.summary.uniqueCausesCount}</span>
                    </div>
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Unique Analyses</span>
                      <span className="text-base font-bold text-emerald-400">{importPreview.summary.uniqueAnalysesCount}</span>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button onClick={() => setShowImportModal(false)} className="px-4 py-2 bg-slate-700 rounded-lg">Cancel</button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importing}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm &amp; Import to Database</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

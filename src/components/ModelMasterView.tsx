'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  X,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  Wrench,
} from 'lucide-react';

interface ModelItem {
  _id: string;
  modelCode: string;
  modelNo: string;
  modelDescription?: string;
  clientId: string;
  clientName?: string;
  brandId: string;
  brandName?: string;
  categoryId: string;
  categoryName?: string;
  productId: string;
  productName?: string;
  sizeCapacity?: string;
  colour?: string;
  manufacturingStartDate?: string;
  manufacturingStopDate?: string;
  serialNumberLimitMin?: number;
  serialNumberLimitMax?: number;
  warrantyPeriod?: number;
  warrantyType?: 'Comprehensive' | 'Non Comprehensive';
  specificWarranty?: string;
  specificWarrantyType?: string;
  specificParts?: string;
  specificPeriod?: string;
  status: 'A' | 'I';
  createdAt?: string;
}

export default function ModelMasterView() {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Master Dropdown Data
  const [clients, setClients] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Excel Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Model Spares detail modal
  const [selectedModelForSpares, setSelectedModelForSpares] = useState<ModelItem | null>(null);
  const [modelSpares, setModelSpares] = useState<any[]>([]);
  const [loadingSpares, setLoadingSpares] = useState(false);

  // Form State
  const initialForm = {
    _id: '',
    clientId: '',
    brandId: '',
    categoryId: '',
    productId: '',
    modelNo: '',
    modelDescription: '',
    sizeCapacity: '',
    colour: '',
    manufacturingStartDate: '',
    manufacturingStopDate: '',
    serialNumberLimitMin: 0,
    serialNumberLimitMax: 99999999,
    warrantyPeriod: 12,
    warrantyType: 'Comprehensive' as 'Comprehensive' | 'Non Comprehensive',
    specificWarranty: '',
    specificWarrantyType: '',
    specificParts: '',
    specificPeriod: '',
    status: 'A' as 'A' | 'I',
  };
  const [formData, setFormData] = useState(initialForm);

  // Filtered dropdowns inside form
  const formBrands = useMemo(() => {
    if (!formData.clientId) return [];
    return brands.filter((b) => b.clientId === formData.clientId || b.clientId?._id === formData.clientId);
  }, [brands, formData.clientId]);

  const formProducts = useMemo(() => {
    if (!formData.categoryId) return products;
    return products.filter((p) => p.categoryId === formData.categoryId || p.categoryId?._id === formData.categoryId);
  }, [products, formData.categoryId]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch initial master lists
  const loadMasterData = async () => {
    try {
      const [resClients, resBrands, resCats, resProds] = await Promise.all([
        fetch('/api/masters/clients'),
        fetch('/api/masters/brands'),
        fetch('/api/masters/categories'),
        fetch('/api/masters/products'),
      ]);
      const [dataC, dataB, dataCat, dataP] = await Promise.all([
        resClients.json(),
        resBrands.json(),
        resCats.json(),
        resProds.json(),
      ]);

      if (dataC.success) setClients(dataC.data || []);
      if (dataB.success) setBrands(dataB.data || []);
      if (dataCat.success) setCategories(dataCat.data || []);
      if (dataP.success) setProducts(dataP.data || []);
    } catch (e) {
      console.error('Error loading master dropdowns:', e);
    }
  };

  // Fetch models list
  const fetchModels = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterClient !== 'all') params.append('clientId', filterClient);
      if (filterBrand !== 'all') params.append('brandId', filterBrand);
      if (filterCategory !== 'all') params.append('categoryId', filterCategory);
      if (filterProduct !== 'all') params.append('productId', filterProduct);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/masters/models?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setModels(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching models:', e);
      showToast('error', 'Failed to load model master records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    fetchModels();
  }, [search, filterClient, filterBrand, filterCategory, filterProduct, filterStatus]);

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: ModelItem) => {
    setFormData({
      _id: item._id,
      clientId: item.clientId || '',
      brandId: item.brandId || '',
      categoryId: item.categoryId || '',
      productId: item.productId || '',
      modelNo: item.modelNo || '',
      modelDescription: item.modelDescription || '',
      sizeCapacity: item.sizeCapacity || '',
      colour: item.colour || '',
      manufacturingStartDate: item.manufacturingStartDate ? item.manufacturingStartDate.slice(0, 10) : '',
      manufacturingStopDate: item.manufacturingStopDate ? item.manufacturingStopDate.slice(0, 10) : '',
      serialNumberLimitMin: item.serialNumberLimitMin ?? 0,
      serialNumberLimitMax: item.serialNumberLimitMax ?? 99999999,
      warrantyPeriod: item.warrantyPeriod ?? 12,
      warrantyType: item.warrantyType || 'Comprehensive',
      specificWarranty: item.specificWarranty || '',
      specificWarrantyType: item.specificWarrantyType || '',
      specificParts: item.specificParts || '',
      specificPeriod: item.specificPeriod || '',
      status: item.status || 'A',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Save / Update Model
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId || !formData.brandId || !formData.categoryId || !formData.productId || !formData.modelNo) {
      showToast('error', 'Client, Brand, Category, Product, and Model No are mandatory');
      return;
    }

    if (formData.manufacturingStartDate && formData.manufacturingStopDate) {
      if (new Date(formData.manufacturingStopDate) < new Date(formData.manufacturingStartDate)) {
        showToast('error', 'Manufacturing Stop Date cannot precede Manufacturing Start Date');
        return;
      }
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/masters/models', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        showToast('success', json.message || 'Model saved successfully');
        setShowModal(false);
        fetchModels();
      } else {
        showToast('error', json.message || 'Failed to save model');
      }
    } catch (e: any) {
      showToast('error', e.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Delete / Deactivate Model
  const handleDelete = async (id: string, modelNo: string) => {
    if (!confirm(`Are you sure you want to delete Model "${modelNo}"?`)) return;

    try {
      const res = await fetch(`/api/masters/models?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Model deleted successfully');
        fetchModels();
      } else {
        showToast('error', json.message || 'Could not delete model');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error deleting model');
    }
  };

  // View Model Spares
  const handleViewModelSpares = async (model: ModelItem) => {
    setSelectedModelForSpares(model);
    setLoadingSpares(true);
    try {
      const res = await fetch(`/api/masters/spare-parts?modelId=${model._id}`);
      const json = await res.json();
      if (json.success) {
        setModelSpares(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching model spares:', e);
    } finally {
      setLoadingSpares(false);
    }
  };

  // Preview Excel File
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);

    const fd = new FormData();
    fd.append('file', file);

    setImporting(true);
    try {
      const res = await fetch('/api/masters/model-data/import', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        setImportPreview(json);
        showToast('success', `Parsed ${json.summary.validCount} valid rows from file`);
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
    if (!importPreview?.validRows || importPreview.validRows.length === 0) {
      showToast('error', 'No valid rows to import');
      return;
    }

    setImporting(true);
    try {
      const res = await fetch('/api/masters/model-data/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importPreview.validRows }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Import completed successfully');
        setShowImportModal(false);
        setImportFile(null);
        setImportPreview(null);
        fetchModels();
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
      {/* Toast Notification */}
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

      {/* Header and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#111c2e] p-5 rounded-xl border border-[#24344d]">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Model Master</h1>
            <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {models.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain product model specifications, warranty configurations, and serial number rules
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Model Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD MODEL</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import Excel</span>
          </button>

          {/* Export All */}
          <a
            href="/api/masters/model-data/export"
            download
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Model No, Code, Product, Client..."
            className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Client filter */}
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Clients</option>
          {clients.map((c) => (
            <option key={c._id} value={c._id}>
              {c.clientName}
            </option>
          ))}
        </select>

        {/* Brand filter */}
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Brands</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>
              {b.brandName}
            </option>
          ))}
        </select>

        {/* Product filter */}
        <select
          value={filterProduct}
          onChange={(e) => setFilterProduct(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Products</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.productName}
            </option>
          ))}
        </select>

        {/* Status filter */}
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

      {/* Model Records Table */}
      <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0d1624] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-[#24344d]">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Model No.</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Mfg. Dates</th>
                <th className="px-4 py-3">Serial Limits</th>
                <th className="px-4 py-3">Warranty</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2c42]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span> Loading models...
                  </td>
                </tr>
              ) : models.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    No models found. Click &quot;ADD MODEL&quot; or &quot;Import Excel&quot; to create one.
                  </td>
                </tr>
              ) : (
                models.map((item) => (
                  <tr key={item._id} className="hover:bg-[#16233a] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{item.clientName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.brandName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.categoryName || '-'}</td>
                    <td className="px-4 py-3 text-white font-medium">{item.productName || '-'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-400">{item.modelNo}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{item.modelDescription || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {item.manufacturingStartDate ? item.manufacturingStartDate.slice(0, 10) : 'Start: -'}
                      <br />
                      {item.manufacturingStopDate ? item.manufacturingStopDate.slice(0, 10) : 'Stop: -'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                      {item.serialNumberLimitMin ?? 0} - {item.serialNumberLimitMax ?? 'Max'}
                    </td>
                    <td className="px-4 py-3 text-[11px]">
                      <span className="text-white font-medium">{item.warrantyPeriod} Mo.</span>
                      <span className="block text-slate-400">{item.warrantyType}</span>
                    </td>
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
                      {/* View Model Spares */}
                      <button
                        onClick={() => handleViewModelSpares(item)}
                        title="Model Spare Details"
                        className="p-1.5 bg-[#0e1726] hover:bg-blue-600/20 text-blue-400 rounded border border-[#24344d] hover:border-blue-500/40 transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Model"
                        className="p-1.5 bg-[#0e1726] hover:bg-amber-600/20 text-amber-400 rounded border border-[#24344d] hover:border-amber-500/40 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item._id, item.modelNo)}
                        title="Delete Model"
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

      {/* ========================================================================= */}
      {/* ADD / EDIT MODEL MODAL (Responsive Two-Column Form)                        */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-xs text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold tracking-wide">
                  {isEditing ? `EDIT MODEL: ${formData.modelNo}` : 'ADD MODEL'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              {/* SECTION 1: Basic Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 pb-1 border-b border-[#24344d]">
                  1. Basic Information & Hierarchy
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Dropdown */}
                  <div>
                    <label className="block text-slate-400 mb-1">Client Name *</label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          clientId: e.target.value,
                          brandId: '', // Reset dependent brand
                        });
                      }}
                      required
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">---Select Client---</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.clientName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand Dropdown (Dependent on Client) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Brand Name *</label>
                    <select
                      value={formData.brandId}
                      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                      required
                      disabled={!formData.clientId}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">---Select Brand---</option>
                      {formBrands.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.brandName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Category Dropdown */}
                  <div>
                    <label className="block text-slate-400 mb-1">Product Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          categoryId: e.target.value,
                          productId: '', // Reset dependent product
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

                  {/* Product Dropdown (Dependent on Category) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Product *</label>
                    <select
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      required
                      disabled={!formData.categoryId}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">---Select Product---</option>
                      {formProducts.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.productName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model No */}
                  <div>
                    <label className="block text-slate-400 mb-1">Model No *</label>
                    <input
                      type="text"
                      value={formData.modelNo}
                      onChange={(e) => setFormData({ ...formData, modelNo: e.target.value })}
                      placeholder="e.g. WD-1020, SPLIT-1.5T"
                      required
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Size / Capacity */}
                  <div>
                    <label className="block text-slate-400 mb-1">Size / Capacity</label>
                    <input
                      type="text"
                      value={formData.sizeCapacity}
                      onChange={(e) => setFormData({ ...formData, sizeCapacity: e.target.value })}
                      placeholder="e.g. 1.5 Ton, 43 Inch, 7 Kg"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Colour */}
                  <div>
                    <label className="block text-slate-400 mb-1">Colour</label>
                    <input
                      type="text"
                      value={formData.colour}
                      onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
                      placeholder="e.g. Silver, Glossy Black"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Status */}
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

                  {/* Model Description */}
                  <div className="md:col-span-2">
                    <label className="block text-slate-400 mb-1">Model Description</label>
                    <textarea
                      rows={2}
                      value={formData.modelDescription}
                      onChange={(e) => setFormData({ ...formData, modelDescription: e.target.value })}
                      placeholder="Enter detailed model specifications or notes"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Manufacturing Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 pb-1 border-b border-[#24344d]">
                  2. Manufacturing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Manufacturing Start Date</label>
                    <input
                      type="date"
                      value={formData.manufacturingStartDate}
                      onChange={(e) => setFormData({ ...formData, manufacturingStartDate: e.target.value })}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Manufacturing Stop Date</label>
                    <input
                      type="date"
                      value={formData.manufacturingStopDate}
                      onChange={(e) => setFormData({ ...formData, manufacturingStopDate: e.target.value })}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Serial Number Configuration */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 pb-1 border-b border-[#24344d]">
                  3. Serial Number Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Serial Number Limit Min</label>
                    <input
                      type="number"
                      value={formData.serialNumberLimitMin}
                      onChange={(e) => setFormData({ ...formData, serialNumberLimitMin: Number(e.target.value) })}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Serial Number Limit Max</label>
                    <input
                      type="number"
                      value={formData.serialNumberLimitMax}
                      onChange={(e) => setFormData({ ...formData, serialNumberLimitMax: Number(e.target.value) })}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Warranty Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-3 pb-1 border-b border-[#24344d]">
                  4. Warranty Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Warranty Period (Months)</label>
                    <input
                      type="number"
                      value={formData.warrantyPeriod}
                      onChange={(e) => setFormData({ ...formData, warrantyPeriod: Number(e.target.value) })}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Warranty Type</label>
                    <select
                      value={formData.warrantyType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          warrantyType: e.target.value as 'Comprehensive' | 'Non Comprehensive',
                        })
                      }
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Comprehensive">Comprehensive</option>
                      <option value="Non Comprehensive">Non Comprehensive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Specific Warranty</label>
                    <input
                      type="text"
                      value={formData.specificWarranty}
                      onChange={(e) => setFormData({ ...formData, specificWarranty: e.target.value })}
                      placeholder="e.g. Compressor, Motor, Panel"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Specific Warranty Type</label>
                    <input
                      type="text"
                      value={formData.specificWarrantyType}
                      onChange={(e) => setFormData({ ...formData, specificWarrantyType: e.target.value })}
                      placeholder="e.g. Extended, Limited"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Specific Parts</label>
                    <input
                      type="text"
                      value={formData.specificParts}
                      onChange={(e) => setFormData({ ...formData, specificParts: e.target.value })}
                      placeholder="e.g. Inverter PCB, Magnetron"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Specific Period (Years / Months)</label>
                    <input
                      type="text"
                      value={formData.specificPeriod}
                      onChange={(e) => setFormData({ ...formData, specificPeriod: e.target.value })}
                      placeholder="e.g. 5 Years, 10 Years"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#24344d]">
                {/* Abort Button (Yellow) */}
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 rounded-lg font-semibold text-xs text-black bg-[#ca8a04] hover:bg-[#a16207] transition-colors"
                >
                  Abort
                </button>

                {/* Save Button (Green) */}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg font-semibold text-xs text-white bg-[#16a34a] hover:bg-[#15803d] transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {saving && <span className="animate-spin inline-block mr-1">⟳</span>}
                  <span>Save</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EXCEL IMPORT MODAL                                                        */}
      {/* ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-bold">Import Customer Data (.xls / .xlsx)</h2>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportPreview(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="p-4 bg-[#0d1624] border border-dashed border-[#24344d] rounded-xl text-center">
                <input
                  type="file"
                  id="excelFileInput"
                  accept=".xls,.xlsx"
                  onChange={handleImportFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="excelFileInput"
                  className="cursor-pointer inline-flex flex-col items-center justify-center space-y-2 py-4"
                >
                  <Upload className="w-8 h-8 text-emerald-400 animate-bounce" />
                  <span className="text-sm font-semibold text-white">Click to select Customer Data Excel file</span>
                  <span className="text-xs text-slate-400">
                    Supports legacy 14-column Customer Data (.xls &amp; .xlsx)
                  </span>
                  {importFile && (
                    <span className="mt-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                      Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </label>
              </div>

              {importing && (
                <div className="text-center py-4 text-emerald-400">
                  <span className="animate-spin inline-block mr-2">⟳</span> Processing Excel / HTML table data...
                </div>
              )}

              {/* Preview Stats */}
              {importPreview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Total Rows</span>
                      <span className="text-base font-bold text-white">{importPreview.summary.totalRows}</span>
                    </div>
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Valid Rows</span>
                      <span className="text-base font-bold text-emerald-400">{importPreview.summary.validCount}</span>
                    </div>
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Unique Models</span>
                      <span className="text-base font-bold text-blue-400">{importPreview.summary.uniqueModelsCount}</span>
                    </div>
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Unique Spares</span>
                      <span className="text-base font-bold text-purple-400">
                        {importPreview.summary.uniqueSparesCount}
                      </span>
                    </div>
                    <div className="bg-[#0d1624] p-3 rounded-lg border border-[#24344d]">
                      <span className="block text-slate-400 text-[10px]">Invalid Rows</span>
                      <span className="text-base font-bold text-rose-400">{importPreview.summary.invalidCount}</span>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="border border-[#24344d] rounded-lg overflow-x-auto max-h-56">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-[#0d1624] sticky top-0 text-slate-400 uppercase">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2">Model No.</th>
                          <th className="px-3 py-2">Part Code</th>
                          <th className="px-3 py-2">Part Description</th>
                          <th className="px-3 py-2">Customer Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2c42]">
                        {importPreview.preview?.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-[#16233a]">
                            <td className="px-3 py-1.5 font-mono text-slate-400">{p.rowNumber}</td>
                            <td className="px-3 py-1.5">{p.catName}</td>
                            <td className="px-3 py-1.5">{p.product}</td>
                            <td className="px-3 py-1.5 font-mono text-blue-400 font-bold">{p.modelNo}</td>
                            <td className="px-3 py-1.5 font-mono text-slate-300">{p.partCode || '-'}</td>
                            <td className="px-3 py-1.5">{p.partDescription || '-'}</td>
                            <td className="px-3 py-1.5 font-mono">₹{p.customerPrice}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      onClick={() => setShowImportModal(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmImport}
                      disabled={importing || importPreview.summary.validCount === 0}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
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

      {/* ========================================================================= */}
      {/* MODEL SPARE DETAILS MODAL                                                 */}
      {/* ========================================================================= */}
      {selectedModelForSpares && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                <div>
                  <h2 className="text-base font-bold">Spare Parts for Model: {selectedModelForSpares.modelNo}</h2>
                  <p className="text-[11px] text-slate-400">
                    {selectedModelForSpares.productName} ({selectedModelForSpares.brandName})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedModelForSpares(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{modelSpares.length} Spare Part(s) Linked</span>
                <a
                  href={`/api/masters/model-data/export?modelId=${selectedModelForSpares._id}`}
                  download
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] flex items-center space-x-1 font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Spares Sheet</span>
                </a>
              </div>

              <div className="border border-[#24344d] rounded-lg overflow-x-auto">
                <table className="w-full text-left text-[11px] text-slate-300">
                  <thead className="bg-[#0d1624] text-slate-400 uppercase">
                    <tr>
                      <th className="px-3 py-2">Part Code</th>
                      <th className="px-3 py-2">Spare Name</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Returnable</th>
                      <th className="px-3 py-2">Customer Price</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2c42]">
                    {loadingSpares ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">
                          Loading spares...
                        </td>
                      </tr>
                    ) : modelSpares.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-slate-400">
                          No spare parts mapped to this model yet. Add spares via Spares Master.
                        </td>
                      </tr>
                    ) : (
                      modelSpares.map((sp) => (
                        <tr key={sp._id} className="hover:bg-[#16233a]">
                          <td className="px-3 py-2 font-mono text-blue-400 font-bold">{sp.partCode}</td>
                          <td className="px-3 py-2 text-white font-medium">{sp.spareName}</td>
                          <td className="px-3 py-2 text-slate-400">{sp.partCategory}</td>
                          <td className="px-3 py-2">{sp.returnable}</td>
                          <td className="px-3 py-2 font-mono font-bold text-emerald-400">₹{sp.customerPrice}</td>
                          <td className="px-3 py-2 font-mono text-slate-400">₹{sp.price}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                sp.status === 'A' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {sp.status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

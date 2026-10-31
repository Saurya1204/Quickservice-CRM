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
  Wrench,
  Layers,
} from 'lucide-react';

interface SparePartItem {
  _id: string;
  partCode: string;
  spareName: string;
  partDescription?: string;
  clientId: string;
  clientName?: string;
  brandId: string;
  brandName?: string;
  categoryId: string;
  categoryName?: string;
  productId: string;
  productName?: string;
  modelId: string;
  modelNo: string;
  partCategory: 'A. Returnable' | 'B. Non Returnable (To Be Scrap at Site)' | 'C. Consumable';
  returnable: 'Yes' | 'No';
  customerPrice: number;
  price: number;
  status: 'A' | 'I';
  createdAt?: string;
}

export default function SparesMasterView() {
  const [spares, setSpares] = useState<SparePartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterModel, setFilterModel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Master Dropdown Lists
  const [clients, setClients] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const initialForm = {
    _id: '',
    clientId: '',
    brandId: '',
    categoryId: '',
    productId: '',
    modelId: '',
    modelNo: '',
    spareName: '',
    partDescription: '',
    partCode: '',
    partCategory: 'A. Returnable' as 'A. Returnable' | 'B. Non Returnable (To Be Scrap at Site)' | 'C. Consumable',
    returnable: 'Yes' as 'Yes' | 'No',
    customerPrice: 0,
    price: 0,
    status: 'A' as 'A' | 'I',
  };
  const [formData, setFormData] = useState(initialForm);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load masters for dropdowns
  const loadMasterData = async () => {
    try {
      const [resC, resB, resCat, resP, resM] = await Promise.all([
        fetch('/api/masters/clients'),
        fetch('/api/masters/brands'),
        fetch('/api/masters/categories'),
        fetch('/api/masters/products'),
        fetch('/api/masters/models?limit=500'),
      ]);
      const [dataC, dataB, dataCat, dataP, dataM] = await Promise.all([
        resC.json(),
        resB.json(),
        resCat.json(),
        resP.json(),
        resM.json(),
      ]);

      if (dataC.success) setClients(dataC.data || []);
      if (dataB.success) setBrands(dataB.data || []);
      if (dataCat.success) setCategories(dataCat.data || []);
      if (dataP.success) setProducts(dataP.data || []);
      if (dataM.success) setModels(dataM.data || []);
    } catch (e) {
      console.error('Error loading master dropdowns:', e);
    }
  };

  // Fetch spare parts list
  const fetchSpares = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterClient !== 'all') params.append('clientId', filterClient);
      if (filterBrand !== 'all') params.append('brandId', filterBrand);
      if (filterCategory !== 'all') params.append('categoryId', filterCategory);
      if (filterProduct !== 'all') params.append('productId', filterProduct);
      if (filterModel !== 'all') params.append('modelId', filterModel);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/masters/spare-parts?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSpares(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching spare parts:', e);
      showToast('error', 'Failed to load spare parts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    fetchSpares();
  }, [search, filterClient, filterBrand, filterCategory, filterProduct, filterModel, filterStatus]);

  // Dependent form dropdowns
  const formBrands = useMemo(() => {
    if (!formData.clientId) return [];
    return brands.filter((b) => b.clientId === formData.clientId || b.clientId?._id === formData.clientId);
  }, [brands, formData.clientId]);

  const formProducts = useMemo(() => {
    if (!formData.categoryId) return products;
    return products.filter((p) => p.categoryId === formData.categoryId || p.categoryId?._id === formData.categoryId);
  }, [products, formData.categoryId]);

  // Models dependent on Product (Strict Model Master Integration!)
  const formModels = useMemo(() => {
    if (!formData.productId) return [];
    return models.filter((m) => m.productId === formData.productId || m.productId?._id === formData.productId);
  }, [models, formData.productId]);

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: SparePartItem) => {
    setFormData({
      _id: item._id,
      clientId: item.clientId || '',
      brandId: item.brandId || '',
      categoryId: item.categoryId || '',
      productId: item.productId || '',
      modelId: item.modelId || '',
      modelNo: item.modelNo || '',
      spareName: item.spareName || '',
      partDescription: item.partDescription || '',
      partCode: item.partCode || '',
      partCategory: item.partCategory || 'A. Returnable',
      returnable: item.returnable || 'Yes',
      customerPrice: item.customerPrice ?? 0,
      price: item.price ?? 0,
      status: item.status || 'A',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Save / Update Spare Part
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.clientId ||
      !formData.brandId ||
      !formData.categoryId ||
      !formData.productId ||
      !formData.modelId ||
      !formData.spareName
    ) {
      showToast('error', 'Client, Brand, Category, Product, Model No and Spare Name are mandatory');
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/masters/spare-parts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        showToast('success', json.message || 'Spare Part saved successfully');
        setShowModal(false);
        fetchSpares();
      } else {
        showToast('error', json.message || 'Failed to save spare part');
      }
    } catch (e: any) {
      showToast('error', e.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Delete / Deactivate Spare Part
  const handleDelete = async (id: string, partName: string) => {
    if (!confirm(`Are you sure you want to delete spare part "${partName}"?`)) return;

    try {
      const res = await fetch(`/api/masters/spare-parts?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Spare Part deleted successfully');
        fetchSpares();
      } else {
        showToast('error', json.message || 'Could not delete spare part');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error deleting spare part');
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
            <h1 className="text-xl font-bold text-white tracking-wide">SPARES PARTS</h1>
            <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {spares.length} Records
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain product spare parts catalog, pricing, returnable policies, and Model Master bindings
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Spares Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD</span>
          </button>

          {/* Download Spare Part List Button (Legacy Feature) */}
          <a
            href="/api/masters/spare-parts/export"
            download
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Spare Part List</span>
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Spare Name, Code, Model, Product..."
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

      {/* Spares Listing Table */}
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
                <th className="px-4 py-3">Spare Name</th>
                <th className="px-4 py-3">Part Description</th>
                <th className="px-4 py-3">Part Code</th>
                <th className="px-4 py-3">Part Category</th>
                <th className="px-4 py-3">Returnable</th>
                <th className="px-4 py-3 font-mono">Cust. Price</th>
                <th className="px-4 py-3 font-mono">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2c42]">
              {loading ? (
                <tr>
                  <td colSpan={14} className="text-center py-10 text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span> Loading spare parts...
                  </td>
                </tr>
              ) : spares.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-10 text-slate-400">
                    No spare parts found. Click &quot;ADD&quot; to create a new spare part.
                  </td>
                </tr>
              ) : (
                spares.map((item) => (
                  <tr key={item._id} className="hover:bg-[#16233a] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{item.clientName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.brandName || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">{item.categoryName || '-'}</td>
                    <td className="px-4 py-3 text-white">{item.productName || '-'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-400">{item.modelNo}</td>
                    <td className="px-4 py-3 font-medium text-white">{item.spareName}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{item.partDescription || '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{item.partCode}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">{item.partCategory}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.returnable === 'Yes'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.returnable}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">₹{item.customerPrice}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">₹{item.price}</td>
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
                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Spare Part"
                        className="p-1.5 bg-[#0e1726] hover:bg-amber-600/20 text-amber-400 rounded border border-[#24344d] hover:border-amber-500/40 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(item._id, item.spareName)}
                        title="Delete Spare Part"
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
      {/* ADD / EDIT SPARES MODAL (Responsive Two-Column Form Mst_SparesADD.aspx)    */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-xs text-white">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold tracking-wide">
                  {isEditing ? `EDIT SPARE PART: ${formData.spareName}` : 'ADD SPARE PART'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form: Exact Two-Column Legacy Layout */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ---------------- LEFT COLUMN ---------------- */}
                <div className="space-y-4">
                  {/* 1. Client (Mandatory) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Client *</label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          clientId: e.target.value,
                          brandId: '',
                          modelId: '',
                          modelNo: '',
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

                  {/* 2. Product Category (Mandatory) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Product Category *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          categoryId: e.target.value,
                          productId: '',
                          modelId: '',
                          modelNo: '',
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

                  {/* 3. Model No. (Mandatory - STRICT MODEL MASTER INTEGRATION!) */}
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Model No. * <span className="text-[10px] text-blue-400">(Fetched from Model Master)</span>
                    </label>
                    <select
                      value={formData.modelId}
                      onChange={(e) => {
                        const selected = models.find((m) => m._id === e.target.value);
                        setFormData({
                          ...formData,
                          modelId: e.target.value,
                          modelNo: selected ? selected.modelNo : '',
                        });
                      }}
                      required
                      disabled={!formData.productId}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-mono font-bold disabled:opacity-50"
                    >
                      <option value="">---Select Model No---</option>
                      {formModels.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.modelNo} {m.modelDescription ? `(${m.modelDescription})` : ''}
                        </option>
                      ))}
                    </select>
                    {formModels.length === 0 && formData.productId && (
                      <p className="text-[10px] text-amber-400 mt-1">
                        No active models found for this product in Model Master.
                      </p>
                    )}
                  </div>

                  {/* 4. Part Description */}
                  <div>
                    <label className="block text-slate-400 mb-1">Part Description</label>
                    <textarea
                      rows={3}
                      value={formData.partDescription}
                      onChange={(e) => setFormData({ ...formData, partDescription: e.target.value })}
                      placeholder="Enter part technical description or specifications"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* 5. Part Category (Legacy Options) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Part Category</label>
                    <select
                      value={formData.partCategory}
                      onChange={(e) => setFormData({ ...formData, partCategory: e.target.value as any })}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="A. Returnable">A. Returnable</option>
                      <option value="B. Non Returnable (To Be Scrap at Site)">
                        B. Non Returnable (To Be Scrap at Site)
                      </option>
                      <option value="C. Consumable">C. Consumable</option>
                    </select>
                  </div>

                  {/* 6. Customer Price */}
                  <div>
                    <label className="block text-slate-400 mb-1">Customer Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.customerPrice}
                      onChange={(e) => setFormData({ ...formData, customerPrice: Number(e.target.value) })}
                      placeholder="0.00"
                      required
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* ---------------- RIGHT COLUMN ---------------- */}
                <div className="space-y-4">
                  {/* 7. Brand (Mandatory, Dependent on Client) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Brand *</label>
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

                  {/* 8. Product (Mandatory, Dependent on Category) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Product *</label>
                    <select
                      value={formData.productId}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          productId: e.target.value,
                          modelId: '',
                          modelNo: '',
                        });
                      }}
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

                  {/* 9. Spare Name (Mandatory) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Spare Name *</label>
                    <input
                      type="text"
                      value={formData.spareName}
                      onChange={(e) => setFormData({ ...formData, spareName: e.target.value })}
                      placeholder="e.g. Copper Condenser Coil, PCB Board"
                      required
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* 10. Part Code */}
                  <div>
                    <label className="block text-slate-400 mb-1">Part Code</label>
                    <input
                      type="text"
                      value={formData.partCode}
                      onChange={(e) => setFormData({ ...formData, partCode: e.target.value })}
                      placeholder="e.g. PRT-100234"
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* 11. Returnable (Dropdown: Yes / No) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Returnable</label>
                    <select
                      value={formData.returnable}
                      onChange={(e) => setFormData({ ...formData, returnable: e.target.value as 'Yes' | 'No' })}
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* 12. Price (Base / Procurement Cost) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      placeholder="0.00"
                      required
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
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
    </div>
  );
}

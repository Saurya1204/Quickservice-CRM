'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  Building2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import PincodeField from '@/components/common/PincodeLookup';

interface VendorItem {
  _id: string;
  vendorId: string;
  vendorAs: 'Supplier' | 'Refurbish';
  vendorName: string;
  address?: string;
  pincode?: string;
  district?: string;
  state?: string;
  city?: string;
  landlineNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  proprietorName?: string;
  proprietorContactNumbers?: string;
  proprietorEmailId?: string;
  bankName?: string;
  branch?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscNumber?: string;
  paymentTerms?: string;
  otherClient?: string;
  status: 'Active' | 'Inactive' | 'Black Listed';
  createdAt?: string;
}

interface VendorDocItem {
  _id: string;
  vendorId: string;
  vendorName?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedAt: string;
}

export default function VendorMasterView() {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterVendorAs, setFilterVendorAs] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Document Management Modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedVendorForDocs, setSelectedVendorForDocs] = useState<VendorItem | null>(null);
  const [vendorDocs, setVendorDocs] = useState<VendorDocItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docUploadForm, setDocUploadForm] = useState({
    vendorId: '',
    documentType: 'Address Proof Document',
    file: null as File | null,
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Vendor Form State
  const initialForm = {
    _id: '',
    vendorAs: 'Supplier' as 'Supplier' | 'Refurbish',
    vendorName: '',
    address: '',
    pincode: '',
    district: '',
    state: '',
    city: '',
    landlineNumber: '',
    gstNumber: '',
    panNumber: '',
    proprietorName: '',
    proprietorContactNumbers: '',
    proprietorEmailId: '',
    bankName: '',
    branch: '',
    accountHolderName: '',
    accountNumber: '',
    ifscNumber: '',
    paymentTerms: '',
    otherClient: '',
    status: 'Active' as 'Active' | 'Inactive' | 'Black Listed',
  };
  const [formData, setFormData] = useState(initialForm);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Fetch vendors list
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterVendorAs !== 'all') params.append('vendorAs', filterVendorAs);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const res = await fetch(`/api/masters/vendors?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setVendors(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching vendors:', e);
      showToast('error', 'Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, filterVendorAs, filterStatus]);

  // Open Add modal
  const handleOpenAdd = () => {
    setFormData(initialForm);
    setIsEditing(false);
    setShowModal(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: VendorItem) => {
    setFormData({
      _id: item._id,
      vendorAs: item.vendorAs || 'Supplier',
      vendorName: item.vendorName || '',
      address: item.address || '',
      pincode: item.pincode || '',
      district: item.district || '',
      state: item.state || '',
      city: item.city || '',
      landlineNumber: item.landlineNumber || '',
      gstNumber: item.gstNumber || '',
      panNumber: item.panNumber || '',
      proprietorName: item.proprietorName || '',
      proprietorContactNumbers: item.proprietorContactNumbers || '',
      proprietorEmailId: item.proprietorEmailId || '',
      bankName: item.bankName || '',
      branch: item.branch || '',
      accountHolderName: item.accountHolderName || '',
      accountNumber: item.accountNumber || '',
      ifscNumber: item.ifscNumber || '',
      paymentTerms: item.paymentTerms || '',
      otherClient: item.otherClient || '',
      status: item.status || 'Active',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Save / Update Vendor
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorName || !formData.vendorAs) {
      showToast('error', 'Vendor Name and Vendor As are required');
      return;
    }

    setSaving(true);
    try {
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch('/api/masters/vendors', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();

      if (json.success) {
        showToast('success', json.message || 'Vendor saved successfully');
        setShowModal(false);
        fetchVendors();
      } else {
        showToast('error', json.message || 'Failed to save vendor');
      }
    } catch (e: any) {
      showToast('error', e.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  // Delete / Deactivate Vendor
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate vendor "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/vendors?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message || 'Vendor deactivated successfully');
        fetchVendors();
      } else {
        showToast('error', json.message || 'Error deleting vendor');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error deleting vendor');
    }
  };

  // Status Change Quick Action
  const handleStatusChange = async (id: string, newStatus: 'Active' | 'Inactive' | 'Black Listed') => {
    try {
      const res = await fetch('/api/masters/vendors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('success', json.message);
        fetchVendors();
      } else {
        showToast('error', json.message || 'Failed to update status');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error updating status');
    }
  };

  // Fetch Vendor Documents
  const loadVendorDocs = async (vId: string) => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/masters/vendors/documents?vendorId=${vId}`);
      const json = await res.json();
      if (json.success) {
        setVendorDocs(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching vendor docs:', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Open Document Modal
  const handleOpenDocModal = (vendor?: VendorItem) => {
    const target = vendor || vendors[0] || null;
    setSelectedVendorForDocs(target);
    setDocUploadForm({
      vendorId: target?._id || '',
      documentType: 'Address Proof Document',
      file: null,
    });
    if (target?._id) {
      loadVendorDocs(target._id);
    }
    setShowDocModal(true);
  };

  // Upload Vendor Document
  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUploadForm.vendorId || !docUploadForm.documentType || !docUploadForm.file) {
      showToast('error', 'Please select Vendor, Document Type, and a valid File');
      return;
    }

    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('vendorId', docUploadForm.vendorId);
      fd.append('documentType', docUploadForm.documentType);
      fd.append('file', docUploadForm.file);

      const res = await fetch('/api/masters/vendors/documents', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();

      if (json.success) {
        showToast('success', 'Document uploaded successfully');
        setDocUploadForm({ ...docUploadForm, file: null });
        loadVendorDocs(docUploadForm.vendorId);
      } else {
        showToast('error', json.message || 'Upload failed');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error uploading document');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/masters/vendors/documents?id=${docId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('success', 'Document deleted');
        if (selectedVendorForDocs?._id) {
          loadVendorDocs(selectedVendorForDocs._id);
        }
      } else {
        showToast('error', json.message || 'Delete failed');
      }
    } catch (e: any) {
      showToast('error', e.message || 'Error deleting document');
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
            <h1 className="text-xl font-bold text-white tracking-wide">Vendor Master</h1>
            <span className="bg-blue-600/20 text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {vendors.length} Vendors
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage procurement suppliers, refurbish partners, banking records, and compliance documents
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Vendor Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD</span>
          </button>

          {/* Upload Document Button (Red Style) */}
          <button
            onClick={() => handleOpenDocModal()}
            className="flex items-center space-x-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          {/* Export Vendor List */}
          <a
            href="/api/masters/vendors/export"
            download
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export (.xlsx)</span>
          </a>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Vendor Name, ID, GST, PAN, City, Phone..."
            className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterVendorAs}
          onChange={(e) => setFilterVendorAs(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Vendor Types</option>
          <option value="Supplier">Supplier</option>
          <option value="Refurbish">Refurbish</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#0d1624] border border-[#24344d] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Black Listed">Black Listed</option>
        </select>
      </div>

      {/* Vendor Records Table */}
      <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0d1624] text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-[#24344d]">
              <tr>
                <th className="px-4 py-3">Vendor Name</th>
                <th className="px-4 py-3">Vendor As</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">City / Dist</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">Pincode</th>
                <th className="px-4 py-3 font-mono">GST / PAN</th>
                <th className="px-4 py-3">Proprietor</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e2c42]">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    <span className="inline-block animate-spin mr-2">⟳</span> Loading vendors...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-10 text-slate-400">
                    No vendors found. Click &quot;ADD&quot; to create a vendor record.
                  </td>
                </tr>
              ) : (
                vendors.map((item) => (
                  <tr key={item._id} className="hover:bg-[#16233a] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-white block">{item.vendorName}</span>
                      <span className="font-mono text-[10px] text-blue-400">{item.vendorId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.vendorAs === 'Supplier'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {item.vendorAs}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{item.address || '-'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.city || '-'}
                      {item.district ? `, ${item.district}` : ''}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.state || '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{item.pincode || '-'}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span className="block text-slate-300">GST: {item.gstNumber || '-'}</span>
                      <span className="block text-slate-400">PAN: {item.panNumber || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{item.proprietorName || '-'}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span className="block text-slate-300">{item.proprietorContactNumbers || '-'}</span>
                      <span className="block text-slate-400 text-[10px]">{item.proprietorEmailId || ''}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'Black Listed'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                      {/* Upload / View Documents */}
                      <button
                        onClick={() => handleOpenDocModal(item)}
                        title="Upload / View Documents"
                        className="p-1.5 bg-[#0e1726] hover:bg-red-600/20 text-red-400 rounded border border-[#24344d] hover:border-red-500/40 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Vendor"
                        className="p-1.5 bg-[#0e1726] hover:bg-amber-600/20 text-amber-400 rounded border border-[#24344d] hover:border-amber-500/40 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Deactivate */}
                      <button
                        onClick={() => handleDelete(item._id, item.vendorName)}
                        title="Deactivate Vendor"
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
      {/* ADD / EDIT VENDOR MODAL (Responsive Form: 3 Sections Mst_VendorADD.aspx)   */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold tracking-wide">
                  {isEditing ? `EDIT VENDOR: ${formData.vendorName}` : 'ADD VENDOR'}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
              {/* SECTION 1: VENDOR DETAILS */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 mb-3 pb-1 border-b border-[#24344d]">
                  1. Vendor Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Vendor As *</label>
                      <select
                        value={formData.vendorAs}
                        onChange={(e) => setFormData({ ...formData, vendorAs: e.target.value as any })}
                        required
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        <option value="Supplier">Supplier</option>
                        <option value="Refurbish">Refurbish</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Address</label>
                      <textarea
                        rows={2}
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street address, building, premises"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Pincode (Auto Location Lookup)</label>
                      <PincodeField
                        value={formData.pincode}
                        onChange={(pin) => setFormData({ ...formData, pincode: pin })}
                        onLocationFound={(loc) => {
                          setFormData((prev) => ({
                            ...prev,
                            state: loc.state || prev.state,
                            district: loc.district || prev.district,
                            city: loc.city || prev.city,
                          }));
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">District</label>
                      <input
                        type="text"
                        value={formData.district}
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Vendor Name *</label>
                      <input
                        type="text"
                        value={formData.vendorName}
                        onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                        placeholder="Enter full vendor business name"
                        required
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Landline Number</label>
                      <input
                        type="text"
                        value={formData.landlineNumber}
                        onChange={(e) => setFormData({ ...formData, landlineNumber: e.target.value })}
                        placeholder="011-XXXXXXXX"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: GOVERNMENT DETAILS */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 pb-1 border-b border-[#24344d]">
                  2. Government Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 mb-1">GST Number</label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Proprietor Name</label>
                      <input
                        type="text"
                        value={formData.proprietorName}
                        onChange={(e) => setFormData({ ...formData, proprietorName: e.target.value })}
                        placeholder="Owner or primary contact name"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Proprietor Email ID</label>
                      <input
                        type="email"
                        value={formData.proprietorEmailId}
                        onChange={(e) => setFormData({ ...formData, proprietorEmailId: e.target.value })}
                        placeholder="vendor@company.com"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 mb-1">PAN Number</label>
                      <input
                        type="text"
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                        placeholder="ABCDE1234F"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Proprietor Contact Numbers</label>
                      <input
                        type="text"
                        value={formData.proprietorContactNumbers}
                        onChange={(e) => setFormData({ ...formData, proprietorContactNumbers: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: BANK DETAILS */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 pb-1 border-b border-[#24344d]">
                  3. Bank Details &amp; Commercials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="e.g. State Bank of India, HDFC"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={formData.accountHolderName}
                        onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">IFSC Number</label>
                      <input
                        type="text"
                        value={formData.ifscNumber}
                        onChange={(e) => setFormData({ ...formData, ifscNumber: e.target.value.toUpperCase() })}
                        placeholder="SBIN0001234"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Other Client / Reference</label>
                      <input
                        type="text"
                        value={formData.otherClient}
                        onChange={(e) => setFormData({ ...formData, otherClient: e.target.value })}
                        placeholder="Other OEM / CRM reference"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Branch</label>
                      <input
                        type="text"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                        placeholder="Branch location"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Account Number</label>
                      <input
                        type="text"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={formData.paymentTerms}
                        onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                        placeholder="e.g. 30 Days Net, Advance 50%"
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Status *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Black Listed">Black Listed</option>
                      </select>
                    </div>
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
      {/* VENDOR DOCUMENT MANAGEMENT MODAL (Upload Vendor Document)                  */}
      {/* ========================================================================= */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-xs text-white">
            <div className="flex items-center justify-between p-5 border-b border-[#24344d]">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-red-500" />
                <h2 className="text-base font-bold tracking-wide">Upload Vendor Document</h2>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a2942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Document Upload Form */}
              <form onSubmit={handleUploadDoc} className="bg-[#0d1624] p-5 rounded-xl border border-[#24344d] space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">New Document Upload</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Vendor Dropdown */}
                  <div>
                    <label className="block text-slate-400 mb-1">Vendor *</label>
                    <select
                      value={docUploadForm.vendorId}
                      onChange={(e) => {
                        setDocUploadForm({ ...docUploadForm, vendorId: e.target.value });
                        const v = vendors.find((vend) => vend._id === e.target.value);
                        setSelectedVendorForDocs(v || null);
                        if (e.target.value) loadVendorDocs(e.target.value);
                      }}
                      required
                      className="w-full bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="">---Select Vendor---</option>
                      {vendors.map((v) => (
                        <option key={v._id} value={v._id}>
                          {v.vendorName} ({v.vendorId})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Document Type Dropdown (Exact 4 Legacy Types) */}
                  <div>
                    <label className="block text-slate-400 mb-1">Document Type *</label>
                    <select
                      value={docUploadForm.documentType}
                      onChange={(e) => setDocUploadForm({ ...docUploadForm, documentType: e.target.value })}
                      required
                      className="w-full bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Address Proof Document">Address Proof Document</option>
                      <option value="GST Number Document">GST Number Document</option>
                      <option value="PAN Number Document">PAN Number Document</option>
                      <option value="Upload Cancel Cheque Image">Upload Cancel Cheque Image</option>
                    </select>
                  </div>

                  {/* File Input */}
                  <div>
                    <label className="block text-slate-400 mb-1">Document File (PDF / Images) *</label>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      onChange={(e) => setDocUploadForm({ ...docUploadForm, file: e.target.files?.[0] || null })}
                      required
                      className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={uploadingDoc}
                    className="px-6 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg font-bold flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {uploadingDoc && <span className="animate-spin mr-1">⟳</span>}
                    <span>Save Document</span>
                  </button>
                </div>
              </form>

              {/* Vendor Document History Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                  Uploaded Documents {selectedVendorForDocs ? `for ${selectedVendorForDocs.vendorName}` : ''}
                </h3>

                <div className="border border-[#24344d] rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-[#0d1624] text-slate-400 uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Document Type</th>
                        <th className="px-4 py-2.5">File Name</th>
                        <th className="px-4 py-2.5">Size</th>
                        <th className="px-4 py-2.5">Upload Date</th>
                        <th className="px-4 py-2.5">Uploaded By</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2c42]">
                      {loadingDocs ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">
                            Loading documents...
                          </td>
                        </tr>
                      ) : vendorDocs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-slate-400">
                            No documents uploaded yet for this vendor.
                          </td>
                        </tr>
                      ) : (
                        vendorDocs.map((doc) => (
                          <tr key={doc._id} className="hover:bg-[#16233a]">
                            <td className="px-4 py-2.5 font-medium text-white">{doc.documentType}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-300">{doc.fileName}</td>
                            <td className="px-4 py-2.5 text-slate-400">{(doc.fileSize / 1024).toFixed(1)} KB</td>
                            <td className="px-4 py-2.5 text-slate-400">{doc.uploadedAt ? doc.uploadedAt.slice(0, 10) : '-'}</td>
                            <td className="px-4 py-2.5 text-slate-400">{doc.uploadedBy || 'Admin'}</td>
                            <td className="px-4 py-2.5 text-right space-x-2">
                              {/* View / Download */}
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block p-1 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white transition-colors"
                                title="View Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteDoc(doc._id)}
                                className="p-1 bg-rose-600/20 text-rose-400 rounded hover:bg-rose-600 hover:text-white transition-colors"
                                title="Delete Document"
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

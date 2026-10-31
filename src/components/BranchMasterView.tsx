'use client';

import React, { useState, useEffect } from 'react';
import PincodeField from '@/components/common/PincodeLookup';
import MasterDocumentModal, { UploadDocumentButton } from '@/components/common/MasterDocumentModal';

interface BranchMasterViewProps {
  currentUser?: any;
}

export default function BranchMasterView({ currentUser }: BranchMasterViewProps) {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [selectedBranchForDocs, setSelectedBranchForDocs] = useState<any | null>(null);
  const [branchDocs, setBranchDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Initial Form Data according to Section 6
  const initialFormData = {
    // Section A. Basic Branch Details
    region: 'North',
    branchName: '',
    address: '',
    landmark: '',
    pincode: '',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: '',
    contactNumber: '',
    emailId: '',
    status: 'A',

    // Section B. GST Details
    shopEstablishmentReg: '',
    gstNumber: '',

    // Section C. Premises Details
    premisesOwnership: 'Rented',
    rentAgreement: 'Yes',
    agreementPeriod: '11 Months',
    renewalDate: '',
    rentDate: '',
    areaSqFt: 500,
    warehouse: 'No',

    // Section D. Connection Details
    broadbandConnection: 'Yes',
    alternateConnection: 'No',
    systemAvailability: 'Yes',
    printerAvailability: 'Yes',
    landlineNumber: '',
    billingDueDate: '',

    // Section E. Power Details
    electricityConnection: 'Landlord',
    wattage: 5000,
    inverterAvailability: 'Yes',
    inverterCapacity: 1500,
    fireSafetyNorms: 'Yes',
    refillingDate: '',

    // Section F. Branch Manager Details
    branchManagerName: '',
    managerContactNumber: '',
    managerEmailId: '',

    // Section G. Store Manager Details
    storeManagerName: '',
    storeManagerContactNumber: '',
    storeManagerEmailId: '',

    // Section H. Branch Coordinator Details
    branchCoordinatorName: '',
    branchCoordinatorContactNumber: '',
    branchCoordinatorEmailId: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [localityOptions, setLocalityOptions] = useState<string[]>([]);
  const [editingBranch, setEditingBranch] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Upload Form Data
  const [uploadBranchId, setUploadBranchId] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Address Proof Document');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchBranches();
  }, [filterRegion, filterStatus]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRegion !== 'ALL') params.set('region', filterRegion);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/masters/branches?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBranches(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setLocalityOptions([]);
    setEditingBranch(null);
  };

  const handleCancelForm = () => {
    handleResetForm();
    setShowAddForm(false);
  };

  const handleLocationFound = (loc: { state: string; district: string; city: string; locality: string }) => {
    setFormData((prev) => ({
      ...prev,
      state: loc.state,
      district: loc.district,
      city: loc.city,
      locality: loc.locality,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.branchName.trim()) {
      alert('Branch Name is required!');
      return;
    }

    setSaving(true);
    try {
      if (editingBranch) {
        const res = await fetch('/api/masters/branches', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingBranch._id,
            ...formData,
            updatedBy: currentUser?.fullName || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          handleResetForm();
          fetchBranches();
          alert('Branch updated successfully!');
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            createdBy: currentUser?.fullName || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          setShowAddForm(false);
          handleResetForm();
          fetchBranches();
          alert('Branch saved successfully!');
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

  const handleEdit = (b: any) => {
    setEditingBranch(b);
    setFormData({
      region: b.region || 'North',
      branchName: b.branchName || '',
      address: b.address || '',
      landmark: b.landmark || '',
      pincode: b.pincode || '',
      state: b.state || 'UTTAR PRADESH',
      district: b.district || 'GHAZIABAD',
      city: b.city || 'GHAZIABAD',
      locality: b.locality || '',
      contactNumber: b.contactNumber || '',
      emailId: b.emailId || '',
      status: b.status || 'A',

      shopEstablishmentReg: b.shopEstablishmentReg || '',
      gstNumber: b.gstNumber || '',

      premisesOwnership: b.premisesOwnership || 'Rented',
      rentAgreement: b.rentAgreement || 'Yes',
      agreementPeriod: b.agreementPeriod || '',
      renewalDate: b.renewalDate ? b.renewalDate.split('T')[0] : '',
      rentDate: b.rentDate ? b.rentDate.split('T')[0] : '',
      areaSqFt: b.areaSqFt || 0,
      warehouse: b.warehouse || 'No',

      broadbandConnection: b.broadbandConnection || 'Yes',
      alternateConnection: b.alternateConnection || 'No',
      systemAvailability: b.systemAvailability || 'Yes',
      printerAvailability: b.printerAvailability || 'Yes',
      landlineNumber: b.landlineNumber || '',
      billingDueDate: b.billingDueDate ? b.billingDueDate.split('T')[0] : '',

      electricityConnection: b.electricityConnection || 'Landlord',
      wattage: b.wattage || 0,
      inverterAvailability: b.inverterAvailability || 'Yes',
      inverterCapacity: b.inverterCapacity || 0,
      fireSafetyNorms: b.fireSafetyNorms || 'Yes',
      refillingDate: b.refillingDate ? b.refillingDate.split('T')[0] : '',

      branchManagerName: b.branchManagerName || '',
      managerContactNumber: b.managerContactNumber || '',
      managerEmailId: b.managerEmailId || '',

      storeManagerName: b.storeManagerName || '',
      storeManagerContactNumber: b.storeManagerContactNumber || '',
      storeManagerEmailId: b.storeManagerEmailId || '',

      branchCoordinatorName: b.branchCoordinatorName || '',
      branchCoordinatorContactNumber: b.branchCoordinatorContactNumber || '',
      branchCoordinatorEmailId: b.branchCoordinatorEmailId || '',
    });
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete branch "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/branches?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchBranches();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBranchIds(branches.map((b) => b._id));
    } else {
      setSelectedBranchIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedBranchIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Branch Document Operations
  const handleOpenUpload = (branchId?: string) => {
    setUploadBranchId(branchId || (branches.length > 0 ? branches[0]._id : ''));
    setUploadDocType('Address Proof Document');
    setUploadFile(null);
    setUploadMessage(null);
    setShowUploadModal(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadMessage(null);

    if (!uploadBranchId) {
      setUploadMessage({ type: 'error', text: 'Please select a branch.' });
      return;
    }
    if (!uploadFile) {
      setUploadMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('branchId', uploadBranchId);
      formDataUpload.append('documentType', uploadDocType);
      formDataUpload.append('file', uploadFile);
      formDataUpload.append('uploadedBy', currentUser?.fullName || 'Super Admin');

      const res = await fetch('/api/masters/branches/documents', {
        method: 'POST',
        body: formDataUpload,
      });
      const json = await res.json();

      if (json.success) {
        setUploadMessage({ type: 'success', text: json.message });
        setUploadFile(null);
        setTimeout(() => {
          setShowUploadModal(false);
          if (showDocsModal && selectedBranchForDocs) {
            fetchBranchDocs(selectedBranchForDocs._id);
          }
        }, 1200);
      } else {
        setUploadMessage({ type: 'error', text: json.message });
      }
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocs = async (branch: any) => {
    setSelectedBranchForDocs(branch);
    setShowDocsModal(true);
    fetchBranchDocs(branch._id);
  };

  const fetchBranchDocs = async (branchId: string) => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/masters/branches/documents?branchId=${branchId}`);
      const json = await res.json();
      if (json.success) {
        setBranchDocs(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDeleteDoc = async (docId: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) return;

    try {
      const res = await fetch(`/api/masters/branches/documents?id=${docId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        if (selectedBranchForDocs) {
          fetchBranchDocs(selectedBranchForDocs._id);
        }
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filtered and Paginated Branches
  const filtered = branches.filter((b) => {
    const matchSearch =
      b.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.crmCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.branchManagerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.pincode?.includes(searchTerm);
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedBranches = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Card */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#334155] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Branch Master</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono font-medium">
                {branches.length} Branches
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Regional Service Hubs, Premises Details, Connectivity, Power & Infrastructure Management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                if (showAddForm) {
                  handleCancelForm();
                } else {
                  handleResetForm();
                  setShowAddForm(true);
                }
              }}
              className="bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm px-4 py-2 rounded-md font-medium transition shadow-md whitespace-nowrap cursor-pointer"
            >
              <span>{showAddForm ? '✕ Back to List' : '+ ADD'}</span>
            </button>
            <UploadDocumentButton onClick={() => setShowUploadModal(true)} />
          </div>
        </div>

        {/* 2. Add / Edit Comprehensive Form */}
        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#172033] p-6 rounded-xl border border-[#334155]">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                {editingBranch ? `Edit Branch: ${editingBranch.branchName}` : 'Register New Branch Hub'}
              </h3>
              <span className="text-[11px] text-slate-400">* Mandatory fields</span>
            </div>

            {/* SECTION A. BASIC BRANCH DETAILS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1 flex items-center space-x-2">
                <span>A. Basic Branch Details</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Region *</label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    placeholder="e.g. Uttar Pradesh Hub"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Plot/Shop No, Street, Commercial Complex..."
                  className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Near Metro / Landmark"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    PIN Code (Auto-Fetches Location) *
                  </label>
                  <PincodeField
                    pincode={formData.pincode}
                    onPincodeChange={(pin) => setFormData((prev) => ({ ...prev, pincode: pin }))}
                    onLocationFound={handleLocationFound}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">State (Auto)</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">District (Auto)</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">City (Auto)</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Locality (Auto/Select)</label>
                  <input
                    type="text"
                    value={formData.locality}
                    onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                    placeholder="Locality / Area"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Email ID</label>
                  <input
                    type="email"
                    value={formData.emailId}
                    onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                    placeholder="branch@quickserves.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A">Active (A)</option>
                    <option value="I">Inactive (I)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION B. GST DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                B. GST Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Shop & Establishment Registration
                  </label>
                  <input
                    type="text"
                    value={formData.shopEstablishmentReg}
                    onChange={(e) => setFormData({ ...formData, shopEstablishmentReg: e.target.value })}
                    placeholder="Registration Certificate No."
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 09AAAAA0000A1Z5"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION C. PREMISES DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                C. Premises Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Premises Ownership</label>
                  <select
                    value={formData.premisesOwnership}
                    onChange={(e) => setFormData({ ...formData, premisesOwnership: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Rented">Rented</option>
                    <option value="Company">Company</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rent Agreement</label>
                  <select
                    value={formData.rentAgreement}
                    onChange={(e) => setFormData({ ...formData, rentAgreement: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Agreement Period</label>
                  <input
                    type="text"
                    value={formData.agreementPeriod}
                    onChange={(e) => setFormData({ ...formData, agreementPeriod: e.target.value })}
                    placeholder="e.g. 11 Months"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rent Date</label>
                  <input
                    type="date"
                    value={formData.rentDate}
                    onChange={(e) => setFormData({ ...formData, rentDate: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Area in Sq. Ft</label>
                  <input
                    type="number"
                    value={formData.areaSqFt}
                    onChange={(e) => setFormData({ ...formData, areaSqFt: Number(e.target.value) })}
                    placeholder="e.g. 750"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Warehouse</label>
                  <select
                    value={formData.warehouse}
                    onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION D. CONNECTION DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                D. Connection Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Broadband Connection</label>
                  <select
                    value={formData.broadbandConnection}
                    onChange={(e) => setFormData({ ...formData, broadbandConnection: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Alternate Connection</label>
                  <select
                    value={formData.alternateConnection}
                    onChange={(e) => setFormData({ ...formData, alternateConnection: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">System Availability</label>
                  <select
                    value={formData.systemAvailability}
                    onChange={(e) => setFormData({ ...formData, systemAvailability: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Printer Availability</label>
                  <select
                    value={formData.printerAvailability}
                    onChange={(e) => setFormData({ ...formData, printerAvailability: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Landline Number</label>
                  <input
                    type="text"
                    value={formData.landlineNumber}
                    onChange={(e) => setFormData({ ...formData, landlineNumber: e.target.value })}
                    placeholder="e.g. 0120-4567890"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Billing Due Date</label>
                  <input
                    type="date"
                    value={formData.billingDueDate}
                    onChange={(e) => setFormData({ ...formData, billingDueDate: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION E. POWER DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                E. Power Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Electricity Connection</label>
                  <select
                    value={formData.electricityConnection}
                    onChange={(e) => setFormData({ ...formData, electricityConnection: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Landlord">Landlord</option>
                    <option value="Own">Own</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Wattage (Watts)</label>
                  <input
                    type="number"
                    value={formData.wattage}
                    onChange={(e) => setFormData({ ...formData, wattage: Number(e.target.value) })}
                    placeholder="e.g. 5000"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Inverter Availability</label>
                  <select
                    value={formData.inverterAvailability}
                    onChange={(e) => setFormData({ ...formData, inverterAvailability: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Inverter Capacity (VA)</label>
                  <input
                    type="number"
                    value={formData.inverterCapacity}
                    onChange={(e) => setFormData({ ...formData, inverterCapacity: Number(e.target.value) })}
                    placeholder="e.g. 1500"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Fire Safety Norms</label>
                  <select
                    value={formData.fireSafetyNorms}
                    onChange={(e) => setFormData({ ...formData, fireSafetyNorms: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Refilling Date</label>
                  <input
                    type="date"
                    value={formData.refillingDate}
                    onChange={(e) => setFormData({ ...formData, refillingDate: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION F. BRANCH MANAGER DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                F. Branch Manager Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Manager Name</label>
                  <input
                    type="text"
                    value={formData.branchManagerName}
                    onChange={(e) => setFormData({ ...formData, branchManagerName: e.target.value })}
                    placeholder="Manager Full Name"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Manager Cell Number</label>
                  <input
                    type="tel"
                    value={formData.managerContactNumber}
                    onChange={(e) => setFormData({ ...formData, managerContactNumber: e.target.value })}
                    placeholder="Mobile Number"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Manager Email ID</label>
                  <input
                    type="email"
                    value={formData.managerEmailId}
                    onChange={(e) => setFormData({ ...formData, managerEmailId: e.target.value })}
                    placeholder="manager@quickserves.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION G. STORE MANAGER DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                G. Store Manager Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Store Manager Name</label>
                  <input
                    type="text"
                    value={formData.storeManagerName}
                    onChange={(e) => setFormData({ ...formData, storeManagerName: e.target.value })}
                    placeholder="Store Manager Name"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Store Manager Contact Number</label>
                  <input
                    type="tel"
                    value={formData.storeManagerContactNumber}
                    onChange={(e) => setFormData({ ...formData, storeManagerContactNumber: e.target.value })}
                    placeholder="Contact Number"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Store Manager Email ID</label>
                  <input
                    type="email"
                    value={formData.storeManagerEmailId}
                    onChange={(e) => setFormData({ ...formData, storeManagerEmailId: e.target.value })}
                    placeholder="store@quickserves.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION H. BRANCH COORDINATOR DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                H. Branch Coordinator Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Coordinator Name</label>
                  <input
                    type="text"
                    value={formData.branchCoordinatorName}
                    onChange={(e) => setFormData({ ...formData, branchCoordinatorName: e.target.value })}
                    placeholder="Coordinator Name"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Coordinator Contact Number</label>
                  <input
                    type="tel"
                    value={formData.branchCoordinatorContactNumber}
                    onChange={(e) => setFormData({ ...formData, branchCoordinatorContactNumber: e.target.value })}
                    placeholder="Contact Number"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Coordinator Email ID</label>
                  <input
                    type="email"
                    value={formData.branchCoordinatorEmailId}
                    onChange={(e) => setFormData({ ...formData, branchCoordinatorEmailId: e.target.value })}
                    placeholder="coordinator@quickserves.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Buttons: Save, Abort/Cancel, Reset */}
            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-[#334155]">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Reset Form
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-xs text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition"
              >
                Abort / Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition font-medium shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {saving ? 'Persisting...' : editingBranch ? 'Update Branch' : 'Save Branch Details'}
              </button>
            </div>
          </form>
        ) : null}

        {/* 3. Search & Filter Bar */}
        {!showAddForm && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#172033] p-3 rounded-lg border border-[#334155]/60">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search by name, CRM code, city, manager, pin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#111c2e] border border-[#334155] text-xs px-3 py-1.5 rounded-lg text-white focus:outline-none focus:border-emerald-500 w-64"
              />
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-[#111c2e] border border-[#334155] text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-none"
              >
                <option value="ALL">All Regions</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#111c2e] border border-[#334155] text-xs px-2.5 py-1.5 rounded-lg text-white focus:outline-none"
              >
                <option value="ALL">All Status</option>
                <option value="A">Active (A)</option>
                <option value="I">Inactive (I)</option>
              </select>
            </div>

            <div className="text-xs text-slate-400">
              Showing {paginatedBranches.length} of {filtered.length} records
            </div>
          </div>
        )}

        {/* 4. Branch Records Table */}
        {!showAddForm && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading branches...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No branch records found. Click "+ ADD BRANCH" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#334155]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="px-3 py-3 w-8 text-center">
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedBranchIds.length === branches.length && branches.length > 0}
                          className="accent-emerald-500 rounded"
                        />
                      </th>
                      <th className="px-3 py-3">CRM Code</th>
                      <th className="px-3 py-3">Branch Name</th>
                      <th className="px-3 py-3">Region</th>
                      <th className="px-3 py-3">State</th>
                      <th className="px-3 py-3">District</th>
                      <th className="px-3 py-3">City</th>
                      <th className="px-3 py-3">PIN Code</th>
                      <th className="px-3 py-3">Branch Manager</th>
                      <th className="px-3 py-3">Contact</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60">
                    {paginatedBranches.map((b) => (
                      <tr key={b._id} className="hover:bg-[#1e2a3e]/50 transition">
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedBranchIds.includes(b._id)}
                            onChange={() => handleSelectOne(b._id)}
                            className="accent-emerald-500 rounded"
                          />
                        </td>
                        <td className="px-3 py-3 font-mono text-emerald-400 font-semibold">{b.crmCode}</td>
                        <td className="px-3 py-3 font-medium text-white">{b.branchName}</td>
                        <td className="px-3 py-3">{b.region}</td>
                        <td className="px-3 py-3 text-slate-400">{b.state}</td>
                        <td className="px-3 py-3 text-slate-400">{b.district}</td>
                        <td className="px-3 py-3">{b.city}</td>
                        <td className="px-3 py-3 font-mono text-slate-400">{b.pincode}</td>
                        <td className="px-3 py-3">{b.branchManagerName || '—'}</td>
                        <td className="px-3 py-3 text-slate-400">{b.contactNumber || b.managerContactNumber || '—'}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                              b.status === 'A'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {b.status === 'A' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleViewDocs(b)}
                            title="Manage Documents"
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[11px] px-2 py-1 rounded border border-blue-500/30 transition"
                          >
                            📁 Docs
                          </button>
                          <button
                            onClick={() => handleEdit(b)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2 py-1 rounded border border-slate-700 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b._id, b.branchName)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] px-2 py-1 rounded border border-rose-500/20 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-400">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-[#334155] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-[#334155] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Master Document Modal */}
      <MasterDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        masterType="branch"
        masterTitle="Branch Master"
        entities={branches.map((b) => ({ id: b._id, name: b.branchName, code: b.crmCode }))}
        currentUser={currentUser}
      />

      {/* 6. VIEW DOCUMENTS MODAL */}
      {showDocsModal && selectedBranchForDocs && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>📁 Documents for: {selectedBranchForDocs.branchName}</span>
                  <span className="text-xs font-mono text-emerald-400">({selectedBranchForDocs.crmCode})</span>
                </h3>
                <p className="text-xs text-slate-400">View, download and verify branch compliance documents</p>
              </div>
              <button onClick={() => setShowDocsModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Total documents: {branchDocs.length}</span>
              <button
                onClick={() => handleOpenUpload(selectedBranchForDocs._id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition"
              >
                + Upload New Document
              </button>
            </div>

            {loadingDocs ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading documents...</div>
            ) : branchDocs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-[#172033] rounded-lg border border-[#334155]">
                No documents uploaded for this branch yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[#334155]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="px-3 py-2.5">Document Type</th>
                      <th className="px-3 py-2.5">File Name</th>
                      <th className="px-3 py-2.5">Uploaded By</th>
                      <th className="px-3 py-2.5">Upload Date</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60">
                    {branchDocs.map((doc) => (
                      <tr key={doc._id} className="hover:bg-[#1e2a3e]/50 transition">
                        <td className="px-3 py-2.5 font-medium text-white">{doc.documentType}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-300 truncate max-w-xs">{doc.fileName}</td>
                        <td className="px-3 py-2.5 text-slate-400">{doc.uploadedBy || 'Admin'}</td>
                        <td className="px-3 py-2.5 text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 text-right space-x-2">
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-xs px-2.5 py-1 rounded border border-blue-500/30 transition inline-block"
                          >
                            Preview / View
                          </a>
                          <a
                            href={doc.fileUrl}
                            download={doc.fileName}
                            className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs px-2.5 py-1 rounded border border-emerald-500/30 transition inline-block"
                          >
                            Download
                          </a>
                          <button
                            onClick={() => handleDeleteDoc(doc._id, doc.fileName)}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs px-2 py-1 rounded border border-rose-500/20 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-[#334155]">
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

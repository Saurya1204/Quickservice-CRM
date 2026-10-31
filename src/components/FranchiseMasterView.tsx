'use client';

import React, { useState, useEffect } from 'react';
import PincodeField from '@/components/common/PincodeLookup';
const FRANCHISE_DOCUMENT_TYPES = [
  'Firm Address Proof',
  'GST Certificate',
  'PAN Card',
  'Registration Certificate',
  'Proprietor Photo',
  'Proprietor Address Proof',
  'Partnership Deed',
  'Aadhar Card',
  'Cancel Cheque',
  'Rent Agreement',
] as const;

const ALL_LANGUAGES = [
  'Hindi',
  'English',
  'Punjabi',
  'Bengali',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Tamil',
  'Telugu',
  'Odia',
  'Dogri',
  'Marathi',
  'Assamese',
  'Konkani',
  'Kashmiri',
  'Maithili',
  'Manipuri',
  'Bodo',
];

interface FranchiseMasterViewProps {
  currentUser?: any;
}

export default function FranchiseMasterView({ currentUser }: FranchiseMasterViewProps) {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFranchise, setEditingFranchise] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dedicated Document Upload & Management Modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docModalTab, setDocModalTab] = useState<'upload' | 'repository'>('upload');
  const [docFranchiseCRMCode, setDocFranchiseCRMCode] = useState('');
  const [docFranchiseId, setDocFranchiseId] = useState('');
  const [docType, setDocType] = useState<string>(FRANCHISE_DOCUMENT_TYPES[0]);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [franchiseDocs, setFranchiseDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docSearchTerm, setDocSearchTerm] = useState('');

  // Initial Form Data according to prompt Sections A to I
  const initialFormData = {
    // Section A. Basic Franchise Details
    crmCode: '',
    region: 'North',
    firmType: 'Proprietor',
    firmName: '',
    firmAddress: '',
    landmark: '',
    pincode: '',
    state: 'UTTAR PRADESH',
    district: 'GHAZIABAD',
    city: 'GHAZIABAD',
    locality: '',
    contactNumber: '',
    emailId: '',

    // Section B. Government Details
    gstNumber: '',
    panCardNo: '',
    shopEstablishmentReg: '',
    establishmentMonthYear: '',

    // Section C. Proprietor Details
    proprietorName: '',
    propContactNumber: '',
    propResidentialAddress: '',
    propEmailId: '',
    propPanCardNo: '',
    propAadharCardNo: '',
    propLanguages: ['Hindi', 'English'],

    // Section D. Smartphone Availability
    smartphoneAvailability: 'Yes',

    // Section E. Bank Details
    bankName: '',
    bankBranch: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    securityAmount: 0,
    turnOver: 0,

    // Section F. Infrastructure Information
    spaceOwnership: 'Rented',
    serviceCentreSpace: '500 Sq Ft',
    agreementDate: '',
    validity: '11 Months',
    systemAvailability: 'Yes',
    printerAvailability: 'Yes',
    internetConnectivity: 'Broadband',
    inverterAvailability: 'Yes',
    coveringArea: '20 Kms',
    numberOfTechnician: 2,
    brandHandling: '',

    // Section G. Back End Stuff
    backendManagerName: '',
    backendContactNumber: '',
    backendEmailId: '',
    backendLanguages: ['Hindi', 'English'],

    // Section H. Reporting
    reportingBranch: '',
    reportingBranchId: '',
    areaManagerName: '',
    managerEmailId: '',
    managerContactNumber: '',
    reportingCcoName: '',
    ccoContactNumber: '',
    ccoEmailId: '',

    // Section I. SLA / TAT Performance
    installationResponseTime: 4,
    installationResolutionTime: 24,
    serviceResponseTime: 4,
    serviceResolutionTime: 48,
    status: 'A',
    asfCode: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [localityOptions, setLocalityOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchFranchises();
    fetchBranches();
  }, [filterRegion, filterStatus]);

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/masters/branches');
      const json = await res.json();
      if (json.success) {
        setBranches(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching branches:', e);
    }
  };

  const fetchFranchises = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRegion !== 'ALL') params.set('region', filterRegion);
      if (filterStatus !== 'ALL') params.set('status', filterStatus);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/masters/franchises?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setFranchises(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching franchises:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFormData(initialFormData);
    setLocalityOptions([]);
    setEditingFranchise(null);
  };

  const handleCancelForm = () => {
    handleResetForm();
    setShowAddForm(false);
  };

  // Location auto-population
  const handleLocationFound = (loc: { state: string; district: string; city: string; locality: string }) => {
    setFormData((prev) => ({
      ...prev,
      state: loc.state,
      district: loc.district,
      city: loc.city,
      locality: loc.locality,
    }));
    if (loc.locality && !localityOptions.includes(loc.locality)) {
      setLocalityOptions((prev) => [loc.locality, ...prev]);
    }
  };

  // Submit Franchise
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingFranchise) {
        const res = await fetch('/api/masters/franchises', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingFranchise._id,
            ...formData,
            updatedBy: currentUser?.fullName || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          alert('Franchise updated successfully!');
          setShowAddForm(false);
          setEditingFranchise(null);
          fetchFranchises();
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/franchises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            createdBy: currentUser?.fullName || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          alert(json.message || 'Franchise created successfully!');
          setShowAddForm(false);
          handleResetForm();
          fetchFranchises();
        } else {
          alert(json.message);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while saving franchise.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (f: any) => {
    setEditingFranchise(f);
    setFormData({
      crmCode: f.crmCode || '',
      region: f.region || 'North',
      firmType: f.firmType || 'Proprietor',
      firmName: f.firmName || '',
      firmAddress: f.firmAddress || '',
      landmark: f.landmark || '',
      pincode: f.pincode || '',
      state: f.state || 'UTTAR PRADESH',
      district: f.district || 'GHAZIABAD',
      city: f.city || 'GHAZIABAD',
      locality: f.locality || '',
      contactNumber: f.contactNumber || '',
      emailId: f.emailId || '',

      gstNumber: f.gstNumber || '',
      panCardNo: f.panCardNo || '',
      shopEstablishmentReg: f.shopEstablishmentReg || '',
      establishmentMonthYear: f.establishmentMonthYear || '',

      proprietorName: f.proprietorName || '',
      propContactNumber: f.propContactNumber || '',
      propResidentialAddress: f.propResidentialAddress || '',
      propEmailId: f.propEmailId || '',
      propPanCardNo: f.propPanCardNo || '',
      propAadharCardNo: f.propAadharCardNo || '',
      propLanguages: f.propLanguages && f.propLanguages.length > 0 ? f.propLanguages : ['Hindi', 'English'],

      smartphoneAvailability: f.smartphoneAvailability || 'Yes',

      bankName: f.bankName || '',
      bankBranch: f.bankBranch || '',
      accountHolderName: f.accountHolderName || '',
      accountNumber: f.accountNumber || '',
      ifscCode: f.ifscCode || '',
      securityAmount: f.securityAmount || 0,
      turnOver: f.turnOver || 0,

      spaceOwnership: f.spaceOwnership || 'Rented',
      serviceCentreSpace: f.serviceCentreSpace || '500 Sq Ft',
      agreementDate: f.agreementDate ? f.agreementDate.split('T')[0] : '',
      validity: f.validity || '11 Months',
      systemAvailability: f.systemAvailability || 'Yes',
      printerAvailability: f.printerAvailability || 'Yes',
      internetConnectivity: f.internetConnectivity || 'Broadband',
      inverterAvailability: f.inverterAvailability || 'Yes',
      coveringArea: f.coveringArea || '20 Kms',
      numberOfTechnician: f.numberOfTechnician || 2,
      brandHandling: f.brandHandling || '',

      backendManagerName: f.backendManagerName || '',
      backendContactNumber: f.backendContactNumber || '',
      backendEmailId: f.backendEmailId || '',
      backendLanguages: f.backendLanguages && f.backendLanguages.length > 0 ? f.backendLanguages : ['Hindi', 'English'],

      reportingBranch: f.reportingBranch || '',
      reportingBranchId: f.reportingBranchId || '',
      areaManagerName: f.areaManagerName || '',
      managerEmailId: f.managerEmailId || '',
      managerContactNumber: f.managerContactNumber || '',
      reportingCcoName: f.reportingCcoName || '',
      ccoContactNumber: f.ccoContactNumber || '',
      ccoEmailId: f.ccoEmailId || '',

      installationResponseTime: f.installationResponseTime || 4,
      installationResolutionTime: f.installationResolutionTime || 24,
      serviceResponseTime: f.serviceResponseTime || 4,
      serviceResolutionTime: f.serviceResolutionTime || 48,
      status: f.status || 'A',
      asfCode: f.asfCode || '',
    });

    if (f.locality) {
      setLocalityOptions([f.locality]);
    }
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete franchise "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/franchises?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchFranchises();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Open Document Modal
  const handleOpenDocModal = (franchise?: any) => {
    if (franchise) {
      setDocFranchiseId(franchise._id);
      setDocFranchiseCRMCode(franchise.crmCode || '');
    } else if (franchises.length > 0) {
      setDocFranchiseId(franchises[0]._id);
      setDocFranchiseCRMCode(franchises[0].crmCode || '');
    } else {
      setDocFranchiseId('');
      setDocFranchiseCRMCode('');
    }
    setDocType(FRANCHISE_DOCUMENT_TYPES[0]);
    setDocFile(null);
    setUploadMessage(null);
    setShowDocModal(true);
    fetchFranchiseDocs(franchise ? franchise.crmCode : '');
  };

  const fetchFranchiseDocs = async (crmCodeFilter?: string) => {
    setLoadingDocs(true);
    try {
      const url = crmCodeFilter
        ? `/api/masters/franchises/documents?crmCode=${crmCodeFilter}`
        : `/api/masters/franchises/documents`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setFranchiseDocs(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching franchise documents:', e);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Synchronize Franchise CRM Code & Franchise selection in Upload Form
  const handleDocCRMCodeChange = (code: string) => {
    const clean = code.toUpperCase().trim();
    setDocFranchiseCRMCode(clean);
    const matched = franchises.find((f) => f.crmCode?.toUpperCase() === clean);
    if (matched) {
      setDocFranchiseId(matched._id);
    }
  };

  const handleDocFranchiseChange = (id: string) => {
    setDocFranchiseId(id);
    const matched = franchises.find((f) => f._id === id);
    if (matched) {
      setDocFranchiseCRMCode(matched.crmCode || '');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadMessage(null);

    if (!docFranchiseId) {
      setUploadMessage({ type: 'error', text: 'Please select a valid franchise.' });
      return;
    }
    if (!docFile) {
      setUploadMessage({ type: 'error', text: 'Please select a document file to upload.' });
      return;
    }

    setUploadingDoc(true);
    try {
      const uploadForm = new FormData();
      uploadForm.append('franchiseId', docFranchiseId);
      uploadForm.append('franchiseCRMCode', docFranchiseCRMCode);
      uploadForm.append('documentType', docType);
      uploadForm.append('file', docFile);
      uploadForm.append('uploadedBy', currentUser?.fullName || 'Super Admin');

      const res = await fetch('/api/masters/franchises/documents', {
        method: 'POST',
        body: uploadForm,
      });
      const json = await res.json();

      if (json.success) {
        setUploadMessage({ type: 'success', text: json.message || 'Document uploaded successfully!' });
        setDocFile(null);
        fetchFranchiseDocs(docFranchiseCRMCode);
        setDocModalTab('repository');
      } else {
        setUploadMessage({ type: 'error', text: json.message || 'Failed to upload document.' });
      }
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.message || 'Network error occurred.' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete document "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/franchises/documents?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setFranchiseDocs((prev) => prev.filter((d) => d._id !== id));
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filtered & Paginated Franchises
  const filteredFranchises = franchises.filter((f) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      f.firmName?.toLowerCase().includes(q) ||
      f.crmCode?.toLowerCase().includes(q) ||
      f.contactNumber?.includes(q) ||
      f.emailId?.toLowerCase().includes(q) ||
      f.city?.toLowerCase().includes(q) ||
      f.state?.toLowerCase().includes(q) ||
      f.proprietorName?.toLowerCase().includes(q);
    const matchRegion = filterRegion === 'ALL' || f.region === filterRegion;
    const matchStatus = filterStatus === 'ALL' || f.status === filterStatus;
    return matchSearch && matchRegion && matchStatus;
  });

  const totalPages = Math.ceil(filteredFranchises.length / itemsPerPage) || 1;
  const paginatedFranchises = filteredFranchises.slice(
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
              <span>Franchise Master</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono font-medium">
                {franchises.length} Active Centers
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Service Partner Hubs, Statutory Compliance, Commercials, Infrastructure & SLAs
            </p>
          </div>

          {/* Action Buttons matching User Screenshot */}
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
            <button
              type="button"
              onClick={() => handleOpenDocModal()}
              className="bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white text-xs sm:text-sm px-4 py-2 rounded-md font-medium transition shadow-md whitespace-nowrap cursor-pointer"
            >
              Upload Document
            </button>
          </div>
        </div>

        {/* 2. Comprehensive Add / Edit Form (Sections A to I) */}
        {showAddForm ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-[#172033] p-6 rounded-xl border border-[#334155]">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
                {editingFranchise ? `Edit Franchise: ${editingFranchise.firmName} (${editingFranchise.crmCode})` : 'Register New Franchise Partner'}
              </h3>
              <span className="text-[11px] text-slate-400">* Mandatory fields</span>
            </div>

            {/* SECTION A. BASIC FRANCHISE DETAILS */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1 flex items-center space-x-2">
                <span>A. Basic Franchise Details</span>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Firm Type *</label>
                  <select
                    value={formData.firmType}
                    onChange={(e) => setFormData({ ...formData, firmType: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Proprietor">Proprietor</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Firm Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firmName}
                    onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
                    placeholder="e.g. Apex Electronics & Services"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Landmark</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Near City Square / Metro"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Firm Address *</label>
                <textarea
                  rows={2}
                  required
                  value={formData.firmAddress}
                  onChange={(e) => setFormData({ ...formData, firmAddress: e.target.value })}
                  placeholder="Complete commercial office / service centre address..."
                  className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* PIN Code & Location Auto-Population */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#111c2e]/60 p-3.5 rounded-xl border border-[#334155]">
                <div>
                  <label className="block text-xs font-medium text-emerald-400 mb-1">PIN Code * (Auto-Lookup)</label>
                  <PincodeField
                    pincode={formData.pincode}
                    onPincodeChange={(pincode) => setFormData({ ...formData, pincode })}
                    onLocationFound={handleLocationFound}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full bg-[#0d1624] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">District *</label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full bg-[#0d1624] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#0d1624] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Locality / Post Office</label>
                  {localityOptions.length > 0 ? (
                    <select
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Select Locality...</option>
                      {localityOptions.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.locality}
                      onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                      placeholder="e.g. Sector 14, Commercial Area"
                      className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="Official Mobile / Phone"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    value={formData.emailId}
                    onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                    placeholder="contact@franchisepartner.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION B. GOVERNMENT DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                B. Government Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="e.g. 09ABCDE1234F1Z5"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">PAN Card No.</label>
                  <input
                    type="text"
                    value={formData.panCardNo}
                    onChange={(e) => setFormData({ ...formData, panCardNo: e.target.value.toUpperCase() })}
                    placeholder="e.g. ABCDE1234F"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Shop & Establishment Reg.</label>
                  <input
                    type="text"
                    value={formData.shopEstablishmentReg}
                    onChange={(e) => setFormData({ ...formData, shopEstablishmentReg: e.target.value })}
                    placeholder="Registration License No"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Establishment Month & Year</label>
                  <input
                    type="text"
                    value={formData.establishmentMonthYear}
                    onChange={(e) => setFormData({ ...formData, establishmentMonthYear: e.target.value })}
                    placeholder="MM/YYYY"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION C. PROPRIETOR DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                C. Proprietor Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Proprietor / Partner Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.proprietorName}
                    onChange={(e) => setFormData({ ...formData, proprietorName: e.target.value })}
                    placeholder="Full Legal Name"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.propContactNumber}
                    onChange={(e) => setFormData({ ...formData, propContactNumber: e.target.value })}
                    placeholder="Personal Mobile Number"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email ID</label>
                  <input
                    type="email"
                    value={formData.propEmailId}
                    onChange={(e) => setFormData({ ...formData, propEmailId: e.target.value })}
                    placeholder="proprietor@email.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Proprietor Residential Address</label>
                  <input
                    type="text"
                    value={formData.propResidentialAddress}
                    onChange={(e) => setFormData({ ...formData, propResidentialAddress: e.target.value })}
                    placeholder="House No, Street, City, State"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">PAN Card No.</label>
                    <input
                      type="text"
                      value={formData.propPanCardNo}
                      onChange={(e) => setFormData({ ...formData, propPanCardNo: e.target.value.toUpperCase() })}
                      placeholder="PAN"
                      className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Aadhar Card No.</label>
                    <input
                      type="text"
                      value={formData.propAadharCardNo}
                      onChange={(e) => setFormData({ ...formData, propAadharCardNo: e.target.value })}
                      placeholder="12-digit UID"
                      className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Language Dual List Selection */}
              <div className="p-3 bg-[#111c2e]/60 rounded-xl border border-[#334155]">
                <LanguageDualList
                  selected={formData.propLanguages}
                  onChange={(langs) => setFormData({ ...formData, propLanguages: langs })}
                  label="Proprietor Languages (Dual List Selection)"
                />
              </div>
            </div>

            {/* SECTION D. SMARTPHONE AVAILABILITY */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                D. Smartphone Availability
              </h4>
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-slate-300 mb-1">Smartphone Availability *</label>
                <select
                  value={formData.smartphoneAvailability}
                  onChange={(e) => setFormData({ ...formData, smartphoneAvailability: e.target.value as any })}
                  className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* SECTION E. BANK DETAILS */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                E. Bank Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g. State Bank of India"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Bank Branch</label>
                  <input
                    type="text"
                    value={formData.bankBranch}
                    onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                    placeholder="Branch Name / City"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={formData.accountHolderName}
                    onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                    placeholder="Name as per Passbook"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="Bank Account Number"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="SBIN0001234"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Security Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.securityAmount}
                    onChange={(e) => setFormData({ ...formData, securityAmount: parseFloat(e.target.value) || 0 })}
                    placeholder="Deposit Amount"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Turn Over (₹)</label>
                  <input
                    type="number"
                    value={formData.turnOver}
                    onChange={(e) => setFormData({ ...formData, turnOver: parseFloat(e.target.value) || 0 })}
                    placeholder="Annual Turnover"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION F. INFRASTRUCTURE INFORMATION */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                F. Infrastructure Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Space Ownership</label>
                  <select
                    value={formData.spaceOwnership}
                    onChange={(e) => setFormData({ ...formData, spaceOwnership: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Owned">Owned</option>
                    <option value="Rented">Rented</option>
                    <option value="Leased">Leased</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Service Centre Space</label>
                  <input
                    type="text"
                    value={formData.serviceCentreSpace}
                    onChange={(e) => setFormData({ ...formData, serviceCentreSpace: e.target.value })}
                    placeholder="e.g. 500 Sq Ft"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Agreement Date</label>
                  <input
                    type="date"
                    value={formData.agreementDate}
                    onChange={(e) => setFormData({ ...formData, agreementDate: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Validity</label>
                  <input
                    type="text"
                    value={formData.validity}
                    onChange={(e) => setFormData({ ...formData, validity: e.target.value })}
                    placeholder="e.g. 11 Months / 3 Years"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">System Availability</label>
                  <select
                    value={formData.systemAvailability}
                    onChange={(e) => setFormData({ ...formData, systemAvailability: e.target.value as any })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Printer Availability</label>
                  <select
                    value={formData.printerAvailability}
                    onChange={(e) => setFormData({ ...formData, printerAvailability: e.target.value as any })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Internet Connectivity</label>
                  <select
                    value={formData.internetConnectivity}
                    onChange={(e) => setFormData({ ...formData, internetConnectivity: e.target.value })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Broadband">Broadband</option>
                    <option value="Fiber">Fiber</option>
                    <option value="Mobile Data">Mobile Data</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Inverter Availability</label>
                  <select
                    value={formData.inverterAvailability}
                    onChange={(e) => setFormData({ ...formData, inverterAvailability: e.target.value as any })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Covering Area</label>
                  <input
                    type="text"
                    value={formData.coveringArea}
                    onChange={(e) => setFormData({ ...formData, coveringArea: e.target.value })}
                    placeholder="e.g. 20 Kms Radius / Zone East"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Number Of Technicians</label>
                  <input
                    type="number"
                    value={formData.numberOfTechnician}
                    onChange={(e) => setFormData({ ...formData, numberOfTechnician: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Brand Handling</label>
                  <input
                    type="text"
                    value={formData.brandHandling}
                    onChange={(e) => setFormData({ ...formData, brandHandling: e.target.value })}
                    placeholder="e.g. LG, Samsung, Whirlpool"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION G. BACK END STUFF */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                G. Back End Stuff
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Firm Manager / CCO Name</label>
                  <input
                    type="text"
                    value={formData.backendManagerName}
                    onChange={(e) => setFormData({ ...formData, backendManagerName: e.target.value })}
                    placeholder="Manager / Operations Lead"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    value={formData.backendContactNumber}
                    onChange={(e) => setFormData({ ...formData, backendContactNumber: e.target.value })}
                    placeholder="Contact Number"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email ID</label>
                  <input
                    type="email"
                    value={formData.backendEmailId}
                    onChange={(e) => setFormData({ ...formData, backendEmailId: e.target.value })}
                    placeholder="manager@franchise.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Backend Languages Dual List */}
              <div className="p-3 bg-[#111c2e]/60 rounded-xl border border-[#334155]">
                <LanguageDualList
                  selected={formData.backendLanguages}
                  onChange={(langs) => setFormData({ ...formData, backendLanguages: langs })}
                  label="Manager / CCO Languages (Dual List Selection)"
                />
              </div>
            </div>

            {/* SECTION H. REPORTING */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                H. Reporting
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Reporting Branch *</label>
                  <select
                    value={formData.reportingBranch}
                    onChange={(e) => {
                      const selBranchName = e.target.value;
                      const b = branches.find((item) => item.branchName === selBranchName);
                      setFormData({
                        ...formData,
                        reportingBranch: selBranchName,
                        reportingBranchId: b ? b._id : '',
                        managerEmailId: b?.managerEmailId || formData.managerEmailId,
                        managerContactNumber: b?.managerContactNumber || formData.managerContactNumber,
                      });
                    }}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Select Branch from DB...</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b.branchName}>
                        {b.branchName} ({b.crmCode} - {b.region})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Area Manager Name</label>
                  <input
                    type="text"
                    value={formData.areaManagerName}
                    onChange={(e) => setFormData({ ...formData, areaManagerName: e.target.value })}
                    placeholder="Area Manager"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Manager Contact Number</label>
                  <input
                    type="tel"
                    value={formData.managerContactNumber}
                    onChange={(e) => setFormData({ ...formData, managerContactNumber: e.target.value })}
                    placeholder="Manager Phone"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Manager Email ID</label>
                  <input
                    type="email"
                    value={formData.managerEmailId}
                    onChange={(e) => setFormData({ ...formData, managerEmailId: e.target.value })}
                    placeholder="manager@quickserves.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CCO Name</label>
                  <input
                    type="text"
                    value={formData.reportingCcoName}
                    onChange={(e) => setFormData({ ...formData, reportingCcoName: e.target.value })}
                    placeholder="CCO Coordinator"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CCO Contact Number</label>
                  <input
                    type="tel"
                    value={formData.ccoContactNumber}
                    onChange={(e) => setFormData({ ...formData, ccoContactNumber: e.target.value })}
                    placeholder="CCO Phone"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CCO Email ID</label>
                  <input
                    type="email"
                    value={formData.ccoEmailId}
                    onChange={(e) => setFormData({ ...formData, ccoEmailId: e.target.value })}
                    placeholder="cco@quickserves.com"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION I. SLA / TAT PERFORMANCE */}
            <div className="space-y-3 pt-4 border-t border-[#334155]">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
                I. SLA / TAT Performance (Within City)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#111c2e]/60 p-3.5 rounded-xl border border-[#334155]">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Installation Response Time (Hours)
                  </label>
                  <input
                    type="number"
                    value={formData.installationResponseTime}
                    onChange={(e) => setFormData({ ...formData, installationResponseTime: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0d1624] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Installation Resolution Time (Hours)
                  </label>
                  <input
                    type="number"
                    value={formData.installationResolutionTime}
                    onChange={(e) => setFormData({ ...formData, installationResolutionTime: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0d1624] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Service Response Time (Hours)
                  </label>
                  <input
                    type="number"
                    value={formData.serviceResponseTime}
                    onChange={(e) => setFormData({ ...formData, serviceResponseTime: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0d1624] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Service Resolution Time (Hours)
                  </label>
                  <input
                    type="number"
                    value={formData.serviceResolutionTime}
                    onChange={(e) => setFormData({ ...formData, serviceResolutionTime: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#0d1624] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Franchise Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A">Active (A)</option>
                    <option value="I">Inactive (I)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">ASF Code</label>
                  <input
                    type="text"
                    value={formData.asfCode}
                    onChange={(e) => setFormData({ ...formData, asfCode: e.target.value })}
                    placeholder="Authorized Service Franchise Code"
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#334155]">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Abort / Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg transition shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
              >
                {saving && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{editingFranchise ? 'Update Franchise' : 'Save Franchise'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* 3. Franchise Listing Table */
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search franchise by name, code, city, phone..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#172033] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-72"
                />
                <select
                  value={filterRegion}
                  onChange={(e) => {
                    setFilterRegion(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#172033] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-[#172033] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                </select>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Showing {paginatedFranchises.length} of {filteredFranchises.length} centers
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading Franchise Partners...</div>
            ) : filteredFranchises.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#334155] rounded-xl bg-[#172033]/40">
                <span className="text-3xl block mb-2">🏢</span>
                <p className="text-xs text-slate-300 font-medium">No franchise partners found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click + ADD to register a new franchise center.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[#334155]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#172033] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="p-3">CRM Code</th>
                      <th className="p-3">Franchise Name</th>
                      <th className="p-3">Firm Type</th>
                      <th className="p-3">Region</th>
                      <th className="p-3">State / District</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Contact Number</th>
                      <th className="p-3">Email ID</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/50 text-slate-200">
                    {paginatedFranchises.map((f) => (
                      <tr key={f._id} className="hover:bg-[#152338]/60 transition">
                        <td className="p-3">
                          <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {f.crmCode}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-white">
                          <div>{f.firmName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Prop: {f.proprietorName}
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{f.firmType || 'Proprietor'}</td>
                        <td className="p-3 text-slate-300">{f.region}</td>
                        <td className="p-3 text-slate-300">
                          <div>{f.state}</div>
                          <div className="text-[10px] text-slate-500">{f.district}</div>
                        </td>
                        <td className="p-3 text-slate-300">{f.city}</td>
                        <td className="p-3 font-mono text-slate-300">{f.contactNumber}</td>
                        <td className="p-3 text-slate-300 truncate max-w-xs">{f.emailId}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                              f.status === 'A'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {f.status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenDocModal(f)}
                            className="text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/20 text-xs font-medium transition"
                            title="Manage Documents"
                          >
                            📁 Docs
                          </button>
                          <button
                            onClick={() => handleEdit(f)}
                            className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 text-xs font-medium transition"
                            title="Edit Franchise"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(f._id, f.firmName)}
                            className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded border border-rose-500/20 text-xs font-medium transition"
                            title="Delete Franchise"
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
                <span className="text-xs text-slate-400 font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 text-xs bg-slate-800 disabled:opacity-40 text-slate-300 rounded border border-[#334155] hover:bg-slate-700 transition"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`px-2.5 py-1 text-xs rounded border transition ${
                        currentPage === pg
                          ? 'bg-blue-600 border-blue-500 text-white font-bold'
                          : 'bg-slate-800 border-[#334155] text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pg}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 text-xs bg-slate-800 disabled:opacity-40 text-slate-300 rounded border border-[#334155] hover:bg-slate-700 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. DEDICATED FRANCHISE DOCUMENT UPLOAD & REPOSITORY MODAL */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111c2e] border border-[#2d3d54] rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0d1624] border-b border-[#2d3d54]">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold text-sm">
                  📁
                </span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Upload Franchise Document</span>
                    <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-mono font-normal">
                      {franchiseDocs.length} Stored Documents
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Official Franchise Document Repository & Statutory File Management
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 w-8 h-8 rounded-lg flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-[#2d3d54] bg-[#142033] px-6">
              <button
                onClick={() => {
                  setDocModalTab('upload');
                  setUploadMessage(null);
                }}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  docModalTab === 'upload'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>⬆️ Upload Document</span>
              </button>
              <button
                onClick={() => {
                  setDocModalTab('repository');
                  fetchFranchiseDocs(docFranchiseCRMCode);
                }}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition flex items-center gap-2 ${
                  docModalTab === 'repository'
                    ? 'border-rose-500 text-rose-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <span>📚 Document Repository ({franchiseDocs.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {uploadMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium mb-4 flex items-center justify-between ${
                    uploadMessage.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  }`}
                >
                  <span>{uploadMessage.text}</span>
                  <button onClick={() => setUploadMessage(null)} className="text-slate-400 hover:text-white ml-2">
                    ✕
                  </button>
                </div>
              )}

              {docModalTab === 'upload' ? (
                /* 4 fields required by the user prompt */
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Field 1: Franchise CRM Code */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Field 1: Franchise CRM Code *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter CRM Code (e.g. QSSF001)"
                        value={docFranchiseCRMCode}
                        onChange={(e) => handleDocCRMCodeChange(e.target.value)}
                        className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Auto-synchronizes with the Franchise selector
                      </span>
                    </div>

                    {/* Field 2: Franchise Dropdown */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Field 2: Franchise *
                      </label>
                      <select
                        required
                        value={docFranchiseId}
                        onChange={(e) => handleDocFranchiseChange(e.target.value)}
                        className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="">Select Franchise...</option>
                        {franchises.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.firmName} ({f.crmCode} - {f.region})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Field 3: Document Type (10 exact prompt options) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Field 3: Document Type *
                    </label>
                    <select
                      required
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                      className="w-full bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      {FRANCHISE_DOCUMENT_TYPES.map((dt) => (
                        <option key={dt} value={dt}>
                          {dt}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Field 4: Document Upload (File input) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Field 4: Document Upload *
                    </label>
                    <div className="border-2 border-dashed border-[#2d3d54] hover:border-rose-500/50 rounded-xl p-5 text-center bg-[#0d1624]/60 transition">
                      <input
                        type="file"
                        id="franchiseDocUploadInput"
                        required
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setDocFile(e.target.files[0]);
                          }
                        }}
                        className="hidden"
                      />
                      <label htmlFor="franchiseDocUploadInput" className="cursor-pointer block">
                        <div className="text-3xl mb-2">📄</div>
                        {docFile ? (
                          <div>
                            <p className="text-xs font-semibold text-rose-400">{docFile.name}</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {(docFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-medium text-slate-200">
                              Click to select a document file from your device
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1">
                              Supported: PDF, JPG, JPEG, PNG, DOC, DOCX (Max 20 MB)
                            </p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end items-center gap-3 pt-3 border-t border-[#2d3d54]">
                    <button
                      type="button"
                      onClick={() => setShowDocModal(false)}
                      className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadingDoc || !docFile}
                      className="bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] disabled:opacity-50 text-white text-xs px-5 py-2 rounded-lg font-semibold transition shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      {uploadingDoc ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          <span>Uploading Document...</span>
                        </>
                      ) : (
                        <span>Save & Upload Document</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Repository Tab */
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Search uploaded documents..."
                      value={docSearchTerm}
                      onChange={(e) => setDocSearchTerm(e.target.value)}
                      className="bg-[#0a111e] border border-[#2d3d54] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500 w-full sm:w-64"
                    />
                    <button
                      onClick={() => fetchFranchiseDocs(docFranchiseCRMCode)}
                      className="text-xs text-slate-400 hover:text-white bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-[#2d3d54] transition flex items-center gap-1"
                    >
                      <span>🔄 Refresh</span>
                    </button>
                  </div>

                  {loadingDocs ? (
                    <div className="py-12 text-center text-xs text-slate-400">Loading franchise documents...</div>
                  ) : franchiseDocs.length === 0 ? (
                    <div className="py-12 text-center border border-dashed border-[#2d3d54] rounded-xl bg-[#0d1624]/40">
                      <span className="text-3xl block mb-2">📭</span>
                      <p className="text-xs text-slate-300 font-medium">No documents uploaded for this franchise</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Switch to the Upload Document tab to add statutory certificates or agreements.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#2d3d54]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#0d1624] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#2d3d54]">
                          <tr>
                            <th className="p-3">CRM Code</th>
                            <th className="p-3">Document Type</th>
                            <th className="p-3">File Name</th>
                            <th className="p-3">Size</th>
                            <th className="p-3">Uploaded Date</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2d3d54]/50 text-slate-200">
                          {franchiseDocs
                            .filter((doc) => {
                              const q = docSearchTerm.toLowerCase();
                              return (
                                doc.fileName?.toLowerCase().includes(q) ||
                                doc.documentType?.toLowerCase().includes(q) ||
                                doc.franchiseCRMCode?.toLowerCase().includes(q) ||
                                doc.franchiseName?.toLowerCase().includes(q)
                              );
                            })
                            .map((doc) => (
                              <tr key={doc._id} className="hover:bg-[#152338]/60 transition">
                                <td className="p-3 font-mono font-semibold text-emerald-400">
                                  {doc.franchiseCRMCode}
                                </td>
                                <td className="p-3">
                                  <span className="inline-block text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded font-mono">
                                    {doc.documentType}
                                  </span>
                                </td>
                                <td className="p-3 font-medium text-white truncate max-w-xs">{doc.fileName}</td>
                                <td className="p-3 font-mono text-slate-400">
                                  {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '—'}
                                </td>
                                <td className="p-3 text-slate-400 font-mono text-[11px]">
                                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}
                                </td>
                                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-1 rounded border border-blue-500/20 font-medium transition"
                                  >
                                    View
                                  </a>
                                  <a
                                    href={doc.fileUrl}
                                    download={doc.fileName}
                                    className="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/20 font-medium transition"
                                  >
                                    Download
                                  </a>
                                  <button
                                    onClick={() => handleDeleteDoc(doc._id, doc.fileName)}
                                    className="text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded border border-rose-500/20 font-medium transition"
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dual-List Language Selection Component
function LanguageDualList({
  selected,
  onChange,
  label = 'Languages',
}: {
  selected: string[];
  onChange: (langs: string[]) => void;
  label?: string;
}) {
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedChosen, setSelectedChosen] = useState<string[]>([]);

  const available = ALL_LANGUAGES.filter((l) => !selected.includes(l));

  const handleMoveRight = () => {
    if (selectedAvailable.length === 0) return;
    onChange([...selected, ...selectedAvailable]);
    setSelectedAvailable([]);
  };

  const handleMoveLeft = () => {
    if (selectedChosen.length === 0) return;
    onChange(selected.filter((l) => !selectedChosen.includes(l)));
    setSelectedChosen([]);
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
        {/* Available list */}
        <div className="sm:col-span-2">
          <span className="block text-[10px] text-slate-400 mb-1 font-mono uppercase tracking-wider">
            Available Languages:
          </span>
          <select
            multiple
            value={selectedAvailable}
            onChange={(e) =>
              setSelectedAvailable(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            className="w-full h-28 bg-[#0d1624] border border-[#334155] rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 overflow-y-auto"
          >
            {available.map((lang) => (
              <option key={lang} value={lang} className="py-0.5 px-1 hover:bg-[#1e2a3e] rounded">
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Transfer buttons */}
        <div className="flex sm:flex-col justify-center items-center gap-2">
          <button
            type="button"
            onClick={handleMoveRight}
            title="Add Selected"
            disabled={selectedAvailable.length === 0}
            className="bg-[#2563eb] hover:bg-blue-600 active:bg-blue-700 disabled:opacity-30 text-white text-xs px-3 py-1.5 rounded font-bold shadow transition cursor-pointer"
          >
            &gt;&gt;
          </button>
          <button
            type="button"
            onClick={handleMoveLeft}
            title="Remove Selected"
            disabled={selectedChosen.length === 0}
            className="bg-slate-700 hover:bg-slate-600 active:bg-slate-800 disabled:opacity-30 text-white text-xs px-3 py-1.5 rounded font-bold shadow transition cursor-pointer"
          >
            &lt;&lt;
          </button>
        </div>

        {/* Selected list */}
        <div className="sm:col-span-2">
          <span className="block text-[10px] text-emerald-400 mb-1 font-mono uppercase tracking-wider">
            Selected Languages ({selected.length}):
          </span>
          <select
            multiple
            value={selectedChosen}
            onChange={(e) =>
              setSelectedChosen(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            className="w-full h-28 bg-[#0d1624] border border-[#334155] rounded-lg p-2 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 overflow-y-auto"
          >
            {selected.map((lang) => (
              <option key={lang} value={lang} className="py-0.5 px-1 hover:bg-[#1e2a3e] rounded">
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

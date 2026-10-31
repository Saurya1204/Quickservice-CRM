'use client';

import React, { useState, useEffect } from 'react';
import PincodeField from '@/components/common/PincodeLookup';

const TECHNICIAN_DOCUMENT_TYPES = [
  'Technician Photo Upload',
  'PAN Card No.',
  'Aadhar Card Document',
  'Voter ID Document',
  'Driving License Document',
  'Residential Address Proof Document',
  'Cancel Cheque Image Upload',
] as const;

const TECHNICIAN_LANGUAGES = [
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
];

interface LanguageDualListProps {
  available: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function LanguageDualList({ available, selected, onChange }: LanguageDualListProps) {
  const [selectedInAvailable, setSelectedInAvailable] = useState<string[]>([]);
  const [selectedInSelected, setSelectedInSelected] = useState<string[]>([]);

  const handleMoveRight = () => {
    if (selectedInAvailable.length === 0) return;
    const newSelected = Array.from(new Set([...selected, ...selectedInAvailable]));
    onChange(newSelected);
    setSelectedInAvailable([]);
  };

  const handleMoveLeft = () => {
    if (selectedInSelected.length === 0) return;
    const newSelected = selected.filter((lang) => !selectedInSelected.includes(lang));
    onChange(newSelected);
    setSelectedInSelected([]);
  };

  const currentAvailable = available.filter((l) => !selected.includes(l));

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
      <div className="flex-1 w-full">
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Available Languages ({currentAvailable.length})
        </label>
        <select
          multiple
          size={5}
          value={selectedInAvailable}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions, (o) => o.value);
            setSelectedInAvailable(opts);
          }}
          className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono h-28"
        >
          {currentAvailable.map((lang) => (
            <option key={lang} value={lang} className="py-1 px-1.5 hover:bg-blue-600/30 rounded">
              {lang}
            </option>
          ))}
        </select>
      </div>

      <div className="flex md:flex-col gap-2 justify-center py-2">
        <button
          type="button"
          onClick={handleMoveRight}
          disabled={selectedInAvailable.length === 0}
          title="Add Selected Languages"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
        >
          &gt;&gt;
        </button>
        <button
          type="button"
          onClick={handleMoveLeft}
          disabled={selectedInSelected.length === 0}
          title="Remove Selected Languages"
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
        >
          &lt;&lt;
        </button>
      </div>

      <div className="flex-1 w-full">
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Selected Languages ({selected.length})
        </label>
        <select
          multiple
          size={5}
          value={selectedInSelected}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions, (o) => o.value);
            setSelectedInSelected(opts);
          }}
          className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-emerald-400 focus:outline-none focus:border-blue-500 font-mono h-28"
        >
          {selected.map((lang) => (
            <option key={lang} value={lang} className="py-1 px-1.5 hover:bg-emerald-600/30 rounded">
              {lang}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function TechnicianMasterView() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Document Management Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocTechnicianId, setSelectedDocTechnicianId] = useState('');
  const [selectedDocCRMCode, setSelectedDocCRMCode] = useState('');
  const [docType, setDocType] = useState<string>(TECHNICIAN_DOCUMENT_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docList, setDocList] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Form Initial State
  const initialForm = {
    crmCode: '',
    region: 'North',
    branchName: '',
    branchId: '',
    technicianName: '',
    contactNumber: '',
    emailId: '',
    residentialAddress: '',
    landmark: '',
    pincode: '',
    state: '',
    district: '',
    city: '',
    locality: '',
    aadhaarCardNumber: '',
    panCardNumber: '',
    vehicleNumber: '',
    drivingLicenseNumber: '',
    voterIdNumber: '',
    smartphoneAvailability: 'Yes',
    highestQualification: '12th Pass',
    technicalQualification: 'ITI / Diploma',
    languages: ['Hindi', 'English'],
    personalInsurance: '',
    skillSet: 'Air Conditioner / Refrigerator',
    bankName: '',
    bankBranch: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
    baseLocation: '',
    branchManagerName: '',
    branchManagerContact: '',
    branchManagerEmail: '',
    ccoName: '',
    ccoContact: '',
    ccoEmail: '',
    dateOfJoining: '',
    experienceInYears: 3,
    status: 'A',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchTechnicians();
    fetchBranches();
  }, []);

  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/technicians');
      const json = await res.json();
      if (json.success) {
        setTechnicians(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching technicians:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/masters/branches');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBranches(json.data);
      }
    } catch (e) {
      console.error('Error fetching branches:', e);
    }
  };

  const handleOpenAdd = () => {
    setEditingTechnician(null);
    setFormData(initialForm);
    setShowAddForm(true);
  };

  const handleEdit = (t: any) => {
    setEditingTechnician(t);
    setFormData({
      ...initialForm,
      ...t,
      languages: t.languages ? t.languages.split(' ') : ['Hindi', 'English'],
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete technician "${name}"?`)) return;
    try {
      const res = await fetch(`/api/masters/technicians?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchTechnicians();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.technicianName || !formData.contactNumber) {
      alert('Technician Name and Contact Number are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        languages: Array.isArray(formData.languages) ? formData.languages.join(' ') : formData.languages,
      };

      if (editingTechnician) {
        const res = await fetch('/api/masters/technicians', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingTechnician._id, ...payload }),
        });
        const json = await res.json();
        if (json.success) {
          alert('Technician updated successfully!');
          setShowAddForm(false);
          setEditingTechnician(null);
          fetchTechnicians();
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/technicians', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          alert(json.message || 'Technician created successfully!');
          setShowAddForm(false);
          fetchTechnicians();
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

  // Document Management Modal Logic
  const handleOpenDocModal = (technician?: any) => {
    if (technician) {
      setSelectedDocTechnicianId(technician._id);
      setSelectedDocCRMCode(technician.crmCode || '');
      fetchTechnicianDocs(technician._id);
    } else if (technicians.length > 0) {
      setSelectedDocTechnicianId(technicians[0]._id);
      setSelectedDocCRMCode(technicians[0].crmCode || '');
      fetchTechnicianDocs(technicians[0]._id);
    }
    setShowDocModal(true);
  };

  const fetchTechnicianDocs = async (id: string) => {
    if (!id) return;
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/masters/technicians/documents?technicianId=${id}`);
      const json = await res.json();
      if (json.success) {
        setDocList(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload.');
      return;
    }
    if (!selectedDocTechnicianId && !selectedDocCRMCode) {
      alert('Please select a technician.');
      return;
    }

    setUploadingDoc(true);
    try {
      const form = new FormData();
      if (selectedDocTechnicianId) form.append('technicianId', selectedDocTechnicianId);
      if (selectedDocCRMCode) form.append('technicianCRMCode', selectedDocCRMCode);
      form.append('documentType', docType);
      form.append('file', selectedFile);

      const res = await fetch('/api/masters/technicians/documents', {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setSelectedFile(null);
        if (selectedDocTechnicianId) fetchTechnicianDocs(selectedDocTechnicianId);
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (docId: string, name: string) => {
    if (!confirm(`Delete document "${name}"?`)) return;
    try {
      const res = await fetch(`/api/masters/technicians/documents?id=${docId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        if (selectedDocTechnicianId) fetchTechnicianDocs(selectedDocTechnicianId);
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filtered Technicians
  const filteredTechnicians = technicians.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      (t.technicianName && t.technicianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.crmCode && t.crmCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.city && t.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.contactNumber && t.contactNumber.includes(searchTerm));

    const matchesBranch = filterBranch === 'all' || t.branchName === filterBranch;
    const matchesRegion = filterRegion === 'all' || t.region === filterRegion;
    const matchesState = filterState === 'all' || t.state === filterState;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchesSearch && matchesBranch && matchesRegion && matchesState && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111c2e] p-5 rounded-2xl border border-[#24344d]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Technician Master</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {filteredTechnicians.length} Technicians
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Certified Engineers, Branch Affiliation, Statutory ID &amp; Field Document Archive
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenDocModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold rounded-lg shadow-lg shadow-red-900/30 transition active:scale-95"
          >
            <span>📁</span>
            <span>Upload Document</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition active:scale-95"
          >
            <span>+</span>
            <span>ADD</span>
          </button>
        </div>
      </div>

      {/* Main Listing View */}
      {!showAddForm ? (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[260px]">
              <input
                type="text"
                placeholder="Search by technician name, CRM code, city, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Branches</option>
                {branches.map((b) => (
                  <option key={b._id} value={b.branchName}>
                    {b.branchName}
                  </option>
                ))}
              </select>

              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Regions</option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d1624] border-b border-[#24344d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Technician CRM Code</th>
                    <th className="py-3 px-4">Technician Name</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4">Contact Number</th>
                    <th className="py-3 px-4">Email ID</th>
                    <th className="py-3 px-4">State / District / City</th>
                    <th className="py-3 px-4">Joining Date</th>
                    <th className="py-3 px-4">Experience</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24344d]/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        Loading Technicians...
                      </td>
                    </tr>
                  ) : filteredTechnicians.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No technicians found. Click &quot;+ ADD&quot; to register a technician.
                      </td>
                    </tr>
                  ) : (
                    filteredTechnicians.map((t) => (
                      <tr key={t._id} className="hover:bg-[#16233b]/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {t.crmCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{t.technicianName}</div>
                          <div className="text-[11px] text-slate-400">{t.skillSet || 'Technical Staff'}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{t.branchName || '-'}</td>
                        <td className="py-3 px-4 text-slate-300">{t.region}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{t.contactNumber}</td>
                        <td className="py-3 px-4 text-slate-300">{t.emailId || '-'}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {t.city ? `${t.city}, ${t.state}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{t.dateOfJoining || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {t.experienceInYears ? `${t.experienceInYears} Yrs` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.status === 'A'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {t.status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenDocModal(t)}
                              title="Manage Documents"
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium transition"
                            >
                              📁 Docs
                            </button>
                            <button
                              onClick={() => handleEdit(t)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-medium transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(t._id, t.technicianName)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-medium transition"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Comprehensive Section-Wise Add / Edit Technician Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                {editingTechnician ? 'EDIT TECHNICIAN' : 'ADD TECHNICIAN'}
              </h2>
              <p className="text-xs text-slate-400">Complete service partner technician profile.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>

          {/* Section A: Basic Information */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              A. Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Branch Name <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.branchName}
                  onChange={(e) => {
                    const sel = branches.find((b) => b.branchName === e.target.value);
                    setFormData({
                      ...formData,
                      branchName: e.target.value,
                      branchId: sel ? sel._id : '',
                    });
                  }}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">--- Select Branch ---</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b.branchName}>
                      {b.branchName} ({b.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Region</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Technician CRM Code <span className="text-slate-500">(Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={formData.crmCode}
                  onChange={(e) => setFormData({ ...formData, crmCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. QST0001"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Technician Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.technicianName}
                  onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                  placeholder="Full name"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Contact Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email ID</label>
                <input
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  placeholder="technician@quickserves.com"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={formData.residentialAddress}
                  onChange={(e) => setFormData({ ...formData, residentialAddress: e.target.value })}
                  placeholder="Complete residence address"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Landmark</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="Near landmark"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Pincode Lookup */}
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
                      locality: loc.locality || prev.locality,
                    }));
                  }}
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="District"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Locality</label>
                <input
                  type="text"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  placeholder="Locality / Colony"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section B: Identification Information */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              B. Identification Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Aadhaar Card No.</label>
                <input
                  type="text"
                  value={formData.aadhaarCardNumber}
                  onChange={(e) => setFormData({ ...formData, aadhaarCardNumber: e.target.value })}
                  placeholder="XXXX-XXXX-XXXX"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">PAN Card No.</label>
                <input
                  type="text"
                  value={formData.panCardNumber}
                  onChange={(e) => setFormData({ ...formData, panCardNumber: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                  placeholder="e.g. DL 01 AB 1234"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Driving License</label>
                <input
                  type="text"
                  value={formData.drivingLicenseNumber}
                  onChange={(e) => setFormData({ ...formData, drivingLicenseNumber: e.target.value })}
                  placeholder="DL Number"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Voter ID No.</label>
                <input
                  type="text"
                  value={formData.voterIdNumber}
                  onChange={(e) => setFormData({ ...formData, voterIdNumber: e.target.value })}
                  placeholder="Voter ID"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section C: Technical and Personal Information & Language Selection */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              C. Technical, Personal Information &amp; Language Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Smartphone Availability</label>
                <select
                  value={formData.smartphoneAvailability}
                  onChange={(e) => setFormData({ ...formData, smartphoneAvailability: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Highest Qualification</label>
                <select
                  value={formData.highestQualification}
                  onChange={(e) => setFormData({ ...formData, highestQualification: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="10th Pass">10th Pass</option>
                  <option value="12th Pass">12th Pass</option>
                  <option value="Graduate">Graduate</option>
                  <option value="Post Graduate">Post Graduate</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Technical Qualification</label>
                <select
                  value={formData.technicalQualification}
                  onChange={(e) => setFormData({ ...formData, technicalQualification: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ITI / Diploma">ITI / Diploma</option>
                  <option value="Polytechnic">Polytechnic</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="Trade Certified">Trade Certified</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Personal Insurance</label>
                <input
                  type="text"
                  value={formData.personalInsurance}
                  onChange={(e) => setFormData({ ...formData, personalInsurance: e.target.value })}
                  placeholder="Policy / Insurance details"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Skill set (Main Stream)</label>
                <input
                  type="text"
                  value={formData.skillSet}
                  onChange={(e) => setFormData({ ...formData, skillSet: e.target.value })}
                  placeholder="e.g. Inverter AC, Microwave, Washing Machine, CCTV"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-2 font-medium">Languages (Dual-List Selection)</label>
                <LanguageDualList
                  available={TECHNICIAN_LANGUAGES}
                  selected={formData.languages}
                  onChange={(langs) => setFormData({ ...formData, languages: langs })}
                />
              </div>
            </div>
          </div>

          {/* Section E: Bank Details */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              E. Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Branch</label>
                <input
                  type="text"
                  value={formData.bankBranch}
                  onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
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
                  placeholder="Bank Account Number"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">IFSC Number</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  placeholder="HDFC0001234"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  placeholder="Account holder as per bank"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section F: Reporting Information */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              F. Reporting Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Base Location</label>
                <input
                  type="text"
                  value={formData.baseLocation}
                  onChange={(e) => setFormData({ ...formData, baseLocation: e.target.value })}
                  placeholder="Base Service Centre / Field Hub"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Branch Manager Name</label>
                <input
                  type="text"
                  value={formData.branchManagerName}
                  onChange={(e) => setFormData({ ...formData, branchManagerName: e.target.value })}
                  placeholder="Branch Manager"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Branch Manager Contact Number</label>
                <input
                  type="text"
                  value={formData.branchManagerContact}
                  onChange={(e) => setFormData({ ...formData, branchManagerContact: e.target.value })}
                  placeholder="Manager phone"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Branch Manager Email ID</label>
                <input
                  type="email"
                  value={formData.branchManagerEmail}
                  onChange={(e) => setFormData({ ...formData, branchManagerEmail: e.target.value })}
                  placeholder="manager@quickserves.com"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CCO Name</label>
                <input
                  type="text"
                  value={formData.ccoName}
                  onChange={(e) => setFormData({ ...formData, ccoName: e.target.value })}
                  placeholder="CCO Name"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CCO Contact Number</label>
                <input
                  type="text"
                  value={formData.ccoContact}
                  onChange={(e) => setFormData({ ...formData, ccoContact: e.target.value })}
                  placeholder="CCO Phone"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CCO Email ID</label>
                <input
                  type="email"
                  value={formData.ccoEmail}
                  onChange={(e) => setFormData({ ...formData, ccoEmail: e.target.value })}
                  placeholder="cco@quickserves.com"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section G: Others */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              G. Others
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Date Of Joining</label>
                <input
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Experience in Year</label>
                <input
                  type="number"
                  min={0}
                  value={formData.experienceInYears}
                  onChange={(e) => setFormData({ ...formData, experienceInYears: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Action Buttons (Save = Green, Reset = Blue, Abort = Yellow) */}
          <div className="flex items-center gap-3 justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition active:scale-95"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to reset all entered values?')) {
                  setFormData(initialForm);
                }
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
            >
              Abort
            </button>
          </div>
        </form>
      )}

      {/* Upload Technician Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#24344d] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-[#dc2626]">📁</span>
                  <span>Upload Technician Document</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Technician CRM Code verification, document type selection, and secure upload
                </p>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Document Upload Form */}
            <form onSubmit={handleUploadDoc} className="bg-[#0d1624] p-4 rounded-xl border border-[#24344d] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Field 1: Technician CRM Code */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Technician CRM Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. QST0001"
                    value={selectedDocCRMCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setSelectedDocCRMCode(code);
                      const match = technicians.find((t) => t.crmCode === code);
                      if (match) {
                        setSelectedDocTechnicianId(match._id);
                        fetchTechnicianDocs(match._id);
                      }
                    }}
                    className="w-full bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Field 2: Technician Dropdown */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Technician <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedDocTechnicianId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDocTechnicianId(id);
                      const match = technicians.find((t) => t._id === id);
                      if (match) {
                        setSelectedDocCRMCode(match.crmCode || '');
                      }
                      fetchTechnicianDocs(id);
                    }}
                    className="w-full bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">--- Select Technician ---</option>
                    {technicians.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.technicianName} ({t.crmCode}) - {t.city || t.region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 3: Document Type Dropdown */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Document Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {TECHNICIAN_DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 4: Document Upload */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Document Upload (PDF, JPG, PNG, WEBP, DOCX) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="file"
                    required
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {selectedFile && (
                    <div className="text-[11px] text-emerald-400 mt-1 font-mono">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={uploadingDoc}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
                >
                  {uploadingDoc ? 'Uploading...' : 'Save Document'}
                </button>
              </div>
            </form>

            {/* Document Repository List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Uploaded Documents ({docList.length})
              </h4>
              <div className="overflow-x-auto border border-[#24344d] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0d1624] text-[11px] font-semibold text-slate-400 border-b border-[#24344d]">
                      <th className="py-2.5 px-3">Document Type</th>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Uploaded At</th>
                      <th className="py-2.5 px-3">Uploaded By</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#24344d]/50">
                    {loadingDocs ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400">
                          Loading documents...
                        </td>
                      </tr>
                    ) : docList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          No documents uploaded yet for this technician.
                        </td>
                      </tr>
                    ) : (
                      docList.map((doc) => (
                        <tr key={doc._id} className="hover:bg-[#16233b]/40">
                          <td className="py-2.5 px-3 font-medium text-amber-300">{doc.documentType}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-300">{doc.fileName}</td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {(doc.fileSize / 1024).toFixed(1)} KB
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400">{doc.uploadedBy}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-[11px] font-medium transition"
                              >
                                View
                              </a>
                              <a
                                href={doc.fileUrl}
                                download
                                className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-[11px] font-medium transition"
                              >
                                Download
                              </a>
                              <button
                                onClick={() => handleDeleteDoc(doc._id, doc.fileName)}
                                className="px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-[11px] font-medium transition"
                              >
                                Delete
                              </button>
                            </div>
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

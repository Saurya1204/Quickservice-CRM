'use client';

import React, { useState, useEffect } from 'react';
import PincodeField from '@/components/common/PincodeLookup';

const CLIENT_DOCUMENT_TYPES = [
  'Address Proof',
  'GST Certificate',
  'PAN Card',
  'Aadhar Card',
] as const;

const ALL_INDIAN_STATES = [
  'ANDAMAN & NICOBAR ISLANDS',
  'ANDHRA PRADESH',
  'ARUNACHAL PRADESH',
  'ASSAM',
  'BIHAR',
  'CHANDIGARH',
  'CHATTISGARH',
  'DADRA & NAGAR HAVELI',
  'DAMAN & DIU',
  'DELHI',
  'GOA',
  'GUJARAT',
  'HARYANA',
  'HIMACHAL PRADESH',
  'JAMMU & KASHMIR',
  'JHARKHAND',
  'KARNATAKA',
  'KERALA',
  'LADAKH',
  'LAKSHADWEEP',
  'MADHYA PRADESH',
  'MAHARASHTRA',
  'MANIPUR',
  'MEGHALAYA',
  'MIZORAM',
  'NAGALAND',
  'ODISHA',
  'PUDUCHERRY',
  'PUNJAB',
  'RAJASTHAN',
  'SIKKIM',
  'TAMIL NADU',
  'TELANGANA',
  'TRIPURA',
  'UTTAR PRADESH',
  'UTTARAKHAND',
  'WEST BENGAL',
];

interface ServiceAreaDualListProps {
  available: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

function ServiceAreaDualList({ available, selected, onChange }: ServiceAreaDualListProps) {
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
    const newSelected = selected.filter((item) => !selectedInSelected.includes(item));
    onChange(newSelected);
    setSelectedInSelected([]);
  };

  const currentAvailable = available.filter((item) => !selected.includes(item));

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full">
      <div className="flex-1 w-full">
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Available Service Areas ({currentAvailable.length})
        </label>
        <select
          multiple
          size={7}
          value={selectedInAvailable}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions, (o) => o.value);
            setSelectedInAvailable(opts);
          }}
          className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono h-36"
        >
          {currentAvailable.map((state) => (
            <option key={state} value={state} className="py-1 px-1.5 hover:bg-blue-600/30 rounded">
              {state}
            </option>
          ))}
        </select>
      </div>

      <div className="flex md:flex-col gap-2 justify-center py-2">
        <button
          type="button"
          onClick={handleMoveRight}
          disabled={selectedInAvailable.length === 0}
          title="Add Selected Service Areas"
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
        >
          &gt;&gt;
        </button>
        <button
          type="button"
          onClick={handleMoveLeft}
          disabled={selectedInSelected.length === 0}
          title="Remove Selected Service Areas"
          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
        >
          &lt;&lt;
        </button>
      </div>

      <div className="flex-1 w-full">
        <label className="block text-[11px] font-medium text-slate-400 mb-1">
          Selected Service Areas ({selected.length})
        </label>
        <select
          multiple
          size={7}
          value={selectedInSelected}
          onChange={(e) => {
            const opts = Array.from(e.target.selectedOptions, (o) => o.value);
            setSelectedInSelected(opts);
          }}
          className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-emerald-400 focus:outline-none focus:border-blue-500 font-mono h-36"
        >
          {selected.map((state) => (
            <option key={state} value={state} className="py-1 px-1.5 hover:bg-emerald-600/30 rounded">
              {state}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function ClientMasterView() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('all');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Document Management Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedDocClientId, setSelectedDocClientId] = useState('');
  const [selectedDocClientCode, setSelectedDocClientCode] = useState('');
  const [docType, setDocType] = useState<string>(CLIENT_DOCUMENT_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docList, setDocList] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Initial Form State
  const initialForm = {
    clientCode: '',
    clientName: '',
    registeredAddress: '',
    landmark: '',
    pincode: '',
    state: 'DELHI',
    district: 'DELHI',
    city: 'NEW DELHI',
    locality: 'NEW DELHI',
    landlineNumber: '',
    proprietorName: '',
    cinNumber: '',
    panNumber: '',
    gstNumber: '',
    contactPerson: '',
    mobileNumber: '',
    emailId: '',
    tollFreeNumber: '',
    callCenter: 'Quick Serves',
    noOfCallCentreSeat: 5,
    callCentreSeatCharge: 25000,
    crmCharges: 15000,
    crmExtraUserCharges: 1200,
    warehouseChargePM: 30000,
    minimumGuarantyPM: 50000,
    managementFeeYearly: 100000,
    localConveyanceChargePerKM: 8,
    paymentTerms: 'Within 15 Days',
    creditLimit: '600000',
    creditPeriod: '30',
    agreementStartDate: '',
    agreementRenewalDate: '',
    reconciliationPeriod: 'Quarterly',
    serviceAreas: ['DELHI', 'UTTAR PRADESH', 'HARYANA', 'PUNJAB'],
    status: 'A',
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/clients');
      const json = await res.json();
      if (json.success) {
        setClients(json.data || []);
      }
    } catch (e) {
      console.error('Error fetching clients:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData(initialForm);
    setShowAddForm(true);
  };

  const handleEdit = (c: any) => {
    setEditingClient(c);
    setFormData({
      ...initialForm,
      ...c,
      serviceAreas: Array.isArray(c.serviceAreas)
        ? c.serviceAreas
        : c.serviceArea
        ? [c.serviceArea]
        : ['DELHI'],
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete Client "${name}"? Check if brands or calls depend on it.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/masters/clients?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchClients();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName || !formData.mobileNumber) {
      alert('Client Name and Mobile Number are required.');
      return;
    }

    if (
      formData.agreementStartDate &&
      formData.agreementRenewalDate &&
      new Date(formData.agreementRenewalDate) < new Date(formData.agreementStartDate)
    ) {
      alert('Agreement Renewal Date must not be earlier than Agreement Start Date.');
      return;
    }

    setSaving(true);
    try {
      if (editingClient) {
        const res = await fetch('/api/masters/clients', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingClient._id, ...formData }),
        });
        const json = await res.json();
        if (json.success) {
          alert('Client updated successfully!');
          setShowAddForm(false);
          setEditingClient(null);
          fetchClients();
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/masters/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (json.success) {
          alert(json.message || 'Client created successfully!');
          setShowAddForm(false);
          fetchClients();
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
  const handleOpenDocModal = (client?: any) => {
    if (client) {
      setSelectedDocClientId(client._id);
      setSelectedDocClientCode(client.clientCode || '');
      fetchClientDocs(client._id);
    } else if (clients.length > 0) {
      setSelectedDocClientId(clients[0]._id);
      setSelectedDocClientCode(clients[0].clientCode || '');
      fetchClientDocs(clients[0]._id);
    }
    setShowDocModal(true);
  };

  const fetchClientDocs = async (id: string) => {
    if (!id) return;
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/masters/clients/documents?clientId=${id}`);
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
    if (!selectedDocClientId && !selectedDocClientCode) {
      alert('Please select a client.');
      return;
    }

    setUploadingDoc(true);
    try {
      const form = new FormData();
      if (selectedDocClientId) form.append('clientId', selectedDocClientId);
      if (selectedDocClientCode) form.append('clientCode', selectedDocClientCode);
      form.append('documentType', docType);
      form.append('file', selectedFile);

      const res = await fetch('/api/masters/clients/documents', {
        method: 'POST',
        body: form,
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setSelectedFile(null);
        if (selectedDocClientId) fetchClientDocs(selectedDocClientId);
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
      const res = await fetch(`/api/masters/clients/documents?id=${docId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        if (selectedDocClientId) fetchClientDocs(selectedDocClientId);
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      !searchTerm ||
      (c.clientName && c.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.clientCode && c.clientCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.mobileNumber && c.mobileNumber.includes(searchTerm));

    const matchesState = filterState === 'all' || c.state === filterState;
    const matchesCity = filterCity === 'all' || c.city === filterCity;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesState && matchesCity && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111c2e] p-5 rounded-2xl border border-[#24344d]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Client Master</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredClients.length} Enterprise Clients
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Brand Principals, Commercial Agreements, Call Centre Seats &amp; State-Wise Service Coverage
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
                placeholder="Search by client name, ID, contact person, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All States</option>
                {Array.from(new Set(clients.map((c) => c.state).filter(Boolean))).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
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
                    <th className="py-3 px-4">Client ID</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Contact Person</th>
                    <th className="py-3 px-4">Mobile Number</th>
                    <th className="py-3 px-4">Email ID</th>
                    <th className="py-3 px-4">State / City</th>
                    <th className="py-3 px-4">GST Number</th>
                    <th className="py-3 px-4">Agreement Period</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24344d]/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        Loading Clients...
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No clients found. Click &quot;+ ADD&quot; to create a new client.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((c) => (
                      <tr key={c._id} className="hover:bg-[#16233b]/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {c.clientCode}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{c.clientName}</div>
                          <div className="text-[11px] text-slate-400">
                            Prop: {c.proprietorName || 'N/A'} • {c.callCenter || 'Quick Serves'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{c.contactPerson || '-'}</td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{c.mobileNumber}</td>
                        <td className="py-3 px-4 text-slate-300">{c.emailId || '-'}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {c.city ? `${c.city}, ${c.state}` : '-'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{c.gstNumber || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {c.agreementStartDate ? `${c.agreementStartDate} to ${c.agreementRenewalDate || 'Ongoing'}` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.status === 'A'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {c.status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenDocModal(c)}
                              title="Manage Documents"
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[11px] font-medium transition"
                            >
                              📁 Docs
                            </button>
                            <button
                              onClick={() => handleEdit(c)}
                              className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[11px] font-medium transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(c._id, c.clientName)}
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
        /* Comprehensive 3-Section Add / Edit Client Form */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">
                {editingClient ? 'EDIT CLIENT' : 'ADD CLIENT'}
              </h2>
              <p className="text-xs text-slate-400">
                Setup brand principal, statutory compliance, commercial SLA charges and service territories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>

          {/* Section 1: Client Information */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              1. Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  Client ID <span className="text-slate-500">(Auto-generated if empty)</span>
                </label>
                <input
                  type="text"
                  value={formData.clientCode}
                  onChange={(e) => setFormData({ ...formData, clientCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. QSC0001"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Client Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Company / Brand Principal Name"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Proprietor Name</label>
                <input
                  type="text"
                  value={formData.proprietorName}
                  onChange={(e) => setFormData({ ...formData, proprietorName: e.target.value })}
                  placeholder="Director / Proprietor Name"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CIN Number</label>
                <input
                  type="text"
                  value={formData.cinNumber}
                  onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value.toUpperCase() })}
                  placeholder="Corporate Identification Number"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">GST Number</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="15-digit GSTIN"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="Key Account Manager / Spoc"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                  placeholder="Primary contact phone"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email ID</label>
                <input
                  type="email"
                  value={formData.emailId}
                  onChange={(e) => setFormData({ ...formData, emailId: e.target.value })}
                  placeholder="contact@brand.com"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Landline Number</label>
                <input
                  type="text"
                  value={formData.landlineNumber}
                  onChange={(e) => setFormData({ ...formData, landlineNumber: e.target.value })}
                  placeholder="011-XXXXXXXX"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-400 mb-1">Registered Address</label>
                <textarea
                  rows={2}
                  value={formData.registeredAddress}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  placeholder="Head Office / Corporate registered address"
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
                  placeholder="Locality"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Commercial Information */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              2. Commercial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Toll Free Number</label>
                <input
                  type="text"
                  value={formData.tollFreeNumber}
                  onChange={(e) => setFormData({ ...formData, tollFreeNumber: e.target.value })}
                  placeholder="1800-XXX-XXXX"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Call Center</label>
                <select
                  value={formData.callCenter}
                  onChange={(e) => setFormData({ ...formData, callCenter: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Company Own">Company Own</option>
                  <option value="Quick Serves">Quick Serves</option>
                  <option value="Third Party">Third Party</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">No. Of Call Centre Seat</label>
                <input
                  type="number"
                  min={0}
                  value={formData.noOfCallCentreSeat}
                  onChange={(e) => setFormData({ ...formData, noOfCallCentreSeat: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Call Centre Seat Charge (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.callCentreSeatCharge}
                  onChange={(e) => setFormData({ ...formData, callCentreSeatCharge: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CRM Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.crmCharges}
                  onChange={(e) => setFormData({ ...formData, crmCharges: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CRM Extra User Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.crmExtraUserCharges}
                  onChange={(e) => setFormData({ ...formData, crmExtraUserCharges: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Warehouse Charge PM (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.warehouseChargePM}
                  onChange={(e) => setFormData({ ...formData, warehouseChargePM: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Minimum Guaranty PM (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.minimumGuarantyPM}
                  onChange={(e) => setFormData({ ...formData, minimumGuarantyPM: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Management Fee Yearly (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.managementFeeYearly}
                  onChange={(e) => setFormData({ ...formData, managementFeeYearly: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Local Conveyance Charge Per KM (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.localConveyanceChargePerKM}
                  onChange={(e) => setFormData({ ...formData, localConveyanceChargePerKM: Number(e.target.value) })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  placeholder="e.g. Within 15 Days"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Credit Limit (₹)</label>
                <input
                  type="text"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  placeholder="e.g. 600000"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Credit Period (Days)</label>
                <input
                  type="text"
                  value={formData.creditPeriod}
                  onChange={(e) => setFormData({ ...formData, creditPeriod: e.target.value })}
                  placeholder="e.g. 30"
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Agreement Start Date</label>
                <input
                  type="date"
                  value={formData.agreementStartDate}
                  onChange={(e) => setFormData({ ...formData, agreementStartDate: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Agreement Renewal Date</label>
                <input
                  type="date"
                  value={formData.agreementRenewalDate}
                  onChange={(e) => setFormData({ ...formData, agreementRenewalDate: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reconciliation Period</label>
                <select
                  value={formData.reconciliationPeriod}
                  onChange={(e) => setFormData({ ...formData, reconciliationPeriod: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half Yearly">Half Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
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

          {/* Section 3: Service Area Dual-List Selection */}
          <div className="bg-[#111c2e] p-5 rounded-xl border border-[#24344d] space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-[#24344d] pb-2">
              3. Service Area (State-Wise Coverage)
            </h3>
            <ServiceAreaDualList
              available={ALL_INDIAN_STATES}
              selected={formData.serviceAreas}
              onChange={(areas) => setFormData({ ...formData, serviceAreas: areas })}
            />
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

      {/* Upload Client Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-4xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#24344d] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-[#dc2626]">📁</span>
                  <span>Upload Client Document</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Upload and maintain Address Proof, GST Certificate, PAN Card &amp; Aadhar Card
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
                {/* Field 1: Client Selection */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Client <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedDocClientId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDocClientId(id);
                      const match = clients.find((c) => c._id === id);
                      if (match) {
                        setSelectedDocClientCode(match.clientCode || '');
                      }
                      fetchClientDocs(id);
                    }}
                    className="w-full bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">--- Select Client ---</option>
                    {clients.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.clientName} ({c.clientCode})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Field 2: Client Code */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Client Code</label>
                  <input
                    type="text"
                    readOnly
                    placeholder="Auto-populated"
                    value={selectedDocClientCode}
                    className="w-full bg-[#111c2e]/70 border border-[#24344d] rounded-lg px-3 py-2 text-slate-300 font-mono uppercase cursor-not-allowed"
                  />
                </div>

                {/* Field 3: Document Type */}
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">
                    Document Type <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {CLIENT_DOCUMENT_TYPES.map((t) => (
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
                Uploaded Client Documents ({docList.length})
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
                          No documents uploaded yet for this client.
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

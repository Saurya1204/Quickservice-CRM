'use client';

import React, { useState, useEffect } from 'react';
import PincodeField from '@/components/common/PincodeLookup';

interface CallManagementProps {
  initialMode?: string;
  currentUser?: any;
}

export default function CallManagementView({ initialMode = 'callView', currentUser }: CallManagementProps) {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialMode);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected call for actions
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionSaving, setActionSaving] = useState(false);
  const [reopenHistoryModalCall, setReopenHistoryModalCall] = useState<any | null>(null);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);

  // Check Reopen Permission
  const isSuperAdmin =
    currentUser?.role === 'Super Admin' ||
    currentUser?.roleCode === 'SUPER_ADMIN' ||
    !currentUser;

  const canReopen =
    isSuperAdmin ||
    currentUser?.permissions?.some(
      (p: any) =>
        p.module === 'callManagement' &&
        (p.actions?.reopenCall || p.accessLevel === 'FULL')
    );

  // New Call Form
  const [newCall, setNewCall] = useState({
    customerName: '',
    customerMobile: '',
    customerAddress: '',
    city: 'GHAZIABAD',
    state: 'UTTAR PRADESH',
    pincode: '201014',
    clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
    brandName: 'SAMSUNG',
    categoryName: 'Air Conditioner',
    reportedFault: '',
    callStatus: 'OPEN',
    technicianName: '',
  });

  const [editingCallData, setEditingCallData] = useState({
    customerName: '',
    customerMobile: '',
    customerAddress: '',
    city: 'GHAZIABAD',
    state: 'UTTAR PRADESH',
    pincode: '201014',
    clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
    brandName: 'SAMSUNG',
    categoryName: 'Air Conditioner',
    reportedFault: '',
    callStatus: 'OPEN',
    technicianName: '',
  });

  const [registering, setRegistering] = useState(false);

  const handleStartEdit = (call: any) => {
    setSelectedCall(call);
    setActionType('edit');
    setEditingCallData({
      customerName: call.customerName || '',
      customerMobile: call.customerMobile || '',
      customerAddress: call.customerAddress || '',
      city: call.city || 'GHAZIABAD',
      state: call.state || 'UTTAR PRADESH',
      pincode: call.pincode || '201014',
      clientName: call.clientName || '',
      brandName: call.brandName || '',
      categoryName: call.categoryName || '',
      reportedFault: call.reportedFault || '',
      callStatus: call.callStatus || 'OPEN',
      technicianName: call.technicianName || '',
    });
  };

  const handleDeleteCall = async (id: string, callNo: string) => {
    if (!confirm(`Are you sure you want to delete call #${callNo}?`)) return;
    try {
      const res = await fetch(`/api/calls?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchCalls();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  useEffect(() => {
    setActiveTab(initialMode);
    if (initialMode === 'callAppointment') {
      setFilterStatus('APPOINTMENT');
    } else if (initialMode === 'callAllotment') {
      setFilterStatus('OPEN');
    } else if (initialMode === 'callCancel' || initialMode === 'directCancel' || initialMode === 'directCancelPo') {
      setFilterStatus('CANCEL');
    } else if (initialMode === 'callFeedback') {
      setFilterStatus('COMPLETED');
    } else if (initialMode === 'callReopen') {
      setFilterStatus('CLOSED');
    } else if (initialMode === 'callRegistration') {
      setActiveTab('callRegistration');
    } else {
      setFilterStatus('ALL');
    }
  }, [initialMode]);

  useEffect(() => {
    fetchCalls();
    fetchCategories();
  }, [filterStatus]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/masters/categories');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMasterCategories(json.data);
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchCalls = async () => {
    setLoading(true);
    try {
      let url = '/api/calls';
      if (filterStatus === 'CLOSED') {
        url = '/api/calls?status=CLOSED';
      } else if (filterStatus !== 'ALL') {
        url = `/api/calls?status=${filterStatus}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setCalls(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCall,
          createdBy: currentUser?.fullName || 'Call Coordinator',
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Service Call registered successfully with Call No: ' + json.data.callNo);
        setNewCall({
          customerName: '',
          customerMobile: '',
          customerAddress: '',
          city: 'GHAZIABAD',
          state: 'UTTAR PRADESH',
          pincode: '201014',
          clientName: 'MACKAVM INTERNATIONAL PRIVATE LIMITED',
          brandName: 'SAMSUNG',
          categoryName: 'Air Conditioner',
          reportedFault: '',
          callStatus: 'OPEN',
          technicianName: '',
        });
        setActiveTab('callView');
        fetchCalls();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleTriggerReopen = (call: any) => {
    if (!canReopen) {
      alert('You do not have permission to reopen closed calls. Contact your administrator.');
      return;
    }
    setSelectedCall(call);
    setActionType('reopen');
    setActionInput('');
  };

  const handleExecuteAction = async () => {
    if (!selectedCall) return;
    setActionSaving(true);

    try {
      if (actionType === 'reopen') {
        if (!actionInput || !actionInput.trim()) {
          alert('Reopening Reason is mandatory. Please provide a clear justification.');
          setActionSaving(false);
          return;
        }

        const res = await fetch('/api/calls/reopen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedCall._id,
            reason: actionInput.trim(),
            reopenedBy: currentUser?.fullName || 'Authorized Officer',
          }),
        });
        const json = await res.json();
        if (json.success) {
          alert(`Call #${selectedCall.callNo} successfully reopened! It has been restored to active status.`);
          setSelectedCall(null);
          setActionType(null);
          setActionInput('');
          fetchCalls();
        } else {
          alert(json.message);
        }
        return;
      }

      const updatePayload: any = { id: selectedCall._id };

      if (actionType === 'edit') {
        Object.assign(updatePayload, editingCallData);
      } else if (actionType === 'allot') {
        updatePayload.technicianName = actionInput || 'PRASHANT GUPTA';
        updatePayload.callStatus = 'ALLOTED';
      } else if (actionType === 'appointment' || actionType === 'reschedule') {
        updatePayload.appointmentDate = actionDate || new Date();
        updatePayload.callStatus = 'APPOINTMENT';
      } else if (actionType === 'cancel' || actionType === 'directCancel') {
        updatePayload.callStatus = 'CANCEL';
      } else if (actionType === 'feedback') {
        updatePayload.callStatus = 'COMPLETED';
      } else if (actionType === 'transfer') {
        updatePayload.city = actionInput || selectedCall.city;
      } else if (actionType === 'serial') {
        updatePayload.reportedFault = `${selectedCall.reportedFault} [Serial: ${actionInput}]`;
      }

      const res = await fetch('/api/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedCall(null);
        setActionType(null);
        setActionInput('');
        fetchCalls();
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionSaving(false);
    }
  };

  const filteredCalls = calls.filter(
    (c) =>
      c.callNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerMobile?.includes(searchTerm) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.technicianName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-4 shadow-xl">
        {/* Navigation Mode Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#334155] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Call Management Operations</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {calls.length} calls
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Service Request Intake, Allotment, Reopen, Rescheduling & Lifecycle Tracking
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveTab('callView');
                setFilterStatus('ALL');
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'callView' && filterStatus === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Calls
            </button>
            <button
              onClick={() => {
                setActiveTab('callReopen');
                setFilterStatus('CLOSED');
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                activeTab === 'callReopen' || filterStatus === 'CLOSED'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🔄 Reopen Closed Calls</span>
            </button>
            <button
              onClick={() => setActiveTab('callRegistration')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'callRegistration'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              + Call Registration
            </button>
          </div>
        </div>

        {/* Action Modal */}
        {selectedCall && actionType && (
          <div className="bg-[#172033] border border-blue-500/30 p-5 rounded-xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2">
                <span>
                  {actionType === 'reopen'
                    ? '🔄 REOPEN SERVICE CALL'
                    : `Action: ${actionType.toUpperCase()}`}
                </span>
                <span className="text-white font-mono">#{selectedCall.callNo}</span>
              </h4>
              <button
                onClick={() => {
                  setSelectedCall(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Cancel
              </button>
            </div>

            {actionType === 'reopen' ? (
              <div className="space-y-3">
                <div className="bg-[#0f172a] p-3 rounded-lg border border-[#334155] grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Customer</span>
                    <span className="text-white font-medium">{selectedCall.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Mobile</span>
                    <span className="text-slate-300 font-mono">{selectedCall.customerMobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Current Status</span>
                    <span className="text-rose-400 font-bold">{selectedCall.callStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Product</span>
                    <span className="text-slate-300">{selectedCall.brandName} - {selectedCall.categoryName}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">
                    Reopening Reason (Mandatory) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide specific reason for reopening this closed call (e.g., Customer reported cooling fault recurred, parts replaced were defective, further inspection required)..."
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ℹ️ Reopening will restore this ticket to the active call workflow and record an audit log with your timestamp and user ID.
                  </p>
                </div>
              </div>
            ) : actionType === 'edit' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Customer Name</label>
                  <input
                    type="text"
                    value={editingCallData.customerName}
                    onChange={(e) => setEditingCallData({ ...editingCallData, customerName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Customer Mobile</label>
                  <input
                    type="text"
                    value={editingCallData.customerMobile}
                    onChange={(e) => setEditingCallData({ ...editingCallData, customerMobile: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Status</label>
                  <select
                    value={editingCallData.callStatus}
                    onChange={(e) => setEditingCallData({ ...editingCallData, callStatus: e.target.value as any })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="APPOINTMENT">APPOINTMENT</option>
                    <option value="ALLOTED">ALLOTED</option>
                    <option value="PART_PENDING">PART_PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCEL">CANCEL</option>
                    <option value="REOPENED">REOPENED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Technician Name</label>
                  <input
                    type="text"
                    value={editingCallData.technicianName}
                    onChange={(e) => setEditingCallData({ ...editingCallData, technicianName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] text-slate-400 mb-0.5">Reported Fault</label>
                  <input
                    type="text"
                    value={editingCallData.reportedFault}
                    onChange={(e) => setEditingCallData({ ...editingCallData, reportedFault: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-[#0f172a] p-3 rounded-lg border border-[#334155]">
                  <p className="text-xs text-slate-300">
                    Customer: <span className="text-white font-medium">{selectedCall.customerName}</span> ({selectedCall.customerMobile})
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Product: <span className="text-white font-medium">{selectedCall.brandName} - {selectedCall.categoryName}</span>
                  </p>
                </div>

                <div>
                  {actionType === 'allot' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Assign Technician Name</label>
                      <input
                        type="text"
                        placeholder="e.g. PRASHANT GUPTA"
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {(actionType === 'appointment' || actionType === 'reschedule') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Appointment Date</label>
                      <input
                        type="date"
                        value={actionDate}
                        onChange={(e) => setActionDate(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {actionType === 'serial' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Appliance Serial Number</label>
                      <input
                        type="text"
                        placeholder="e.g. SN-88291002"
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white font-mono"
                      />
                    </div>
                  )}

                  {actionType === 'cancel' && (
                    <p className="text-xs text-rose-400">Are you sure you want to cancel this service call?</p>
                  )}

                  {actionType === 'feedback' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Customer Feedback Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Work completed satisfactorily"
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setSelectedCall(null);
                  setActionType(null);
                }}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionSaving}
                className={`text-white text-xs px-4 py-1.5 rounded font-medium shadow ${
                  actionType === 'reopen'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {actionSaving ? 'Executing...' : actionType === 'reopen' ? 'Confirm Reopening' : 'Confirm Action'}
              </button>
            </div>
          </div>
        )}

        {/* MODE 1: CALL REGISTRATION */}
        {activeTab === 'callRegistration' && (
          <form onSubmit={handleRegisterCall} className="bg-[#172033] p-6 rounded-xl border border-[#334155] space-y-4">
            <h3 className="text-sm font-semibold text-emerald-400">Register New Service Call</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Customer Name"
                  value={newCall.customerName}
                  onChange={(e) => setNewCall({ ...newCall, customerName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Mobile *</label>
                <input
                  type="tel"
                  required
                  placeholder="10-digit Mobile"
                  value={newCall.customerMobile}
                  onChange={(e) => setNewCall({ ...newCall, customerMobile: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">PIN Code (Auto-Lookup)</label>
                <PincodeField
                  pincode={newCall.pincode}
                  onPincodeChange={(pin) => setNewCall((prev) => ({ ...prev, pincode: pin }))}
                  onLocationFound={(loc) =>
                    setNewCall((prev) => ({
                      ...prev,
                      city: loc.city,
                      state: loc.state,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={newCall.city}
                  onChange={(e) => setNewCall({ ...newCall, city: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
                <input
                  type="text"
                  value={newCall.state}
                  onChange={(e) => setNewCall({ ...newCall, state: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Client Name</label>
                <input
                  type="text"
                  value={newCall.clientName}
                  onChange={(e) => setNewCall({ ...newCall, clientName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Brand</label>
                <input
                  type="text"
                  value={newCall.brandName}
                  onChange={(e) => setNewCall({ ...newCall, brandName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                <select
                  value={newCall.categoryName}
                  onChange={(e) => setNewCall({ ...newCall, categoryName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {masterCategories.map((cat) => (
                    <option key={cat._id} value={cat.categoryName}>
                      {cat.categoryName}
                    </option>
                  ))}
                  {masterCategories.length === 0 && <option value="Air Conditioner">Air Conditioner</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Initial Technician (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PRASHANT GUPTA"
                  value={newCall.technicianName}
                  onChange={(e) => setNewCall({ ...newCall, technicianName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Customer Address</label>
              <textarea
                rows={2}
                placeholder="House/Flat No, Street, Society, Landmark"
                value={newCall.customerAddress}
                onChange={(e) => setNewCall({ ...newCall, customerAddress: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Reported Fault Description *</label>
              <input
                type="text"
                required
                placeholder="Describe the complaint reported by customer"
                value={newCall.reportedFault}
                onChange={(e) => setNewCall({ ...newCall, reportedFault: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('callView')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registering}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {registering ? 'Registering...' : 'Register Call'}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: CALL VIEW / REOPEN / ALLOTMENT */}
        {activeTab !== 'callRegistration' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#172033] p-3 rounded-xl border border-[#334155]">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'OPEN', 'APPOINTMENT', 'ALLOTED', 'PART_PENDING', 'COMPLETED', 'CANCEL', 'REOPENED', 'CLOSED'].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`text-[11px] px-2.5 py-1 rounded font-medium transition ${
                        filterStatus === status
                          ? status === 'CLOSED' || status === 'REOPENED'
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-blue-600 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {status === 'CLOSED' ? 'CLOSED (COMPLETED/CANCEL)' : status}
                    </button>
                  )
                )}
              </div>

              <input
                type="text"
                placeholder="Search Call No / Mobile / City..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-52"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#334155]">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Loading service calls...</div>
              ) : filteredCalls.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No service calls found.</div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="p-3">Call No</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">City / PIN</th>
                      <th className="p-3">Product / Category</th>
                      <th className="p-3">Reported Fault</th>
                      <th className="p-3">Technician</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60">
                    {filteredCalls.map((c) => {
                      const isClosed = c.callStatus === 'COMPLETED' || c.callStatus === 'CANCEL';
                      const isReopened = c.callStatus === 'REOPENED';

                      return (
                        <tr key={c._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 text-emerald-400 font-mono text-xs font-semibold">
                            {c.callNo}
                            {isReopened && (
                              <button
                                onClick={() => setReopenHistoryModalCall(c)}
                                title="View Reopening Audit Trail"
                                className="block mt-1 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-sans hover:bg-amber-500/30"
                              >
                                🔄 Reopened ({c.reopenHistory?.length || 1})
                              </button>
                            )}
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-white">{c.customerName}</p>
                            <p className="text-slate-400 text-[11px] font-mono">{c.customerMobile}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-white">{c.city}</p>
                            <p className="text-slate-500 text-[10px] font-mono">{c.pincode}</p>
                          </td>
                          <td className="p-3">
                            <p className="text-white font-medium">{c.brandName}</p>
                            <p className="text-[11px] text-slate-400">{c.categoryName}</p>
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs truncate" title={c.reportedFault}>
                            {c.reportedFault}
                          </td>
                          <td className="p-3 text-slate-300">{c.technicianName || <span className="text-slate-500">— (Unassigned)</span>}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] border font-medium ${
                                c.callStatus === 'OPEN'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : c.callStatus === 'ALLOTED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : c.callStatus === 'PART_PENDING'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : c.callStatus === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                  : c.callStatus === 'REOPENED'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}
                            >
                              {c.callStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1 flex-wrap">
                              {/* REOPEN ACTION FOR CLOSED CALLS */}
                              {isClosed && (
                                <button
                                  onClick={() => handleTriggerReopen(c)}
                                  className="text-[11px] px-2.5 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium rounded border border-amber-500/30 transition shadow"
                                >
                                  🔄 Reopen Call
                                </button>
                              )}

                              {!isClosed && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedCall(c);
                                      setActionType('allot');
                                    }}
                                    className="text-[11px] px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded border border-indigo-500/20"
                                  >
                                    Allot
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedCall(c);
                                      setActionType('appointment');
                                    }}
                                    className="text-[11px] px-2 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded border border-amber-500/20"
                                  >
                                    Appoint
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedCall(c);
                                      setActionType('feedback');
                                    }}
                                    className="text-[11px] px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20"
                                  >
                                    Close
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => handleStartEdit(c)}
                                className="text-[11px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteCall(c._id, c.callNo)}
                                className="text-[11px] px-2 py-0.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded border border-rose-500/20"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* REOPEN HISTORY AUDIT MODAL */}
      {reopenHistoryModalCall && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>🔄 Reopening Audit Trail: #{reopenHistoryModalCall.callNo}</span>
              </h3>
              <button
                onClick={() => setReopenHistoryModalCall(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {reopenHistoryModalCall.reopenHistory && reopenHistoryModalCall.reopenHistory.length > 0 ? (
                reopenHistoryModalCall.reopenHistory.map((h: any, idx: number) => (
                  <div key={idx} className="bg-[#172033] p-3 rounded-lg border border-[#334155] text-xs space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>
                        Reopened by: <strong className="text-white">{h.reopenedBy}</strong>
                      </span>
                      <span>{new Date(h.reopenedAt).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Previous Status: </span>
                      <span className="text-rose-400 font-medium">{h.previousStatus}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Mandatory Reason: </span>
                      <p className="text-amber-300 mt-0.5 font-medium bg-[#111c2e] p-2 rounded border border-[#334155]/60">
                        "{h.reason}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400">No reopen history records found.</div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#334155]">
              <button
                onClick={() => setReopenHistoryModalCall(null)}
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

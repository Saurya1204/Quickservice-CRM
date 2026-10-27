'use client';

import React, { useState, useEffect } from 'react';

interface CallManagementProps {
  initialMode?: string;
}

export default function CallManagementView({ initialMode = 'callView' }: CallManagementProps) {
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
  const [masterCategories, setMasterCategories] = useState<any[]>([]);

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
      const url = filterStatus === 'ALL' ? '/api/calls' : `/api/calls?status=${filterStatus}`;
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
        body: JSON.stringify(newCall),
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

  const handleExecuteAction = async () => {
    if (!selectedCall) return;
    setActionSaving(true);

    try {
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
      } else if (actionType === 'reopen') {
        updatePayload.callStatus = 'OPEN';
      } else if (actionType === 'feedback') {
        updatePayload.customerFeedback = { rating: 5, comment: actionInput || 'Satisfied' };
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
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
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
              Service Request Intake, Allotment, Rescheduling & Lifecycle Tracking
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('callView')}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'callView'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Call View
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
          <div className="bg-[#172033] border border-blue-500/30 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Action: {actionType.toUpperCase()} on Call #{selectedCall.callNo}
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

            {actionType === 'edit' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Customer Name</label>
                  <input
                    type="text"
                    value={editingCallData.customerName}
                    onChange={(e) => setEditingCallData({ ...editingCallData, customerName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Mobile No</label>
                  <input
                    type="text"
                    value={editingCallData.customerMobile}
                    onChange={(e) => setEditingCallData({ ...editingCallData, customerMobile: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">City</label>
                  <input
                    type="text"
                    value={editingCallData.city}
                    onChange={(e) => setEditingCallData({ ...editingCallData, city: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Technician</label>
                  <input
                    type="text"
                    value={editingCallData.technicianName}
                    onChange={(e) => setEditingCallData({ ...editingCallData, technicianName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Call Status</label>
                  <select
                    value={editingCallData.callStatus}
                    onChange={(e) => setEditingCallData({ ...editingCallData, callStatus: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-xs text-white"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="APPOINTMENT">APPOINTMENT</option>
                    <option value="ALLOTED">ALLOTED</option>
                    <option value="PART_PENDING">PART_PENDING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCEL">CANCEL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Product Category</label>
                  <select
                    value={editingCallData.categoryName}
                    onChange={(e) => setEditingCallData({ ...editingCallData, categoryName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-xs text-white"
                  >
                    {masterCategories.length > 0 ? (
                      masterCategories.map((c) => (
                        <option key={c._id} value={c.categoryName}>
                          {c.categoryCode} - {c.categoryName}
                        </option>
                      ))
                    ) : (
                      <option value={editingCallData.categoryName}>{editingCallData.categoryName}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Reported Fault</label>
                  <input
                    type="text"
                    value={editingCallData.reportedFault}
                    onChange={(e) => setEditingCallData({ ...editingCallData, reportedFault: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400">
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

                  {actionType === 'reopen' && (
                    <p className="text-xs text-amber-400">Reopen this service call and set status back to OPEN?</p>
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-1.5 rounded font-medium shadow"
              >
                {actionSaving ? 'Updating...' : 'Confirm Action'}
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
                  placeholder="Customer Name"
                  value={newCall.customerName}
                  onChange={(e) => setNewCall({ ...newCall, customerName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Mobile Number *</label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  placeholder="Mobile Number"
                  value={newCall.customerMobile}
                  onChange={(e) => setNewCall({ ...newCall, customerMobile: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={newCall.city}
                  onChange={(e) => setNewCall({ ...newCall, city: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">Customer Full Address</label>
                <input
                  type="text"
                  placeholder="House/Flat No, Street, Society"
                  value={newCall.customerAddress}
                  onChange={(e) => setNewCall({ ...newCall, customerAddress: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={newCall.pincode}
                  onChange={(e) => setNewCall({ ...newCall, pincode: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Brand</label>
                <input
                  type="text"
                  value={newCall.brandName}
                  onChange={(e) => setNewCall({ ...newCall, brandName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Product Category</label>
                <select
                  value={newCall.categoryName}
                  onChange={(e) => setNewCall({ ...newCall, categoryName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {masterCategories.length > 0 ? (
                    masterCategories.map((c) => (
                      <option key={c._id} value={c.categoryName}>
                        {c.categoryCode} - {c.categoryName}
                      </option>
                    ))
                  ) : (
                    <option value="Consumer Electronics">Consumer Electronics</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Reported Fault *</label>
                <input
                  type="text"
                  required
                  placeholder="Fault description"
                  value={newCall.reportedFault}
                  onChange={(e) => setNewCall({ ...newCall, reportedFault: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-sm text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => setActiveTab('callView')}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={registering}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-6 py-2 rounded font-medium transition shadow-lg"
              >
                {registering ? 'Registering...' : 'Submit Call Registration'}
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: CALL VIEW (FILTERABLE TABLE) */}
        {activeTab !== 'callRegistration' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#172033] p-3 rounded-xl border border-[#334155]">
              <div className="flex flex-wrap gap-2">
                {['ALL', 'OPEN', 'APPOINTMENT', 'ALLOTED', 'PART_PENDING', 'COMPLETED', 'CANCEL'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`text-[11px] px-2.5 py-1 rounded font-medium transition ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search Call No / Mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-48"
              />
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-400">Loading service calls...</div>
              ) : (
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                    <tr>
                      <th className="p-3">Call No</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">City</th>
                      <th className="p-3">Product / Category</th>
                      <th className="p-3">Fault</th>
                      <th className="p-3">Technician</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Call Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {filteredCalls.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-emerald-400 font-mono text-xs">{c.callNo}</td>
                        <td className="p-3">
                          <p className="font-semibold text-white">{c.customerName}</p>
                          <p className="text-xs text-slate-400">{c.customerMobile}</p>
                        </td>
                        <td className="p-3 text-slate-300 text-xs">{c.city}</td>
                        <td className="p-3">
                          <p className="text-white text-xs font-medium">{c.brandName}</p>
                          <p className="text-[11px] text-slate-400">{c.categoryName}</p>
                        </td>
                        <td className="p-3 text-slate-300 text-xs max-w-xs truncate">{c.reportedFault}</td>
                        <td className="p-3 text-slate-300 text-xs">{c.technicianName || '— (Unassigned)'}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs border font-medium ${
                              c.callStatus === 'OPEN'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : c.callStatus === 'ALLOTED'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : c.callStatus === 'PART_PENDING'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                : c.callStatus === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                : 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            {c.callStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            <button
                              onClick={() => handleStartEdit(c)}
                              className="text-[11px] px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium rounded border border-blue-500/30"
                            >
                              Edit
                            </button>
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
                            <button
                              onClick={() => {
                                setSelectedCall(c);
                                setActionType('cancel');
                              }}
                              className="text-[11px] px-2 py-0.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded border border-orange-500/20"
                            >
                              Cancel
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

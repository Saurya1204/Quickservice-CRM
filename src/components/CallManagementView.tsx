'use client';

import React, { useState, useEffect } from 'react';
import CallRegistrationModule from '@/components/CallRegistrationModule';
import CallUpdateModule from '@/components/CallUpdateModule';
import CallDetailModal from '@/components/CallDetailModal';
import JobsheetPrintModal from '@/components/JobsheetPrintModal';
import CallFeedbackAdminModule from '@/components/CallFeedbackAdminModule';

interface CallManagementProps {
  initialMode?: string;
  currentUser?: any;
}

export const CALL_MODULE_TITLES: Record<string, { title: string; subtitle: string; icon: string; badge: string }> = {
  callRegistration: {
    title: 'Call Registration',
    subtitle: 'Register customer complaints and new service requests with real-time master lookup',
    icon: '📝',
    badge: 'Registration',
  },
  callView: {
    title: 'Call View',
    subtitle: 'Comprehensive 11-section service complaint lifecycle view, history & attachment download',
    icon: '👁️',
    badge: 'Directory',
  },
  callEdit: {
    title: 'Call Edit',
    subtitle: 'Modify customer information, contact coordinates, appliances, and service status',
    icon: '✏️',
    badge: 'Modify',
  },
  callReminder: {
    title: 'Call Reminder',
    subtitle: 'Record caller follow-ups, customer talk notes, and operational call logs',
    icon: '⏰',
    badge: 'Follow-up',
  },
  callAppointment: {
    title: 'Call Appointment',
    subtitle: 'Schedule technician home visit dates and customer appointment time slots',
    icon: '📅',
    badge: 'Schedule',
  },
  callReschedule: {
    title: 'Call Reschedule',
    subtitle: 'Re-assign visit appointments due to customer unavailability or technician delay',
    icon: '🔄',
    badge: 'Reschedule',
  },
  callTransfer: {
    title: 'Call Transfer',
    subtitle: 'Transfer complaint assignment to an alternate service engineer or regional service branch',
    icon: '🔀',
    badge: 'Transfer',
  },
  callReopen: {
    title: 'Call Reopen',
    subtitle: 'Restore previously closed or cancelled service calls with mandatory justification',
    icon: '🔓',
    badge: 'Reopen',
  },
  callCancel: {
    title: 'Call Cancel',
    subtitle: 'Cancel active complaints with recorded operational justification and status update',
    icon: '❌',
    badge: 'Cancellation',
  },
  callFeedback: {
    title: 'Call Feedback',
    subtitle: 'Record post-service customer satisfaction ratings, NPS score, and feedback comments',
    icon: '⭐',
    badge: 'Feedback',
  },
  callUpdate: {
    title: 'Call Update / Job Sheet',
    subtitle: 'Technician job sheet update, spare parts replacement, labour collection & PART PENDING validation',
    icon: '📋',
    badge: 'Job Sheet',
  },
  callAllotment: {
    title: 'Call Allotment',
    subtitle: 'Allot unassigned customer service tickets to designated service technicians',
    icon: '👷',
    badge: 'Allotment',
  },
  jobsheetPrint: {
    title: 'Jobsheet Print',
    subtitle: 'Generate professional A4 printable customer service work orders with brand logo & signatures',
    icon: '🖨️',
    badge: 'Print',
  },
  directCancel: {
    title: 'Direct Cancel',
    subtitle: 'Direct cancellation of service tickets by authorized administrators with immediate effect',
    icon: '🚫',
    badge: 'Direct Cancel',
  },
  directCancelPo: {
    title: 'Direct Cancel PO',
    subtitle: 'Cancel Purchase Orders and parts requisition tickets with supplier audit trail',
    icon: '📄',
    badge: 'PO Cancel',
  },
  updateSerialNo: {
    title: 'Update Serial No.',
    subtitle: 'Modify or correct appliance unit set serial numbers with historical audit logging',
    icon: '🔢',
    badge: 'Serial No',
  },
  callAudit: {
    title: 'Call Audit',
    subtitle: 'Immutable chronological audit trail of all operational transactions, IP logs & timestamps',
    icon: '📜',
    badge: 'Audit Trail',
  },
};

export default function CallManagementView({ initialMode = 'callView', currentUser }: CallManagementProps) {
  const [activeTab, setActiveTab] = useState<string>(initialMode);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchParams, setSearchParams] = useState({
    complaintNo: '',
    customerName: '',
    mobile: '',
    serialNo: '',
    poNumber: '',
  });

  // Modal dialog states
  const [detailModalCall, setDetailModalCall] = useState<any | null>(null);
  const [printModalCall, setPrintModalCall] = useState<any | null>(null);
  const [updateCallId, setUpdateCallId] = useState<string | undefined>(undefined);

  // Action Dialog state (for Allotment, Appointment, Reschedule, Reminder, Reopen, Transfer, Cancel, Feedback, etc.)
  const [actionCall, setActionCall] = useState<any | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [actionInput, setActionInput] = useState('');
  const [actionInput2, setActionInput2] = useState('');
  const [actionDate, setActionDate] = useState('');
  const [actionTime, setActionTime] = useState('10:00 AM');
  const [actionRating, setActionRating] = useState(5);
  const [actionSaving, setActionSaving] = useState(false);

  // Call Audit state
  const [auditQuery, setAuditQuery] = useState('');
  const [auditCall, setAuditCall] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Edit Call state
  const [editCallData, setEditCallData] = useState<any>({});

  // Super Admin / Reopen authorization
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

  // React to initialMode prop updates
  useEffect(() => {
    setActiveTab(initialMode);
    if (initialMode === 'callAppointment') {
      setFilterStatus('APPOINTMENT');
    } else if (initialMode === 'callAllotment') {
      setFilterStatus('OPEN');
    } else if (initialMode === 'callReopen') {
      setFilterStatus('CLOSED');
    } else if (initialMode === 'callFeedback') {
      setFilterStatus('COMPLETED');
    } else if (initialMode === 'callCancel' || initialMode === 'directCancel') {
      setFilterStatus('CANCEL');
    } else {
      setFilterStatus('ALL');
    }
  }, [initialMode]);

  // Fetch calls whenever filterStatus changes or when a search is triggered
  useEffect(() => {
    if (activeTab !== 'callRegistration' && activeTab !== 'callAudit') {
      fetchCalls();
    }
  }, [filterStatus, activeTab]);

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterStatus === 'CLOSED') {
        q.set('status', 'CLOSED');
      } else if (filterStatus !== 'ALL') {
        q.set('status', filterStatus);
      }

      if (searchParams.complaintNo) q.set('complaintNo', searchParams.complaintNo);
      if (searchParams.customerName) q.set('customerName', searchParams.customerName);
      if (searchParams.mobile) q.set('mobile', searchParams.mobile);
      if (searchParams.serialNo) q.set('serialNo', searchParams.serialNo);
      if (searchParams.poNumber) q.set('poNumber', searchParams.poNumber);

      const res = await fetch(`/api/calls?${q.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCalls(json.data);
      } else {
        setCalls([]);
      }
    } catch (err) {
      console.error('Error fetching service calls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCalls();
  };

  const handleClearSearch = () => {
    setSearchParams({
      complaintNo: '',
      customerName: '',
      mobile: '',
      serialNo: '',
      poNumber: '',
    });
    setSearchTerm('');
    setFilterStatus('ALL');
    setTimeout(() => {
      fetchCalls();
    }, 50);
  };

  // Dedicated Call Audit Search
  const handleFetchAudit = async (q?: string) => {
    const queryToUse = q || auditQuery;
    if (!queryToUse || !queryToUse.trim()) {
      alert('Please enter a Complaint Number or Call ID to fetch audit trail.');
      return;
    }
    setAuditLoading(true);
    try {
      const res = await fetch(`/api/calls/audit?complaintNo=${encodeURIComponent(queryToUse.trim())}`);
      const json = await res.json();
      if (json.success) {
        setAuditCall(json.data.call);
        setAuditLogs(json.data.auditLogs || []);
      } else {
        alert(json.message || 'Call audit record not found.');
        setAuditCall(null);
        setAuditLogs([]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to fetch audit trail.');
    } finally {
      setAuditLoading(false);
    }
  };

  // Open Action Dialog
  const openActionDialog = (call: any, type: string) => {
    setActionCall(call);
    setActionType(type);
    setActionInput('');
    setActionInput2('');
    setActionDate(new Date().toISOString().split('T')[0]);
    setActionTime('10:00 AM');
    setActionRating(5);

    if (type === 'edit') {
      setEditCallData({
        customerName: call.customerName || '',
        customerMobile: call.customerMobile || '',
        customerAddress: call.customerAddress || '',
        city: call.city || '',
        state: call.state || '',
        pincode: call.pincode || '',
        brandName: call.brandName || '',
        categoryName: call.categoryName || '',
        modelNo: call.modelNo || '',
        serialNo: call.serialNo || call.unitSerialNumber || '',
        reportedFault: call.reportedFault || '',
        callStatus: call.callStatus || 'OPEN',
        technicianName: call.technicianName || '',
      });
    } else if (type === 'allot') {
      setActionInput(call.technicianName || 'PRASHANT GUPTA');
    } else if (type === 'updateSerialNo') {
      setActionInput(call.unitSerialNumber || call.serialNo || '');
    } else if (type === 'directCancelPo') {
      setActionInput(call.poNumber || `PO-${call.callNo}`);
    }
  };

  // Execute Action Dialog (Calls PUT /api/calls)
  const handleExecuteAction = async () => {
    if (!actionCall || !actionType) return;
    setActionSaving(true);

    try {
      const performedBy = currentUser?.fullName || currentUser?.name || 'Administrator';
      let payload: any = {
        id: actionCall._id,
        action: actionType,
        performedBy,
      };

      if (actionType === 'reopen') {
        if (!canReopen) {
          alert('You do not have permission to reopen closed calls.');
          setActionSaving(false);
          return;
        }
        if (!actionInput.trim()) {
          alert('Reopening justification reason is mandatory.');
          setActionSaving(false);
          return;
        }
        payload.reopenReason = actionInput.trim();
        payload.reopenedBy = performedBy;
      } else if (actionType === 'appointment' || actionType === 'reschedule') {
        if (!actionDate) {
          alert('Appointment date is mandatory.');
          setActionSaving(false);
          return;
        }
        payload.appointmentDate = actionDate;
        payload.appointmentTime = actionTime;
        payload.remarks = actionInput.trim() || (actionType === 'reschedule' ? 'Customer requested reschedule' : 'Appointment set');
      } else if (actionType === 'allot') {
        if (!actionInput.trim()) {
          alert('Please enter or select a technician name.');
          setActionSaving(false);
          return;
        }
        payload.technicianName = actionInput.trim();
        payload.remarks = actionInput2.trim() || `Allotted to ${actionInput.trim()}`;
      } else if (actionType === 'transfer') {
        if (!actionInput.trim()) {
          alert('Please specify the new technician to transfer the call to.');
          setActionSaving(false);
          return;
        }
        payload.toEngineer = actionInput.trim();
        payload.toBranch = actionInput2.trim();
        payload.remarks = `Transferred from ${actionCall.technicianName || 'Unassigned'} to ${actionInput.trim()}`;
      } else if (actionType === 'reminder') {
        if (!actionInput.trim()) {
          alert('Reminder note / remarks cannot be empty.');
          setActionSaving(false);
          return;
        }
        payload.remarks = actionInput.trim();
        payload.talkToWhom = actionInput2.trim() || actionCall.customerName;
        payload.callBy = performedBy;
      } else if (actionType === 'cancel' || actionType === 'directCancel') {
        if (!actionInput.trim()) {
          alert('Cancellation reason is mandatory.');
          setActionSaving(false);
          return;
        }
        payload.remarks = actionInput.trim();
        payload.reason = actionInput.trim();
      } else if (actionType === 'directCancelPo') {
        if (!actionInput.trim()) {
          alert('PO Number is mandatory.');
          setActionSaving(false);
          return;
        }
        if (!actionInput2.trim()) {
          alert('PO Cancellation reason is mandatory.');
          setActionSaving(false);
          return;
        }
        payload.poNumber = actionInput.trim();
        payload.poCancellationReason = actionInput2.trim();
      } else if (actionType === 'feedback') {
        payload.rating = actionRating;
        payload.customerComments = actionInput.trim();
        payload.isSatisfied = actionRating >= 3;
      } else if (actionType === 'updateSerialNo') {
        if (!actionInput.trim()) {
          alert('New Serial Number is mandatory.');
          setActionSaving(false);
          return;
        }
        payload.newSerialNo = actionInput.trim();
        payload.reason = actionInput2.trim() || 'Corrected serial number';
      } else if (actionType === 'edit') {
        payload = {
          id: actionCall._id,
          action: 'edit',
          performedBy,
          ...editCallData,
        };
      }

      const res = await fetch('/api/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message || 'Operation executed successfully!');
        setActionCall(null);
        setActionType(null);
        fetchCalls();
      } else {
        alert(json.message || 'Failed to perform operation.');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setActionSaving(false);
    }
  };

  // Filtered in-memory calls for quick search bar
  const displayedCalls = calls.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.callNo?.toLowerCase().includes(term) ||
      c.customerName?.toLowerCase().includes(term) ||
      c.customerMobile?.includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.technicianName?.toLowerCase().includes(term) ||
      c.serialNo?.toLowerCase().includes(term) ||
      c.unitSerialNumber?.toLowerCase().includes(term) ||
      c.brandName?.toLowerCase().includes(term)
    );
  });

  const currentModuleInfo = CALL_MODULE_TITLES[activeTab] || CALL_MODULE_TITLES.callView;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH ICON, TITLE & QUICK ACTION TABS */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#334155] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
              {currentModuleInfo.icon}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-wide">{currentModuleInfo.title}</h2>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {currentModuleInfo.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{currentModuleInfo.subtitle}</p>
            </div>
          </div>

          {/* QUICK SHORTCUT BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('callRegistration')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 shadow ${activeTab === 'callRegistration'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              <span>➕ Call Registration</span>
            </button>
            <button
              onClick={() => {
                setUpdateCallId(undefined);
                setActiveTab('callUpdate');
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 shadow ${activeTab === 'callUpdate'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              <span>📋 Call Update / Job Sheet</span>
            </button>
            <button
              onClick={() => setActiveTab('callView')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center space-x-1.5 shadow ${activeTab === 'callView'
                  ? 'bg-slate-700 text-white ring-2 ring-slate-400'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
              <span>👁️ All Calls</span>
            </button>
          </div>
        </div>

        {/* 17 SUB-MODULE QUICK NAVIGATION PILLS */}
        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] overflow-x-auto pb-1 custom-horizontal-scrollbar">
          {[
            { id: 'callRegistration', label: '1. Registration' },
            { id: 'callView', label: '2. Call View' },
            { id: 'callEdit', label: '3. Call Edit' },
            { id: 'callReminder', label: '4. Reminder' },
            { id: 'callAppointment', label: '5. Appointment' },
            { id: 'callReschedule', label: '6. Reschedule' },
            { id: 'callTransfer', label: '7. Transfer' },
            { id: 'callReopen', label: '8. Reopen' },
            { id: 'callCancel', label: '9. Cancel' },
            { id: 'callFeedback', label: '10. Feedback' },
            { id: 'callUpdate', label: '11. Job Sheet' },
            { id: 'callAllotment', label: '12. Allotment' },
            { id: 'jobsheetPrint', label: '13. Print Jobsheet' },
            { id: 'directCancel', label: '14. Direct Cancel' },
            { id: 'directCancelPo', label: '15. Cancel PO' },
            { id: 'updateSerialNo', label: '16. Update Serial' },
            { id: 'callAudit', label: '17. Call Audit' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded font-medium transition cursor-pointer whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-emerald-600 text-white font-bold shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MODULE 1: CALL REGISTRATION */}
      {activeTab === 'callRegistration' && (
        <CallRegistrationModule
          currentUser={currentUser}
          onCallRegistered={(newCall) => {
            fetchCalls();
            setActiveTab('callView');
          }}
          onCancel={() => setActiveTab('callView')}
        />
      )}

      {/* MODULE 11: CALL UPDATE / JOB SHEET */}
      {activeTab === 'callUpdate' && (
        <CallUpdateModule
          currentUser={currentUser}
          initialCallId={updateCallId}
          onCallUpdated={() => {
            fetchCalls();
          }}
          onBack={() => {
            setActiveTab('callView');
            setUpdateCallId(undefined);
          }}
        />
      )}

      {/* MODULE 17: CALL AUDIT (Dedicated Audit Timeline & Logs) */}
      {activeTab === 'callAudit' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-[#334155] pb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>📜 Immutable Call Audit Trail & Historical Transaction Log</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Search by Complaint Number or Call ID to inspect full immutable history of transactions, IP addresses, timestamps, and staff actions.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchAudit();
            }}
            className="flex flex-col sm:flex-row gap-3 max-w-xl"
          >
            <input
              type="text"
              placeholder="Enter Complaint No / Call ID (e.g. 261101UPQS0001)..."
              value={auditQuery}
              onChange={(e) => setAuditQuery(e.target.value)}
              className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={auditLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
            >
              {auditLoading ? 'Fetching...' : '🔍 Search Audit'}
            </button>
          </form>

          {auditCall && (
            <div className="space-y-6">
              {/* Call Snapshot Card */}
              <div className="bg-[#172033] border border-[#334155] rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Call Number</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">{auditCall.callNo}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Customer</span>
                  <span className="text-white font-medium">{auditCall.customerName} ({auditCall.customerMobile})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Product</span>
                  <span className="text-slate-200">{auditCall.brandName} - {auditCall.categoryName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Current Status</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {auditCall.callStatus}
                  </span>
                </div>
              </div>

              {/* Call History Operational Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  1. Operational Call History (Action, Remark, Timestamp, IP Address, Performed By)
                </h4>
                <div className="overflow-x-auto rounded-lg border border-[#334155]">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Action</th>
                        <th className="p-3">Remark / Note</th>
                        <th className="p-3">Transaction Date</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Entered By</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]/60 bg-[#0f172a]">
                      {auditCall.callHistory && auditCall.callHistory.length > 0 ? (
                        auditCall.callHistory.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="p-3 font-semibold text-emerald-400">{item.action}</td>
                            <td className="p-3 text-slate-300 max-w-sm break-words">{item.remark || '—'}</td>
                            <td className="p-3 font-mono text-slate-400 text-[11px]">
                              {item.transactionDate ? new Date(item.transactionDate).toLocaleString() : '—'}
                            </td>
                            <td className="p-3 font-mono text-slate-400 text-[11px]">{item.ipAddress || '—'}</td>
                            <td className="p-3 font-medium text-white">{item.enteredBy || 'System'}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                                {item.complaintStatus || auditCall.callStatus}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500 text-xs">
                            No operational call history records logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Audit Logs */}
              {auditLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                    2. Security & RBAC Audit Logs
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-[#334155]">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Audit Action</th>
                          <th className="p-3">Performed By</th>
                          <th className="p-3">IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#334155]/60 bg-[#0f172a]">
                        {auditLogs.map((log: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 font-mono text-slate-400 text-[11px]">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-3 font-bold text-amber-400">{log.action}</td>
                            <td className="p-3 text-white font-medium">{log.performedBy || 'Admin'}</td>
                            <td className="p-3 font-mono text-slate-400 text-[11px]">{log.ipAddress || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODULE 10: CALL FEEDBACK (Dedicated Feedback Management, Links & Reports) */}
      {activeTab === 'callFeedback' && (
        <CallFeedbackAdminModule
          currentUser={currentUser}
          onOpenComplaintView={async (complaintNo: string) => {
            try {
              const res = await fetch(`/api/calls?complaintNo=${encodeURIComponent(complaintNo)}`);
              const json = await res.json();
              if (json.success && json.data && json.data.length > 0) {
                setDetailModalCall(json.data[0]);
              }
            } catch (err) {
              console.error(err);
            }
          }}
        />
      )}

      {/* ALL OTHER MODULES (TABLE & SEARCH BASED) */}
      {activeTab !== 'callRegistration' && activeTab !== 'callUpdate' && activeTab !== 'callAudit' && activeTab !== 'callFeedback' && (
        <div className="space-y-4">
          {/* MULTI-FIELD SEARCH ACCORDION / FILTER BAR */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 shadow-lg space-y-3">
            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Complaint / Call No</label>
                  <input
                    type="text"
                    placeholder="e.g. 261101UPQS0001"
                    value={searchParams.complaintNo}
                    onChange={(e) => setSearchParams({ ...searchParams, complaintNo: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={searchParams.customerName}
                    onChange={(e) => setSearchParams({ ...searchParams, customerName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={searchParams.mobile}
                    onChange={(e) => setSearchParams({ ...searchParams, mobile: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Product Serial No</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-88291002"
                    value={searchParams.serialNo}
                    onChange={(e) => setSearchParams({ ...searchParams, serialNo: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                {(activeTab === 'directCancelPo') ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">PO Number</label>
                    <input
                      type="text"
                      placeholder="e.g. PO-88910"
                      value={searchParams.poNumber}
                      onChange={(e) => setSearchParams({ ...searchParams, poNumber: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Lifecycle Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">ALL STATUSES</option>
                      <option value="OPEN">OPEN</option>
                      <option value="APPOINTMENT">APPOINTMENT</option>
                      <option value="ALLOTED">ALLOTED</option>
                      <option value="PART_PENDING">PART_PENDING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCEL">CANCEL</option>
                      <option value="REOPENED">REOPENED</option>
                      <option value="CLOSED">CLOSED (COMPLETED / CANCEL)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#334155]/60">
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center space-x-1 shadow"
                  >
                    <span>🔍 Filter / Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                  >
                    Clear Filter
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Quick Filter:</span>
                  <input
                    type="text"
                    placeholder="Search visible records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#0f172a] border border-[#334155] rounded px-3 py-1 text-xs text-white focus:outline-none focus:border-blue-500 w-48"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* MAIN SERVICE CALLS TABLE */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-[#172033] border-b border-[#334155] flex justify-between items-center">
              <span className="text-xs font-bold text-white tracking-wider uppercase flex items-center space-x-2">
                <span>Service Calls Directory</span>
                <span className="bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-mono text-[10px] border border-slate-700">
                  {displayedCalls.length} records found
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                Click any <strong className="text-emerald-400">Call No</strong> to open comprehensive 11-section complaint view
              </span>
            </div>

            <div className="overflow-x-auto custom-horizontal-scrollbar">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  Loading service calls from database...
                </div>
              ) : displayedCalls.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No service calls found matching the query criteria.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300 min-w-[1250px]">
                  <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="p-3 whitespace-nowrap">Call No</th>
                      <th className="p-3 whitespace-nowrap">Reg. Date</th>
                      <th className="p-3 whitespace-nowrap">Customer Name</th>
                      <th className="p-3 whitespace-nowrap">Mobile</th>
                      <th className="p-3 whitespace-nowrap">City / Locality</th>
                      <th className="p-3 whitespace-nowrap">Brand / Category</th>
                      <th className="p-3 whitespace-nowrap">Serial Number</th>
                      <th className="p-3 whitespace-nowrap">Technician</th>
                      <th className="p-3 whitespace-nowrap">Status</th>
                      <th className="p-3 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                    {displayedCalls.map((c) => {
                      const isClosed = c.callStatus === 'COMPLETED' || c.callStatus === 'CANCEL';
                      const isReopened = c.callStatus === 'REOPENED';
                      const currentSerial = c.unitSerialNumber || c.serialNo || '—';

                      return (
                        <tr key={c._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setDetailModalCall(c)}
                              className="font-mono font-bold text-emerald-400 hover:text-emerald-300 underline decoration-dotted text-left"
                              title="Click to view full 11-section complaint view"
                            >
                              {c.callNo}
                            </button>
                            {isReopened && (
                              <span className="block mt-0.5 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded w-fit">
                                🔄 Reopened
                              </span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3 whitespace-nowrap font-medium text-white">
                            {c.customerName || '—'}
                          </td>
                          <td className="p-3 whitespace-nowrap font-mono text-slate-300">
                            {c.customerMobile || '—'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-white block">{c.city || '—'}</span>
                            <span className="text-[10px] text-slate-400">{c.pincode || ''}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-200 block">{c.brandName || '—'}</span>
                            <span className="text-[10px] text-slate-400">{c.categoryName || ''}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-300">
                            {currentSerial !== '—' ? (
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                {currentSerial}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {c.technicianName ? (
                              <span className="text-indigo-300 font-medium">{c.technicianName}</span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${c.callStatus === 'OPEN'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  : c.callStatus === 'ALLOTED'
                                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                    : c.callStatus === 'APPOINTMENT'
                                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                      : c.callStatus === 'PART_PENDING'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : c.callStatus === 'COMPLETED'
                                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                          : c.callStatus === 'REOPENED'
                                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}
                            >
                              {c.callStatus}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1 flex-wrap">
                              {/* VIEW ACTION (Opens 11-section complaint view) */}
                              <button
                                type="button"
                                onClick={() => setDetailModalCall(c)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition"
                                title="View 11-section complaint view"
                              >
                                👁️ View
                              </button>

                              {/* PRINT ACTION (Opens A4 printable job sheet) */}
                              <button
                                type="button"
                                onClick={() => setPrintModalCall(c)}
                                className="px-2 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 rounded text-[11px] font-medium transition border border-indigo-500/20"
                                title="Print A4 Customer Job Sheet"
                              >
                                🖨️ Print
                              </button>

                              {/* JOB SHEET / UPDATE ACTION */}
                              <button
                                type="button"
                                onClick={() => {
                                  setUpdateCallId(c._id);
                                  setActiveTab('callUpdate');
                                }}
                                className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded text-[11px] font-medium transition border border-emerald-500/20"
                                title="Update Job Sheet, dynamic parts & charges"
                              >
                                📋 Job Sheet
                              </button>

                              {/* MODULE-SPECIFIC QUICK ACTIONS */}
                              {activeTab === 'callAllotment' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'allot')}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  👷 Allot Eng.
                                </button>
                              )}

                              {activeTab === 'callAppointment' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'appointment')}
                                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  📅 Appoint
                                </button>
                              )}

                              {activeTab === 'callReschedule' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'reschedule')}
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  🔄 Reschedule
                                </button>
                              )}

                              {activeTab === 'callReminder' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'reminder')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  ⏰ Add Reminder
                                </button>
                              )}

                              {activeTab === 'callTransfer' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'transfer')}
                                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  🔀 Transfer
                                </button>
                              )}

                              {activeTab === 'callReopen' && isClosed && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'reopen')}
                                  className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  🔓 Reopen Call
                                </button>
                              )}

                              {activeTab === 'callCancel' && !isClosed && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'cancel')}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  ❌ Cancel Call
                                </button>
                              )}

                              {activeTab === 'directCancel' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'directCancel')}
                                  className="px-2 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded text-[11px] font-bold shadow"
                                >
                                  🚫 Direct Cancel
                                </button>
                              )}

                              {activeTab === 'directCancelPo' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'directCancelPo')}
                                  className="px-2 py-1 bg-rose-800 hover:bg-rose-700 text-white rounded text-[11px] font-bold shadow"
                                >
                                  📄 Cancel PO
                                </button>
                              )}

                              {activeTab === 'callFeedback' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'feedback')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  ⭐ Feedback
                                </button>
                              )}

                              {activeTab === 'updateSerialNo' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'updateSerialNo')}
                                  className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold shadow"
                                >
                                  🔢 Update Serial
                                </button>
                              )}

                              {activeTab === 'callEdit' && (
                                <button
                                  type="button"
                                  onClick={() => openActionDialog(c, 'edit')}
                                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[11px] font-bold shadow"
                                >
                                  ✏️ Edit
                                </button>
                              )}
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
        </div>
      )}

      {/* COMPREHENSIVE 11-SECTION CALL DETAIL MODAL */}
      {detailModalCall && (
        <CallDetailModal
          call={detailModalCall}
          onClose={() => setDetailModalCall(null)}
          onOpenJobSheet={(call) => {
            setDetailModalCall(null);
            setUpdateCallId(call._id);
            setActiveTab('callUpdate');
          }}
          onOpenPrint={(call) => {
            setDetailModalCall(null);
            setPrintModalCall(call);
          }}
        />
      )}

      {/* JOBSHEET PRINT MODAL */}
      {printModalCall && (
        <JobsheetPrintModal
          call={printModalCall}
          onClose={() => setPrintModalCall(null)}
        />
      )}

      {/* ACTION DIALOG MODAL (Allot, Appointment, Reschedule, Reminder, Reopen, Cancel, Feedback, etc.) */}
      {actionCall && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>
                  {actionType === 'reopen' && '🔓 Reopen Service Call'}
                  {actionType === 'allot' && '👷 Allot Call to Engineer'}
                  {actionType === 'appointment' && '📅 Schedule Appointment'}
                  {actionType === 'reschedule' && '🔄 Reschedule Appointment'}
                  {actionType === 'reminder' && '⏰ Record Call Reminder'}
                  {actionType === 'transfer' && '🔀 Transfer Call'}
                  {actionType === 'cancel' && '❌ Cancel Service Call'}
                  {actionType === 'directCancel' && '🚫 Direct Cancel Service Call'}
                  {actionType === 'directCancelPo' && '📄 Direct Cancel Purchase Order (PO)'}
                  {actionType === 'feedback' && '⭐ Customer Feedback Entry'}
                  {actionType === 'updateSerialNo' && '🔢 Update Appliance Serial Number'}
                  {actionType === 'edit' && '✏️ Edit Service Call Details'}
                </span>
                <span className="font-mono text-emerald-400">#{actionCall.callNo}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActionCall(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Call Summary Banner */}
            <div className="bg-[#0f172a] p-3 rounded-lg border border-[#334155] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Customer</span>
                <span className="text-white font-semibold">{actionCall.customerName}</span>
                <span className="text-slate-400 block font-mono text-[11px]">{actionCall.customerMobile}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Product</span>
                <span className="text-slate-200">{actionCall.brandName} - {actionCall.categoryName}</span>
                <span className="text-blue-400 block text-[10px] font-semibold">{actionCall.callStatus}</span>
              </div>
            </div>

            {/* ACTION-SPECIFIC FIELDS */}
            {actionType === 'reopen' && (
              <div className="space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded text-[11px] text-amber-300">
                  ⚠️ <strong>Mandatory Business Requirement:</strong> A detailed justification must be provided for reopening closed or cancelled service calls.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    Reopening Reason / Justification *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Enter explicit reason (e.g., Customer called back saying cooling problem re-occurred, part was defective, visit requested)..."
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {(actionType === 'appointment' || actionType === 'reschedule') && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Appointment Date *</label>
                    <input
                      type="date"
                      value={actionDate}
                      onChange={(e) => setActionDate(e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">Time Slot / Time *</label>
                    <select
                      value={actionTime}
                      onChange={(e) => setActionTime(e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                      <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                      <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                      <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    {actionType === 'reschedule' ? 'Reason for Rescheduling' : 'Appointment Remarks'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Customer requested evening slot / technician reassigned"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {actionType === 'allot' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Assign Service Technician *</label>
                  <input
                    type="text"
                    placeholder="e.g. PRASHANT GUPTA"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Allotment Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Immediate high-priority visit assigned"
                    value={actionInput2}
                    onChange={(e) => setActionInput2(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {actionType === 'transfer' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Transfer To Engineer *</label>
                  <input
                    type="text"
                    placeholder="e.g. SANJAY SHARMA"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Transfer To Service Branch / ASC</label>
                  <input
                    type="text"
                    placeholder="e.g. GHAZIABAD MAIN BRANCH"
                    value={actionInput2}
                    onChange={(e) => setActionInput2(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {actionType === 'reminder' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Talk To Whom</label>
                  <input
                    type="text"
                    placeholder="e.g. Customer / Representative"
                    value={actionInput2}
                    onChange={(e) => setActionInput2(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Reminder Notes / Remarks *</label>
                  <textarea
                    rows={3}
                    placeholder="Enter call notes or reminder details..."
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {(actionType === 'cancel' || actionType === 'directCancel') && (
              <div className="space-y-3">
                <div className="bg-rose-500/10 border border-rose-500/30 p-2.5 rounded text-[11px] text-rose-300">
                  ⚠️ This action will immediately mark the service ticket as <strong>CANCELLED</strong>.
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Cancellation Reason *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Customer cancelled service request / Product already repaired / Outside service area..."
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {actionType === 'directCancelPo' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">PO Number *</label>
                  <input
                    type="text"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">PO Cancellation Reason *</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Spare part not required, supplier cancelled, or wrong PO generated..."
                    value={actionInput2}
                    onChange={(e) => setActionInput2(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            )}

            {actionType === 'feedback' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Customer Rating (1 to 5 Stars)</label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setActionRating(star)}
                        className={`text-2xl transition ${star <= actionRating ? 'text-amber-400 scale-110' : 'text-slate-600'}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="text-xs text-slate-300 font-bold ml-2">({actionRating} / 5)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Customer Comments / Feedback</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Customer expressed high satisfaction with on-time cooling repair..."
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {actionType === 'updateSerialNo' && (
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">Existing Serial Number:</span>
                  <span className="font-mono text-xs text-emerald-400 bg-[#0f172a] px-2 py-1 rounded border border-[#334155] block">
                    {actionCall.unitSerialNumber || actionCall.serialNo || 'None'}
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">New Serial Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-99882201"
                    value={actionInput}
                    onChange={(e) => setActionInput(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">Update Justification / Reason</label>
                  <input
                    type="text"
                    placeholder="e.g. Set serial was misprinted during initial intake"
                    value={actionInput2}
                    onChange={(e) => setActionInput2(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            {actionType === 'edit' && (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Customer Name</label>
                    <input
                      type="text"
                      value={editCallData.customerName || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, customerName: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Customer Mobile</label>
                    <input
                      type="text"
                      value={editCallData.customerMobile || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, customerMobile: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Address</label>
                  <input
                    type="text"
                    value={editCallData.customerAddress || ''}
                    onChange={(e) => setEditCallData({ ...editCallData, customerAddress: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">City</label>
                    <input
                      type="text"
                      value={editCallData.city || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, city: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">State</label>
                    <input
                      type="text"
                      value={editCallData.state || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, state: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">PIN Code</label>
                    <input
                      type="text"
                      value={editCallData.pincode || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, pincode: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Brand</label>
                    <input
                      type="text"
                      value={editCallData.brandName || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, brandName: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Category</label>
                    <input
                      type="text"
                      value={editCallData.categoryName || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, categoryName: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Serial No</label>
                    <input
                      type="text"
                      value={editCallData.serialNo || ''}
                      onChange={(e) => setEditCallData({ ...editCallData, serialNo: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-0.5">Call Status</label>
                    <select
                      value={editCallData.callStatus || 'OPEN'}
                      onChange={(e) => setEditCallData({ ...editCallData, callStatus: e.target.value })}
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
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-0.5">Reported Fault</label>
                  <textarea
                    rows={2}
                    value={editCallData.reportedFault || ''}
                    onChange={(e) => setEditCallData({ ...editCallData, reportedFault: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            )}

            {/* ACTION FOOTER */}
            <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => {
                  setActionCall(null);
                  setActionType(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                disabled={actionSaving}
                className={`px-5 py-2 rounded text-xs font-bold text-white shadow transition ${actionType === 'reopen'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : actionType === 'cancel' || actionType === 'directCancel' || actionType === 'directCancelPo'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
              >
                {actionSaving ? 'Executing...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

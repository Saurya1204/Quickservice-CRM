'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';

interface DashboardViewProps {
  currentUser?: any;
}

export default function DashboardView({ currentUser }: DashboardViewProps) {
  const [stats, setStats] = useState<any>({
    openCalls: 0,
    appointmentCalls: 0,
    allotedCalls: 0,
    partPendingCalls: 0,
    completedCalls: 0,
    cancelCalls: 0,
    reopenedCalls: 0,
    criticalPendingCalls: 0,
    activeBranches: 0,
    activeFranchises: 0,
    activeTechnicians: 0,
    sparesValuation: '₹ 42.5 L',
  });

  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCall, setEditingCall] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editTechnician, setEditTechnician] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Determine user role and organizational scope
  const roleCode = (currentUser?.roleCode || currentUser?.role || 'SUPER_ADMIN')
    .toUpperCase()
    .replace(/\s+/g, '_');
  const userRoleName = currentUser?.role || 'Super Admin';

  const organizationalScope = currentUser?.organizationalScope || 'NATIONAL';
  const clientId = currentUser?.clientId || '';
  const clientName = currentUser?.clientName || '';
  const brandName = currentUser?.brandName || '';
  const assignedBrands = Array.isArray(currentUser?.assignedBrands) ? currentUser.assignedBrands : [];
  const franchiseName = currentUser?.franchiseName || '';
  const technicianName = currentUser?.technicianName || '';
  const assignedZone = currentUser?.zoneName || currentUser?.assignedZone || '';
  const assignedBranch = currentUser?.branchName || currentUser?.assignedBranch || '';
  const assignedArea = currentUser?.assignedArea || '';

  const isSuperAdmin = roleCode === 'SUPER_ADMIN' || userRoleName === 'Super Admin';
  const isAdmin = roleCode === 'ADMIN' || userRoleName === 'Admin';
  const isClientUser = roleCode.includes('CLIENT') || userRoleName.includes('Client');
  const isBranchUser = roleCode.includes('BRANCH') || roleCode === 'BSM';
  const isZoneUser = roleCode.includes('ZONE') || roleCode === 'ZSM';
  const isFranchiseUser = roleCode.includes('FRANCHISE') || userRoleName.includes('Franchise');
  const isTechnician = roleCode.includes('TECH') || roleCode.includes('ENGINEER') || userRoleName.includes('Technician');
  const isHOD = roleCode === 'HOD';
  const isCCO = roleCode === 'CCO' || roleCode === 'CALL_CENTRE_EXECUTIVE';

  useEffect(() => {
    fetchDashboard();
  }, [currentUser]);

  const fetchDashboard = async () => {
    try {
      const params = new URLSearchParams();
      if (roleCode) params.set('role', roleCode);

      // Scoping
      if (clientId) params.set('clientId', clientId);
      if (clientName) params.set('clientName', clientName);
      if (brandName) params.set('brand', brandName);
      if (franchiseName) params.set('franchise', franchiseName);
      if (technicianName) params.set('technician', technicianName);
      if (assignedBranch) params.set('branch', assignedBranch);
      if (assignedZone) params.set('zone', assignedZone);
      if (assignedArea) params.set('city', assignedArea);

      const [statsJson, callsJson] = await Promise.all([
        fetchWithCache(`/api/dashboard/stats?${params.toString()}`).catch(() => null),
        fetchWithCache(`/api/calls?${params.toString()}`).catch(() => null),
      ]);

      if (statsJson && statsJson.success) {
        setStats(statsJson.stats);
      }
      if (callsJson && callsJson.success && Array.isArray(callsJson.data)) {
        setRecentCalls(callsJson.data);
      }
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (call: any) => {
    setEditingCall(call);
    setEditStatus(call.callStatus || 'OPEN');
    setEditTechnician(call.technicianName || '');
  };

  const handleSaveEdit = async () => {
    if (!editingCall) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/calls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCall._id,
          callStatus: editStatus,
          technicianName: editTechnician,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingCall(null);
        invalidateCache('/api/calls');
        invalidateCache('/api/dashboard/stats');
        fetchDashboard();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CONTEXTUAL ROLE SCOPE BANNER */}
      <div className="bg-[#1e293b] border border-[#334155] p-5 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              {isSuperAdmin && <span>👑 Super Admin Master Analytics Center</span>}
              {isAdmin && <span>🏢 Operations Administration Dashboard</span>}
              {isClientUser && <span>🏢 {clientName || 'Client'} Enterprise Service Portal</span>}
              {isBranchUser && <span>📍 Branch Service Center {assignedBranch ? `(${assignedBranch})` : ''}</span>}
              {isZoneUser && <span>🌐 Zonal Management Dashboard {assignedZone ? `(${assignedZone} Zone)` : ''}</span>}
              {isFranchiseUser && <span>🏪 Franchise Partner Dashboard {franchiseName ? `(${franchiseName})` : ''}</span>}
              {isTechnician && <span>👷 Field Service Engineer Hub ({technicianName || currentUser?.fullName})</span>}
              {isHOD && <span>📊 Department Operational & SLA Performance</span>}
              {isCCO && <span>📞 Call Coordination & Intake Center</span>}
              {!isSuperAdmin && !isAdmin && !isClientUser && !isBranchUser && !isZoneUser && !isFranchiseUser && !isTechnician && !isHOD && !isCCO && (
                <span>{userRoleName} Dashboard</span>
              )}
            </h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isClientUser
              ? `Operational metrics and service tickets for ${clientName || 'your enterprise'} • Scope: Client Restricted`
              : `Personalized metrics & real-time operational feeds for ${currentUser?.fullName || 'User'} (${userRoleName})`}
          </p>
        </div>

        {/* Scope Indicators */}
        <div className="flex flex-wrap gap-2 text-xs">
          {clientName && (
            <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2.5 py-1 rounded-lg font-semibold">
              Client: <strong>{clientName}</strong>
            </span>
          )}
          {brandName && (
            <span className="bg-cyan-500/10 text-cyan-200 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
              Brand: <strong>{brandName}</strong>
            </span>
          )}
          {assignedZone && !clientName && (
            <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              Zone: <strong>{assignedZone}</strong>
            </span>
          )}
          {assignedBranch && !clientName && (
            <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Branch: <strong>{assignedBranch}</strong>
            </span>
          )}
          {franchiseName && (
            <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              Franchise: <strong>{franchiseName}</strong>
            </span>
          )}
          {technicianName && (
            <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Tech: <strong>{technicianName}</strong>
            </span>
          )}
        </div>
      </div>

      {/* SERVICE & CALL OPERATIONS WIDGETS */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          {isClientUser ? 'Client Service Complaint Overview' : 'Service Request Lifecycle & Call Operations'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-blue-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">OPEN CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.openCalls}</h3>
            <span className="text-xs text-blue-400 mt-2 inline-block">Requires immediate allotment</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-amber-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">APPOINTMENTS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.appointmentCalls}</h3>
            <span className="text-xs text-amber-400 mt-2 inline-block">Scheduled customer visits</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-emerald-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">ALLOTED CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.allotedCalls}</h3>
            <span className="text-xs text-emerald-400 mt-2 inline-block">Technician assigned / in-progress</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-purple-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">PART PENDING CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.partPendingCalls}</h3>
            <span className="text-xs text-purple-400 mt-2 inline-block">Awaiting spare parts supply</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-emerald-600 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">COMPLETED CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.completedCalls}</h3>
            <span className="text-xs text-emerald-400 mt-2 inline-block">Successful resolution</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-rose-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">CANCELLED CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.cancelCalls}</h3>
            <span className="text-xs text-rose-400 mt-2 inline-block">Closed without service</span>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-amber-600 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">REOPENED CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.reopenedCalls}</h3>
            <span className="text-xs text-amber-400 mt-2 inline-block">Recurred complaints</span>
          </div>
        </div>
      </div>

      {/* INTERNAL INFRASTRUCTURE & CAPACITY OVERVIEW (ONLY VISIBLE TO SUPER ADMIN, ADMIN, HOD, ZONE, BRANCH) */}
      {(isSuperAdmin || isAdmin || isHOD || isZoneUser || isBranchUser) && !isClientUser && (
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Infrastructure, Network & Resource Capacity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-rose-600 shadow-lg">
              <p className="text-slate-400 text-xs font-medium">CRITICAL PENDING CALLS</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.criticalPendingCalls}</h3>
              <span className="text-xs text-rose-400 mt-2 inline-block">&gt;15 Days Pending SLA breach</span>
            </div>

            <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-blue-400 shadow-lg">
              <p className="text-slate-400 text-xs font-medium">
                {isBranchUser ? 'BRANCH STATUS' : 'ACTIVE BRANCH HUBS'}
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {isBranchUser ? 'Operational' : stats.activeBranches}
              </h3>
              <span className="text-xs text-blue-400 mt-2 inline-block">
                {isBranchUser ? assignedBranch || 'Assigned Branch' : 'Regional primary nodes'}
              </span>
            </div>

            <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-indigo-400 shadow-lg">
              <p className="text-slate-400 text-xs font-medium">FRANCHISE CENTERS (ASC)</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.activeFranchises}</h3>
              <span className="text-xs text-indigo-400 mt-2 inline-block">Authorized partners</span>
            </div>

            <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-teal-400 shadow-lg">
              <p className="text-slate-400 text-xs font-medium">FIELD TECHNICIANS</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stats.activeTechnicians}</h3>
              <span className="text-xs text-teal-400 mt-2 inline-block">Certified field engineers</span>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME SERVICE REQUESTS FEED */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-[#334155] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white">
              {isClientUser ? `${clientName} Service Requests Feed` : 'Live Service Request Activity Feed'}
            </h3>
            <p className="text-xs text-slate-400">
              {isClientUser
                ? `Authorized tickets registered under client ${clientName || ''}`
                : 'Scoped to your organizational authorization & geography'}
            </p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-[#334155] font-mono">
            {recentCalls.length} Requests Found
          </span>
        </div>

        <div className="overflow-x-auto custom-horizontal-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading activity feed...</div>
          ) : recentCalls.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No service calls recorded for this organizational scope.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300 min-w-[900px]">
              <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                <tr>
                  <th className="p-3">Call No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Product / Brand</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Technician</th>
                  {!isClientUser && <th className="p-3 text-right">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                {recentCalls.slice(0, 15).map((call) => (
                  <tr key={call._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-emerald-400 font-mono font-bold">{call.callNo}</td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{call.customerName}</p>
                      <p className="text-slate-400 text-[10px] font-mono">{call.customerMobile}</p>
                    </td>
                    <td className="p-3 text-white">{call.city}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-200 block">{call.brandName}</span>
                      <span className="text-[10px] text-slate-400">{call.categoryName}</span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          call.callStatus === 'OPEN'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : call.callStatus === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : call.callStatus === 'ALLOTED'
                            ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                            : call.callStatus === 'PART_PENDING'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {call.callStatus}
                      </span>
                    </td>
                    <td className="p-3 text-indigo-300 font-medium">
                      {call.technicianName || <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    {!isClientUser && (
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenEdit(call)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                        >
                          Quick Status
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* QUICK STATUS EDIT MODAL */}
      {editingCall && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h4 className="text-sm font-bold text-white">
                Quick Update: <span className="font-mono text-emerald-400">#{editingCall.callNo}</span>
              </h4>
              <button onClick={() => setEditingCall(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
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
                <label className="block text-slate-400 mb-1">Assigned Technician</label>
                <input
                  type="text"
                  value={editTechnician}
                  onChange={(e) => setEditTechnician(e.target.value)}
                  placeholder="Technician name..."
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
              <button
                onClick={() => setEditingCall(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold"
              >
                {savingEdit ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

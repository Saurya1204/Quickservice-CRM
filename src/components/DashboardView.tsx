'use client';

import React, { useState, useEffect } from 'react';

interface DashboardViewProps {
  currentUser?: any;
}

export default function DashboardView({ currentUser }: DashboardViewProps) {
  const [stats, setStats] = useState<any>({
    openCalls: 3,
    appointmentCalls: 0,
    allotedCalls: 171,
    partPendingCalls: 14,
    completedCalls: 1280,
    cancelCalls: 22,
    reopenedCalls: 3,
    criticalPendingCalls: 151,
    activeBranches: 12,
    activeFranchises: 48,
    activeTechnicians: 320,
    sparesValuation: '₹ 42.5 L',
  });

  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCall, setEditingCall] = useState<any | null>(null);
  const [editStatus, setEditStatus] = useState('OPEN');
  const [editTechnician, setEditTechnician] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Determine user role and scope
  const roleCode = (currentUser?.roleCode || currentUser?.role || 'SUPER_ADMIN')
    .toUpperCase()
    .replace(/\s+/g, '_');
  const userRoleName = currentUser?.role || 'Super Admin';
  const assignedZone = currentUser?.assignedZone || '';
  const assignedBranch = currentUser?.assignedBranch || '';
  const assignedArea = currentUser?.assignedArea || '';

  const isSuperAdmin = roleCode === 'SUPER_ADMIN' || userRoleName === 'Super Admin';
  const isAdmin = roleCode === 'ADMIN' || userRoleName === 'Admin';
  const isHOD = roleCode === 'HOD';
  const isZSM = roleCode === 'ZSM';
  const isBSM = roleCode === 'BSM' || roleCode === 'BRANCH_MANAGER';
  const isASM = roleCode === 'ASM';
  const isCCO = roleCode === 'CCO';

  useEffect(() => {
    fetchDashboard();
  }, [currentUser]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleCode) params.set('role', roleCode);
      if (assignedZone) params.set('zone', assignedZone);
      if (assignedBranch) params.set('branch', assignedBranch);
      if (assignedArea) params.set('city', assignedArea);

      const [statsRes, callsRes] = await Promise.all([
        fetch(`/api/dashboard/stats?${params.toString()}`),
        fetch(`/api/calls?${params.toString()}`),
      ]);

      const statsJson = await statsRes.json();
      const callsJson = await callsRes.json();

      if (statsJson.success) {
        setStats(statsJson.stats);
      }
      if (callsJson.success) {
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
            <h2 className="text-lg font-bold text-white">
              {isSuperAdmin && '👑 Super Admin Master Analytics Center'}
              {isAdmin && '🏢 Operations Administration Dashboard'}
              {isHOD && '📊 Department Operational & SLA Performance'}
              {isZSM && `🌐 Zonal Management Dashboard ${assignedZone ? `(${assignedZone} Zone)` : ''}`}
              {isBSM && `📍 Branch Service Center ${assignedBranch ? `(${assignedBranch})` : ''}`}
              {isASM && `🗺️ Area Operations Hub ${assignedArea ? `(${assignedArea})` : ''}`}
              {isCCO && '📞 Call Coordination & Intake Center'}
              {!isSuperAdmin && !isAdmin && !isHOD && !isZSM && !isBSM && !isASM && !isCCO && `${userRoleName} Dashboard`}
            </h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalized metrics & real-time operational feeds for {currentUser?.fullName || 'User'} ({userRoleName})
          </p>
        </div>

        {/* Scope Indicators */}
        <div className="flex flex-wrap gap-2 text-xs">
          {assignedZone && (
            <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2.5 py-1 rounded-lg">
              Zone: <strong>{assignedZone}</strong>
            </span>
          )}
          {assignedBranch && (
            <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              Branch: <strong>{assignedBranch}</strong>
            </span>
          )}
          {assignedArea && (
            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-lg">
              Area: <strong>{assignedArea}</strong>
            </span>
          )}
        </div>
      </div>

      {/* SERVICE & CALL OPERATIONS WIDGETS */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Service Request Lifecycle & Call Operations
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

      {/* SYSTEM, NETWORK & CAPACITY OVERVIEW (FOR ADMIN, SUPER ADMIN, HOD, ZSM, BSM) */}
      {(isSuperAdmin || isAdmin || isHOD || isZSM || isBSM) && (
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
                {isBSM ? 'BRANCH STATUS' : 'ACTIVE BRANCH HUBS'}
              </p>
              <h3 className="text-2xl font-bold text-white mt-1">
                {isBSM ? 'Operational' : stats.activeBranches}
              </h3>
              <span className="text-xs text-blue-400 mt-2 inline-block">
                {isBSM ? assignedBranch || 'Assigned Branch' : 'Regional primary nodes'}
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
            <h3 className="text-sm font-bold text-white">Live Service Request Activity Feed</h3>
            <p className="text-xs text-slate-400">Scoped to your organizational authorization & geography</p>
          </div>
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-[#334155] font-mono">
            {recentCalls.length} Requests Found
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading activity feed...</div>
        ) : recentCalls.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No active service requests in your scope.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#334155]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                <tr>
                  <th className="p-3">Call No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Product</th>
                  <th className="p-3">Fault</th>
                  <th className="p-3">Technician</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60">
                {recentCalls.slice(0, 10).map((c) => (
                  <tr key={c._id} className="hover:bg-[#1e2a3e]/50 transition">
                    <td className="p-3 font-mono text-emerald-400 font-semibold">{c.callNo}</td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{c.customerName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{c.customerMobile}</p>
                    </td>
                    <td className="p-3">{c.city}</td>
                    <td className="p-3">
                      <p className="text-white font-medium">{c.brandName}</p>
                      <p className="text-[11px] text-slate-400">{c.categoryName}</p>
                    </td>
                    <td className="p-3 max-w-xs truncate" title={c.reportedFault}>{c.reportedFault}</td>
                    <td className="p-3">{c.technicianName || <span className="text-slate-500">—</span>}</td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
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
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 transition"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK EDIT MODAL */}
      {editingCall && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h4 className="text-xs font-bold text-white">Update Call #{editingCall.callNo}</h4>
              <button onClick={() => setEditingCall(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Call Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Assign Field Technician</label>
                <input
                  type="text"
                  placeholder="e.g. PRASHANT GUPTA"
                  value={editTechnician}
                  onChange={(e) => setEditTechnician(e.target.value)}
                  className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
              <button
                onClick={() => setEditingCall(null)}
                className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition font-medium disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

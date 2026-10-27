'use client';

import React, { useState, useEffect } from 'react';

export default function DashboardView() {
  const [stats, setStats] = useState<any>({
    openCalls: 3,
    appointmentCalls: 0,
    allotedCalls: 171,
    partPendingCalls: 14,
    completedCalls: 1280,
    cancelCalls: 22,
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

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [statsRes, callsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/calls'),
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

  return (
    <div className="space-y-6">
      {/* SERVICE & CALL OPERATIONS */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Service & Call Operations (Live Real-Time)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-blue-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">OPEN</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.openCalls}</h3>
            <span className="text-xs text-blue-400 mt-2 inline-block">Requires assignment</span>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-amber-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">APPOINTMENT</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.appointmentCalls}</h3>
            <span className="text-xs text-amber-400 mt-2 inline-block">Scheduled for today</span>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-emerald-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">ALLOTED</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.allotedCalls}</h3>
            <span className="text-xs text-emerald-400 mt-2 inline-block">In progress</span>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-purple-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">PART PENDING CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.partPendingCalls}</h3>
            <span className="text-xs text-purple-400 mt-2 inline-block">Awaiting spare parts</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-emerald-600 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">COMPLETED CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.completedCalls?.toLocaleString()}</h3>
            <span className="text-xs text-emerald-400 mt-2 inline-block">Successfully closed</span>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-rose-500 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">CANCEL CALLS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.cancelCalls}</h3>
            <span className="text-xs text-rose-400 mt-2 inline-block">Dropped / Cancelled</span>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl border-l-4 border-l-rose-700 shadow-lg">
            <p className="text-slate-400 text-xs font-medium">PENDING &gt;= 15 DAYS</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stats.criticalPendingCalls}</h3>
            <span className="text-xs text-rose-400 mt-2 inline-block">Critical backlog</span>
          </div>
        </div>
      </div>

      {/* NETWORK & RESOURCE MANAGEMENT */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Network & Resource Management
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl shadow-lg">
            <p className="text-slate-400 text-xs font-medium">ACTIVE BRANCHES</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats.activeBranches}</h3>
            <p className="text-xs text-slate-500 mt-1">Regional hubs active</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl shadow-lg">
            <p className="text-slate-400 text-xs font-medium">FRANCHISES / ASCs</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats.activeFranchises}</h3>
            <p className="text-xs text-slate-500 mt-1">Expansion partners</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl shadow-lg">
            <p className="text-slate-400 text-xs font-medium">REGISTERED TECHNICIANS</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats.activeTechnicians}</h3>
            <p className="text-xs text-slate-500 mt-1">Field force available</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl shadow-lg">
            <p className="text-slate-400 text-xs font-medium">SPARES INVENTORY VALUATION</p>
            <h3 className="text-xl font-bold text-white mt-1">{stats.sparesValuation}</h3>
            <p className="text-xs text-slate-500 mt-1">Stock status tracked</p>
          </div>
        </div>
      </div>

      {/* LIVE REGISTERED SERVICE CALLS */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-[#334155] pb-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>Recent Active Service Calls</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Operations
            </span>
          </h2>
          <button
            onClick={fetchDashboard}
            className="text-xs text-slate-300 hover:text-white bg-slate-800 px-3 py-1.5 rounded border border-slate-700"
          >
            ↻ Refresh Stats
          </button>
        </div>

        {/* Quick Edit Call Modal */}
        {editingCall && (
          <div className="bg-[#172033] border border-blue-500/30 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Quick Edit Call #{editingCall.callNo} - {editingCall.customerName}
              </h4>
              <button
                onClick={() => setEditingCall(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕ Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Technician</label>
                <input
                  type="text"
                  placeholder="Technician name"
                  value={editTechnician}
                  onChange={(e) => setEditTechnician(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => setEditingCall(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-3 py-1.5 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-1.5 rounded font-medium shadow"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading live operations data...</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="p-3">Call No</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Brand & Category</th>
                  <th className="p-3">Reported Fault</th>
                  <th className="p-3">Technician</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {recentCalls.map((call) => (
                  <tr key={call._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-emerald-400 font-mono text-xs">{call.callNo}</td>
                    <td className="p-3">
                      <p className="font-semibold text-white">{call.customerName}</p>
                      <p className="text-xs text-slate-400">{call.customerMobile}</p>
                    </td>
                    <td className="p-3 text-slate-300 text-xs">{call.city}</td>
                    <td className="p-3">
                      <span className="text-white text-xs font-medium">{call.brandName}</span>
                      <p className="text-[11px] text-slate-400">{call.categoryName}</p>
                    </td>
                    <td className="p-3 text-slate-300 text-xs max-w-xs truncate">{call.reportedFault}</td>
                    <td className="p-3 text-slate-300 text-xs">{call.technicianName || '— (Unassigned)'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs border font-medium ${
                          call.callStatus === 'OPEN'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : call.callStatus === 'ALLOTED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : call.callStatus === 'PART_PENDING'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {call.callStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenEdit(call)}
                        className="text-xs px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-medium rounded border border-blue-500/30"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

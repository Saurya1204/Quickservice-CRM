'use client';

import React, { useState, useEffect } from 'react';

export default function ReportsView() {
  const [reportType, setReportType] = useState('Call Operations Summary');
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-10-23');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any[] | null>(null);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setEditMode(false);
    try {
      const res = await fetch('/api/calls');
      const json = await res.json();
      const records = json.data || [];

      // Calculate live dynamic metrics from MongoDB
      const total = records.length;
      const open = records.filter((r: any) => r.callStatus === 'OPEN').length;
      const completed = records.filter((r: any) => r.callStatus === 'COMPLETED').length;
      const appointment = records.filter((r: any) => r.callStatus === 'APPOINTMENT').length;

      setMetrics({ total, open, completed, appointment });
      setReportData(records);
    } catch (e: any) {
      alert('Error fetching report: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = ['callNo', 'customerName', 'customerMobile', 'city', 'brandName', 'categoryName', 'callStatus', 'technicianName'];
    let csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';

    reportData.forEach((row: any) => {
      const line = headers.map((h) => {
        let val = row[h] ?? '';
        if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
        return val;
      });
      csvContent += line.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType.replace(/\s+/g, '_')}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-6 shadow-xl">
        <div className="border-b border-[#334155] pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Operations & Service Reports</h2>
            <p className="text-xs text-slate-400 mt-1">
              Generate comprehensive service, workforce performance and billing reports from live database
            </p>
          </div>
          {reportData && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded text-xs transition font-medium"
            >
              {editMode ? 'Hide Filters' : 'Edit Report Filters'}
            </button>
          )}
        </div>

        {/* Filter inputs (editable) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-[#172033] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option>Call Operations Summary</option>
              <option>Technician Productivity Report</option>
              <option>ASC / Franchise Performance</option>
              <option>Spares Consumption & Valuation</option>
              <option>SLA Breached Calls (&gt;15 Days)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-[#172033] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-[#172033] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end space-x-3">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-6 py-2.5 rounded-lg font-semibold shadow-lg transition"
          >
            {generating ? 'Processing Live Data...' : '📊 Generate Report'}
          </button>
          {reportData && (
            <button
              onClick={handleExportCSV}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-6 py-2.5 rounded-lg font-semibold shadow-lg transition"
            >
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl">
            <span className="text-xs text-slate-400 uppercase font-medium">Total Processed Calls</span>
            <p className="text-2xl font-bold text-white mt-1">{metrics.total}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl">
            <span className="text-xs text-blue-400 uppercase font-medium">Active / Open</span>
            <p className="text-2xl font-bold text-blue-400 mt-1">{metrics.open}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl">
            <span className="text-xs text-amber-400 uppercase font-medium">In Appointment</span>
            <p className="text-2xl font-bold text-amber-400 mt-1">{metrics.appointment}</p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] p-4 rounded-xl">
            <span className="text-xs text-emerald-400 uppercase font-medium">Completed Calls</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{metrics.completed}</p>
          </div>
        </div>
      )}

      {reportData && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Generated Report Preview ({reportData.length} records)</h3>
            <span className="text-xs text-slate-400">Date Range: {fromDate} to {toDate}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] border-b border-[#334155]">
                <tr>
                  <th className="p-2.5">Call No</th>
                  <th className="p-2.5">Customer</th>
                  <th className="p-2.5">Mobile</th>
                  <th className="p-2.5">City</th>
                  <th className="p-2.5">Brand</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Technician</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {reportData.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-emerald-400 font-semibold">{r.callNo}</td>
                    <td className="p-2.5 text-white">{r.customerName}</td>
                    <td className="p-2.5 font-mono">{r.customerMobile}</td>
                    <td className="p-2.5">{r.city}</td>
                    <td className="p-2.5">{r.brandName}</td>
                    <td className="p-2.5">{r.categoryName}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">
                        {r.callStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-400">{r.technicianName || 'Unassigned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

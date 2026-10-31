'use client';

import React, { useState } from 'react';

interface ReportMeta {
  key: string;
  label: string;
  section: 'Pending' | 'Other';
  description: string;
}

const REPORT_DEFINITIONS: ReportMeta[] = [
  // 1. Pending Section (2 buttons)
  {
    key: 'pendingOpenCalls',
    label: 'Pending Open Call',
    section: 'Pending',
    description: 'All currently open & active calls excluding completed/cancelled',
  },
  {
    key: 'pendingForParts',
    label: 'Pending For Part',
    section: 'Pending',
    description: 'Service calls waiting for required spare parts with procurement status',
  },

  // 2. Other Section (10 buttons)
  {
    key: 'registeredCalls',
    label: 'Register Call',
    section: 'Other',
    description: 'All service calls registered within selected date range',
  },
  {
    key: 'completedCalls',
    label: 'Completed Call',
    section: 'Other',
    description: 'Successfully completed service calls with parts used & remarks',
  },
  {
    key: 'allPartDemanded',
    label: 'All Part Demanded',
    section: 'Other',
    description: 'All spare parts demanded against calls with approval & issued quantities',
  },
  {
    key: 'partConsumption',
    label: 'Part Consumption',
    section: 'Other',
    description: 'Inventory consumption transactions during service operations',
  },
  {
    key: 'poRaised',
    label: 'PO Raised Report',
    section: 'Other',
    description: 'Purchase orders raised with vendor, spares & financial totals',
  },
  {
    key: 'replacementCalls',
    label: 'Replacement Call Report',
    section: 'Other',
    description: 'Service calls involving product or module replacement',
  },
  {
    key: 'cancelledCalls',
    label: 'Cancel Call Report',
    section: 'Other',
    description: 'Cancelled service calls with reasons and authorized staff',
  },
  {
    key: 'writaxProducts',
    label: 'Writax Product Report',
    section: 'Other',
    description: 'Writax product lines and corresponding service transactions',
  },
  {
    key: 'defectiveToReturn',
    label: 'Defective to Be Return',
    section: 'Other',
    description: 'Defective spare parts/products pending return to vendors',
  },
  {
    key: 'sfStock',
    label: 'SF Stock Report',
    section: 'Other',
    description: 'SF inventory balances (available, reserved, issued) across hubs',
  },
];

export default function ReportsView() {
  const [activeReportKey, setActiveReportKey] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('2026-10-01');
  const [toDate, setToDate] = useState<string>('2026-10-31');
  const [loading, setLoading] = useState<boolean>(false);
  const [reportResult, setReportResult] = useState<{
    title: string;
    section: string;
    dateRange: { from: string; to: string };
    totalCount: number;
    columns: Array<{ key: string; label: string }>;
    data: any[];
  } | null>(null);

  // Table filtering & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleGenerateReport = async (reportKey: string) => {
    setActiveReportKey(reportKey);
    setLoading(true);
    setSearchTerm('');
    setCurrentPage(1);

    try {
      const url = `/api/reports?type=${reportKey}&from=${fromDate}&to=${toDate}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setReportResult(json.data);
      } else {
        alert(`Error generating report: ${json.message}`);
      }
    } catch (e: any) {
      alert(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFromDate('2026-10-01');
    setToDate('2026-10-31');
    setSearchTerm('');
  };

  const handleExportExcel = () => {
    if (!activeReportKey) return;
    const url = `/api/reports/export?type=${activeReportKey}&from=${fromDate}&to=${toDate}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Filtered rows based on search
  const filteredData = (reportResult?.data || []).filter((row) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some((val) =>
      String(val || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Page Title Header matching legacy Reports.aspx: ALL REPORTS */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📊</span>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide uppercase">
                ALL REPORTS
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized reporting suite with dynamic date filtering & complete master relationships
              </p>
            </div>
          </div>
          {reportResult && (
            <button
              onClick={() => {
                setReportResult(null);
                setActiveReportKey(null);
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded transition"
            >
              ← Back to Report Menu
            </button>
          )}
        </div>

        {/* SECTION 1: PENDING SECTION (2 Blue Buttons) */}
        <div className="p-6 border-b border-[#334155]/60 bg-[#0f172a]/40 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
              1. Pending Section
            </span>
            <span className="text-[11px] text-slate-400">
              (Live pending calls and critical spare part bottlenecks)
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            {REPORT_DEFINITIONS.filter((r) => r.section === 'Pending').map((btn) => (
              <button
                key={btn.key}
                onClick={() => handleGenerateReport(btn.key)}
                disabled={loading}
                className={`text-xs font-bold px-6 py-3 rounded-lg shadow-md transition flex items-center space-x-2 ${
                  activeReportKey === btn.key
                    ? 'bg-[#0056b3] text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                    : 'bg-[#007bff] hover:bg-[#0069d9] text-white'
                }`}
              >
                <span>{loading && activeReportKey === btn.key ? '⌛ Generating...' : btn.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* SECTION 2: OTHER SECTION (Date Filters + 10 Blue Buttons) */}
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-400">
              2. Other Section
            </span>
            <span className="text-[11px] text-slate-400">
              (Transaction & operational reports with configurable date range)
            </span>
          </div>

          {/* Date Range Pickers: From & To */}
          <div className="bg-[#172033] p-4 rounded-xl border border-[#334155] flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-300">From:</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-300">To:</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={handleResetFilters}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              Clear / Reset Filter
            </button>

            <span className="text-[11px] text-slate-400 ml-auto italic">
              Select date range and click any report button below
            </span>
          </div>

          {/* 10 Blue Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {REPORT_DEFINITIONS.filter((r) => r.section === 'Other').map((btn) => (
              <button
                key={btn.key}
                onClick={() => handleGenerateReport(btn.key)}
                disabled={loading}
                title={btn.description}
                className={`text-xs font-bold p-3 rounded-lg shadow-md transition text-center flex flex-col items-center justify-center min-h-[58px] ${
                  activeReportKey === btn.key
                    ? 'bg-[#0056b3] text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900'
                    : 'bg-[#007bff] hover:bg-[#0069d9] text-white'
                }`}
              >
                <span>{loading && activeReportKey === btn.key ? '⌛ Generating...' : btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DEDICATED REPORT RESULTS VIEW */}
      {reportResult && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden p-6 space-y-6">
          {/* Header Strip with Controls */}
          <div className="border-b border-[#334155] pb-4 flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-base font-bold text-white uppercase">{reportResult.title}</h2>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {reportResult.totalCount} Records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Active Date Range: <strong className="text-slate-200">{fromDate}</strong> to{' '}
                <strong className="text-slate-200">{toDate}</strong>
              </p>
            </div>

            {/* Action Buttons: Excel Export & Print */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 shadow transition flex items-center space-x-1.5"
              >
                <span>🖨️</span>
                <span>Print Report</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2 rounded-lg shadow-lg transition flex items-center space-x-1.5"
              >
                <span>📥</span>
                <span>Download Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Search filter & Page size selector */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-[#0f172a] border border-[#334155] rounded px-2 py-1 text-xs text-white"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>rows per page</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="border border-[#334155] rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              {paginatedData.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <div className="text-3xl text-slate-500">📋</div>
                  <h4 className="text-sm font-semibold text-white">No records found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    No matching database records found for {reportResult.title} within the selected date range ({fromDate} to {toDate}).
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#172033] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#334155] sticky top-0 z-10">
                    <tr>
                      <th className="p-3">#</th>
                      {reportResult.columns.map((col) => (
                        <th key={col.key} className="p-3 whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {paginatedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-3 text-slate-500 font-mono">
                          {(currentPage - 1) * pageSize + idx + 1}
                        </td>
                        {reportResult.columns.map((col) => {
                          const val = row[col.key];
                          // Highlight status or call numbers
                          if (col.key === 'callNo' || col.key === 'poNumber' || col.key === 'returnReference' || col.key === 'consumptionId') {
                            return (
                              <td key={col.key} className="p-3 font-mono text-emerald-400 font-bold whitespace-nowrap">
                                {val}
                              </td>
                            );
                          }
                          if (col.key === 'callStatus' || col.key === 'poStatus' || col.key === 'demandStatus' || col.key === 'returnStatus') {
                            return (
                              <td key={col.key} className="p-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    val === 'COMPLETED' || val === 'Approved' || val === 'Delivered'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                      : val === 'CANCEL' || val === 'Rejected'
                                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                  }`}
                                >
                                  {val}
                                </span>
                              </td>
                            );
                          }
                          return (
                            <td key={col.key} className="p-3 whitespace-nowrap text-slate-200">
                              {val !== undefined && val !== null && val !== '' ? val : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {filteredData.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#334155]">
              <span className="text-xs text-slate-400">
                Showing{' '}
                <strong className="text-white">
                  {(currentPage - 1) * pageSize + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-white">
                  {Math.min(currentPage * pageSize, filteredData.length)}
                </strong>{' '}
                of <strong className="text-white">{filteredData.length}</strong> matching records
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded border border-slate-700"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-300 px-2 font-mono">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs px-3 py-1.5 rounded border border-slate-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

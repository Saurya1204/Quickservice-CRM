'use client';

import React, { useState, useEffect } from 'react';

interface CallFeedbackAdminModuleProps {
  currentUser?: any;
  onOpenComplaintView?: (complaintNo: string) => void;
}

const EXPERIENCE_OPTIONS = ['Select', 'Poor', 'Average', 'Good', 'Very Good', 'Excellent'];
const YES_NO_OPTIONS = ['Select', 'Yes', 'No'];

export default function CallFeedbackAdminModule({
  currentUser,
  onOpenComplaintView,
}: CallFeedbackAdminModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'record' | 'reports'>('list');

  // List State
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    complaintNo: '',
    customerName: '',
    mobile: '',
    engineerName: '',
    product: '',
    overallExperience: 'ALL',
    status: 'ALL',
    startDate: '',
    endDate: '',
  });

  // Modals
  const [viewModalFeedback, setViewModalFeedback] = useState<any | null>(null);
  const [reopenModalFeedback, setReopenModalFeedback] = useState<any | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [reopeningSaving, setReopeningSaving] = useState(false);

  // Share Link Modal
  const [shareModalData, setShareModalData] = useState<any | null>(null);
  const [generatingShare, setGeneratingShare] = useState(false);

  // Record Feedback (Live Call Centre Mode)
  const [callSearchQuery, setCallSearchQuery] = useState('');
  const [searchedCall, setSearchedCall] = useState<any | null>(null);
  const [searchingCall, setSearchingCall] = useState(false);
  const [recordingSaving, setRecordingSaving] = useState(false);
  const [recordFormData, setRecordFormData] = useState({
    appointmentVisitRating: 'Select',
    resolutionOnTime: 'Select',
    productServiceSatisfaction: 'Select',
    engineerAttitudeRating: 'Select',
    engineerKnowledgeRating: 'Select',
    workSatisfaction: 'Select',
    engineerTimeRating: 'Select',
    productDemonstration: 'Select',
    amountCollected: 'Select',
    receiptProvided: 'Not Applicable',
    dissatisfactionReason: '',
    callCentreExperience: 'Select',
    overallExperience: 'Select',
  });

  // Reports State
  const [reportsData, setReportsData] = useState<any | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'list') {
      fetchFeedbacks();
    } else if (activeSubTab === 'reports') {
      fetchReports();
    }
  }, [activeSubTab]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filters.search) q.set('search', filters.search);
      if (filters.complaintNo) q.set('complaintNo', filters.complaintNo);
      if (filters.customerName) q.set('customerName', filters.customerName);
      if (filters.mobile) q.set('mobile', filters.mobile);
      if (filters.engineerName) q.set('engineerName', filters.engineerName);
      if (filters.product) q.set('product', filters.product);
      if (filters.overallExperience !== 'ALL') q.set('overallExperience', filters.overallExperience);
      if (filters.status !== 'ALL') q.set('status', filters.status);
      if (filters.startDate) q.set('startDate', filters.startDate);
      if (filters.endDate) q.set('endDate', filters.endDate);

      const res = await fetch(`/api/admin/feedback?${q.toString()}`);
      const json = await res.json();
      if (json.success) {
        setFeedbacks(json.data || []);
        setTotalCount(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await fetch('/api/admin/feedback/reports');
      const json = await res.json();
      if (json.success) {
        setReportsData(json.data);
      }
    } catch (err) {
      console.error('Error fetching feedback reports:', err);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedbacks();
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      complaintNo: '',
      customerName: '',
      mobile: '',
      engineerName: '',
      product: '',
      overallExperience: 'ALL',
      status: 'ALL',
      startDate: '',
      endDate: '',
    });
    setTimeout(() => {
      fetchFeedbacks();
    }, 50);
  };

  // Reopen Feedback Handler
  const handleExecuteReopen = async () => {
    if (!reopenModalFeedback) return;
    if (!reopenReason.trim()) {
      alert('Reopening Reason is mandatory.');
      return;
    }
    setReopeningSaving(true);
    try {
      const res = await fetch(`/api/admin/feedback/${reopenModalFeedback._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REOPENED',
          reason: reopenReason.trim(),
          reopenedBy: currentUser?.fullName || currentUser?.name || 'Administrator',
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setReopenModalFeedback(null);
        setReopenReason('');
        fetchFeedbacks();
      } else {
        alert(json.message || 'Failed to reopen feedback.');
      }
    } catch (err: any) {
      alert(err.message || 'Error reopening feedback.');
    } finally {
      setReopeningSaving(false);
    }
  };

  // Share Link Handler
  const handleGenerateShareLink = async (callId: string, complaintNo: string) => {
    setGeneratingShare(true);
    try {
      const res = await fetch('/api/feedback/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId, complaintNo }),
      });
      const json = await res.json();
      if (json.success) {
        setShareModalData(json.data);
      } else {
        alert(json.message || 'Failed to generate link.');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating link.');
    } finally {
      setGeneratingShare(false);
    }
  };

  // Live Call Search Handler
  const handleSearchLiveCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callSearchQuery.trim()) return;
    setSearchingCall(true);
    setSearchedCall(null);
    try {
      const res = await fetch(`/api/calls?complaintNo=${encodeURIComponent(callSearchQuery.trim())}`);
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setSearchedCall(json.data[0]);
      } else {
        alert('No service call found matching: ' + callSearchQuery);
      }
    } catch (err: any) {
      alert(err.message || 'Error searching service call.');
    } finally {
      setSearchingCall(false);
    }
  };

  // Submit Live Call Feedback
  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedCall) return;

    if (recordFormData.appointmentVisitRating === 'Select') {
      alert('Please answer Question 1: Engineer Visit as per Scheduled Appointment.');
      return;
    }
    if (recordFormData.productServiceSatisfaction === 'Select') {
      alert('Please answer Question 3: Product Service / Installation.');
      return;
    }
    if (recordFormData.overallExperience === 'Select') {
      alert('Please answer Question 13: Overall Experience.');
      return;
    }

    setRecordingSaving(true);
    try {
      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId: searchedCall._id,
          complaintNo: searchedCall.callNo,
          ...recordFormData,
          submittedBy: 'Call Centre',
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert('Customer feedback recorded and saved to call history successfully!');
        setSearchedCall(null);
        setCallSearchQuery('');
        setRecordFormData({
          appointmentVisitRating: 'Select',
          resolutionOnTime: 'Select',
          productServiceSatisfaction: 'Select',
          engineerAttitudeRating: 'Select',
          engineerKnowledgeRating: 'Select',
          workSatisfaction: 'Select',
          engineerTimeRating: 'Select',
          productDemonstration: 'Select',
          amountCollected: 'Select',
          receiptProvided: 'Not Applicable',
          dissatisfactionReason: '',
          callCentreExperience: 'Select',
          overallExperience: 'Select',
        });
        setActiveSubTab('list');
        fetchFeedbacks();
      } else {
        alert(json.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      alert(err.message || 'Error recording feedback.');
    } finally {
      setRecordingSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* MODULE HEADER & MODE SWITCHER */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>⭐ Customer Call Feedback Management</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
              {totalCount} Total Submissions
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Track customer ratings, review all 13 feedback questions, evaluate engineer performance, and manage feedback links.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 shadow ${
              activeSubTab === 'list'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>📋 All Feedbacks ({totalCount})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('record')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 shadow ${
              activeSubTab === 'record'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>📞 Record Live Feedback</span>
          </button>
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 shadow ${
              activeSubTab === 'reports'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>📊 Feedback Reports & Analytics</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ALL CUSTOMER FEEDBACKS LIST */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 shadow-lg space-y-3">
            <form onSubmit={handleFilterSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Complaint No</label>
                  <input
                    type="text"
                    placeholder="e.g. 261101UPQS0001"
                    value={filters.complaintNo}
                    onChange={(e) => setFilters({ ...filters, complaintNo: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={filters.customerName}
                    onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Mobile</label>
                  <input
                    type="text"
                    placeholder="Search mobile..."
                    value={filters.mobile}
                    onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Engineer Name</label>
                  <input
                    type="text"
                    placeholder="Search engineer..."
                    value={filters.engineerName}
                    onChange={(e) => setFilters({ ...filters, engineerName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Overall Experience</label>
                  <select
                    value={filters.overallExperience}
                    onChange={(e) => setFilters({ ...filters, overallExperience: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">ALL RATINGS</option>
                    <option value="Excellent">Excellent (5★)</option>
                    <option value="Very Good">Very Good (4★)</option>
                    <option value="Good">Good (3★)</option>
                    <option value="Average">Average (2★)</option>
                    <option value="Poor">Poor (1★)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#334155]/60">
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center space-x-1 shadow"
                  >
                    <span>🔍 Apply Filters</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition"
                  >
                    Clear Filters
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setTimeout(() => fetchFeedbacks(), 50);
                    }}
                    className="bg-[#0f172a] border border-[#334155] rounded px-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">ALL STATUSES</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REOPENED">REOPENED</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* TABLE */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto custom-horizontal-scrollbar">
              {loading ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <div className="animate-spin text-2xl mb-2">⏳</div>
                  Loading feedback records...
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No feedback submissions found matching the query.
                </div>
              ) : (
                <table className="w-full text-left text-xs text-slate-300 min-w-[1100px]">
                  <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                    <tr>
                      <th className="p-3 whitespace-nowrap">Sr. No.</th>
                      <th className="p-3 whitespace-nowrap">Complaint Number</th>
                      <th className="p-3 whitespace-nowrap">Customer Name</th>
                      <th className="p-3 whitespace-nowrap">Mobile Number</th>
                      <th className="p-3 whitespace-nowrap">Product</th>
                      <th className="p-3 whitespace-nowrap">Engineer Name</th>
                      <th className="p-3 whitespace-nowrap">Visit Date</th>
                      <th className="p-3 whitespace-nowrap">Overall Experience</th>
                      <th className="p-3 whitespace-nowrap">Submission Date</th>
                      <th className="p-3 whitespace-nowrap">Status</th>
                      <th className="p-3 whitespace-nowrap text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                    {feedbacks.map((fb, idx) => {
                      const isPositive =
                        fb.overallExperience === 'Good' ||
                        fb.overallExperience === 'Very Good' ||
                        fb.overallExperience === 'Excellent';
                      const isNegative =
                        fb.overallExperience === 'Poor' || fb.overallExperience === 'Average';

                      return (
                        <tr key={fb._id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            {onOpenComplaintView ? (
                              <button
                                onClick={() => onOpenComplaintView(fb.complaintNo)}
                                className="hover:underline text-left"
                                title="View full 11-section complaint view"
                              >
                                {fb.complaintNo}
                              </button>
                            ) : (
                              fb.complaintNo
                            )}
                          </td>
                          <td className="p-3 font-medium text-white">{fb.customerName}</td>
                          <td className="p-3 font-mono text-slate-300">{fb.customerMobile}</td>
                          <td className="p-3">
                            <span className="text-white block">{fb.brandName || '—'}</span>
                            <span className="text-[10px] text-slate-400">{fb.categoryName}</span>
                          </td>
                          <td className="p-3 text-indigo-300 font-medium">{fb.engineerName || '—'}</td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {fb.visitDate ? new Date(fb.visitDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3">
                            {fb.overallExperience ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                                  isPositive
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                    : isNegative
                                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}
                              >
                                {fb.overallExperience === 'Excellent' && '⭐⭐⭐⭐⭐ '}
                                {fb.overallExperience === 'Very Good' && '⭐⭐⭐⭐ '}
                                {fb.overallExperience === 'Good' && '⭐⭐⭐ '}
                                {fb.overallExperience === 'Average' && '⭐⭐ '}
                                {fb.overallExperience === 'Poor' && '⭐ '}
                                {fb.overallExperience}
                              </span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">Pending</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                fb.feedbackStatus === 'SUBMITTED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : fb.feedbackStatus === 'REOPENED'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              }`}
                            >
                              {fb.feedbackStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => setViewModalFeedback(fb)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold transition"
                                title="View all 13 questions with answers"
                              >
                                👁️ View Details
                              </button>
                              <button
                                type="button"
                                onClick={() => handleGenerateShareLink(fb.callId, fb.complaintNo)}
                                className="px-2 py-1 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded text-[11px] font-medium transition border border-emerald-500/20"
                                title="Copy or Share Feedback Link via WhatsApp"
                              >
                                🔗 Share
                              </button>
                              {fb.feedbackStatus === 'SUBMITTED' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReopenModalFeedback(fb);
                                    setReopenReason('');
                                  }}
                                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-[11px] font-medium transition border border-amber-500/30"
                                  title="Reopen feedback for customer re-submission"
                                >
                                  🔓 Reopen
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

      {/* TAB 2: RECORD LIVE FEEDBACK (CALL CENTRE / EXECUTIVE OVER THE PHONE) */}
      {activeSubTab === 'record' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl space-y-6">
          <div className="border-b border-[#334155] pb-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>📞 Live Customer Feedback Capture (Call Centre / Executive Mode)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Search any active or completed service call to record customer feedback over the telephone directly into the CRM database.
            </p>
          </div>

          <form onSubmit={handleSearchLiveCall} className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <input
              type="text"
              placeholder="Enter Complaint Number (e.g. 261101UPQS0001)..."
              value={callSearchQuery}
              onChange={(e) => setCallSearchQuery(e.target.value)}
              className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="submit"
              disabled={searchingCall}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow"
            >
              {searchingCall ? 'Searching...' : '🔍 Load Service Call'}
            </button>
          </form>

          {searchedCall && (
            <div className="space-y-6 pt-4 border-t border-[#334155]">
              {/* Snapshot Banner */}
              <div className="bg-[#172033] border border-[#334155] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Complaint No</span>
                  <span className="text-emerald-400 font-bold font-mono text-sm">#{searchedCall.callNo}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Customer</span>
                  <span className="text-white font-medium">{searchedCall.customerName} ({searchedCall.customerMobile})</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Product</span>
                  <span className="text-slate-200">{searchedCall.brandName} - {searchedCall.categoryName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-semibold">Technician</span>
                  <span className="text-indigo-300 font-medium">{searchedCall.technicianName || 'Unassigned'}</span>
                </div>
              </div>

              {/* EXACT 13-QUESTION TWO-COLUMN FORM */}
              <form onSubmit={handleRecordSubmit} className="space-y-6 bg-[#111c2e] p-6 rounded-xl border border-[#1e293b]">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-700 pb-2">
                  Feedback Details (13 Fields)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  {/* LEFT */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        1. Engineer Visit as per Scheduled Appointment *
                      </label>
                      <select
                        value={recordFormData.appointmentVisitRating}
                        onChange={(e) => setRecordFormData({ ...recordFormData, appointmentVisitRating: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {YES_NO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        3. Are you satisfied with Product Service / Installation *
                      </label>
                      <select
                        value={recordFormData.productServiceSatisfaction}
                        onChange={(e) => setRecordFormData({ ...recordFormData, productServiceSatisfaction: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        5. Engineer - Knowledge or Skill of product/repair *
                      </label>
                      <select
                        value={recordFormData.engineerKnowledgeRating}
                        onChange={(e) => setRecordFormData({ ...recordFormData, engineerKnowledgeRating: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        7. Is he given you proper time *
                      </label>
                      <select
                        value={recordFormData.engineerTimeRating}
                        onChange={(e) => setRecordFormData({ ...recordFormData, engineerTimeRating: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {YES_NO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        9. Is he Collected Any Amount from You *
                      </label>
                      <select
                        value={recordFormData.amountCollected}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecordFormData((prev) => ({
                            ...prev,
                            amountCollected: val,
                            receiptProvided: val === 'Yes' ? 'Select' : 'Not Applicable',
                          }));
                        }}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {YES_NO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        11. Reason behind Desatisfaction ? (Conditionally Mandatory)
                      </label>
                      <textarea
                        rows={3}
                        value={recordFormData.dissatisfactionReason}
                        onChange={(e) => setRecordFormData({ ...recordFormData, dissatisfactionReason: e.target.value })}
                        placeholder="Please tell us why you are dissatisfied with our service."
                        className="w-full bg-[#0f172a] border border-[#334155] rounded p-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        13. Overall experience *
                      </label>
                      <select
                        value={recordFormData.overallExperience}
                        onChange={(e) => setRecordFormData({ ...recordFormData, overallExperience: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white font-bold"
                      >
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        2. Are you get resolution on time *
                      </label>
                      <select
                        value={recordFormData.resolutionOnTime}
                        onChange={(e) => setRecordFormData({ ...recordFormData, resolutionOnTime: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {YES_NO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        4. Engineer - Attitude/Behavior/Attentiveness/Grooming *
                      </label>
                      <select
                        value={recordFormData.engineerAttitudeRating}
                        onChange={(e) => setRecordFormData({ ...recordFormData, engineerAttitudeRating: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        6. Is he Complete work as per your Satisfaction *
                      </label>
                      <select
                        value={recordFormData.workSatisfaction}
                        onChange={(e) => setRecordFormData({ ...recordFormData, workSatisfaction: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        8. Is he Demonstrate you properly about Product *
                      </label>
                      <select
                        value={recordFormData.productDemonstration}
                        onChange={(e) => setRecordFormData({ ...recordFormData, productDemonstration: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {YES_NO_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        10. Is he given you Receipt of Collected Amount
                      </label>
                      {recordFormData.amountCollected === 'Yes' ? (
                        <select
                          value={recordFormData.receiptProvided}
                          onChange={(e) => setRecordFormData({ ...recordFormData, receiptProvided: e.target.value as any })}
                          className="w-full bg-[#0f172a] border border-emerald-500 rounded px-3 py-1.5 text-xs text-white"
                        >
                          {YES_NO_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          disabled
                          value="Not Applicable (No amount collected)"
                          className="w-full bg-[#0f172a]/60 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-400"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-200 mb-1">
                        12. Call Centre Interaction experience *
                      </label>
                      <select
                        value={recordFormData.callCentreExperience}
                        onChange={(e) => setRecordFormData({ ...recordFormData, callCentreExperience: e.target.value })}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-xs text-white"
                      >
                        {EXPERIENCE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setSearchedCall(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recordingSaving}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold shadow"
                  >
                    {recordingSaving ? 'Saving Feedback...' : 'Save Live Customer Feedback'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FEEDBACK REPORTS & ANALYTICS */}
      {activeSubTab === 'reports' && (
        <div className="space-y-6">
          {reportsLoading || !reportsData ? (
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center text-slate-400 text-xs shadow-xl">
              <div className="animate-spin text-2xl mb-2">⏳</div>
              Computing feedback metrics and engineer performance analytics...
            </div>
          ) : (
            <div className="space-y-6">
              {/* TOP CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 shadow-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Feedbacks
                  </span>
                  <p className="text-2xl font-bold text-white mt-1 font-mono">{reportsData.totalSubmitted}</p>
                  <span className="text-[11px] text-emerald-400 mt-1 block">Verified customer submissions</span>
                </div>

                <div className="bg-[#1e293b] border border-emerald-500/30 rounded-xl p-4 shadow-lg">
                  <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider block">
                    Positive Feedback Rate
                  </span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{reportsData.positivePercentage}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {reportsData.positiveCount} of {reportsData.totalSubmitted} (Good / Excellent)
                  </span>
                </div>

                <div className="bg-[#1e293b] border border-rose-500/30 rounded-xl p-4 shadow-lg">
                  <span className="text-[10px] font-semibold text-rose-300 uppercase tracking-wider block">
                    Negative / Dissatisfaction
                  </span>
                  <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">{reportsData.negativePercentage}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {reportsData.negativeCount} tickets requiring QA review
                  </span>
                </div>

                <div className="bg-[#1e293b] border border-amber-500/30 rounded-xl p-4 shadow-lg">
                  <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider block">
                    Average Overall Experience
                  </span>
                  <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">{reportsData.avgOverallScore} / 5.0</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    On-time resolution: {reportsData.resolutionOnTimeRate}
                  </span>
                </div>
              </div>

              {/* RATING DISTRIBUTION & METRICS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Rating Distribution (1 to 5 Stars)
                  </h4>
                  <div className="space-y-2 text-xs">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = reportsData.ratingDistribution[star] || 0;
                      const pct = reportsData.totalSubmitted > 0 ? (count / reportsData.totalSubmitted) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center space-x-3">
                          <span className="w-12 text-slate-300 font-mono">{star} Star</span>
                          <div className="flex-1 bg-[#0f172a] h-3 rounded-full overflow-hidden border border-slate-700">
                            <div
                              className={`h-full rounded-full ${
                                star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-blue-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-mono text-slate-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Service Experience Breakdown
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2 rounded bg-[#172033] border border-[#334155]">
                      <span className="text-slate-300">Product Service / Installation Quality:</span>
                      <span className="font-bold text-emerald-400 font-mono">{reportsData.avgInstallSat} / 5.0</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-[#172033] border border-[#334155]">
                      <span className="text-slate-300">Call Centre Interaction Experience:</span>
                      <span className="font-bold text-indigo-300 font-mono">{reportsData.avgCallCentreSat} / 5.0</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-[#172033] border border-[#334155]">
                      <span className="text-slate-300">On-Time Complaint Resolution:</span>
                      <span className="font-bold text-amber-400 font-mono">{reportsData.resolutionOnTimeRate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ENGINEER PERFORMANCE TABLE */}
              <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
                <div className="p-4 bg-[#172033] border-b border-[#334155]">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Service Engineer Performance Evaluation (Attitude, Knowledge, Punctuality, Satisfaction)
                  </h4>
                </div>
                <div className="overflow-x-auto custom-horizontal-scrollbar">
                  <table className="w-full text-left text-xs text-slate-300 min-w-[850px]">
                    <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                      <tr>
                        <th className="p-3">Engineer Name</th>
                        <th className="p-3">Total Feedbacks</th>
                        <th className="p-3">Attitude & Grooming</th>
                        <th className="p-3">Technical Skill</th>
                        <th className="p-3">Work Satisfaction</th>
                        <th className="p-3">Punctuality Rate</th>
                        <th className="p-3">Product Demo Rate</th>
                        <th className="p-3">Overall Satisfaction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                      {reportsData.engineerReports && reportsData.engineerReports.length > 0 ? (
                        reportsData.engineerReports.map((eng: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800/40">
                            <td className="p-3 font-semibold text-white">{eng.name}</td>
                            <td className="p-3 font-mono text-emerald-400">{eng.totalFeedbacks}</td>
                            <td className="p-3 font-mono">{eng.avgAttitude} / 5</td>
                            <td className="p-3 font-mono">{eng.avgKnowledge} / 5</td>
                            <td className="p-3 font-mono">{eng.avgWorkSat} / 5</td>
                            <td className="p-3 font-mono text-indigo-300">{eng.punctualityRate}</td>
                            <td className="p-3 font-mono text-purple-300">{eng.demoRate}</td>
                            <td className="p-3 font-bold font-mono text-amber-400">{eng.avgOverall} / 5.0</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-slate-500 text-xs">
                            No engineer evaluations available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW FEEDBACK DETAILS MODAL (Exact 13 Fields) */}
      {viewModalFeedback && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-[#334155] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <span>⭐ Customer Feedback Submission:</span>
                <span className="font-mono text-emerald-400">#{viewModalFeedback.complaintNo}</span>
              </h3>
              <button
                onClick={() => setViewModalFeedback(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              {/* Snapshot Banner */}
              <div className="bg-[#0f172a] p-3.5 rounded-xl border border-[#334155] grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block">Customer</span>
                  <span className="text-white font-semibold">{viewModalFeedback.customerName}</span>
                  <span className="text-slate-400 block font-mono text-[11px]">{viewModalFeedback.customerMobile}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Assigned Engineer</span>
                  <span className="text-indigo-300 font-semibold">{viewModalFeedback.engineerName}</span>
                  <span className="text-slate-400 block text-[11px]">
                    Submitted: {viewModalFeedback.submittedAt ? new Date(viewModalFeedback.submittedAt).toLocaleString() : '—'}
                  </span>
                </div>
              </div>

              {/* 13 QUESTION RESPONSES */}
              <div className="space-y-2.5">
                {[
                  {
                    q: '1. Engineer Visit as per Scheduled Appointment',
                    a: viewModalFeedback.appointmentVisitRating,
                  },
                  {
                    q: '2. Are you get resolution on time',
                    a: viewModalFeedback.resolutionOnTime,
                  },
                  {
                    q: '3. Are you satisfied with Product Service / Installation',
                    a: viewModalFeedback.productServiceSatisfaction,
                  },
                  {
                    q: '4. Engineer - Attitude/Behavior/Attentiveness/Grooming',
                    a: viewModalFeedback.engineerAttitudeRating,
                  },
                  {
                    q: '5. Engineer - Knowledge or Skill of product/repair',
                    a: viewModalFeedback.engineerKnowledgeRating,
                  },
                  {
                    q: '6. Is he Complete work as per your Satisfaction',
                    a: viewModalFeedback.workSatisfaction,
                  },
                  {
                    q: '7. Is he given you proper time',
                    a: viewModalFeedback.engineerTimeRating,
                  },
                  {
                    q: '8. Is he Demonstrate you properly about Product',
                    a: viewModalFeedback.productDemonstration,
                  },
                  {
                    q: '9. Is he Collected Any Amount from You',
                    a: viewModalFeedback.amountCollected,
                  },
                  {
                    q: '10. Is he given you Receipt of Collected Amount',
                    a: viewModalFeedback.receiptProvided,
                  },
                  {
                    q: '11. Reason behind Desatisfaction ?',
                    a: viewModalFeedback.dissatisfactionReason || 'None (Satisfactory service reported)',
                    isNote: true,
                  },
                  {
                    q: '12. Call Centre Interaction experience',
                    a: viewModalFeedback.callCentreExperience,
                  },
                  {
                    q: '13. Overall experience',
                    a: viewModalFeedback.overallExperience,
                    highlight: true,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border flex flex-col sm:flex-row justify-between sm:items-center gap-1.5 ${
                      item.highlight
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-[#172033] border-[#334155]'
                    }`}
                  >
                    <span className="text-slate-300 font-medium">{item.q}</span>
                    <span
                      className={`font-bold font-mono ${
                        item.highlight
                          ? 'text-emerald-400 text-sm'
                          : item.a === 'Poor' || item.a === 'No'
                          ? 'text-rose-400'
                          : 'text-white'
                      }`}
                    >
                      {item.a || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-[#334155]">
              <span className="text-[11px] text-slate-400">
                Submitted by: <strong className="text-white">{viewModalFeedback.submittedBy || 'Customer'}</strong>
              </span>
              <button
                onClick={() => setViewModalFeedback(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN FEEDBACK MODAL */}
      {reopenModalFeedback && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>🔓 Reopen Feedback for #{reopenModalFeedback.complaintNo}</span>
              </h3>
              <button onClick={() => setReopenModalFeedback(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                Reopening allows the customer or call centre executive to modify and re-submit the feedback for this service request.
              </p>
              <div>
                <label className="block text-xs font-semibold text-amber-400 mb-1">
                  Reopening Justification / Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Customer called back to revise rating after engineer second visit..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
              <button
                onClick={() => setReopenModalFeedback(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteReopen}
                disabled={reopeningSaving}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold shadow"
              >
                {reopeningSaving ? 'Reopening...' : 'Confirm Reopen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#334155] pb-2">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>🔗 Share Feedback Link: #{shareModalData.complaintNo}</span>
              </h3>
              <button onClick={() => setShareModalData(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Customer Secure Feedback URL:</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareModalData.feedbackUrl}
                    className="flex-1 bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-xs text-emerald-400 font-mono select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareModalData.feedbackUrl);
                      alert('Feedback URL copied to clipboard!');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Pre-formatted SMS / WhatsApp text:</label>
                <textarea
                  readOnly
                  rows={3}
                  value={shareModalData.messageText}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded p-2 text-xs text-slate-300"
                />
              </div>

              <div className="pt-2">
                <a
                  href={shareModalData.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center justify-center space-x-2"
                >
                  <span>💬 Send via WhatsApp (to {shareModalData.customerMobile})</span>
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#334155]">
              <button
                onClick={() => setShareModalData(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded text-xs"
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


'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomerFeedbackLookupPage() {
  const router = useRouter();
  const [complaintNo, setComplaintNo] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!complaintNo.trim()) {
      setError('Please enter your Complaint / Call Number.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Please enter your 10-digit registered mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/feedback/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintNo, mobileNumber }),
      });
      const json = await res.json();
      if (json.success && json.data?.token) {
        router.push(`/feedback/${json.data.token}`);
      } else {
        setError(json.message || 'No matching service request found. Please verify your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification service error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1329] text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#172033] border border-[#334155] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <img
            src="/assets/quickserves-logo.png"
            alt="Quickserves Official Logo"
            className="h-9 w-auto mx-auto object-contain select-none"
          />
          <h1 className="text-lg font-bold text-white tracking-wide uppercase pt-2">
            Service Feedback Portal
          </h1>
          <p className="text-xs text-slate-400">
            Verify your service request using your Complaint Number and Registered Mobile.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Complaint Number / Call ID *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 261101UPQS0001"
              value={complaintNo}
              onChange={(e) => setComplaintNo(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              Registered Mobile Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="animate-spin text-sm">⏳</span>
                <span>Verifying Service Record...</span>
              </>
            ) : (
              <span>Proceed to Feedback</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#334155]">
          <p className="text-[11px] text-slate-500">
            Secure verification powered by Quickserves Service Management System.
          </p>
        </div>
      </div>
    </div>
  );
}


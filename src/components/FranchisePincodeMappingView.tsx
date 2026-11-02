'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';

interface FranchiseItem {
  _id: string;
  crmCode: string;
  firmName: string;
  city?: string;
  district?: string;
  state?: string;
  locality?: string;
}

interface MappedPincode {
  _id: string;
  pincode: string;
  franchiseId: string;
  franchiseCode: string;
  franchiseName: string;
  state?: string;
  district?: string;
  city?: string;
  locality?: string;
  history?: any[];
  updatedAt: string;
}

interface LocalityCheckResult {
  pincode: string;
  isMapped: boolean;
  currentFranchiseId?: string | null;
  currentFranchiseCode?: string | null;
  currentFranchiseName?: string | null;
  state: string;
  district: string;
  city: string;
  locality: string;
}

export default function FranchisePincodeMappingView({ currentUser }: { currentUser?: any }) {
  const [franchises, setFranchises] = useState<FranchiseItem[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [crmCodeInput, setCrmCodeInput] = useState('');

  // Section A - Input
  const [pincodesInput, setPincodesInput] = useState('');
  const [checkingLocality, setCheckingLocality] = useState(false);
  const [checkResults, setCheckResults] = useState<LocalityCheckResult[] | null>(null);
  const [cachedLocalityDetails, setCachedLocalityDetails] = useState<Record<string, any>>({});

  // Section C - State & Modals
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Conflict warning modal
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictsList, setConflictsList] = useState<any[]>([]);
  const [pendingAction, setPendingAction] = useState<'add' | 'update' | null>(null);

  // Delete entire mapping confirmation modal
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  // History inspection modal
  const [selectedPinForHistory, setSelectedPinForHistory] = useState<MappedPincode | null>(null);

  // All mapped pincodes for table
  const [mappedPincodes, setMappedPincodes] = useState<MappedPincode[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [tableFranchiseFilter, setTableFranchiseFilter] = useState('ALL');

  useEffect(() => {
    loadFranchises();
    loadAllMappedPincodes();
  }, []);

  const loadFranchises = async () => {
    try {
      const res = await fetchWithCache('/api/masters/franchises');
      const list: FranchiseItem[] =
        res && res.success && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
      if (list.length > 0) {
        setFranchises(list);
        if (!selectedFranchiseId) {
          setSelectedFranchiseId(list[0]._id);
          setCrmCodeInput(list[0].crmCode || '');
        }
      }
    } catch (e) {
      console.error('Error loading franchises:', e);
    }
  };

  const loadAllMappedPincodes = async () => {
    setLoadingTable(true);
    try {
      const res = await fetch('/api/masters/mappings/franchise-pincodes');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMappedPincodes(json.data);
      }
    } catch (e) {
      console.error('Error loading mapped pincodes:', e);
    } finally {
      setLoadingTable(false);
    }
  };

  const selectedFranchise = useMemo(() => {
    return franchises.find((f) => f._id === selectedFranchiseId);
  }, [franchises, selectedFranchiseId]);

  // Parse & Deduplicate PIN codes from text input
  const parsedPincodes = useMemo(() => {
    if (!pincodesInput.trim()) return [];
    const rawTokens = pincodesInput.split(/[\s,;\n\r]+/).filter(Boolean);
    const unique = new Set<string>();
    for (const t of rawTokens) {
      const clean = t.replace(/\D/g, '').trim();
      if (clean.length === 6) {
        unique.add(clean);
      }
    }
    return Array.from(unique);
  }, [pincodesInput]);

  // Handle "Check Locality"
  const handleCheckLocality = async () => {
    if (parsedPincodes.length === 0) {
      setMessage({
        text: 'Please paste or enter at least one valid 6-digit PIN code in the textarea.',
        type: 'error',
      });
      return;
    }

    setCheckingLocality(true);
    setMessage(null);
    const detailsMap: Record<string, any> = { ...cachedLocalityDetails };

    try {
      // For each pincode not already cached, fetch location from /api/pincode/[code]
      for (const pin of parsedPincodes) {
        if (!detailsMap[pin]) {
          try {
            const locRes = await fetch(`/api/pincode/${pin}`);
            const locJson = await locRes.json();
            if (locJson.success && locJson.data) {
              detailsMap[pin] = locJson.data;
            }
          } catch (err) {
            console.warn(`Pincode lookup error for ${pin}:`, err);
          }
        }
      }
      setCachedLocalityDetails(detailsMap);

      // Check existing mapping and conflicts via backend API
      const res = await fetch('/api/masters/mappings/franchise-pincodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'checkLocality',
          franchiseId: selectedFranchiseId,
          pincodesInput: parsedPincodes,
          localityDetails: detailsMap,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCheckResults(json.data.results || []);
        if (json.data.hasConflicts) {
          setMessage({
            text: `⚠️ Locality checked: ${json.data.totalChecked} PIN code(s) verified. Note: ${json.data.conflicts.length} PIN code(s) are currently mapped to another franchise.`,
            type: 'error',
          });
        } else {
          setMessage({
            text: `✅ Locality verified successfully for all ${json.data.totalChecked} PIN code(s). Ready for assignment.`,
            type: 'success',
          });
        }
      }
    } catch (e: any) {
      setMessage({ text: e.message || 'Error checking locality', type: 'error' });
    } finally {
      setCheckingLocality(false);
    }
  };

  // Execute Add / Update
  const executeMapping = async (action: 'add' | 'update', forceReassign = false) => {
    if (!selectedFranchiseId) {
      alert('Please select a franchise first.');
      return;
    }
    if (parsedPincodes.length === 0) {
      alert('Please enter at least one valid 6-digit PIN code.');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/masters/mappings/franchise-pincodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          franchiseId: selectedFranchiseId,
          pincodesInput: parsedPincodes,
          forceReassign,
          localityDetails: cachedLocalityDetails,
          updatedBy: currentUser?.fullName || 'Super Admin',
        }),
      });

      const json = await res.json();

      if (json.requiresConfirmation) {
        // Show conflict warning modal
        setConflictsList(json.conflicts || []);
        setPendingAction(action);
        setShowConflictModal(true);
        setSubmitting(false);
        return;
      }

      if (json.success) {
        setMessage({ text: json.message || 'Pincode mapping saved successfully!', type: 'success' });
        setPincodesInput('');
        setCheckResults(null);
        setShowConflictModal(false);
        setPendingAction(null);
        invalidateCache('/api/masters/mappings/franchise-pincodes');
        loadAllMappedPincodes();
      } else {
        setMessage({ text: json.message || 'Failed to save mapping', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: e.message || 'Network error occurred', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Entire Mapping for selected Franchise
  const handleDeleteEntireMapping = async () => {
    if (!selectedFranchiseId) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/masters/mappings/franchise-pincodes?franchiseId=${selectedFranchiseId}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (json.success) {
        setMessage({ text: json.message, type: 'success' });
        setShowDeleteAllModal(false);
        invalidateCache('/api/masters/mappings/franchise-pincodes');
        loadAllMappedPincodes();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete single mapped pincode
  const handleDeleteSinglePin = async (pincode: string) => {
    if (!confirm(`Are you sure you want to unmap PIN Code ${pincode}?`)) return;
    try {
      const res = await fetch(`/api/masters/mappings/franchise-pincodes?pincode=${pincode}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setMappedPincodes((prev) => prev.filter((p) => p.pincode !== pincode));
        setMessage({ text: json.message, type: 'success' });
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message || 'Delete error');
    }
  };

  // Filtered mapped pincodes for table
  const filteredMappedPincodes = useMemo(() => {
    let list = mappedPincodes;
    if (tableFranchiseFilter !== 'ALL') {
      list = list.filter((m) => m.franchiseId === tableFranchiseFilter);
    }
    if (tableSearch.trim()) {
      const term = tableSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.pincode.includes(term) ||
          m.franchiseName.toLowerCase().includes(term) ||
          m.franchiseCode.toLowerCase().includes(term) ||
          (m.city && m.city.toLowerCase().includes(term)) ||
          (m.state && m.state.toLowerCase().includes(term)) ||
          (m.district && m.district.toLowerCase().includes(term)) ||
          (m.locality && m.locality.toLowerCase().includes(term))
      );
    }
    return list;
  }, [mappedPincodes, tableFranchiseFilter, tableSearch]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Franchise Pincode Mapping</h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
              Auto-Locality & Conflict Safe
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Map territorial service dispatch boundaries and 6-digit Indian PIN codes to franchise partners.
          </p>
        </div>

        {/* Action Buttons: Section C */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => executeMapping('add')}
            disabled={submitting || parsedPincodes.length === 0}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Mapping
          </button>
          <button
            type="button"
            onClick={() => executeMapping('update')}
            disabled={submitting || parsedPincodes.length === 0}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            💾 Update Mapping
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteAllModal(true)}
            disabled={submitting || !selectedFranchiseId}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🗑️ Delete Entire Mapping
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Form Split into Section A and Section B */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section A: Pincode Input (7 cols) */}
        <div className="lg:col-span-7 bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Section A – Pincode Input</h2>
              <p className="text-xs text-slate-400">
                Paste multiple PIN codes separated by commas, spaces, or newlines.
              </p>
            </div>
            {parsedPincodes.length > 0 && (
              <span className="text-[11px] bg-slate-800 text-emerald-400 border border-slate-700 px-2.5 py-0.5 rounded-full font-mono">
                {parsedPincodes.length} Valid Pincodes Identified
              </span>
            )}
          </div>

          <div>
            <textarea
              rows={6}
              value={pincodesInput}
              onChange={(e) => {
                setPincodesInput(e.target.value);
                setCheckResults(null);
              }}
              placeholder="e.g. 201014, 201010, 201007, 201301&#10;Or paste an entire column of pincodes..."
              className="w-full bg-[#0b1320] border border-[#334155] rounded-xl p-3.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-slate-500">
              Duplicates are removed automatically. 6-digit Indian PIN codes are supported.
            </span>
            <button
              type="button"
              onClick={handleCheckLocality}
              disabled={checkingLocality || parsedPincodes.length === 0}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {checkingLocality ? (
                <>
                  <span className="w-3 h-3 border-2 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin" />
                  <span>Checking Locality...</span>
                </>
              ) : (
                <>
                  <span>🔍 Check Locality</span>
                </>
              )}
            </button>
          </div>

          {/* Check Results Breakdown Drawer */}
          {checkResults && checkResults.length > 0 && (
            <div className="bg-[#0b1320] border border-[#1e293b] rounded-xl p-4 space-y-3 mt-4">
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                <span className="text-xs font-bold text-white">Locality Verification Results</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {checkResults.length} PIN codes processed
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-[#1e293b]/40">
                {checkResults.map((r) => (
                  <div key={r.pincode} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-emerald-400">{r.pincode}</span>
                        <span className="text-slate-300 font-medium">
                          {r.locality ? `${r.locality}, ` : ''}{r.city || r.district || 'Location Found'}
                        </span>
                        {r.state && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                            {r.state}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      {r.isMapped ? (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            r.currentFranchiseId === selectedFranchiseId
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {r.currentFranchiseId === selectedFranchiseId
                            ? 'Already Assigned'
                            : `Mapped to: ${r.currentFranchiseName || 'Other'}`}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          Available / Unmapped
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Section B: Franchise Mapping (5 cols) */}
        <div className="lg:col-span-5 bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Section B – Franchise Mapping</h2>
              <p className="text-xs text-slate-400">Target franchise partner to assign or update</p>
            </div>

            {/* Franchise CRM Code (Editable with two-way sync) */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Franchise CRM Code
              </label>
              <input
                type="text"
                value={crmCodeInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setCrmCodeInput(val);
                  const clean = val.trim().toUpperCase();
                  if (clean) {
                    const match = franchises.find((f) => f.crmCode?.toUpperCase() === clean);
                    if (match) {
                      setSelectedFranchiseId(match._id);
                    }
                  }
                }}
                placeholder="e.g. QSF0001 (auto-selects franchise)"
                className="w-full bg-[#0b1320] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Update To (Franchise Name) <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedFranchiseId}
                onChange={(e) => {
                  const fId = e.target.value;
                  setSelectedFranchiseId(fId);
                  const found = franchises.find((f) => f._id === fId);
                  if (found) {
                    setCrmCodeInput(found.crmCode || '');
                  }
                  setCheckResults(null);
                }}
                className="w-full bg-[#0b1320] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="">----Select Franchise----</option>
                {franchises.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.firmName} ({f.crmCode || 'FRN'}) {f.city ? `- ${f.city}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-[#0b1320] p-4 rounded-xl border border-[#1e293b] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Franchise CRM Code</span>
                <span className="font-mono text-sm font-bold text-emerald-400">
                  {selectedFranchise?.crmCode || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Operating State</span>
                <span className="text-xs font-medium text-slate-200">
                  {selectedFranchise?.state || 'Pan-India'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Operating District / City</span>
                <span className="text-xs font-medium text-slate-200">
                  {selectedFranchise?.district || selectedFranchise?.city || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Currently Mapped Pincodes</span>
                <span className="text-xs font-bold text-emerald-300 font-mono">
                  {mappedPincodes.filter((m) => m.franchiseId === selectedFranchiseId).length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Summary Pill */}
          <div className="bg-[#0e1726] border border-[#1e293b] p-3 rounded-xl text-[11px] text-slate-400">
            ℹ️ When an address with this PIN code is entered during Call Registration, Quickserves CRM will automatically route service assignment to{' '}
            <strong className="text-white">{selectedFranchise?.firmName || 'this franchise'}</strong>.
          </div>
        </div>
      </div>

      {/* Overview Table of All Mapped Pincodes */}
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Pincode Territory Master Records</h3>
            <p className="text-xs text-slate-400">Active pincode routing directory across all franchises</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={tableFranchiseFilter}
              onChange={(e) => setTableFranchiseFilter(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Franchises</option>
              {franchises.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.firmName} ({f.crmCode || 'FRN'})
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search pincode, city, franchise..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b1320] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#1e293b]">
              <tr>
                <th className="py-3 px-4">PIN Code</th>
                <th className="py-3 px-4">Franchise CRM Code</th>
                <th className="py-3 px-4">Franchise Name</th>
                <th className="py-3 px-4">Locality / City</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-center">History</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {loadingTable ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    Loading pincode records...
                  </td>
                </tr>
              ) : filteredMappedPincodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No mapped pincodes found.
                  </td>
                </tr>
              ) : (
                filteredMappedPincodes.map((row) => (
                  <tr key={row._id} className="hover:bg-[#16233b]/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                      {row.pincode}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                      {row.franchiseCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {row.franchiseName}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {row.locality ? `${row.locality}, ` : ''}{row.city || row.district || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {row.state || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.history && row.history.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedPinForHistory(row)}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono transition"
                        >
                          📜 {row.history.length} change(s)
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-600 font-mono">Original</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteSinglePin(row.pincode)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition"
                      >
                        Unmap
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conflict Warning Modal */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c2e] border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-base font-bold text-white">Pincode Reassignment Warning</h3>
                <span className="text-xs text-slate-400">Conflict detected with existing mappings</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The following <strong className="text-amber-300">{conflictsList.length} PIN code(s)</strong> are currently assigned to other franchises. Reassigning them will transfer territorial ownership to{' '}
              <strong className="text-emerald-400">{selectedFranchise?.firmName}</strong>:
            </p>

            <div className="max-h-48 overflow-y-auto bg-[#0b1320] border border-[#1e293b] rounded-xl p-3 space-y-1.5 divide-y divide-[#1e293b]/40">
              {conflictsList.map((c, i) => (
                <div key={i} className="pt-1.5 first:pt-0 flex justify-between text-xs font-mono">
                  <span className="text-emerald-400 font-bold">{c.pincode}</span>
                  <span className="text-slate-400">
                    Currently: <span className="text-amber-300 font-sans">{c.franchiseName}</span> ({c.franchiseCode})
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500">
              This action will be permanently recorded in the Pincode Audit History.
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => {
                  setShowConflictModal(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pendingAction) {
                    executeMapping(pendingAction, true);
                  }
                }}
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition shadow-lg shadow-amber-600/30"
              >
                {submitting ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c2e] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-rose-400">
              <span className="text-2xl">🗑️</span>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Entire Mapping Deletion</h3>
                <span className="text-xs text-slate-400">High impact operation</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong className="text-rose-400">all pincode assignments</strong> for{' '}
              <strong className="text-white">{selectedFranchise?.firmName} ({selectedFranchise?.crmCode})</strong>?
            </p>

            <div className="flex justify-end space-x-3 pt-3 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEntireMapping}
                disabled={submitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition shadow-lg shadow-rose-600/30"
              >
                {submitting ? 'Deleting...' : 'Yes, Delete Entire Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Inspection Modal */}
      {selectedPinForHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>📜 Mapping Audit History: PIN {selectedPinForHistory.pincode}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  Current Franchise: {selectedPinForHistory.franchiseName} ({selectedPinForHistory.franchiseCode})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPinForHistory(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {selectedPinForHistory.history?.map((h: any, idx: number) => (
                <div key={idx} className="bg-[#0b1320] border border-[#1e293b] p-3 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">Reassignment #{idx + 1}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(h.updatedAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-slate-400">
                    From: <span className="text-amber-300 font-medium">{h.previousFranchiseName || 'Initial Setup'}</span> → To:{' '}
                    <span className="text-emerald-400 font-medium">{h.newFranchiseName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Updated By: <span className="text-slate-300">{h.updatedBy}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                onClick={() => setSelectedPinForHistory(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl"
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

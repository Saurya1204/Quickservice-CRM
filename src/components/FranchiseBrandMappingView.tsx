'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';

interface FranchiseItem {
  _id: string;
  crmCode: string;
  firmName: string;
  city?: string;
  state?: string;
}

interface BrandItem {
  _id: string;
  brandCode?: string;
  brandName: string;
}

export default function FranchiseBrandMappingView({ currentUser }: { currentUser?: any }) {
  const [franchises, setFranchises] = useState<FranchiseItem[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [crmCodeInput, setCrmCodeInput] = useState('');

  const [allBrands, setAllBrands] = useState<BrandItem[]>([]);
  const [availableBrands, setAvailableBrands] = useState<BrandItem[]>([]);
  const [assignedBrands, setAssignedBrands] = useState<BrandItem[]>([]);
  const [originalAssignedIds, setOriginalAssignedIds] = useState<string[]>([]);

  // Selection state within lists
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([]);

  // Search filters
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Overview summary
  const [allMappings, setAllMappings] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load franchises and brands on initial mount
  useEffect(() => {
    loadFranchises();
    loadAllBrands();
    loadAllMappingsSummary();
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
      }
    } catch (e) {
      console.error('Error loading franchises:', e);
    }
  };

  const loadAllBrands = async () => {
    try {
      const res = await fetchWithCache('/api/masters/brands');
      let list: BrandItem[] =
        res && res.success && Array.isArray(res.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

      // If database returned 0 brands, use older CRM defaults
      if (list.length === 0) {
        list = [
          { _id: 'b1', brandName: 'HIND POWER', brandCode: 'HIND01' },
          { _id: 'b2', brandName: 'Trumate', brandCode: 'TRUM01' },
          { _id: 'b3', brandName: 'BREVILLE', brandCode: 'BREV01' },
          { _id: 'b4', brandName: 'JYOMIX', brandCode: 'JYOM01' },
          { _id: 'b5', brandName: 'HUMINEX', brandCode: 'HUMI01' },
          { _id: 'b6', brandName: 'ZOOM', brandCode: 'ZOOM01' },
          { _id: 'b7', brandName: 'ALTINO', brandCode: 'ALTI01' },
          { _id: 'b8', brandName: 'MAPY', brandCode: 'MAPY01' },
        ];
      }

      setAllBrands(list);
      // If no franchise selected yet, display all brands in available list initially
      if (!selectedFranchiseId) {
        setAvailableBrands(list);
      }
    } catch (e) {
      console.error('Error loading brands:', e);
    }
  };

  const loadAllMappingsSummary = async () => {
    try {
      const res = await fetch('/api/masters/mappings/franchise-brands');
      const json = await res.json();
      if (json.success) {
        const mappingsList = json.data?.allMappings || (Array.isArray(json.data) ? json.data : []);
        setAllMappings(mappingsList);
      }
    } catch (e) {
      console.error('Error loading mappings summary:', e);
    }
  };

  // When selected franchise changes, load its assigned brands
  const handleFranchiseChange = (franchiseId: string) => {
    setSelectedFranchiseId(franchiseId);
    setSelectedAvailableIds([]);
    setSelectedAssignedIds([]);
    setMessage(null);

    if (!franchiseId) {
      setCrmCodeInput('');
      setAssignedBrands([]);
      setAvailableBrands(allBrands);
      setOriginalAssignedIds([]);
      return;
    }

    const found = franchises.find((f) => f._id === franchiseId);
    if (found) {
      setCrmCodeInput(found.crmCode || '');
    }

    loadFranchiseMapping(franchiseId);
  };

  // Two-way sync: when user types CRM code
  const handleCrmCodeInputChange = (code: string) => {
    setCrmCodeInput(code);
    const clean = code.trim().toUpperCase();
    if (!clean) {
      setSelectedFranchiseId('');
      setAssignedBrands([]);
      setAvailableBrands(allBrands);
      return;
    }

    const match = franchises.find((f) => f.crmCode?.toUpperCase() === clean);
    if (match) {
      setSelectedFranchiseId(match._id);
      loadFranchiseMapping(match._id);
    }
  };

  const loadFranchiseMapping = async (franchiseId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/masters/mappings/franchise-brands?franchiseId=${franchiseId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const assigned: BrandItem[] = json.data.assignedBrands || [];
        const available: BrandItem[] = json.data.availableBrands || [];
        setAssignedBrands(assigned);
        setAvailableBrands(available.length > 0 ? available : allBrands.filter((b) => !assigned.some((a) => a._id === b._id)));
        setOriginalAssignedIds(assigned.map((b) => b._id));
      }
    } catch (e) {
      console.error('Error loading franchise brand mapping:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectedFranchise = useMemo(() => {
    return franchises.find((f) => f._id === selectedFranchiseId);
  }, [franchises, selectedFranchiseId]);

  // Transfer handlers
  const handleAssignSelected = () => {
    if (selectedAvailableIds.length === 0) return;
    const toMove = availableBrands.filter((b) => selectedAvailableIds.includes(b._id));
    setAssignedBrands((prev) => [...prev, ...toMove].sort((a, b) => a.brandName.localeCompare(b.brandName)));
    setAvailableBrands((prev) => prev.filter((b) => !selectedAvailableIds.includes(b._id)));
    setSelectedAvailableIds([]);
  };

  const handleRemoveSelected = () => {
    if (selectedAssignedIds.length === 0) return;
    const toMove = assignedBrands.filter((b) => selectedAssignedIds.includes(b._id));
    setAvailableBrands((prev) => [...prev, ...toMove].sort((a, b) => a.brandName.localeCompare(b.brandName)));
    setAssignedBrands((prev) => prev.filter((b) => !selectedAssignedIds.includes(b._id)));
    setSelectedAssignedIds([]);
  };

  const handleAbort = () => {
    if (selectedFranchiseId) {
      loadFranchiseMapping(selectedFranchiseId);
    } else {
      setAssignedBrands([]);
      setAvailableBrands(allBrands);
      setCrmCodeInput('');
    }
    setMessage({ text: 'Changes aborted and reset to previous state.', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveUpdate = async () => {
    if (!selectedFranchiseId) {
      alert('Please select a Franchise Name or enter a valid Franchise CRM Code first.');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/masters/mappings/franchise-brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseId: selectedFranchiseId,
          brandIds: assignedBrands.map((b) => b._id),
          updatedBy: currentUser?.fullName || 'Super Admin',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ text: json.message || 'Franchise brand mapping updated successfully!', type: 'success' });
        setOriginalAssignedIds(assignedBrands.map((b) => b._id));
        invalidateCache('/api/masters/mappings/franchise-brands');
        loadAllMappingsSummary();
      } else {
        setMessage({ text: json.message || 'Failed to update mapping', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: e.message || 'Network error occurred', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // Filtered lists
  const filteredAvailable = useMemo(() => {
    if (!searchAvailable.trim()) return availableBrands;
    const term = searchAvailable.toLowerCase();
    return availableBrands.filter((b) => b.brandName.toLowerCase().includes(term));
  }, [availableBrands, searchAvailable]);

  const filteredAssigned = useMemo(() => {
    if (!searchAssigned.trim()) return assignedBrands;
    const term = searchAssigned.toLowerCase();
    return assignedBrands.filter((b) => b.brandName.toLowerCase().includes(term));
  }, [assignedBrands, searchAssigned]);

  // Grouped summary for overview table
  const groupedSummary = useMemo(() => {
    const map = new Map<string, { franchiseCode: string; franchiseName: string; brands: string[]; franchiseId: string }>();
    allMappings.forEach((m) => {
      const fId = m.franchiseId?.toString();
      if (!map.has(fId)) {
        map.set(fId, {
          franchiseId: fId,
          franchiseCode: m.franchiseCode || 'FRN',
          franchiseName: m.franchiseName || 'Unknown Franchise',
          brands: [],
        });
      }
      map.get(fId)!.brands.push(m.brandName);
    });

    let list = Array.from(map.values());
    if (tableSearch.trim()) {
      const t = tableSearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.franchiseName.toLowerCase().includes(t) ||
          item.franchiseCode.toLowerCase().includes(t) ||
          item.brands.some((b) => b.toLowerCase().includes(t))
      );
    }
    return list;
  }, [allMappings, tableSearch]);

  return (
    <div className="space-y-6">
      {/* Top Main Panel - Matches Older CRM Layout */}
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
        {/* Title Header */}
        <div className="border-b border-[#1e293b] pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Franchise Brand Mapping</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Select franchise by CRM Code or Franchise Name and assign brands using dual-list transfer.
            </p>
          </div>
          {selectedFranchise && (
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono">
              Active: {selectedFranchise.firmName} ({selectedFranchise.crmCode})
            </span>
          )}
        </div>

        {/* Notification Banner */}
        {message && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Top Controls Row: Franchise CRM Code & Franchise Name (Two-Way Binding) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0b1320] p-5 rounded-2xl border border-[#1e293b]">
          {/* Franchise CRM Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Franchise CRM Code
            </label>
            <input
              type="text"
              value={crmCodeInput}
              onChange={(e) => handleCrmCodeInputChange(e.target.value)}
              placeholder="e.g. QSF0001 (auto-selects franchise name)"
              className="w-full bg-[#111c2e] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Franchise Name Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Franchise Name
            </label>
            <select
              value={selectedFranchiseId}
              onChange={(e) => handleFranchiseChange(e.target.value)}
              className="w-full bg-[#111c2e] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="">----Select----</option>
              {franchises.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.firmName} {f.crmCode ? `(${f.crmCode})` : ''} {f.city ? `- ${f.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dual List Boxes matching Older CRM */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* Left Column: Brand (Available) */}
          <div className="md:col-span-5 bg-[#0b1320] border border-[#1e293b] rounded-2xl p-4 flex flex-col h-[340px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Brand ({filteredAvailable.length})
              </label>
              <span className="text-[10px] text-slate-500">Available Brands</span>
            </div>

            <div className="py-2">
              <input
                type="text"
                placeholder="Search brands..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 border border-[#1e293b] rounded-xl p-2 bg-[#0e1726]">
              {filteredAvailable.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  {loading ? 'Loading brands...' : 'No available brands'}
                </div>
              ) : (
                filteredAvailable.map((b) => {
                  const isSelected = selectedAvailableIds.includes(b._id);
                  return (
                    <div
                      key={b._id}
                      onClick={() =>
                        setSelectedAvailableIds((prev) =>
                          isSelected ? prev.filter((id) => id !== b._id) : [...prev, b._id]
                        )
                      }
                      className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition select-none flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-[#141f33] hover:bg-[#1a2942] text-slate-200'
                      }`}
                    >
                      <span>{b.brandName}</span>
                      {b.brandCode && (
                        <span className="text-[10px] font-mono opacity-60">{b.brandCode}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center Column: >> and << Transfer Buttons */}
          <div className="md:col-span-1 flex md:flex-col justify-center items-center gap-3">
            <button
              type="button"
              onClick={handleAssignSelected}
              disabled={selectedAvailableIds.length === 0}
              className="w-14 h-9 md:w-12 md:h-10 bg-[#0284c7] hover:bg-[#0369a1] active:bg-[#075985] text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              &gt;&gt;
            </button>
            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={selectedAssignedIds.length === 0}
              className="w-14 h-9 md:w-12 md:h-10 bg-[#0284c7] hover:bg-[#0369a1] active:bg-[#075985] text-white font-bold text-sm rounded-xl shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            >
              &lt;&lt;
            </button>
          </div>

          {/* Right Column: Assigned Brands */}
          <div className="md:col-span-5 bg-[#0b1320] border border-[#1e293b] rounded-2xl p-4 flex flex-col h-[340px]">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Assigned Brands ({filteredAssigned.length})
              </label>
              <span className="text-[10px] text-emerald-400 font-mono">
                {selectedFranchise ? selectedFranchise.crmCode : 'No Franchise'}
              </span>
            </div>

            <div className="py-2">
              <input
                type="text"
                placeholder="Search assigned brands..."
                value={searchAssigned}
                onChange={(e) => setSearchAssigned(e.target.value)}
                className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 border border-[#1e293b] rounded-xl p-2 bg-[#0e1726]">
              {filteredAssigned.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  {selectedFranchiseId ? 'No brands assigned yet' : 'Select a franchise to view assignments'}
                </div>
              ) : (
                filteredAssigned.map((b) => {
                  const isSelected = selectedAssignedIds.includes(b._id);
                  return (
                    <div
                      key={b._id}
                      onClick={() =>
                        setSelectedAssignedIds((prev) =>
                          isSelected ? prev.filter((id) => id !== b._id) : [...prev, b._id]
                        )
                      }
                      className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition select-none flex items-center justify-between ${
                        isSelected
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-[#141f33] hover:bg-[#1a2942] text-slate-200'
                      }`}
                    >
                      <span>{b.brandName}</span>
                      {b.brandCode && (
                        <span className="text-[10px] font-mono opacity-60">{b.brandCode}</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons: Update (Green) & Abort (Yellow) */}
        <div className="flex justify-center items-center space-x-4 pt-4 border-t border-[#1e293b]">
          <button
            type="button"
            onClick={handleSaveUpdate}
            disabled={saving || !selectedFranchiseId}
            className="px-8 py-2.5 text-xs font-bold rounded-xl bg-[#22c55e] hover:bg-[#16a34a] active:bg-[#15803d] text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {saving ? 'Updating...' : 'Update'}
          </button>
          <button
            type="button"
            onClick={handleAbort}
            disabled={saving}
            className="px-8 py-2.5 text-xs font-bold rounded-xl bg-[#eab308] hover:bg-[#ca8a04] active:bg-[#a16207] text-slate-900 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            Abort
          </button>
        </div>
      </div>

      {/* Overview Table of All Franchise Brand Assignments */}
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">All Franchise Brand Mappings</h3>
            <p className="text-xs text-slate-400">Directory of all franchise centers and their assigned brand coverage</p>
          </div>
          <input
            type="text"
            placeholder="Search franchise or brand..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0b1320] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#1e293b]">
              <tr>
                <th className="py-3 px-4">Franchise CRM Code</th>
                <th className="py-3 px-4">Franchise Name</th>
                <th className="py-3 px-4">Assigned Brands</th>
                <th className="py-3 px-4 text-center">Total Brands</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]/60">
              {groupedSummary.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No brand mappings configured yet.
                  </td>
                </tr>
              ) : (
                groupedSummary.map((row) => (
                  <tr key={row.franchiseId} className="hover:bg-[#16233b]/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {row.franchiseCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {row.franchiseName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {row.brands.map((bname: string, i: number) => (
                          <span
                            key={i}
                            className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px]"
                          >
                            {bname}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                      {row.brands.length}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleFranchiseChange(row.franchiseId)}
                        className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold transition"
                      >
                        Edit Mapping
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

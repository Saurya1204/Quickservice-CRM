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
  const [allBrands, setAllBrands] = useState<BrandItem[]>([]);
  
  // Dual-list state
  const [availableBrands, setAvailableBrands] = useState<BrandItem[]>([]);
  const [assignedBrands, setAssignedBrands] = useState<BrandItem[]>([]);
  const [originalAssignedIds, setOriginalAssignedIds] = useState<string[]>([]);

  // Selection state in the two lists
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [selectedAssignedIds, setSelectedAssignedIds] = useState<string[]>([]);

  // Search filters
  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');
  const [tableSearch, setTableSearch] = useState('');

  // Summary list of all mappings for overview table
  const [allMappings, setAllMappings] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Load franchises and all brands on mount
  useEffect(() => {
    loadFranchises();
    loadAllBrands();
    loadAllMappingsSummary();
  }, []);

  const loadFranchises = async () => {
    try {
      const data = await fetchWithCache('/api/masters/franchises');
      if (Array.isArray(data) && data.length > 0) {
        setFranchises(data);
        if (!selectedFranchiseId) {
          setSelectedFranchiseId(data[0]._id);
        }
      }
    } catch (e) {
      console.error('Error loading franchises:', e);
    }
  };

  const loadAllBrands = async () => {
    try {
      const data = await fetchWithCache('/api/masters/brands');
      if (Array.isArray(data)) {
        setAllBrands(data);
      }
    } catch (e) {
      console.error('Error loading brands:', e);
    }
  };

  const loadAllMappingsSummary = async () => {
    try {
      const res = await fetch('/api/masters/mappings/franchise-brands');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllMappings(json.data);
      }
    } catch (e) {
      console.error('Error loading mappings summary:', e);
    }
  };

  // Load assigned brands when selected franchise changes
  useEffect(() => {
    if (!selectedFranchiseId) return;
    loadFranchiseMapping(selectedFranchiseId);
  }, [selectedFranchiseId, allBrands]);

  const loadFranchiseMapping = async (franchiseId: string) => {
    setLoading(true);
    setMessage(null);
    setSelectedAvailableIds([]);
    setSelectedAssignedIds([]);
    try {
      const res = await fetch(`/api/masters/mappings/franchise-brands?franchiseId=${franchiseId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const assigned: BrandItem[] = json.data.assignedBrands || [];
        const available: BrandItem[] = json.data.availableBrands || [];
        setAssignedBrands(assigned);
        setAvailableBrands(available);
        setOriginalAssignedIds(assigned.map((b) => b._id));
      }
    } catch (e) {
      console.error('Error loading franchise mapping:', e);
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

  const handleAssignAll = () => {
    setAssignedBrands((prev) =>
      [...prev, ...filteredAvailable].sort((a, b) => a.brandName.localeCompare(b.brandName))
    );
    const assignedIdsSet = new Set(filteredAvailable.map((b) => b._id));
    setAvailableBrands((prev) => prev.filter((b) => !assignedIdsSet.has(b._id)));
    setSelectedAvailableIds([]);
  };

  const handleRemoveAll = () => {
    setAvailableBrands((prev) =>
      [...prev, ...filteredAssigned].sort((a, b) => a.brandName.localeCompare(b.brandName))
    );
    const removedIdsSet = new Set(filteredAssigned.map((b) => b._id));
    setAssignedBrands((prev) => prev.filter((b) => !removedIdsSet.has(b._id)));
    setSelectedAssignedIds([]);
  };

  const handleAbort = () => {
    if (selectedFranchiseId) {
      loadFranchiseMapping(selectedFranchiseId);
      setMessage({ text: 'Unsaved changes aborted and reverted.', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedFranchiseId) {
      alert('Please select a franchise first.');
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
        setMessage({ text: json.message || 'Mapping saved successfully!', type: 'success' });
        setOriginalAssignedIds(assignedBrands.map((b) => b._id));
        invalidateCache('/api/masters/mappings/franchise-brands');
        loadAllMappingsSummary();
      } else {
        setMessage({ text: json.message || 'Failed to save mapping', type: 'error' });
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
    return availableBrands.filter(
      (b) => b.brandName.toLowerCase().includes(term) || (b.brandCode && b.brandCode.toLowerCase().includes(term))
    );
  }, [availableBrands, searchAvailable]);

  const filteredAssigned = useMemo(() => {
    if (!searchAssigned.trim()) return assignedBrands;
    const term = searchAssigned.toLowerCase();
    return assignedBrands.filter(
      (b) => b.brandName.toLowerCase().includes(term) || (b.brandCode && b.brandCode.toLowerCase().includes(term))
    );
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

  const hasUnsavedChanges = useMemo(() => {
    const currentSet = new Set(assignedBrands.map((b) => b._id));
    const originalSet = new Set(originalAssignedIds);
    if (currentSet.size !== originalSet.size) return true;
    for (const id of Array.from(currentSet)) {
      if (!originalSet.has(id)) return true;
    }
    return false;
  }, [assignedBrands, originalAssignedIds]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Franchise Brand Mapping</h1>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
              Many-to-Many Architecture
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Assign multi-brand operational coverage to franchise service centers with dual-list transfer.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={handleAbort}
            disabled={saving || !hasUnsavedChanges}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Abort
          </button>
          <button
            type="button"
            onClick={handleSaveUpdate}
            disabled={saving || loading}
            className="flex items-center space-x-2 px-6 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <span>💾 Update Mapping</span>
              </>
            )}
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

      {/* Main Dual-List Workspace */}
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-6">
        {/* Franchise Selector Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-[#1e293b]">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Franchise Partner <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedFranchiseId}
              onChange={(e) => setSelectedFranchiseId(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            >
              {franchises.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.firmName} ({f.crmCode || 'FRN'}) {f.city ? `- ${f.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#0b1320] p-3 rounded-xl border border-[#1e293b]">
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Franchise CRM Code
              </span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {selectedFranchise?.crmCode || '—'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Territory / State
              </span>
              <span className="text-xs font-medium text-slate-300">
                {selectedFranchise?.state || selectedFranchise?.city || 'Pan-India'}
              </span>
            </div>
          </div>
        </div>

        {/* Dual List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
          {/* Left Column: Available Brands */}
          <div className="lg:col-span-5 bg-[#0b1320] border border-[#1e293b] rounded-2xl flex flex-col h-[460px]">
            {/* List Header */}
            <div className="p-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#0e1726] rounded-t-2xl">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Available Brands</span>
                  <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {filteredAvailable.length}
                  </span>
                </h3>
                <span className="text-[10px] text-slate-500">Unassigned master brands</span>
              </div>
              <button
                type="button"
                onClick={handleAssignAll}
                disabled={filteredAvailable.length === 0}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium disabled:opacity-30"
              >
                Assign All »
              </button>
            </div>

            {/* Filter Search */}
            <div className="p-2.5 border-b border-[#1e293b]/60">
              <input
                type="text"
                placeholder="Search available brands..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredAvailable.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No available brands
                </div>
              ) : (
                filteredAvailable.map((brand) => {
                  const isSelected = selectedAvailableIds.includes(brand._id);
                  return (
                    <div
                      key={brand._id}
                      onClick={() => {
                        setSelectedAvailableIds((prev) =>
                          isSelected ? prev.filter((id) => id !== brand._id) : [...prev, brand._id]
                        );
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition select-none ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                          : 'bg-[#111c2e]/60 hover:bg-[#111c2e] text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded accent-emerald-500 pointer-events-none"
                        />
                        <span>{brand.brandName}</span>
                      </div>
                      {brand.brandCode && (
                        <span className="text-[10px] font-mono text-slate-500 bg-[#0f172a] px-2 py-0.5 rounded">
                          {brand.brandCode}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Center Column: Transfer Buttons */}
          <div className="lg:col-span-1 flex lg:flex-col justify-center items-center gap-2">
            <button
              type="button"
              onClick={handleAssignSelected}
              disabled={selectedAvailableIds.length === 0}
              title="Assign Selected Brands"
              className="w-12 h-10 lg:w-10 lg:h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              »
            </button>
            <button
              type="button"
              onClick={handleRemoveSelected}
              disabled={selectedAssignedIds.length === 0}
              title="Remove Selected Brands"
              className="w-12 h-10 lg:w-10 lg:h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              «
            </button>
          </div>

          {/* Right Column: Assigned Brands */}
          <div className="lg:col-span-5 bg-[#0b1320] border border-[#1e293b] rounded-2xl flex flex-col h-[460px]">
            {/* List Header */}
            <div className="p-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#0e1726] rounded-t-2xl">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <span>Assigned Brands</span>
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                    {filteredAssigned.length}
                  </span>
                </h3>
                <span className="text-[10px] text-slate-500">Currently mapped to {selectedFranchise?.firmName || 'franchise'}</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveAll}
                disabled={filteredAssigned.length === 0}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-medium disabled:opacity-30"
              >
                « Remove All
              </button>
            </div>

            {/* Filter Search */}
            <div className="p-2.5 border-b border-[#1e293b]/60">
              <input
                type="text"
                placeholder="Search assigned brands..."
                value={searchAssigned}
                onChange={(e) => setSearchAssigned(e.target.value)}
                className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Scrollable Items */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredAssigned.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">
                  No brands assigned yet
                </div>
              ) : (
                filteredAssigned.map((brand) => {
                  const isSelected = selectedAssignedIds.includes(brand._id);
                  return (
                    <div
                      key={brand._id}
                      onClick={() => {
                        setSelectedAssignedIds((prev) =>
                          isSelected ? prev.filter((id) => id !== brand._id) : [...prev, brand._id]
                        );
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition select-none ${
                        isSelected
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold'
                          : 'bg-[#111c2e]/60 hover:bg-[#111c2e] text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-3.5 h-3.5 rounded accent-rose-500 pointer-events-none"
                        />
                        <span>{brand.brandName}</span>
                      </div>
                      {brand.brandCode && (
                        <span className="text-[10px] font-mono text-slate-500 bg-[#0f172a] px-2 py-0.5 rounded">
                          {brand.brandCode}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overview Table of All Franchise Brand Assignments */}
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Franchise Brand Allocation Matrix</h3>
            <p className="text-xs text-slate-400">All franchise partners and their assigned brand coverage</p>
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
                        onClick={() => setSelectedFranchiseId(row.franchiseId)}
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

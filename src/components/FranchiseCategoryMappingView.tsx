'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';
import CategoryMappingView from '@/components/CategoryMappingView';

interface FranchiseItem {
  _id: string;
  crmCode: string;
  firmName: string;
  city?: string;
  state?: string;
}

interface CategoryItem {
  _id: string;
  categoryCode?: string;
  categoryName: string;
}

export default function FranchiseCategoryMappingView({ currentUser }: { currentUser?: any }) {
  const [activeTab, setActiveTab] = useState<'franchise' | 'clientBrand'>('franchise');

  const [franchises, setFranchises] = useState<FranchiseItem[]>([]);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);

  // Dual-list state
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [assignedCategories, setAssignedCategories] = useState<CategoryItem[]>([]);
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

  useEffect(() => {
    loadFranchises();
    loadAllCategories();
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

  const loadAllCategories = async () => {
    try {
      const data = await fetchWithCache('/api/masters/categories');
      if (Array.isArray(data)) {
        setAllCategories(data);
      }
    } catch (e) {
      console.error('Error loading categories:', e);
    }
  };

  const loadAllMappingsSummary = async () => {
    try {
      const res = await fetch('/api/masters/mappings/franchise-categories');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllMappings(json.data);
      }
    } catch (e) {
      console.error('Error loading category mappings summary:', e);
    }
  };

  useEffect(() => {
    if (!selectedFranchiseId) return;
    loadFranchiseMapping(selectedFranchiseId);
  }, [selectedFranchiseId, allCategories]);

  const loadFranchiseMapping = async (franchiseId: string) => {
    setLoading(true);
    setMessage(null);
    setSelectedAvailableIds([]);
    setSelectedAssignedIds([]);
    try {
      const res = await fetch(`/api/masters/mappings/franchise-categories?franchiseId=${franchiseId}`);
      const json = await res.json();
      if (json.success && json.data) {
        const assigned: CategoryItem[] = json.data.assignedCategories || [];
        const available: CategoryItem[] = json.data.availableCategories || [];
        setAssignedCategories(assigned);
        setAvailableCategories(available);
        setOriginalAssignedIds(assigned.map((c) => c._id));
      }
    } catch (e) {
      console.error('Error loading franchise category mapping:', e);
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
    const toMove = availableCategories.filter((c) => selectedAvailableIds.includes(c._id));
    setAssignedCategories((prev) => [...prev, ...toMove].sort((a, b) => a.categoryName.localeCompare(b.categoryName)));
    setAvailableCategories((prev) => prev.filter((c) => !selectedAvailableIds.includes(c._id)));
    setSelectedAvailableIds([]);
  };

  const handleRemoveSelected = () => {
    if (selectedAssignedIds.length === 0) return;
    const toMove = assignedCategories.filter((c) => selectedAssignedIds.includes(c._id));
    setAvailableCategories((prev) => [...prev, ...toMove].sort((a, b) => a.categoryName.localeCompare(b.categoryName)));
    setAssignedCategories((prev) => prev.filter((c) => !selectedAssignedIds.includes(c._id)));
    setSelectedAssignedIds([]);
  };

  const handleAssignAll = () => {
    setAssignedCategories((prev) =>
      [...prev, ...filteredAvailable].sort((a, b) => a.categoryName.localeCompare(b.categoryName))
    );
    const assignedIdsSet = new Set(filteredAvailable.map((c) => c._id));
    setAvailableCategories((prev) => prev.filter((c) => !assignedIdsSet.has(c._id)));
    setSelectedAvailableIds([]);
  };

  const handleRemoveAll = () => {
    setAvailableCategories((prev) =>
      [...prev, ...filteredAssigned].sort((a, b) => a.categoryName.localeCompare(b.categoryName))
    );
    const removedIdsSet = new Set(filteredAssigned.map((c) => c._id));
    setAssignedCategories((prev) => prev.filter((c) => !removedIdsSet.has(c._id)));
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
      const res = await fetch('/api/masters/mappings/franchise-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          franchiseId: selectedFranchiseId,
          categoryIds: assignedCategories.map((c) => c._id),
          updatedBy: currentUser?.fullName || 'Super Admin',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ text: json.message || 'Mapping saved successfully!', type: 'success' });
        setOriginalAssignedIds(assignedCategories.map((c) => c._id));
        invalidateCache('/api/masters/mappings/franchise-categories');
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
    if (!searchAvailable.trim()) return availableCategories;
    const term = searchAvailable.toLowerCase();
    return availableCategories.filter(
      (c) => c.categoryName.toLowerCase().includes(term) || (c.categoryCode && c.categoryCode.toLowerCase().includes(term))
    );
  }, [availableCategories, searchAvailable]);

  const filteredAssigned = useMemo(() => {
    if (!searchAssigned.trim()) return assignedCategories;
    const term = searchAssigned.toLowerCase();
    return assignedCategories.filter(
      (c) => c.categoryName.toLowerCase().includes(term) || (c.categoryCode && c.categoryCode.toLowerCase().includes(term))
    );
  }, [assignedCategories, searchAssigned]);

  // Grouped summary for overview table
  const groupedSummary = useMemo(() => {
    const map = new Map<string, { franchiseCode: string; franchiseName: string; categories: string[]; franchiseId: string }>();
    allMappings.forEach((m) => {
      const fId = m.franchiseId?.toString();
      if (!map.has(fId)) {
        map.set(fId, {
          franchiseId: fId,
          franchiseCode: m.franchiseCode || 'FRN',
          franchiseName: m.franchiseName || 'Unknown Franchise',
          categories: [],
        });
      }
      map.get(fId)!.categories.push(m.categoryName);
    });

    let list = Array.from(map.values());
    if (tableSearch.trim()) {
      const t = tableSearch.toLowerCase();
      list = list.filter(
        (item) =>
          item.franchiseName.toLowerCase().includes(t) ||
          item.franchiseCode.toLowerCase().includes(t) ||
          item.categories.some((c) => c.toLowerCase().includes(t))
      );
    }
    return list;
  }, [allMappings, tableSearch]);

  const hasUnsavedChanges = useMemo(() => {
    const currentSet = new Set(assignedCategories.map((c) => c._id));
    const originalSet = new Set(originalAssignedIds);
    if (currentSet.size !== originalSet.size) return true;
    for (const id of Array.from(currentSet)) {
      if (!originalSet.has(id)) return true;
    }
    return false;
  }, [assignedCategories, originalAssignedIds]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-[#1e293b]">
        <button
          onClick={() => setActiveTab('franchise')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'franchise'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🏢 Franchise Category Mapping</span>
        </button>
        <button
          onClick={() => setActiveTab('clientBrand')}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
            activeTab === 'clientBrand'
              ? 'border-blue-500 text-blue-400 bg-blue-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🏷️ Client & Brand Category Mapping</span>
        </button>
      </div>

      {activeTab === 'clientBrand' ? (
        <CategoryMappingView />
      ) : (
        <>
          {/* Header Banner */}
          <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-white tracking-wide">Franchise Category Mapping</h1>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                  Category Master Linked
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Assign product categories to franchise partners from Category Master with dual-list selection.
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
              {/* Left Column: Available Categories */}
              <div className="lg:col-span-5 bg-[#0b1320] border border-[#1e293b] rounded-2xl flex flex-col h-[460px]">
                <div className="p-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#0e1726] rounded-t-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                      <span>Available Categories</span>
                      <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {filteredAvailable.length}
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-500">From Category Master</span>
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

                <div className="p-2.5 border-b border-[#1e293b]/60">
                  <input
                    type="text"
                    placeholder="Search available categories..."
                    value={searchAvailable}
                    onChange={(e) => setSearchAvailable(e.target.value)}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredAvailable.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No available categories
                    </div>
                  ) : (
                    filteredAvailable.map((cat) => {
                      const isSelected = selectedAvailableIds.includes(cat._id);
                      return (
                        <div
                          key={cat._id}
                          onClick={() => {
                            setSelectedAvailableIds((prev) =>
                              isSelected ? prev.filter((id) => id !== cat._id) : [...prev, cat._id]
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
                            <span>{cat.categoryName}</span>
                          </div>
                          {cat.categoryCode && (
                            <span className="text-[10px] font-mono text-slate-500 bg-[#0f172a] px-2 py-0.5 rounded">
                              {cat.categoryCode}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Center Transfer Buttons */}
              <div className="lg:col-span-1 flex lg:flex-col justify-center items-center gap-2">
                <button
                  type="button"
                  onClick={handleAssignSelected}
                  disabled={selectedAvailableIds.length === 0}
                  title="Assign Selected Categories"
                  className="w-12 h-10 lg:w-10 lg:h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  »
                </button>
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  disabled={selectedAssignedIds.length === 0}
                  title="Remove Selected Categories"
                  className="w-12 h-10 lg:w-10 lg:h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  «
                </button>
              </div>

              {/* Right Column: Assigned Categories */}
              <div className="lg:col-span-5 bg-[#0b1320] border border-[#1e293b] rounded-2xl flex flex-col h-[460px]">
                <div className="p-3.5 border-b border-[#1e293b] flex items-center justify-between bg-[#0e1726] rounded-t-2xl">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                      <span>Assigned Categories</span>
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {filteredAssigned.length}
                      </span>
                    </h3>
                    <span className="text-[10px] text-slate-500">Mapped to {selectedFranchise?.firmName || 'franchise'}</span>
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

                <div className="p-2.5 border-b border-[#1e293b]/60">
                  <input
                    type="text"
                    placeholder="Search assigned categories..."
                    value={searchAssigned}
                    onChange={(e) => setSearchAssigned(e.target.value)}
                    className="w-full bg-[#111c2e] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {filteredAssigned.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No categories assigned yet
                    </div>
                  ) : (
                    filteredAssigned.map((cat) => {
                      const isSelected = selectedAssignedIds.includes(cat._id);
                      return (
                        <div
                          key={cat._id}
                          onClick={() => {
                            setSelectedAssignedIds((prev) =>
                              isSelected ? prev.filter((id) => id !== cat._id) : [...prev, cat._id]
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
                            <span>{cat.categoryName}</span>
                          </div>
                          {cat.categoryCode && (
                            <span className="text-[10px] font-mono text-slate-500 bg-[#0f172a] px-2 py-0.5 rounded">
                              {cat.categoryCode}
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

          {/* Overview Table of All Franchise Category Assignments */}
          <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Franchise Category Allocation Matrix</h3>
                <p className="text-xs text-slate-400">All franchise partners and their assigned product category lines</p>
              </div>
              <input
                type="text"
                placeholder="Search franchise or category..."
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
                    <th className="py-3 px-4">Assigned Categories</th>
                    <th className="py-3 px-4 text-center">Total Categories</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b]/60">
                  {groupedSummary.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No category mappings configured yet.
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
                            {row.categories.map((cname: string, i: number) => (
                              <span
                                key={i}
                                className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[11px]"
                              >
                                {cname}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                          {row.categories.length}
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
        </>
      )}
    </div>
  );
}

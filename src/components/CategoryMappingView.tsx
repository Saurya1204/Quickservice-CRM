'use client';

import React, { useState, useEffect } from 'react';

interface ClientItem {
  _id: string;
  clientCode: string;
  clientName: string;
}

interface BrandItem {
  _id: string;
  brandCode: string;
  brandName: string;
}

interface CategoryItem {
  _id: string;
  categoryCode: string;
  categoryName: string;
  status?: string;
  description?: string;
}

export default function CategoryMappingView() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');

  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [assignedCategories, setAssignedCategories] = useState<CategoryItem[]>([]);
  const [allMasterCategories, setAllMasterCategories] = useState<CategoryItem[]>([]);

  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [selectedAssigned, setSelectedAssigned] = useState<string[]>([]);

  const [searchAvailable, setSearchAvailable] = useState('');
  const [searchAssigned, setSearchAssigned] = useState('');
  const [searchTable, setSearchTable] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchClients();
    fetchAllMasterCategories();
  }, []);

  const fetchAllMasterCategories = async () => {
    try {
      const res = await fetch('/api/masters/categories');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllMasterCategories(json.data);
      }
    } catch (e) {
      console.error('Error fetching master categories:', e);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/masters/clients');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setClients(json.data);
        setSelectedClientId(json.data[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!selectedClientId) return;
    fetchBrands(selectedClientId);
  }, [selectedClientId]);

  const fetchBrands = async (clientId: string) => {
    try {
      const res = await fetch(`/api/masters/brands?clientId=${clientId}`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setBrands(json.data);
        setSelectedBrandId(json.data[0]._id);
      } else {
        setBrands([]);
        setSelectedBrandId('');
        setAvailableCategories(allMasterCategories);
        setAssignedCategories([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!selectedClientId || !selectedBrandId) return;
    fetchMapping(selectedClientId, selectedBrandId);
  }, [selectedClientId, selectedBrandId]);

  const fetchMapping = async (clientId: string, brandId: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/masters/mappings/category?clientId=${clientId}&brandId=${brandId}`);
      const json = await res.json();
      if (json.success) {
        setAvailableCategories(json.data.availableCategories || []);
        setAssignedCategories(json.data.assignedCategories || []);
        setSelectedAvailable([]);
        setSelectedAssigned([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveRight = () => {
    if (selectedAvailable.length === 0) return;

    const toMove = availableCategories.filter((c) => selectedAvailable.includes(c._id));
    const remainingAvailable = availableCategories.filter((c) => !selectedAvailable.includes(c._id));

    setAvailableCategories(remainingAvailable);
    setAssignedCategories([...assignedCategories, ...toMove]);
    setSelectedAvailable([]);
  };

  const handleMoveLeft = () => {
    if (selectedAssigned.length === 0) return;

    const toMove = assignedCategories.filter((c) => selectedAssigned.includes(c._id));
    const remainingAssigned = assignedCategories.filter((c) => !selectedAssigned.includes(c._id));

    setAssignedCategories(remainingAssigned);
    setAvailableCategories([...availableCategories, ...toMove]);
    setSelectedAssigned([]);
  };

  const handleMoveAllRight = () => {
    if (availableCategories.length === 0) return;
    setAssignedCategories([...assignedCategories, ...availableCategories]);
    setAvailableCategories([]);
    setSelectedAvailable([]);
  };

  const handleMoveAllLeft = () => {
    if (assignedCategories.length === 0) return;
    setAvailableCategories([...availableCategories, ...assignedCategories]);
    setAssignedCategories([]);
    setSelectedAssigned([]);
  };

  // Quick toggle from the full table below
  const handleToggleCategory = (category: CategoryItem, shouldAssign: boolean) => {
    if (shouldAssign) {
      // Move from available to assigned
      setAvailableCategories((prev) => prev.filter((c) => c._id !== category._id));
      setAssignedCategories((prev) => {
        if (prev.some((c) => c._id === category._id)) return prev;
        return [...prev, category];
      });
      setSelectedAvailable((prev) => prev.filter((id) => id !== category._id));
    } else {
      // Move from assigned to available
      setAssignedCategories((prev) => prev.filter((c) => c._id !== category._id));
      setAvailableCategories((prev) => {
        if (prev.some((c) => c._id === category._id)) return prev;
        return [...prev, category];
      });
      setSelectedAssigned((prev) => prev.filter((id) => id !== category._id));
    }
  };

  const handleSave = async () => {
    if (!selectedClientId || !selectedBrandId) {
      setMessage({ text: 'Please select both Client and Brand!', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const assignedIds = assignedCategories.map((c) => c._id);
      const res = await fetch('/api/masters/mappings/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          brandId: selectedBrandId,
          assignedCategoryIds: assignedIds,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ text: 'Product Category Mapping saved successfully!', type: 'success' });
      } else {
        setMessage({ text: json.message || 'Failed to save mapping', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: 'Error saving mapping: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAbort = () => {
    if (selectedClientId && selectedBrandId) {
      fetchMapping(selectedClientId, selectedBrandId);
      setMessage({ text: 'Changes reverted to saved database state.', type: 'success' });
    }
  };

  // Compile combined list of all 10 categories
  const combinedCategoriesMap = new Map<string, CategoryItem>();
  allMasterCategories.forEach((c) => combinedCategoriesMap.set(c._id, c));
  availableCategories.forEach((c) => combinedCategoriesMap.set(c._id, c));
  assignedCategories.forEach((c) => combinedCategoriesMap.set(c._id, c));
  const fullCategoriesList = Array.from(combinedCategoriesMap.values()).sort((a, b) =>
    a.categoryCode.localeCompare(b.categoryCode)
  );

  const totalCategoriesCount = fullCategoriesList.length;
  const assignedIdsSet = new Set(assignedCategories.map((c) => c._id));

  const filteredAvailable = availableCategories.filter(
    (c) =>
      c.categoryName.toLowerCase().includes(searchAvailable.toLowerCase()) ||
      c.categoryCode.toLowerCase().includes(searchAvailable.toLowerCase())
  );
  const filteredAssigned = assignedCategories.filter(
    (c) =>
      c.categoryName.toLowerCase().includes(searchAssigned.toLowerCase()) ||
      c.categoryCode.toLowerCase().includes(searchAssigned.toLowerCase())
  );

  const filteredTable = fullCategoriesList.filter(
    (c) =>
      c.categoryName.toLowerCase().includes(searchTable.toLowerCase()) ||
      c.categoryCode.toLowerCase().includes(searchTable.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTable.toLowerCase()))
  );

  const selectedClient = clients.find((c) => c._id === selectedClientId);
  const selectedBrand = brands.find((b) => b._id === selectedBrandId);

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-6">
      {/* Header & Stats Banner */}
      <div className="border-b border-[#334155] pb-5 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center space-x-3 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide">Product Category Mapping</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-mono font-bold flex items-center space-x-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span>{totalCategoriesCount} Total Categories in Master</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Map appliance and electronics product categories to authorized Client & Brand service networks
          </p>
        </div>

        {/* Real-time Category Counter Pill Badges */}
        <div className="flex items-center space-x-2 text-xs flex-wrap gap-2">
          <div className="bg-[#172033] border border-[#334155] px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span className="text-slate-400">Total in Master:</span>
            <span className="text-white font-bold font-mono">{totalCategoriesCount}</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span>Available:</span>
            <span className="font-bold font-mono text-white">{availableCategories.length}</span>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center space-x-2">
            <span>Assigned:</span>
            <span className="font-bold font-mono text-white">{assignedCategories.length}</span>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-lg text-sm border font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span>{message.text}</span>
          <button
            onClick={() => setMessage(null)}
            className="text-xs text-slate-400 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      )}

      {/* Selectors Row: Client & Brand */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#172033] p-5 rounded-xl border border-[#334155]">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Client
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="">----Select Client----</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.clientCode} - {c.clientName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Brand
          </label>
          <select
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
            disabled={brands.length === 0}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            <option value="">----Select Brand----</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>
                {b.brandCode} - {b.brandName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dual List Box Mapping Section */}
      <div className="space-y-3">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Category Allocation for {selectedBrand?.brandName || 'Selected Brand'} (Click item or use buttons)
          </label>
          <span className="text-xs text-slate-400">
            Total active categories across both lists:{' '}
            <strong className="text-emerald-400 font-mono font-bold">{totalCategoriesCount}</strong>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 bg-[#172033] rounded-xl border border-[#334155]">
            <div className="inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-xs">Loading all category allocations from database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Left Box: Available Categories */}
            <div className="md:col-span-5 bg-[#172033] border border-[#334155] rounded-xl p-3.5 flex flex-col min-h-[460px]">
              <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-[#334155]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                    Available Categories
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {availableCategories.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleMoveAllRight}
                  disabled={availableCategories.length === 0}
                  className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-30 font-semibold transition"
                >
                  Assign All &gt;&gt;
                </button>
              </div>

              {/* Quick Search Available */}
              <input
                type="text"
                placeholder="Filter available categories..."
                value={searchAvailable}
                onChange={(e) => setSearchAvailable(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white mb-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />

              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
                {filteredAvailable.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    {availableCategories.length === 0
                      ? '✓ All 10 categories are assigned to this brand'
                      : 'No available categories match your filter'}
                  </div>
                ) : (
                  filteredAvailable.map((cat) => {
                    const isSelected = selectedAvailable.includes(cat._id);
                    return (
                      <div
                        key={cat._id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAvailable(selectedAvailable.filter((id) => id !== cat._id));
                          } else {
                            setSelectedAvailable([...selectedAvailable, cat._id]);
                          }
                        }}
                        onDoubleClick={() => {
                          setAvailableCategories((prev) => prev.filter((c) => c._id !== cat._id));
                          setAssignedCategories((prev) => [...prev, cat]);
                          setSelectedAvailable((prev) => prev.filter((id) => id !== cat._id));
                        }}
                        className={`px-3.5 py-2.5 rounded-lg text-xs cursor-pointer select-none transition flex items-center justify-between border ${
                          isSelected
                            ? 'bg-blue-600 text-white font-medium border-blue-400 shadow-md'
                            : 'bg-[#1e293b]/60 border-[#334155]/60 hover:bg-[#1e293b] hover:border-slate-500 text-slate-200'
                        }`}
                      >
                        <span className="font-medium">{cat.categoryName}</span>
                        <span className="text-[10px] font-mono bg-[#0f172a] px-2 py-0.5 rounded text-blue-300 border border-[#334155]">
                          {cat.categoryCode}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-[#334155]/60 text-[11px] text-slate-500 flex justify-between">
                <span>Tip: Double-click to assign</span>
                <span>{selectedAvailable.length} selected</span>
              </div>
            </div>

            {/* Middle Action Buttons */}
            <div className="md:col-span-1 flex md:flex-col justify-center items-center gap-3 py-2">
              <button
                type="button"
                onClick={handleMoveRight}
                disabled={selectedAvailable.length === 0}
                title="Assign Selected Categories"
                className="w-11 h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-25 disabled:hover:bg-blue-600 text-white font-bold rounded-xl transition flex items-center justify-center shadow-lg"
              >
                &gt;&gt;
              </button>
              <button
                type="button"
                onClick={handleMoveLeft}
                disabled={selectedAssigned.length === 0}
                title="Remove Selected Categories"
                className="w-11 h-11 bg-blue-600 hover:bg-blue-500 disabled:opacity-25 disabled:hover:bg-blue-600 text-white font-bold rounded-xl transition flex items-center justify-center shadow-lg"
              >
                &lt;&lt;
              </button>
            </div>

            {/* Right Box: Assigned Categories */}
            <div className="md:col-span-5 bg-[#172033] border border-[#334155] rounded-xl p-3.5 flex flex-col min-h-[460px]">
              <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-[#334155]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    Assigned Categories
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[11px] px-2 py-0.5 rounded-full font-bold">
                    {assignedCategories.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleMoveAllLeft}
                  disabled={assignedCategories.length === 0}
                  className="text-xs text-rose-400 hover:text-rose-300 disabled:opacity-30 font-semibold transition"
                >
                  &lt;&lt; Remove All
                </button>
              </div>

              {/* Quick Search Assigned */}
              <input
                type="text"
                placeholder="Filter assigned categories..."
                value={searchAssigned}
                onChange={(e) => setSearchAssigned(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white mb-2.5 focus:outline-none focus:border-emerald-500 placeholder-slate-500"
              />

              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
                {filteredAssigned.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    {assignedCategories.length === 0
                      ? 'No categories assigned to this brand yet'
                      : 'No assigned categories match your filter'}
                  </div>
                ) : (
                  filteredAssigned.map((cat) => {
                    const isSelected = selectedAssigned.includes(cat._id);
                    return (
                      <div
                        key={cat._id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAssigned(selectedAssigned.filter((id) => id !== cat._id));
                          } else {
                            setSelectedAssigned([...selectedAssigned, cat._id]);
                          }
                        }}
                        onDoubleClick={() => {
                          setAssignedCategories((prev) => prev.filter((c) => c._id !== cat._id));
                          setAvailableCategories((prev) => [...prev, cat]);
                          setSelectedAssigned((prev) => prev.filter((id) => id !== cat._id));
                        }}
                        className={`px-3.5 py-2.5 rounded-lg text-xs cursor-pointer select-none transition flex items-center justify-between border ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-medium border-emerald-400 shadow-md'
                            : 'bg-[#1e293b]/60 border-[#334155]/60 hover:bg-[#1e293b] hover:border-slate-500 text-slate-200'
                        }`}
                      >
                        <span className="font-medium">{cat.categoryName}</span>
                        <span className="text-[10px] font-mono bg-[#0f172a] px-2 py-0.5 rounded text-emerald-300 border border-[#334155]">
                          {cat.categoryCode}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-[#334155]/60 text-[11px] text-slate-500 flex justify-between">
                <span>Tip: Double-click to unassign</span>
                <span>{selectedAssigned.length} selected</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Footer Buttons for Dual Box */}
      <div className="flex flex-wrap justify-between items-center pt-4 border-t border-[#334155] gap-3">
        <div className="text-xs text-slate-400">
          Selected Service Line:{' '}
          <span className="text-white font-medium">{selectedClient?.clientName}</span> /{' '}
          <span className="text-emerald-400 font-semibold">{selectedBrand?.brandName}</span>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleAbort}
            disabled={loading || saving}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium text-xs px-5 py-2.5 rounded-lg transition"
          >
            Reset to Saved
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || loading || !selectedBrandId}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2.5 rounded-lg shadow-lg transition flex items-center space-x-2"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Category Mapping</span>
            )}
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE MASTER CATEGORY ALLOCATION TABLE (ALL 10 CATEGORIES) */}
      <div className="bg-[#172033] border border-[#334155] rounded-xl p-5 space-y-4 mt-6">
        <div className="flex flex-wrap justify-between items-center gap-3 pb-3 border-b border-[#334155]">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>Category Master vs Brand Mapping Matrix</span>
              <span className="text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                All {totalCategoriesCount} Categories Listed
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Instant one-click assignment table for all 10 categories in Category Master for{' '}
              <strong className="text-white">{selectedBrand?.brandName || 'Selected Brand'}</strong>
            </p>
          </div>

          <div className="w-full md:w-64">
            <input
              type="text"
              placeholder="Search category matrix..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#334155] text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3">#</th>
                <th className="p-3">Category Code</th>
                <th className="p-3">Category Name</th>
                <th className="p-3">Master Status</th>
                <th className="p-3">Brand Mapping Status</th>
                <th className="p-3 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/50">
              {filteredTable.map((cat, idx) => {
                const isAssigned = assignedIdsSet.has(cat._id);
                return (
                  <tr
                    key={cat._id}
                    className="hover:bg-[#1e293b]/70 transition-colors"
                  >
                    <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-400">
                      {cat.categoryCode}
                    </td>
                    <td className="p-3 text-white font-medium">
                      <div>{cat.categoryName}</div>
                      {cat.description && (
                        <div className="text-[10px] text-slate-400 font-normal">
                          {cat.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {cat.status === 'A' || cat.status === 'Active' ? 'Active' : cat.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-3">
                      {isAssigned ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5"></span>
                          Assigned to Brand
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-1.5"></span>
                          Available to Assign
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isAssigned ? (
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat, false)}
                          className="px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                          ✕ Remove
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat, true)}
                          className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                          + Assign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

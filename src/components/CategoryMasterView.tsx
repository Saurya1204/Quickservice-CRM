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
  clientId: string;
}

interface CategoryItem {
  _id: string;
  categoryCode: string;
  categoryName: string;
}

export default function CategoryMasterView() {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [allBrands, setAllBrands] = useState<BrandItem[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<BrandItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);

  // Category Assignments
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');

  // Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<CategoryItem[]>([]);

  // Dual-List internal selection state
  const [highlightedAvailable, setHighlightedAvailable] = useState<string[]>([]);
  const [highlightedSelected, setHighlightedSelected] = useState<string[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [clientRes, brandRes, catRes] = await Promise.all([
        fetch('/api/masters/clients'),
        fetch('/api/masters/brands'),
        fetch('/api/masters/categories'),
      ]);

      const clientJson = await clientRes.json();
      const brandJson = await brandRes.json();
      const catJson = await catRes.json();

      const activeClients = (clientJson.data || []).filter((c: any) => c.status === 'A');
      setClients(activeClients);

      const activeBrands = (brandJson.data || []).filter((b: any) => b.status === 'A');
      setAllBrands(activeBrands);

      const activeCats = (catJson.data || []).filter((c: any) => c.status === 'A');
      setAllCategories(activeCats);

      await fetchAllAssignments();
    } catch (e) {
      console.error('Error fetching category master data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAssignments = async () => {
    try {
      // Query all mappings
      const res = await fetch('/api/masters/mappings/category?clientId=all&brandId=all');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMappings(json.data);
      }
    } catch (e) {
      console.error('Error fetching assignments:', e);
    }
  };

  // When Client changes in Add Form
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedBrandId('');
    setSelectedCategories([]);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);

    if (!clientId) {
      setFilteredBrands([]);
      setAvailableCategories([]);
      return;
    }

    const matchedBrands = allBrands.filter((b) => b.clientId === clientId);
    setFilteredBrands(matchedBrands);
    setAvailableCategories(allCategories);
  };

  // When Brand changes in Add Form
  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);

    if (!selectedClientId || !brandId) {
      setSelectedCategories([]);
      setAvailableCategories(allCategories);
      return;
    }

    try {
      const res = await fetch(
        `/api/masters/mappings/category?clientId=${selectedClientId}&brandId=${brandId}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedCategories(json.data.assignedCategories || []);
        setAvailableCategories(json.data.availableCategories || []);
      } else {
        setSelectedCategories([]);
        setAvailableCategories(allCategories);
      }
    } catch (e) {
      console.error(e);
      setSelectedCategories([]);
      setAvailableCategories(allCategories);
    }
  };

  // Dual-List Move Right (Available -> Selected)
  const handleMoveRight = () => {
    if (highlightedAvailable.length === 0) return;
    const moving = availableCategories.filter((c) => highlightedAvailable.includes(c._id));
    setSelectedCategories((prev) => [...prev, ...moving]);
    setAvailableCategories((prev) => prev.filter((c) => !highlightedAvailable.includes(c._id)));
    setHighlightedAvailable([]);
  };

  // Dual-List Move Left (Selected -> Available)
  const handleMoveLeft = () => {
    if (highlightedSelected.length === 0) return;
    const moving = selectedCategories.filter((c) => highlightedSelected.includes(c._id));
    setAvailableCategories((prev) => [...prev, ...moving]);
    setSelectedCategories((prev) => prev.filter((c) => !highlightedSelected.includes(c._id)));
    setHighlightedSelected([]);
  };

  const handleOpenAdd = () => {
    setSelectedClientId('');
    setSelectedBrandId('');
    setFilteredBrands([]);
    setSelectedCategories([]);
    setAvailableCategories(allCategories);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);
    setShowAddForm(true);
  };

  const handleEditAssignment = (client: any, brand: any) => {
    setShowAddForm(true);
    handleClientChange(client._id);
    setTimeout(() => {
      handleBrandChange(brand._id);
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedBrandId) {
      alert('Please select both Client and Brand.');
      return;
    }
    if (selectedCategories.length === 0) {
      alert('Please assign at least one Product Category.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/masters/mappings/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          brandId: selectedBrandId,
          assignedCategoryIds: selectedCategories.map((c) => c._id),
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert('Product Category assignments saved successfully!');
        setShowAddForm(false);
        fetchInitialData();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Build listing rows
  const listingRows: any[] = [];
  allBrands.forEach((brand) => {
    const client = clients.find((c) => c._id === brand.clientId);
    if (!client) return;

    if (filterClient !== 'all' && client._id !== filterClient) return;
    if (filterBrand !== 'all' && brand._id !== filterBrand) return;

    const matchesSearch =
      !searchTerm ||
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.brandName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return;

    listingRows.push({
      client,
      brand,
    });
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111c2e] p-5 rounded-2xl border border-[#24344d]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-wide">Product Category Master</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {allCategories.length} Categories Configured
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Assign Product Categories to Client &amp; Brand Combinations with Dual-List Selection
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition active:scale-95"
        >
          <span>+</span>
          <span>ADD</span>
        </button>
      </div>

      {!showAddForm ? (
        /* Listing View */
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[260px]">
              <input
                type="text"
                placeholder="Search by client or brand name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Clients</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientName}
                  </option>
                ))}
              </select>

              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Brands</option>
                {allBrands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d1624] border-b border-[#24344d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Brand Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24344d]/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        Loading Category Assignments...
                      </td>
                    </tr>
                  ) : listingRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        No Client-Brand combinations found.
                      </td>
                    </tr>
                  ) : (
                    listingRows.map(({ client, brand }) => (
                      <tr key={`${client._id}_${brand._id}`} className="hover:bg-[#16233b]/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{client.clientName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{client.clientCode}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-blue-400">
                          {brand.brandName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            ACTIVE
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEditAssignment(client, brand)}
                              className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-medium transition"
                            >
                              Manage Categories (Dual-List)
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Add / Assign Category Form */
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#111c2e] p-6 rounded-2xl border border-[#24344d]">
          <div className="border-b border-[#24344d] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">ASSIGN PRODUCT CATEGORIES</h2>
              <p className="text-xs text-slate-400">
                Select Client and Brand, then use &gt;&gt; and &lt;&lt; to assign product categories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white text-sm"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Field A: Client Dropdown */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Client <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">---Select Client---</option>
                {clients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.clientName} ({c.clientCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Field B: Brand Dropdown */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Brand <span className="text-rose-400">*</span>
              </label>
              <select
                required
                disabled={!selectedClientId}
                value={selectedBrandId}
                onChange={(e) => handleBrandChange(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">---Select Brand---</option>
                {filteredBrands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Field C: Product Category Dual-List Selection */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Product Category Selection
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              {/* Left Side: Available Product Categories */}
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Available Product Categories ({availableCategories.length})
                </label>
                <select
                  multiple
                  size={9}
                  value={highlightedAvailable}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions, (o) => o.value);
                    setHighlightedAvailable(opts);
                  }}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono h-44"
                >
                  {availableCategories.map((c) => (
                    <option key={c._id} value={c._id} className="py-1 px-1.5 hover:bg-blue-600/30 rounded">
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Controls */}
              <div className="flex md:flex-col gap-2 justify-center py-2">
                <button
                  type="button"
                  onClick={handleMoveRight}
                  disabled={highlightedAvailable.length === 0}
                  title="Move to Selected Categories"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
                >
                  &gt;&gt;
                </button>
                <button
                  type="button"
                  onClick={handleMoveLeft}
                  disabled={highlightedSelected.length === 0}
                  title="Move to Available Categories"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
                >
                  &lt;&lt;
                </button>
              </div>

              {/* Right Side: Selected Product Categories */}
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Selected Product Categories ({selectedCategories.length})
                </label>
                <select
                  multiple
                  size={9}
                  value={highlightedSelected}
                  onChange={(e) => {
                    const opts = Array.from(e.target.selectedOptions, (o) => o.value);
                    setHighlightedSelected(opts);
                  }}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-emerald-400 focus:outline-none focus:border-blue-500 font-mono h-44"
                >
                  {selectedCategories.map((c) => (
                    <option key={c._id} value={c._id} className="py-1 px-1.5 hover:bg-emerald-600/30 rounded">
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Action Buttons: Save (Green), Abort (Yellow) */}
          <div className="flex items-center gap-3 justify-end pt-3 border-t border-[#24344d]">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition active:scale-95"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition active:scale-95"
            >
              Abort
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

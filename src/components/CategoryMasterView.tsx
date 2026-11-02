'use client';

import React, { useState, useEffect } from 'react';
import { getCachedData, fetchWithCache, invalidateCache } from '@/lib/clientCache';

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
  description?: string;
  status?: 'A' | 'I';
  createdAt?: string;
  updatedAt?: string;
}

interface CategoryMasterViewProps {
  currentUser?: any;
}

export default function CategoryMasterView({ currentUser }: CategoryMasterViewProps = {}) {
  // Role & Permissions Check
  const roleCode = (currentUser?.roleCode || currentUser?.role || 'SUPER_ADMIN');
  const isSuperAdmin = roleCode === 'SUPER_ADMIN' || currentUser?.role === 'Super Admin' || !currentUser;

  // Tabs: 'categories' (Category Catalogue) or 'mappings' (Client-Brand Category Assignments)
  const [activeTab, setActiveTab] = useState<'categories' | 'mappings'>('categories');

  // Master Data
  const [clients, setClients] = useState<ClientItem[]>(() => (getCachedData('/api/masters/clients')?.data || []).filter((c: any) => c.status === 'A'));
  const [allBrands, setAllBrands] = useState<BrandItem[]>(() => (getCachedData('/api/masters/brands')?.data || []).filter((b: any) => b.status === 'A'));
  const [filteredBrands, setFilteredBrands] = useState<BrandItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>(() => getCachedData('/api/masters/categories')?.data || []);

  // Category CRUD State
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryFilterStatus, setCategoryFilterStatus] = useState('all');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    categoryCode: '',
    categoryName: '',
    description: '',
    status: 'A' as 'A' | 'I',
  });
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Category Assignments (Mapping) State
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(() => !getCachedData('/api/masters/categories'));
  const [showAddForm, setShowAddForm] = useState(false);
  const [savingMapping, setSavingMapping] = useState(false);

  // Mapping Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');

  // Mapping Form State
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
    try {
      const [clientJson, brandJson, catJson] = await Promise.all([
        fetchWithCache('/api/masters/clients').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/brands').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/categories').catch(() => ({ data: [] })),
      ]);

      const activeClients = (clientJson.data || []).filter((c: any) => c.status === 'A');
      setClients(activeClients);

      const activeBrands = (brandJson.data || []).filter((b: any) => b.status === 'A');
      setAllBrands(activeBrands);

      const cats = catJson.data || [];
      setAllCategories(cats);

      await fetchAllAssignments();
    } catch (e) {
      console.error('Error fetching category master data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesList = async () => {
    try {
      const json = await fetchWithCache('/api/masters/categories', { forceRefresh: true });
      if (json.success && Array.isArray(json.data)) {
        setAllCategories(json.data);
      }
    } catch (e) {
      console.error('Error re-fetching categories:', e);
    }
  };

  const fetchAllAssignments = async () => {
    try {
      const res = await fetch('/api/masters/mappings/category?clientId=all&brandId=all');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMappings(json.data);
      }
    } catch (e) {
      console.error('Error fetching assignments:', e);
    }
  };

  // ==========================================
  // Category CRUD Operations
  // ==========================================

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      categoryCode: '',
      categoryName: '',
      description: '',
      status: 'A',
    });
    setCategoryMessage(null);
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCategoryFormData({
      categoryCode: cat.categoryCode || '',
      categoryName: cat.categoryName || '',
      description: cat.description || '',
      status: cat.status || 'A',
    });
    setCategoryMessage(null);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.categoryName.trim()) {
      alert('Please enter Category Name');
      return;
    }

    setCategorySaving(true);
    setCategoryMessage(null);

    try {
      if (editingCategory) {
        // PUT update
        const res = await fetch('/api/masters/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory._id,
            categoryCode: categoryFormData.categoryCode,
            categoryName: categoryFormData.categoryName,
            description: categoryFormData.description,
            status: categoryFormData.status,
          }),
        });
        const json = await res.json();
        if (json.success) {
          invalidateCache('/api/masters/categories');
          setAllCategories((prev) =>
            prev.map((c) => (c._id === editingCategory._id ? json.data : c))
          );
          setAvailableCategories((prev) =>
            prev.map((c) => (c._id === editingCategory._id ? json.data : c))
          );
          setSelectedCategories((prev) =>
            prev.map((c) => (c._id === editingCategory._id ? json.data : c))
          );
          setShowCategoryModal(false);
          setCategoryMessage({ type: 'success', text: `Category "${json.data.categoryName}" updated successfully!` });
          setTimeout(() => setCategoryMessage(null), 4000);
        } else {
          alert(json.message || 'Failed to update category');
        }
      } else {
        // POST create
        const res = await fetch('/api/masters/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryCode: categoryFormData.categoryCode,
            categoryName: categoryFormData.categoryName,
            description: categoryFormData.description,
            status: categoryFormData.status,
          }),
        });
        const json = await res.json();
        if (json.success) {
          invalidateCache('/api/masters/categories');
          setAllCategories((prev) => [json.data, ...prev]);
          setAvailableCategories((prev) => [json.data, ...prev]);
          setShowCategoryModal(false);
          setCategoryMessage({ type: 'success', text: `Category "${json.data.categoryName}" created successfully!` });
          setTimeout(() => setCategoryMessage(null), 4000);
        } else {
          alert(json.message || 'Failed to create category');
        }
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while saving category');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.categoryName}"?\n\nThis will permanently delete the category and remove it from any mapped products.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/masters/categories?id=${cat._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        invalidateCache('/api/masters/categories');
        setAllCategories((prev) => prev.filter((c) => c._id !== cat._id));
        setAvailableCategories((prev) => prev.filter((c) => c._id !== cat._id));
        setSelectedCategories((prev) => prev.filter((c) => c._id !== cat._id));
        setCategoryMessage({ type: 'success', text: `Category "${cat.categoryName}" deleted successfully!` });
        setTimeout(() => setCategoryMessage(null), 4000);
      } else {
        alert(json.message || 'Failed to delete category');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while deleting category');
    }
  };

  // Filtered Categories for Categories Tab
  const filteredCategoriesList = allCategories.filter((cat) => {
    const matchesSearch =
      !categorySearch ||
      cat.categoryName.toLowerCase().includes(categorySearch.toLowerCase()) ||
      cat.categoryCode.toLowerCase().includes(categorySearch.toLowerCase());
    const matchesStatus =
      categoryFilterStatus === 'all' ||
      (cat.status || 'A') === categoryFilterStatus;
    return matchesSearch && matchesStatus;
  });

  // ==========================================
  // Client-Brand Mapping Handlers
  // ==========================================

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
    setAvailableCategories(allCategories.filter((c) => c.status === 'A'));
  };

  // When Brand changes in Add Form
  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);

    const activeCats = allCategories.filter((c) => c.status === 'A');

    if (!selectedClientId || !brandId) {
      setSelectedCategories([]);
      setAvailableCategories(activeCats);
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
        setAvailableCategories(activeCats);
      }
    } catch (e) {
      console.error(e);
      setSelectedCategories([]);
      setAvailableCategories(activeCats);
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
    setAvailableCategories(allCategories.filter((c) => c.status === 'A'));
    setHighlightedAvailable([]);
    setHighlightedSelected([]);
    setShowAddForm(true);
  };

  const handleEditAssignment = (client: any, brand: any) => {
    setActiveTab('mappings');
    setShowAddForm(true);
    handleClientChange(client._id);
    setTimeout(() => {
      handleBrandChange(brand._id);
    }, 100);
  };

  const handleDeleteAssignment = async (client: any, brand: any) => {
    if (!window.confirm(`Are you sure you want to remove category mappings for ${client.clientName} - ${brand.brandName}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/masters/mappings/category?clientId=${client._id}&brandId=${brand._id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        alert('Product Category Mapping deleted successfully!');
        fetchInitialData();
      } else {
        alert(json.message || 'Failed to delete mapping');
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting assignment');
    }
  };

  const handleSubmitMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedBrandId) {
      alert('Please select both Client and Brand.');
      return;
    }
    if (selectedCategories.length === 0) {
      alert('Please assign at least one Product Category.');
      return;
    }

    setSavingMapping(true);
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
      setSavingMapping(false);
    }
  };

  // Build listing rows for Mappings Tab
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111c2e] p-4 sm:p-5 rounded-2xl border border-[#24344d]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">Product Category Master</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {allCategories.length} Categories Configured
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic Product Category Catalog management, Client &amp; Brand associations, and Dual-List configuration
          </p>
        </div>

        {/* Action Buttons depending on Active Tab */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'categories' ? (
            <button
              onClick={handleOpenAddCategory}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition active:scale-95"
            >
              <span>+</span>
              <span>ADD CATEGORY</span>
            </button>
          ) : (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition active:scale-95"
            >
              <span>+</span>
              <span>ASSIGN CATEGORIES</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#24344d] pb-2">
        <button
          onClick={() => {
            setActiveTab('categories');
            setShowAddForm(false);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#111c2e] text-slate-400 hover:text-white border border-[#24344d]'
          }`}
        >
          <span>📦</span>
          <span>Product Categories ({allCategories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mappings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'mappings'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-[#111c2e] text-slate-400 hover:text-white border border-[#24344d]'
          }`}
        >
          <span>🔗</span>
          <span>Client &amp; Brand Mappings ({listingRows.length})</span>
        </button>
      </div>

      {/* Success / Error notification */}
      {categoryMessage && (
        <div
          className={`px-4 py-3 rounded-xl text-xs font-medium border flex items-center justify-between ${
            categoryMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{categoryMessage.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{categoryMessage.text}</span>
          </div>
          <button onClick={() => setCategoryMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 1: PRODUCT CATEGORIES CATALOG (EDIT / DELETE / ADD)    */}
      {/* ========================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-[#111c2e] p-4 rounded-xl border border-[#24344d] flex flex-wrap gap-3 items-center justify-between">
            <div className="flex-1 min-w-[260px]">
              <input
                type="text"
                placeholder="Search categories by name or code (e.g., Air Conditioner, CAT001)..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilterStatus}
                onChange={(e) => setCategoryFilterStatus(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </select>
            </div>
          </div>

          {/* Categories Table */}
          <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden">
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-4 py-2.5 bg-[#0d1624]/80 border-b border-[#24344d]">
              <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                <span>↔</span> Scroll sideways to view all category properties and actions
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                Showing {filteredCategoriesList.length} of {allCategories.length} Categories
              </span>
            </div>

            <div className="overflow-x-auto custom-horizontal-scrollbar">
              <table className="w-full text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-[#0d1624] border-b border-[#24344d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4 whitespace-nowrap">Category Code</th>
                    <th className="py-3 px-4 whitespace-nowrap">Category Name</th>
                    <th className="py-3 px-4 whitespace-nowrap">Description / Remarks</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap">Created Date</th>
                    <th className="py-3 px-4 whitespace-nowrap text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24344d]/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Loading Categories...
                      </td>
                    </tr>
                  ) : filteredCategoriesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No product categories found matching your search. Click &quot;+ ADD CATEGORY&quot; to create one.
                      </td>
                    </tr>
                  ) : (
                    filteredCategoriesList.map((cat) => (
                      <tr key={cat._id} className="hover:bg-[#16233b]/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                          {cat.categoryCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                          {cat.categoryName}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {cat.description || <span className="text-slate-500 italic">No description provided</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cat.status === 'A' || !cat.status
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {cat.status === 'I' ? 'INACTIVE' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditCategory(cat)}
                              title="Edit Category"
                              className="flex items-center gap-1 px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-medium transition"
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat)}
                              title="Delete Category"
                              className="flex items-center gap-1 px-3 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-medium transition"
                            >
                              <span>🗑️</span>
                              <span>Delete</span>
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
      )}

      {/* ========================================================= */}
      {/* TAB 2: CLIENT-BRAND CATEGORY MAPPING (DUAL-LIST)           */}
      {/* ========================================================= */}
      {activeTab === 'mappings' && (
        <>
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
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-4 py-2 bg-[#0d1624]/80 border-b border-[#24344d]">
                  <span className="flex items-center gap-1.5 text-blue-400 font-medium">
                    <span>↔</span> Scroll sideways to view all columns
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    Total Combinations: {listingRows.length}
                  </span>
                </div>
                <div className="overflow-x-auto custom-horizontal-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className="bg-[#0d1624] border-b border-[#24344d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="py-3 px-4 whitespace-nowrap">Client Name</th>
                        <th className="py-3 px-4 whitespace-nowrap">Brand Name</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 whitespace-nowrap text-center">Actions</th>
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
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-semibold text-white">{client.clientName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{client.clientCode}</div>
                            </td>
                            <td className="py-3 px-4 font-semibold text-blue-400 whitespace-nowrap">
                              {brand.brandName}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ACTIVE
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditAssignment(client, brand)}
                                  className="px-3 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs font-medium transition"
                                >
                                  Manage Categories (Dual-List)
                                </button>
                                <button
                                  onClick={() => handleDeleteAssignment(client, brand)}
                                  title="Reset/Delete Assignment"
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-xs font-medium transition"
                                >
                                  Delete
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
            /* Add / Assign Category Form (Dual-List) */
            <form onSubmit={handleSubmitMapping} className="space-y-6 bg-[#111c2e] p-6 rounded-2xl border border-[#24344d]">
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
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Product Category Selection
                  </h3>
                  <button
                    type="button"
                    onClick={handleOpenAddCategory}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1"
                  >
                    <span>+</span> Add New Category to Database
                  </button>
                </div>

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
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono h-48 custom-horizontal-scrollbar"
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
                      className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg p-2 text-xs text-emerald-400 focus:outline-none focus:border-blue-500 font-mono h-48 custom-horizontal-scrollbar"
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
                  disabled={savingMapping}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition active:scale-95"
                >
                  {savingMapping ? 'Saving...' : 'Save'}
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
        </>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT CATEGORY (DYNAMIC CRUD)                  */}
      {/* ========================================================= */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#24344d] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{editingCategory ? '✏️ Edit Product Category' : '➕ Add New Product Category'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingCategory
                    ? `Updating "${editingCategory.categoryName}" (${editingCategory.categoryCode})`
                    : 'Create a new product category across system catalogues'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Air Conditioner, Refrigerator, Television..."
                  value={categoryFormData.categoryName}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryName: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Category Code <span className="text-slate-500">(Auto-generated if left blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., CAT019 or leave blank"
                  value={categoryFormData.categoryCode}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, categoryCode: e.target.value.toUpperCase() })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-emerald-400 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Description / Remarks
                </label>
                <textarea
                  rows={3}
                  placeholder="Optional details or specifications for this category..."
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Status
                </label>
                <select
                  value={categoryFormData.status}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, status: e.target.value as 'A' | 'I' })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="A">Active (A)</option>
                  <option value="I">Inactive (I)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#24344d]">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySaving}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition"
                >
                  {categorySaving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

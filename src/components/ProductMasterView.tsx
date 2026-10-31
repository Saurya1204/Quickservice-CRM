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

interface ProductItem {
  _id?: string;
  productCode?: string;
  productName: string;
}

export default function ProductMasterView() {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters for Listing
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Add Product Form State
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  // Dependent dropdown lists
  const [availableBrands, setAvailableBrands] = useState<BrandItem[]>([]);
  const [availableCategories, setAvailableCategories] = useState<CategoryItem[]>([]);

  // Dual-List Product State
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ProductItem[]>([]);
  const [highlightedAvailable, setHighlightedAvailable] = useState<string[]>([]);
  const [highlightedSelected, setHighlightedSelected] = useState<string[]>([]);

  // Quick custom product addition
  const [customProductName, setCustomProductName] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, clientRes, brandRes, catRes] = await Promise.all([
        fetch('/api/masters/products'),
        fetch('/api/masters/clients'),
        fetch('/api/masters/brands'),
        fetch('/api/masters/categories'),
      ]);

      const prodJson = await prodRes.json();
      const clientJson = await clientRes.json();
      const brandJson = await brandRes.json();
      const catJson = await catRes.json();

      setProducts(prodJson.data || []);
      setClients((clientJson.data || []).filter((c: any) => c.status === 'A'));
      setBrands((brandJson.data || []).filter((b: any) => b.status === 'A'));
      setCategories((catJson.data || []).filter((c: any) => c.status === 'A'));
    } catch (e) {
      console.error('Error fetching initial product master data:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsList = async () => {
    try {
      const res = await fetch('/api/masters/products');
      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dependency Rule: Client changes -> Reset Brand, Category, Dual Lists
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedBrandId('');
    setSelectedCategoryId('');
    setAvailableCategories([]);
    setAvailableProducts([]);
    setSelectedProducts([]);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);

    if (!clientId) {
      setAvailableBrands([]);
      return;
    }

    const matchedBrands = brands.filter((b) => b.clientId === clientId);
    setAvailableBrands(matchedBrands);
  };

  // Dependency Rule: Brand changes -> Reset Category, Dual Lists, fetch mapped categories
  const handleBrandChange = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedCategoryId('');
    setAvailableProducts([]);
    setSelectedProducts([]);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);

    if (!selectedClientId || !brandId) {
      setAvailableCategories([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/masters/mappings/category?clientId=${selectedClientId}&brandId=${brandId}`
      );
      const json = await res.json();
      if (json.success && json.data && json.data.assignedCategories) {
        setAvailableCategories(json.data.assignedCategories);
      } else {
        // Fallback to all categories if not explicitly mapped
        setAvailableCategories(categories);
      }
    } catch (e) {
      console.error(e);
      setAvailableCategories(categories);
    }
  };

  // Dependency Rule: Category changes -> Fetch available & assigned products
  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);

    if (!selectedClientId || !selectedBrandId || !categoryId) {
      setAvailableProducts([]);
      setSelectedProducts([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/masters/products/available?clientId=${selectedClientId}&brandId=${selectedBrandId}&categoryId=${categoryId}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setAvailableProducts(json.data.available || []);
        setSelectedProducts(json.data.assigned || []);
      } else {
        setAvailableProducts([]);
        setSelectedProducts([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Dual-List Move Right
  const handleMoveRight = () => {
    if (highlightedAvailable.length === 0) return;
    const moving = availableProducts.filter((p) => highlightedAvailable.includes(p.productName));
    setSelectedProducts((prev) => [...prev, ...moving]);
    setAvailableProducts((prev) => prev.filter((p) => !highlightedAvailable.includes(p.productName)));
    setHighlightedAvailable([]);
  };

  // Dual-List Move Left
  const handleMoveLeft = () => {
    if (highlightedSelected.length === 0) return;
    const moving = selectedProducts.filter((p) => highlightedSelected.includes(p.productName));
    setAvailableProducts((prev) => [...prev, ...moving]);
    setSelectedProducts((prev) => prev.filter((p) => !highlightedSelected.includes(p.productName)));
    setHighlightedSelected([]);
  };

  // Add custom product on the fly
  const handleAddCustomProduct = () => {
    const trimmed = customProductName.trim();
    if (!trimmed) return;
    const exists =
      availableProducts.some((p) => p.productName.toLowerCase() === trimmed.toLowerCase()) ||
      selectedProducts.some((p) => p.productName.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      alert('This product name already exists in the lists.');
      return;
    }
    setSelectedProducts((prev) => [...prev, { productName: trimmed }]);
    setCustomProductName('');
  };

  const handleOpenAdd = () => {
    setSelectedClientId('');
    setSelectedBrandId('');
    setSelectedCategoryId('');
    setAvailableBrands([]);
    setAvailableCategories([]);
    setAvailableProducts([]);
    setSelectedProducts([]);
    setHighlightedAvailable([]);
    setHighlightedSelected([]);
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove product "${name}"?`)) return;
    try {
      const res = await fetch(`/api/masters/products?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchProductsList();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedBrandId || !selectedCategoryId) {
      alert('Client, Brand, and Category are mandatory.');
      return;
    }
    if (selectedProducts.length === 0) {
      alert('Please select at least one Product.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/masters/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          brandId: selectedBrandId,
          categoryId: selectedCategoryId,
          assignedProducts: selectedProducts,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert('Products assigned successfully!');
        setShowAddForm(false);
        fetchProductsList();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      (p.productName && p.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.productCode && p.productCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.clientName && p.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.brandName && p.brandName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.categoryName && p.categoryName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesClient = filterClient === 'all' || p.clientId === filterClient;
    const matchesBrand = filterBrand === 'all' || p.brandId === filterBrand;
    const matchesCategory = filterCategory === 'all' || p.categoryId === filterCategory;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

    return matchesSearch && matchesClient && matchesBrand && matchesCategory && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111c2e] p-5 rounded-2xl border border-[#24344d]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-wide">PRODUCTS</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {filteredProducts.length} Product Assignments
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            SKUs &amp; Product Models Classified by Client &gt; Brand &gt; Product Category
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
                placeholder="Search by product name, code, brand, category..."
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
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.brandName}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="A">Active</option>
                <option value="I">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#111c2e] rounded-xl border border-[#24344d] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d1624] border-b border-[#24344d] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Product ID</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Brand Name</th>
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24344d]/60 text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Loading Products...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No products found. Click &quot;+ ADD&quot; to assign products.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p._id} className="hover:bg-[#16233b]/50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          {p.productCode}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">{p.productName}</td>
                        <td className="py-3 px-4 text-slate-300">{p.clientName || '-'}</td>
                        <td className="py-3 px-4 text-blue-400 font-medium">{p.brandName || '-'}</td>
                        <td className="py-3 px-4 text-amber-300 font-medium">{p.categoryName || '-'}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'A'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {p.status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDeleteProduct(p._id, p.productName)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-medium transition"
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
        /* ADD PRODUCT FORM */
        <form onSubmit={handleSubmit} className="space-y-6 bg-[#111c2e] p-6 rounded-2xl border border-[#24344d]">
          <div className="border-b border-[#24344d] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">ADD PRODUCT</h2>
              <p className="text-xs text-slate-400">
                Select Client &gt; Brand &gt; Category, then move products using &gt;&gt; and &lt;&lt;.
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

          {/* Step 1: 3-Tier Hierarchy Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
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
                {availableBrands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.brandName}
                  </option>
                ))}
              </select>
            </div>

            {/* Field C: Category Dropdown */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                required
                disabled={!selectedBrandId}
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">---Select Category---</option>
                {availableCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Custom Product Entry */}
          {selectedCategoryId && (
            <div className="bg-[#0d1624] p-3 rounded-xl border border-[#24344d] flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                New Product SKU:
              </span>
              <input
                type="text"
                placeholder="Type new product SKU name and click Add..."
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                className="flex-1 bg-[#111c2e] border border-[#24344d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustomProduct}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
              >
                + Add to List
              </button>
            </div>
          )}

          {/* Field D: Product Dual-List Selection */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
              Product Selection (Dual List)
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full">
              {/* Left Side: Available Products */}
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Available Products ({availableProducts.length})
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
                  {availableProducts.map((p, idx) => (
                    <option key={`${p.productName}_${idx}`} value={p.productName} className="py-1 px-1.5 hover:bg-blue-600/30 rounded">
                      {p.productName}
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
                  title="Move to Selected Products"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
                >
                  &gt;&gt;
                </button>
                <button
                  type="button"
                  onClick={handleMoveLeft}
                  disabled={highlightedSelected.length === 0}
                  title="Move to Available Products"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold rounded shadow transition"
                >
                  &lt;&lt;
                </button>
              </div>

              {/* Right Side: Selected Products */}
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Selected Products ({selectedProducts.length})
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
                  {selectedProducts.map((p, idx) => (
                    <option key={`${p.productName}_${idx}`} value={p.productName} className="py-1 px-1.5 hover:bg-emerald-600/30 rounded">
                      {p.productName}
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

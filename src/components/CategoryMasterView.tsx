'use client';

import React, { useState, useEffect } from 'react';

interface CategoryItem {
  _id: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  status: string;
  createdAt: string;
}

export default function CategoryMasterView() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [categoryName, setCategoryName] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/masters/categories');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    setSubmitting(true);
    try {
      if (editingCategory) {
        const res = await fetch('/api/masters/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCategory._id, categoryName, categoryCode, description }),
        });
        const json = await res.json();
        if (json.success) {
          setFeedback('Category updated successfully!');
          setCategoryName('');
          setCategoryCode('');
          setDescription('');
          setEditingCategory(null);
          setShowAddForm(false);
          fetchCategories();
        } else {
          setFeedback(json.message || 'Error updating category');
        }
      } else {
        const res = await fetch('/api/masters/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryName, categoryCode, description }),
        });
        const json = await res.json();
        if (json.success) {
          setFeedback('Category created successfully!');
          setCategoryName('');
          setCategoryCode('');
          setDescription('');
          setShowAddForm(false);
          fetchCategories();
        } else {
          setFeedback(json.message || 'Error creating category');
        }
      }
    } catch (err: any) {
      setFeedback(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (c: any) => {
    setEditingCategory(c);
    setCategoryName(c.categoryName);
    setCategoryCode(c.categoryCode);
    setDescription(c.description || '');
    setShowAddForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;

    try {
      const res = await fetch(`/api/masters/categories?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.categoryCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Category List */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#334155] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Category Master</span>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                {categories.length} total
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage appliance, IT & electronics product categories</p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#172033] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-full sm:w-48"
            />
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-medium transition whitespace-nowrap shadow-lg"
            >
              {showAddForm ? '✕ Close Form' : '+ ADD CATEGORY'}
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg">
            {feedback}
          </div>
        )}

        {/* Add / Edit Category Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-[#172033] border border-[#334155] p-4 rounded-xl space-y-4 mb-4">
            <h3 className="text-sm font-semibold text-emerald-400">
              {editingCategory ? 'Edit Product Category' : 'Add New Product Category'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Microwave Oven"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Category Code (Optional)</label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={categoryCode}
                  onChange={(e) => setCategoryCode(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs px-5 py-2 rounded-lg font-medium transition shadow-lg"
              >
                {submitting ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        )}

        {/* Categories Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading categories...</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#172033] text-xs uppercase text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="p-3">Category Code</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No categories found
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-emerald-400 font-mono text-xs">{c.categoryCode}</td>
                      <td className="p-3 font-semibold text-white">{c.categoryName}</td>
                      <td className="p-3 text-slate-400 text-xs">{c.description || '—'}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs border border-emerald-500/20">
                          Active
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.categoryName)}
                          className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

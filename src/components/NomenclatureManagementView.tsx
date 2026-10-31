'use client';

import React, { useState, useEffect } from 'react';

interface INomenclatureItem {
  _id: string;
  moduleName: string;
  entityName: string;
  prefix: string;
  separator: string;
  startingSequence: number;
  currentSequence: number;
  numberPadding: number;
  generatedCodeFormat: string;
  status: 'Active' | 'Inactive';
  nextPreview?: string;
  updatedBy?: string;
  updatedAt?: string;
  auditLogs?: Array<{
    previousPrefix: string;
    newPrefix: string;
    previousSequence: number;
    newSequence: number;
    changedBy: string;
    changeDate: string;
    reason?: string;
    affectedModule?: string;
  }>;
}

interface NomenclatureManagementViewProps {
  currentUser?: any;
}

export default function NomenclatureManagementView({ currentUser }: NomenclatureManagementViewProps) {
  const roleCode = (currentUser?.roleCode || currentUser?.role || 'SUPER_ADMIN')
    .toUpperCase()
    .replace(/\s+/g, '_');
  const isSuperAdmin = roleCode === 'SUPER_ADMIN' || currentUser?.role === 'Super Admin';

  const [nomenclatures, setNomenclatures] = useState<INomenclatureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [editingItem, setEditingItem] = useState<INomenclatureItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    moduleName: '',
    entityName: '',
    prefix: '',
    separator: '',
    startingSequence: 1,
    currentSequence: 0,
    numberPadding: 3,
    status: 'Active' as 'Active' | 'Inactive',
    reason: '',
  });

  // Audit history modal
  const [historyItem, setHistoryItem] = useState<INomenclatureItem | null>(null);

  // Migration modal
  const [migrationModalOpen, setMigrationModalOpen] = useState(false);
  const [migrationPreview, setMigrationPreview] = useState<any[]>([]);
  const [migrating, setMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchNomenclatures();
  }, []);

  const fetchNomenclatures = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nomenclature');
      const json = await res.json();
      if (json.success) {
        setNomenclatures(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setIsNew(true);
    setEditForm({
      moduleName: '',
      entityName: '',
      prefix: '',
      separator: '',
      startingSequence: 1,
      currentSequence: 0,
      numberPadding: 3,
      status: 'Active',
      reason: 'New nomenclature initialization',
    });
    setEditingItem({} as INomenclatureItem);
  };

  const handleOpenEdit = (item: INomenclatureItem) => {
    setIsNew(false);
    setEditingItem(item);
    setEditForm({
      moduleName: item.moduleName,
      entityName: item.entityName,
      prefix: item.prefix,
      separator: item.separator || '',
      startingSequence: item.startingSequence || 1,
      currentSequence: item.currentSequence || 0,
      numberPadding: item.numberPadding || 3,
      status: item.status || 'Active',
      reason: '',
    });
  };

  const calculatePreview = (prefix: string, sep: string, seq: number, pad: number) => {
    const num = String(Math.max(seq, 1)).padStart(pad, '0');
    return `${prefix}${sep}${num}`;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.prefix) {
      alert('Prefix is required');
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const res = await fetch('/api/nomenclature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...editForm,
            createdBy: currentUser?.name || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          setEditingItem(null);
          fetchNomenclatures();
        } else {
          alert(json.message);
        }
      } else if (editingItem) {
        const res = await fetch('/api/nomenclature', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem._id,
            ...editForm,
            updatedBy: currentUser?.name || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          setEditingItem(null);
          fetchNomenclatures();
        } else {
          alert(json.message);
        }
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: INomenclatureItem) => {
    try {
      const res = await fetch(`/api/nomenclature?id=${item._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchNomenclatures();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenMigration = async () => {
    setMigrationModalOpen(true);
    setMigrationMessage(null);
    try {
      const res = await fetch('/api/nomenclature/migrate');
      const json = await res.json();
      if (json.success) {
        setMigrationPreview(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteMigration = async () => {
    if (!confirm('Are you sure you want to standardize existing Client IDs to QSCL? All references will be preserved.')) return;
    setMigrating(true);
    try {
      const res = await fetch('/api/nomenclature/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ performedBy: currentUser?.name || 'Super Admin' }),
      });
      const json = await res.json();
      if (json.success) {
        setMigrationMessage(json.message);
        fetchNomenclatures();
        const refRes = await fetch('/api/nomenclature/migrate');
        const refJson = await refRes.json();
        setMigrationPreview(refJson.data || []);
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setMigrating(false);
    }
  };

  const filtered = nomenclatures.filter((item) => {
    const matchSearch =
      item.moduleName.toLowerCase().includes(search.toLowerCase()) ||
      item.entityName.toLowerCase().includes(search.toLowerCase()) ||
      item.prefix.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  if (!isSuperAdmin) {
    return (
      <div className="bg-[#1e293b] border border-rose-500/30 rounded-xl p-8 text-center space-y-3 shadow-xl">
        <div className="text-4xl text-rose-400">🔒</div>
        <h2 className="text-lg font-bold text-white">Super Admin Access Required</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Nomenclature Management configures system-wide code generation rules and prefix nomenclature.
          This section is strictly restricted to Super Administrators.
        </p>
      </div>
    );
  }

  const clientItem = nomenclatures.find((n) => n.entityName === 'Client');

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚙️</span>
            <div>
              <h1 className="text-base font-bold text-white tracking-wide uppercase">
                NOMENCLATURE MANAGEMENT
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized prefix, sequence generation & audit control across all CRM masters & modules
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleOpenMigration}
              className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold px-4 py-2 rounded shadow transition flex items-center space-x-2"
            >
              <span>🔄</span>
              <span>Client ID Migration (QSCL)</span>
            </button>
            <button
              onClick={handleOpenAdd}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded shadow transition flex items-center space-x-1.5"
            >
              <span>+</span>
              <span>Add Nomenclature</span>
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-[#334155]/60 bg-[#0f172a]/40">
          <div className="bg-[#172033] p-3 rounded-lg border border-[#334155]">
            <span className="text-[11px] text-slate-400 uppercase font-medium">Total Entities</span>
            <p className="text-xl font-bold text-white mt-1">{nomenclatures.length}</p>
          </div>
          <div className="bg-[#172033] p-3 rounded-lg border border-[#334155]">
            <span className="text-[11px] text-emerald-400 uppercase font-medium">Active Rules</span>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {nomenclatures.filter((n) => n.status === 'Active').length}
            </p>
          </div>
          <div className="bg-[#172033] p-3 rounded-lg border border-[#334155]">
            <span className="text-[11px] text-blue-400 uppercase font-medium">Standard Client Prefix</span>
            <p className="text-xl font-mono font-bold text-blue-400 mt-1">
              {clientItem ? clientItem.prefix : 'QSCL'}
            </p>
          </div>
          <div className="bg-[#172033] p-3 rounded-lg border border-[#334155]">
            <span className="text-[11px] text-amber-400 uppercase font-medium">Client Next Code</span>
            <p className="text-xl font-mono font-bold text-amber-400 mt-1">
              {clientItem?.nextPreview || 'QSCL004'}
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3 flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by module, entity or prefix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Table Listing */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading nomenclatures...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No nomenclature rules match your search.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-[11px] uppercase tracking-wider text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="p-3">Module / Section</th>
                  <th className="p-3">Entity Name</th>
                  <th className="p-3">Current Prefix</th>
                  <th className="p-3">Separator</th>
                  <th className="p-3">Current Seq</th>
                  <th className="p-3">Padding</th>
                  <th className="p-3">Preview (Next Code)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {filtered.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-semibold text-white">{item.moduleName}</td>
                    <td className="p-3 text-slate-200">{item.entityName}</td>
                    <td className="p-3 font-mono font-bold text-emerald-400">{item.prefix}</td>
                    <td className="p-3 font-mono text-slate-400">{item.separator || '(none)'}</td>
                    <td className="p-3 font-mono text-slate-300">{item.currentSequence}</td>
                    <td className="p-3 text-slate-400">{item.numberPadding} digits</td>
                    <td className="p-3">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded font-mono font-bold text-[11px]">
                        {item.nextPreview}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 px-3 py-1 rounded text-xs transition font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setHistoryItem(item)}
                        className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded text-xs transition font-medium"
                        title="View Audit History"
                      >
                        History ({item.auditLogs?.length || 0})
                      </button>
                      <button
                        onClick={() => handleToggleStatus(item)}
                        className={`border px-2.5 py-1 rounded text-xs transition font-medium ${
                          item.status === 'Active'
                            ? 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {item.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-sm font-bold text-white">
                {isNew ? 'Create New Nomenclature' : `Edit Nomenclature: ${editingItem.entityName}`}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Module Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.moduleName}
                    onChange={(e) => setEditForm({ ...editForm, moduleName: e.target.value })}
                    placeholder="e.g. Client Master"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Entity Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.entityName}
                    onChange={(e) => setEditForm({ ...editForm, entityName: e.target.value })}
                    placeholder="e.g. Client"
                    disabled={!isNew}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Prefix *</label>
                  <input
                    type="text"
                    required
                    value={editForm.prefix}
                    onChange={(e) => setEditForm({ ...editForm, prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g. QSCL"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Separator</label>
                  <input
                    type="text"
                    value={editForm.separator}
                    onChange={(e) => setEditForm({ ...editForm, separator: e.target.value })}
                    placeholder="e.g. - or empty"
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Padding (Digits)</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={editForm.numberPadding}
                    onChange={(e) => setEditForm({ ...editForm, numberPadding: parseInt(e.target.value, 10) || 3 })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Starting Sequence</label>
                  <input
                    type="number"
                    min={1}
                    value={editForm.startingSequence}
                    onChange={(e) => setEditForm({ ...editForm, startingSequence: parseInt(e.target.value, 10) || 1 })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Current Sequence</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.currentSequence}
                    onChange={(e) => setEditForm({ ...editForm, currentSequence: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Reason for Configuration Change</label>
                <input
                  type="text"
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="e.g. Standardize prefix to QSCL"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              {/* Dynamic Live Preview Box */}
              <div className="p-3 bg-[#0f172a] border border-emerald-500/40 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Next Code Preview</span>
                  <p className="text-sm font-mono font-bold text-emerald-400">
                    {calculatePreview(
                      editForm.prefix,
                      editForm.separator,
                      Math.max(editForm.currentSequence + 1, editForm.startingSequence),
                      editForm.numberPadding
                    )}
                  </p>
                </div>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  Format: {editForm.prefix}{editForm.separator || ''}{'{NUMBER}'}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-2 rounded font-semibold shadow"
                >
                  {saving ? 'Saving...' : 'Save Nomenclature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History / Audit Log Modal */}
      {historyItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Audit History: {historyItem.entityName} ({historyItem.moduleName})
                </h3>
                <p className="text-xs text-slate-400">Traceable audit logs of all configuration changes</p>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 text-xs">
              {!historyItem.auditLogs || historyItem.auditLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No configuration audit history recorded yet.</div>
              ) : (
                historyItem.auditLogs.map((log, idx) => (
                  <div key={idx} className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-semibold text-emerald-400">
                        {log.previousPrefix} → {log.newPrefix}
                      </span>
                      <span className="text-slate-400">
                        {new Date(log.changeDate).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      Sequence: <span className="font-mono text-white">{log.previousSequence}</span> →{' '}
                      <span className="font-mono text-white">{log.newSequence}</span> • Changed by:{' '}
                      <span className="text-blue-400">{log.changedBy}</span>
                    </div>
                    {log.reason && (
                      <p className="text-slate-400 italic text-[11px]">Reason: {log.reason}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => setHistoryItem(null)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Migration Modal */}
      {migrationModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Client ID Standardization & Migration</h3>
                <p className="text-xs text-slate-400">
                  Standardize legacy prefixes (CDCL, QSC) to QSCL while preserving historical records
                </p>
              </div>
              <button
                onClick={() => setMigrationModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {migrationMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded text-xs">
                {migrationMessage}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded text-xs">
                <strong>Migration Rules:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px] text-slate-300">
                  <li>Original legacy IDs are permanently preserved in the <span className="font-mono text-emerald-400">legacyClientCode</span> field.</li>
                  <li>New Client IDs will follow the standardized <span className="font-mono text-emerald-400">QSCL001</span> sequence.</li>
                  <li>All referenced Brand, Product and Service Call records will be updated automatically.</li>
                  <li>Concurrency-safe atomic numbering guarantees no duplicate IDs.</li>
                </ul>
              </div>

              <div className="border border-[#334155] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#172033] text-[10px] uppercase text-slate-400 border-b border-[#334155]">
                    <tr>
                      <th className="p-2.5">Client Name</th>
                      <th className="p-2.5">Current Legacy Code</th>
                      <th className="p-2.5">Proposed QSCL Standard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {migrationPreview.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-slate-400">
                          All Client records are already standardized to QSCL! No legacy records pending.
                        </td>
                      </tr>
                    ) : (
                      migrationPreview.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-medium text-white">{item.clientName}</td>
                          <td className="p-2.5 font-mono text-amber-400">{item.currentCode}</td>
                          <td className="p-2.5 font-mono text-emerald-400 font-bold">
                            {item.proposedStandardCode}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-[#334155]">
              <button
                type="button"
                onClick={() => setMigrationModalOpen(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-xs"
              >
                Close
              </button>
              {migrationPreview.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteMigration}
                  disabled={migrating}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-2 rounded text-xs font-semibold shadow"
                >
                  {migrating ? 'Migrating...' : 'Execute Migration to QSCL'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { SYSTEM_MODULES, SystemModuleConfig } from '@/lib/rbac';
import MasterDocumentModal, { UploadDocumentButton } from '@/components/common/MasterDocumentModal';

export default function RoleMasterView({ currentUser }: { currentUser?: any }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<any | null>(null);
  const [permissionsState, setPermissionsState] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Role Form
  const [roleForm, setRoleForm] = useState({
    name: '',
    code: '',
    hierarchyLevel: 5,
    reportingTo: '',
    description: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roles');
      const json = await res.json();
      if (json.success) {
        setRoles(json.data);
      }
    } catch (e) {
      console.error('Error fetching roles:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      code: '',
      hierarchyLevel: 5,
      reportingTo: 'SUPER_ADMIN',
      description: '',
      status: 'ACTIVE',
    });
    setShowRoleModal(true);
  };

  const handleOpenEditRole = (role: any) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      code: role.code,
      hierarchyLevel: role.hierarchyLevel || 5,
      reportingTo: role.reportingTo || '',
      description: role.description || '',
      status: role.status || 'ACTIVE',
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim() || !roleForm.code.trim()) {
      alert('Role Name and Code are mandatory.');
      return;
    }

    setSaving(true);
    try {
      if (editingRole) {
        const res = await fetch('/api/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingRole._id,
            ...roleForm,
            updatedBy: currentUser?.fullName || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          setShowRoleModal(false);
          fetchRoles();
          alert('Role updated successfully!');
        } else {
          alert(json.message);
        }
      } else {
        const res = await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...roleForm,
            createdBy: currentUser?.fullName || 'Super Admin',
          }),
        });
        const json = await res.json();
        if (json.success) {
          setShowRoleModal(false);
          fetchRoles();
          alert('Role created successfully!');
        } else {
          alert(json.message);
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (role: any) => {
    if (role.isSystem && role.code === 'SUPER_ADMIN') {
      alert('Super Admin role cannot be deactivated.');
      return;
    }
    const newStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: role._id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchRoles();
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteRole = async (role: any) => {
    if (role.isSystem) {
      alert('System roles cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) return;

    try {
      const res = await fetch(`/api/roles?id=${role._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchRoles();
        alert('Role deleted successfully.');
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Permission Configuration Modal
  const handleOpenPermissions = (role: any) => {
    setSelectedRoleForPerms(role);

    // Merge existing role permissions with system modules
    const merged = SYSTEM_MODULES.map((mod) => {
      const found = (role.permissions || []).find((p: any) => p.module === mod.key);
      const accessLevel = found ? found.accessLevel || 'NO_ACCESS' : 'NO_ACCESS';
      const actions = found?.actions || {
        create: false,
        read: false,
        update: false,
        delete: false,
        export: false,
        approve: false,
        reopenCall: false,
        uploadDocs: false,
        downloadDocs: false,
      };
      const subSections: Record<string, boolean> = {};
      if (mod.subSections) {
        mod.subSections.forEach((sub) => {
          subSections[sub.key] = found?.subSections
            ? (found.subSections instanceof Map ? found.subSections.get(sub.key) : found.subSections[sub.key]) ?? false
            : false;
        });
      }

      return {
        module: mod.key,
        moduleName: mod.name,
        description: mod.description,
        supportedActions: mod.supportedActions,
        subSectionsConfig: mod.subSections || [],
        accessLevel,
        actions,
        subSections,
      };
    });

    setPermissionsState(merged);
    setShowPermissionModal(true);
  };

  const handleAccessLevelChange = (modKey: string, level: 'FULL' | 'READ_ONLY' | 'RESTRICTED' | 'NO_ACCESS') => {
    setPermissionsState((prev) =>
      prev.map((item) => {
        if (item.module !== modKey) return item;

        const updatedActions = { ...item.actions };
        const updatedSubs = { ...item.subSections };

        if (level === 'FULL') {
          item.supportedActions.forEach((act: string) => {
            updatedActions[act] = true;
          });
          Object.keys(updatedSubs).forEach((k) => (updatedSubs[k] = true));
        } else if (level === 'READ_ONLY') {
          item.supportedActions.forEach((act: string) => {
            updatedActions[act] = act === 'read';
          });
          Object.keys(updatedSubs).forEach((k) => (updatedSubs[k] = k.toLowerCase().includes('view')));
        } else if (level === 'NO_ACCESS') {
          item.supportedActions.forEach((act: string) => {
            updatedActions[act] = false;
          });
          Object.keys(updatedSubs).forEach((k) => (updatedSubs[k] = false));
        }

        return {
          ...item,
          accessLevel: level,
          actions: updatedActions,
          subSections: updatedSubs,
        };
      })
    );
  };

  const handleActionToggle = (modKey: string, actionName: string) => {
    setPermissionsState((prev) =>
      prev.map((item) => {
        if (item.module !== modKey) return item;
        const currentVal = !!item.actions[actionName];
        return {
          ...item,
          accessLevel: 'RESTRICTED',
          actions: {
            ...item.actions,
            [actionName]: !currentVal,
          },
        };
      })
    );
  };

  const handleSubSectionToggle = (modKey: string, subKey: string) => {
    setPermissionsState((prev) =>
      prev.map((item) => {
        if (item.module !== modKey) return item;
        const currentVal = !!item.subSections[subKey];
        return {
          ...item,
          subSections: {
            ...item.subSections,
            [subKey]: !currentVal,
          },
        };
      })
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleForPerms) return;

    if (selectedRoleForPerms.isSystem && selectedRoleForPerms.code === 'SUPER_ADMIN') {
      alert('Super Admin permissions are permanently full system access and cannot be restricted.');
      return;
    }

    setSaving(true);
    try {
      const payloadPermissions = permissionsState.map((p) => ({
        module: p.module,
        moduleName: p.moduleName,
        accessLevel: p.accessLevel,
        actions: p.actions,
        subSections: p.subSections,
      }));

      const res = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRoleForPerms._id,
          permissions: payloadPermissions,
          updatedBy: currentUser?.fullName || 'Super Admin',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowPermissionModal(false);
        fetchRoles();
        alert(`Permissions for role "${selectedRoleForPerms.name}" updated successfully! Changes take effect immediately.`);
      } else {
        alert(json.message);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Card */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#334155] pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Role Master & Permission Management</span>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                {roles.length} Roles Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Configure organizational hierarchy, reporting relationships & granular module/report permissions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#172033] border border-[#334155] text-xs px-3 py-2 rounded-lg text-white focus:outline-none focus:border-emerald-500 w-40"
            />
            <button
              onClick={handleOpenCreateRole}
              className="bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm px-4 py-2 rounded-md font-medium transition shadow-md whitespace-nowrap cursor-pointer"
            >
              + ADD
            </button>
            <UploadDocumentButton onClick={() => setShowUploadModal(true)} />
          </div>
        </div>

        {/* Roles Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading roles...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#334155]">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#172033] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                <tr>
                  <th className="px-4 py-3">Hierarchy</th>
                  <th className="px-4 py-3">Role Name</th>
                  <th className="px-4 py-3">Role Code</th>
                  <th className="px-4 py-3">Reports To</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Permissions</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60">
                {filteredRoles.map((role) => (
                  <tr key={role._id} className="hover:bg-[#1e2a3e]/50 transition">
                    <td className="px-4 py-3 font-mono">
                      <span className="bg-slate-700/80 text-white px-2 py-0.5 rounded text-[11px] font-bold">
                        Level {role.hierarchyLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {role.name}
                      {role.isSystem && (
                        <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.2 rounded">
                          System
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{role.code}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {role.reportingTo || <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate" title={role.description}>
                      {role.description || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(role)}
                        className={`text-[10px] px-2 py-0.5 rounded font-medium border transition ${
                          role.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                        }`}
                      >
                        {role.status}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenPermissions(role)}
                        className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-3 py-1 rounded text-xs font-medium transition"
                      >
                        🛡️ Configure Permissions ({role.permissions?.length || 0})
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditRole(role)}
                        className="text-slate-300 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700"
                      >
                        Edit
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="text-rose-400 hover:text-rose-300 text-xs bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded border border-rose-500/20"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Create/Edit Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-base font-bold text-white">
                {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Role'}
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Role Name *</label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="e.g. Regional Quality Manager"
                    className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Role Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRole?.isSystem}
                    value={roleForm.code}
                    onChange={(e) =>
                      setRoleForm({
                        ...roleForm,
                        code: e.target.value.toUpperCase().replace(/\s+/g, '_'),
                      })
                    }
                    placeholder="e.g. RQM"
                    className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Hierarchy Level *</label>
                  <select
                    value={roleForm.hierarchyLevel}
                    onChange={(e) => setRoleForm({ ...roleForm, hierarchyLevel: Number(e.target.value) })}
                    className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>Level 1 - Super Admin</option>
                    <option value={2}>Level 2 - Admin</option>
                    <option value={3}>Level 3 - HOD</option>
                    <option value={4}>Level 4 - ZSM</option>
                    <option value={5}>Level 5 - BSM</option>
                    <option value={6}>Level 6 - ASM</option>
                    <option value={7}>Level 7 - CCO</option>
                    <option value={8}>Level 8 - Operational Staff</option>
                    <option value={9}>Level 9 - Field Engineer / Auditor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1 font-medium">Reports To Role</label>
                  <select
                    value={roleForm.reportingTo}
                    onChange={(e) => setRoleForm({ ...roleForm, reportingTo: e.target.value })}
                    className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">None (Top Level)</option>
                    {roles
                      .filter((r) => r.code !== roleForm.code)
                      .map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name} ({r.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  placeholder="Define the scope and responsibilities of this role..."
                  className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1 font-medium">Status</label>
                <select
                  value={roleForm.status}
                  onChange={(e) => setRoleForm({ ...roleForm, status: e.target.value })}
                  className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permission Matrix Modal */}
      {showPermissionModal && selectedRoleForPerms && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c2e] border border-[#334155] rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-5 border-b border-[#334155] flex justify-between items-center bg-[#0d1624]">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>🛡️ Permission Matrix: {selectedRoleForPerms.name}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                    {selectedRoleForPerms.code}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign module-level, action-level (Create, Read, Update, Delete, Export, Approve, Reopen Call), and section permissions.
                </p>
              </div>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="text-slate-400 hover:text-white text-base px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Matrix Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 divide-y divide-[#1e293b]">
              {permissionsState.map((perm) => (
                <div key={perm.module} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-semibold text-white flex items-center space-x-2">
                        <span>{perm.moduleName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({perm.module})</span>
                      </h4>
                      <p className="text-xs text-slate-400">{perm.description}</p>
                    </div>

                    {/* Access Level Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">Access Mode:</span>
                      <select
                        value={perm.accessLevel}
                        onChange={(e) => handleAccessLevelChange(perm.module, e.target.value as any)}
                        disabled={selectedRoleForPerms.code === 'SUPER_ADMIN'}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none font-medium ${
                          perm.accessLevel === 'FULL'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : perm.accessLevel === 'READ_ONLY'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : perm.accessLevel === 'RESTRICTED'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        <option value="FULL">Full Access</option>
                        <option value="READ_ONLY">Read Only</option>
                        <option value="RESTRICTED">Restricted Access</option>
                        <option value="NO_ACCESS">No Access</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Checkboxes */}
                  <div className="bg-[#172033] p-3 rounded-xl border border-[#334155]/60">
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Authorized Actions
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                      {perm.supportedActions.map((act: string) => {
                        const isChecked = !!perm.actions[act];
                        return (
                          <label
                            key={act}
                            className={`flex items-center space-x-2 text-xs px-2.5 py-1.5 rounded border cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                                : 'bg-[#0f172a] border-[#334155] text-slate-400 hover:text-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={selectedRoleForPerms.code === 'SUPER_ADMIN'}
                              onChange={() => handleActionToggle(perm.module, act)}
                              className="accent-emerald-500 w-3.5 h-3.5 rounded"
                            />
                            <span className="capitalize">
                              {act === 'reopenCall'
                                ? '🔄 Reopen Call'
                                : act === 'uploadDocs'
                                ? '📁 Upload Docs'
                                : act === 'downloadDocs'
                                ? '📥 Download Docs'
                                : act}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sub-sections / reports if applicable */}
                  {perm.subSectionsConfig && perm.subSectionsConfig.length > 0 && (
                    <div className="bg-[#141d2e] p-3 rounded-xl border border-[#334155]/40">
                      <span className="block text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-2">
                        Sub-Sections & Reports Visibility
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {perm.subSectionsConfig.map((sub: any) => {
                          const isSubChecked = !!perm.subSections[sub.key];
                          return (
                            <label
                              key={sub.key}
                              className={`flex items-center space-x-2 text-xs px-2.5 py-1.5 rounded border cursor-pointer select-none transition ${
                                isSubChecked
                                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                                  : 'bg-[#0f172a] border-[#334155] text-slate-400 hover:text-white'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSubChecked}
                                disabled={selectedRoleForPerms.code === 'SUPER_ADMIN'}
                                onChange={() => handleSubSectionToggle(perm.module, sub.key)}
                                className="accent-blue-500 w-3.5 h-3.5 rounded"
                              />
                              <span>{sub.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#334155] flex justify-between items-center bg-[#0d1624]">
              <div className="text-xs text-slate-400">
                {selectedRoleForPerms.code === 'SUPER_ADMIN' ? (
                  <span className="text-amber-400">
                    ℹ️ Super Admin permissions cannot be restricted (Complete System Control).
                  </span>
                ) : (
                  <span>Changes reflect immediately upon saving.</span>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPermissionModal(false)}
                  className="px-4 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                {selectedRoleForPerms.code !== 'SUPER_ADMIN' && (
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="px-5 py-2 text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition font-medium shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Permissions'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <MasterDocumentModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        masterType="role"
        masterTitle="Role Master"
        entities={roles.map((r) => ({ id: r._id, name: r.name, code: r.code }))}
        currentUser={currentUser}
      />
    </div>
  );
}

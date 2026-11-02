'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface RoleNode {
  _id: string;
  name: string;
  code: string;
  hierarchyLevel: number;
  reportingTo: string;
  parentRoleName?: string;
  description?: string;
  children?: RoleNode[];
  history?: any[];
}

interface UserReportingItem {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  mobile: string;
  role: string;
  roleCode: string;
  parentRoleCode: string;
  reportingManagerId: string | null;
  reportingManagerName: string;
  eligibleManagers: { _id: string; fullName: string; username: string; role: string }[];
  history?: any[];
}

interface ReportingHierarchyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onHierarchyUpdated?: () => void;
}

export default function ReportingHierarchyModal({
  isOpen,
  onClose,
  currentUser,
  onHierarchyUpdated,
}: ReportingHierarchyModalProps) {
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  // Role Hierarchy State
  const [roles, setRoles] = useState<RoleNode[]>([]);
  const [tree, setTree] = useState<RoleNode[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [selectedRoleCode, setSelectedRoleCode] = useState('');
  const [targetParentCode, setTargetParentCode] = useState('');
  const [targetLevel, setTargetLevel] = useState(5);
  const [updateReason, setUpdateReason] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [roleMessage, setRoleMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // User Reporting State
  const [users, setUsers] = useState<UserReportingItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSelectedManagers, setUserSelectedManagers] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Collapsed tree nodes
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      loadHierarchy();
      loadUsersReporting();
    }
  }, [isOpen]);

  const loadHierarchy = async () => {
    setLoadingRoles(true);
    setRoleMessage(null);
    try {
      const res = await fetch('/api/roles/hierarchy');
      const json = await res.json();
      if (json.success && json.data) {
        setRoles(json.data.roles || []);
        setTree(json.data.tree || []);
        if (json.data.roles?.length > 0 && !selectedRoleCode) {
          const firstNonAdmin = json.data.roles.find((r: any) => r.code !== 'SUPER_ADMIN') || json.data.roles[0];
          setSelectedRoleCode(firstNonAdmin.code);
          setTargetParentCode(firstNonAdmin.reportingTo || '');
          setTargetLevel(firstNonAdmin.hierarchyLevel || 5);
        }
      }
    } catch (e: any) {
      setRoleMessage({ text: e.message || 'Error loading hierarchy', type: 'error' });
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUsersReporting = async () => {
    setLoadingUsers(true);
    setUserMessage(null);
    try {
      const res = await fetch('/api/users/reporting');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setUsers(json.data);
        const map: Record<string, string> = {};
        json.data.forEach((u: UserReportingItem) => {
          map[u._id] = u.reportingManagerId || '';
        });
        setUserSelectedManagers(map);
      }
    } catch (e: any) {
      setUserMessage({ text: e.message || 'Error loading user reporting', type: 'error' });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleSelectionChange = (code: string) => {
    setSelectedRoleCode(code);
    const found = roles.find((r) => r.code === code);
    if (found) {
      setTargetParentCode(found.reportingTo || '');
      setTargetLevel(found.hierarchyLevel || 5);
    }
  };

  // Find all descendant codes of selectedRoleCode to prevent circular options in dropdown
  const invalidParentCodes = useMemo(() => {
    const invalid = new Set<string>();
    invalid.add(selectedRoleCode);

    // Recursively collect all descendants
    const collectDescendants = (node: RoleNode) => {
      if (node.children) {
        for (const child of node.children) {
          invalid.add(child.code);
          collectDescendants(child);
        }
      }
    };

    const findAndCollect = (nodes: RoleNode[]): boolean => {
      for (const n of nodes) {
        if (n.code === selectedRoleCode) {
          collectDescendants(n);
          return true;
        }
        if (n.children && findAndCollect(n.children)) {
          return true;
        }
      }
      return false;
    };

    findAndCollect(tree);
    return invalid;
  }, [selectedRoleCode, tree]);

  // Save Role Hierarchy Relationship
  const handleSaveRoleHierarchy = async () => {
    if (!selectedRoleCode) return;
    setSavingRole(true);
    setRoleMessage(null);

    try {
      const res = await fetch('/api/roles/hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleCode: selectedRoleCode,
          parentRoleCode: targetParentCode,
          hierarchyLevel: targetLevel,
          updatedBy: currentUser?.fullName || 'Super Admin',
          reason: updateReason.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setRoleMessage({ text: json.message, type: 'success' });
        setUpdateReason('');
        loadHierarchy();
        if (onHierarchyUpdated) onHierarchyUpdated();
      } else {
        setRoleMessage({ text: json.message, type: 'error' });
      }
    } catch (e: any) {
      setRoleMessage({ text: e.message || 'Failed to update hierarchy', type: 'error' });
    } finally {
      setSavingRole(false);
    }
  };

  // Save User Reporting Assignment
  const handleSaveUserAssignment = async (userId: string) => {
    const managerId = userSelectedManagers[userId] || null;
    setSavingUserId(userId);
    setUserMessage(null);

    try {
      const res = await fetch('/api/users/reporting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          reportingManagerId: managerId,
          updatedBy: currentUser?.fullName || 'Super Admin',
        }),
      });

      const json = await res.json();
      if (json.success) {
        setUserMessage({ text: json.message, type: 'success' });
        loadUsersReporting();
      } else {
        setUserMessage({ text: json.message, type: 'error' });
      }
    } catch (e: any) {
      setUserMessage({ text: e.message || 'Error updating manager', type: 'error' });
    } finally {
      setSavingUserId(null);
    }
  };

  const toggleNodeCollapse = (code: string) => {
    setCollapsedNodes((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    let list = users;
    if (userRoleFilter !== 'ALL') {
      list = list.filter((u) => u.role === userRoleFilter);
    }
    if (userSearch.trim()) {
      const term = userSearch.toLowerCase();
      list = list.filter(
        (u) =>
          u.fullName.toLowerCase().includes(term) ||
          u.username.toLowerCase().includes(term) ||
          u.role.toLowerCase().includes(term) ||
          (u.reportingManagerName && u.reportingManagerName.toLowerCase().includes(term))
      );
    }
    return list;
  }, [users, userRoleFilter, userSearch]);

  if (!isOpen) return null;

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: RoleNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = !!collapsedNodes[node.code];
    const isSelected = selectedRoleCode === node.code;

    return (
      <div key={node.code} className="relative pl-6 border-l-2 border-[#1e293b] my-2">
        <div
          onClick={() => handleRoleSelectionChange(node.code)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition ${
            isSelected
              ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/10'
              : 'bg-[#0f172a] border-[#334155]/60 hover:bg-[#16233b] text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNodeCollapse(node.code);
                }}
                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                {isCollapsed ? '+' : '−'}
              </button>
            ) : (
              <span className="w-5 text-center text-slate-600">•</span>
            )}

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white">{node.name}</span>
                <span className="text-[10px] font-mono bg-[#172033] text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                  {node.code}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  Level {node.hierarchyLevel}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Reports to:{' '}
                <strong className="text-slate-200">
                  {node.reportingTo || 'None (Top of Hierarchy)'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {hasChildren && (
              <span className="text-[11px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                {node.children!.length} direct report(s)
              </span>
            )}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {node.children!.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111c2e] border border-[#1e293b] rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] flex items-center justify-between bg-[#0d1624]">
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>🌐 Configure Reporting Hierarchy & Org Chart</span>
              </h2>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                Super Admin Control
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Define dynamic role-level reporting dependencies, individual user manager assignments, and safeguards against circular reporting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-base px-2 py-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293b] bg-[#0b1320] px-6">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'roles'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🌳 1. Role-Level Hierarchy & Org Chart</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition flex items-center space-x-2 ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👥 2. User-Level Reporting Manager Assignments</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: Role-Level Hierarchy */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              {roleMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    roleMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span>{roleMessage.text}</span>
                  <button onClick={() => setRoleMessage(null)}>✕</button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Interactive Org Chart Tree View (7 cols) */}
                <div className="lg:col-span-7 bg-[#0b1320] border border-[#1e293b] rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                        Organizational Hierarchy Visualizer
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        Click any role in the tree to configure its reporting parent.
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => setCollapsedNodes({})}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        Expand All
                      </button>
                    </div>
                  </div>

                  {loadingRoles ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      Loading organizational hierarchy tree...
                    </div>
                  ) : (
                    <div className="space-y-2 pr-2 overflow-y-auto max-h-[500px]">
                      {tree.map((root) => renderTreeNode(root))}
                    </div>
                  )}
                </div>

                {/* Right: Configure Reporting Parent Form (5 cols) */}
                <div className="lg:col-span-5 bg-[#0b1320] border border-[#1e293b] rounded-2xl p-5 space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-[#1e293b] pb-3">
                      <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                        Configure Reporting Relationship
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Select a role and define who it reports to in the operational hierarchy.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Role to Configure
                      </label>
                      <select
                        value={selectedRoleCode}
                        onChange={(e) => handleRoleSelectionChange(e.target.value)}
                        className="w-full bg-[#111c2e] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {roles.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.name} ({r.code}) - Level {r.hierarchyLevel}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Reports To (Parent Role)
                      </label>
                      <select
                        value={targetParentCode}
                        onChange={(e) => setTargetParentCode(e.target.value)}
                        className="w-full bg-[#111c2e] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">None (Top Level / Super Admin)</option>
                        {roles
                          .filter((r) => !invalidParentCodes.has(r.code))
                          .map((r) => (
                            <option key={r.code} value={r.code}>
                              {r.name} ({r.code})
                            </option>
                          ))}
                      </select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        🛡️ Descendant roles and self are automatically disabled to prevent circular dependency loops.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Hierarchy Level
                      </label>
                      <select
                        value={targetLevel}
                        onChange={(e) => setTargetLevel(Number(e.target.value))}
                        className="w-full bg-[#111c2e] border border-[#334155] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value={1}>Level 1 - Super Admin</option>
                        <option value={2}>Level 2 - Admin / Director</option>
                        <option value={3}>Level 3 - HOD / Senior Executive</option>
                        <option value={4}>Level 4 - Zonal Service Manager (ZSM)</option>
                        <option value={5}>Level 5 - Branch Service Manager (BSM)</option>
                        <option value={6}>Level 6 - Area Service Manager (ASM)</option>
                        <option value={7}>Level 7 - Call Coordinator (CCO)</option>
                        <option value={8}>Level 8 - Franchise Partner</option>
                        <option value={9}>Level 9 - Field Engineer / Technician</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Change Reason / Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Realignment of Regional Field Reporting..."
                        value={updateReason}
                        onChange={(e) => setUpdateReason(e.target.value)}
                        className="w-full bg-[#111c2e] border border-[#334155] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#1e293b] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setTargetParentCode('')}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clear Parent
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveRoleHierarchy}
                      disabled={savingRole}
                      className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                    >
                      {savingRole ? 'Saving...' : '💾 Save & Update Hierarchy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: User-Level Reporting Manager Assignments */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {userMessage && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                    userMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span>{userMessage.text}</span>
                  <button onClick={() => setUserMessage(null)}>✕</button>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b1320] p-4 rounded-xl border border-[#1e293b]">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-bold text-white">Employee Manager Allocation</span>
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                    {filteredUsers.length} Users
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="bg-[#111c2e] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Roles</option>
                    {roles.map((r) => (
                      <option key={r.code} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Search employee or manager..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="bg-[#111c2e] border border-[#334155] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-60"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto rounded-xl border border-[#1e293b]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#0b1320] text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-[#1e293b]">
                    <tr>
                      <th className="py-3 px-4">Employee Name</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Hierarchy Parent Role</th>
                      <th className="py-3 px-4">Current Manager</th>
                      <th className="py-3 px-4 min-w-[220px]">Assign Reporting Manager</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/60">
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          Loading user directory and manager mappings...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          No employees found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSaving = savingUserId === u._id;
                        const hasNoManager = !u.reportingManagerId && u.role !== 'Super Admin';
                        const currentSelected = userSelectedManagers[u._id] || '';

                        return (
                          <tr key={u._id} className="hover:bg-[#16233b]/40 transition">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-white">{u.fullName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">@{u.username}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium">
                                {u.role}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                              {u.parentRoleCode || <span className="text-slate-600">—</span>}
                            </td>
                            <td className="py-3 px-4">
                              {hasNoManager ? (
                                <span className="text-[11px] text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                  ⚠️ No Manager Assigned
                                </span>
                              ) : (
                                <span className="text-emerald-400 font-medium">
                                  {u.reportingManagerName || 'Super Admin'}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={currentSelected}
                                onChange={(e) =>
                                  setUserSelectedManagers((prev) => ({
                                    ...prev,
                                    [u._id]: e.target.value,
                                  }))
                                }
                                disabled={u.role === 'Super Admin'}
                                className="w-full bg-[#0b1320] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                              >
                                <option value="">None (No Manager)</option>
                                {u.eligibleManagers.map((mgr) => (
                                  <option key={mgr._id} value={mgr._id}>
                                    {mgr.fullName} ({mgr.role})
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleSaveUserAssignment(u._id)}
                                disabled={isSaving || u.role === 'Super Admin'}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition disabled:opacity-40"
                              >
                                {isSaving ? 'Saving...' : 'Update'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1e293b] flex justify-end bg-[#0d1624]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PincodeField from '@/components/common/PincodeLookup';

interface UserManagementProps {
  initialMode?: 'createUser' | 'updateUser' | string;
  currentUser?: any;
}

const ZONES_LIST = ['North', 'South', 'East', 'West', 'Central'];

export default function UserManagementView({ initialMode = 'createUser', currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [clientBrands, setClientBrands] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterScope, setFilterScope] = useState('ALL');

  const initialForm = {
    role: 'Super Admin',
    roleCode: 'SUPER_ADMIN',
    roleId: '',
    reportingTo: '',
    reportingManagerId: '',
    accountStatus: 'ACTIVE',
    organizationalScope: 'NATIONAL',

    // Entity Assignments
    clientId: '',
    clientName: '',
    brandId: '',
    brandName: '',
    assignedBrands: [] as string[],

    branchId: '',
    branchName: '',

    zoneId: '',
    zoneName: 'All',

    franchiseId: '',
    franchiseName: '',

    technicianId: '',
    technicianName: '',

    // Personal & Address
    name: '',
    address: '',
    landmark: '',
    pincode: '',
    state: '',
    district: '',
    city: '',
    locality: '',
    mobile: '',
    email: '',

    // Auth
    username: '',
    password: '',
    rePassword: '',
  };

  const [formData, setFormData] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Determine current role category
  const normalizedRole = useMemo(() => {
    return (formData.roleCode || formData.role || '').toUpperCase().replace(/\s+/g, '_');
  }, [formData.roleCode, formData.role]);

  const isClientRole = normalizedRole.includes('CLIENT');
  const isBranchRole = normalizedRole.includes('BRANCH') || normalizedRole === 'BSM';
  const isZoneRole = normalizedRole.includes('ZONE') || normalizedRole === 'ZSM';
  const isFranchiseRole = normalizedRole.includes('FRANCHISE');
  const isTechnicianRole = normalizedRole.includes('TECH') || normalizedRole === 'ENGINEER';
  const isSuperAdminRole = normalizedRole === 'SUPER_ADMIN' || formData.role === 'Super Admin';

  useEffect(() => {
    fetchUsers();
    fetchMasterDropdowns();
  }, []);

  useEffect(() => {
    if (initialMode === 'updateUser') {
      setTimeout(() => {
        const dirElem = document.getElementById('user-directory-section');
        if (dirElem) {
          dirElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 200);
    }
  }, [initialMode]);

  // Fetch Brands whenever selected clientId changes
  useEffect(() => {
    if (formData.clientId) {
      fetchBrandsForClient(formData.clientId);
    } else {
      setClientBrands([]);
    }
  }, [formData.clientId]);

  const fetchMasterDropdowns = async () => {
    try {
      const [rolesRes, clientsRes, branchRes, franchiseRes, techRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/masters/clients'),
        fetch('/api/masters/branches'),
        fetch('/api/masters/franchises'),
        fetch('/api/masters/technicians'),
      ]);

      const [rolesJson, clientsJson, branchJson, franchiseJson, techJson] = await Promise.all([
        rolesRes.json().catch(() => ({})),
        clientsRes.json().catch(() => ({})),
        branchRes.json().catch(() => ({})),
        franchiseRes.json().catch(() => ({})),
        techRes.json().catch(() => ({})),
      ]);

      if (rolesJson.success) setRoles(rolesJson.data || []);
      if (clientsJson.success) setClients(clientsJson.data || []);
      if (branchJson.success) setBranches(branchJson.data || []);
      if (franchiseJson.success) setFranchises(franchiseJson.data || []);
      if (techJson.success) setTechnicians(techJson.data || []);
    } catch (e) {
      console.error('Failed to load master dropdown data:', e);
    }
  };

  const fetchBrandsForClient = async (cid: string) => {
    setLoadingBrands(true);
    try {
      const res = await fetch(`/api/masters/brands?clientId=${cid}`);
      const json = await res.json();
      if (json.success) {
        setClientBrands(json.data || []);
      } else {
        setClientBrands([]);
      }
    } catch (e) {
      console.error('Failed to fetch client brands:', e);
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleName: string) => {
    const r = roles.find((item) => item.name === roleName);
    const code = r?.code || roleName.toUpperCase().replace(/\s+/g, '_');

    // Automatically derive scope from role
    let newScope = 'NATIONAL';
    if (code.includes('CLIENT')) {
      newScope = 'CLIENT';
    } else if (code.includes('BRANCH') || code === 'BSM') {
      newScope = 'BRANCH';
    } else if (code.includes('ZONE') || code === 'ZSM') {
      newScope = 'ZONE';
    } else if (code.includes('FRANCHISE')) {
      newScope = 'FRANCHISE';
    } else if (code.includes('TECH') || code === 'ENGINEER') {
      newScope = 'TECHNICIAN';
    }

    setFormData((prev) => ({
      ...prev,
      role: roleName,
      roleCode: code,
      roleId: r?._id || '',
      reportingTo: r?.reportingTo || prev.reportingTo,
      organizationalScope: newScope,
      // Clear previous entity assignments if switching role types
      clientId: newScope === 'CLIENT' ? prev.clientId : '',
      clientName: newScope === 'CLIENT' ? prev.clientName : '',
      brandId: newScope === 'CLIENT' ? prev.brandId : '',
      brandName: newScope === 'CLIENT' ? prev.brandName : '',
      assignedBrands: newScope === 'CLIENT' ? prev.assignedBrands : [],
      branchId: newScope === 'BRANCH' ? prev.branchId : '',
      branchName: newScope === 'BRANCH' ? prev.branchName : '',
      franchiseId: newScope === 'FRANCHISE' ? prev.franchiseId : '',
      franchiseName: newScope === 'FRANCHISE' ? prev.franchiseName : '',
      technicianId: newScope === 'TECHNICIAN' ? prev.technicianId : '',
      technicianName: newScope === 'TECHNICIAN' ? prev.technicianName : '',
    }));
  };

  const handleReset = () => {
    setFormData(initialForm);
    setEditingUserId(null);
    setMessage(null);
  };

  const handleLocationFound = (loc: { state: string; district: string; city: string; locality: string }) => {
    setFormData((prev) => ({
      ...prev,
      state: loc.state,
      district: loc.district,
      city: loc.city,
      locality: loc.locality,
    }));
  };

  const handleEdit = (u: any) => {
    setEditingUserId(u._id);
    const r = roles.find((item) => item.name === u.role || item.code === u.roleCode);

    setFormData({
      role: u.role || 'Super Admin',
      roleCode: u.roleCode || r?.code || 'SUPER_ADMIN',
      roleId: u.roleId || r?._id || '',
      reportingTo: u.reportingTo || '',
      reportingManagerId: u.reportingManagerId || '',
      accountStatus: u.accountStatus || u.status || 'ACTIVE',
      organizationalScope: u.organizationalScope || 'NATIONAL',

      clientId: u.clientId || '',
      clientName: u.clientName || '',
      brandId: u.brandId || '',
      brandName: u.brandName || '',
      assignedBrands: Array.isArray(u.assignedBrands) ? u.assignedBrands : [],

      branchId: u.branchId || '',
      branchName: u.branchName || u.assignedBranch || u.branch || '',

      zoneId: u.zoneId || '',
      zoneName: u.zoneName || u.assignedZone || 'All',

      franchiseId: u.franchiseId || '',
      franchiseName: u.franchiseName || '',

      technicianId: u.technicianId || '',
      technicianName: u.technicianName || '',

      name: u.fullName || '',
      address: u.address || '',
      landmark: u.landmark || '',
      pincode: u.pincode || '',
      state: u.state || '',
      district: u.district || '',
      city: u.city || '',
      locality: u.locality || '',
      mobile: u.mobile || '',
      email: u.email || '',

      username: u.username || '',
      password: '',
      rePassword: '',
    });

    if (u.clientId) {
      fetchBrandsForClient(u.clientId);
    }

    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteUser = async (id: string, uname: string) => {
    if (uname === 'admin') {
      alert('Primary admin account cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${uname}"?`)) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchUsers();
        setMessage({ type: 'success', text: `User ${uname} deleted.` });
      } else {
        alert(json.message);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.username.trim()) {
      setMessage({ type: 'error', text: 'Username is required.' });
      return;
    }
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Full Name is required.' });
      return;
    }

    // Role-to-Entity Validations
    if (isClientRole && !formData.clientId) {
      setMessage({ type: 'error', text: 'Please select an assigned Client for this client user account.' });
      return;
    }
    if (isBranchRole && !formData.branchId && !formData.branchName) {
      setMessage({ type: 'error', text: 'Please select an assigned Branch for this branch manager account.' });
      return;
    }
    if (isFranchiseRole && !formData.franchiseId && !formData.franchiseName) {
      setMessage({ type: 'error', text: 'Please select an assigned Franchise Partner for this account.' });
      return;
    }
    if (isTechnicianRole && !formData.technicianId && !formData.technicianName) {
      setMessage({ type: 'error', text: 'Please select an assigned Technician Profile for this account.' });
      return;
    }

    if (!editingUserId) {
      if (!formData.password) {
        setMessage({ type: 'error', text: 'Password is required for new user.' });
        return;
      }
      if (formData.password.length < 4) {
        setMessage({ type: 'error', text: 'Password must be at least 4 characters.' });
        return;
      }
      if (formData.password !== formData.rePassword) {
        setMessage({ type: 'error', text: 'Passwords do not match.' });
        return;
      }
    } else {
      if (formData.password && formData.password !== formData.rePassword) {
        setMessage({ type: 'error', text: 'New passwords do not match.' });
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        fullName: formData.name.trim(),
        role: formData.role,
        roleCode: formData.roleCode,
        roleId: formData.roleId || undefined,
        reportingTo: formData.reportingTo,
        reportingManagerId: formData.reportingManagerId || undefined,
        organizationalScope: formData.organizationalScope,

        // Client
        clientId: formData.clientId || undefined,
        clientName: formData.clientName,
        brandId: formData.brandId || undefined,
        brandName: formData.brandName,
        assignedBrands: formData.assignedBrands,

        // Branch
        branchId: formData.branchId || undefined,
        branchName: formData.branchName,
        assignedBranch: formData.branchName,
        branch: formData.branchName,

        // Zone
        zoneId: formData.zoneId,
        zoneName: formData.zoneName,
        assignedZone: formData.zoneName,

        // Franchise
        franchiseId: formData.franchiseId || undefined,
        franchiseName: formData.franchiseName,

        // Technician
        technicianId: formData.technicianId || undefined,
        technicianName: formData.technicianName,

        // Address
        address: formData.address,
        landmark: formData.landmark,
        pincode: formData.pincode,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        locality: formData.locality,
        mobile: formData.mobile,
        email: formData.email,

        status: formData.accountStatus,
        accountStatus: formData.accountStatus,
        updatedBy: currentUser?.fullName || 'Super Admin',
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingUserId) {
        payload.id = editingUserId;
        const res = await fetch('/api/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: `User "${formData.username}" updated successfully with organizational scope!` });
          handleReset();
          fetchUsers();
        } else {
          setMessage({ type: 'error', text: json.message });
        }
      } else {
        payload.username = formData.username.trim();
        payload.createdBy = currentUser?.fullName || 'Super Admin';
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success) {
          setMessage({ type: 'success', text: `User "${formData.username}" created successfully under ${formData.role}!` });
          handleReset();
          fetchUsers();
        } else {
          setMessage({ type: 'error', text: json.message });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.mobile?.includes(searchTerm) ||
      u.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.franchiseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.technicianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchScope = filterScope === 'ALL' || u.organizationalScope === filterScope;
    return matchSearch && matchRole && matchScope;
  });

  return (
    <div className="space-y-8">
      {/* 1. User Creation/Edit Card */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex justify-between items-center">
          <div>
            <h2 className="text-base font-semibold text-slate-200">
              {editingUserId ? `Edit User: ${formData.username}` : 'Create New User with Dynamic Organizational Scope'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Provision user accounts, assign dynamic roles from Role Master, and link with Client, Brand, Branch, Franchise or Technician
            </p>
          </div>
          {editingUserId && (
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-mono">
              Editing: {formData.username}
            </span>
          )}
        </div>

        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* SECTION 1: ROLE & REPORTING HIERARCHY */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-emerald-500/20 pb-1 flex items-center justify-between">
              <span>1. Role & Reporting Hierarchy</span>
              <span className="text-[11px] font-normal text-slate-400">Dynamic lookup from Role Master</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {roles.map((r) => (
                    <option key={r._id} value={r.name}>
                      {r.name} (Level {r.hierarchyLevel} - {r.code})
                    </option>
                  ))}
                  {roles.length === 0 && (
                    <>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Admin">Admin</option>
                      <option value="Client Admin">Client Admin</option>
                      <option value="Client User">Client User</option>
                      <option value="Branch Manager">Branch Manager</option>
                      <option value="Zone Manager">Zone Manager</option>
                      <option value="Franchise Manager">Franchise Manager</option>
                      <option value="Technician / Engineer">Technician / Engineer</option>
                      <option value="Call Centre Executive">Call Centre Executive</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reports To (Manager)
                </label>
                <select
                  value={formData.reportingTo}
                  onChange={(e) => {
                    const selManagerName = e.target.value;
                    const mgr = users.find((u) => u.fullName === selManagerName);
                    setFormData({
                      ...formData,
                      reportingTo: selManagerName,
                      reportingManagerId: mgr ? mgr._id : '',
                    });
                  }}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">None (Top Level / Super Admin)</option>
                  {users
                    .filter((u) => !formData.username || u.username !== formData.username)
                    .map((u) => (
                      <option key={u._id} value={u.fullName}>
                        {u.fullName} ({u.role} - {u.clientName || u.branchName || 'National'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Status</label>
                <select
                  value={formData.accountStatus}
                  onChange={(e) => setFormData({ ...formData, accountStatus: e.target.value as any })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: DYNAMIC ORGANIZATIONAL SCOPE & GEOGRAPHIC ASSIGNMENT */}
          <div className="space-y-4 pt-3 border-t border-[#334155]">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1 flex items-center justify-between">
              <span>2. Organizational Scope & Geographic Assignment</span>
              <span className="text-[11px] font-mono text-cyan-300 uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Scope: {formData.organizationalScope}
              </span>
            </h4>

            {/* CASE 1: CLIENT ADMIN / CLIENT USER */}
            {isClientRole && (
              <div className="p-4 rounded-xl bg-[#111c2e] border border-cyan-500/30 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-xs text-cyan-300 font-bold">
                  <span>🏢 Client Organization Linking</span>
                  <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-200 font-normal">
                    User will be restricted strictly to this Client
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Select Client *
                    </label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        const c = clients.find((item) => item._id === selId);
                        setFormData({
                          ...formData,
                          clientId: selId,
                          clientName: c ? c.clientName : '',
                          brandId: '',
                          brandName: '',
                          assignedBrands: [],
                        });
                      }}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
                    >
                      <option value="">-- Select Client from Master --</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.clientName} ({c.clientCode || 'QSCL'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Assigned Brand(s)
                      {loadingBrands && <span className="text-cyan-400 ml-2 text-[10px]">Loading brands...</span>}
                    </label>
                    <select
                      value={formData.brandName}
                      onChange={(e) => {
                        const bName = e.target.value;
                        const b = clientBrands.find((item) => item.brandName === bName);
                        setFormData({
                          ...formData,
                          brandId: b ? b._id : '',
                          brandName: bName,
                          assignedBrands: bName ? [bName] : [],
                        });
                      }}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">All Brands under {formData.clientName || 'Client'}</option>
                      {clientBrands.map((b) => (
                        <option key={b._id} value={b.brandName}>
                          {b.brandName} ({b.brandCode})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Leave empty to grant access across all brands registered under this client.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: BRANCH MANAGER */}
            {isBranchRole && (
              <div className="p-4 rounded-xl bg-[#111c2e] border border-indigo-500/30 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-xs text-indigo-300 font-bold">
                  <span>🏛️ Branch Office Assignment</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Select Branch *
                    </label>
                    <select
                      required
                      value={formData.branchName}
                      onChange={(e) => {
                        const bName = e.target.value;
                        const b = branches.find((item) => item.branchName === bName);
                        setFormData({
                          ...formData,
                          branchId: b ? b._id : '',
                          branchName: bName,
                          zoneName: b ? b.region : formData.zoneName,
                        });
                      }}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="">-- Select Branch from Master --</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b.branchName}>
                          {b.branchName} ({b.region} Zone)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Branch Regional Territory
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.zoneName ? `${formData.zoneName} Zone` : 'Auto-derived from Branch'}
                      className="w-full bg-[#0f172a]/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASE 3: ZONE MANAGER */}
            {isZoneRole && (
              <div className="p-4 rounded-xl bg-[#111c2e] border border-purple-500/30 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-xs text-purple-300 font-bold">
                  <span>🗺️ Zonal / Regional Territory Assignment</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Select Zone / Region *
                    </label>
                    <select
                      required
                      value={formData.zoneName}
                      onChange={(e) => setFormData({ ...formData, zoneName: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                    >
                      {ZONES_LIST.map((z) => (
                        <option key={z} value={z}>
                          {z} Zone (Regional Network)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Subordinate Branches in Zone
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${branches.filter((b) => b.region === formData.zoneName).length} Active branches in this zone`}
                      className="w-full bg-[#0f172a]/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASE 4: FRANCHISE MANAGER */}
            {isFranchiseRole && (
              <div className="p-4 rounded-xl bg-[#111c2e] border border-amber-500/30 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-xs text-amber-300 font-bold">
                  <span>🏪 Franchise Partner (ASC) Assignment</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Select Franchise *
                    </label>
                    <select
                      required
                      value={formData.franchiseName}
                      onChange={(e) => {
                        const fName = e.target.value;
                        const f = franchises.find((item) => item.firmName === fName);
                        setFormData({
                          ...formData,
                          franchiseId: f ? f._id : '',
                          franchiseName: fName,
                          city: f ? f.city : formData.city,
                          state: f ? f.state : formData.state,
                          pincode: f ? f.pincode : formData.pincode,
                        });
                      }}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                    >
                      <option value="">-- Select Franchise Partner from Master --</option>
                      {franchises.map((f) => (
                        <option key={f._id} value={f.firmName}>
                          {f.firmName} ({f.crmCode} • {f.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Franchise Location
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.city ? `${formData.city}, ${formData.state || ''}` : 'Select a franchise partner'}
                      className="w-full bg-[#0f172a]/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASE 5: TECHNICIAN / ENGINEER */}
            {isTechnicianRole && (
              <div className="p-4 rounded-xl bg-[#111c2e] border border-emerald-500/30 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2 text-xs text-emerald-300 font-bold">
                  <span>👷 Field Technician / Service Engineer Profile Linking</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Select Technician / Engineer *
                    </label>
                    <select
                      required
                      value={formData.technicianName}
                      onChange={(e) => {
                        const tName = e.target.value;
                        const t = technicians.find((item) => item.technicianName === tName);
                        setFormData({
                          ...formData,
                          technicianId: t ? t._id : '',
                          technicianName: tName,
                          name: t ? t.technicianName : formData.name,
                          mobile: t ? t.contactNumber : formData.mobile,
                          email: t ? t.emailId : formData.email,
                          city: t ? t.city : formData.city,
                          state: t ? t.state : formData.state,
                          branchName: t ? t.branchName : formData.branchName,
                        });
                      }}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                    >
                      <option value="">-- Select Field Engineer from Master --</option>
                      {technicians.map((t) => (
                        <option key={t._id} value={t.technicianName}>
                          {t.technicianName} ({t.crmCode} • {t.city || t.branchName || 'Field'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Assigned Branch / Hub
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.branchName || 'Derived from Technician Master'}
                      className="w-full bg-[#0f172a]/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASE 6 & 7: SUPER ADMIN / ADMIN */}
            {(isSuperAdminRole || (!isClientRole && !isBranchRole && !isZoneRole && !isFranchiseRole && !isTechnicianRole)) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Zone / Territory</label>
                  <select
                    value={formData.zoneName}
                    onChange={(e) => setFormData({ ...formData, zoneName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="All">All Zones (National)</option>
                    {ZONES_LIST.map((z) => (
                      <option key={z} value={z}>
                        {z} Zone
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Assigned Branch (Optional)</label>
                  <select
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">All Branches / Non-Branch Specific</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b.branchName}>
                        {b.branchName} ({b.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scope Description</label>
                  <input
                    type="text"
                    readOnly
                    value={isSuperAdminRole ? 'Full Enterprise System Access' : 'Administrative Scope'}
                    className="w-full bg-[#0f172a]/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400"
                  />
                </div>
              </div>
            )}

            {/* ORGANIZATIONAL ASSIGNMENT SUMMARY BANNER */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-400 font-bold">📌 Organizational Summary:</span>
                <span className="text-white font-medium">Role: {formData.role}</span>
                {formData.clientName && (
                  <span className="text-cyan-300 font-medium">• Client: {formData.clientName}</span>
                )}
                {formData.brandName && (
                  <span className="text-cyan-200">• Brand: {formData.brandName}</span>
                )}
                {formData.branchName && (
                  <span className="text-indigo-300">• Branch: {formData.branchName}</span>
                )}
                {formData.franchiseName && (
                  <span className="text-amber-300">• Franchise: {formData.franchiseName}</span>
                )}
                {formData.technicianName && (
                  <span className="text-emerald-300">• Engineer: {formData.technicianName}</span>
                )}
              </div>
              <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Scope: {formData.organizationalScope}
              </span>
            </div>
          </div>

          {/* SECTION 3: PERSONAL DETAILS & ADDRESS */}
          <div className="space-y-3 pt-3 border-t border-[#334155]">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-blue-500/20 pb-1">
              3. Personal Details & Address (Automatic PIN Code Lookup)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Sharma"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email ID</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. user@quickserves.com"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Residential / Office Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Complete street address..."
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Landmark</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  placeholder="Nearby landmark..."
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  PIN Code (Auto-Lookup)
                </label>
                <PincodeField
                  value={formData.pincode}
                  onChange={(pin) => setFormData({ ...formData, pincode: pin })}
                  onLocationFound={handleLocationFound}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: SYSTEM AUTHENTICATION CREDENTIALS */}
          <div className="space-y-3 pt-3 border-t border-[#334155]">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-1">
              4. System Authentication Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  User Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingUserId}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  placeholder="e.g. ram_sharma"
                  className={`w-full border rounded-lg px-3 py-2 text-xs text-white focus:outline-none ${
                    editingUserId
                      ? 'bg-slate-800 border-slate-700 cursor-not-allowed text-slate-400'
                      : 'bg-[#0f172a] border-[#334155] focus:border-amber-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {editingUserId ? 'New Password (Leave blank to keep)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required={!editingUserId && !!formData.password}
                  value={formData.rePassword}
                  onChange={(e) => setFormData({ ...formData, rePassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-[#334155]">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Reset / Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/30 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Saving User Account...</span>
                </>
              ) : (
                <span>{editingUserId ? 'Update User Account' : 'Save & Provision User'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Existing Users List & Filter Table */}
      <div id="user-directory-section" className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden">
        <div className="bg-[#172033] px-6 py-4 border-b border-[#334155] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-200">User Accounts Directory</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Active CRM accounts, organizational scopes and assigned administrative roles
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Scopes</option>
              <option value="NATIONAL">National</option>
              <option value="CLIENT">Client</option>
              <option value="BRANCH">Branch</option>
              <option value="ZONE">Zone</option>
              <option value="FRANCHISE">Franchise</option>
              <option value="TECHNICIAN">Technician</option>
            </select>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">All Roles</option>
              {roles.map((r) => (
                <option key={r._id} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search user, name, client, branch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 w-full sm:w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-horizontal-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading provisioned users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No users found matching query.</div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300 min-w-[1100px]">
              <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Organizational Scope & Entity</th>
                  <th className="p-3">Reports To</th>
                  <th className="p-3">Mobile & City</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                {filteredUsers.map((u) => {
                  const scope = u.organizationalScope || 'NATIONAL';
                  return (
                    <tr key={u._id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-mono text-emerald-400 font-semibold">{u.username}</td>
                      <td className="p-3 text-white font-medium">{u.fullName}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3">
                        {scope === 'CLIENT' && (
                          <div>
                            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.2 rounded font-mono font-bold mr-1">
                              CLIENT
                            </span>
                            <span className="text-white font-semibold">{u.clientName || 'Assigned Client'}</span>
                            {u.brandName && (
                              <span className="text-[10px] text-slate-400 block">• Brand: {u.brandName}</span>
                            )}
                          </div>
                        )}
                        {scope === 'BRANCH' && (
                          <div>
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-mono font-bold mr-1">
                              BRANCH
                            </span>
                            <span className="text-white font-semibold">{u.branchName || u.assignedBranch}</span>
                          </div>
                        )}
                        {scope === 'ZONE' && (
                          <div>
                            <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-mono font-bold mr-1">
                              ZONE
                            </span>
                            <span className="text-white font-semibold">{u.zoneName || u.assignedZone} Zone</span>
                          </div>
                        )}
                        {scope === 'FRANCHISE' && (
                          <div>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold mr-1">
                              FRANCHISE
                            </span>
                            <span className="text-white font-semibold">{u.franchiseName}</span>
                          </div>
                        )}
                        {scope === 'TECHNICIAN' && (
                          <div>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-bold mr-1">
                              TECHNICIAN
                            </span>
                            <span className="text-white font-semibold">{u.technicianName}</span>
                          </div>
                        )}
                        {scope === 'NATIONAL' && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
                            All Zones / National
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-400">{u.reportingTo || '—'}</td>
                      <td className="p-3">
                        <span className="font-mono text-slate-300 block">{u.mobile || '—'}</span>
                        <span className="text-[10px] text-slate-500">{u.city || ''}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEdit(u)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                          >
                            Edit
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u._id, u.username)}
                              className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded text-xs transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

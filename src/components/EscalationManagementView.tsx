'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface EscalationManagementProps {
  initialMode?: string;
  currentUser?: any;
  initialCallData?: any; // For 1-click raising from Call Details / Service Call
}

const ESCALATION_TABS = [
  { id: 'escalationDashboard', label: '📊 Dashboard', icon: '📊' },
  { id: 'raiseEscalation', label: '➕ Raise Escalation', icon: '➕' },
  { id: 'allEscalations', label: '📋 All Escalations', icon: '📋' },
  { id: 'myEscalations', label: '👤 My Escalations', icon: '👤' },
  { id: 'pendingMyApproval', label: '⏳ Pending My Approval', icon: '⏳' },
  { id: 'approvedEscalations', label: '✅ Approved', icon: '✅' },
  { id: 'rejectedEscalations', label: '❌ Rejected', icon: '❌' },
  { id: 'escalationCategories', label: '🏷️ Categories', icon: '🏷️' },
  { id: 'escalationConfig', label: '⚙️ Configuration', icon: '⚙️' },
  { id: 'escalationReports', label: '📈 Reports', icon: '📈' },
];

export default function EscalationManagementView({
  initialMode = 'escalationDashboard',
  currentUser,
  initialCallData,
}: EscalationManagementProps) {
  const [activeTab, setActiveTab] = useState(initialMode);

  // User details & roles
  const currentUserId = currentUser?.id || currentUser?._id;
  const currentUserName = currentUser?.fullName || currentUser?.username || 'Super Admin';
  const roleCode = (currentUser?.roleCode || currentUser?.role || 'SUPER_ADMIN')
    .toUpperCase()
    .replace(/\s+/g, '_');
  const isSuperAdmin = roleCode === 'SUPER_ADMIN' || currentUser?.role === 'Super Admin';
  const isManagerRole =
    isSuperAdmin ||
    ['ADMIN', 'HOD', 'ZSM', 'BSM', 'BRANCH_MANAGER', 'ZONE_MANAGER', 'FRANCHISE_MANAGER'].includes(roleCode);

  // Notification state
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);

  // Masters & Dropdowns
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<any[]>([]);
  const [moduleMappings, setModuleMappings] = useState<any[]>([]);
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  // Escalations List State
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterProductCat, setFilterProductCat] = useState('ALL');

  // Selected Escalation for View / Review Modal
  const [selectedEscalation, setSelectedEscalation] = useState<any | null>(null);

  // Approval / Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_INFO'>('APPROVE');
  const [managerComments, setManagerComments] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  // Raise Escalation Form State
  const initialFormState = {
    // Call Reference
    callId: '',
    complaintNo: '',
    callNo: '',
    sourceModule: 'Call Management',

    // Customer Coordinates
    customerId: '',
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    customerAddress: '',
    city: '',
    state: '',
    pincode: '',

    // Product Coordinates
    productCategoryId: '',
    productCategory: 'Television',
    productId: '',
    productName: '',
    brandId: '',
    brandName: '',
    modelId: '',
    modelNo: '',
    unitSerialNumber: '',
    warrantyStatus: 'Under Warranty',
    purchaseDate: '',
    invoiceNo: '',

    // Category & Subcategory
    categoryId: '',
    subcategoryId: '',
    priority: 'HIGH',

    // Technical / TV Panel Fields
    requestedPart: 'Television Panel',
    reasonForReplacement: '',
    technicalDiagnosis: '',
    problemDescription: '',
    requestedReplacementDetails: '',
    technicianRemarks: '',
    estimatedPartCost: '',

    // Hierarchy
    branch: currentUser?.branchName || currentUser?.assignedBranch || '',
    zone: currentUser?.zoneName || currentUser?.assignedZone || '',
    franchise: currentUser?.franchiseName || '',

    // Attachments
    attachments: [] as any[],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submittingEscalation, setSubmittingEscalation] = useState(false);
  const [callSearchInput, setCallSearchInput] = useState('');
  const [searchingCall, setSearchingCall] = useState(false);
  const [callSearchResults, setCallSearchResults] = useState<any[]>([]);

  // Category & Subcategory Creation Modals (Super Admin)
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatData, setNewCatData] = useState({
    name: '',
    code: '',
    description: '',
    department: 'Technical Services',
    associatedProductCategory: 'All',
    defaultManagerId: '',
    defaultManagerName: '',
    priority: 'HIGH',
    approvalRequired: true,
  });

  const [subcatModalOpen, setSubcatModalOpen] = useState(false);
  const [newSubcatData, setNewSubcatData] = useState({
    name: '',
    code: '',
    categoryId: '',
    productCategoryName: 'Television',
    description: '',
    responsibleManagerId: '',
    responsibleManagerName: '',
    priority: 'HIGH',
    slaHours: 48,
    requiredAttachments: [] as string[],
    mandatoryFields: ['technicalDiagnosis', 'requestedPart', 'unitSerialNumber'],
  });

  // Rule Creation Modal
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    ruleName: '',
    categoryId: '',
    subcategoryId: '',
    productCategoryName: 'All',
    managerUserId: '',
    backupManagerId: '',
    branch: 'All',
    zone: 'All',
    priority: 'HIGH',
    slaHours: 48,
    rulePriority: 10,
  });

  // File Upload State
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachmentTypeSelect, setAttachmentTypeSelect] = useState('Front Display Defect Photo');

  // React to initialMode prop change
  useEffect(() => {
    if (initialMode) {
      setActiveTab(initialMode);
    }
  }, [initialMode]);

  // Initial Data Fetch
  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
    fetchAssignmentRules();
    fetchModuleMappings();
    fetchCommonMasters();
    fetchNotifications();
  }, []);

  // Fetch Escalations on tab or filter change
  useEffect(() => {
    if (activeTab === 'escalationDashboard') {
      fetchDashboardStats();
    }
    fetchEscalations();
  }, [activeTab, filterStatus, filterPriority, filterCategory, filterProductCat]);

  // Pre-fill if initialCallData passed
  useEffect(() => {
    if (initialCallData) {
      handleSelectCall(initialCallData);
    }
  }, [initialCallData]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/escalations/categories');
      const json = await res.json();
      if (json.success) {
        setCategories(json.data || []);
        // Pre-select Spare Parts Replacement by default if not set
        if (!formData.categoryId) {
          const spareCat = json.data.find(
            (c: any) => c.code === 'SPARE_PARTS_REPLACEMENT' || c.name.toLowerCase().includes('spare')
          );
          if (spareCat) {
            setFormData((prev) => ({ ...prev, categoryId: spareCat._id }));
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e);
    }
  };

  const fetchSubcategories = async (catId?: string) => {
    try {
      const q = catId ? `?categoryId=${catId}` : '';
      const res = await fetch(`/api/escalations/subcategories${q}`);
      const json = await res.json();
      if (json.success) {
        setSubcategories(json.data || []);
        // Auto select TV Panel Replacement if available
        if (!formData.subcategoryId) {
          const tvSub = json.data.find(
            (s: any) => s.code === 'TV_PANEL_REPLACEMENT' || s.name.toLowerCase().includes('panel')
          );
          if (tvSub) {
            setFormData((prev) => ({
              ...prev,
              subcategoryId: tvSub._id,
              requestedPart: 'Television Panel',
              productCategory: tvSub.productCategoryName || prev.productCategory,
            }));
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch subcategories:', e);
    }
  };

  const fetchAssignmentRules = async () => {
    try {
      const res = await fetch('/api/escalations/rules');
      const json = await res.json();
      if (json.success) setAssignmentRules(json.data || []);
    } catch (e) {
      console.error('Failed to fetch assignment rules:', e);
    }
  };

  const fetchModuleMappings = async () => {
    try {
      const res = await fetch('/api/escalations/modules');
      const json = await res.json();
      if (json.success) setModuleMappings(json.data || []);
    } catch (e) {
      console.error('Failed to fetch module mappings:', e);
    }
  };

  const fetchCommonMasters = async () => {
    try {
      const [usersRes, catsRes, brandsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/masters/categories'),
        fetch('/api/masters/brands'),
      ]);
      const [uJson, cJson, bJson] = await Promise.all([
        usersRes.json().catch(() => ({})),
        catsRes.json().catch(() => ({})),
        brandsRes.json().catch(() => ({})),
      ]);
      if (uJson.success) setSystemUsers(uJson.data || []);
      if (cJson.success) setProductCategories(cJson.data || []);
      if (bJson.success) setBrands(bJson.data || []);
    } catch (e) {
      console.error('Failed to fetch common masters:', e);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUserId}`);
      const json = await res.json();
      if (json.success) {
        setUnreadNotifications(json.data.filter((n: any) => !n.isRead));
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const q = new URLSearchParams();
      if (currentUserId) q.set('userId', currentUserId);
      q.set('roleCode', roleCode);
      const res = await fetch(`/api/escalations/stats?${q.toString()}`);
      const json = await res.json();
      if (json.success) {
        setDashboardStats(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats:', e);
    }
  };

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();

      // Map tab to filterTab
      if (activeTab === 'pendingMyApproval') q.set('filterTab', 'pending');
      else if (activeTab === 'myEscalations') q.set('filterTab', 'my');
      else if (activeTab === 'approvedEscalations') q.set('filterTab', 'approved');
      else if (activeTab === 'rejectedEscalations') q.set('filterTab', 'rejected');
      else q.set('filterTab', 'all');

      if (currentUserId) q.set('userId', currentUserId);
      q.set('roleCode', roleCode);
      if (currentUser?.role) q.set('userRole', currentUser.role);

      if (searchTerm) q.set('search', searchTerm);
      if (filterStatus !== 'ALL') q.set('status', filterStatus);
      if (filterPriority !== 'ALL') q.set('priority', filterPriority);
      if (filterCategory !== 'ALL') q.set('categoryId', filterCategory);
      if (filterProductCat !== 'ALL') q.set('productCategory', filterProductCat);

      const res = await fetch(`/api/escalations?${q.toString()}`);
      const json = await res.json();
      if (json.success) {
        setEscalations(json.data || []);
      } else {
        setEscalations([]);
      }
    } catch (e) {
      console.error('Error fetching escalations:', e);
    } finally {
      setLoading(false);
    }
  };

  // Autocomplete Call Search
  const handleSearchCalls = async () => {
    if (!callSearchInput.trim()) return;
    setSearchingCall(true);
    try {
      const q = new URLSearchParams();
      const input = callSearchInput.trim();
      if (input.startsWith('QS') || /^\d+$/.test(input)) {
        q.set('complaintNo', input);
      } else {
        q.set('customerName', input);
      }
      const res = await fetch(`/api/calls?${q.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCallSearchResults(json.data.slice(0, 8));
      } else {
        setCallSearchResults([]);
      }
    } catch (e) {
      console.error('Error searching calls:', e);
    } finally {
      setSearchingCall(false);
    }
  };

  // Pre-fill form when a call is selected
  const handleSelectCall = (call: any) => {
    setFormData((prev) => ({
      ...prev,
      callId: call._id,
      callNo: call.callNo || '',
      complaintNo: call.complaintNo || '',
      customerId: call.customerId || '',
      customerName: call.customerName || '',
      customerMobile: call.customerMobile || '',
      customerEmail: call.customerEmail || '',
      customerAddress: call.customerAddress || call.customerAddress1 || '',
      city: call.city || '',
      state: call.state || '',
      pincode: call.pincode || '',

      productCategoryId: call.categoryId || prev.productCategoryId,
      productCategory: call.categoryName || 'Television',
      productId: call.productId || prev.productId,
      productName: call.productName || prev.productName,
      brandId: call.brandId || prev.brandId,
      brandName: call.brandName || prev.brandName,
      modelId: call.modelId || prev.modelId,
      modelNo: call.modelNo || prev.modelNo,
      unitSerialNumber: call.unitSerialNumber || call.serialNo || '',
      warrantyStatus: call.warrantyStatus || 'Under Warranty',
      purchaseDate: call.productDOP || call.dealerDOP || '',
      invoiceNo: call.invoiceNo || '',

      branch: call.branch || prev.branch,
      zone: call.region || prev.zone,
    }));
    setCallSearchResults([]);
  };

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('attachmentType', attachmentTypeSelect);
      fd.append('uploadedBy', currentUserName);

      const res = await fetch('/api/escalations/attachments', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (json.success && json.data) {
        setFormData((prev) => ({
          ...prev,
          attachments: [...prev.attachments, json.data],
        }));
      } else {
        alert(json.message || 'File upload failed');
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message);
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
    }));
  };

  // Submit Escalation Handler
  const handleSubmitEscalation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.subcategoryId) {
      alert('Please select both Escalation Category and Subcategory.');
      return;
    }
    if (!formData.customerName || !formData.customerMobile) {
      alert('Customer Name and Mobile are required.');
      return;
    }
    if (!formData.technicalDiagnosis.trim() || !formData.reasonForReplacement.trim()) {
      alert('Technical Diagnosis and Reason for Replacement are mandatory fields.');
      return;
    }

    setSubmittingEscalation(true);
    try {
      const payload = {
        ...formData,
        requesterUserId: currentUserId,
        requesterName: currentUserName,
        requesterRole: currentUser?.role || 'Staff',
      };

      const res = await fetch('/api/escalations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(`Escalation raised successfully! ID: ${json.data.escalationNo}`);
        setFormData(initialFormState);
        fetchEscalations();
        setActiveTab('myEscalations');
      } else {
        alert(json.message || 'Failed to submit escalation.');
      }
    } catch (err: any) {
      alert('Submission error: ' + err.message);
    } finally {
      setSubmittingEscalation(false);
    }
  };

  // Manager Approval / Rejection Submit Handler
  const handleDecisionSubmit = async () => {
    if (!selectedEscalation) return;

    if (!managerComments.trim()) {
      alert('Manager Comments / Remarks are mandatory. You cannot proceed without entering a comment.');
      return;
    }

    setProcessingDecision(true);
    try {
      const res = await fetch(`/api/escalations/${selectedEscalation._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: decisionAction,
          comments: managerComments.trim(),
          managerId: currentUserId,
          managerName: currentUserName,
          managerRole: currentUser?.role || 'Manager',
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(`Escalation ${selectedEscalation.escalationNo} ${decisionAction === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`);
        setDecisionModalOpen(false);
        setManagerComments('');
        setSelectedEscalation(json.data);
        fetchEscalations();
      } else {
        alert(json.message || 'Action failed.');
      }
    } catch (err: any) {
      alert('Decision error: ' + err.message);
    } finally {
      setProcessingDecision(false);
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">APPROVED</span>;
      case 'REJECTED':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[11px] font-bold">REJECTED</span>;
      case 'PENDING_APPROVAL':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold">PENDING APPROVAL</span>;
      case 'UNDER_REVIEW':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px] font-bold">UNDER REVIEW</span>;
      case 'INFO_REQUIRED':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-bold">INFO REQUIRED</span>;
      case 'IN_PROGRESS':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-bold">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-600/30 text-emerald-200 border border-emerald-500/40 px-2 py-0.5 rounded text-[11px] font-bold">COMPLETED</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[11px]">{status}</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'CRITICAL':
        return <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">CRITICAL</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">HIGH</span>;
      case 'MEDIUM':
        return <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="text-[10px] text-slate-400">LOW</span>;
    }
  };

  // Filtered Subcategories based on selected Category in Form
  const availableSubcategories = useMemo(() => {
    if (!formData.categoryId) return subcategories;
    return subcategories.filter((s) => s.categoryId === formData.categoryId);
  }, [subcategories, formData.categoryId]);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Dynamic Escalation & Manager Approval System
            </h1>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
              v2.0 Configurable
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Product escalations, major spare parts replacement (TV panels, compressors, motors), technical approvals & SLA tracking
          </p>
        </div>

        {/* Quick Tabs & Notification pill */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadNotifications.length > 0 && (
            <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5">
              <span>🔔</span>
              <span>{unreadNotifications.length} Action Items</span>
            </div>
          )}
          <button
            onClick={() => setActiveTab('raiseEscalation')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-lg shadow-emerald-900/30 transition flex items-center space-x-1.5"
          >
            <span>➕</span>
            <span>Raise Escalation</span>
          </button>
        </div>
      </div>

      {/* TOP SUBMENU NAV BAR */}
      <div className="flex items-center space-x-1.5 overflow-x-auto custom-horizontal-scrollbar pb-2 border-b border-[#334155]">
        {ESCALATION_TABS.map((t) => {
          // Hide configuration and categories from non-authorized users
          if ((t.id === 'escalationCategories' || t.id === 'escalationConfig') && !isSuperAdmin) {
            return null;
          }
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#182335] text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ESCALATION DASHBOARD */}
      {activeTab === 'escalationDashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-blue-500 shadow">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Total</span>
              <h4 className="text-xl font-bold text-white mt-1">{dashboardStats?.kpi?.totalEscalations || 0}</h4>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-amber-500 shadow">
              <span className="text-[10px] text-amber-300 font-semibold uppercase">Pending</span>
              <h4 className="text-xl font-bold text-amber-400 mt-1">{dashboardStats?.kpi?.pendingApproval || 0}</h4>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-cyan-500 shadow">
              <span className="text-[10px] text-cyan-300 font-semibold uppercase">Review</span>
              <h4 className="text-xl font-bold text-cyan-400 mt-1">{dashboardStats?.kpi?.underReview || 0}</h4>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-emerald-500 shadow">
              <span className="text-[10px] text-emerald-300 font-semibold uppercase">Approved</span>
              <h4 className="text-xl font-bold text-emerald-400 mt-1">{dashboardStats?.kpi?.approved || 0}</h4>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-rose-500 shadow">
              <span className="text-[10px] text-rose-300 font-semibold uppercase">Rejected</span>
              <h4 className="text-xl font-bold text-rose-400 mt-1">{dashboardStats?.kpi?.rejected || 0}</h4>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-indigo-500 shadow">
              <span className="text-[10px] text-indigo-300 font-semibold uppercase">In Progress</span>
              <h4 className="text-xl font-bold text-indigo-400 mt-1">{dashboardStats?.kpi?.inProgress || 0}</h4>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-teal-500 shadow">
              <span className="text-[10px] text-teal-300 font-semibold uppercase">Completed</span>
              <h4 className="text-xl font-bold text-teal-400 mt-1">{dashboardStats?.kpi?.completed || 0}</h4>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] p-3 rounded-xl border-l-4 border-l-red-600 shadow">
              <span className="text-[10px] text-red-400 font-semibold uppercase">Overdue SLA</span>
              <h4 className="text-xl font-bold text-red-400 mt-1">{dashboardStats?.kpi?.overdueCount || 0}</h4>
            </div>
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product Category Breakdown */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 shadow">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                📺 Product Wise Escalations
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {dashboardStats?.productWise?.map((p: any) => (
                  <div key={p.name} className="flex justify-between items-center text-xs bg-[#0f172a] p-2 rounded border border-[#334155]/40">
                    <span className="text-slate-300 font-medium">{p.name}</span>
                    <span className="font-mono text-emerald-400 font-bold">{p.count}</span>
                  </div>
                ))}
                {(!dashboardStats?.productWise || dashboardStats.productWise.length === 0) && (
                  <div className="text-xs text-slate-500 text-center py-4">No product data recorded</div>
                )}
              </div>
            </div>

            {/* Subcategory Breakdown (TV Panel, Compressors, etc.) */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 shadow">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                🏷️ Subcategory Breakdown
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {dashboardStats?.subcategoryWise?.map((s: any) => (
                  <div key={s.name} className="flex justify-between items-center text-xs bg-[#0f172a] p-2 rounded border border-[#334155]/40">
                    <span className="text-slate-300 font-medium truncate max-w-[200px]" title={s.name}>
                      {s.name}
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{s.count}</span>
                  </div>
                ))}
                {(!dashboardStats?.subcategoryWise || dashboardStats.subcategoryWise.length === 0) && (
                  <div className="text-xs text-slate-500 text-center py-4">No subcategory records</div>
                )}
              </div>
            </div>

            {/* Manager Pending Approval Queue */}
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 shadow">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                ⏳ Manager Pending Queue
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {dashboardStats?.managerPending?.map((m: any) => (
                  <div key={m.name} className="flex justify-between items-center text-xs bg-[#0f172a] p-2 rounded border border-[#334155]/40">
                    <span className="text-slate-300 font-medium">{m.name}</span>
                    <span className="font-mono text-amber-400 font-bold">{m.count} pending</span>
                  </div>
                ))}
                {(!dashboardStats?.managerPending || dashboardStats.managerPending.length === 0) && (
                  <div className="text-xs text-emerald-400 text-center py-4">✨ Zero pending manager queues</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RAISE NEW ESCALATION (Special Workflow for TV Panel & Parts) */}
      {activeTab === 'raiseEscalation' && (
        <form onSubmit={handleSubmitEscalation} className="space-y-6 bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl">
          <div className="border-b border-[#334155] pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>➕ Raise Escalation & Manager Approval Request</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit TV Panel, Major Spare Part or Operational Exception approvals. Details will auto-route to designated Service Manager.
              </p>
            </div>
            {formData.complaintNo && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded text-xs font-mono font-bold">
                Linked Complaint: {formData.complaintNo}
              </span>
            )}
          </div>

          {/* STEP 1: FAST SERVICE CALL SEARCH / AUTO-FETCH */}
          <div className="bg-[#111c2e] border border-[#334155] p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              1. Link Service Call / Customer Ticket (Auto-Fetch Customer & Product)
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Complaint No (e.g. QS26110200001) or Customer Name / Mobile..."
                value={callSearchInput}
                onChange={(e) => setCallSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchCalls();
                  }
                }}
                className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleSearchCalls}
                disabled={searchingCall}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                {searchingCall ? 'Searching...' : '🔍 Fetch Call'}
              </button>
            </div>

            {/* Results Autocomplete Box */}
            {callSearchResults.length > 0 && (
              <div className="bg-[#0f172a] border border-cyan-500/30 rounded-lg p-2 space-y-1.5 mt-2 max-h-48 overflow-y-auto">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block px-2">Select Call to Pre-fill:</span>
                {callSearchResults.map((call) => (
                  <div
                    key={call._id}
                    onClick={() => handleSelectCall(call)}
                    className="p-2 hover:bg-slate-800 rounded cursor-pointer transition flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono text-cyan-400 font-bold mr-2">{call.complaintNo}</span>
                      <span className="text-white font-medium">{call.customerName}</span>
                      <span className="text-slate-400 ml-2">({call.productName || call.categoryName || 'Appliance'})</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">{call.customerMobile}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: CLASSIFICATION (Category & Subcategory) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Escalation Category *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => {
                  const catId = e.target.value;
                  const cat = categories.find((c) => c._id === catId);
                  setFormData((prev) => ({
                    ...prev,
                    categoryId: catId,
                    subcategoryId: '', // reset subcat on category change
                  }));
                  fetchSubcategories(catId);
                }}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">-- Select Escalation Category --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Escalation Subcategory (Workflow) *
              </label>
              <select
                required
                value={formData.subcategoryId}
                onChange={(e) => {
                  const subId = e.target.value;
                  const sub = subcategories.find((s) => s._id === subId);
                  setFormData((prev) => ({
                    ...prev,
                    subcategoryId: subId,
                    requestedPart: sub?.name.includes('Panel') ? 'Television Panel' : prev.requestedPart,
                    productCategory: sub?.productCategoryName !== 'All' ? sub?.productCategoryName || prev.productCategory : prev.productCategory,
                  }));
                }}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
              >
                <option value="">-- Select Subcategory --</option>
                {availableSubcategories.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.productCategoryName || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Escalation Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="CRITICAL">Critical (24h SLA)</option>
                <option value="HIGH">High (48h SLA)</option>
                <option value="MEDIUM">Medium (72h SLA)</option>
                <option value="LOW">Low (96h SLA)</option>
              </select>
            </div>
          </div>

          {/* STEP 3: CUSTOMER & PRODUCT COORDINATES */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[#111c2e] border border-[#334155] rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Mobile *</label>
              <input
                type="text"
                required
                value={formData.customerMobile}
                onChange={(e) => setFormData({ ...formData, customerMobile: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Category *</label>
              <input
                type="text"
                required
                value={formData.productCategory}
                onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model Number</label>
              <input
                type="text"
                value={formData.modelNo}
                onChange={(e) => setFormData({ ...formData, modelNo: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number</label>
              <input
                type="text"
                value={formData.unitSerialNumber}
                onChange={(e) => setFormData({ ...formData, unitSerialNumber: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Warranty Status</label>
              <select
                value={formData.warrantyStatus}
                onChange={(e) => setFormData({ ...formData, warrantyStatus: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
              >
                <option value="Under Warranty">Under Warranty</option>
                <option value="Out of Warranty">Out of Warranty</option>
                <option value="Extended Warranty">Extended Warranty</option>
                <option value="Special Concession">Special Concession</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Date (DOP)</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          {/* STEP 4: TECHNICAL DIAGNOSIS & REPLACEMENT WORKFLOW (Dedicated for TV Panels) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-amber-500/20 pb-1">
              2. Technical Diagnosis & Component Replacement Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Requested Part / Major Component *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Television Panel (OLED/LED), Inverter Compressor, Mainboard"
                  value={formData.requestedPart}
                  onChange={(e) => setFormData({ ...formData, requestedPart: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estimated Part Cost (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 18500"
                  value={formData.estimatedPartCost}
                  onChange={(e) => setFormData({ ...formData, estimatedPartCost: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Technical Diagnosis (Mandatory for Approval) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail fault symptoms: e.g. Vertical line on LCD matrix, panel glass crack internal, back-light OK but zero raster, shorted COF IC..."
                  value={formData.technicalDiagnosis}
                  onChange={(e) => setFormData({ ...formData, technicalDiagnosis: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Replacement & Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide managerial justification: e.g. Component cannot be component-level repaired; panel bonded tab damaged; replacement required per OEM SOP..."
                  value={formData.reasonForReplacement}
                  onChange={(e) => setFormData({ ...formData, reasonForReplacement: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* STEP 5: SUPPORTING ATTACHMENTS & PHOTOS (Front Display, Serial Label, etc.) */}
          <div className="space-y-3 pt-3 border-t border-[#334155]">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Supporting Photographs & Inspection Evidence
            </h3>
            <p className="text-[11px] text-slate-400">
              Upload front panel fault photo, rear nameplate label, and customer invoice. Max 25MB per file.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={attachmentTypeSelect}
                onChange={(e) => setAttachmentTypeSelect(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="Front Display Defect Photo">Front Display Defect Photo</option>
                <option value="Rear Nameplate / Serial Label">Rear Nameplate / Serial Label</option>
                <option value="Customer Purchase Invoice">Customer Purchase Invoice</option>
                <option value="Defective Part Close-up">Defective Part Close-up</option>
                <option value="Pressure / Multimeter Reading">Pressure / Multimeter Reading</option>
              </select>

              <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition">
                {uploadingFile ? 'Uploading...' : '📁 Select Photo to Attach'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  disabled={uploadingFile}
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Uploaded File List */}
            {formData.attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {formData.attachments.map((att, idx) => (
                  <div key={idx} className="bg-[#0f172a] border border-[#334155] rounded-lg p-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] text-emerald-400 font-bold block truncate">{att.attachmentType}</span>
                      <span className="text-xs text-slate-300 block truncate">{att.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-rose-400 hover:text-rose-300 text-xs px-1.5 py-0.5 rounded bg-rose-500/10"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end pt-4 border-t border-[#334155]">
            <button
              type="submit"
              disabled={submittingEscalation}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-emerald-900/30 transition flex items-center space-x-2"
            >
              {submittingEscalation ? (
                <span>Submitting & Routing to Manager...</span>
              ) : (
                <span>Submit Escalation For Approval</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* TAB 3-7: ESCALATION DATA TABLES (All, My, Pending, Approved, Rejected) */}
      {['allEscalations', 'myEscalations', 'pendingMyApproval', 'approvedEscalations', 'rejectedEscalations'].includes(activeTab) && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-xl overflow-hidden space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#172033] p-4 border-b border-[#334155] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search Escalation ID, Customer, Serial, Part..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 w-64"
              />

              {activeTab === 'allEscalations' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#0f172a] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_APPROVAL">Pending Approval</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              )}

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <select
                value={filterProductCat}
                onChange={(e) => setFilterProductCat(e.target.value)}
                className="bg-[#0f172a] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
              >
                <option value="ALL">All Products</option>
                <option value="Television">Television</option>
                <option value="Refrigerator">Refrigerator</option>
                <option value="Washing Machine">Washing Machine</option>
                <option value="Air Conditioner">Air Conditioner</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-mono">Total: {escalations.length}</span>
              <button
                onClick={fetchEscalations}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg border border-slate-700"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto custom-horizontal-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading escalations...</div>
            ) : escalations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No escalations found in this queue.</div>
            ) : (
              <table className="w-full text-left text-xs text-slate-300 min-w-[1050px]">
                <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155]">
                  <tr>
                    <th className="p-3">Escalation ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Customer & Mobile</th>
                    <th className="p-3">Product & Category</th>
                    <th className="p-3">Requested Part</th>
                    <th className="p-3">Assigned Manager</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3">Fulfilment</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                  {escalations.map((esc) => {
                    const isAssignedToMe = currentUserId && esc.assignedManagerId?.toString() === currentUserId.toString();
                    const canMakeDecision = (isSuperAdmin || isAssignedToMe) && ['PENDING_APPROVAL', 'UNDER_REVIEW'].includes(esc.status);

                    return (
                      <tr key={esc._id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <span className="font-mono text-emerald-400 font-bold block">{esc.escalationNo}</span>
                          {esc.complaintNo && (
                            <span className="text-[10px] text-slate-400 font-mono">Ref: {esc.complaintNo}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-400">
                          {new Date(esc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <span className="text-white font-semibold block">{esc.customerName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{esc.customerMobile}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-200 font-medium block">{esc.productCategory}</span>
                          <span className="text-[10px] text-slate-400">{esc.brandName} {esc.modelNo}</span>
                        </td>
                        <td className="p-3 font-semibold text-amber-300">
                          {esc.requestedPart}
                        </td>
                        <td className="p-3">
                          <span className="text-slate-300 font-medium block">{esc.assignedManagerName}</span>
                          {esc.isOverdue && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1 rounded font-bold">OVERDUE</span>
                          )}
                        </td>
                        <td className="p-3">{getPriorityBadge(esc.priority)}</td>
                        <td className="p-3">{getStatusBadge(esc.status)}</td>
                        <td className="p-3">
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{esc.fulfilmentStatus || 'NOT_STARTED'}</span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedEscalation(esc)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                            >
                              View
                            </button>
                            {canMakeDecision && (
                              <button
                                onClick={() => {
                                  setSelectedEscalation(esc);
                                  setDecisionAction('APPROVE');
                                  setDecisionModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition"
                              >
                                Review & Decide
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
      )}

      {/* TAB 8: ESCALATION CATEGORIES (Super Admin Dynamic Config) */}
      {activeTab === 'escalationCategories' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  🏷️ Escalation Categories Master
                </h3>
                <p className="text-xs text-slate-400">
                  Manage primary escalation headers (Spare Parts Replacement, Product Damage, etc.)
                </p>
              </div>
              <button
                onClick={() => setCatModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                ➕ New Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat._id} className="bg-[#111c2e] border border-[#334155] rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-white text-sm">{cat.name}</span>
                    <span className="text-[10px] bg-slate-800 text-emerald-400 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                      {cat.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{cat.description || 'No description'}</p>
                  <div className="pt-2 border-t border-[#334155]/60 flex justify-between items-center text-[11px] text-slate-400">
                    <span>Subcategories: {cat.subcategoryCount || 0}</span>
                    <span className="text-amber-400 font-semibold">{cat.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subcategories Master */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  📂 Escalation Subcategories Master
                </h3>
                <p className="text-xs text-slate-400">
                  Configurable subcategory workflows: TV Panel Replacement, Compressors, PCB, Motors with SLA & designated approvers
                </p>
              </div>
              <button
                onClick={() => {
                  if (categories.length > 0) {
                    setNewSubcatData((prev) => ({ ...prev, categoryId: categories[0]._id }));
                  }
                  setSubcatModalOpen(true);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                ➕ New Subcategory
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] border-b border-[#334155]">
                  <tr>
                    <th className="p-2.5">Subcategory Name</th>
                    <th className="p-2.5">Parent Category</th>
                    <th className="p-2.5">Appliance</th>
                    <th className="p-2.5">Responsible Manager</th>
                    <th className="p-2.5">SLA Hours</th>
                    <th className="p-2.5">Required Attachments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                  {subcategories.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-white">{sub.name}</td>
                      <td className="p-2.5 text-slate-300">{sub.categoryName}</td>
                      <td className="p-2.5 text-cyan-400">{sub.productCategoryName || 'All'}</td>
                      <td className="p-2.5 text-amber-300">{sub.responsibleManagerName || 'Super Admin'}</td>
                      <td className="p-2.5 font-mono">{sub.slaHours || 48} hrs</td>
                      <td className="p-2.5 text-[11px] text-slate-400">
                        {sub.requiredAttachments?.length > 0 ? sub.requiredAttachments.join(', ') : 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: ESCALATION CONFIGURATION (Assignment Rules & Module Mappings) */}
      {activeTab === 'escalationConfig' && isSuperAdmin && (
        <div className="space-y-6">
          {/* Assignment Rules */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  ⚙️ Dynamic Product-Wise Manager Assignment Rules
                </h3>
                <p className="text-xs text-slate-400">
                  Configure which service manager approves specific products (e.g. TV Panel &rarr; TV Manager, Compressor &rarr; Refrigerator Manager)
                </p>
              </div>
              <button
                onClick={() => {
                  if (categories.length > 0) {
                    setNewRuleData((prev) => ({ ...prev, categoryId: categories[0]._id }));
                  }
                  setRuleModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                ➕ New Assignment Rule
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#111c2e] text-slate-400 uppercase text-[10px] border-b border-[#334155]">
                  <tr>
                    <th className="p-2.5">Rule Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Subcategory</th>
                    <th className="p-2.5">Product Category</th>
                    <th className="p-2.5">Assigned Manager</th>
                    <th className="p-2.5">Branch/Zone</th>
                    <th className="p-2.5">SLA</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60 bg-[#1e293b]">
                  {assignmentRules.map((rule) => (
                    <tr key={rule._id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-white">{rule.ruleName}</td>
                      <td className="p-2.5 text-slate-300">{rule.categoryName}</td>
                      <td className="p-2.5 text-amber-300">{rule.subcategoryName || 'All'}</td>
                      <td className="p-2.5 text-cyan-400">{rule.productCategoryName || 'All'}</td>
                      <td className="p-2.5 font-bold text-emerald-400">{rule.managerName}</td>
                      <td className="p-2.5 text-slate-400">{rule.branch || 'All'} / {rule.zone || 'All'}</td>
                      <td className="p-2.5 font-mono">{rule.slaHours}h</td>
                      <td className="p-2.5">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                          {rule.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {assignmentRules.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-500 text-xs">
                        No custom rules configured yet. Defaults to Subcategory & Category Managers.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Module Integration Mappings */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
              🔗 CRM Module Integration Mappings
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enable or disable direct escalation generation from specific CRM modules (Call Management, Job Sheet, etc.)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moduleMappings.map((mod) => (
                <div key={mod._id} className="bg-[#111c2e] border border-[#334155] rounded-lg p-3.5 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white text-xs block">{mod.moduleName}</span>
                    <span className="text-[11px] text-slate-400">{mod.description}</span>
                  </div>
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/escalations/modules', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moduleKey: mod.moduleKey, enabled: !mod.enabled }),
                      });
                      if (res.ok) fetchModuleMappings();
                    }}
                    className={`text-xs font-bold px-3 py-1 rounded transition ${
                      mod.enabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {mod.enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: ESCALATION REPORTS */}
      {activeTab === 'escalationReports' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-[#334155] pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Escalation SLA & Performance Reports</h3>
              <p className="text-xs text-slate-400">Export complete transactional audit log and resolution metrics</p>
            </div>
            <button
              onClick={() => {
                if (escalations.length === 0) {
                  alert('No records to export');
                  return;
                }
                const headers = ['Escalation No', 'Date', 'Customer', 'Mobile', 'Category', 'Subcategory', 'Part', 'Manager', 'Status', 'Cost'];
                const rows = escalations.map((e) => [
                  e.escalationNo,
                  new Date(e.createdAt).toLocaleDateString(),
                  `"${e.customerName}"`,
                  e.customerMobile,
                  `"${e.categoryName}"`,
                  `"${e.subcategoryName}"`,
                  `"${e.requestedPart}"`,
                  `"${e.assignedManagerName}"`,
                  e.status,
                  e.estimatedPartCost || 0,
                ]);
                const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `Escalations_Report_${Date.now()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg"
            >
              📥 Export CSV
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Total recorded escalations: <span className="font-bold text-white">{escalations.length}</span>
          </div>
        </div>
      )}

      {/* FULL ESCALATION DETAILS MODAL */}
      {selectedEscalation && !decisionModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-4xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-[#334155] pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-white">{selectedEscalation.escalationNo}</h2>
                  {getStatusBadge(selectedEscalation.status)}
                  {getPriorityBadge(selectedEscalation.priority)}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Raised on {new Date(selectedEscalation.createdAt).toLocaleString()} by {selectedEscalation.requesterName} ({selectedEscalation.requesterRole})
                </p>
              </div>
              <button
                onClick={() => setSelectedEscalation(null)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Coordinates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#111c2e] p-4 rounded-xl border border-[#334155]">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Customer Coordinates</h4>
                <p className="text-xs text-white font-semibold">{selectedEscalation.customerName}</p>
                <p className="text-xs text-slate-300 font-mono">{selectedEscalation.customerMobile}</p>
                <p className="text-xs text-slate-400">{selectedEscalation.customerAddress || 'Address on file'}</p>
                <p className="text-xs text-slate-400">{selectedEscalation.city} {selectedEscalation.state}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Product & Service Details</h4>
                <p className="text-xs text-white font-semibold">{selectedEscalation.productCategory} - {selectedEscalation.brandName}</p>
                <p className="text-xs text-slate-300">Model: {selectedEscalation.modelNo || 'N/A'}</p>
                <p className="text-xs text-slate-300 font-mono">Serial No: {selectedEscalation.unitSerialNumber || 'N/A'}</p>
                <p className="text-xs text-emerald-400">Warranty: {selectedEscalation.warrantyStatus}</p>
              </div>
            </div>

            {/* Technical Diagnosis */}
            <div className="space-y-3 bg-[#0f172a] p-4 rounded-xl border border-[#334155]">
              <h4 className="text-xs font-bold text-amber-400 uppercase">Technical Diagnosis & Replacement Request</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Requested Component:</span>
                  <span className="text-sm font-bold text-white">{selectedEscalation.requestedPart}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Estimated Cost:</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    ₹ {selectedEscalation.estimatedPartCost || 0}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Diagnosis:</span>
                <p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap">{selectedEscalation.technicalDiagnosis}</p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Reason for Replacement:</span>
                <p className="text-xs text-slate-200 mt-0.5 whitespace-pre-wrap">{selectedEscalation.reasonForReplacement}</p>
              </div>
            </div>

            {/* Manager Remarks (if decided) */}
            {selectedEscalation.managerRemarks && (
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                <span className="text-xs font-bold text-emerald-300 block">Manager Decision Comments:</span>
                <p className="text-xs text-white font-medium italic">"{selectedEscalation.managerRemarks}"</p>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Decided by {selectedEscalation.approval?.managerName || selectedEscalation.assignedManagerName} on {selectedEscalation.decisionDate ? new Date(selectedEscalation.decisionDate).toLocaleString() : 'N/A'}
                </span>
              </div>
            )}

            {/* Attachments Gallery */}
            {selectedEscalation.attachments?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Attached Photographs & Evidence</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedEscalation.attachments.map((att: any, i: number) => (
                    <a
                      key={i}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#0f172a] border border-[#334155] rounded-lg p-2.5 block hover:border-emerald-500 transition"
                    >
                      <span className="text-[10px] text-emerald-400 font-bold block truncate">{att.attachmentType}</span>
                      <span className="text-xs text-slate-300 truncate block">{att.fileName}</span>
                      <span className="text-[10px] text-slate-500 mt-1 block">View File &rarr;</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Immutable Timeline Audit Trail */}
            <div className="space-y-2 border-t border-[#334155] pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                📜 Immutable Escalation History
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedEscalation.history?.map((h: any, idx: number) => (
                  <div key={idx} className="bg-[#111c2e] p-2.5 rounded border border-[#334155]/40 text-xs flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white mr-2">{h.action}</span>
                      <span className="text-slate-400">by {h.performedBy} ({h.userRole})</span>
                      <p className="text-slate-300 mt-0.5">{h.comments}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions for Manager */}
            {['PENDING_APPROVAL', 'UNDER_REVIEW'].includes(selectedEscalation.status) && (isSuperAdmin || currentUserId?.toString() === selectedEscalation.assignedManagerId?.toString()) && (
              <div className="flex justify-end gap-3 pt-4 border-t border-[#334155]">
                <button
                  onClick={() => {
                    setDecisionAction('REJECT');
                    setDecisionModalOpen(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-2 rounded-lg transition"
                >
                  ❌ Reject Request
                </button>
                <button
                  onClick={() => {
                    setDecisionAction('APPROVE');
                    setDecisionModalOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2 rounded-lg transition shadow-lg shadow-emerald-900/40"
                >
                  ✅ Approve Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANAGER DECISION MODAL (Mandatory Comments Enforcement) */}
      {decisionModalOpen && selectedEscalation && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#334155] pb-3">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>{decisionAction === 'APPROVE' ? '✅ Manager Approval Decision' : '❌ Rejection Decision'}</span>
              </h3>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#111c2e] p-3 rounded-lg border border-[#334155] text-xs space-y-1">
              <p className="text-slate-300">
                Escalation: <span className="font-mono text-emerald-400 font-bold">{selectedEscalation.escalationNo}</span>
              </p>
              <p className="text-slate-300">
                Customer: <span className="text-white font-medium">{selectedEscalation.customerName}</span>
              </p>
              <p className="text-slate-300">
                Requested Part: <span className="text-amber-300 font-bold">{selectedEscalation.requestedPart}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {decisionAction === 'APPROVE' ? 'Approval Comments / Remarks * (Mandatory)' : 'Rejection Reason / Comments * (Mandatory)'}
              </label>
              <textarea
                required
                rows={4}
                placeholder={
                  decisionAction === 'APPROVE'
                    ? 'Enter approval remarks after reviewing technical diagnosis and warranty criteria...'
                    : 'Specify reason for rejection (e.g. warranty void, customer damage, repairable component)...'
                }
                value={managerComments}
                onChange={(e) => setManagerComments(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                * Managers must enter remarks to complete this decision. This is recorded permanently in the audit trail.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processingDecision || !managerComments.trim()}
                onClick={handleDecisionSubmit}
                className={`px-5 py-2 text-xs font-bold text-white rounded-lg transition shadow ${
                  decisionAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50'
                    : 'bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/50'
                }`}
              >
                {processingDecision ? 'Recording Decision...' : decisionAction === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW CATEGORY MODAL (Super Admin) */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Escalation Category</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  placeholder="e.g. PCB Component Escalation"
                  value={newCatData.name}
                  onChange={(e) => setNewCatData({ ...newCatData, name: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={newCatData.department}
                  onChange={(e) => setNewCatData({ ...newCatData, department: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newCatData.description}
                  onChange={(e) => setNewCatData({ ...newCatData, description: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#334155]">
              <button
                onClick={() => setCatModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newCatData.name.trim()) return alert('Category Name is required');
                  const res = await fetch('/api/escalations/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newCatData),
                  });
                  const json = await res.json();
                  if (json.success) {
                    alert('Category created successfully!');
                    setCatModalOpen(false);
                    fetchCategories();
                  } else {
                    alert(json.message || 'Failed to create category');
                  }
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded text-xs"
              >
                Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SUBCATEGORY MODAL (Super Admin) */}
      {subcatModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Escalation Subcategory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subcategory Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Refrigerator Compressor Replacement"
                  value={newSubcatData.name}
                  onChange={(e) => setNewSubcatData({ ...newSubcatData, name: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Parent Category *</label>
                <select
                  value={newSubcatData.categoryId}
                  onChange={(e) => setNewSubcatData({ ...newSubcatData, categoryId: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Category</label>
                <input
                  type="text"
                  placeholder="e.g. Refrigerator, Television, AC"
                  value={newSubcatData.productCategoryName}
                  onChange={(e) => setNewSubcatData({ ...newSubcatData, productCategoryName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">SLA Target (Hours)</label>
                <input
                  type="number"
                  value={newSubcatData.slaHours}
                  onChange={(e) => setNewSubcatData({ ...newSubcatData, slaHours: Number(e.target.value) })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Responsible Manager</label>
                <select
                  value={newSubcatData.responsibleManagerId}
                  onChange={(e) => {
                    const u = systemUsers.find((usr) => usr._id === e.target.value);
                    setNewSubcatData({
                      ...newSubcatData,
                      responsibleManagerId: e.target.value,
                      responsibleManagerName: u?.fullName || u?.username || '',
                    });
                  }}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="">-- Select Manager --</option>
                  {systemUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#334155]">
              <button
                onClick={() => setSubcatModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newSubcatData.name.trim() || !newSubcatData.categoryId) {
                    return alert('Name and Parent Category are required');
                  }
                  const res = await fetch('/api/escalations/subcategories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newSubcatData),
                  });
                  const json = await res.json();
                  if (json.success) {
                    alert('Subcategory created successfully!');
                    setSubcatModalOpen(false);
                    fetchSubcategories();
                  } else {
                    alert(json.message || 'Failed to create subcategory');
                  }
                }}
                className="px-4 py-1.5 bg-cyan-600 text-white font-bold rounded text-xs"
              >
                Create Subcategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ASSIGNMENT RULE MODAL (Super Admin) */}
      {ruleModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Manager Assignment Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rule Name *</label>
                <input
                  type="text"
                  placeholder="e.g. AC Outdoor Unit Compressor Rule"
                  value={newRuleData.ruleName}
                  onChange={(e) => setNewRuleData({ ...newRuleData, ruleName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                <select
                  value={newRuleData.categoryId}
                  onChange={(e) => setNewRuleData({ ...newRuleData, categoryId: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Category</label>
                <input
                  type="text"
                  placeholder="e.g. Air Conditioner, Television"
                  value={newRuleData.productCategoryName}
                  onChange={(e) => setNewRuleData({ ...newRuleData, productCategoryName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Manager User *</label>
                <select
                  value={newRuleData.managerUserId}
                  onChange={(e) => setNewRuleData({ ...newRuleData, managerUserId: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="">-- Select Manager User --</option>
                  {systemUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.fullName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#334155]">
              <button
                onClick={() => setRuleModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!newRuleData.ruleName.trim() || !newRuleData.categoryId || !newRuleData.managerUserId) {
                    return alert('Rule Name, Category and Manager User are required');
                  }
                  const res = await fetch('/api/escalations/rules', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newRuleData),
                  });
                  const json = await res.json();
                  if (json.success) {
                    alert('Assignment Rule created successfully!');
                    setRuleModalOpen(false);
                    fetchAssignmentRules();
                  } else {
                    alert(json.message || 'Failed to create rule');
                  }
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded text-xs"
              >
                Save Assignment Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


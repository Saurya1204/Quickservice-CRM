'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import PincodeField from '@/components/common/PincodeLookup';
import { fetchWithCache } from '@/lib/clientCache';

interface CallUpdateModuleProps {
  currentUser?: any;
  initialCallId?: string;
  onCallUpdated?: () => void;
  onBack?: () => void;
}

const CALL_STATUS_OPTIONS = [
  { value: 'OPEN', label: 'OPEN', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'APPOINTMENT', label: 'APPOINTMENT', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'ALLOTED', label: 'ALLOTED', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
  { value: 'PART_PENDING', label: 'PART_PENDING', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/50' },
  { value: 'COMPLETED', label: 'COMPLETED', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'CANCEL', label: 'CANCEL', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { value: 'REOPENED', label: 'REOPENED', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
];

const WARRANTY_OPTIONS = [
  'Under Warranty',
  'Out of Warranty',
  'Extended Warranty',
  'AMC',
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export default function CallUpdateModule({
  currentUser,
  initialCallId,
  onCallUpdated,
  onBack,
}: CallUpdateModuleProps) {
  // Search State
  const [searchParams, setSearchParams] = useState({
    name: '',
    mobile: '',
    complaintNo: '',
    serialNo: '',
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Selected Call & Active Job Sheet Form
  const [selectedCall, setSelectedCall] = useState<any | null>(null);
  const [loadingCall, setLoadingCall] = useState(false);

  // Form Fields
  const [customerDetails, setCustomerDetails] = useState({
    customerName: '',
    customerMobile: '',
    customerAddress: '',
    customerEmail: '',
    pincode: '',
    locality: '',
    city: '',
    district: '',
    state: '',
  });

  const [productDetails, setProductDetails] = useState({
    clientName: '',
    brandName: '',
    categoryName: '',
    productName: '',
    modelNo: '',
    serialNo: '',
    unitSerialNumber: '',
    productDOP: '',
    warrantyStatus: 'Under Warranty',
    invoiceNo: '',
  });

  const [callDates, setCallDates] = useState({
    callNo: '',
    createdAt: '',
    appointmentDate: '',
    technicianVisitDate: new Date().toISOString().split('T')[0],
  });

  const [workDone, setWorkDone] = useState({
    jobDetails: '',
    jobStatus: 'OPEN',
    symptomRegistered: '',
    symptomObserved: '',
    cause: '',
    analysis: '',
    partRequired: 'No',
  });

  const [requiredParts, setRequiredParts] = useState<
    Array<{ partName: string; partCode: string; quantity: number; status: 'Required' | 'Change' }>
  >([]);

  const [charges, setCharges] = useState({
    spareCharge: 0,
    spareTax: 0,
    labourCharge: 0,
    labourTax: 0,
    transportCharge: 0,
    otherCharge: 0,
    tcrNo: '',
  });

  const [visitDetails, setVisitDetails] = useState({
    engineerName: '',
    visitDate: new Date().toISOString().split('T')[0],
    inTimeHour: '10',
    inTimeMinute: '00',
    outTimeHour: '11',
    outTimeMinute: '00',
    actionTaken: '',
    engineerRemark: '',
    lastStatus: '',
    presentStatus: 'OPEN',
    happyCode: '',
    distanceFromSF: 0,
  });

  // Attachments State
  const [existingInvoice, setExistingInvoice] = useState<any | null>(null);
  const [newInvoiceFile, setNewInvoiceFile] = useState<File | null>(null);

  const [existingDefectiveImages, setExistingDefectiveImages] = useState<any[]>([]);
  const [newDefectiveFiles, setNewDefectiveFiles] = useState<File[]>([]);

  // Submitting & Feedback State
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Master Data
  const [clients, setClients] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [causes, setCauses] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [sparePartsMaster, setSparePartsMaster] = useState<any[]>([]);

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const defectiveInputRef = useRef<HTMLInputElement>(null);

  // Load masters on mount
  useEffect(() => {
    loadMasters();
  }, []);

  // If initialCallId provided, load call
  useEffect(() => {
    if (initialCallId) {
      loadCallById(initialCallId);
    }
  }, [initialCallId]);

  const loadMasters = async () => {
    try {
      const [
        clientsRes,
        brandsRes,
        categoriesRes,
        productsRes,
        modelsRes,
        techsRes,
        symptomsRes,
        causesRes,
        analysesRes,
        sparesRes,
      ] = await Promise.all([
        fetchWithCache('/api/masters/clients').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/brands').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/categories').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/products').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/models').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/technicians').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/symptoms').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/causes').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/analyses').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/spare-parts').catch(() => ({ data: [] })),
      ]);

      if (clientsRes?.data) setClients(clientsRes.data);
      if (brandsRes?.data) setBrands(brandsRes.data);
      if (categoriesRes?.data) setCategories(categoriesRes.data);
      if (productsRes?.data) setProducts(productsRes.data);
      if (modelsRes?.data) setModels(modelsRes.data);
      if (techsRes?.data) setTechnicians(techsRes.data);
      if (symptomsRes?.data) setSymptoms(symptomsRes.data);
      if (causesRes?.data) setCauses(causesRes.data);
      if (analysesRes?.data) setAnalyses(analysesRes.data);
      if (sparesRes?.data) setSparePartsMaster(sparesRes.data);
    } catch (err) {
      console.warn('Error pre-loading masters for call update:', err);
    }
  };

  // Search Calls
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const q = new URLSearchParams();
      if (searchParams.name.trim()) q.set('name', searchParams.name.trim());
      if (searchParams.mobile.trim()) q.set('mobile', searchParams.mobile.trim());
      if (searchParams.complaintNo.trim()) q.set('complaintNo', searchParams.complaintNo.trim());
      if (searchParams.serialNo.trim()) q.set('serialNo', searchParams.serialNo.trim());

      const res = await fetch(`/api/calls?${q.toString()}`);
      const json = await res.json();
      if (json.success) {
        setSearchResults(json.data || []);
        if ((json.data || []).length === 0) {
          setSearchError('No matching calls found with the given search parameters.');
        }
      } else {
        setSearchError(json.message || 'Error searching calls');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error performing search');
    } finally {
      setSearching(false);
    }
  };

  const handleResetSearch = () => {
    setSearchParams({ name: '', mobile: '', complaintNo: '', serialNo: '' });
    setSearchResults([]);
    setSearchError('');
    setSelectedCall(null);
  };

  // Load single call by ID
  const loadCallById = async (id: string) => {
    setLoadingCall(true);
    try {
      const res = await fetch(`/api/calls?search=${id}`);
      const json = await res.json();
      if (json.success && json.data?.length > 0) {
        const found = json.data.find((c: any) => c._id === id || c.callNo === id) || json.data[0];
        populateCallForm(found);
      }
    } catch (err) {
      console.error('Error fetching call:', err);
    } finally {
      setLoadingCall(false);
    }
  };

  // Populate Call into Form
  const populateCallForm = (call: any) => {
    setSelectedCall(call);
    setFormErrors({});
    setSuccessMessage('');
    setNewInvoiceFile(null);
    setNewDefectiveFiles([]);

    setCallDates({
      callNo: call.callNo || '',
      createdAt: call.createdAt ? new Date(call.createdAt).toLocaleString() : 'N/A',
      appointmentDate: call.appointmentDate
        ? new Date(call.appointmentDate).toISOString().split('T')[0]
        : '',
      technicianVisitDate: call.visitDetails?.visitDate
        ? new Date(call.visitDetails.visitDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });

    setCustomerDetails({
      customerName: call.customerName || '',
      customerMobile: call.customerMobile || '',
      customerAddress: call.customerAddress || call.customerAddress1 || '',
      customerEmail: call.customerEmail || '',
      pincode: call.pincode || '',
      locality: call.locality || call.landmark || '',
      city: call.city || '',
      district: call.district || '',
      state: call.state || '',
    });

    const activeStatus = call.callStatus || 'OPEN';

    setProductDetails({
      clientName: call.clientName || '',
      brandName: call.brandName || '',
      categoryName: call.categoryName || '',
      productName: call.productName || '',
      modelNo: call.modelNo || '',
      serialNo: call.serialNo || call.unitSerialNumber || '',
      unitSerialNumber: call.unitSerialNumber || call.serialNo || '',
      productDOP: call.productDOP || call.dealerDOP || '',
      warrantyStatus: call.warrantyStatus || 'Under Warranty',
      invoiceNo: call.invoiceNo || '',
    });

    setWorkDone({
      jobDetails: call.jobDetails || call.serviceRemarks || call.reportedFault || '',
      jobStatus: activeStatus,
      symptomRegistered: call.symptomRegistered || call.symptomName || '',
      symptomObserved: call.symptomObserved || call.reportedFault || '',
      cause: call.cause || call.causeName || '',
      analysis: call.analysis || call.analysisName || '',
      partRequired: call.partRequired || (call.requiredParts?.length > 0 ? 'Yes' : 'No'),
    });

    setRequiredParts(call.requiredParts || []);

    const c = call.charges || {};
    setCharges({
      spareCharge: Number(c.spareCharge) || 0,
      spareTax: Number(c.spareTax) || 0,
      labourCharge: Number(c.labourCharge) || 0,
      labourTax: Number(c.labourTax) || 0,
      transportCharge: Number(c.transportCharge) || 0,
      otherCharge: Number(c.otherCharge) || 0,
      tcrNo: c.tcrNo || '',
    });

    const v = call.visitDetails || {};
    setVisitDetails({
      engineerName: v.engineerName || call.technicianName || currentUser?.fullName || '',
      visitDate: v.visitDate ? new Date(v.visitDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      inTimeHour: v.inTimeHour || '10',
      inTimeMinute: v.inTimeMinute || '00',
      outTimeHour: v.outTimeHour || '11',
      outTimeMinute: v.outTimeMinute || '00',
      actionTaken: v.actionTaken || '',
      engineerRemark: v.engineerRemark || '',
      lastStatus: call.callStatus || 'OPEN',
      presentStatus: activeStatus,
      happyCode: v.happyCode || '',
      distanceFromSF: Number(v.distanceFromSF) || 0,
    });

    setExistingInvoice(call.invoiceFile || null);
    setExistingDefectiveImages(call.defectivePartImages || []);
  };

  // Sync Job Status and Present Status
  const handleJobStatusChange = (val: string) => {
    setWorkDone((prev) => ({ ...prev, jobStatus: val }));
    setVisitDetails((prev) => ({ ...prev, presentStatus: val }));
  };

  const handlePresentStatusChange = (val: string) => {
    setVisitDetails((prev) => ({ ...prev, presentStatus: val }));
    setWorkDone((prev) => ({ ...prev, jobStatus: val }));
  };

  // Automatically calculate total collected amount
  const totalCollectedAmount = useMemo(() => {
    const spare = Number(charges.spareCharge) || 0;
    const spareTax = Number(charges.spareTax) || 0;
    const labour = Number(charges.labourCharge) || 0;
    const labourTax = Number(charges.labourTax) || 0;
    const transport = Number(charges.transportCharge) || 0;
    const other = Number(charges.otherCharge) || 0;
    return spare + spareTax + labour + labourTax + transport + other;
  }, [charges]);

  // Is status PART_PENDING?
  const isPartPending = workDone.jobStatus === 'PART_PENDING' || visitDetails.presentStatus === 'PART_PENDING';

  // Dynamic Spare Parts Handlers
  const handleAddSparePart = () => {
    setRequiredParts((prev) => [
      ...prev,
      { partName: '', partCode: '', quantity: 1, status: 'Required' },
    ]);
  };

  const handleUpdateSparePart = (index: number, field: string, val: any) => {
    setRequiredParts((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveSparePart = (index: number) => {
    setRequiredParts((prev) => prev.filter((_, i) => i !== index));
  };

  // Invoice File Handler
  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid invoice format. Please upload PDF, JPG, JPEG, or PNG.');
        return;
      }
      setNewInvoiceFile(file);
      setFormErrors((prev) => ({ ...prev, invoice: '' }));
    }
  };

  // Defective Images Handler
  const handleDefectiveImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      const validFiles = files.filter((f) => validTypes.includes(f.type));
      if (validFiles.length < files.length) {
        alert('Some files were ignored because only JPG, JPEG, and PNG images are supported for defective parts.');
      }
      setNewDefectiveFiles((prev) => [...prev, ...validFiles]);
      setFormErrors((prev) => ({ ...prev, defectiveImages: '' }));
    }
  };

  const handleRemoveNewDefectiveFile = (index: number) => {
    setNewDefectiveFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Client-Side Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // 1. Product Serial Number is MANDATORY
    if (!productDetails.serialNo.trim()) {
      errors.serialNo = 'Product Serial Number is mandatory.';
    }

    // 2. Product Invoice is MANDATORY
    const hasInvoice = !!(existingInvoice?.fileName || existingInvoice?.fileUrl || newInvoiceFile);
    if (!hasInvoice) {
      errors.invoice = 'Product Invoice copy is mandatory for all call updates.';
    }

    // 3. PART_PENDING Mandatory Validations
    if (isPartPending) {
      const unitSerial = productDetails.unitSerialNumber.trim() || productDetails.serialNo.trim();
      if (!unitSerial) {
        errors.unitSerialNumber = 'Unit Set Serial Number is required when status is PART_PENDING.';
      }

      if (!hasInvoice) {
        errors.invoice = 'Product Purchase Invoice copy is mandatory when status is PART_PENDING.';
      }

      const totalDefective = existingDefectiveImages.length + newDefectiveFiles.length;
      if (totalDefective === 0) {
        errors.defectiveImages = 'At least one Defective Part Image is required when status is PART_PENDING.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Submit / Update Call
  const handleSubmitJobSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    if (!selectedCall) return;

    if (!validateForm()) {
      const firstErr = Object.values(formErrors)[0];
      if (firstErr) alert(`Validation Error: ${firstErr}`);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('callId', selectedCall._id);

      const payload = {
        // Customer
        customerName: customerDetails.customerName,
        customerMobile: customerDetails.customerMobile,
        customerAddress: customerDetails.customerAddress,
        customerEmail: customerDetails.customerEmail,
        pincode: customerDetails.pincode,
        locality: customerDetails.locality,
        city: customerDetails.city,
        district: customerDetails.district,
        state: customerDetails.state,

        // Product
        clientName: productDetails.clientName,
        brandName: productDetails.brandName,
        categoryName: productDetails.categoryName,
        productName: productDetails.productName,
        modelNo: productDetails.modelNo,
        serialNo: productDetails.serialNo.trim(),
        unitSerialNumber: (productDetails.unitSerialNumber.trim() || productDetails.serialNo.trim()),
        productDOP: productDetails.productDOP,
        warrantyStatus: productDetails.warrantyStatus,
        invoiceNo: productDetails.invoiceNo,

        // Call dates
        appointmentDate: callDates.appointmentDate || undefined,

        // Work Done
        jobDetails: workDone.jobDetails,
        jobStatus: workDone.jobStatus,
        symptomRegistered: workDone.symptomRegistered,
        symptomObserved: workDone.symptomObserved,
        cause: workDone.cause,
        analysis: workDone.analysis,
        partRequired: workDone.partRequired,
        requiredParts,

        // Charges
        charges: {
          ...charges,
          totalAmount: totalCollectedAmount,
        },

        // Visit details
        engineerName: visitDetails.engineerName,
        visitDate: visitDetails.visitDate,
        inTimeHour: visitDetails.inTimeHour,
        inTimeMinute: visitDetails.inTimeMinute,
        outTimeHour: visitDetails.outTimeHour,
        outTimeMinute: visitDetails.outTimeMinute,
        actionTaken: visitDetails.actionTaken,
        engineerRemark: visitDetails.engineerRemark,
        presentStatus: visitDetails.presentStatus,
        happyCode: visitDetails.happyCode,
        distanceFromSF: visitDetails.distanceFromSF,

        updatedBy: currentUser?.fullName || 'Super Admin',
      };

      formData.append('data', JSON.stringify(payload));

      if (newInvoiceFile) {
        formData.append('invoice', newInvoiceFile);
      }

      newDefectiveFiles.forEach((file, idx) => {
        formData.append(`defectiveImage_${idx}`, file);
      });

      const res = await fetch('/api/calls/update', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMessage(`Call #${selectedCall.callNo} successfully updated with status "${json.data.callStatus}"!`);
        populateCallForm(json.data);
        if (onCallUpdated) onCallUpdated();
        // Update item in searchResults list if present
        setSearchResults((prev) =>
          prev.map((item) => (item._id === json.data._id ? json.data : item))
        );
      } else {
        alert(json.message || 'Error updating call.');
        if (json.field) {
          setFormErrors((prev) => ({ ...prev, [json.field]: json.message }));
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update call.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: SEARCH SCREEN / TOP BAR */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#334155] pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>📋 Call Update / Job Sheet Management</span>
              {selectedCall && (
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  #{selectedCall.callNo}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Search by customer, complaint number, or serial number to update job sheets, parts, and visit details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedCall && (
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition flex items-center space-x-1"
              >
                <span>← Back to Search Results</span>
              </button>
            )}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Back to Calls
              </button>
            )}
          </div>
        </div>

        {/* 4 Search Fields */}
        <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Customer Name</label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={searchParams.name}
              onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-xs text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Registered Mobile Number</label>
            <input
              type="text"
              placeholder="e.g. 9810987654"
              value={searchParams.mobile}
              onChange={(e) => setSearchParams({ ...searchParams, mobile: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-xs text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Complaint Number (Call ID)</label>
            <input
              type="text"
              placeholder="e.g. 261113UPQS0001"
              value={searchParams.complaintNo}
              onChange={(e) => setSearchParams({ ...searchParams, complaintNo: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Product Serial Number</label>
            <input
              type="text"
              placeholder="e.g. SN20241005"
              value={searchParams.serialNo}
              onChange={(e) => setSearchParams({ ...searchParams, serialNo: e.target.value })}
              className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-xs text-white placeholder-slate-500 font-mono"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleResetSearch}
              className="text-xs px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={searching}
              className="text-xs px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow transition flex items-center space-x-1.5"
            >
              {searching ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>🔍 Search Calls</span>
                </>
              )}
            </button>
          </div>
        </form>

        {searchError && (
          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg">
            ⚠️ {searchError}
          </div>
        )}

        {/* Search Results Table (Shown when not editing a call or when searching) */}
        {!selectedCall && searchResults.length > 0 && (
          <div className="mt-5 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Matching Search Results ({searchResults.length})
              </h3>
              <span className="text-[11px] text-slate-400">Click &quot;Update Call&quot; to open the complete Job Sheet</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#334155]">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-[#334155]">
                  <tr>
                    <th className="p-3">Complaint / Call No</th>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Mobile</th>
                    <th className="p-3">City / Locality</th>
                    <th className="p-3">Pincode</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Call Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155] bg-[#1e293b]/60">
                  {searchResults.map((call) => {
                    const statusObj = CALL_STATUS_OPTIONS.find((s) => s.value === call.callStatus);
                    return (
                      <tr key={call._id} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                          {call.callNo}
                        </td>
                        <td className="p-3 font-medium text-slate-200">
                          {call.customerName}
                        </td>
                        <td className="p-3 font-mono text-slate-300">{call.customerMobile}</td>
                        <td className="p-3 text-slate-300">
                          {call.city}{call.locality ? `, ${call.locality}` : ''}
                        </td>
                        <td className="p-3 font-mono text-slate-400">{call.pincode}</td>
                        <td className="p-3 text-slate-200">
                          <span className="font-semibold text-white">{call.brandName}</span> {call.categoryName}
                          {call.modelNo ? ` (${call.modelNo})` : ''}
                        </td>
                        <td className="p-3 text-slate-300">{call.callType || 'Service'}</td>
                        <td className="p-3">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              statusObj?.color || 'bg-slate-700 text-slate-300 border-slate-600'
                            }`}
                          >
                            {call.callStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => populateCallForm(call)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs shadow transition"
                          >
                            Update Call ➔
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: COMPLETE JOB SHEET / CALL UPDATE FORM */}
      {selectedCall && (
        <form onSubmit={handleSubmitJobSheet} className="space-y-6">
          {/* Success Banner */}
          {successMessage && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2 text-sm font-semibold">
                <span>✅</span>
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage('')}
                className="text-xs text-emerald-400 hover:text-white"
              >
                ✕ Dismiss
              </button>
            </div>
          )}

          {/* Conditional PART_PENDING Alert Banner */}
          {isPartPending && (
            <div className="p-4 bg-amber-500/15 border-2 border-amber-500/50 text-amber-200 rounded-xl shadow-xl space-y-1">
              <div className="flex items-center space-x-2 text-sm font-bold text-amber-300">
                <span className="text-base">⚠️</span>
                <span>SPECIAL MANDATORY REQUIREMENTS FOR PART_PENDING STATUS</span>
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed">
                As per Quickserves CRM standard operational procedures, setting the call to <strong>PART_PENDING</strong> strictly requires:
              </p>
              <ul className="text-xs list-disc list-inside space-x-1 space-y-0.5 text-amber-200 font-medium pl-2 pt-1">
                <li><strong>1. Unit Set Serial Number</strong> (Mandatory entry of product unit serial)</li>
                <li><strong>2. Invoice Copy</strong> (Mandatory upload of customer purchase invoice - PDF/JPG/PNG)</li>
                <li><strong>3. Defective Parts Image</strong> (Mandatory upload of clear defective component photos - JPG/PNG)</li>
              </ul>
            </div>
          )}

          {/* SECTION A: CALL DETAILS */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#334155] pb-2">
              <span>1. Call Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Call ID (Read-Only)</label>
                <input
                  type="text"
                  readOnly
                  value={callDates.callNo}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono font-bold cursor-not-allowed select-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Registration Date & Time</label>
                <input
                  type="text"
                  readOnly
                  value={callDates.createdAt}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-slate-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Appointment Date & Time</label>
                <input
                  type="date"
                  value={callDates.appointmentDate}
                  onChange={(e) => setCallDates({ ...callDates, appointmentDate: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Technician Visit Date</label>
                <input
                  type="date"
                  value={visitDetails.visitDate}
                  onChange={(e) => setVisitDetails({ ...visitDetails, visitDate: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION B: CUSTOMER DETAILS */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#334155] pb-2">
              <span>2. Customer Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={customerDetails.customerName}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, customerName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Contact / Mobile Number *</label>
                <input
                  type="text"
                  required
                  value={customerDetails.customerMobile}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, customerMobile: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={customerDetails.customerEmail}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, customerEmail: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Customer Address *</label>
                <input
                  type="text"
                  required
                  value={customerDetails.customerAddress}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, customerAddress: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">PIN Code (Auto-Lookup) *</label>
                <PincodeField
                  value={customerDetails.pincode}
                  onChange={(pin) => setCustomerDetails((prev) => ({ ...prev, pincode: pin }))}
                  onLocationFound={(loc) => {
                    setCustomerDetails((prev) => ({
                      ...prev,
                      state: loc.state || prev.state,
                      district: loc.district || prev.district,
                      city: loc.city || prev.city,
                    }));
                  }}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Locality / Landmark</label>
                <input
                  type="text"
                  value={customerDetails.locality}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, locality: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={customerDetails.city}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">District</label>
                <input
                  type="text"
                  value={customerDetails.district}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, district: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">State *</label>
                <input
                  type="text"
                  required
                  value={customerDetails.state}
                  onChange={(e) => setCustomerDetails({ ...customerDetails, state: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: PRODUCT DETAILS & MANDATORY INVOICE */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#334155] pb-2">
              <span>3. Product Details & Mandatory Invoice</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Client</label>
                <input
                  type="text"
                  value={productDetails.clientName}
                  onChange={(e) => setProductDetails({ ...productDetails, clientName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Brand</label>
                <input
                  type="text"
                  value={productDetails.brandName}
                  onChange={(e) => setProductDetails({ ...productDetails, brandName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={productDetails.categoryName}
                  onChange={(e) => setProductDetails({ ...productDetails, categoryName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Product</label>
                <input
                  type="text"
                  value={productDetails.productName}
                  onChange={(e) => setProductDetails({ ...productDetails, productName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Model Number</label>
                <input
                  type="text"
                  value={productDetails.modelNo}
                  onChange={(e) => setProductDetails({ ...productDetails, modelNo: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono"
                />
              </div>

              {/* MANDATORY: Product Serial Number */}
              <div>
                <label className="block text-[11px] font-bold text-rose-400 mb-1">
                  Product Serial Number <span className="text-rose-500 text-xs">*</span> (MANDATORY)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter Product Serial Number"
                  value={productDetails.serialNo}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProductDetails((prev) => ({
                      ...prev,
                      serialNo: val,
                      unitSerialNumber: prev.unitSerialNumber ? prev.unitSerialNumber : val,
                    }));
                    if (formErrors.serialNo) setFormErrors((prev) => ({ ...prev, serialNo: '' }));
                  }}
                  className={`w-full bg-[#0f172a] border ${
                    formErrors.serialNo ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#334155] focus:border-blue-500'
                  } rounded px-3 py-2 text-white font-mono font-bold`}
                />
                {formErrors.serialNo && (
                  <p className="text-[10px] text-rose-400 mt-1 font-medium">{formErrors.serialNo}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">D.O.P. (Date of Purchase)</label>
                <input
                  type="date"
                  value={productDetails.productDOP}
                  onChange={(e) => setProductDetails({ ...productDetails, productDOP: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Warranty Status</label>
                <select
                  value={productDetails.warrantyStatus}
                  onChange={(e) => setProductDetails({ ...productDetails, warrantyStatus: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                >
                  {WARRANTY_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Invoice Number</label>
                <input
                  type="text"
                  placeholder="e.g. INV-98765"
                  value={productDetails.invoiceNo}
                  onChange={(e) => setProductDetails({ ...productDetails, invoiceNo: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white font-mono"
                />
              </div>

              {/* MANDATORY: Product Invoice Upload */}
              <div className="sm:col-span-2 lg:col-span-3 bg-[#0f172a] p-4 rounded-xl border border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <label className="block text-xs font-bold text-rose-400">
                      Product Invoice Upload <span className="text-rose-500">*</span> (MANDATORY)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Upload customer purchase invoice. Supported formats: PDF, JPG, JPEG, PNG.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={invoiceInputRef}
                    accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
                    onChange={handleInvoiceChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => invoiceInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs transition shadow flex items-center space-x-1"
                  >
                    <span>📁 Choose Invoice File</span>
                  </button>
                </div>

                {/* Display Current Invoice (Existing or Newly Selected) */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {newInvoiceFile ? (
                    <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-300 text-xs">
                      <span>📄 Newly Selected:</span>
                      <span className="font-semibold">{newInvoiceFile.name}</span>
                      <span className="text-slate-400">({(newInvoiceFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={() => setNewInvoiceFile(null)}
                        className="text-rose-400 hover:text-rose-300 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ) : existingInvoice ? (
                    <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                      <span className="text-emerald-400 font-bold">✓ Attached Invoice:</span>
                      <span className="text-white font-medium">{existingInvoice.fileName}</span>
                      {selectedCall?._id && (
                        <a
                          href={`/api/calls/attachments/serve?callId=${selectedCall._id}&type=invoice`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-[11px] font-semibold transition"
                        >
                          👁️ View Full Invoice
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-400/90 font-medium">
                      ⚠️ No invoice attached yet. Please choose an invoice file.
                    </p>
                  )}
                </div>

                {formErrors.invoice && (
                  <p className="text-[11px] text-rose-400 font-semibold">{formErrors.invoice}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION D: WORK DONE & SPARE PARTS */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#334155] pb-2">
              <span>4. Work Done Section</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Job Details</label>
                <textarea
                  rows={2}
                  value={workDone.jobDetails}
                  onChange={(e) => setWorkDone({ ...workDone, jobDetails: e.target.value })}
                  placeholder="Enter details of service work performed..."
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">Job Status *</label>
                <select
                  value={workDone.jobStatus}
                  onChange={(e) => handleJobStatusChange(e.target.value)}
                  className="w-full bg-[#0f172a] border border-amber-500/50 focus:border-amber-400 rounded px-3 py-2 text-white font-semibold"
                >
                  {CALL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Symptom Registered</label>
                <select
                  value={workDone.symptomRegistered}
                  onChange={(e) => setWorkDone({ ...workDone, symptomRegistered: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                >
                  <option value="">-- Select Symptom Registered --</option>
                  {symptoms.map((s) => (
                    <option key={s._id} value={s.symptomName}>
                      {s.symptomName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Symptom Observed</label>
                <input
                  type="text"
                  placeholder="Observed symptom by technician"
                  value={workDone.symptomObserved}
                  onChange={(e) => setWorkDone({ ...workDone, symptomObserved: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Cause</label>
                <select
                  value={workDone.cause}
                  onChange={(e) => setWorkDone({ ...workDone, cause: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                >
                  <option value="">-- Select Cause --</option>
                  {causes.map((c) => (
                    <option key={c._id} value={c.causeName}>
                      {c.causeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Analysis</label>
                <select
                  value={workDone.analysis}
                  onChange={(e) => setWorkDone({ ...workDone, analysis: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                >
                  <option value="">-- Select Analysis --</option>
                  {analyses.map((a) => (
                    <option key={a._id} value={a.analysisName}>
                      {a.analysisName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Part Required</label>
                <select
                  value={workDone.partRequired}
                  onChange={(e) => setWorkDone({ ...workDone, partRequired: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* DYNAMIC REQUIRED / CHANGE PART DETAILS TABLE */}
            <div className="pt-3 border-t border-[#334155] space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>⚙️ Required / Change Part Details</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                    {requiredParts.length} parts
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddSparePart}
                  className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 rounded text-xs font-semibold transition"
                >
                  + Add Spare Part
                </button>
              </div>

              {requiredParts.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-[#0f172a] p-3 rounded-lg border border-[#334155]">
                  No spare parts recorded. Click &quot;+ Add Spare Part&quot; to append required or changed part details.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[#334155]">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="bg-[#0f172a] text-slate-400 uppercase text-[10px] font-semibold tracking-wider border-b border-[#334155]">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Part Name</th>
                        <th className="p-2.5">Part Code</th>
                        <th className="p-2.5 w-24">Quantity</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155] bg-[#1e293b]/50">
                      {requiredParts.map((part, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="e.g. PCB Main Board"
                              value={part.partName}
                              onChange={(e) => handleUpdateSparePart(idx, 'partName', e.target.value)}
                              className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-white text-xs"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              placeholder="e.g. SP-4091"
                              value={part.partCode}
                              onChange={(e) => handleUpdateSparePart(idx, 'partCode', e.target.value)}
                              className="w-full bg-[#0f172a] border border-[#334155] rounded px-2.5 py-1 text-white text-xs font-mono"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="number"
                              min={1}
                              value={part.quantity}
                              onChange={(e) => handleUpdateSparePart(idx, 'quantity', Number(e.target.value) || 1)}
                              className="w-full bg-[#0f172a] border border-[#334155] rounded px-2 py-1 text-white text-xs text-center font-mono"
                            />
                          </td>
                          <td className="p-2.5">
                            <select
                              value={part.status}
                              onChange={(e) => handleUpdateSparePart(idx, 'status', e.target.value)}
                              className="bg-[#0f172a] border border-[#334155] rounded px-2 py-1 text-white text-xs"
                            >
                              <option value="Required">Required</option>
                              <option value="Change">Change</option>
                            </select>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveSparePart(idx)}
                              className="text-rose-400 hover:text-rose-300 font-bold px-2 py-0.5 rounded hover:bg-rose-500/10 transition"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* SECTION E: SPECIAL MANDATORY VALIDATIONS FOR PART_PENDING */}
          <div
            className={`rounded-xl p-5 shadow-xl space-y-4 transition border ${
              isPartPending
                ? 'bg-[#1e293b] border-amber-500/60 ring-1 ring-amber-500/40'
                : 'bg-[#1e293b] border-[#334155]'
            }`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#334155] pb-2">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <span>5. Special Validation: Unit Set Serial & Defective Parts Images</span>
                {isPartPending && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                    REQUIRED FOR PART_PENDING
                  </span>
                )}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Unit Set Serial Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-200 mb-1">
                  Unit Set Serial Number{' '}
                  {isPartPending && <span className="text-rose-400 text-xs font-bold">* (MANDATORY)</span>}
                </label>
                <input
                  type="text"
                  placeholder="Enter Unit Set Serial Number"
                  value={productDetails.unitSerialNumber}
                  onChange={(e) => {
                    setProductDetails({ ...productDetails, unitSerialNumber: e.target.value });
                    if (formErrors.unitSerialNumber) setFormErrors((prev) => ({ ...prev, unitSerialNumber: '' }));
                  }}
                  className={`w-full bg-[#0f172a] border ${
                    formErrors.unitSerialNumber ? 'border-rose-500 ring-1 ring-rose-500' : 'border-[#334155] focus:border-amber-400'
                  } rounded px-3 py-2 text-white font-mono`}
                />
                {formErrors.unitSerialNumber && (
                  <p className="text-[10px] text-rose-400 mt-1">{formErrors.unitSerialNumber}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Serial number of the physical indoor/outdoor unit or machine set.
                </p>
              </div>

              {/* Defective Parts Image Upload */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-200">
                    Defective Parts Image(s){' '}
                    {isPartPending && <span className="text-rose-400 text-xs font-bold">* (MANDATORY)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => defectiveInputRef.current?.click()}
                    className="text-[11px] px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded font-semibold transition"
                  >
                    + Upload Images
                  </button>
                  <input
                    type="file"
                    ref={defectiveInputRef}
                    multiple
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleDefectiveImagesChange}
                    className="hidden"
                  />
                </div>

                {formErrors.defectiveImages && (
                  <p className="text-[10px] text-rose-400 mb-2 font-semibold">{formErrors.defectiveImages}</p>
                )}

                {/* Display Defective Images List */}
                <div className="space-y-2 mt-2">
                  {/* Existing Saved Defective Images */}
                  {existingDefectiveImages.map((img, idx) => (
                    <div
                      key={`exist_${idx}`}
                      className="flex items-center justify-between bg-[#0f172a] border border-slate-700 p-2 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="text-amber-400">🖼️</span>
                        <span className="text-white truncate font-medium">{img.fileName}</span>
                        <span className="text-[10px] text-emerald-400">(Saved in DB)</span>
                      </div>
                      {selectedCall?._id && (
                        <a
                          href={`/api/calls/attachments/serve?callId=${selectedCall._id}&type=defective&index=${idx}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-blue-600/30 text-blue-300 rounded text-[11px] hover:bg-blue-600/50 transition font-medium"
                        >
                          View
                        </a>
                      )}
                    </div>
                  ))}

                  {/* Newly Selected Defective Images */}
                  {newDefectiveFiles.map((file, idx) => (
                    <div
                      key={`new_${idx}`}
                      className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="text-emerald-400">📸</span>
                        <span className="text-emerald-200 truncate font-medium">{file.name}</span>
                        <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewDefectiveFile(idx)}
                        className="text-rose-400 hover:text-rose-300 px-2 py-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}

                  {existingDefectiveImages.length === 0 && newDefectiveFiles.length === 0 && (
                    <p className="text-[11px] text-slate-500 italic bg-[#0f172a] p-2.5 rounded border border-[#334155]">
                      No defective part images uploaded yet. {isPartPending ? 'At least one image is mandatory.' : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION F: AMOUNT COLLECTED */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#334155] pb-2">
              <span>6. Amount Collected Section</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Spare Charge (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={charges.spareCharge}
                  onChange={(e) => setCharges({ ...charges, spareCharge: Number(e.target.value) || 0 })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Spare Tax Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={charges.spareTax}
                  onChange={(e) => setCharges({ ...charges, spareTax: Number(e.target.value) || 0 })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Visit / Labour Charge (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={charges.labourCharge}
                  onChange={(e) => setCharges({ ...charges, labourCharge: Number(e.target.value) || 0 })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Labour Tax Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={charges.labourTax}
                  onChange={(e) => setCharges({ ...charges, labourTax: Number(e.target.value) || 0 })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Transport Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={charges.transportCharge}
                  onChange={(e) => setCharges({ ...charges, transportCharge: Number(e.target.value) || 0 })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Other Charges (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={charges.otherCharge}
                  onChange={(e) => setCharges({ ...charges, otherCharge: Number(e.target.value) || 0 })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>

              {/* Total Collected Amount (Automatically Calculated) */}
              <div>
                <label className="block text-[11px] font-bold text-emerald-400 mb-1">
                  Total Collected Amount (₹) (Auto-Calc)
                </label>
                <input
                  type="text"
                  readOnly
                  value={`₹ ${totalCollectedAmount.toFixed(2)}`}
                  className="w-full bg-[#0f172a] border border-emerald-500/50 rounded px-3 py-1.5 text-emerald-300 font-mono font-bold text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Temporary Cash Receipt (TCR)</label>
                <input
                  type="text"
                  placeholder="e.g. TCR-9021"
                  value={charges.tcrNo}
                  onChange={(e) => setCharges({ ...charges, tcrNo: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-1.5 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION G: VISIT DETAILS */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-2 border-b border-[#334155] pb-2">
              <span>7. Visit Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Engineer Name *</label>
                <input
                  type="text"
                  list="techniciansList"
                  required
                  placeholder="e.g. PRASHANT GUPTA"
                  value={visitDetails.engineerName}
                  onChange={(e) => setVisitDetails({ ...visitDetails, engineerName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] focus:border-blue-500 rounded px-3 py-2 text-white"
                />
                <datalist id="techniciansList">
                  {technicians.map((t) => (
                    <option key={t._id} value={t.technicianName}>
                      {t.technicianName} ({t.crmCode})
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Visit Date</label>
                <input
                  type="date"
                  value={visitDetails.visitDate}
                  onChange={(e) => setVisitDetails({ ...visitDetails, visitDate: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              {/* In-Time (Hour and Minute) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">In-Time (HH : MM)</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={visitDetails.inTimeHour}
                    onChange={(e) => setVisitDetails({ ...visitDetails, inTimeHour: e.target.value })}
                    className="w-1/2 bg-[#0f172a] border border-[#334155] rounded px-2 py-2 text-white font-mono text-xs"
                  >
                    {HOURS.map((h) => (
                      <option key={`in_h_${h}`} value={h}>
                        {h} hrs
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-bold">:</span>
                  <select
                    value={visitDetails.inTimeMinute}
                    onChange={(e) => setVisitDetails({ ...visitDetails, inTimeMinute: e.target.value })}
                    className="w-1/2 bg-[#0f172a] border border-[#334155] rounded px-2 py-2 text-white font-mono text-xs"
                  >
                    {MINUTES.map((m) => (
                      <option key={`in_m_${m}`} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Out-Time (Hour and Minute) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Out-Time (HH : MM)</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={visitDetails.outTimeHour}
                    onChange={(e) => setVisitDetails({ ...visitDetails, outTimeHour: e.target.value })}
                    className="w-1/2 bg-[#0f172a] border border-[#334155] rounded px-2 py-2 text-white font-mono text-xs"
                  >
                    {HOURS.map((h) => (
                      <option key={`out_h_${h}`} value={h}>
                        {h} hrs
                      </option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-bold">:</span>
                  <select
                    value={visitDetails.outTimeMinute}
                    onChange={(e) => setVisitDetails({ ...visitDetails, outTimeMinute: e.target.value })}
                    className="w-1/2 bg-[#0f172a] border border-[#334155] rounded px-2 py-2 text-white font-mono text-xs"
                  >
                    {MINUTES.map((m) => (
                      <option key={`out_m_${m}`} value={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Action Taken</label>
                <textarea
                  rows={2}
                  placeholder="Action taken during visit..."
                  value={visitDetails.actionTaken}
                  onChange={(e) => setVisitDetails({ ...visitDetails, actionTaken: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Engineer Remark</label>
                <textarea
                  rows={2}
                  placeholder="Engineer remarks / observation notes..."
                  value={visitDetails.engineerRemark}
                  onChange={(e) => setVisitDetails({ ...visitDetails, engineerRemark: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Last Status (Read-Only)</label>
                <input
                  type="text"
                  readOnly
                  value={visitDetails.lastStatus}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-slate-300 cursor-not-allowed font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-300 mb-1">Present Status *</label>
                <select
                  value={visitDetails.presentStatus}
                  onChange={(e) => handlePresentStatusChange(e.target.value)}
                  className="w-full bg-[#0f172a] border border-amber-500/50 rounded px-3 py-2 text-white font-semibold"
                >
                  {CALL_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Happy Code (Customer OTP)</label>
                <input
                  type="text"
                  placeholder="e.g. 543210"
                  value={visitDetails.happyCode}
                  onChange={(e) => setVisitDetails({ ...visitDetails, happyCode: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Actual One-Way Distance From SF (KM)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={visitDetails.distanceFromSF}
                  onChange={(e) => setVisitDetails({ ...visitDetails, distanceFromSF: Number(e.target.value) || 0 })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION H: ACTIONS & SAVE WORKFLOW */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xs text-slate-400">
              <span className="font-semibold text-white">Status being saved: </span>
              <span className="text-amber-300 font-bold">{visitDetails.presentStatus}</span>
              {isPartPending && (
                <span className="ml-2 text-amber-400 text-[11px]">
                  (Unit Serial, Invoice & Defective Images Verified)
                </span>
              )}
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedCall(null)}
                className="w-1/2 sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel / Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="w-1/2 sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-lg transition flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>Saving Job Sheet...</span>
                  </>
                ) : (
                  <>
                    <span>💾 Save & Update Call</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import PincodeField from '@/components/common/PincodeLookup';
import { fetchWithCache, invalidateCache } from '@/lib/clientCache';

// Default Master Options (fallbacks and initial values)
const DEFAULT_CALL_REGISTER_BY = [
  'Customer',
  'Dealer / Distributor',
  'Client / Brand',
  'Franchise',
];

const DEFAULT_CALL_SOURCES = [
  'Call Centre',
  'Mail',
  'Web site',
  'Android Application',
  'WhatsAPP',
  'Customer',
];

const CUSTOMER_TITLES = ['Mr', 'Mrs', 'Miss', 'Dr.', 'M/S'];

const DEFAULT_LANGUAGES = [
  'Hindi',
  'English',
  'Punjabi',
  'Bengali',
  'Gujarati',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Odia',
  'Assamese',
  'Urdu',
];

const DEFAULT_WARRANTY_OPTIONS = [
  'Under Warranty',
  'Extended Warranty',
  'Out of Warranty',
  'AMC',
];

const DEFAULT_STOCK_OF_OPTIONS = [
  'Dealer Stock',
  'Customer Stock',
  'Distributor Stock',
  'Sales Return Stock',
  'Company Stock',
];

const DEFAULT_CALL_TYPES = [
  'Service',
  'Demo',
  'PM Service',
  'Stock Inspection',
  'Dry Service',
  'Installation & Demo',
  'Wet Service',
  'Tec. Visit',
  'Un-Installation',
  'Repeat Failure',
  'Stock Repair',
  'Pick-up Request',
  'Replacement',
];

const DEFAULT_COMPLAINT_PRIORITIES = [
  'Normal complaint',
  'Accidental Case',
  'Repeat Failure',
  'New Product Failure',
];

const DEFAULT_CALL_NATURES = [
  'Normal',
  'Errate',
  'Escalated',
  'Urgent',
  'VIP',
];

const DEFAULT_VISIT_TYPES = [
  'On site - Local',
  'On Site - Out Station',
  'Carry in Workshop',
  'Dealer - Local',
  'Dealer - Out Station',
];

const DEFAULT_COMPLAINT_DESCRIPTIONS = [
  'Accessory Missing/Damaged',
  'Apps Not Working',
  'Back Cover Damage',
  'Blank Raster',
  'Burnt Case',
  'Demo Required',
  'Dot on Panel',
  'HDMI Not Working',
  'Installation & Demo',
  'Line on Panel',
  'Mirror Casting Issue',
  'No Picture - Sound OK',
  'No Power On',
  'Abnormal Noise',
  'Cooling Ineffective',
  'Water Leakage',
  'Gas Leakage Fault',
  'PCB Failure',
  'Compressor Trip Issue',
];

const DEFAULT_PROMISE_TIME_SLOTS = [
  '9-11 AM',
  '11 AM-1 PM',
  '1-3 PM',
  '3-5 PM',
  '5-7 PM',
  '7-9 PM',
];

// Comprehensive State -> Districts mapping
const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  'UTTAR PRADESH': [
    'GHAZIABAD', 'GAUTAM BUDDHA NAGAR (NOIDA)', 'LUCKNOW', 'KANPUR NAGAR', 'AGRA',
    'VARANASI', 'MEERUT', 'PRAYAGRAJ', 'BAREILLY', 'ALIGARH', 'MORADABAD', 'GORAKHPUR',
    'SAHARANPUR', 'FIROZABAD', 'JHANSI', 'MUZAFFARNAGAR', 'MATHURA', 'AYODHYA'
  ],
  'DELHI': [
    'CENTRAL DELHI', 'EAST DELHI', 'NEW DELHI', 'NORTH DELHI', 'NORTH EAST DELHI',
    'NORTH WEST DELHI', 'SOUTH DELHI', 'SOUTH EAST DELHI', 'SOUTH WEST DELHI', 'WEST DELHI'
  ],
  'HARYANA': [
    'GURUGRAM', 'FARIDABAD', 'PANIPAT', 'AMBALA', 'YAMUNANAGAR', 'ROHTAK', 'HISAR',
    'KARNAL', 'SONIPAT', 'PANCHKULA', 'BHIWANI', 'SIRSA', 'JIND', 'REWARI'
  ],
  'MAHARASHTRA': [
    'MUMBAI CITY', 'MUMBAI SUBURBAN', 'PUNE', 'THANE', 'NAGPUR', 'NASHIK',
    'CHHATRAPATI SAMBHAJINAGAR', 'SOLAPUR', 'KOLHAPUR', 'AMRAVATI', 'NAVI MUMBAI'
  ],
  'KARNATAKA': [
    'BENGALURU URBAN', 'BENGALURU RURAL', 'MYSURU', 'HUBBALLI-DHARWAD', 'MANGALURU',
    'BELAGAVI', 'KALABURAGI', 'BALLARI', 'DAVANAGERE', 'SHIVAMOGGA'
  ],
  'TAMIL NADU': [
    'CHENNAI', 'COIMBATORE', 'MADURAI', 'TIRUCHIRAPPALLI', 'SALEM', 'TIRUPPUR',
    'ERODE', 'VELLORE', 'THOOTHUKUDI', 'DINDIGUL', 'THANJAVUR'
  ],
  'GUJARAT': [
    'AHMEDABAD', 'SURAT', 'VADODARA', 'RAJKOT', 'BHAVNAGAR', 'JAMNAGAR', 'GANDHINAGAR',
    'JUNAGADH', 'ANAND', 'NAVSARI', 'MORBI'
  ],
  'WEST BENGAL': [
    'KOLKATA', 'HOWRAH', 'NORTH 24 PARGANAS', 'SOUTH 24 PARGANAS', 'HOOGHLY',
    'PASCHIM MEDINIPUR', 'PURBA BARDHAMAN', 'DARJEELING', 'SILIGURI', 'MALDA'
  ],
  'RAJASTHAN': [
    'JAIPUR', 'JODHPUR', 'KOTA', 'BIKANER', 'AJMER', 'UDAIPUR', 'BHILWARA',
    'ALWAR', 'SIKAR', 'SRI GANGANAGAR', 'PALI'
  ],
  'PUNJAB': [
    'LUDHIANA', 'AMRITSAR', 'JALANDHAR', 'PATIALA', 'BATHINDA', 'SAS NAGAR (MOHALI)',
    'HOSHIARPUR', 'PATHANKOT', 'MOGA', 'ABOHAR'
  ],
  'BIHAR': [
    'PATNA', 'GAYA', 'BHAGALPUR', 'MUZAFFARPUR', 'PURNEA', 'DARBHANGA',
    'BIHAR SHARIF', 'ARRAH', 'BEGUSARAI', 'KATIHAR'
  ],
  'MADHYA PRADESH': [
    'INDORE', 'BHOPAL', 'JABALPUR', 'GWALIOR', 'UJJAIN', 'SAGAR', 'DEWAS',
    'SATNA', 'RATLAM', 'REWA'
  ],
  'TELANGANA': [
    'HYDERABAD', 'WARANGAL', 'NIZAMABAD', 'KARIMNAGAR', 'KHAMMAM', 'RAMAGUNDAM',
    'MAHBUBNAGAR', 'NALGONDA'
  ],
  'ANDHRA PRADESH': [
    'VISAKHAPATNAM', 'VIJAYAWADA', 'GUNTUR', 'NELLORE', 'KURNOOL', 'RAJAHMUNDRY',
    'TIRUPATI', 'KADAPA', 'KAKINADA'
  ],
  'KERALA': [
    'THIRUVANANTHAPURAM', 'ERNAKULAM (KOCHI)', 'KOZHIKODE', 'THRISSUR', 'KOLLAM',
    'PALAKKAD', 'ALAPPUZHA', 'KANNUR', 'KOTTAYAM'
  ],
  'CHANDIGARH': ['CHANDIGARH'],
  'GOA': ['NORTH GOA', 'SOUTH GOA'],
  'JHARKHAND': ['RANCHI', 'JAMSHEDPUR', 'DHANBAD', 'BOKARO', 'DEOGHAR', 'HAZARIBAGH'],
  'ODISHA': ['BHUBANESWAR', 'CUTTACK', 'ROURKELA', 'BERHAMPUR', 'SAMBALPUR', 'PURI'],
  'ASSAM': ['GUWAHATI', 'SILCHAR', 'DIBRUGARH', 'JORHAT', 'NAGAON', 'TINSUKIA'],
  'UTTARAKHAND': ['DEHRADUN', 'HARIDWAR', 'ROORKEE', 'HALDWANI', 'RUDRAPUR', 'NAINITAL'],
  'HIMACHAL PRADESH': ['SHIMLA', 'DHARAMSHALA', 'SOLAN', 'MANDI', 'KULLU', 'BILASPUR'],
  'JAMMU & KASHMIR': ['SRINAGAR', 'JAMMU', 'ANANTNAG', 'BARAMULLA', 'UDHAMPUR'],
};

interface CallRegistrationModuleProps {
  currentUser?: any;
  onCallRegistered?: (call: any) => void;
  onCancel?: () => void;
}

export default function CallRegistrationModule({
  currentUser,
  onCallRegistered,
  onCancel,
}: CallRegistrationModuleProps) {
  const isSuperAdmin =
    currentUser?.role === 'Super Admin' ||
    currentUser?.roleCode === 'SUPER_ADMIN' ||
    !currentUser;

  // Screen View Mode: 'search' | 'form'
  const [viewMode, setViewMode] = useState<'search' | 'form'>('search');

  // Initial Search Parameters
  const [searchParams, setSearchParams] = useState({
    name: '',
    mobile: '',
    complaintNo: '',
    serialNo: '',
  });
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  // Master Data Lists
  const [brands, setBrands] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);

  // Configurable Dynamic Dropdowns (Super Admin Managed)
  const [callRegisterByOptions, setCallRegisterByOptions] = useState<string[]>(DEFAULT_CALL_REGISTER_BY);
  const [callSourceOptions, setCallSourceOptions] = useState<string[]>(DEFAULT_CALL_SOURCES);
  const [callTypeOptions, setCallTypeOptions] = useState<string[]>(DEFAULT_CALL_TYPES);
  const [complaintPriorityOptions, setComplaintPriorityOptions] = useState<string[]>(DEFAULT_COMPLAINT_PRIORITIES);
  const [callNatureOptions, setCallNatureOptions] = useState<string[]>(DEFAULT_CALL_NATURES);
  const [visitTypeOptions, setVisitTypeOptions] = useState<string[]>(DEFAULT_VISIT_TYPES);
  const [warrantyOptions, setWarrantyOptions] = useState<string[]>(DEFAULT_WARRANTY_OPTIONS);
  const [stockOfOptions, setStockOfOptions] = useState<string[]>(DEFAULT_STOCK_OF_OPTIONS);
  const [languageOptions, setLanguageOptions] = useState<string[]>(DEFAULT_LANGUAGES);
  const [complaintDescriptions, setComplaintDescriptions] = useState<string[]>(DEFAULT_COMPLAINT_DESCRIPTIONS);

  // Super Admin Master Settings Modal
  const [showMasterConfigModal, setShowMasterConfigModal] = useState(false);
  const [activeConfigCategory, setActiveConfigCategory] = useState<string>('callType');
  const [newOptionInput, setNewOptionInput] = useState('');

  // Main Registration Form State
  const initialFormState = {
    // Section A: Basic Registration Details
    callRegisterBy: 'Customer',
    callSource: 'Call Centre',

    // Section B: Customer Details
    customerTitle: 'Mr',
    customerFirstName: '',
    customerLastName: '',
    customerAddress1: '',
    landmark: '',
    pincode: '',
    state: '',
    district: '',
    city: '',

    // Section C: Contact Details
    customerMobile: '',
    customerEmail: '',
    contactPersonName: '',
    contactPersonMobile: '',
    languages: ['Hindi'],

    // Section D: Dealer Details
    dealerName: '',
    dealerCity: '',
    dealerMobile: '',
    dealerEmail: '',
    invoiceNo: '',
    dealerDOP: '',

    // Section E: Product Details
    brandId: '',
    brandName: '',
    clientId: '',
    clientName: '',
    clientCode: '',
    categoryId: '',
    categoryName: '',
    productId: '',
    productName: '',
    modelId: '',
    modelNo: '',
    unitSerialNumber: '',
    productDOP: '',
    warrantyStatus: 'Under Warranty',
    stockOf: 'Customer Stock',
    purchaseOrderNo: '',

    // Section F: Complaint Details
    callType: 'Service',
    complaintPriority: 'Normal complaint',
    callNature: 'Normal',
    visitType: 'On site - Local',
    lastComplaintNo: '',
    complaintDescription: '',
    specialInstruction: '',
    serviceProviderType: 'Branch',
    serviceProviderName: '',
    promiseDate: new Date().toISOString().split('T')[0],
    promiseTime: '9-11 AM',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Search filter for Language list
  const [languageSearch, setLanguageSearch] = useState('');

  // Load All Masters on Mount
  useEffect(() => {
    fetchAllMasters();
  }, []);

  const fetchAllMasters = async () => {
    try {
      const [
        brandRes,
        clientRes,
        prodRes,
        catRes,
        modRes,
        branchRes,
        franchiseRes,
        freelancerRes,
        vendorRes,
        techRes,
        symptomRes,
        dynRes,
      ] = await Promise.all([
        fetchWithCache('/api/masters/brands').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/clients').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/products').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/categories').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/models').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/branches').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/franchises').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/freelancers').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/vendors').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/technicians').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/symptoms').catch(() => ({ data: [] })),
        fetchWithCache('/api/masters/dynamic?type=call_reg_*').catch(() => ({ data: [] })),
      ]);

      const activeBrands = (brandRes.data || []).filter((b: any) => b.status === 'A' || !b.status);
      setBrands(activeBrands);

      const activeClients = (clientRes.data || []).filter((c: any) => c.status === 'A' || !c.status);
      setClients(activeClients);

      const activeProducts = (prodRes.data || []).filter((p: any) => p.status === 'A' || !p.status);
      setProducts(activeProducts);

      const activeCategories = (catRes.data || []).filter((c: any) => c.status === 'A' || !c.status);
      setCategories(activeCategories);

      const activeModels = (modRes.data || []).filter((m: any) => m.status === 'A' || !m.status);
      setModels(activeModels);

      setBranches(branchRes.data || []);
      setFranchises(franchiseRes.data || []);
      setFreelancers(freelancerRes.data || []);
      setVendors(vendorRes.data || []);
      setTechnicians(techRes.data || []);

      const activeSymptoms = (symptomRes.data || []).filter((s: any) => s.status === 'Active' || !s.status);
      setSymptoms(activeSymptoms);

      // Restore dynamic options configured by Super Admin
      if (dynRes && dynRes.success && Array.isArray(dynRes.data)) {
        const getDyn = (t: string) => dynRes.data.filter((d: any) => d.entityType === t).map((d: any) => d.name);
        const crb = getDyn('call_reg_callRegisterBy');
        if (crb.length) setCallRegisterByOptions(Array.from(new Set([...DEFAULT_CALL_REGISTER_BY, ...crb])));
        const cs = getDyn('call_reg_callSource');
        if (cs.length) setCallSourceOptions(Array.from(new Set([...DEFAULT_CALL_SOURCES, ...cs])));
        const ct = getDyn('call_reg_callType');
        if (ct.length) setCallTypeOptions(Array.from(new Set([...DEFAULT_CALL_TYPES, ...ct])));
        const cp = getDyn('call_reg_complaintPriority');
        if (cp.length) setComplaintPriorityOptions(Array.from(new Set([...DEFAULT_COMPLAINT_PRIORITIES, ...cp])));
        const cn = getDyn('call_reg_callNature');
        if (cn.length) setCallNatureOptions(Array.from(new Set([...DEFAULT_CALL_NATURES, ...cn])));
        const vt = getDyn('call_reg_visitType');
        if (vt.length) setVisitTypeOptions(Array.from(new Set([...DEFAULT_VISIT_TYPES, ...vt])));
        const war = getDyn('call_reg_warranty');
        if (war.length) setWarrantyOptions(Array.from(new Set([...DEFAULT_WARRANTY_OPTIONS, ...war])));
        const st = getDyn('call_reg_stockOf');
        if (st.length) setStockOfOptions(Array.from(new Set([...DEFAULT_STOCK_OF_OPTIONS, ...st])));
        const lng = getDyn('call_reg_language');
        if (lng.length) setLanguageOptions(Array.from(new Set([...DEFAULT_LANGUAGES, ...lng])));
        const cdesc = getDyn('call_reg_complaintDescription');
        if (cdesc.length) setComplaintDescriptions(Array.from(new Set([...DEFAULT_COMPLAINT_DESCRIPTIONS, ...cdesc])));
      }

      // Merge dynamic symptom names into complaint descriptions
      if (activeSymptoms.length > 0) {
        const customSyms = activeSymptoms.map((s: any) => s.symptomName).filter(Boolean);
        setComplaintDescriptions((prev) => Array.from(new Set([...prev, ...customSyms])));
      }
    } catch (e) {
      console.error('Error fetching registration masters:', e);
    }
  };

  // ==========================================
  // SECTION 1: INITIAL SEARCH LOGIC
  // ==========================================

  const handleSearchComplaints = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const { name, mobile, complaintNo, serialNo } = searchParams;
    if (!name && !mobile && !complaintNo && !serialNo) {
      alert('Please enter at least one search parameter (Name, Mobile, Complaint No., or Serial No.)');
      return;
    }

    setSearching(true);
    setSearchResults(null);

    try {
      const q = new URLSearchParams();
      if (name) q.set('name', name);
      if (mobile) q.set('mobile', mobile);
      if (complaintNo) q.set('complaintNo', complaintNo);
      if (serialNo) q.set('serialNo', serialNo);

      const res = await fetch(`/api/calls?${q.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSearchResults(json.data);
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      console.error(err);
      alert('Search failed: ' + (err.message || 'Network error'));
    } finally {
      setSearching(false);
    }
  };

  const handleResetSearch = () => {
    setSearchParams({
      name: '',
      mobile: '',
      complaintNo: '',
      serialNo: '',
    });
    setSearchResults(null);
  };

  const handleStartNewRegistration = (existingCustomerRecord?: any) => {
    if (existingCustomerRecord) {
      // Pre-fill customer and product details from existing record!
      setFormData({
        ...initialFormState,
        customerTitle: existingCustomerRecord.customerTitle || 'Mr',
        customerFirstName: existingCustomerRecord.customerFirstName || existingCustomerRecord.customerName || '',
        customerLastName: existingCustomerRecord.customerLastName || '',
        customerAddress1: existingCustomerRecord.customerAddress1 || existingCustomerRecord.customerAddress || '',
        landmark: existingCustomerRecord.landmark || '',
        pincode: existingCustomerRecord.pincode || '',
        state: existingCustomerRecord.state || '',
        district: existingCustomerRecord.district || '',
        city: existingCustomerRecord.city || '',
        customerMobile: existingCustomerRecord.customerMobile || '',
        customerEmail: existingCustomerRecord.customerEmail || '',
        contactPersonName: existingCustomerRecord.contactPersonName || '',
        contactPersonMobile: existingCustomerRecord.contactPersonMobile || '',
        languages: existingCustomerRecord.languages || ['Hindi'],
        dealerName: existingCustomerRecord.dealerName || '',
        dealerCity: existingCustomerRecord.dealerCity || '',
        dealerMobile: existingCustomerRecord.dealerMobile || '',
        dealerEmail: existingCustomerRecord.dealerEmail || '',
        brandName: existingCustomerRecord.brandName || '',
        clientName: existingCustomerRecord.clientName || '',
        categoryName: existingCustomerRecord.categoryName || '',
        productName: existingCustomerRecord.productName || '',
        modelNo: existingCustomerRecord.modelNo || '',
        unitSerialNumber: existingCustomerRecord.unitSerialNumber || existingCustomerRecord.serialNo || '',
        lastComplaintNo: existingCustomerRecord.callNo || '',
        callType: 'Repeat Failure',
        complaintPriority: 'Repeat Failure',
      });
    } else {
      setFormData(initialFormState);
    }
    setFormError(null);
    setViewMode('form');
  };

  // ==========================================
  // SECTION 2: DEPENDENT DROPDOWNS LOGIC
  // ==========================================

  // A. Brand -> Client Mapping
  const handleBrandChange = (brandId: string) => {
    const selectedBrand = brands.find((b) => b._id === brandId);
    if (!selectedBrand) {
      setFormData((prev) => ({
        ...prev,
        brandId: '',
        brandName: '',
        clientId: '',
        clientName: '',
        clientCode: '',
        productId: '',
        productName: '',
        categoryId: '',
        categoryName: '',
        modelId: '',
        modelNo: '',
      }));
      return;
    }

    // Auto-populate Client
    let matchedClient = clients.find((c) => c._id === selectedBrand.clientId);
    if (!matchedClient && selectedBrand.clientId) {
      matchedClient = clients.find((c) => c.clientCode === selectedBrand.clientId || c.clientName === selectedBrand.clientId);
    }

    setFormData((prev) => ({
      ...prev,
      brandId: selectedBrand._id,
      brandName: selectedBrand.brandName,
      clientId: matchedClient ? matchedClient._id : '',
      clientName: matchedClient ? matchedClient.clientName : '',
      clientCode: matchedClient ? matchedClient.clientCode : '',
      // Reset child fields
      productId: '',
      productName: '',
      categoryId: '',
      categoryName: '',
      modelId: '',
      modelNo: '',
    }));
  };

  // B. Available Products mapped to selected Brand/Client
  const availableProducts = useMemo(() => {
    if (!formData.brandName) return products;
    const filtered = products.filter((p) => {
      const matchBrand =
        p.brandId === formData.brandId ||
        p.brandName?.toLowerCase() === formData.brandName.toLowerCase();
      return matchBrand;
    });
    return filtered.length > 0 ? filtered : products;
  }, [products, formData.brandId, formData.brandName]);

  // C. Product -> Category & Model Mapping
  const handleProductChange = (productId: string) => {
    const selectedProd = products.find((p) => p._id === productId);
    if (!selectedProd) {
      setFormData((prev) => ({
        ...prev,
        productId: '',
        productName: '',
        categoryId: '',
        categoryName: '',
        modelId: '',
        modelNo: '',
      }));
      return;
    }

    // Auto-populate Category
    let matchedCatName = selectedProd.categoryName || '';
    if (!matchedCatName && selectedProd.categoryId) {
      const foundCat = categories.find((c) => c._id === selectedProd.categoryId);
      if (foundCat) matchedCatName = foundCat.categoryName;
    }

    setFormData((prev) => ({
      ...prev,
      productId: selectedProd._id,
      productName: selectedProd.productName,
      categoryId: selectedProd.categoryId || '',
      categoryName: matchedCatName,
      modelId: '',
      modelNo: '',
    }));
  };

  // D. Available Models mapped to selected Product
  const availableModels = useMemo(() => {
    if (!formData.productId) return models;
    const filtered = models.filter((m) => m.productId === formData.productId);
    return filtered.length > 0 ? filtered : models;
  }, [models, formData.productId]);

  const handleModelChange = (modelId: string) => {
    const selectedMod = models.find((m) => m._id === modelId);
    if (selectedMod) {
      setFormData((prev) => ({
        ...prev,
        modelId: selectedMod._id,
        modelNo: selectedMod.modelNo,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        modelId: '',
        modelNo: '',
      }));
    }
  };

  // E. State -> District -> City Mapping
  const availableDistricts = useMemo(() => {
    if (!formData.state) return [];
    const upperState = formData.state.toUpperCase().trim();
    return INDIAN_STATES_DISTRICTS[upperState] || [];
  }, [formData.state]);

  const handleStateChange = (stateName: string) => {
    setFormData((prev) => ({
      ...prev,
      state: stateName,
      district: '',
      city: '',
    }));
  };

  const handleDistrictChange = (districtName: string) => {
    setFormData((prev) => ({
      ...prev,
      district: districtName,
      city: districtName, // default city matches district
    }));
  };

  // F. Service Provider -> Service Provider Name Mapping
  const serviceProviderNames = useMemo(() => {
    const type = formData.serviceProviderType;
    if (type === 'Branch') {
      return branches.map((b) => b.branchName);
    }
    if (type === 'Franchise') {
      return franchises.map((f) => f.franchiseName);
    }
    if (type === 'Freelancer') {
      return freelancers.map((f) => `${f.freelancerName} (${f.freelancerCode || 'FL'})`);
    }
    if (type === 'Vendor') {
      return vendors.map((v) => `${v.vendorName} (${v.vendorCode || 'VND'})`);
    }
    return [];
  }, [formData.serviceProviderType, branches, franchises, freelancers, vendors]);

  // Language multi-select toggle
  const toggleLanguage = (lang: string) => {
    setFormData((prev) => {
      const exists = prev.languages.includes(lang);
      if (exists) {
        return { ...prev, languages: prev.languages.filter((l) => l !== lang) };
      } else {
        return { ...prev, languages: [...prev.languages, lang] };
      }
    });
  };

  // ==========================================
  // SECTION 3: FORM SUBMISSION
  // ==========================================

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validations
    if (!formData.customerFirstName.trim()) {
      setFormError('Customer First Name is required.');
      return;
    }
    if (!formData.customerMobile.trim() || formData.customerMobile.trim().length < 10) {
      setFormError('Valid 10-digit Customer Mobile Number is required.');
      return;
    }
    if (!formData.brandName) {
      setFormError('Please select a Brand.');
      return;
    }
    if (!formData.productName) {
      setFormError('Please select a Product.');
      return;
    }
    if (!formData.complaintDescription.trim()) {
      setFormError('Please provide Complaint Description.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        customerName: `${formData.customerTitle} ${formData.customerFirstName} ${formData.customerLastName || ''}`.trim(),
        customerAddress: `${formData.customerAddress1}${formData.landmark ? ', Landmark: ' + formData.landmark : ''}`.trim(),
        reportedFault: formData.complaintDescription,
        serialNo: formData.unitSerialNumber,
        callStatus: 'OPEN',
        technicianName: formData.serviceProviderName,
        registeredBy: currentUser?.fullName || currentUser?.username || 'Call Coordinator',
      };

      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        alert(`🎉 Service Call Registered Successfully!\n\nComplaint / Call No: ${json.data.callNo}\nCustomer: ${json.data.customerName}\nStatus: OPEN`);
        invalidateCache('/api/calls');
        if (onCallRegistered) {
          onCallRegistered(json.data);
        }
        setFormData(initialFormState);
        setViewMode('search');
        setSearchResults(null);
      } else {
        setFormError(json.message || 'Failed to register service call.');
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // SECTION 4: SUPER ADMIN DYNAMIC MASTER OPTIONS
  // ==========================================

  const handleAddMasterOption = async () => {
    if (!newOptionInput.trim()) return;
    const val = newOptionInput.trim();

    if (activeConfigCategory === 'callRegisterBy') {
      setCallRegisterByOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'callSource') {
      setCallSourceOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'callType') {
      setCallTypeOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'complaintPriority') {
      setComplaintPriorityOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'callNature') {
      setCallNatureOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'visitType') {
      setVisitTypeOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'warranty') {
      setWarrantyOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'stockOf') {
      setStockOfOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'language') {
      setLanguageOptions((prev) => Array.from(new Set([...prev, val])));
    } else if (activeConfigCategory === 'complaintDescription') {
      setComplaintDescriptions((prev) => Array.from(new Set([...prev, val])));
    }

    setNewOptionInput('');

    try {
      await fetch('/api/masters/dynamic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: `call_reg_${activeConfigCategory}`,
          name: val,
          status: 'Active',
        }),
      });
      invalidateCache('/api/masters/dynamic?type=call_reg_*');
    } catch (e) {
      console.error('Failed to persist dynamic option:', e);
    }
  };

  const handleDeleteMasterOption = async (category: string, opt: string) => {
    if (!confirm(`Delete "${opt}" from ${category}?`)) return;

    if (category === 'callRegisterBy') {
      setCallRegisterByOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'callSource') {
      setCallSourceOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'callType') {
      setCallTypeOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'complaintPriority') {
      setComplaintPriorityOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'callNature') {
      setCallNatureOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'visitType') {
      setVisitTypeOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'warranty') {
      setWarrantyOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'stockOf') {
      setStockOfOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'language') {
      setLanguageOptions((prev) => prev.filter((o) => o !== opt));
    } else if (category === 'complaintDescription') {
      setComplaintDescriptions((prev) => prev.filter((o) => o !== opt));
    }

    try {
      await fetch(`/api/masters/dynamic?type=call_reg_${category}&name=${encodeURIComponent(opt)}`, {
        method: 'DELETE',
      });
      invalidateCache('/api/masters/dynamic?type=call_reg_*');
    } catch (e) {
      console.error('Failed to delete dynamic option:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* ============================================================== */}
      {/* 1. INITIAL SEARCH SCREEN                                        */}
      {/* ============================================================== */}
      {viewMode === 'search' && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📞</span>
                <h1 className="text-xl font-bold text-white tracking-wide">Call Registration &amp; Search</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  Intake Module
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Search existing complaint records and customer history or initiate a brand new service registration
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => setShowMasterConfigModal(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-[#24344d] transition flex items-center gap-1.5"
                  title="Configure dropdown options for Call Registration"
                >
                  <span>⚙️</span>
                  <span>Master Dropdown Settings</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleStartNewRegistration()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/30 transition flex items-center gap-2"
              >
                <span>➕</span>
                <span>New Registration</span>
              </button>
            </div>
          </div>

          {/* Initial Search Form Card */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-5">
            <div className="border-b border-[#24344d] pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>🔍</span>
                <span>Search Existing Customer &amp; Complaint History</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Enter any one field or a combination of parameters to look up warranty history, serial numbers, or prior tickets
              </p>
            </div>

            <form onSubmit={handleSearchComplaints} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Customer Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={searchParams.name}
                    onChange={(e) => setSearchParams({ ...searchParams, name: e.target.value })}
                    className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Registered Mobile No.</label>
                  <input
                    type="text"
                    placeholder="e.g. 9810987654"
                    value={searchParams.mobile}
                    onChange={(e) => setSearchParams({ ...searchParams, mobile: e.target.value })}
                    className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Complaint No.</label>
                  <input
                    type="text"
                    placeholder="e.g. QS-CALL-1001"
                    value={searchParams.complaintNo}
                    onChange={(e) => setSearchParams({ ...searchParams, complaintNo: e.target.value.toUpperCase() })}
                    className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Serial No.</label>
                  <input
                    type="text"
                    placeholder="e.g. SN-88291002"
                    value={searchParams.serialNo}
                    onChange={(e) => setSearchParams({ ...searchParams, serialNo: e.target.value })}
                    className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-[#24344d]">
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition"
                >
                  Clear Fields
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-md shadow-blue-900/30"
                  >
                    <span>{searching ? 'Searching...' : '🔍 Search'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartNewRegistration()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
                  >
                    <span>➕ New Registration</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Search Results Display */}
          {searchResults && (
            <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#24344d] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>📋 Search Results</span>
                  <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">
                    {searchResults.length} Match(es) Found
                  </span>
                </h3>

                <button
                  onClick={() => handleStartNewRegistration()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1"
                >
                  <span>+</span> New Registration
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="text-3xl">🔎</div>
                  <p className="text-sm font-semibold text-slate-300">No records found matching your search.</p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    No prior tickets exist for this customer, phone, or serial number. Click below to create a fresh registration.
                  </p>
                  <button
                    onClick={() => handleStartNewRegistration()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-900/30 transition"
                  >
                    ➕ Proceed with New Registration
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto custom-horizontal-scrollbar border border-[#24344d] rounded-xl">
                  <table className="w-full text-left border-collapse text-xs min-w-[1050px]">
                    <thead className="bg-[#0d1624] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#24344d]">
                      <tr>
                        <th className="py-3 px-4 whitespace-nowrap">Complaint No.</th>
                        <th className="py-3 px-4 whitespace-nowrap">Customer Name</th>
                        <th className="py-3 px-4 whitespace-nowrap">Mobile No.</th>
                        <th className="py-3 px-4 whitespace-nowrap">Product / Brand</th>
                        <th className="py-3 px-4 whitespace-nowrap">Serial No.</th>
                        <th className="py-3 px-4 whitespace-nowrap">Location</th>
                        <th className="py-3 px-4 whitespace-nowrap">Status</th>
                        <th className="py-3 px-4 whitespace-nowrap text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#24344d]/60 text-slate-300">
                      {searchResults.map((rec) => (
                        <tr key={rec._id} className="hover:bg-[#16233b]/60 transition">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            {rec.callNo}
                          </td>
                          <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                            {rec.customerName}
                          </td>
                          <td className="py-3 px-4 font-mono whitespace-nowrap">{rec.customerMobile}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div>{rec.brandName} - {rec.productName || rec.categoryName}</div>
                            {rec.modelNo && <div className="text-[10px] text-slate-400">Model: {rec.modelNo}</div>}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                            {rec.unitSerialNumber || rec.serialNo || '-'}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {rec.city}, {rec.state}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rec.callStatus === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : rec.callStatus === 'CANCEL'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              }`}
                            >
                              {rec.callStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleStartNewRegistration(rec)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow transition"
                              title="Register a new complaint for this customer pre-populating address and contact"
                            >
                              ➕ Register Call for Customer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. CALL REGISTRATION – MAIN FORM (SECTIONS A TO F)             */}
      {/* ============================================================== */}
      {viewMode === 'form' && (
        <form onSubmit={handleSubmitRegistration} className="space-y-6">
          {/* Top Form Navigation Bar */}
          <div className="bg-[#111c2e] p-4 sm:p-5 rounded-2xl border border-[#24344d] shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setViewMode('search')}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-[#24344d] transition"
                >
                  ← Back to Search
                </button>
                <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  New Service Call Registration
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold font-mono">
                  Standard CRM Format
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Fill in Customer, Dealer, Product, and Complaint specifications to book ticket
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setViewMode('search')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-[#24344d] transition flex-1 sm:flex-initial"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-1.5 flex-1 sm:flex-initial cursor-pointer"
              >
                <span>{submitting ? 'Submitting Registration...' : '✓ Submit Registration'}</span>
              </button>
            </div>
          </div>

          {formError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION A: BASIC REGISTRATION DETAILS                          */}
          {/* ============================================================== */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-4">
            <div className="border-b border-[#24344d] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>📌</span>
                <span>A. Basic Registration Details</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Channel &amp; Origin</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Call Register By <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.callRegisterBy}
                  onChange={(e) => setFormData({ ...formData, callRegisterBy: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {callRegisterByOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Call Source <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.callSource}
                  onChange={(e) => setFormData({ ...formData, callSource: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {callSourceOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION B: CUSTOMER DETAILS                                    */}
          {/* ============================================================== */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-4">
            <div className="border-b border-[#24344d] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>👤</span>
                <span>B. Customer Details</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Service Delivery Address</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Title</label>
                <select
                  value={formData.customerTitle}
                  onChange={(e) => setFormData({ ...formData, customerTitle: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {CUSTOMER_TITLES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter First Name"
                  value={formData.customerFirstName}
                  onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Last Name</label>
                <input
                  type="text"
                  placeholder="Enter Last Name"
                  value={formData.customerLastName}
                  onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Address1 (Full Width) */}
            <div className="text-xs">
              <label className="block text-slate-300 mb-1 font-medium">
                Address1 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="House / Flat No, Building Name, Street / Sector"
                value={formData.customerAddress1}
                onChange={(e) => setFormData({ ...formData, customerAddress1: e.target.value })}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Landmark</label>
                <input
                  type="text"
                  placeholder="Nearby landmark, metro pillar, or shop"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Pincode (Auto-Lookup) <span className="text-rose-400">*</span>
                </label>
                <PincodeField
                  pincode={formData.pincode}
                  onPincodeChange={(pin) => setFormData((prev) => ({ ...prev, pincode: pin }))}
                  onLocationFound={async (loc) => {
                    setFormData((prev) => ({
                      ...prev,
                      state: loc.state,
                      district: loc.district || loc.city,
                      city: loc.city,
                    }));

                    // Map franchise territory routing if mapped to this pincode
                    try {
                      const cleanPin = (formData.pincode || '').trim();
                      if (cleanPin.length === 6) {
                        const mapRes = await fetch(`/api/masters/mappings/franchise-pincodes?pincode=${cleanPin}`);
                        const mapJson = await mapRes.json();
                        if (mapJson.success && Array.isArray(mapJson.data) && mapJson.data.length > 0) {
                          const mappedF = mapJson.data[0];
                          setFormData((prev) => ({
                            ...prev,
                            serviceProviderType: 'Franchise',
                            serviceProviderName: mappedF.franchiseName,
                          }));
                        }
                      }
                    } catch (mapErr) {
                      console.warn('Franchise pincode lookup error:', mapErr);
                    }
                  }}
                />
              </div>
            </div>

            {/* State -> District -> City Dependent Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  State <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">---Select State---</option>
                  {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">District</label>
                <select
                  value={formData.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  disabled={!formData.state}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-40"
                >
                  <option value="">---Select District---</option>
                  {availableDistricts.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
                  {availableDistricts.length === 0 && formData.state && (
                    <option value={formData.state}>{formData.state}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  City <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION C: CONTACT DETAILS                                     */}
          {/* ============================================================== */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-4">
            <div className="border-b border-[#24344d] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>📱</span>
                <span>C. Contact Details</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Primary &amp; Alternate Contacts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Mobile <span className="text-rose-400">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit primary mobile"
                  value={formData.customerMobile}
                  onChange={(e) => setFormData({ ...formData, customerMobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Email</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Contact Person Name</label>
                <input
                  type="text"
                  placeholder="Alternate person at location"
                  value={formData.contactPersonName}
                  onChange={(e) => setFormData({ ...formData, contactPersonName: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Contact Person Mobile</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="Alternate mobile number"
                  value={formData.contactPersonMobile}
                  onChange={(e) => setFormData({ ...formData, contactPersonMobile: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Language (Scrollable Multi-Select Checkbox List) */}
            <div className="pt-2 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-slate-300">
                  Preferred Language(s): <span className="text-blue-400 font-semibold">{formData.languages.join(', ') || 'None selected'}</span>
                </label>
                <input
                  type="text"
                  placeholder="Filter languages..."
                  value={languageSearch}
                  onChange={(e) => setLanguageSearch(e.target.value)}
                  className="bg-[#0d1624] border border-[#24344d] rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="bg-[#0d1624] border border-[#24344d] rounded-xl p-3 max-h-36 overflow-y-auto custom-horizontal-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {languageOptions
                  .filter((l) => l.toLowerCase().includes(languageSearch.toLowerCase()))
                  .map((lang) => {
                    const checked = formData.languages.includes(lang);
                    return (
                      <label
                        key={lang}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition select-none ${
                          checked
                            ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleLanguage(lang)}
                          className="accent-blue-500 rounded"
                        />
                        <span className="text-xs">{lang}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION D: DEALER DETAILS                                      */}
          {/* ============================================================== */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-4">
            <div className="border-b border-[#24344d] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>🏪</span>
                <span>D. Dealer Details</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Point of Purchase</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Dealer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Croma, Reliance Digital, Vijay Sales"
                  value={formData.dealerName}
                  onChange={(e) => setFormData({ ...formData, dealerName: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Dealer City</label>
                <input
                  type="text"
                  placeholder="City of purchase"
                  value={formData.dealerCity}
                  onChange={(e) => setFormData({ ...formData, dealerCity: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Dealer Mob No.</label>
                <input
                  type="tel"
                  placeholder="Dealer phone"
                  value={formData.dealerMobile}
                  onChange={(e) => setFormData({ ...formData, dealerMobile: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Dealer Email</label>
                <input
                  type="email"
                  placeholder="dealer@retailer.com"
                  value={formData.dealerEmail}
                  onChange={(e) => setFormData({ ...formData, dealerEmail: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Invoice No.</label>
                <input
                  type="text"
                  placeholder="e.g. INV-990812"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">D.O.P. (Date of Purchase)</label>
                <input
                  type="date"
                  value={formData.dealerDOP}
                  onChange={(e) => setFormData({ ...formData, dealerDOP: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION E: PRODUCT DETAILS (BRAND -> CLIENT -> PRODUCT -> MOD) */}
          {/* ============================================================== */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-4">
            <div className="border-b border-[#24344d] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>📦</span>
                <span>E. Product Details</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                Hierarchy: Brand → Client → Product → Model
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* 1. Brand (Populated from Brand Master) */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Brand <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.brandId}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="">---Select Brand---</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.brandName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Client (Auto-populated from Brand Mapping) */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Client (Auto-Mapped)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  placeholder="Auto-mapped Client"
                  value={
                    formData.clientName
                      ? `${formData.clientName}${formData.clientCode ? ` (${formData.clientCode})` : ''}`
                      : 'Select Brand first'
                  }
                  className="w-full bg-[#0d1624]/60 border border-[#24344d] rounded-lg px-3 py-2 text-emerald-400 font-medium cursor-not-allowed"
                />
              </div>

              {/* 3. Product (Filtered by Brand/Client) */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Product <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  disabled={!formData.brandId}
                  value={formData.productId}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-40"
                >
                  <option value="">---Select Product---</option>
                  {availableProducts.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.productName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Category (Auto-populated from Product) */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Category (Auto-Mapped)
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="Auto-mapped Category"
                  value={formData.categoryName || 'Select Product first'}
                  className="w-full bg-[#0d1624]/60 border border-[#24344d] rounded-lg px-3 py-2 text-blue-300 font-medium cursor-not-allowed"
                />
              </div>

              {/* 5. Model (Filtered by selected Product) */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Model No. <span className="text-slate-500">(Mapped to Product)</span>
                </label>
                <select
                  disabled={!formData.productId}
                  value={formData.modelId}
                  onChange={(e) => handleModelChange(e.target.value)}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-40 font-mono"
                >
                  <option value="">---Select Model---</option>
                  {availableModels.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.modelNo} {m.description ? `(${m.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Unit Serial Number */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Unit Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-99881023"
                  value={formData.unitSerialNumber}
                  onChange={(e) => setFormData({ ...formData, unitSerialNumber: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 7. Product D.O.P. */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">D.O.P. (Date of Purchase)</label>
                <input
                  type="date"
                  value={formData.productDOP}
                  onChange={(e) => setFormData({ ...formData, productDOP: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 8. Warranty */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Warranty</label>
                <select
                  value={formData.warrantyStatus}
                  onChange={(e) => setFormData({ ...formData, warrantyStatus: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {warrantyOptions.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              {/* 9. Stock OF */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Stock OF</label>
                <select
                  value={formData.stockOf}
                  onChange={(e) => setFormData({ ...formData, stockOf: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {stockOfOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* 10. Purchase Order Number */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Purchase Order Number</label>
                <input
                  type="text"
                  placeholder="PO number reference"
                  value={formData.purchaseOrderNo}
                  onChange={(e) => setFormData({ ...formData, purchaseOrderNo: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SECTION F: COMPLAINT DETAILS                                   */}
          {/* ============================================================== */}
          <div className="bg-[#111c2e] p-6 rounded-2xl border border-[#24344d] shadow-xl space-y-4">
            <div className="border-b border-[#24344d] pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span>🔧</span>
                <span>F. Complaint Details</span>
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">Fault Specification &amp; Dispatch</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {/* 1. Call Type */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Call Type <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formData.callType}
                  onChange={(e) => setFormData({ ...formData, callType: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {callTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* 2. Complaint Priority */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Complaint Priority</label>
                <select
                  value={formData.complaintPriority}
                  onChange={(e) => setFormData({ ...formData, complaintPriority: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {complaintPriorityOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* 3. Call Nature */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Call Nature</label>
                <select
                  value={formData.callNature}
                  onChange={(e) => setFormData({ ...formData, callNature: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {callNatureOptions.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* 4. Visit Type */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Visit Type</label>
                <select
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {visitTypeOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {/* 5. Last Complaint No */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Last Complaint No.</label>
                <input
                  type="text"
                  placeholder="Prior complaint reference"
                  value={formData.lastComplaintNo}
                  onChange={(e) => setFormData({ ...formData, lastComplaintNo: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 6. Service Provider */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Service Provider</label>
                <select
                  value={formData.serviceProviderType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      serviceProviderType: e.target.value,
                      serviceProviderName: '',
                    })
                  }
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Branch">Branch</option>
                  <option value="Franchise">Franchise</option>
                  <option value="Freelancer">Freelancer</option>
                  <option value="Vendor">Vendor</option>
                </select>
              </div>

              {/* 7. Service Provider Name */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">
                  Service Provider Name ({formData.serviceProviderType})
                </label>
                <select
                  value={formData.serviceProviderName}
                  onChange={(e) => setFormData({ ...formData, serviceProviderName: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">---Select {formData.serviceProviderType}---</option>
                  {serviceProviderNames.map((sp) => (
                    <option key={sp} value={sp}>{sp}</option>
                  ))}
                </select>
              </div>

              {/* 8. Promise Date */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Promise Date</label>
                <input
                  type="date"
                  value={formData.promiseDate}
                  onChange={(e) => setFormData({ ...formData, promiseDate: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 9. Promise Time */}
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Promise Time</label>
                <select
                  value={formData.promiseTime}
                  onChange={(e) => setFormData({ ...formData, promiseTime: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  {DEFAULT_PROMISE_TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 10. Complaint Description (Searchable / Selectable Dropdown) */}
            <div className="text-xs pt-2">
              <label className="block text-slate-300 mb-1 font-medium">
                Complaint Description <span className="text-rose-400">*</span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="text"
                  required
                  list="complaint-descriptions-list"
                  placeholder="Select or type complaint description (e.g., No Power On, Line on Panel, Cooling Ineffective)..."
                  value={formData.complaintDescription}
                  onChange={(e) => setFormData({ ...formData, complaintDescription: e.target.value })}
                  className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <datalist id="complaint-descriptions-list">
                  {complaintDescriptions.map((desc) => (
                    <option key={desc} value={desc} />
                  ))}
                </datalist>
                <p className="text-[11px] text-slate-500">
                  Tip: Start typing to auto-complete from symptom &amp; fault catalogue, or enter custom defect description.
                </p>
              </div>
            </div>

            {/* 11. Special Instruction (Full Width Textarea) */}
            <div className="text-xs pt-2">
              <label className="block text-slate-300 mb-1 font-medium">Special Instruction</label>
              <textarea
                rows={3}
                placeholder="Customer availability constraints, gate pass instructions, technician precautions, or escalation notes..."
                value={formData.specialInstruction}
                onChange={(e) => setFormData({ ...formData, specialInstruction: e.target.value })}
                className="w-full bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="flex items-center justify-between p-5 bg-[#111c2e] rounded-2xl border border-[#24344d] shadow-xl">
            <button
              type="button"
              onClick={() => setViewMode('search')}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg border border-[#24344d] transition"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
              >
                <span>{submitting ? 'Validating & Saving...' : '✓ Submit Call Registration'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* 3. SUPER ADMIN MASTER DROPDOWN CONFIGURATION MODAL             */}
      {/* ============================================================== */}
      {showMasterConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111c2e] border border-[#24344d] rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#24344d] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>⚙️</span>
                  <span>Manage Call Registration Dropdown Masters</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Super Admin control to add, edit, or remove dropdown choices dynamically
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMasterConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-[#24344d] pb-3 text-xs">
              {[
                { id: 'callRegisterBy', label: 'Register By' },
                { id: 'callSource', label: 'Call Source' },
                { id: 'callType', label: 'Call Type' },
                { id: 'complaintPriority', label: 'Priority' },
                { id: 'callNature', label: 'Call Nature' },
                { id: 'visitType', label: 'Visit Type' },
                { id: 'warranty', label: 'Warranty' },
                { id: 'stockOf', label: 'Stock OF' },
                { id: 'language', label: 'Languages' },
                { id: 'complaintDescription', label: 'Complaint Descriptions' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveConfigCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeConfigCategory === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#0d1624] text-slate-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Option Creation Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Type new option to add to ${activeConfigCategory}...`}
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMasterOption();
                  }
                }}
                className="flex-1 bg-[#0d1624] border border-[#24344d] rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddMasterOption}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                + Add Option
              </button>
            </div>

            {/* List of current options */}
            <div className="bg-[#0d1624] border border-[#24344d] rounded-xl p-3 max-h-56 overflow-y-auto custom-horizontal-scrollbar space-y-1.5">
              {(activeConfigCategory === 'callRegisterBy'
                ? callRegisterByOptions
                : activeConfigCategory === 'callSource'
                ? callSourceOptions
                : activeConfigCategory === 'callType'
                ? callTypeOptions
                : activeConfigCategory === 'complaintPriority'
                ? complaintPriorityOptions
                : activeConfigCategory === 'callNature'
                ? callNatureOptions
                : activeConfigCategory === 'visitType'
                ? visitTypeOptions
                : activeConfigCategory === 'warranty'
                ? warrantyOptions
                : activeConfigCategory === 'stockOf'
                ? stockOfOptions
                : activeConfigCategory === 'language'
                ? languageOptions
                : complaintDescriptions
              ).map((opt) => (
                <div
                  key={opt}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#111c2e] hover:bg-[#16233b] text-xs text-slate-200 border border-[#24344d]/60"
                >
                  <span>{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteMasterOption(activeConfigCategory, opt)}
                    className="text-rose-400 hover:text-rose-300 text-xs px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[#24344d]">
              <button
                type="button"
                onClick={() => setShowMasterConfigModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


'use client';

import React, { useState, useEffect } from 'react';
import LoginModal from '@/components/LoginModal';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardView from '@/components/DashboardView';
import BranchMasterView from '@/components/BranchMasterView';
import RoleMasterView from '@/components/RoleMasterView';
import FranchiseMasterView from '@/components/FranchiseMasterView';
import FreelanceMasterView from '@/components/FreelanceMasterView';
import TechnicianMasterView from '@/components/TechnicianMasterView';
import ClientMasterView from '@/components/ClientMasterView';
import BrandMasterView from '@/components/BrandMasterView';
import CategoryMasterView from '@/components/CategoryMasterView';
import ProductMasterView from '@/components/ProductMasterView';
import ModelMasterView from '@/components/ModelMasterView';
import SparesMasterView from '@/components/SparesMasterView';
import VendorMasterView from '@/components/VendorMasterView';
import SymptomMasterView from '@/components/SymptomMasterView';
import CauseMasterView from '@/components/CauseMasterView';
import AnalysisMasterView from '@/components/AnalysisMasterView';
import CategoryMappingView from '@/components/CategoryMappingView';
import FranchiseBrandMappingView from '@/components/FranchiseBrandMappingView';
import FranchiseCategoryMappingView from '@/components/FranchiseCategoryMappingView';
import FranchisePincodeMappingView from '@/components/FranchisePincodeMappingView';
import DownloadView from '@/components/DownloadView';
import DynamicMasterView from '@/components/DynamicMasterView';
import CallManagementView from '@/components/CallManagementView';
import UserManagementView from '@/components/UserManagementView';
import UploaderView from '@/components/UploaderView';
import ReportsView from '@/components/ReportsView';
import ChangePasswordView from '@/components/ChangePasswordView';
import NomenclatureManagementView from '@/components/NomenclatureManagementView';
import { prefetchCommonMasters } from '@/lib/clientCache';

const CALL_MANAGEMENT_SECTIONS = [
  'callRegistration',
  'callView',
  'callEdit',
  'callReminder',
  'callAppointment',
  'callReschedule',
  'callTransfer',
  'callReopen',
  'callCancel',
  'callFeedback',
  'callUpdate',
  'callAllotment',
  'jobsheetPrint',
  'directCancel',
  'directCancelPo',
  'updateSerialNo',
  'callAudit',
];

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(() => new Set(['dashboard']));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setVisitedSections((prev) => {
      if (prev.has(currentSection)) return prev;
      const next = new Set(prev);
      next.add(currentSection);
      return next;
    });
  }, [currentSection]);

  // Pre-warm common master caches in background so section clicks are 0ms instant
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        prefetchCommonMasters();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('qs_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser(parsed);
        // Refresh permissions from DB to catch dynamic changes immediately
        if (parsed.id || parsed.username) {
          fetch(`/api/auth/me?userId=${parsed.id || ''}&username=${parsed.username || ''}`)
            .then((res) => res.json())
            .then((json) => {
              if (json.success && json.user) {
                setUser(json.user);
                sessionStorage.setItem('qs_user', JSON.stringify(json.user));
              }
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckedAuth(true);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('qs_user');
    setUser(null);
  };

  // Helper for quick testing of any role (Super Admin convenience)
  const handleQuickSwitchRole = async (targetRoleCode: string) => {
    try {
      const sampleUsernames: Record<string, string> = {
        SUPER_ADMIN: 'admin',
        ADMIN: 'admin',
        HOD: 'hod_rajesh',
        ZSM: 'zsm_vikas',
        BSM: 'bsm_anil',
        ASM: 'asm_sumit',
        CCO: 'cco_pooja',
      };
      const username = sampleUsernames[targetRoleCode] || 'admin';
      const res = await fetch(`/api/auth/me?username=${username}`);
      const json = await res.json();
      if (json.success && json.user) {
        setUser(json.user);
        sessionStorage.setItem('qs_user', JSON.stringify(json.user));
        setCurrentSection('dashboard');
      }
    } catch (e) {
      console.error('Role switch error:', e);
    }
  };

  if (!checkedAuth) {
    return <div className="min-h-screen bg-[#0f172a]" />;
  }

  if (!user) {
    return <LoginModal onSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  return (
    <div className="flex w-full min-h-screen bg-[#0f172a] text-[#f8fafc] overflow-x-hidden">
      {/* Sidebar Navigation with Dynamic RBAC & Mobile Slide-In Drawer */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        onLogout={handleLogout}
        currentUser={user}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 md:ml-64 flex flex-col min-h-screen max-w-full">
        {/* Mobile Sticky Header Bar */}
        <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-[#111c2e] border-b border-[#1e293b] shadow-md">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Open Navigation Drawer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <img
              src="/assets/quickserves-logo.png"
              alt="Quickserves Official Logo"
              className="h-6 w-auto max-w-[130px] object-contain select-none"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
              {user?.role || 'Admin'}
            </span>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-[11px] text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded border border-rose-500/20 font-medium transition cursor-pointer"
            >
              Exit
            </button>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <main className="flex-1 p-3 sm:p-5 md:p-8 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
          <Header user={user} onOpenMobileMenu={() => setMobileMenuOpen(true)} />


        {/* 1. Dynamic Role-Based Dashboard */}
        {visitedSections.has('dashboard') && (
          <div className={currentSection === 'dashboard' ? 'block' : 'hidden'}>
            <DashboardView currentUser={user} />
          </div>
        )}

        {/* 2. Master Category Views */}
        {visitedSections.has('branchMaster') && (
          <div className={currentSection === 'branchMaster' ? 'block' : 'hidden'}>
            <BranchMasterView currentUser={user} />
          </div>
        )}
        {visitedSections.has('roleMaster') && (
          <div className={currentSection === 'roleMaster' ? 'block' : 'hidden'}>
            <RoleMasterView currentUser={user} />
          </div>
        )}
        {visitedSections.has('franchiseMaster') && (
          <div className={currentSection === 'franchiseMaster' ? 'block' : 'hidden'}>
            <FranchiseMasterView currentUser={user} />
          </div>
        )}
        {visitedSections.has('freelancerMaster') && (
          <div className={currentSection === 'freelancerMaster' ? 'block' : 'hidden'}>
            <FreelanceMasterView currentUser={user} />
          </div>
        )}
        {visitedSections.has('technicianMaster') && (
          <div className={currentSection === 'technicianMaster' ? 'block' : 'hidden'}>
            <TechnicianMasterView currentUser={user} />
          </div>
        )}
        {visitedSections.has('clientMaster') && (
          <div className={currentSection === 'clientMaster' ? 'block' : 'hidden'}>
            <ClientMasterView currentUser={user} />
          </div>
        )}
        {visitedSections.has('brandMaster') && (
          <div className={currentSection === 'brandMaster' ? 'block' : 'hidden'}>
            <BrandMasterView />
          </div>
        )}
        {visitedSections.has('categoryMaster') && (
          <div className={currentSection === 'categoryMaster' ? 'block' : 'hidden'}>
            <CategoryMasterView currentUser={user} />
          </div>
        )}
        {visitedSections.has('productMaster') && (
          <div className={currentSection === 'productMaster' ? 'block' : 'hidden'}>
            <ProductMasterView />
          </div>
        )}
        {visitedSections.has('modelMaster') && (
          <div className={currentSection === 'modelMaster' ? 'block' : 'hidden'}>
            <ModelMasterView />
          </div>
        )}
        {visitedSections.has('symptomMaster') && (
          <div className={currentSection === 'symptomMaster' ? 'block' : 'hidden'}>
            <SymptomMasterView />
          </div>
        )}
        {visitedSections.has('causeMaster') && (
          <div className={currentSection === 'causeMaster' ? 'block' : 'hidden'}>
            <CauseMasterView />
          </div>
        )}
        {visitedSections.has('analysisMaster') && (
          <div className={currentSection === 'analysisMaster' ? 'block' : 'hidden'}>
            <AnalysisMasterView />
          </div>
        )}
        {visitedSections.has('sparesMaster') && (
          <div className={currentSection === 'sparesMaster' ? 'block' : 'hidden'}>
            <SparesMasterView />
          </div>
        )}
        {visitedSections.has('cityMaster') && (
          <div className={currentSection === 'cityMaster' ? 'block' : 'hidden'}>
            <DynamicMasterView
              type="cityMaster"
              title="City Master"
              subTitle="Operational regional hubs & service cities"
              nameLabel="City Name"
              categoryLabel="State"
              subTextLabel="Region Tier"
              field1Label="Pincode Range"
              field2Label="Active ASCs"
            />
          </div>
        )}
        {visitedSections.has('localityMaster') && (
          <div className={currentSection === 'localityMaster' ? 'block' : 'hidden'}>
            <DynamicMasterView
              type="localityMaster"
              title="Locality Master"
              subTitle="Locality and service territory boundaries"
              nameLabel="Locality Name"
              categoryLabel="City"
              subTextLabel="Key Landmarks"
              field1Label="Pincode"
              field2Label="Customer Density"
            />
          </div>
        )}
        {visitedSections.has('vendorMaster') && (
          <div className={currentSection === 'vendorMaster' ? 'block' : 'hidden'}>
            <VendorMasterView />
          </div>
        )}

        {/* 3. Mapping Views */}
        {visitedSections.has('brandMapping') && (
          <div className={currentSection === 'brandMapping' ? 'block' : 'hidden'}>
            <FranchiseBrandMappingView currentUser={user} />
          </div>
        )}
        {visitedSections.has('categoryMapping') && (
          <div className={currentSection === 'categoryMapping' ? 'block' : 'hidden'}>
            <FranchiseCategoryMappingView currentUser={user} />
          </div>
        )}
        {visitedSections.has('pincodeMapping') && (
          <div className={currentSection === 'pincodeMapping' ? 'block' : 'hidden'}>
            <FranchisePincodeMappingView currentUser={user} />
          </div>
        )}
        {visitedSections.has('warehouseMapping') && (
          <div className={currentSection === 'warehouseMapping' ? 'block' : 'hidden'}>
            <DynamicMasterView
              type="warehouseMapping"
              title="Warehouse Mapping"
              subTitle="Inventory hubs & distribution channels"
              nameLabel="Warehouse Name"
              categoryLabel="Distribution Channel"
              subTextLabel="Hub Route"
              field1Label="Storage Capacity"
              field2Label="Hub Manager"
            />
          </div>
        )}

        {/* 4. Call Management Views */}
        {CALL_MANAGEMENT_SECTIONS.includes(currentSection) && (
          <CallManagementView initialMode={currentSection} currentUser={user} />
        )}

        {/* 5. Master Data Download */}
        {visitedSections.has('download') && (
          <div className={currentSection === 'download' ? 'block' : 'hidden'}>
            <DownloadView />
          </div>
        )}

        {/* 6. Uploader Views */}
        {(currentSection === 'liveCallUpload' || currentSection === 'bulkExcelUpload') && (
          <UploaderView
            key={currentSection}
            initialMode={currentSection === 'bulkExcelUpload' ? 'bulkExcelUpload' : 'liveCallUpload'}
            currentUser={user}
          />
        )}

        {/* 7. Reports Views */}
        {visitedSections.has('reportMain') && (
          <div className={currentSection === 'reportMain' ? 'block' : 'hidden'}>
            <ReportsView />
          </div>
        )}

        {/* 8. Users & Role Master Views */}
        {(currentSection === 'createUser' || currentSection === 'updateUser') && (
          <UserManagementView initialMode={currentSection} currentUser={user} />
        )}

        {/* 9. Utilities & Settings Views */}
        {visitedSections.has('adminUtility') && (
          <div className={currentSection === 'adminUtility' ? 'block' : 'hidden'}>
            <DynamicMasterView
              type="adminUtility"
              title="System Configuration & Utilities"
              subTitle="Application parameters, SMS gateways & system rules"
              nameLabel="Setting Name"
              categoryLabel="Module"
              subTextLabel="Configuration Value"
              field1Label="Param Key"
              field2Label="Environment Scope"
            />
          </div>
        )}
        {visitedSections.has('changePassword') && (
          <div className={currentSection === 'changePassword' ? 'block' : 'hidden'}>
            <ChangePasswordView user={user} />
          </div>
        )}
        {visitedSections.has('nomenclatureManagement') && (
          <div className={currentSection === 'nomenclatureManagement' ? 'block' : 'hidden'}>
            <NomenclatureManagementView currentUser={user} />
          </div>
        )}
        </main>
      </div>
    </div>
  );
}

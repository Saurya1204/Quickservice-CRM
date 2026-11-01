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
    <div className="flex w-full min-h-screen bg-[#0f172a] text-[#f8fafc]">
      {/* Sidebar Navigation with Dynamic RBAC */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        onLogout={handleLogout}
        currentUser={user}
      />

      {/* Main Content Area */}
      <div className="ml-64 flex-1 min-w-0 p-8 space-y-6">
        <Header user={user} />


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
            <DynamicMasterView
              type="brandMapping"
              title="Brand Mapping"
              subTitle="Map brands to ASC & branch service networks"
              nameLabel="Brand Mapping Name"
              categoryLabel="Client"
              subTextLabel="Network Details"
              field1Label="Client Code"
              field2Label="ASC Coverage"
            />
          </div>
        )}
        {visitedSections.has('categoryMapping') && (
          <div className={currentSection === 'categoryMapping' ? 'block' : 'hidden'}>
            <CategoryMappingView />
          </div>
        )}
        {visitedSections.has('pincodeMapping') && (
          <div className={currentSection === 'pincodeMapping' ? 'block' : 'hidden'}>
            <DynamicMasterView
              type="pincodeMapping"
              title="Pincode Mapping"
              subTitle="Territorial routing & dispatch pincode mapping"
              nameLabel="Pincode / Territory"
              categoryLabel="Territory Name"
              subTextLabel="Branch / ASC Routing"
              field1Label="SLA Target"
              field2Label="Field Force Count"
            />
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
      </div>
    </div>
  );
}

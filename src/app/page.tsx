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

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [checkedAuth, setCheckedAuth] = useState(false);

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
      <div className="ml-64 flex-1 p-8 space-y-6">
        <Header user={user} />


        {/* 1. Dynamic Role-Based Dashboard */}
        {currentSection === 'dashboard' && <DashboardView currentUser={user} />}

        {/* 2. Master Category Views */}
        {currentSection === 'branchMaster' && <BranchMasterView currentUser={user} />}
        {currentSection === 'roleMaster' && <RoleMasterView currentUser={user} />}
        {currentSection === 'franchiseMaster' && <FranchiseMasterView currentUser={user} />}
        {currentSection === 'freelancerMaster' && <FreelanceMasterView />}
        {currentSection === 'technicianMaster' && <TechnicianMasterView />}
        {currentSection === 'clientMaster' && <ClientMasterView />}
        {currentSection === 'brandMaster' && <BrandMasterView />}
        {currentSection === 'categoryMaster' && <CategoryMasterView />}
        {currentSection === 'productMaster' && <ProductMasterView />}
        {currentSection === 'modelMaster' && <ModelMasterView />}
        {currentSection === 'symptomMaster' && <SymptomMasterView />}
        {currentSection === 'causeMaster' && <CauseMasterView />}
        {currentSection === 'analysisMaster' && <AnalysisMasterView />}
        {currentSection === 'sparesMaster' && <SparesMasterView />}
        {currentSection === 'cityMaster' && (
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
        )}
        {currentSection === 'localityMaster' && (
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
        )}
        {currentSection === 'vendorMaster' && <VendorMasterView />}

        {/* 3. Mapping Views */}
        {currentSection === 'brandMapping' && (
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
        )}
        {currentSection === 'categoryMapping' && <CategoryMappingView />}
        {currentSection === 'pincodeMapping' && (
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
        )}
        {currentSection === 'warehouseMapping' && (
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
        )}

        {/* 4. Call Management Views */}
        {[
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
        ].includes(currentSection) && (
          <CallManagementView initialMode={currentSection} currentUser={user} />
        )}

        {/* 5. Master Data Download */}
        {currentSection === 'download' && <DownloadView />}

        {/* 6. Uploader Views */}
        {(currentSection === 'liveCallUpload' || currentSection === 'bulkExcelUpload') && (
          <UploaderView
            key={currentSection}
            initialMode={currentSection === 'bulkExcelUpload' ? 'bulkExcelUpload' : 'liveCallUpload'}
            currentUser={user}
          />
        )}

        {/* 7. Reports Views */}
        {currentSection === 'reportMain' && <ReportsView />}

        {/* 8. Users & Role Master Views */}
        {(currentSection === 'createUser' || currentSection === 'updateUser') && (
          <UserManagementView initialMode={currentSection} currentUser={user} />
        )}

        {/* 9. Utilities & Settings Views */}
        {currentSection === 'adminUtility' && (
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
        )}
        {currentSection === 'changePassword' && <ChangePasswordView user={user} />}
        {currentSection === 'nomenclatureManagement' && (
          <NomenclatureManagementView currentUser={user} />
        )}
      </div>
    </div>
  );
}

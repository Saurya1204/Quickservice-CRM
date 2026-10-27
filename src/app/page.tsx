'use client';

import React, { useState, useEffect } from 'react';
import LoginModal from '@/components/LoginModal';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import DashboardView from '@/components/DashboardView';
import BranchMasterView from '@/components/BranchMasterView';
import FranchiseMasterView from '@/components/FranchiseMasterView';
import TechnicianMasterView from '@/components/TechnicianMasterView';
import ClientMasterView from '@/components/ClientMasterView';
import BrandMasterView from '@/components/BrandMasterView';
import CategoryMasterView from '@/components/CategoryMasterView';
import CategoryMappingView from '@/components/CategoryMappingView';
import DownloadView from '@/components/DownloadView';
import DynamicMasterView from '@/components/DynamicMasterView';
import CallManagementView from '@/components/CallManagementView';
import UserManagementView from '@/components/UserManagementView';
import UploaderView from '@/components/UploaderView';
import ReportsView from '@/components/ReportsView';
import ChangePasswordView from '@/components/ChangePasswordView';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('qs_user');
      if (stored) {
        setUser(JSON.parse(stored));
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

  if (!checkedAuth) {
    return <div className="min-h-screen bg-[#0f172a]" />;
  }

  if (!user) {
    return <LoginModal onSuccess={(loggedUser) => setUser(loggedUser)} />;
  }

  return (
    <div className="flex w-full min-h-screen bg-[#0f172a] text-[#f8fafc]">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="ml-64 flex-1 p-8 space-y-6">
        <Header user={user} />

        {/* 1. Dashboard */}
        {currentSection === 'dashboard' && <DashboardView />}

        {/* 2. Master Category Views */}
        {currentSection === 'branchMaster' && <BranchMasterView />}
        {currentSection === 'franchiseMaster' && <FranchiseMasterView />}
        {currentSection === 'freelancerMaster' && (
          <DynamicMasterView
            type="freelancerMaster"
            title="Freelancer Master"
            subTitle="Manage independent field technicians, skills & coverage"
            nameLabel="Freelancer Name"
            categoryLabel="Expertise / Skill"
            subTextLabel="Coverage Area"
            field1Label="Mobile No"
            field2Label="Base City"
          />
        )}
        {currentSection === 'technicianMaster' && <TechnicianMasterView />}
        {currentSection === 'clientMaster' && <ClientMasterView />}
        {currentSection === 'brandMaster' && <BrandMasterView />}
        {currentSection === 'categoryMaster' && <CategoryMasterView />}
        {currentSection === 'productMaster' && (
          <DynamicMasterView
            type="productMaster"
            title="Product Master"
            subTitle="Product lines & technical specifications"
            nameLabel="Product Name"
            categoryLabel="Category"
            subTextLabel="Technical Specification"
            field1Label="Brand"
            field2Label="Warranty (Months)"
          />
        )}
        {currentSection === 'modelMaster' && (
          <DynamicMasterView
            type="modelMaster"
            title="Model Master"
            subTitle="Model numbers and variations"
            nameLabel="Model Number"
            categoryLabel="Product Line"
            subTextLabel="Series / Color / Variant"
            field1Label="Brand"
            field2Label="Appliance Type"
          />
        )}
        {currentSection === 'symptomMaster' && (
          <DynamicMasterView
            type="symptomMaster"
            title="Symptom Master"
            subTitle="Fault symptoms & customer reporting indicators"
            nameLabel="Symptom Description"
            categoryLabel="Category"
            subTextLabel="Diagnostic Checks"
            field1Label="Severity Level"
            field2Label="Sub-system / Unit"
          />
        )}
        {currentSection === 'causeMaster' && (
          <DynamicMasterView
            type="causeMaster"
            title="Cause Master"
            subTitle="Technical root causes & diagnostics"
            nameLabel="Cause Description"
            categoryLabel="Category"
            subTextLabel="Failure Mode Details"
            field1Label="Root Component"
            field2Label="Symptom Code"
          />
        )}
        {currentSection === 'analysisMaster' && (
          <DynamicMasterView
            type="analysisMaster"
            title="Analysis Master"
            subTitle="SOP & repair action plans"
            nameLabel="Repair SOP / Action"
            categoryLabel="Category"
            subTextLabel="Procedure Details"
            field1Label="Standard SLA"
            field2Label="Cause Code"
          />
        )}
        {currentSection === 'sparesMaster' && (
          <DynamicMasterView
            type="sparesMaster"
            title="Spares Master"
            subTitle="Spare parts catalogue, inventory & valuation"
            nameLabel="Part Name"
            categoryLabel="Part Category"
            subTextLabel="OEM Part Number"
            field1Label="Unit Price (₹)"
            field2Label="Current Stock"
          />
        )}
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
        {currentSection === 'vendorMaster' && (
          <DynamicMasterView
            type="vendorMaster"
            title="Vendor Master"
            subTitle="Spares suppliers & parts procurement partners"
            nameLabel="Vendor / Firm Name"
            categoryLabel="Supply Category"
            subTextLabel="Office Address"
            field1Label="GST Number"
            field2Label="Contact Phone"
          />
        )}

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
        ].includes(currentSection) && <CallManagementView initialMode={currentSection} />}

        {/* 5. Master Data Download */}
        {currentSection === 'download' && <DownloadView />}

        {/* 6. Uploader Views */}
        {(currentSection === 'liveCallUpload' || currentSection === 'bulkExcelUpload') && <UploaderView />}

        {/* 7. Reports Views */}
        {currentSection === 'reportMain' && <ReportsView />}

        {/* 8. Users Views */}
        {(currentSection === 'createUser' || currentSection === 'updateUser') && (
          <UserManagementView initialMode={currentSection} />
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
      </div>
    </div>
  );
}

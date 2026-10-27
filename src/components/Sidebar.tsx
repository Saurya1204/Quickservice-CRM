'use client';

import React, { useState, useEffect } from 'react';

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentSection, onSelectSection, onLogout }: SidebarProps) {
  // Start with all menus collapsed so all 9 sections are immediately visible as in Screenshot 1
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    master: false,
    mapping: false,
    call: false,
    masterData: false,
    uploader: false,
    reports: false,
    users: false,
    utilities: false,
  });

  // Automatically keep parent menu open if a child section is selected
  useEffect(() => {
    if (
      [
        'branchMaster',
        'franchiseMaster',
        'freelancerMaster',
        'technicianMaster',
        'clientMaster',
        'brandMaster',
        'categoryMaster',
        'productMaster',
        'modelMaster',
        'symptomMaster',
        'causeMaster',
        'analysisMaster',
        'sparesMaster',
        'cityMaster',
        'localityMaster',
        'vendorMaster',
      ].includes(currentSection)
    ) {
      setOpenMenus((prev) => ({ ...prev, master: true }));
    } else if (['brandMapping', 'categoryMapping', 'pincodeMapping', 'warehouseMapping'].includes(currentSection)) {
      setOpenMenus((prev) => ({ ...prev, mapping: true }));
    } else if (
      [
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
      ].includes(currentSection)
    ) {
      setOpenMenus((prev) => ({ ...prev, call: true }));
    } else if (['download'].includes(currentSection)) {
      setOpenMenus((prev) => ({ ...prev, masterData: true }));
    } else if (['liveCallUpload', 'bulkExcelUpload'].includes(currentSection)) {
      setOpenMenus((prev) => ({ ...prev, uploader: true }));
    } else if (['reportMain'].includes(currentSection)) {
      setOpenMenus((prev) => ({ ...prev, reports: true }));
    } else if (['createUser', 'updateUser'].includes(currentSection)) {
      setOpenMenus((prev) => ({ ...prev, users: true }));
    } else if (['adminUtility', 'changePassword'].includes(currentSection)) {
      setOpenMenus((prev) => ({ ...prev, utilities: true }));
    }
  }, [currentSection]);

  // Accordion toggle: toggles clicked menu and closes others to keep sidebar tidy
  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => {
      const isOpen = !prev[key];
      return {
        master: false,
        mapping: false,
        call: false,
        masterData: false,
        uploader: false,
        reports: false,
        users: false,
        utilities: false,
        [key]: isOpen,
      };
    });
  };

  const isCurrent = (sec: string) => currentSection === sec;

  const itemClass = (sec: string) =>
    `w-full text-left block pl-6 pr-3 py-2 text-xs transition duration-150 ${
      isCurrent(sec)
        ? 'bg-[#1e2a3e] text-white font-medium border-l-2 border-emerald-400 pl-5.5'
        : 'text-slate-300 hover:text-white hover:bg-[#1a2538]'
    }`;

  const headerButtonClass = (isActive: boolean) =>
    `w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition select-none ${
      isActive
        ? 'bg-[#182335] text-white font-semibold'
        : 'text-slate-200 hover:bg-[#182335]/70'
    }`;

  return (
    <div className="w-64 bg-[#111c2e] border-r border-[#1e293b] h-screen fixed left-0 top-0 overflow-y-auto z-20 flex flex-col justify-between select-none">
      <div>
        {/* Logo Header matching Screenshot 1 */}
        <div className="p-4 bg-[#0d1624] border-b border-[#1e293b] flex items-center justify-between">
          <span className="text-[#10b981] font-extrabold text-lg tracking-wider">QUICKSERVES</span>
          <button
            onClick={onLogout}
            title="Logout"
            className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 font-medium transition"
          >
            Logout
          </button>
        </div>

        <nav className="divide-y divide-[#1e293b]/70">
          {/* 1. Admin Dashboard */}
          <div>
            <button
              onClick={() => onSelectSection('dashboard')}
              className={headerButtonClass(currentSection === 'dashboard')}
            >
              <span>Admin Dashboard</span>
            </button>
          </div>

          {/* 2. Master Dropdown */}
          <div>
            <button onClick={() => toggleMenu('master')} className={headerButtonClass(openMenus.master)}>
              <span>Master</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.master && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('branchMaster')} className={itemClass('branchMaster')}>
                  Branch Master
                </button>
                <button onClick={() => onSelectSection('franchiseMaster')} className={itemClass('franchiseMaster')}>
                  Franchise Master
                </button>
                <button onClick={() => onSelectSection('freelancerMaster')} className={itemClass('freelancerMaster')}>
                  Freelancer Master
                </button>
                <button onClick={() => onSelectSection('technicianMaster')} className={itemClass('technicianMaster')}>
                  Technician Master
                </button>
                <button onClick={() => onSelectSection('clientMaster')} className={itemClass('clientMaster')}>
                  Client Master
                </button>
                <button onClick={() => onSelectSection('brandMaster')} className={itemClass('brandMaster')}>
                  Brand Master
                </button>
                <button onClick={() => onSelectSection('categoryMaster')} className={itemClass('categoryMaster')}>
                  Category Master
                </button>
                <button onClick={() => onSelectSection('productMaster')} className={itemClass('productMaster')}>
                  Product Master
                </button>
                <button onClick={() => onSelectSection('modelMaster')} className={itemClass('modelMaster')}>
                  Model Master
                </button>
                <button onClick={() => onSelectSection('symptomMaster')} className={itemClass('symptomMaster')}>
                  Symptom Master
                </button>
                <button onClick={() => onSelectSection('causeMaster')} className={itemClass('causeMaster')}>
                  Cause Master
                </button>
                <button onClick={() => onSelectSection('analysisMaster')} className={itemClass('analysisMaster')}>
                  Analysis Master
                </button>
                <button onClick={() => onSelectSection('sparesMaster')} className={itemClass('sparesMaster')}>
                  Spares Master
                </button>
                <button onClick={() => onSelectSection('cityMaster')} className={itemClass('cityMaster')}>
                  City Master
                </button>
                <button onClick={() => onSelectSection('localityMaster')} className={itemClass('localityMaster')}>
                  Locality Master
                </button>
                <button onClick={() => onSelectSection('vendorMaster')} className={itemClass('vendorMaster')}>
                  Vendor Master
                </button>
              </div>
            )}
          </div>

          {/* 3. Mapping Dropdown */}
          <div>
            <button onClick={() => toggleMenu('mapping')} className={headerButtonClass(openMenus.mapping)}>
              <span>Mapping</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.mapping && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('brandMapping')} className={itemClass('brandMapping')}>
                  Brand Mapping
                </button>
                <button onClick={() => onSelectSection('categoryMapping')} className={itemClass('categoryMapping')}>
                  Category Mapping
                </button>
                <button onClick={() => onSelectSection('pincodeMapping')} className={itemClass('pincodeMapping')}>
                  Pincode Mapping
                </button>
                <button onClick={() => onSelectSection('warehouseMapping')} className={itemClass('warehouseMapping')}>
                  Warehouse Mapping
                </button>
              </div>
            )}
          </div>

          {/* 4. Call Management Dropdown */}
          <div>
            <button onClick={() => toggleMenu('call')} className={headerButtonClass(openMenus.call)}>
              <span>Call Management</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.call && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('callRegistration')} className={itemClass('callRegistration')}>
                  Call Registration
                </button>
                <button onClick={() => onSelectSection('callView')} className={itemClass('callView')}>
                  Call View
                </button>
                <button onClick={() => onSelectSection('callEdit')} className={itemClass('callEdit')}>
                  Call Edit
                </button>
                <button onClick={() => onSelectSection('callReminder')} className={itemClass('callReminder')}>
                  Call Reminder
                </button>
                <button onClick={() => onSelectSection('callAppointment')} className={itemClass('callAppointment')}>
                  Call Appointment
                </button>
                <button onClick={() => onSelectSection('callReschedule')} className={itemClass('callReschedule')}>
                  Call Reschedule
                </button>
                <button onClick={() => onSelectSection('callTransfer')} className={itemClass('callTransfer')}>
                  Call Transfer
                </button>
                <button onClick={() => onSelectSection('callReopen')} className={itemClass('callReopen')}>
                  Call Reopen
                </button>
                <button onClick={() => onSelectSection('callCancel')} className={itemClass('callCancel')}>
                  Call Cancel
                </button>
                <button onClick={() => onSelectSection('callFeedback')} className={itemClass('callFeedback')}>
                  Call FeedBack
                </button>
                <button onClick={() => onSelectSection('callUpdate')} className={itemClass('callUpdate')}>
                  Call Update
                </button>
                <button onClick={() => onSelectSection('callAllotment')} className={itemClass('callAllotment')}>
                  Call Allotment
                </button>
                <button onClick={() => onSelectSection('jobsheetPrint')} className={itemClass('jobsheetPrint')}>
                  Jobsheet Print
                </button>
                <button onClick={() => onSelectSection('directCancel')} className={itemClass('directCancel')}>
                  Direct Cancel
                </button>
                <button onClick={() => onSelectSection('directCancelPo')} className={itemClass('directCancelPo')}>
                  Direct Cancel PO
                </button>
                <button onClick={() => onSelectSection('updateSerialNo')} className={itemClass('updateSerialNo')}>
                  Update Serial No.
                </button>
                <button onClick={() => onSelectSection('callAudit')} className={itemClass('callAudit')}>
                  Call Audit
                </button>
              </div>
            )}
          </div>

          {/* 5. Master Data Dropdown */}
          <div>
            <button onClick={() => toggleMenu('masterData')} className={headerButtonClass(openMenus.masterData)}>
              <span>Master Data</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.masterData && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('download')} className={itemClass('download')}>
                  Master Data Download
                </button>
              </div>
            )}
          </div>

          {/* 6. Uploader Dropdown */}
          <div>
            <button onClick={() => toggleMenu('uploader')} className={headerButtonClass(openMenus.uploader)}>
              <span>Uploader</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.uploader && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('liveCallUpload')} className={itemClass('liveCallUpload')}>
                  Live Call Upload
                </button>
                <button onClick={() => onSelectSection('bulkExcelUpload')} className={itemClass('bulkExcelUpload')}>
                  Bulk Excel Upload
                </button>
              </div>
            )}
          </div>

          {/* 7. Reports Dropdown */}
          <div>
            <button onClick={() => toggleMenu('reports')} className={headerButtonClass(openMenus.reports)}>
              <span>Reports</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.reports && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('reportMain')} className={itemClass('reportMain')}>
                  Report Main
                </button>
              </div>
            )}
          </div>

          {/* 8. Users Dropdown */}
          <div>
            <button onClick={() => toggleMenu('users')} className={headerButtonClass(openMenus.users)}>
              <span>Users</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.users && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('createUser')} className={itemClass('createUser')}>
                  Create User
                </button>
                <button onClick={() => onSelectSection('updateUser')} className={itemClass('updateUser')}>
                  Update User
                </button>
              </div>
            )}
          </div>

          {/* 9. Utilities & Settings Dropdown */}
          <div>
            <button onClick={() => toggleMenu('utilities')} className={headerButtonClass(openMenus.utilities)}>
              <span>Utilities & Settings</span>
              <span className="text-[11px] text-white font-bold">▼</span>
            </button>
            {openMenus.utilities && (
              <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                <button onClick={() => onSelectSection('adminUtility')} className={itemClass('adminUtility')}>
                  Admin Utility
                </button>
                <button onClick={() => onSelectSection('changePassword')} className={itemClass('changePassword')}>
                  Change Password
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Clean Bottom Label */}
      <div className="p-3 bg-[#0d1624] border-t border-[#1e293b] text-[11px] text-slate-400 text-center">
        Authorized Personnel Only • Quickserves OS
      </div>
    </div>
  );
}

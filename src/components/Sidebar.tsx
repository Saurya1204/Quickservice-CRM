'use client';

import React, { useState, useEffect } from 'react';

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
  currentUser?: any;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentSection,
  onSelectSection,
  onLogout,
  currentUser,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const handleItemClick = (sec: string) => {
    onSelectSection(sec);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };
  // Determine role and super admin status
  const roleCode = (currentUser?.roleCode || currentUser?.role || 'SUPER_ADMIN')
    .toUpperCase()
    .replace(/\s+/g, '_');
  const isSuperAdmin = roleCode === 'SUPER_ADMIN' || currentUser?.role === 'Super Admin';

  const canAccess = (moduleKey: string, subSectionKey?: string): boolean => {
    if (isSuperAdmin) return true;
    if (!currentUser || !currentUser.permissions || !Array.isArray(currentUser.permissions)) {
      return true;
    }

    const perm = currentUser.permissions.find((p: any) => p.module === moduleKey);
    if (!perm || perm.accessLevel === 'NO_ACCESS') return false;

    if (subSectionKey && perm.subSections) {
      const subVal =
        perm.subSections instanceof Map
          ? perm.subSections.get(subSectionKey)
          : perm.subSections[subSectionKey];
      if (subVal === false) return false;
    }

    return perm.actions?.read !== false;
  };

  const hasMasterAccess =
    canAccess('roleMaster') ||
    canAccess('branchMaster') ||
    canAccess('franchiseMaster') ||
    canAccess('technicianMaster') ||
    canAccess('clientMaster') ||
    canAccess('brandMaster') ||
    canAccess('categoryMaster') ||
    canAccess('otherMasters');

  const hasMappingAccess = canAccess('mapping');
  const hasCallAccess = canAccess('callManagement');
  const hasMasterDataAccess = canAccess('masterData');
  const hasUploaderAccess = canAccess('uploader');
  const hasReportsAccess = canAccess('reports');
  const hasUsersAccess = canAccess('users');
  const hasUtilitiesAccess = canAccess('utilities');

  // Accordion open/close state
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
        'roleMaster',
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
    } else if (['adminUtility', 'changePassword', 'nomenclatureManagement'].includes(currentSection)) {
      setOpenMenus((prev) => ({ ...prev, utilities: true }));
    }
  }, [currentSection]);

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
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed on Desktop, Slide-In Drawer on Mobile */}
      <div
        className={`w-64 max-w-[85vw] bg-[#111c2e] border-r border-[#1e293b] h-screen fixed left-0 top-0 overflow-y-auto z-50 md:z-20 flex flex-col justify-between select-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Top of Sidebar: 1. Official Quickserves Logo */}
          <div className="p-4 bg-[#0d1624] border-b border-[#1e293b]">
            <div className="flex items-center justify-between mb-3">
              <img
                src="/assets/quickserves-logo.png"
                alt="Quickserves Official Logo"
                className="h-7 sm:h-8 w-auto max-w-[150px] object-contain select-none"
              />
              {onCloseMobile && (
                <button
                  onClick={onCloseMobile}
                  className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-sm flex items-center justify-center min-w-[32px] min-h-[32px]"
                  aria-label="Close navigation drawer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 2. Super Administrator profile & 3. Logout option */}
            <div className="pt-2.5 border-t border-[#1e293b]/80 flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-slate-200 font-bold truncate">
                  {currentUser?.fullName || currentUser?.username || 'Super Administrator'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium">
                  {currentUser?.role || 'Super Admin'}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded border border-rose-500/20 font-medium transition cursor-pointer whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>

        <nav className="divide-y divide-[#1e293b]/70">
          {/* 1. Dashboard */}
          <div>
            <button
              onClick={() => handleItemClick('dashboard')}
              className={headerButtonClass(currentSection === 'dashboard')}
            >
              <span>{isSuperAdmin ? 'Admin Dashboard' : 'User Dashboard'}</span>
            </button>
          </div>

          {/* 2. Master Dropdown */}
          {hasMasterAccess && (
            <div>
              <button onClick={() => toggleMenu('master')} className={headerButtonClass(openMenus.master)}>
                <span>Master</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.master && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  {canAccess('roleMaster') && (
                    <button
                      onClick={() => handleItemClick('roleMaster')}
                      className={`${itemClass('roleMaster')} text-emerald-400 font-semibold flex items-center justify-between`}
                    >
                      <span>Role Master</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">RBAC</span>
                    </button>
                  )}
                  {canAccess('branchMaster') && (
                    <button onClick={() => handleItemClick('branchMaster')} className={itemClass('branchMaster')}>
                      Branch Master
                    </button>
                  )}
                  {canAccess('franchiseMaster') && (
                    <button onClick={() => handleItemClick('franchiseMaster')} className={itemClass('franchiseMaster')}>
                      Franchise Master
                    </button>
                  )}
                  {canAccess('otherMasters') && (
                    <button onClick={() => handleItemClick('freelancerMaster')} className={itemClass('freelancerMaster')}>
                      Freelancer Master
                    </button>
                  )}
                  {canAccess('technicianMaster') && (
                    <button onClick={() => handleItemClick('technicianMaster')} className={itemClass('technicianMaster')}>
                      Technician Master
                    </button>
                  )}
                  {canAccess('clientMaster') && (
                    <button onClick={() => handleItemClick('clientMaster')} className={itemClass('clientMaster')}>
                      Client Master
                    </button>
                  )}
                  {canAccess('brandMaster') && (
                    <button onClick={() => handleItemClick('brandMaster')} className={itemClass('brandMaster')}>
                      Brand Master
                    </button>
                  )}
                  {canAccess('categoryMaster') && (
                    <button onClick={() => handleItemClick('categoryMaster')} className={itemClass('categoryMaster')}>
                      Category Master
                    </button>
                  )}
                  {canAccess('otherMasters') && (
                    <>
                      <button onClick={() => handleItemClick('productMaster')} className={itemClass('productMaster')}>
                        Product Master
                      </button>
                      <button onClick={() => handleItemClick('modelMaster')} className={itemClass('modelMaster')}>
                        Model Master
                      </button>
                      <button onClick={() => handleItemClick('symptomMaster')} className={itemClass('symptomMaster')}>
                        Symptom Master
                      </button>
                      <button onClick={() => handleItemClick('causeMaster')} className={itemClass('causeMaster')}>
                        Cause Master
                      </button>
                      <button onClick={() => handleItemClick('analysisMaster')} className={itemClass('analysisMaster')}>
                        Analysis Master
                      </button>
                      <button onClick={() => handleItemClick('sparesMaster')} className={itemClass('sparesMaster')}>
                        Spares Master
                      </button>
                      <button onClick={() => handleItemClick('cityMaster')} className={itemClass('cityMaster')}>
                        City Master
                      </button>
                      <button onClick={() => handleItemClick('localityMaster')} className={itemClass('localityMaster')}>
                        Locality Master
                      </button>
                      <button onClick={() => handleItemClick('vendorMaster')} className={itemClass('vendorMaster')}>
                        Vendor Master
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. Mapping Dropdown */}
          {hasMappingAccess && (
            <div>
              <button onClick={() => toggleMenu('mapping')} className={headerButtonClass(openMenus.mapping)}>
                <span>Mapping</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.mapping && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  <button onClick={() => handleItemClick('brandMapping')} className={itemClass('brandMapping')}>
                    Franchise Brand Mapping
                  </button>
                  <button onClick={() => handleItemClick('categoryMapping')} className={itemClass('categoryMapping')}>
                    Franchise Category Mapping
                  </button>
                  <button onClick={() => handleItemClick('pincodeMapping')} className={itemClass('pincodeMapping')}>
                    Franchise Pincode Mapping
                  </button>
                  <button onClick={() => handleItemClick('warehouseMapping')} className={itemClass('warehouseMapping')}>
                    Warehouse Mapping
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. Call Management Dropdown */}
          {hasCallAccess && (
            <div>
              <button onClick={() => toggleMenu('call')} className={headerButtonClass(openMenus.call)}>
                <span>Call Management</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.call && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  {canAccess('callManagement', 'callRegistration') && (
                    <button onClick={() => handleItemClick('callRegistration')} className={itemClass('callRegistration')}>
                      Call Registration
                    </button>
                  )}
                  {canAccess('callManagement', 'callView') && (
                    <button onClick={() => handleItemClick('callView')} className={itemClass('callView')}>
                      Call View
                    </button>
                  )}
                  {canAccess('callManagement', 'callEdit') && (
                    <button onClick={() => handleItemClick('callEdit')} className={itemClass('callEdit')}>
                      Call Edit
                    </button>
                  )}
                  {canAccess('callManagement', 'callReminder') && (
                    <button onClick={() => handleItemClick('callReminder')} className={itemClass('callReminder')}>
                      Call Reminder
                    </button>
                  )}
                  {canAccess('callManagement', 'callAppointment') && (
                    <button onClick={() => handleItemClick('callAppointment')} className={itemClass('callAppointment')}>
                      Call Appointment
                    </button>
                  )}
                  {canAccess('callManagement', 'callReschedule') && (
                    <button onClick={() => handleItemClick('callReschedule')} className={itemClass('callReschedule')}>
                      Call Reschedule
                    </button>
                  )}
                  {canAccess('callManagement', 'callTransfer') && (
                    <button onClick={() => handleItemClick('callTransfer')} className={itemClass('callTransfer')}>
                      Call Transfer
                    </button>
                  )}
                  {/* Reopen Call MenuItem */}
                  {canAccess('callManagement', 'callReopen') && (
                    <button
                      onClick={() => handleItemClick('callReopen')}
                      className={`${itemClass('callReopen')} text-amber-300 font-semibold`}
                    >
                      🔄 Reopen Call
                    </button>
                  )}
                  {canAccess('callManagement', 'callCancel') && (
                    <button onClick={() => handleItemClick('callCancel')} className={itemClass('callCancel')}>
                      Call Cancel
                    </button>
                  )}
                  {canAccess('callManagement', 'callFeedback') && (
                    <button onClick={() => handleItemClick('callFeedback')} className={itemClass('callFeedback')}>
                      Call FeedBack
                    </button>
                  )}
                  {canAccess('callManagement', 'callUpdate') && (
                    <button onClick={() => handleItemClick('callUpdate')} className={itemClass('callUpdate')}>
                      Call Update
                    </button>
                  )}
                  {canAccess('callManagement', 'callAllotment') && (
                    <button onClick={() => handleItemClick('callAllotment')} className={itemClass('callAllotment')}>
                      Call Allotment
                    </button>
                  )}
                  {canAccess('callManagement', 'jobsheetPrint') && (
                    <button onClick={() => handleItemClick('jobsheetPrint')} className={itemClass('jobsheetPrint')}>
                      Jobsheet Print
                    </button>
                  )}
                  {canAccess('callManagement', 'callAudit') && (
                    <button onClick={() => handleItemClick('callAudit')} className={itemClass('callAudit')}>
                      Call Audit
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Master Data Dropdown */}
          {hasMasterDataAccess && (
            <div>
              <button onClick={() => toggleMenu('masterData')} className={headerButtonClass(openMenus.masterData)}>
                <span>Master Data</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.masterData && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  <button onClick={() => handleItemClick('download')} className={itemClass('download')}>
                    Master Data Download
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 6. Uploader Dropdown */}
          {hasUploaderAccess && (
            <div>
              <button onClick={() => toggleMenu('uploader')} className={headerButtonClass(openMenus.uploader)}>
                <span>Uploader</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.uploader && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  <button onClick={() => handleItemClick('liveCallUpload')} className={itemClass('liveCallUpload')}>
                    Live Call Upload
                  </button>
                  <button onClick={() => handleItemClick('bulkExcelUpload')} className={itemClass('bulkExcelUpload')}>
                    Bulk Excel Upload
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 7. Reports Dropdown */}
          {hasReportsAccess && (
            <div>
              <button onClick={() => toggleMenu('reports')} className={headerButtonClass(openMenus.reports)}>
                <span>Reports</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.reports && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  <button onClick={() => handleItemClick('reportMain')} className={itemClass('reportMain')}>
                    Report Main
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 8. User Management Dropdown */}
          {hasUsersAccess && (
            <div>
              <button onClick={() => toggleMenu('users')} className={headerButtonClass(openMenus.users)}>
                <span>User Management</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.users && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  <button onClick={() => handleItemClick('createUser')} className={itemClass('createUser')}>
                    Create User
                  </button>
                  <button onClick={() => handleItemClick('updateUser')} className={itemClass('updateUser')}>
                    Update User
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 9. Utilities & Settings Dropdown */}
          {hasUtilitiesAccess && (
            <div>
              <button onClick={() => toggleMenu('utilities')} className={headerButtonClass(openMenus.utilities)}>
                <span>Utilities & Settings</span>
                <span className="text-[11px] text-white font-bold">▼</span>
              </button>
              {openMenus.utilities && (
                <div className="bg-[#0b1320] py-1 border-t border-[#1e293b]/50">
                  <button onClick={() => handleItemClick('adminUtility')} className={itemClass('adminUtility')}>
                    Admin Utility
                  </button>
                  <button onClick={() => handleItemClick('changePassword')} className={itemClass('changePassword')}>
                    Change Password
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleItemClick('nomenclatureManagement')}
                      className={`${itemClass('nomenclatureManagement')} text-emerald-300 font-semibold`}
                    >
                      ⚙️ Nomenclature Management
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Label */}
      <div className="p-3 bg-[#0d1624] border-t border-[#1e293b] text-[11px] text-slate-400 text-center">
        Authorized Personnel Only • Quickserves OS
      </div>
    </div>
  </>
);
}

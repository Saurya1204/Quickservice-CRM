'use client';

import React, { useState, useEffect } from 'react';

interface SidebarProps {
  currentSection: string;
  onSelectSection: (section: string) => void;
  onLogout: () => void;
  currentUser?: any;
}

export default function Sidebar({
  currentSection,
  onSelectSection,
  onLogout,
  currentUser,
}: SidebarProps) {
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
    <div className="w-64 bg-[#111c2e] border-r border-[#1e293b] h-screen fixed left-0 top-0 overflow-y-auto z-20 flex flex-col justify-between select-none">
      <div>
        {/* Logo Header */}
        <div className="p-4 bg-[#0d1624] border-b border-[#1e293b]">
          <div className="flex items-center justify-between">
            <span className="text-[#10b981] font-extrabold text-lg tracking-wider">QUICKSERVES</span>
            <button
              onClick={onLogout}
              title="Logout"
              className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-medium transition"
            >
              Logout
            </button>
          </div>
          {currentUser && (
            <div className="mt-2 pt-2 border-t border-[#1e293b]/70 flex items-center justify-between">
              <span className="text-[11px] text-slate-300 font-medium truncate max-w-[120px]">
                {currentUser.fullName || currentUser.username}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono font-semibold">
                {currentUser.role || 'Super Admin'}
              </span>
            </div>
          )}
        </div>

        <nav className="divide-y divide-[#1e293b]/70">
          {/* 1. Dashboard */}
          <div>
            <button
              onClick={() => onSelectSection('dashboard')}
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
                      onClick={() => onSelectSection('roleMaster')}
                      className={`${itemClass('roleMaster')} text-emerald-400 font-semibold flex items-center justify-between`}
                    >
                      <span>Role Master</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">RBAC</span>
                    </button>
                  )}
                  {canAccess('branchMaster') && (
                    <button onClick={() => onSelectSection('branchMaster')} className={itemClass('branchMaster')}>
                      Branch Master
                    </button>
                  )}
                  {canAccess('franchiseMaster') && (
                    <button onClick={() => onSelectSection('franchiseMaster')} className={itemClass('franchiseMaster')}>
                      Franchise Master
                    </button>
                  )}
                  {canAccess('otherMasters') && (
                    <button onClick={() => onSelectSection('freelancerMaster')} className={itemClass('freelancerMaster')}>
                      Freelancer Master
                    </button>
                  )}
                  {canAccess('technicianMaster') && (
                    <button onClick={() => onSelectSection('technicianMaster')} className={itemClass('technicianMaster')}>
                      Technician Master
                    </button>
                  )}
                  {canAccess('clientMaster') && (
                    <button onClick={() => onSelectSection('clientMaster')} className={itemClass('clientMaster')}>
                      Client Master
                    </button>
                  )}
                  {canAccess('brandMaster') && (
                    <button onClick={() => onSelectSection('brandMaster')} className={itemClass('brandMaster')}>
                      Brand Master
                    </button>
                  )}
                  {canAccess('categoryMaster') && (
                    <button onClick={() => onSelectSection('categoryMaster')} className={itemClass('categoryMaster')}>
                      Category Master
                    </button>
                  )}
                  {canAccess('otherMasters') && (
                    <>
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
                    <button onClick={() => onSelectSection('callRegistration')} className={itemClass('callRegistration')}>
                      Call Registration
                    </button>
                  )}
                  {canAccess('callManagement', 'callView') && (
                    <button onClick={() => onSelectSection('callView')} className={itemClass('callView')}>
                      Call View
                    </button>
                  )}
                  {canAccess('callManagement', 'callEdit') && (
                    <button onClick={() => onSelectSection('callEdit')} className={itemClass('callEdit')}>
                      Call Edit
                    </button>
                  )}
                  {canAccess('callManagement', 'callReminder') && (
                    <button onClick={() => onSelectSection('callReminder')} className={itemClass('callReminder')}>
                      Call Reminder
                    </button>
                  )}
                  {canAccess('callManagement', 'callAppointment') && (
                    <button onClick={() => onSelectSection('callAppointment')} className={itemClass('callAppointment')}>
                      Call Appointment
                    </button>
                  )}
                  {canAccess('callManagement', 'callReschedule') && (
                    <button onClick={() => onSelectSection('callReschedule')} className={itemClass('callReschedule')}>
                      Call Reschedule
                    </button>
                  )}
                  {canAccess('callManagement', 'callTransfer') && (
                    <button onClick={() => onSelectSection('callTransfer')} className={itemClass('callTransfer')}>
                      Call Transfer
                    </button>
                  )}
                  {/* Reopen Call MenuItem */}
                  {canAccess('callManagement', 'callReopen') && (
                    <button
                      onClick={() => onSelectSection('callReopen')}
                      className={`${itemClass('callReopen')} text-amber-300 font-semibold`}
                    >
                      🔄 Reopen Call
                    </button>
                  )}
                  {canAccess('callManagement', 'callCancel') && (
                    <button onClick={() => onSelectSection('callCancel')} className={itemClass('callCancel')}>
                      Call Cancel
                    </button>
                  )}
                  {canAccess('callManagement', 'callFeedback') && (
                    <button onClick={() => onSelectSection('callFeedback')} className={itemClass('callFeedback')}>
                      Call FeedBack
                    </button>
                  )}
                  {canAccess('callManagement', 'callUpdate') && (
                    <button onClick={() => onSelectSection('callUpdate')} className={itemClass('callUpdate')}>
                      Call Update
                    </button>
                  )}
                  {canAccess('callManagement', 'callAllotment') && (
                    <button onClick={() => onSelectSection('callAllotment')} className={itemClass('callAllotment')}>
                      Call Allotment
                    </button>
                  )}
                  {canAccess('callManagement', 'jobsheetPrint') && (
                    <button onClick={() => onSelectSection('jobsheetPrint')} className={itemClass('jobsheetPrint')}>
                      Jobsheet Print
                    </button>
                  )}
                  {canAccess('callManagement', 'callAudit') && (
                    <button onClick={() => onSelectSection('callAudit')} className={itemClass('callAudit')}>
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
                  <button onClick={() => onSelectSection('download')} className={itemClass('download')}>
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
                  <button onClick={() => onSelectSection('liveCallUpload')} className={itemClass('liveCallUpload')}>
                    Live Call Upload
                  </button>
                  <button onClick={() => onSelectSection('bulkExcelUpload')} className={itemClass('bulkExcelUpload')}>
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
                  <button onClick={() => onSelectSection('reportMain')} className={itemClass('reportMain')}>
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
                  <button onClick={() => onSelectSection('createUser')} className={itemClass('createUser')}>
                    Create User
                  </button>
                  <button onClick={() => onSelectSection('updateUser')} className={itemClass('updateUser')}>
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
                  <button onClick={() => onSelectSection('adminUtility')} className={itemClass('adminUtility')}>
                    Admin Utility
                  </button>
                  <button onClick={() => onSelectSection('changePassword')} className={itemClass('changePassword')}>
                    Change Password
                  </button>
                  {isSuperAdmin && (
                    <button
                      onClick={() => onSelectSection('nomenclatureManagement')}
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
  );
}

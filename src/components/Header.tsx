'use client';

import React from 'react';

interface HeaderProps {
  user: any;
  onOpenMobileMenu?: () => void;
}

export default function Header({ user, onOpenMobileMenu }: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-[#1e293b] p-3.5 sm:p-4 rounded-xl border border-[#334155] shadow-lg mb-4 sm:mb-6">
      <div className="w-full sm:w-auto">
        <h1 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
          <span>{user?.fullName || 'Super Administrator'}</span>
          <span className="text-[11px] sm:text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
            {user?.role || 'Super Admin'}
          </span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
          Organizational Scope:{' '}
          <span className="text-slate-300">
            {user?.assignedZone && user.assignedZone !== 'All'
              ? `Zone: ${user.assignedZone}`
              : 'Pan-India (All Zones)'}
            {user?.assignedBranch ? ` • Branch: ${user.assignedBranch}` : ''}
            {user?.assignedArea ? ` • Area: ${user.assignedArea}` : ''}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#334155]/60">
        <span className="bg-emerald-500/10 text-emerald-400 text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-full border border-emerald-500/20 font-medium flex items-center space-x-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>RBAC Active • Online</span>
        </span>
        <div className="text-right">
          <p className="text-xs sm:text-sm font-semibold text-white whitespace-nowrap">Quickserves CRM</p>
          <p className="text-[10px] sm:text-xs text-slate-400 font-mono">OS v2.4 Enterprise</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';

interface HeaderProps {
  user: any;
}

export default function Header({ user }: HeaderProps) {
  return (
    <div className="flex justify-between items-center bg-[#1e293b] p-4 rounded-xl border border-[#334155] shadow-lg mb-6">
      <div>
        <h1 className="text-xl font-bold text-white">Super Admin Control Center</h1>
        <p className="text-xs text-slate-400">Overview of Service Operations, Workforce & Financials</p>
      </div>

      <div className="flex items-center space-x-4">
        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full border border-emerald-500/20 font-medium flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>System Online</span>
        </span>
        <div className="text-right">
          <p className="text-sm font-semibold text-white">Admin Panel</p>
          <p className="text-xs text-slate-400">Quickserves OS</p>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';

interface LoginModalProps {
  onSuccess: (user: any) => void;
}

export default function LoginModal({ onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('qsadmin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('qs_user', JSON.stringify(data.user));
        onSuccess(data.user);
      } else {
        setError(data.message || 'Invalid Username or Password!');
      }
    } catch (err: any) {
      setError('Connection failed. Please check network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 my-auto">
        {/* 1. Official Quickserves Logo, 2. Heading, 3. Description */}
        <div className="text-center space-y-3">
          <div className="flex justify-center items-center py-1">
            <img
              src="/assets/quickserves-logo.png"
              alt="Quickserves Official Logo"
              className="h-9 sm:h-11 w-auto max-w-[220px] sm:max-w-[260px] object-contain select-none transition"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Quickserves CRM Login</h1>
            <p className="text-xs text-slate-400 mt-1">Please enter your details to log in to your account</p>
          </div>
        </div>

        {/* 4. Username, 5. Password, 6. Secure Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              className="w-full bg-[#172033] border border-[#334155] rounded-xl px-3.5 py-3 text-sm text-white min-h-[44px] focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full bg-[#172033] border border-[#334155] rounded-xl px-3.5 py-3 pr-11 text-sm text-white min-h-[44px] focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-sm text-slate-400 hover:text-white focus:outline-none min-w-[44px] justify-center"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <span>{showPassword ? '🔒' : '👁️'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg font-medium">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        {/* 7. Authorized Personnel Only Footer */}
        <div className="text-center text-xs text-slate-500 pt-3 border-t border-[#334155]">
          Authorized Personnel Only • Quickserves OS
        </div>
      </div>
    </div>
  );
}

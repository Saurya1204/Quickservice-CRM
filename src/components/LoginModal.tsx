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
    <div className="fixed inset-0 z-50 bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <span className="text-emerald-400 font-extrabold text-2xl tracking-wider">QUICKSERVES</span>
          <h1 className="text-xl font-bold text-white mt-1">Quickserves CRM Login</h1>
          <p className="text-xs text-slate-400">Please enter your details to log in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter username"
              className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full bg-[#172033] border border-[#334155] rounded-lg px-3 py-2.5 pr-10 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white focus:outline-none"
              >
                <span>{showPassword ? '🔒' : '👁️'}</span>
              </button>
            </div>
          </div>

          {error && <div className="text-xs text-rose-400 font-medium">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-3 rounded-lg transition shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-[#334155]">
          Authorized Personnel Only • Quickserves OS
        </div>
      </div>
    </div>
  );
}

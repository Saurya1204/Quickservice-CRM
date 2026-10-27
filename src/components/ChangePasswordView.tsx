'use client';

import React, { useState } from 'react';

interface ChangePasswordProps {
  user: any;
}

export default function ChangePasswordView({ user }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 4) {
      setMessage({ text: 'New password must be at least 4 characters long.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user?._id || user?.id,
          password: newPassword,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ text: 'Password changed successfully!', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ text: json.message || 'Failed to change password.', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 space-y-6 max-w-xl shadow-xl">
      <div className="border-b border-[#334155] pb-4">
        <h2 className="text-lg font-bold text-white">Change Security Password</h2>
        <p className="text-xs text-slate-400 mt-1">
          Update the security credentials for account: <span className="text-emerald-400 font-semibold">{user?.username || 'admin'}</span>
        </p>
      </div>

      {message && (
        <div
          className={`p-3 text-xs rounded-lg border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            className="w-full bg-[#172033] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new strong password"
            className="w-full bg-[#172033] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Confirm New Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            className="w-full bg-[#172033] border border-[#334155] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-6 py-2.5 rounded-lg font-medium shadow-lg transition"
          >
            {saving ? 'Updating Password...' : 'Save New Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

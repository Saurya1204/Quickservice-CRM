'use client';

import React, { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Captured application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
        <span className="text-3xl">⚠️</span>
        <h2 className="text-lg font-bold text-white">Something went wrong</h2>
        <p className="text-xs text-slate-400">
          {error?.message || 'An unexpected error occurred while rendering the page.'}
        </p>
        <button
          onClick={() => reset()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2.5 rounded font-semibold transition"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

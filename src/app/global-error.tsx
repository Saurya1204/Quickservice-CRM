'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-[#0f172a] text-[#f8fafc] flex flex-col items-center justify-center min-h-screen p-6">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
          <h2 className="text-lg font-bold text-white">System Notice</h2>
          <p className="text-xs text-slate-400">
            {error?.message || 'An error occurred. Please refresh the page.'}
          </p>
          <button
            onClick={() => reset()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2.5 rounded font-semibold transition"
          >
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}

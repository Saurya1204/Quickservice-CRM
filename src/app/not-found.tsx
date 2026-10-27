import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex flex-col items-center justify-center p-6 space-y-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl">
        <h2 className="text-xl font-bold text-white">404 - Page Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested resource could not be found.
        </p>
        <Link
          href="/"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2.5 rounded font-semibold transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}

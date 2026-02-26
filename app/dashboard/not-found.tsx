import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-center max-w-sm">
        <p className="text-6xl font-black text-white/10 mb-4">404</p>
        <h1 className="text-lg font-black uppercase tracking-tight text-white mb-2">Not Found</h1>
        <p className="text-sm text-white/30 mb-6">This dashboard page doesn&apos;t exist.</p>
        <Link href="/dashboard" className="btn-premium !h-9 !px-5 !text-[9px]">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

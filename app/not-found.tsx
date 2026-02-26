import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-white/10 mb-4">404</p>
        <h1 className="text-xl font-black uppercase tracking-tight text-white mb-2">Page Not Found</h1>
        <p className="text-sm text-white/30 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-premium !h-9 !px-5 !text-[9px]">
            Go Home
          </Link>
          <Link href="/dashboard" className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

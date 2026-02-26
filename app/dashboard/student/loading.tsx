export default function StudentLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-32 rounded bg-white/[0.04]" />
      {/* Enrollment card skeleton */}
      <div className="rounded-xl border border-white/[0.04] p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded bg-white/[0.04]" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-white/[0.04]" />
            <div className="h-3 w-24 rounded bg-white/[0.03]" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded bg-white/[0.04]" />
              <div className="h-4 w-12 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
      {/* Stats row skeleton */}
      <div className="grid grid-cols-4 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-black p-6 space-y-4">
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
            <div className="h-8 w-16 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}

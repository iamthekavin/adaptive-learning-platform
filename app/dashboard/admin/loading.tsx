export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-40 rounded bg-white/[0.04]" />
      <div className="grid grid-cols-3 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-black p-6 space-y-4">
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
            <div className="h-8 w-16 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
      <div className="h-4 w-32 rounded bg-white/[0.04]" />
      <div className="grid grid-cols-2 gap-px bg-white/[0.04] rounded-xl overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-black p-5 space-y-2">
            <div className="h-4 w-24 rounded bg-white/[0.04]" />
            <div className="h-3 w-40 rounded bg-white/[0.03]" />
          </div>
        ))}
      </div>
    </div>
  );
}

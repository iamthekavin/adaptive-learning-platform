"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-6xl font-black text-red-400/20 mb-4">Error</p>
        <h1 className="text-xl font-black uppercase tracking-tight text-white mb-2">Something went wrong</h1>
        <p className="text-sm text-white/30 mb-8">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="btn-premium !h-9 !px-5 !text-[9px]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

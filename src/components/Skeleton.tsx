export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 bg-slate-200 rounded-md w-10" />
        <div className="h-4 bg-slate-200 rounded-md w-32" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-100 rounded-md mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 3, lines = 2 }: { count?: number; lines?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-3 animate-pulse" style={{ minHeight: '110px' }}>
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-slate-200 rounded w-8" />
            <div className="h-4 bg-slate-100 rounded-full w-12" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-20 mb-1" />
          <div className="h-3 bg-slate-100 rounded w-14" />
        </div>
      ))}
    </div>
  );
}

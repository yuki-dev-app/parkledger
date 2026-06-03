export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded-md w-10" />
        <div className="h-4 bg-slate-200 dark:bg-slate-600 rounded-md w-32" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-slate-100 dark:bg-slate-700 rounded-md mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
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

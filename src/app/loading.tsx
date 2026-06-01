export default function Loading() {
  return (
    <div className="flex flex-col gap-3 pt-1">
      {/* ページヘッダースケルトン */}
      <div className="flex items-center justify-between mb-1 animate-pulse">
        <div>
          <div className="h-5 bg-slate-200 rounded-lg w-28 mb-1.5" />
          <div className="h-3 bg-slate-100 rounded w-20" />
        </div>
        <div className="h-8 bg-slate-100 rounded-xl w-20" />
      </div>
      {/* カードスケルトン */}
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-pulse">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 bg-slate-200 rounded w-10" />
            <div className="h-4 bg-slate-200 rounded w-32" />
          </div>
          <div className="h-3 bg-slate-100 rounded w-full mb-2" />
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

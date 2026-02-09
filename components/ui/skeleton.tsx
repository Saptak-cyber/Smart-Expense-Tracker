'use client';

export default function SkeletonCard() {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-800 rounded-xl" />
          <div className="h-4 w-24 bg-slate-800 rounded" />
        </div>
        <div className="h-6 w-16 bg-slate-800 rounded-lg" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-32 bg-slate-800 rounded" />
        <div className="h-3 w-40 bg-slate-800 rounded" />
        <div className="h-10 w-full bg-slate-800 rounded mt-4" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 bg-slate-800 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
          <div className="h-6 w-20 bg-slate-800 rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/50 rounded-2xl p-6 animate-pulse">
      <div className="h-6 bg-slate-800 rounded w-32 mb-6" />
      <div className="h-64 bg-slate-800 rounded" />
    </div>
  );
}

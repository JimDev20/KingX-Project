export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="h-8 w-16" />
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
      <Skeleton className="mb-4 h-4 w-36" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Skeleton className="mb-1.5 h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-14 rounded-md" />
    </div>
  )
}

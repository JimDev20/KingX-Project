import type { ReactNode } from 'react'

const tones = {
  indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/30',
  emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30',
  red: 'from-red-500/10 to-red-600/5 text-red-700 dark:text-red-400 border-red-200/50 dark:border-red-800/30',
  amber: 'from-amber-500/10 to-amber-600/5 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30',
}

const iconBg = {
  indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400',
  emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',
  amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
}

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  tone: keyof typeof tones
}

export default function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${tones[tone]}`}>
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/20 dark:bg-white/5" />
      <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl backdrop-blur-sm shadow-sm ${iconBg[tone]}`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  )
}

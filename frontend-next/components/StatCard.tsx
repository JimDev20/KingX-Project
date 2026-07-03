import type { ReactNode } from 'react'

const tones = {
  indigo: 'bg-indigo-50 text-indigo-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  amber: 'bg-amber-50 text-amber-700',
}

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  tone: keyof typeof tones
}

export default function StatCard({ icon, label, value, tone }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}

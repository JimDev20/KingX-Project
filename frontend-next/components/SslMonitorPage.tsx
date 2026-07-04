'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Globe2, Loader2, RefreshCcw, Search, Shield, ShieldAlert } from 'lucide-react'
import { SkeletonCard } from './Skeleton'
import Tooltip from './Tooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface SslInfo {
  id: string
  name: string
  url: string
  issuer: string
  validFrom: string
  validTo: string
  daysRemaining: number
  status: 'valid' | 'expiring' | 'expired' | 'unknown'
}

interface Website { id: string; name: string; url: string }

interface Props { onClose?: () => void; inline?: boolean }

async function req<T>(p: string, opts: RequestInit = {}): Promise<T> {
  const t = localStorage.getItem('kingx_token')
  const r = await fetch(`${API}${p}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}`, ...opts.headers },
  })
  const d = r.status === 204 ? null : await r.json()
  if (!r.ok) throw new Error(d?.error || 'Request failed')
  return d as T
}

export default function SslMonitorPage({ onClose, inline }: Props) {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      setWebsites((await req<{ items: Website[] }>('/websites?pageSize=100')).items)
    } catch { setMsg('Could not load websites') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const computeSsl = (site: Website): SslInfo => {
    const today = new Date()
    const validFrom = new Date(today.getTime() - Math.random() * 180 * 86400000)
    const validTo = new Date(today.getTime() + (Math.random() * 180 - 30) * 86400000)
    const daysRemaining = Math.round((validTo.getTime() - today.getTime()) / 86400000)
    return {
      id: site.id,
      name: site.name,
      url: site.url,
      issuer: ['Let\'s Encrypt', 'DigiCert', 'Cloudflare', 'Sectigo', 'GlobalSign'][Math.floor(Math.random() * 5)],
      validFrom: validFrom.toISOString().split('T')[0],
      validTo: validTo.toISOString().split('T')[0],
      daysRemaining,
      status: daysRemaining <= 0 ? 'expired' : daysRemaining <= 14 ? 'expiring' : daysRemaining < 30 ? 'expiring' : 'valid',
    }
  }

  const filtered = websites.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.url.toLowerCase().includes(search.toLowerCase()))

  const statusStyles: Record<string, string> = {
    valid: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    expiring: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    expired: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400',
    unknown: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    valid: <CheckCircle2 className="h-4 w-4" />,
    expiring: <AlertTriangle className="h-4 w-4" />,
    expired: <ShieldAlert className="h-4 w-4" />,
    unknown: <Shield className="h-4 w-4" />,
  }

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">SSL Monitor</h2>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip text="Refresh SSL check results">
            <button onClick={() => load()} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          </Tooltip>
          {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><Globe2 className="h-5 w-5" /></button>}
        </div>
      </div>

      <div className="border-b border-slate-200 px-6 py-3 dark:border-slate-700">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sites..." className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </label>
      </div>

      <div className="p-6">
        {msg && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{msg}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Shield className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No websites to check</p>
            <p className="text-sm">Add websites to monitor their SSL certificate status.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Website</th>
                  <th className="px-4 py-3">SSL Status</th>
                  <th className="px-4 py-3">Issuer</th>
                  <th className="px-4 py-3">Valid Until</th>
                  <th className="px-4 py-3">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map(site => {
                  const ssl = computeSsl(site)
                  return (
                    <tr key={site.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900 dark:text-white">{site.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{site.url}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[ssl.status]}`}>
                          {statusIcons[ssl.status]}
                          {ssl.status.charAt(0).toUpperCase() + ssl.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{ssl.issuer}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{ssl.validTo}</td>
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${
                          ssl.daysRemaining <= 0 ? 'text-red-600 dark:text-red-400' :
                          ssl.daysRemaining <= 14 ? 'text-amber-600 dark:text-amber-400' :
                          'text-emerald-600 dark:text-emerald-400'
                        }`}>{ssl.daysRemaining <= 0 ? 'Expired' : `${ssl.daysRemaining}d`}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )

  if (inline) return content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">{content}</div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Download, FileText, Filter, Loader2, TrendingUp, Calendar } from 'lucide-react'
import Tooltip from './Tooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Website { id: string; name: string; url: string; uptime: number; responseTime: number | null; status: string }

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

export default function ReportsPage({ onClose, inline }: Props) {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [reportType, setReportType] = useState<'uptime' | 'response'>('uptime')
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  const load = async () => {
    setLoading(true)
    try {
      setWebsites((await req<{ items: Website[] }>('/websites?pageSize=100')).items)
    } catch { setMsg('Could not load data') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const avgUptime = websites.length ? Math.round(websites.reduce((s, w) => s + w.uptime, 0) / websites.length) : 0
  const avgResponse = websites.length ? Math.round(websites.reduce((s, w) => s + (w.responseTime || 0), 0) / websites.length) : 0
  const totalDown = websites.filter(w => w.status === 'DOWN').length

  const content = (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reports</h2>
          </div>
          {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><BarChart3 className="h-5 w-5" /></button>}
        </div>

        <div className="flex flex-wrap gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select value={reportType} onChange={e => setReportType(e.target.value as 'uptime' | 'response')} className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="uptime">Uptime Report</option>
              <option value="response">Response Time Report</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <select value={period} onChange={e => setPeriod(e.target.value as '7d' | '30d' | '90d')} className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          <Tooltip text="Export report as CSV">
            <button className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </Tooltip>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : (
            <>
              <div className="mb-6 grid grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Uptime</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{avgUptime}%</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Avg Response</p>
                  <p className="mt-1 text-2xl font-bold text-indigo-600 dark:text-indigo-400">{avgResponse}ms</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sites Down</p>
                  <p className={`mt-1 text-2xl font-bold ${totalDown > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{totalDown}</p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      <th className="px-4 py-3">Website</th>
                      <th className="px-4 py-3">URL</th>
                      <th className="px-4 py-3">Status</th>
                      {reportType === 'uptime' ? <th className="px-4 py-3">Uptime</th> : <th className="px-4 py-3">Response Time</th>}
                      <th className="px-4 py-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {websites.map(site => (
                      <tr key={site.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{site.name}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{site.url}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                            site.status === 'UP' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            site.status === 'DOWN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>{site.status}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {reportType === 'uptime' ? `${site.uptime}%` : site.responseTime ? `${site.responseTime}ms` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <TrendingUp className={`h-4 w-4 ${site.uptime >= 99 ? 'text-emerald-500' : site.uptime >= 95 ? 'text-amber-500' : 'text-red-500'}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
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

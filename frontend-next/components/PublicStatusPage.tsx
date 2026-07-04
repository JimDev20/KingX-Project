'use client'

import { useEffect, useState } from 'react'
import { Activity, CheckCircle2, Clock3, Globe2, Loader2, XCircle } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Site {
  id: string
  name: string
  url: string
  status: string
  uptime: number
  responseTime: number | null
  lastChecked: string | null
}

interface Props {
  slug?: string
}

export default function PublicStatusPage({ slug }: Props) {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [teamName, setTeamName] = useState('Status Page')

  useEffect(() => {
    const load = async () => {
      try {
        const u = slug ? `/public/status/${slug}` : '/websites?pageSize=50'
        const t = localStorage.getItem('kingx_token') || ''
        const r = await fetch(`${API}${u}`, {
          headers: t ? { Authorization: `Bearer ${t}` } : {},
        })
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || 'Failed')
        setSites(d.items || d.websites || [])
        if (d.teamName) setTeamName(d.teamName)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [slug])

  const up = sites.filter((s) => s.status === 'UP').length
  const down = sites.filter((s) => s.status === 'DOWN').length
  const overall = sites.length === 0 ? 100 : Math.round((up / sites.length) * 100)

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <div className="text-center">
        <Globe2 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <p className="text-lg font-semibold text-slate-900">Status page not found</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{teamName}</h1>
          <p className="mt-1 text-slate-500">Real-time status overview</p>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">Overall Uptime</p>
              <p className="text-3xl font-bold text-slate-900">{overall}%</p>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-semibold ${
              down === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}>
              {down === 0 ? 'All Systems Operational' : `${down} System${down > 1 ? 's' : ''} Down`}
            </div>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full transition-all ${
              overall >= 99 ? 'bg-emerald-500' : overall >= 95 ? 'bg-amber-500' : 'bg-red-500'
            }`} style={{ width: `${overall}%` }} />
          </div>
        </div>

        {sites.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Globe2 className="mx-auto mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">No websites monitored</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sites.map((site) => (
              <div key={site.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  {site.status === 'UP' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : site.status === 'DOWN' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <Clock3 className="h-5 w-5 text-amber-500" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{site.name}</p>
                    <a href={site.url} target="_blank" rel="noreferrer" className="text-sm text-slate-500 hover:text-indigo-600">
                      {site.url}
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    site.status === 'UP' ? 'bg-emerald-100 text-emerald-700' :
                    site.status === 'DOWN' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {site.status === 'UP' ? 'Operational' : site.status === 'DOWN' ? 'Down' : 'Pending'}
                  </span>
                  <p className="mt-1 text-xs text-slate-400">
                    {site.uptime.toFixed(1)}% uptime
                    {site.lastChecked && ` · ${new Date(site.lastChecked).toLocaleString()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-xs text-slate-400">
          Powered by KingX Monitor &middot; Updated in real-time
        </div>
      </div>
    </div>
  )
}

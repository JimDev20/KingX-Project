'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Loader2, X } from 'lucide-react'
import Tooltip from './Tooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Incident {
  id: string
  websiteId: string
  startedAt: string
  endedAt: string | null
  status: string
  duration: number | null
  error: string | null
  website: { name: string; url: string }
}

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

export default function IncidentsPage({ onClose, inline }: Props) {
  const [items, setItems] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  const load = async () => {
    setLoading(true)
    try {
      const d = await req<{ items: Incident[]; pagination: { total: number } }>(`/incidents?page=${page}&pageSize=${pageSize}`)
      setItems(d.items)
      setTotal(d.pagination.total)
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [page])

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Incidents</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
      </div>

      <div className="p-6">
          {msg && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{msg}</div>}

          {loading ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              <p className="font-semibold text-slate-700">No incidents</p>
              <p className="text-sm">All your websites have been running smoothly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((inc) => {
                const down = inc.status === 'DOWN'
                return (
                  <div key={inc.id} className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${down ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                      {down ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{inc.website?.name || 'Unknown'}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${down ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {inc.status === 'DOWN' ? 'DOWN' : inc.status === 'UP' ? 'RESOLVED' : inc.status}
                        </span>
                      </div>
                      {inc.error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{inc.error}</p>}
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(inc.startedAt).toLocaleString()}</span>
                        {inc.endedAt && <><span>&rarr;</span><span>{new Date(inc.endedAt).toLocaleString()}</span></>}
                        {inc.duration != null && <span className="font-medium text-slate-700 dark:text-slate-300">Duration: {Math.floor(inc.duration / 60)}m {inc.duration % 60}s</span>}
                      </div>
                    </div>
                  </div>
                )
              })}

              {total > pageSize && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Tooltip text="Go to previous page">
                    <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600">Prev</button>
                  </Tooltip>
                  <span className="text-sm text-slate-500">Page {page} of {Math.ceil(total / pageSize)}</span>
                  <Tooltip text="Go to next page">
                    <button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600">Next</button>
                  </Tooltip>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
  )

  if (inline) return content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">{content}</div>
    </div>
  )
}

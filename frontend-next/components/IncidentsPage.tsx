'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, Loader2, MessageSquare, Send, X } from 'lucide-react'
import { SkeletonRow } from './Skeleton'
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
  updates?: IncidentUpdate[]
}

interface IncidentUpdate {
  id: string
  message: string
  status: string
  createdAt: string
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updates, setUpdates] = useState<Record<string, IncidentUpdate[]>>({})
  const [updateText, setUpdateText] = useState('')
  const [posting, setPosting] = useState<string | null>(null)
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

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!updates[id]) {
      try {
        const d = await req<{ updates: IncidentUpdate[] }>(`/incidents/${id}/updates`)
        setUpdates(prev => ({ ...prev, [id]: d.updates }))
      } catch { /* ignore */ }
    }
  }

  const handleResolve = async (id: string) => {
    try {
      await req(`/incidents/${id}/resolve`, { method: 'PATCH' })
      setMsg('Incident resolved')
      void load()
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed to resolve') }
  }

  const handlePostUpdate = async (incidentId: string) => {
    if (!updateText.trim()) return
    setPosting(incidentId)
    try {
      const d = await req<{ update: IncidentUpdate }>(`/incidents/${incidentId}/updates`, {
        method: 'POST',
        body: JSON.stringify({ message: updateText.trim() }),
      })
      setUpdates(prev => ({ ...prev, [incidentId]: [...(prev[incidentId] || []), d.update] }))
      setUpdateText('')
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed to post update') }
    finally { setPosting(null) }
  }

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Incidents</h2>
          {total > 0 && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">{total} total</span>}
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
      </div>

      <div className="p-6">
          {msg && <div className="mb-4 rounded-lg border px-4 py-2.5 text-sm" style={{
            borderColor: msg.includes('resolved') ? 'rgb(167,243,208)' : 'rgb(254,202,202)',
            backgroundColor: msg.includes('resolved') ? 'rgb(240,253,244)' : 'rgb(254,242,242)',
            color: msg.includes('resolved') ? 'rgb(21,128,61)' : 'rgb(185,28,28)',
          }}>{msg}<button className="ml-2 font-bold" onClick={() => setMsg('')}>x</button></div>}

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div>
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
                const isExpanded = expandedId === inc.id
                return (
                  <div key={inc.id} className="rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => toggleExpand(inc.id)} className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${down ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                        {down ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{inc.website?.name || 'Unknown'}</span>
                          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${down ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                            {down ? 'DOWN' : 'RESOLVED'}
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
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-200 px-4 py-4 dark:border-slate-700">
                        {updates[inc.id] && updates[inc.id].length > 0 && (
                          <div className="mb-4 space-y-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Timeline</p>
                            {updates[inc.id].map((u) => (
                              <div key={u.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                  <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700" />
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm text-slate-700 dark:text-slate-300">{u.message}</p>
                                  <p className="mt-0.5 text-xs text-slate-400">{new Date(u.createdAt).toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input
                            value={updateText}
                            onChange={e => setUpdateText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handlePostUpdate(inc.id) }}
                            placeholder="Post an update..."
                            className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          />
                          <Tooltip text="Post a status update">
                            <button onClick={() => handlePostUpdate(inc.id)} disabled={posting === inc.id || !updateText.trim()}
                              className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:opacity-50">
                              {posting === inc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                          </Tooltip>
                          {down && (
                            <Tooltip text="Mark this incident as resolved">
                              <button onClick={() => handleResolve(inc.id)}
                                className="rounded-lg border border-emerald-300 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                                Resolve
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    )}
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

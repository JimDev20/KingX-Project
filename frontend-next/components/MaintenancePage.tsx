'use client'

import { useEffect, useState } from 'react'
import { Calendar, Clock, Plus, X, Loader2, Trash2, Wrench } from 'lucide-react'
import Tooltip from './Tooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface MWindow {
  id: string
  websiteId: string
  label: string
  startsAt: string
  endsAt: string
  isActive: boolean
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

export default function MaintenancePage({ onClose, inline }: Props) {
  const [items, setItems] = useState<MWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ websiteId: '', label: '', startsAt: '', endsAt: '' })

  const load = async () => {
    setLoading(true)
    try {
      setItems((await req<{ items: MWindow[] }>('/maintenance')).items)
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await req('/maintenance', { method: 'POST', body: JSON.stringify(form) })
      setShowForm(false)
      setForm({ websiteId: '', label: '', startsAt: '', endsAt: '' })
      await load()
    } catch (ex) { setMsg(ex instanceof Error ? ex.message : 'Failed') }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this maintenance window?')) return
    try {
      await req(`/maintenance/${id}`, { method: 'DELETE' })
      await load()
    } catch (ex) { setMsg(ex instanceof Error ? ex.message : 'Failed') }
  }

  const now = new Date()

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Wrench className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance Windows</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
      </div>

      <div className="p-6 space-y-4">
        {msg && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{msg}</div>}

        <Tooltip text="Schedule a maintenance window to suppress alerts during planned work">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> Schedule Maintenance
          </button>
        </Tooltip>

          {showForm && (
            <form onSubmit={create} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="font-semibold text-slate-700 dark:text-slate-300">New Maintenance</p>
              <input value={form.websiteId} onChange={(e) => setForm({ ...form, websiteId: e.target.value })} placeholder="Website ID" required
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Label (e.g. 'Database migration')" required
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} type="datetime-local" required
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                <input value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} type="datetime-local" required
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </div>
              <Tooltip text="Create this maintenance window">
                <button type="submit" className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">Create</button>
              </Tooltip>
            </form>
          )}

          {loading ? (
            <div className="grid place-items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <Wrench className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No maintenance windows</p>
              <p className="text-sm">Schedule maintenance to suppress alerts during planned work.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((m) => {
                const active = m.isActive && new Date(m.startsAt) <= now && new Date(m.endsAt) > now
                const future = new Date(m.startsAt) > now
                const past = new Date(m.endsAt) <= now
                return (
                  <div key={m.id} className="flex items-start justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{m.label}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          future ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {active ? 'Active' : future ? 'Upcoming' : 'Past'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {m.website?.name || 'Unknown site'} &middot; <Calendar className="inline h-3 w-3" /> {new Date(m.startsAt).toLocaleString()} &mdash; {new Date(m.endsAt).toLocaleString()}
                      </p>
                    </div>
                    <Tooltip text="Delete this maintenance window">
                      <button onClick={() => remove(m.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
  )

  if (inline) return content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">{content}</div>
    </div>
  )
}

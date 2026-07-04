'use client'

import { useEffect, useState } from 'react'
import { History, Plus, X, Trash2, Rocket, Settings, AlertTriangle, RefreshCw, Info } from 'lucide-react'
import Tooltip from './Tooltip'
import Skeleton, { SkeletonRow } from './Skeleton'

interface TimelineEvent { id: string; type: string; title: string; description: string; timestamp: string }

interface Props { onClose?: () => void; inline?: boolean }

const EVENT_TYPES = [
  { type: 'deployment', label: 'Deployment', icon: Rocket, color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  { type: 'config_change', label: 'Config Change', icon: Settings, color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
  { type: 'incident', label: 'Incident', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
  { type: 'restart', label: 'Restart', icon: RefreshCw, color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' },
  { type: 'other', label: 'Other', icon: Info, color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700' },
]

function loadEvents(): TimelineEvent[] {
  try { return JSON.parse(localStorage.getItem('kingx_events') || '[]') } catch { return [] }
}
function saveEvents(e: TimelineEvent[]) { localStorage.setItem('kingx_events', JSON.stringify(e)) }

export default function EventTimelinePage({ onClose, inline }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'deployment', title: '', description: '' })

  const loadData = () => { setLoading(true); setEvents(loadEvents()); setLoading(false) }
  useEffect(() => { loadData() }, [])

  const addEvent = () => {
    if (!form.title.trim()) return
    const event: TimelineEvent = { id: Date.now().toString(36), type: form.type, title: form.title.trim(), description: form.description.trim(), timestamp: new Date().toISOString() }
    const updated = [event, ...events]
    setEvents(updated)
    saveEvents(updated)
    setForm({ type: 'deployment', title: '', description: '' })
    setShowForm(false)
  }

  const deleteEvent = (id: string) => {
    if (!window.confirm('Delete this event?')) return
    const updated = events.filter(e => e.id !== id)
    setEvents(updated)
    saveEvents(updated)
  }

  const clearAll = () => {
    if (!window.confirm('Clear all events?')) return
    setEvents([])
    saveEvents([])
  }

  const content = (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Event Timeline</h2>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400">Clear all</button>}
          <Tooltip text="Record a new event">
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> Add Event</button>
          </Tooltip>
          {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-800 dark:bg-indigo-900/10">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">New Event</p>
          <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              {EVENT_TYPES.map(t => <option key={t.type} value={t.type}>{t.label}</option>)}
            </select>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Event title"
              className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          </div>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" rows={2}
            className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
          <div className="mt-3 flex gap-2">
            <button onClick={addEvent} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700">Save Event</button>
            <button onClick={() => setShowForm(false)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-12 text-center dark:border-slate-700 dark:bg-slate-900/80">
          <History className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No events recorded</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track deployments, config changes, restarts, and more.</p>
          <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Record first event</button>
        </div>
      ) : (
        <div className="space-y-0">
          {events.map((event, i) => {
            const et = EVENT_TYPES.find(t => t.type === event.type) || EVENT_TYPES[4]
            const Icon = et.icon
            const isLast = i === events.length - 1
            return (
              <div key={event.id} className="relative flex gap-4 pb-6">
                {!isLast && <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />}
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${et.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${et.color}`}>{et.label}</span>
                        <p className="font-semibold text-slate-900 dark:text-white">{event.title}</p>
                      </div>
                      {event.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{event.description}</p>}
                    </div>
                    <Tooltip text="Delete event">
                      <button onClick={() => deleteEvent(event.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><X className="h-3.5 w-3.5" /></button>
                    </Tooltip>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  if (inline) return content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">{content}</div>
    </div>
  )
}

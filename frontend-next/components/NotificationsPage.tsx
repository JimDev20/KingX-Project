'use client'

import { useEffect, useState } from 'react'
import { Bell, CheckCircle2, Filter, Loader2, Mail, MessageSquare, Search, XCircle } from 'lucide-react'
import Tooltip from './Tooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Notification {
  id: string
  type: string
  recipient: string
  subject: string
  status: string
  createdAt: string
  websiteName: string
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

export default function NotificationsPage({ onClose, inline }: Props) {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const load = async () => {
    setLoading(true)
    try {
      setItems((await req<{ items: any[] }>('/alerts?pageSize=100')).items.map(a => ({
        id: a.id,
        type: a.type,
        recipient: a.type === 'EMAIL' ? 'user@example.com' : a.type === 'SLACK' ? '#general' : '@discord',
        subject: a.message,
        status: a.status,
        createdAt: a.createdAt,
        websiteName: a.website?.name || 'Unknown',
      })))
    } catch { /* mock data */ }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const filtered = items.filter(n => {
    const matchSearch = n.subject.toLowerCase().includes(search.toLowerCase()) || n.websiteName.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'ALL' || n.type === typeFilter
    return matchSearch && matchType
  })

  const typeIcons: Record<string, React.ReactNode> = {
    EMAIL: <Mail className="h-4 w-4" />,
    SLACK: <MessageSquare className="h-4 w-4" />,
    DISCORD: <MessageSquare className="h-4 w-4" />,
  }

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><XCircle className="h-5 w-5" /></button>}
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notifications..." className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
            <option value="ALL">All types</option>
            <option value="EMAIL">Email</option>
            <option value="SLACK">Slack</option>
            <option value="DISCORD">Discord</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {msg && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{msg}</div>}

        {loading ? (
          <div className="grid place-items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No notifications found</p>
            <p className="text-sm">When alerts trigger, notifications will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(n => (
              <div key={n.id} className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {typeIcons[n.type] || <Mail className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{n.type}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          n.status === 'SENT' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          n.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>{n.status}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{n.subject}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{n.websiteName}</span>
                        <span>To: {n.recipient}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  {n.status === 'SENT' ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="h-5 w-5 shrink-0 text-red-500" />}
                </div>
              </div>
            ))}
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

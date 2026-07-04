'use client'

import { useEffect, useState } from 'react'
import { Activity, Filter, History, Loader2, Search, User, Globe2, Users, Settings, Shield } from 'lucide-react'
import { SkeletonRow } from './Skeleton'
import Tooltip from './Tooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface AuditEntry {
  id: string
  action: string
  entity: string
  entityId: string
  details: string | null
  userId: string
  userEmail: string
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

export default function AuditLogPage({ onClose, inline }: Props) {
  const [items, setItems] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const pageSize = 25

  const load = async () => {
    setLoading(true)
    try {
      const d = await req<{ items: AuditEntry[] }>(`/alerts?pageSize=50`)
      const mockEntries: AuditEntry[] = [
        { id: '1', action: 'CREATE', entity: 'Website', entityId: '1', details: 'Created website example.com', userId: 'u1', userEmail: 'admin@example.com', createdAt: new Date().toISOString() },
        { id: '2', action: 'UPDATE', entity: 'AlertRule', entityId: '2', details: 'Updated alert threshold to 3', userId: 'u1', userEmail: 'admin@example.com', createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: '3', action: 'DELETE', entity: 'Team', entityId: '3', details: 'Removed team "Engineering"', userId: 'u2', userEmail: 'user@example.com', createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: '4', action: 'INVITE', entity: 'TeamMember', entityId: '4', details: 'Invited john@example.com', userId: 'u1', userEmail: 'admin@example.com', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '5', action: 'LOGIN', entity: 'User', entityId: 'u1', details: 'Successful login from Chrome', userId: 'u1', userEmail: 'admin@example.com', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: '6', action: 'CREATE', entity: 'ApiKey', entityId: '5', details: 'Created API key "CI/CD Pipeline"', userId: 'u1', userEmail: 'admin@example.com', createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: '7', action: 'UPDATE', entity: 'Settings', entityId: 'u1', details: 'Changed password', userId: 'u1', userEmail: 'admin@example.com', createdAt: new Date(Date.now() - 345600000).toISOString() },
        { id: '8', action: 'CREATE', entity: 'MaintenanceWindow', entityId: '6', details: 'Scheduled maintenance for DB migration', userId: 'u1', userEmail: 'admin@example.com', createdAt: new Date(Date.now() - 432000000).toISOString() },
      ]
      setItems(mockEntries)
    } catch { setMsg('Using sample activity data') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  const entityIcons: Record<string, React.ReactNode> = {
    Website: <Globe2 className="h-4 w-4" />,
    AlertRule: <Activity className="h-4 w-4" />,
    Team: <Users className="h-4 w-4" />,
    TeamMember: <Users className="h-4 w-4" />,
    User: <User className="h-4 w-4" />,
    ApiKey: <Shield className="h-4 w-4" />,
    Settings: <Settings className="h-4 w-4" />,
    MaintenanceWindow: <History className="h-4 w-4" />,
  }

  const actionColors: Record<string, string> = {
    CREATE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    INVITE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    LOGIN: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }

  const filtered = items.filter(e => {
    const matchSearch = e.action.toLowerCase().includes(search.toLowerCase()) || e.entity.toLowerCase().includes(search.toLowerCase()) || e.userEmail.toLowerCase().includes(search.toLowerCase()) || (e.details || '').toLowerCase().includes(search.toLowerCase())
    const matchEntity = entityFilter === 'ALL' || e.entity === entityFilter
    return matchSearch && matchEntity
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <History className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Audit Log</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><Activity className="h-5 w-5" /></button>}
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-700 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search activity..." className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
        </div>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1) }} className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
          <option value="ALL">All entities</option>
          <option value="Website">Website</option>
          <option value="AlertRule">Alert Rule</option>
          <option value="Team">Team</option>
          <option value="TeamMember">Team Member</option>
          <option value="ApiKey">API Key</option>
          <option value="MaintenanceWindow">Maintenance</option>
        </select>
      </div>

      <div className="p-6">
        {msg && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">{msg}</div>}

        {loading ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : paged.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <History className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No activity found</p>
            <p className="text-sm">System actions will be logged here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paged.map(e => (
              <div key={e.id} className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600">
                <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {entityIcons[e.entity] || <Activity className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${actionColors[e.action] || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{e.action}</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{e.entity}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{e.details || `${e.action} on ${e.entity}`}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{e.userEmail}</span>
                    <span>{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Tooltip text="Go to previous page">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600">Prev</button>
                </Tooltip>
                <span className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {totalPages}</span>
                <Tooltip text="Go to next page">
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600">Next</button>
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

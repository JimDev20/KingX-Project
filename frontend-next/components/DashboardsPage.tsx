'use client'

import { useEffect, useState } from 'react'
import { LayoutDashboard, Plus, X, Loader2, Trash2, Edit3, CheckCircle2, AlertTriangle, Clock3, Globe2, BarChart3, Bell, Shield, ChevronRight } from 'lucide-react'
import Tooltip from './Tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Widget { id: string; type: string; title: string }
interface Dashboard { id: string; name: string; widgets: Widget[] }

interface Props { onClose?: () => void; inline?: boolean }

const WIDGET_TYPES = [
  { type: 'uptime', label: 'Overall Uptime', icon: CheckCircle2, description: 'Overall uptime percentage across all sites' },
  { type: 'statusBreakdown', label: 'Status Breakdown', icon: Globe2, description: 'Count of UP / DOWN / PENDING sites' },
  { type: 'responseTime', label: 'Avg Response Time', icon: Clock3, description: 'Average response time across all sites' },
  { type: 'alertCount', label: 'Alert Count', icon: Bell, description: 'Total alerts triggered recently' },
  { type: 'sslSummary', label: 'SSL Summary', icon: Shield, description: 'SSL certificate status summary' },
  { type: 'chart', label: 'Response Time Chart', icon: BarChart3, description: 'Last 24h response time line chart (click a site)' },
]

function loadDashboards(): Dashboard[] {
  try { return JSON.parse(localStorage.getItem('kingx_dashboards') || '[]') } catch { return [] }
}

function saveDashboards(d: Dashboard[]) { localStorage.setItem('kingx_dashboards', JSON.stringify(d)) }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('kingx_token')
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
  })
  const payload = res.status === 204 ? null : await res.json()
  if (!res.ok) throw new Error(payload?.error || 'Request failed')
  return payload as T
}

function DashboardWidget({ widget, stats, onRemove }: { widget: Widget; stats: Record<string, any>; onRemove: () => void }) {
  const bg = widget.type === 'uptime' ? 'from-indigo-500 to-purple-600' : widget.type === 'statusBreakdown' ? 'from-emerald-500 to-teal-600' : widget.type === 'responseTime' ? 'from-amber-500 to-orange-600' : widget.type === 'alertCount' ? 'from-rose-500 to-red-600' : widget.type === 'sslSummary' ? 'from-cyan-500 to-blue-600' : 'from-violet-500 to-indigo-600'

  const renderContent = () => {
    switch (widget.type) {
      case 'uptime':
        return <p className="text-3xl font-bold text-white">{stats.uptime ?? '---'}%</p>
      case 'statusBreakdown':
        return (
          <div className="flex gap-3 text-sm">
            <span className="flex items-center gap-1 text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-400" />{stats.upSites ?? 0} UP</span>
            <span className="flex items-center gap-1 text-red-200"><span className="h-2 w-2 rounded-full bg-red-400" />{stats.downSites ?? 0} DOWN</span>
            <span className="flex items-center gap-1 text-amber-200"><span className="h-2 w-2 rounded-full bg-amber-400" />{stats.pendingSites ?? 0} Pending</span>
          </div>
        )
      case 'responseTime':
        return <p className="text-3xl font-bold text-white">{stats.averageResponseTime ?? '---'}ms</p>
      case 'alertCount':
        return <p className="text-3xl font-bold text-white">{stats.alertCount ?? 0}</p>
      case 'sslSummary':
        return <p className="text-3xl font-bold text-white">{stats.sslValid ?? 0}<span className="text-base font-normal text-white/70">/{stats.sslTotal ?? 0} valid</span></p>
      case 'chart':
        return (
          <div className="flex flex-wrap gap-2">
            {stats.websites?.slice(0, 6).map((s: any) => (
              <span key={s.id} className="rounded bg-white/20 px-2 py-0.5 text-xs text-white">{s.name}</span>
            ))}
            {stats.websites?.length > 6 && <span className="text-xs text-white/60">+{stats.websites.length - 6}</span>}
          </div>
        )
      default:
        return <p className="text-white/70 text-sm">Unknown widget</p>
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br shadow-lg" style={{ background: `linear-gradient(135deg, ${bg.split(' ')[0].replace('from-', '')}, ${bg.split(' ')[1].replace('to-', '')})` }}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{widget.title}</p>
          <Tooltip text="Remove widget">
            <button onClick={onRemove} className="grid h-6 w-6 place-items-center rounded text-white/50 hover:bg-white/20 hover:text-white"><X className="h-3.5 w-3.5" /></button>
          </Tooltip>
        </div>
        <div className="mt-3">{renderContent()}</div>
      </div>
    </div>
  )
}

export default function DashboardsPage({ onClose, inline }: Props) {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [stats, setStats] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const d = loadDashboards()
      setDashboards(d)
      if (d.length > 0 && !activeId) setActiveId(d[0].id)
      const [statsData, websitesData] = await Promise.all([
        request<Record<string, any>>('/websites/stats').catch(() => ({})),
        request<{ items: any[] }>('/websites?pageSize=50').catch(() => ({ items: [] })),
      ])
      const alertData = await request<{ pagination: { total: number } }>('/alerts?pageSize=1').catch(() => ({ pagination: { total: 0 } }))
      setStats({ ...statsData, websites: websitesData.items, alertCount: alertData.pagination?.total || 0 })
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { void loadData() }, [])

  const activeDashboard = dashboards.find(d => d.id === activeId)

  const createDashboard = () => {
    const id = Date.now().toString(36)
    const newD: Dashboard = { id, name: `Dashboard ${dashboards.length + 1}`, widgets: [] }
    const updated = [...dashboards, newD]
    setDashboards(updated)
    saveDashboards(updated)
    setActiveId(id)
  }

  const deleteDashboard = (id: string) => {
    if (!window.confirm('Delete this dashboard?')) return
    const updated = dashboards.filter(d => d.id !== id)
    setDashboards(updated)
    saveDashboards(updated)
    if (activeId === id) setActiveId(updated.length > 0 ? updated[0].id : '')
  }

  const renameDashboard = () => {
    if (!editName.trim() || !activeDashboard) return
    const updated = dashboards.map(d => d.id === activeId ? { ...d, name: editName.trim() } : d)
    setDashboards(updated)
    saveDashboards(updated)
    setEditing(false)
  }

  const addWidget = (type: string) => {
    if (!activeDashboard) return
    const wt = WIDGET_TYPES.find(w => w.type === type)
    const widget: Widget = { id: Date.now().toString(36), type, title: wt?.label || type }
    const updated = dashboards.map(d => d.id === activeId ? { ...d, widgets: [...d.widgets, widget] } : d)
    setDashboards(updated)
    saveDashboards(updated)
  }

  const removeWidget = (widgetId: string) => {
    if (!activeDashboard) return
    const updated = dashboards.map(d => d.id === activeId ? { ...d, widgets: d.widgets.filter(w => w.id !== widgetId) } : d)
    setDashboards(updated)
    saveDashboards(updated)
  }

  const content = (
    <div className="animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Dashboards</h2>
        </div>
        <div className="flex items-center gap-2">
          {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
        </div>
      </div>

      {/* Dashboard tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {dashboards.map(d => (
          <button key={d.id} onClick={() => setActiveId(d.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
              activeId === d.id ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600'
            }`}>
            {d.name}
            <Tooltip text="Delete dashboard"><button onClick={(e) => { e.stopPropagation(); deleteDashboard(d.id) }} className="grid h-5 w-5 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><X className="h-3 w-3" /></button></Tooltip>
          </button>
        ))}
        <Tooltip text="Create a new dashboard">
          <button onClick={createDashboard} className="flex items-center gap-1 rounded-xl border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400"><Plus className="h-4 w-4" /> New</button>
        </Tooltip>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : dashboards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-12 text-center dark:border-slate-700 dark:bg-slate-900/80">
          <LayoutDashboard className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">No dashboards yet</p>
          <p className="mt-1 text-sm text-slate-500">Create your first dashboard to organize your monitoring data.</p>
          <button onClick={createDashboard} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Create Dashboard</button>
        </div>
      ) : activeDashboard ? (
        <div className="space-y-5">
          {/* Dashboard header */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80">
            <div className="flex items-center gap-3">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                    className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    onKeyDown={e => e.key === 'Enter' && renameDashboard()} />
                  <button onClick={renameDashboard} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Save</button>
                  <button onClick={() => setEditing(false)} className="text-xs text-slate-500">Cancel</button>
                </div>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{activeDashboard.name}</p>
                  <Tooltip text="Rename dashboard">
                    <button onClick={() => { setEditName(activeDashboard.name); setEditing(true) }} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><Edit3 className="h-3.5 w-3.5" /></button>
                  </Tooltip>
                </>
              )}
            </div>
            {/* Add widget dropdown */}
            <select onChange={e => { if (e.target.value) { addWidget(e.target.value); e.target.value = '' } }} value=""
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">+ Add Widget</option>
              {WIDGET_TYPES.map(w => <option key={w.type} value={w.type}>{w.label}</option>)}
            </select>
          </div>

          {/* Widget grid */}
          {activeDashboard.widgets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-600 dark:bg-slate-800/30">
              <BarChart3 className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Select a widget type above to add it to this dashboard.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeDashboard.widgets.map(w => (
                <DashboardWidget key={w.id} widget={w} stats={stats} onRemove={() => removeWidget(w.id)} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )

  if (inline) return content
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">{content}</div>
    </div>
  )
}

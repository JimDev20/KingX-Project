'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertCircle, AlertTriangle, BarChart3, Bell, CheckCircle2, Clock3, Code2, FileText,
  Globe2, History, Home, LayoutDashboard, Loader2, LogOut, Menu, Moon, Shield, Settings, Sun, Users, Webhook, Wrench,
} from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts'
import StatCard from './StatCard'
import WebsiteForm from './WebsiteForm'
import WebsiteTable from './WebsiteTable'
import UptimeChart from './UptimeChart'
import WebsiteEditModal from './WebsiteEditModal'
import TeamsPage from './TeamsPage'
import SettingsPage from './SettingsPage'
import AlertsPage from './AlertsPage'
import AdminPage from './AdminPage'
import LandingPage from './LandingPage'
import Tooltip from './Tooltip'
import ThemeProvider, { useTheme } from './ThemeProvider'
import Skeleton, { SkeletonCard, SkeletonChart, SkeletonRow } from './Skeleton'
import MaintenancePage from './MaintenancePage'
import IncidentsPage from './IncidentsPage'
import ForgotPasswordModal from './ForgotPasswordModal'
import NotificationsPage from './NotificationsPage'
import SslMonitorPage from './SslMonitorPage'
import ReportsPage from './ReportsPage'
import AuditLogPage from './AuditLogPage'
import WebhooksPage from './WebhooksPage'
import StatusBadgePage from './StatusBadgePage'
import DashboardsPage from './DashboardsPage'
import EventTimelinePage from './EventTimelinePage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface User { id: string; email: string; fullName: string; role: string; isVerified: boolean }
interface Website {
  id: string; name: string; url: string; method: string; checkInterval: number
  timeout: number; status: string
  lastChecked: string | null; responseTime: number | null; uptime: number; tags: string[]
  keywordCheck?: string | null; keywordType?: string | null
}
interface Stats {
  totalSites: number; upSites: number; downSites: number
  pendingSites: number; uptime: number; averageResponseTime: number
}

const emptyStats: Stats = { totalSites: 0, upSites: 0, downSites: 0, pendingSites: 0, uptime: 100, averageResponseTime: 0 }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options)
  const payload = res.status === 204 ? null : await res.json()
  if (!res.ok) throw new Error(payload?.error || 'Request failed')
  return payload as T
}

type Page = 'home' | 'websites' | 'analytics' | 'alerts' | 'team' | 'maintenance' | 'incidents' | 'settings' | 'notifications' | 'ssl' | 'reports' | 'audit' | 'webhooks' | 'badge' | 'dashboards' | 'events' | 'admin'

const pageLabels: Record<Page, string> = {
  home: 'Home', websites: 'Websites', analytics: 'Analytics', alerts: 'Alerts',
  team: 'Team', maintenance: 'Maintenance', incidents: 'Incidents', settings: 'Settings',
  notifications: 'Notifications', ssl: 'SSL Monitor', reports: 'Reports', audit: 'Audit Log',
  webhooks: 'Webhooks', badge: 'Status Badge', dashboards: 'Dashboards', events: 'Events', admin: 'Admin',
}

function DashboardInner() {
  const { theme, toggleTheme } = useTheme()
  const [token, setToken] = useState(() => typeof window === 'undefined' ? '' : localStorage.getItem('kingx_token') || '')
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const s = localStorage.getItem('kingx_user')
    return s ? JSON.parse(s) : null
  })
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '' })
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [siteForm, setSiteForm] = useState({ name: '', url: '', method: 'GET', tags: '', checkInterval: '300', keywordCheck: '', keywordType: 'CONTAINS' })
  const [websites, setWebsites] = useState<Website[]>([])
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [checkingId, setCheckingId] = useState('')
  const [message, setMessage] = useState('')
  const [selectedWebsite, setSelectedWebsite] = useState<{ id: string; name: string } | null>(null)
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showForgotPw, setShowForgotPw] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsHistory, setAnalyticsHistory] = useState<{ time: string; ms: number }[]>([])
  const [pageKey, setPageKey] = useState(0)
  const authDialogRef = useRef<HTMLDivElement>(null)

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }), [token])

  const loadDashboard = useCallback(async (activeToken = token) => {
    if (!activeToken) return
    setLoading(true); setMessage('')
    try {
      const h = { Authorization: `Bearer ${activeToken}` }
      const [sitesRes, statsRes] = await Promise.all([
        request<{ items: Website[] }>('/websites?pageSize=50', { headers: h }),
        request<Stats>('/websites/stats', { headers: h }),
      ])
      setWebsites(sitesRes.items); setStats(statsRes)
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed to load') }
    finally { setLoading(false) }
  }, [token])

  useEffect(() => {
    if (token) { const id = window.setTimeout(() => void loadDashboard(token), 0); return () => window.clearTimeout(id) }
  }, [loadDashboard, token])

  useEffect(() => {
    if (!token || !autoRefresh || currentPage !== 'home') return
    const id = setInterval(async () => {
      setRefreshing(true)
      await loadDashboard()
      setRefreshing(false)
    }, 30000)
    return () => clearInterval(id)
  }, [token, autoRefresh, currentPage, loadDashboard])

  useEffect(() => {
    setPageKey(k => k + 1)
  }, [currentPage])

  useEffect(() => {
    if (!showAuthModal) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showForgotPw) {
        setShowAuthModal(false)
        setMessage('')
        return
      }
      if (event.key !== 'Tab' || showForgotPw) return
      const dialog = authDialogRef.current
      if (!dialog) return
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, [href]')).filter(el => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [showAuthModal, showForgotPw])

  useEffect(() => {
    if (currentPage !== 'analytics' || websites.length === 0) return
    const first = websites[0]
    const base = API_URL
    const t = token
    fetch(`${base}/websites/${first.id}/history?limit=50`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => {
        const h = (d.history || []).reverse()
        setAnalyticsHistory(h.filter((e: { responseTime: number | null }) => e.responseTime != null).map((e: { timestamp: string; responseTime: number }) => ({
          time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ms: e.responseTime,
        })))
      })
      .catch(() => {})
  }, [currentPage, websites, token])

  const handleAuth = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault(); setLoading(true); setMessage('')
    try {
      const body = authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password }
      const res = await request<{ token: string; user: User }>(`/auth/${authMode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      })
      localStorage.setItem('kingx_token', res.token); localStorage.setItem('kingx_user', JSON.stringify(res.user))
      setToken(res.token); setUser(res.user); setAuthForm({ fullName: '', email: '', password: '' })
      return true
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Authentication failed'); return false }
    finally { setLoading(false) }
  }

  const handleLogout = () => {
    localStorage.removeItem('kingx_token'); localStorage.removeItem('kingx_user')
    setToken(''); setUser(null); setWebsites([]); setStats(emptyStats); setCurrentPage('home')
  }

  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage('')
    try {
      const keywordCheck = siteForm.keywordCheck.trim() || null
      await request('/websites', { method: 'POST', headers: authHeaders, body: JSON.stringify({
        name: siteForm.name,
        url: siteForm.url,
        method: siteForm.method,
        checkInterval: Number(siteForm.checkInterval),
        keywordCheck,
        keywordType: keywordCheck ? siteForm.keywordType : null,
        tags: siteForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      }) })
      setSiteForm({ name: '', url: '', method: 'GET', tags: '', checkInterval: '300', keywordCheck: '', keywordType: 'CONTAINS' }); await loadDashboard()
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed') }
    finally { setLoading(false) }
  }

  const handleCheckWebsite = async (id: string) => {
    setCheckingId(id); setMessage('')
    try { await request(`/websites/${id}/check`, { method: 'POST', headers: authHeaders }); await loadDashboard() }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Check failed') }
    finally { setCheckingId('') }
  }

  const handleDeleteWebsite = async (id: string) => {
    if (!window.confirm('Delete this website?')) return; setMessage('')
    try { await request(`/websites/${id}`, { method: 'DELETE', headers: authHeaders }); await loadDashboard() }
    catch (err) { setMessage(err instanceof Error ? err.message : 'Delete failed') }
  }

  const handleSiteFormChange = (field: string, value: string) => setSiteForm(prev => ({ ...prev, [field]: value }))

  const nav = (id: Page) => { setCurrentPage(id); setSidebarOpen(false); setPageKey(k => k + 1) }

  if (!user) {
    return (
      <>
        <LandingPage onOpenAuth={(mode) => { setAuthMode(mode ?? 'login'); setShowAuthModal(true) }} />
        {showAuthModal && !showForgotPw && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div ref={authDialogRef} role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md rounded-[4px] border border-white/10 bg-[#131824] shadow-2xl" style={{ fontFamily: 'var(--font-hanken), "Hanken Grotesk", Arial, sans-serif' }}>
              <div className="flex items-center justify-between px-6 py-5">
                <h2 id="auth-title" className="text-2xl font-medium tracking-[-0.03em] text-[#e9edf3]">{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
                <button type="button" onClick={() => { setShowAuthModal(false); setShowForgotPw(false); setMessage('') }} className="text-sm text-[#8891a1] transition-colors hover:text-white">Close</button>
              </div>
              <div className="px-6 pb-6">
                <div role="group" aria-label="Account access" className="mb-6 grid grid-cols-2 gap-1 rounded-[4px] bg-[#0a0d14] p-1">
                  {(['login', 'register'] as const).map(m => (
                    <button key={m} type="button" aria-pressed={authMode === m} onClick={() => { setAuthMode(m); setMessage('') }}
                      className={`h-10 rounded-[3px] text-sm font-medium transition-colors ${authMode === m ? 'bg-[#1b2231] text-[#e9edf3]' : 'text-[#8891a1] hover:text-[#e9edf3]'}`}>{m === 'login' ? 'Sign in' : 'Create account'}</button>
                  ))}
                </div>
                <form onSubmit={async (e) => { const ok = await handleAuth(e); if (ok) setShowAuthModal(false) }}>
                  {authMode === 'register' && (
                    <label className="mb-4 block text-sm font-medium text-[#b4bdca]">Full name
                      <input value={authForm.fullName} onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                        className="mt-1.5 h-11 w-full rounded-[3px] border border-white/25 bg-[#0a0d14] px-3 text-sm text-[#e9edf3] outline-none transition-colors placeholder:text-[#8891a1] focus:border-[#5a9bfc]" autoComplete="name" placeholder="Your name" autoFocus />
                    </label>
                  )}
                  <label className="mb-4 block text-sm font-medium text-[#b4bdca]">Email
                    <input value={authForm.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[3px] border border-white/25 bg-[#0a0d14] px-3 text-sm text-[#e9edf3] outline-none transition-colors placeholder:text-[#8891a1] focus:border-[#5a9bfc]" autoComplete="email" type="email" placeholder="you@company.com" autoFocus />
                  </label>
                  <label className="mb-5 block text-sm font-medium text-[#b4bdca]">Password
                    <input value={authForm.password} onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[3px] border border-white/25 bg-[#0a0d14] px-3 text-sm text-[#e9edf3] outline-none transition-colors placeholder:text-[#8891a1] focus:border-[#5a9bfc]"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} type="password" placeholder={authMode === 'login' ? 'Your password' : 'At least 6 characters'} />
                  </label>
                  {message && <div role="alert" className="mb-4 rounded-[3px] border border-[#f08c8c]/40 bg-[#f08c8c]/10 px-4 py-2.5 text-sm text-[#f08c8c]">{message}</div>}
                  {authMode === 'login' && (
                    <button type="button" onClick={() => { setShowForgotPw(true); setMessage('') }} className="mb-4 text-sm font-medium text-[#5a9bfc] transition-colors hover:text-[#7db0ff]">Forgot password?</button>
                  )}
                  <button type="submit" disabled={loading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-[3px] bg-[#5a9bfc] text-sm font-medium text-[#06101f] transition-colors hover:bg-[#7db0ff] disabled:opacity-60">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}{authMode === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {showForgotPw && <ForgotPasswordModal onClose={() => setShowForgotPw(false)} onSwitchToLogin={() => { setAuthMode('login'); setShowForgotPw(false) }} />}
      </>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        if (loading && websites.length === 0) {
          return (
            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
                <Skeleton className="mb-2 h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
              <SkeletonChart />
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
                <Skeleton className="mb-4 h-4 w-28" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[1,2,3,4,5,6].map(i => <SkeletonRow key={i} />)}
                </div>
              </div>
            </section>
          )
        }
        return (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 p-5 dark:border-slate-700/80 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Welcome back, {user.fullName?.split(' ')[0] || 'there'}</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {stats.totalSites > 0
                  ? `Monitoring ${stats.totalSites} website${stats.totalSites > 1 ? 's' : ''} — ${stats.upSites} up, ${stats.downSites} down`
                  : 'Add your first website below to start monitoring'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={<Tooltip text="Total monitored websites"><Globe2 className="h-5 w-5" /></Tooltip>} label="Total Sites" value={stats.totalSites} tone="indigo" />
              <StatCard icon={<Tooltip text="Overall uptime across all websites"><CheckCircle2 className="h-5 w-5" /></Tooltip>} label="Uptime" value={`${stats.uptime}%`} tone="emerald" />
              <StatCard icon={<Tooltip text="Websites currently experiencing downtime"><AlertTriangle className="h-5 w-5" /></Tooltip>} label="Down" value={stats.downSites} tone="red" />
              <StatCard icon={<Tooltip text="Average response time across all monitored sites"><Clock3 className="h-5 w-5" /></Tooltip>} label="Avg Response" value={`${stats.averageResponseTime}ms`} tone="amber" />
            </div>

            {stats.totalSites > 0 && (
              <>
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                  <div className="flex h-2 overflow-hidden">
                    <div style={{ flex: stats.upSites }} className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all" />
                    <div style={{ flex: stats.downSites }} className="bg-gradient-to-r from-red-400 to-red-500 transition-all" />
                    <div style={{ flex: stats.pendingSites }} className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all" />
                  </div>
                  <div className="flex items-center gap-6 px-5 py-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> {stats.upSites} up</span>
                    {stats.downSites > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> {stats.downSites} down</span>}
                    {stats.pendingSites > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> {stats.pendingSites} pending</span>}
                    {refreshing && <span className="ml-auto text-indigo-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> refreshing</span>}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
                  <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Response Time by Website</p>
                  {websites.filter(w => w.responseTime).length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={websites.filter(w => w.responseTime).slice(0, 15).map(w => ({ name: w.name.length > 12 ? w.name.slice(0, 12) + '..' : w.name, ms: w.responseTime }))} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit="ms" />
                          <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Bar dataKey="ms" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-400">No response time data yet</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
                  <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Monitor Status</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {websites.slice(0, 12).map(s => {
                      const isUp = s.status === 'UP'
                      const isDown = s.status === 'DOWN'
                      return (
                        <button key={s.id} onClick={() => { setCurrentPage('websites'); setSelectedWebsite({ id: s.id, name: s.name }) }}
                          className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md ${
                            isDown
                              ? 'border-red-200 bg-red-50/50 hover:border-red-300 dark:border-red-800/50 dark:bg-red-900/10'
                              : 'border-slate-200 bg-white hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-700'
                          }`}>
                          <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                            isUp ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                            isDown ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {isUp ? <CheckCircle2 className="h-5 w-5" /> :
                             isDown ? <AlertTriangle className="h-5 w-5" /> :
                             <Clock3 className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className={`font-semibold ${isUp ? 'text-emerald-600 dark:text-emerald-400' : isDown ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{s.status}</span>
                              <span>{s.uptime.toFixed(1)}%</span>
                              {s.responseTime && <span>{s.responseTime}ms</span>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {websites.length > 12 && (
                    <p className="mt-3 text-center text-xs text-slate-400">+{websites.length - 12} more sites</p>
                  )}
                </div>
              </>
            )}

            {!stats.totalSites && (
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-8 text-center dark:border-slate-700/80 dark:bg-slate-900/80">
                <Globe2 className="mx-auto mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No websites yet</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Go to Websites to add your first monitor</p>
                <button onClick={() => setCurrentPage('websites')} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Add Website</button>
              </div>
            )}
          </section>
        )
      case 'websites':
        return (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-4">
              <WebsiteForm siteForm={siteForm} loading={loading} onSubmit={handleCreateWebsite} onChange={handleSiteFormChange} />
            </aside>
            <section className="min-w-0 space-y-6">
              <WebsiteTable websites={websites} search={search} statusFilter={statusFilter} checkingId={checkingId}
                loading={loading} message={message} onSearchChange={setSearch} onStatusFilterChange={setStatusFilter}
                onRefresh={() => loadDashboard()} onCheck={handleCheckWebsite} onDelete={handleDeleteWebsite}
                onViewHistory={id => { const s = websites.find(w => w.id === id); if (s) setSelectedWebsite({ id: s.id, name: s.name }) }}
                onEdit={site => setEditingWebsite(site)} />
            </section>
          </div>
        )
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analytics</h2>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Performance overview and response time history</p>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard icon={<Tooltip text="Total monitored websites"><Globe2 className="h-5 w-5" /></Tooltip>} label="Total Sites" value={stats.totalSites} tone="indigo" />
              <StatCard icon={<Tooltip text="Overall uptime across all websites"><CheckCircle2 className="h-5 w-5" /></Tooltip>} label="Uptime" value={`${stats.uptime}%`} tone="emerald" />
              <StatCard icon={<Tooltip text="Websites currently down"><AlertTriangle className="h-5 w-5" /></Tooltip>} label="Down" value={stats.downSites} tone="red" />
              <StatCard icon={<Tooltip text="Average response time"><Clock3 className="h-5 w-5" /></Tooltip>} label="Avg Response" value={`${stats.averageResponseTime}ms`} tone="amber" />
            </div>

            {stats.totalSites > 0 && (
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
                <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Website Status Overview</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {websites.slice(0, 12).map(s => {
                    const isUp = s.status === 'UP'
                    const isDown = s.status === 'DOWN'
                    return (
                      <button key={s.id} onClick={() => setSelectedWebsite({ id: s.id, name: s.name })}
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md ${
                          isDown
                            ? 'border-red-200 bg-red-50/50 hover:border-red-300 dark:border-red-800/50 dark:bg-red-900/10'
                            : 'border-slate-200 bg-white hover:border-indigo-200 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-indigo-700'
                        }`}>
                        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                          isUp ? 'bg-emerald-100 text-emerald-600' :
                          isDown ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {isUp ? <CheckCircle2 className="h-5 w-5" /> :
                           isDown ? <AlertTriangle className="h-5 w-5" /> :
                           <Clock3 className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.name}</p>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className={`font-semibold ${isUp ? 'text-emerald-600' : isDown ? 'text-red-600' : 'text-amber-600'}`}>
                              {s.status}
                            </span>
                            <span>{s.uptime.toFixed(1)}% uptime</span>
                            {s.responseTime && <span>{s.responseTime}ms</span>}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
                {websites.length > 12 && (
                  <p className="mt-3 text-center text-xs text-slate-400">+{websites.length - 12} more sites</p>
                )}
              </div>
            )}

            {websites.length > 0 && (
              <>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
                  <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Response Time Chart</p>
                  {analyticsHistory.length > 1 ? (
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit="ms" />
                          <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <Line type="monotone" dataKey="ms" stroke="#6366f1" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="py-6 text-center text-sm text-slate-400">Not enough response time data yet</p>
                  )}
                  <p className="mt-3 text-xs text-slate-400">Showing data for <span className="font-semibold text-slate-600 dark:text-slate-300">{websites[0]?.name}</span></p>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm p-5 dark:border-slate-700/80 dark:bg-slate-900/80">
                  <p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Response Time History</p>
                  <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">Click a website below to view its detailed response time chart over the last 24 hours</p>
                  <div className="flex flex-wrap gap-2">
                    {websites.slice(0, 10).map(s => (
                      <button key={s.id} onClick={() => setSelectedWebsite({ id: s.id, name: s.name })}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-800 dark:hover:bg-indigo-900/20">
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      case 'alerts':
        return <AlertsPage inline />
      case 'team':
        return <TeamsPage inline />
      case 'maintenance':
        return <MaintenancePage inline />
      case 'incidents':
        return <IncidentsPage inline />
      case 'settings':
        return <SettingsPage inline />
      case 'notifications':
        return <NotificationsPage inline />
      case 'ssl':
        return <SslMonitorPage inline />
      case 'reports':
        return <ReportsPage inline />
      case 'audit':
        return <AuditLogPage inline />
      case 'webhooks':
        return <WebhooksPage inline />
      case 'dashboards':
        return <DashboardsPage inline />
      case 'events':
        return <EventTimelinePage inline />
      case 'badge':
        return <StatusBadgePage inline />
      case 'admin':
        return <AdminPage inline />
      default:
        return <div className="grid place-items-center py-20 text-slate-500">Select a page from the sidebar</div>
    }
  }

  const navItems: { id: Page; label: string; icon: React.ElementType; badge?: string; badgeColor?: string }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'websites', label: 'Websites', icon: Globe2 },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'incidents', label: 'Incidents', icon: AlertCircle },
    { id: 'ssl', label: 'SSL Monitor', icon: Shield },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'dashboards', label: 'Dashboards', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: History },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'badge', label: 'Status Badge', icon: Code2 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Activity },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
    ...(user.role === 'SUPERADMIN' ? [{ id: 'admin' as Page, label: 'Admin', icon: Shield, badge: 'Super', badgeColor: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' }] : []),
  ]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-200 transition-transform dark:border-slate-800 dark:bg-slate-900 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-3 border-b border-slate-200/80 px-5 dark:border-slate-800/80">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-800">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">KingX</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button key={item.id} onClick={() => nav(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate leading-none">{item.label}</span>
                {item.badge && <span className={`ml-auto rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${item.badgeColor || 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{item.badge}</span>}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-slate-200/80 p-3 dark:border-slate-800/80">
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50/50 p-3 dark:from-slate-800/50 dark:to-indigo-900/20">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-xs font-bold text-white shadow-md">{user.fullName?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.fullName || user.email}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
            <Tooltip text="Toggle between light and dark mode">
              <button onClick={toggleTheme} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </Tooltip>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20">
          <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
          <header className="flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-900/80">
          <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white">KingX</span>
          </div>

          <div className="hidden items-center gap-2 text-sm text-slate-500 lg:flex dark:text-slate-400">
            <Home className="h-4 w-4" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{pageLabels[currentPage]}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {currentPage === 'home' && (
              <Tooltip text={autoRefresh ? 'Auto-refresh every 30s (click to disable)' : 'Auto-refresh is off (click to enable)'}>
                <button onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`grid h-8 w-8 place-items-center rounded-lg transition-all ${autoRefresh ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                  <Activity className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </Tooltip>
            )}
            <div className="hidden items-center gap-2.5 rounded-xl bg-slate-100/80 px-3.5 py-2 text-xs font-medium text-slate-600 md:flex dark:bg-slate-800/80 dark:text-slate-400">
              <Tooltip text="Current overall system status">
                <div className={`relative h-2 w-2 ${stats.downSites === 0 ? 'bg-emerald-500' : 'bg-red-500'} rounded-full ${stats.downSites === 0 ? 'animate-pulse' : ''}`} />
              </Tooltip>
              <span className="hidden sm:inline">{stats.downSites === 0 ? 'All systems operational' : `${stats.downSites} site${stats.downSites > 1 ? 's' : ''} down`}</span>
              <span className="sm:hidden">{stats.downSites === 0 ? 'All good' : `${stats.downSites} down`}</span>
            </div>
            <Tooltip text="Sign out of your account">
              <button onClick={handleLogout} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <LogOut className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </header>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {message && (
            <div className={`mb-6 rounded-xl border px-5 py-3 text-sm ${
              message.includes('successfully') || message.includes('updated') || message.includes('changed')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>{message}</div>
          )}
          <div key={pageKey} className="animate-fadeIn">
            {renderPage()}
          </div>
        </main>
      </div>

      {selectedWebsite && <UptimeChart websiteId={selectedWebsite.id} websiteName={selectedWebsite.name} onClose={() => setSelectedWebsite(null)} />}
      {editingWebsite && <WebsiteEditModal website={editingWebsite} onClose={() => setEditingWebsite(null)} onSaved={() => loadDashboard()} />}
    </div>
  )
}

export default function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardInner />
    </ThemeProvider>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Bell, CheckCircle2, Clock3, Globe2, Loader2, LogOut, Shield, Users, Settings, Wrench, AlertCircle, X } from 'lucide-react'
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
import ThemeProvider from './ThemeProvider'
import MaintenancePage from './MaintenancePage'
import IncidentsPage from './IncidentsPage'
import ForgotPasswordModal from './ForgotPasswordModal'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface User { id: string; email: string; fullName: string; role: string; isVerified: boolean }

interface Website {
  id: string; name: string; url: string; method: string; checkInterval: number
  timeout: number; status: string
  lastChecked: string | null; responseTime: number | null; uptime: number; tags: string[]
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

function DashboardInner() {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('kingx_token') || ''
  })
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('kingx_user')
    return saved ? JSON.parse(saved) : null
  })
  const [authForm, setAuthForm] = useState({ fullName: '', email: '', password: '' })
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [siteForm, setSiteForm] = useState({ name: '', url: '', method: 'GET', tags: '' })
  const [websites, setWebsites] = useState<Website[]>([])
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [loading, setLoading] = useState(false)
  const [checkingId, setCheckingId] = useState('')
  const [message, setMessage] = useState('')
  const [selectedWebsite, setSelectedWebsite] = useState<{ id: string; name: string } | null>(null)
  const [editingWebsite, setEditingWebsite] = useState<Website | null>(null)
  const [showTeams, setShowTeams] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showMaintenance, setShowMaintenance] = useState(false)
  const [showIncidents, setShowIncidents] = useState(false)
  const [showForgotPw, setShowForgotPw] = useState(false)

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token])

  const loadDashboard = useCallback(async (activeToken = token) => {
    if (!activeToken) return
    setLoading(true)
    setMessage('')
    try {
      const h = { Authorization: `Bearer ${activeToken}` }
      const [sitesRes, statsRes] = await Promise.all([
        request<{ items: Website[] }>('/websites?pageSize=50', { headers: h }),
        request<Stats>('/websites/stats', { headers: h }),
      ])
      setWebsites(sitesRes.items)
      setStats(statsRes)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      const id = window.setTimeout(() => { void loadDashboard(token) }, 0)
      return () => window.clearTimeout(id)
    }
  }, [loadDashboard, token])

  const handleAuth = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const body = authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password }
      const res = await request<{ token: string; user: User }>(`/auth/${authMode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      localStorage.setItem('kingx_token', res.token)
      localStorage.setItem('kingx_user', JSON.stringify(res.user))
      setToken(res.token)
      setUser(res.user)
      setAuthForm({ fullName: '', email: '', password: '' })
      return true
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Authentication failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('kingx_token')
    localStorage.removeItem('kingx_user')
    setToken('')
    setUser(null)
    setWebsites([])
    setStats(emptyStats)
  }

  const handleCreateWebsite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      await request('/websites', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...siteForm,
          tags: siteForm.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      setSiteForm({ name: '', url: '', method: 'GET', tags: '' })
      await loadDashboard()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add website')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckWebsite = async (id: string) => {
    setCheckingId(id)
    setMessage('')
    try {
      await request(`/websites/${id}/check`, { method: 'POST', headers: authHeaders })
      await loadDashboard()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Check failed')
    } finally {
      setCheckingId('')
    }
  }

  const handleDeleteWebsite = async (id: string) => {
    if (!window.confirm('Delete this website?')) return
    setMessage('')
    try {
      await request(`/websites/${id}`, { method: 'DELETE', headers: authHeaders })
      await loadDashboard()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleSiteFormChange = (field: string, value: string) => {
    setSiteForm((prev) => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return (
      <>
        <LandingPage onOpenAuth={() => setShowAuthModal(true)} />

        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {authMode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <button onClick={() => { setShowAuthModal(false); setShowForgotPw(false); setMessage('') }} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                  {(['login', 'register'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setAuthMode(mode); setMessage('') }}
                      className={`h-10 flex-1 rounded-md text-sm font-semibold capitalize transition-all ${
                        authMode === mode
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <form onSubmit={async (e) => { const ok = await handleAuth(e); if (ok) setShowAuthModal(false) }}>
                  {authMode === 'register' && (
                    <label className="mb-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Full name
                      <input
                        value={authForm.fullName}
                        onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                        className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                        autoComplete="name"
                        placeholder="John Doe"
                      />
                    </label>
                  )}

                  <label className="mb-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                    <input
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      autoComplete="email"
                      type="email"
                      placeholder="john@example.com"
                    />
                  </label>

                  <label className="mb-5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                    <input
                      value={authForm.password}
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                      autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                      type="password"
                      placeholder={authMode === 'login' ? 'Enter your password' : 'Create a password'}
                    />
                  </label>

                  {message && (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                      {message}
                    </div>
                  )}

                  {authMode === 'login' && (
                    <button type="button" onClick={() => { setShowForgotPw(true); setMessage('') }}
                      className="mb-4 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                      Forgot password?
                    </button>
                  )}

                  <Tooltip text={authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 font-semibold text-white transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {authMode === 'login' ? 'Sign in' : 'Create account'}
                    </button>
                  </Tooltip>
                </form>
              </div>
            </div>
          </div>
        )}

        {showForgotPw && (
          <ForgotPasswordModal
            onClose={() => setShowForgotPw(false)}
            onSwitchToLogin={() => { setAuthMode('login'); setShowForgotPw(false) }}
          />
        )}
      </>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
              <Activity className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-900 dark:text-white">KingX Monitor</p>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Tooltip text="View and manage alert rules and history">
              <button type="button" onClick={() => setShowAlerts(true)} title="Alerts"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-amber-800 dark:hover:bg-amber-900/20 dark:hover:text-amber-400">
                <Bell className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip text="Schedule maintenance windows to suppress alerts">
              <button type="button" onClick={() => setShowMaintenance(true)} title="Maintenance"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-800 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                <Wrench className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip text="View incident history and downtime events">
              <button type="button" onClick={() => setShowIncidents(true)} title="Incidents"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                <AlertCircle className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip text="Manage your team and invite members">
              <button type="button" onClick={() => setShowTeams(true)} title="Teams"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-800 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
                <Users className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip text="Account settings and API keys">
              <button type="button" onClick={() => setShowSettings(true)} title="Settings"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-800 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400">
                <Settings className="h-5 w-5" />
              </button>
            </Tooltip>
            {user.role === 'superadmin' && (
              <Tooltip text="Admin panel — manage users and system stats">
                <button type="button" onClick={() => setShowAdmin(true)} title="Admin"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-purple-800 dark:hover:bg-purple-900/20 dark:hover:text-purple-400">
                  <Shield className="h-5 w-5" />
                </button>
              </Tooltip>
            )}
            <Tooltip text="Sign out of your account">
              <button type="button" onClick={handleLogout} title="Sign out"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-800 dark:hover:bg-red-900/20 dark:hover:text-red-400">
                <LogOut className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="space-y-4">
          <WebsiteForm
            siteForm={siteForm}
            loading={loading}
            onSubmit={handleCreateWebsite}
            onChange={handleSiteFormChange}
          />
        </aside>

        <section className="min-w-0 space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Tooltip text="Total number of monitored websites"><Globe2 className="h-5 w-5" /></Tooltip>} label="Total Sites" value={stats.totalSites} tone="indigo" />
            <StatCard icon={<Tooltip text="Overall uptime percentage across all sites"><CheckCircle2 className="h-5 w-5" /></Tooltip>} label="Uptime" value={`${stats.uptime}%`} tone="emerald" />
            <StatCard icon={<Tooltip text="Websites currently down"><AlertTriangle className="h-5 w-5" /></Tooltip>} label="Down" value={stats.downSites} tone="red" />
            <StatCard icon={<Tooltip text="Average response time across all checks"><Clock3 className="h-5 w-5" /></Tooltip>} label="Avg Response" value={`${stats.averageResponseTime}ms`} tone="amber" />
          </div>

          <WebsiteTable
            websites={websites}
            search={search}
            statusFilter={statusFilter}
            checkingId={checkingId}
            loading={loading}
            message={message}
            onSearchChange={setSearch}
            onStatusFilterChange={setStatusFilter}
            onRefresh={() => loadDashboard()}
            onCheck={handleCheckWebsite}
            onDelete={handleDeleteWebsite}
            onViewHistory={(id) => {
              const site = websites.find((w) => w.id === id)
              if (site) setSelectedWebsite({ id: site.id, name: site.name })
            }}
            onEdit={(site) => setEditingWebsite(site)}
          />
        </section>
      </div>

      {selectedWebsite && (
        <UptimeChart
          websiteId={selectedWebsite.id}
          websiteName={selectedWebsite.name}
          onClose={() => setSelectedWebsite(null)}
        />
      )}

      {editingWebsite && (
        <WebsiteEditModal
          website={editingWebsite}
          onClose={() => setEditingWebsite(null)}
          onSaved={() => loadDashboard()}
        />
      )}

      {showTeams && (
        <TeamsPage onClose={() => setShowTeams(false)} />
      )}

      {showSettings && (
        <SettingsPage onClose={() => setShowSettings(false)} />
      )}

      {showAlerts && (
        <AlertsPage onClose={() => setShowAlerts(false)} />
      )}

      {showAdmin && (
        <AdminPage onClose={() => setShowAdmin(false)} />
      )}

      {showMaintenance && (
        <MaintenancePage onClose={() => setShowMaintenance(false)} />
      )}

      {showIncidents && (
        <IncidentsPage onClose={() => setShowIncidents(false)} />
      )}
    </main>
  )
}

export default function Dashboard() {
  return (
    <ThemeProvider>
      <DashboardInner />
    </ThemeProvider>
  )
}

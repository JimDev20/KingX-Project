'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Bell, CheckCircle2, Clock3, Globe2, Loader2, LogOut, Shield, Users, Settings } from 'lucide-react'
import StatCard from './StatCard'
import WebsiteForm from './WebsiteForm'
import WebsiteTable from './WebsiteTable'
import UptimeChart from './UptimeChart'
import WebsiteEditModal from './WebsiteEditModal'
import TeamsPage from './TeamsPage'
import SettingsPage from './SettingsPage'
import AlertsPage from './AlertsPage'
import AdminPage from './AdminPage'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface User { id: string; email: string; fullName: string; role: string; isVerified: boolean }

interface Website {
  id: string; name: string; url: string; method: string; checkInterval: number
  timeout: number; status: 'UP' | 'DOWN' | 'PENDING' | 'MAINTENANCE'
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

export default function Dashboard() {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('kingx_token') || ''
  })
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem('kingx_user')
    return saved ? JSON.parse(saved) as User : null
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

  const handleAuth = async (e: React.FormEvent) => {
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
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Authentication failed')
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
      await request('/websites', { method: 'POST', headers: authHeaders, body: JSON.stringify(siteForm) })
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
    setLoading(true)
    setMessage('')
    try {
      await request(`/websites/${id}`, { method: 'DELETE', headers: authHeaders })
      await loadDashboard()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSiteFormChange = (field: string, value: string) => {
    setSiteForm(prev => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f8fafc] text-slate-950">
        <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-8 text-white lg:p-12">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500 text-emerald-950">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">KingX</span>
            </div>

            <div className="max-w-2xl py-16">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Uptime Monitor v2
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Monitor everything.{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                  Stay online.
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
                Track uptime, response time, and incidents across all your websites from a single dashboard.
              </p>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ['Live Checks', 'On-demand and scheduled status checks with response time tracking.'],
                  ['Team Workspaces', 'Collaborate with your team and manage access permissions.'],
                  ['Instant Alerts', 'Get notified via email when your sites go down.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition hover:bg-white/10">
                    <p className="font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Open source &bull; Powered by TypeScript + PostgreSQL
            </p>
          </div>

          <div className="flex items-center justify-center p-6">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
                <p className="mt-1 text-slate-500">
                  {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
                  {(['login', 'register'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => { setAuthMode(mode); setMessage('') }}
                      className={`h-10 flex-1 rounded-md text-sm font-semibold capitalize transition-all ${
                        authMode === mode
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                {authMode === 'register' && (
                  <label className="mb-4 block text-sm font-medium text-slate-700">
                    Full name
                    <input
                      value={authForm.fullName}
                      onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      autoComplete="name"
                      placeholder="John Doe"
                    />
                  </label>
                )}

                <label className="mb-4 block text-sm font-medium text-slate-700">
                  Email
                  <input
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    autoComplete="email"
                    type="email"
                    placeholder="john@example.com"
                  />
                </label>

                <label className="mb-5 block text-sm font-medium text-slate-700">
                  Password
                  <input
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                    type="password"
                    placeholder={authMode === 'login' ? 'Enter your password' : 'Create a password'}
                  />
                </label>

                {message && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {authMode === 'login' ? 'Sign in' : 'Create account'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-emerald-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">KingX Monitor</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAlerts(true)}
              title="Alerts"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowTeams(true)}
              title="Teams"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Users className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              title="Settings"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Settings className="h-5 w-5" />
            </button>
            {user.role === 'SUPERADMIN' && (
              <button
                type="button"
                onClick={() => setShowAdmin(true)}
                title="Admin"
                className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600"
              >
                <Shield className="h-5 w-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out"
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </button>
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

        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={<Globe2 className="h-5 w-5" />} label="Total Sites" value={stats.totalSites} tone="indigo" />
            <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Uptime" value={`${stats.uptime}%`} tone="emerald" />
            <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Down" value={stats.downSites} tone="red" />
            <StatCard icon={<Clock3 className="h-5 w-5" />} label="Avg Response" value={`${stats.averageResponseTime}ms`} tone="amber" />
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
    </main>
  )
}

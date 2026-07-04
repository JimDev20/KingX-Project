'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Plus, X, Loader2, Trash2, Mail } from 'lucide-react'
import { SkeletonRow } from './Skeleton'
import Tooltip from './Tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface AlertRule {
  id: string
  websiteId: string
  type: string
  recipients: string[]
  isEnabled: boolean
  threshold: number
  website: { name: string; url: string }
}

interface Alert {
  id: string
  type: string
  severity: string
  status: string
  message: string
  createdAt: string
  onCallUserId?: string | null
  onCallUser?: { id: string; fullName: string; email: string } | null
  website: { name: string; url: string }
}

interface Props {
  onClose?: () => void
  inline?: boolean
}

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

export default function AlertsPage({ onClose, inline }: Props) {
  const [rules, setRules] = useState<AlertRule[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ websiteId: '', type: 'EMAIL', recipients: '', threshold: '1' })
  const [tab, setTab] = useState<'rules' | 'history'>('rules')

  const loadData = async () => {
    setLoading(true)
    setMessage('')
    try {
      const [rulesRes, alertsRes] = await Promise.all([
        request<{ items: AlertRule[] }>('/alerts/rules'),
        request<{ items: Alert[] }>('/alerts?pageSize=50'),
      ])
      setRules(rulesRes.items)
      setAlerts(alertsRes.items)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      await request('/alerts/rules', {
        method: 'POST',
        body: JSON.stringify({
          websiteId: form.websiteId,
          type: form.type,
          recipients: form.recipients.split(',').map((r) => r.trim()).filter(Boolean),
          threshold: Number(form.threshold),
        }),
      })
      setShowForm(false)
      setForm({ websiteId: '', type: 'EMAIL', recipients: '', threshold: '1' })
      await loadData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create rule')
    }
  }

  const handleToggleRule = async (rule: AlertRule) => {
    try {
      await request(`/alerts/rules/${rule.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isEnabled: !rule.isEnabled }),
      })
      await loadData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update rule')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!window.confirm('Delete this alert rule?')) return
    try {
      await request(`/alerts/rules/${ruleId}`, { method: 'DELETE' })
      await loadData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete rule')
    }
  }

  const content = (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm shadow-sm dark:border-slate-700/80 dark:bg-slate-900/80">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <Bell className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alerts</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
      </div>

      <div className="flex gap-1 border-b border-slate-200 px-6 pt-4 dark:border-slate-700">
        {(['rules', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold capitalize transition ${
              tab === t ? 'border-x border-t border-slate-200 bg-white text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {t === 'rules' ? 'Alert Rules' : 'History'}
          </button>
        ))}
      </div>

      <div className="p-6">
        {message && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{message}</div>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
        ) : tab === 'rules' ? (
          <div className="space-y-4">
            <Tooltip text="Create a new alert rule to get notified when a website goes down">
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                New Alert Rule
              </button>
            </Tooltip>

              {showForm && (
                <form onSubmit={handleCreateRule} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="font-semibold text-slate-700">Create Alert Rule</p>
                  <input
                    value={form.websiteId}
                    onChange={(e) => setForm({ ...form, websiteId: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Website ID"
                    required
                  />
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="SLACK">Slack</option>
                    <option value="DISCORD">Discord</option>
                  </select>
                  <p className="text-xs text-slate-500">For SMS alerts, use the format: phonenumber@carrier (e.g. 15551234567@vtext.com)</p>
                  <input
                    value={form.recipients}
                    onChange={(e) => setForm({ ...form, recipients: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    placeholder="Recipients (comma separated)"
                  />
                  <input
                    value={form.threshold}
                    onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    type="number"
                    min="1"
                    placeholder="Threshold (consecutive failures)"
                  />
                  <Tooltip text="Create a new alert rule">
                    <button type="submit" className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700">
                      Create Rule
                    </button>
                  </Tooltip>
                </form>
              )}

              {rules.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <BellOff className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="font-semibold text-slate-700">No alert rules</p>
                  <p className="text-sm">Create rules to get notified when sites go down.</p>
                </div>
              ) : (
                rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{rule.type}</span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${rule.isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {rule.isEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {rule.website.name} &middot; Threshold: {rule.threshold} &middot; {rule.recipients.join(', ')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Tooltip text={rule.isEnabled ? 'Disable this alert rule' : 'Enable this alert rule'}>
                        <button
                          onClick={() => handleToggleRule(rule)}
                          className={`grid h-9 w-9 place-items-center rounded-lg border transition ${
                            rule.isEnabled
                              ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {rule.isEnabled ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </button>
                      </Tooltip>
                      <Tooltip text="Delete this alert rule">
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                  <p className="font-semibold text-slate-700">No alerts yet</p>
                  <p className="text-sm">When a website goes down, alerts will appear here.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${alert.severity === 'CRITICAL' ? 'text-red-700' : alert.severity === 'WARNING' ? 'text-amber-700' : 'text-slate-700'}`}>
                          {alert.severity}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          alert.status === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                          alert.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {alert.status}
                        </span>
                        {alert.onCallUser && (
                          <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                            On-Call: {alert.onCallUser.fullName || alert.onCallUser.email}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{alert.message}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{alert.website.name} &middot; {new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
  )

  if (inline) return <div className="animate-fadeIn">{content}</div>
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">{content}</div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Key, KeyRound, Loader2, Mail, Moon, Save, Settings, Sun, Trash2, User, X } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import Tooltip from './Tooltip'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Props { onClose: () => void }

interface ApiKeyItem {
  id: string
  name: string
  prefix: string
  lastUsed: string | null
  createdAt: string
  revokedAt: string | null
}

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

export default function SettingsPage({ onClose }: Props) {
  const { theme, toggleTheme } = useTheme()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confPw, setConfPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [tab, setTab] = useState<'profile' | 'security'>('profile')

  const [keys, setKeys] = useState<ApiKeyItem[]>([])
  const [keyName, setKeyName] = useState('')
  const [newKey, setNewKey] = useState('')
  const [loadingKeys, setLoadingKeys] = useState(false)

  useEffect(() => {
    const u = localStorage.getItem('kingx_user')
    if (u) { const p = JSON.parse(u); setFullName(p.fullName || ''); setEmail(p.email || '') }
    void loadKeys()
  }, [])

  const loadKeys = async () => {
    setLoadingKeys(true)
    try { setKeys((await req<{ items: ApiKeyItem[] }>('/settings/api-keys')).items) }
    catch { /* ignore */ }
    finally { setLoadingKeys(false) }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg('')
    try {
      const d = await req<{ user: { fullName: string; email: string } }>('/settings/profile', { method: 'PATCH', body: JSON.stringify({ fullName }) })
      localStorage.setItem('kingx_user', JSON.stringify(d.user))
      setMsg('Profile updated')
    } catch (ex) { setMsg(ex instanceof Error ? ex.message : 'Failed') }
    finally { setSaving(false) }
  }

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw !== confPw) { setMsg('Passwords do not match'); return }
    if (newPw.length < 6) { setMsg('Password must be at least 6 characters'); return }
    setSaving(true); setMsg('')
    try {
      await req('/settings/password', { method: 'PUT', body: JSON.stringify({ currentPassword: curPw, newPassword: newPw }) })
      setCurPw(''); setNewPw(''); setConfPw('')
      setMsg('Password changed')
    } catch (ex) { setMsg(ex instanceof Error ? ex.message : 'Failed') }
    finally { setSaving(false) }
  }

  const createKey = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('')
    try {
      const d = await req<{ key: string; item: ApiKeyItem }>('/settings/api-keys', { method: 'POST', body: JSON.stringify({ name: keyName }) })
      setNewKey(d.key)
      setKeyName('')
      await loadKeys()
    } catch (ex) { setMsg(ex instanceof Error ? ex.message : 'Failed') }
  }

  const revokeKey = async (id: string) => {
    if (!window.confirm('Revoke this API key? Existing integrations will stop working.')) return
    try { await req(`/settings/api-keys/${id}`, { method: 'DELETE' }); await loadKeys() }
    catch (ex) { setMsg(ex instanceof Error ? ex.message : 'Failed') }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-1 border-b border-slate-200 px-6 pt-4 dark:border-slate-700">
          {(['profile', 'security'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-t-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? 'border-x border-t border-slate-200 bg-white text-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}>{t}</button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {msg && (
            <div className={`rounded-lg border px-4 py-2.5 text-sm ${
              msg.includes('updated') || msg.includes('changed') || msg.includes('copied')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>{msg}</div>
          )}

          {tab === 'profile' && (
            <>
              <form onSubmit={saveProfile} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <User className="h-4 w-4" /> Profile
                </h3>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Full Name
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </label>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Email
                  <div className="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    <Mail className="mr-2 h-4 w-4" /> {email}
                  </div>
                </label>
                <Tooltip text="Save your profile changes">
                  <button type="submit" disabled={saving}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Profile
                  </button>
                </Tooltip>
              </form>

              <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 dark:text-slate-300">
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  Appearance
                </h3>
                <Tooltip text="Toggle between light and dark mode">
                  <button onClick={toggleTheme}
                    className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </Tooltip>
              </div>
            </>
          )}

          {tab === 'security' && (
            <>
              <form onSubmit={changePw} className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  <KeyRound className="h-4 w-4" /> Change Password
                </h3>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Current Password
                  <input value={curPw} onChange={(e) => setCurPw(e.target.value)} type={showPw ? 'text' : 'password'}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </label>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  New Password
                  <input value={newPw} onChange={(e) => setNewPw(e.target.value)} type={showPw ? 'text' : 'password'} minLength={6}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </label>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Confirm New Password
                  <input value={confPw} onChange={(e) => setConfPw(e.target.value)} type={showPw ? 'text' : 'password'}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </label>
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <input type="checkbox" checked={showPw} onChange={() => setShowPw(!showPw)} className="rounded border-slate-300" />
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    Show passwords
                  </label>
                  <Tooltip text="Change your account password">
                    <button type="submit" disabled={saving}
                      className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Change Password
                    </button>
                  </Tooltip>
                </div>
              </form>

              <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3 dark:text-slate-300">
                  <Key className="h-4 w-4" /> API Keys
                </h3>

                {newKey && (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Key created — copy it now</p>
                    <div className="mt-2 flex gap-2">
                      <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 text-sm font-mono text-slate-900 dark:bg-slate-800 dark:text-white">{newKey}</code>
                      <Tooltip text="Copy to clipboard">
                        <button onClick={() => { navigator.clipboard.writeText(newKey); setMsg('Key copied to clipboard') }}
                          className="grid h-9 w-9 place-items-center rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400">
                          <Save className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                )}

                <form onSubmit={createKey} className="flex gap-2">
                  <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name (e.g. CI/CD)"
                    className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                  <Tooltip text="Create a new API key for programmatic access">
                    <button type="submit" className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-700">Create</button>
                  </Tooltip>
                </form>

                {loadingKeys ? (
                  <div className="grid place-items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-indigo-600" /></div>
                ) : keys.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">No API keys yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {keys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{k.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {k.prefix}... &middot; {k.lastUsed ? `Last used ${new Date(k.lastUsed).toLocaleDateString()}` : 'Never used'} &middot; Created {new Date(k.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Tooltip text="Revoke this API key">
                          <button onClick={() => revokeKey(k.id)} className="grid h-8 w-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

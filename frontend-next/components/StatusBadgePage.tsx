'use client'

import { useEffect, useState } from 'react'
import { Code2, Copy, CheckCircle2, Loader2, X } from 'lucide-react'
import Tooltip from './Tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Team { id: string; name: string; slug: string }
interface BadgeData { teamName: string; overallStatus: string; up: number; down: number; total: number }

interface Props { onClose?: () => void; inline?: boolean }

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

export default function StatusBadgePage({ onClose, inline }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [loadingBadge, setLoadingBadge] = useState(false)
  const [copiedImg, setCopiedImg] = useState(false)
  const [copiedJson, setCopiedJson] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoadingTeams(true)
      try {
        const data = await request<{ items: Team[] }>('/teams')
        setTeams(data.items)
        if (data.items.length > 0) setSelectedSlug(data.items[0].slug)
      } catch (e) { setMessage(e instanceof Error ? e.message : 'Failed to load teams') }
      finally { setLoadingTeams(false) }
    }
    void load()
  }, [])

  useEffect(() => {
    if (!selectedSlug) return
    const load = async () => {
      setLoadingBadge(true)
      try {
        const data = await fetch(`${API_URL}/public/badge/${selectedSlug}/json`).then(r => r.json())
        setBadgeData(data)
      } catch { setBadgeData(null) }
      finally { setLoadingBadge(false) }
    }
    void load()
  }, [selectedSlug])

  const badgeUrl = `${API_URL}/public/badge/${selectedSlug}`
  const imgTag = `<img src="${badgeUrl}" alt="Status badge for ${badgeData?.teamName || ''}" />`
  const jsonUrl = `${API_URL}/public/badge/${selectedSlug}/json`
  const jsonSnippet = `fetch('${jsonUrl}').then(r=>r.json()).then(console.log)`

  const copyToClipboard = async (text: string, setCopied: (v: boolean) => void) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  const statusColor = badgeData?.overallStatus === 'UP' ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : badgeData?.overallStatus === 'DOWN' ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'

  const content = (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Status Badge</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
      </div>
      <div className="space-y-5 p-6">
        {message && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{message}</div>}

        {loadingTeams ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Select Team</label>
              {teams.length > 0 ? (
                <select value={selectedSlug} onChange={e => setSelectedSlug(e.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                  {teams.map(t => <option key={t.id} value={t.slug}>{t.name} ({t.slug})</option>)}
                </select>
              ) : (
                <div className="h-11 w-full rounded-lg border border-dashed border-slate-300 px-3 text-sm text-slate-400 flex items-center dark:border-slate-600">No teams yet — create one in Settings &gt; Team</div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/30">
              <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Live Preview</p>
              {loadingBadge ? (
                <div className="flex items-center gap-2 py-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading badge...</div>
              ) : badgeData ? (
                <div className="space-y-3">
                  <img src={badgeUrl} alt="Status Badge" className="h-5" />
                  <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${statusColor}`}>
                    <span className={`h-2 w-2 rounded-full ${badgeData.overallStatus === 'UP' ? 'bg-emerald-500' : badgeData.overallStatus === 'DOWN' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    {badgeData.up} up, {badgeData.down} down ({badgeData.total} total)
                  </div>
                </div>
              ) : teams.length > 0 ? (
                <p className="text-sm text-slate-400">Select a team to preview</p>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="20">
                    <rect rx="3" width="96" height="20" fill="#555"/>
                    <rect rx="3" x="54" width="42" height="20" fill="#94a3b8"/>
                    <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
                      <text x="6" y="14">KingX - Your Team</text>
                      <text x="75" y="14" text-anchor="middle">pending</text>
                    </g>
                  </svg>
                  <span className="text-xs text-slate-400">Badge will appear once you have websites</span>
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Embed as Image</p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-green-400 dark:border-slate-700">{imgTag}</pre>
                <Tooltip text={copiedImg ? 'Copied!' : 'Copy to clipboard'}>
                  <button onClick={() => copyToClipboard(imgTag, setCopiedImg)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-700">{copiedImg ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}</button>
                </Tooltip>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Fetch as JSON</p>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-green-400 dark:border-slate-700">{jsonSnippet}</pre>
                <Tooltip text={copiedJson ? 'Copied!' : 'Copy to clipboard'}>
                  <button onClick={() => copyToClipboard(jsonSnippet, setCopiedJson)}
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-slate-400 hover:bg-slate-700">{copiedJson ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}</button>
                </Tooltip>
              </div>
            </div>
          </>
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

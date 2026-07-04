'use client'

import { useEffect, useState } from 'react'
import { Globe2, Loader2, Plus, TestTube, Trash2, Webhook, XCircle } from 'lucide-react'
import Tooltip from './Tooltip'

interface WebhookEndpoint {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggered: string | null
  createdAt: string
}

interface Props { onClose?: () => void; inline?: boolean }

export default function WebhooksPage({ onClose, inline }: Props) {
  const [items, setItems] = useState<WebhookEndpoint[]>([
    { id: '1', name: 'Slack Alerts', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: ['alert.triggered', 'alert.resolved'], isActive: true, lastTriggered: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: '2', name: 'Discord Bot', url: 'https://discord.com/api/webhooks/xxx/yyy', events: ['website.down', 'website.up'], isActive: true, lastTriggered: new Date(Date.now() - 3600000).toISOString(), createdAt: new Date(Date.now() - 86400000 * 14).toISOString() },
  ])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', events: '' })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const newItem: WebhookEndpoint = {
      id: Date.now().toString(),
      name: form.name,
      url: form.url,
      events: form.events.split(',').map(s => s.trim()).filter(Boolean),
      isActive: true,
      lastTriggered: null,
      createdAt: new Date().toISOString(),
    }
    setItems(prev => [...prev, newItem])
    setShowForm(false)
    setForm({ name: '', url: '', events: '' })
    setMsg('Webhook created')
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this webhook?')) return
    setItems(prev => prev.filter(w => w.id !== id))
    setMsg('Webhook deleted')
  }

  const handleTest = (webhook: WebhookEndpoint) => {
    setMsg(`Test payload sent to ${webhook.name}`)
  }

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Webhook className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Webhooks</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><XCircle className="h-5 w-5" /></button>}
      </div>

      <div className="p-6 space-y-4">
        {msg && (
          <div className={`rounded-lg border px-4 py-2.5 text-sm ${
            msg.includes('deleted') || msg.includes('Failed') ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400' : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
          }`}>{msg}</div>
        )}

        <Tooltip text="Add a new webhook endpoint to receive event notifications">
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> New Webhook
          </button>
        </Tooltip>

        {showForm && (
          <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Create Webhook</p>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Webhook name (e.g. Slack Alerts)" required
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="Webhook URL (https://...)" required type="url"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            <input value={form.events} onChange={e => setForm({ ...form, events: e.target.value })} placeholder="Events (comma separated: alert.triggered, website.down)"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">alert.triggered</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">alert.resolved</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">website.up</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">website.down</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">maintenance.start</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 dark:bg-slate-800">maintenance.end</span>
            </div>
            <Tooltip text="Create this webhook endpoint">
              <button type="submit" className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700">Create Webhook</button>
            </Tooltip>
          </form>
        )}

        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Webhook className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No webhooks configured</p>
            <p className="text-sm">Create webhooks to receive real-time event notifications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(w => (
              <div key={w.id} className="flex items-start justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-indigo-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">{w.name}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${w.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>{w.isActive ? 'Active' : 'Disabled'}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{w.url}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {w.events.map(ev => <span key={ev} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">{ev}</span>)}
                  </div>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    Created {new Date(w.createdAt).toLocaleDateString()} &middot; {w.lastTriggered ? `Last triggered ${new Date(w.lastTriggered).toLocaleString()}` : 'Not triggered yet'}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Tooltip text="Send a test payload to this webhook">
                    <button onClick={() => handleTest(w)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-indigo-400">
                      <TestTube className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip text="Delete this webhook">
                    <button onClick={() => handleDelete(w.id)} className="grid h-9 w-9 place-items-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/30">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Tooltip>
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

import { useState } from 'react'
import { X, Loader2, Save } from 'lucide-react'

interface WebsiteData {
  id: string
  name: string
  url: string
  method: string
  checkInterval: number
  timeout: number
  tags: string[]
}

interface Props {
  website: WebsiteData
  onClose: () => void
  onSaved: () => void
}

export default function WebsiteEditModal({ website, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: website.name,
    url: website.url,
    method: website.method,
    checkInterval: String(website.checkInterval),
    timeout: String(website.timeout),
    tags: website.tags.join(', '),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const token = localStorage.getItem('kingx_token')
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
      const res = await fetch(`${base}/websites/${website.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          url: form.url,
          method: form.method,
          checkInterval: Number(form.checkInterval),
          timeout: Number(form.timeout),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Save failed')
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Edit Website</h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            URL
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              type="url"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Method
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Interval (s)
              <input
                value={form.checkInterval}
                onChange={(e) => setForm({ ...form, checkInterval: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                type="number"
                min="60"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-slate-700">
              Timeout (ms)
              <input
                value={form.timeout}
                onChange={(e) => setForm({ ...form, timeout: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                type="number"
                min="1000"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Tags
              <input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="prod, api"
              />
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
        </form>
      </div>
    </div>
  )
}

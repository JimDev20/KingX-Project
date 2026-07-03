import { Plus, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import Tooltip from './Tooltip'

interface WebsiteFormProps {
  siteForm: { name: string; url: string; method: string; tags: string }
  loading: boolean
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onChange: (field: string, value: string) => void
}

export default function WebsiteForm({ siteForm, loading, onSubmit, onChange }: WebsiteFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5 text-indigo-600" />
        <h2 className="font-semibold text-slate-900">Add Website</h2>
      </div>

      <label className="mb-3 block text-sm font-medium text-slate-700">
        Name
        <input
          value={siteForm.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="My Website"
        />
      </label>

      <label className="mb-3 block text-sm font-medium text-slate-700">
        URL
        <input
          value={siteForm.url}
          onChange={(e) => onChange('url', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="https://example.com"
          type="url"
        />
      </label>

      <label className="mb-3 block text-sm font-medium text-slate-700">
        Method
        <select
          value={siteForm.method}
          onChange={(e) => onChange('method', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        >
          <option value="GET">GET</option>
          <option value="HEAD">HEAD</option>
          <option value="POST">POST</option>
        </select>
      </label>

      <label className="mb-4 block text-sm font-medium text-slate-700">
        Tags
        <input
          value={siteForm.tags}
          onChange={(e) => onChange('tags', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="prod, api"
        />
      </label>

      <Tooltip text="Add a new website to monitor">
        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add site
        </button>
      </Tooltip>
    </form>
  )
}

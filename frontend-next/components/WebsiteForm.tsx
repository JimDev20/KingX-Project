import { Plus, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import Tooltip from './Tooltip'

interface WebsiteFormProps {
  siteForm: { name: string; url: string; method: string; tags: string; checkInterval?: string; keywordCheck?: string; keywordType?: string }
  loading: boolean
  onSubmit: (e: FormEvent<HTMLFormElement>) => void
  onChange: (field: string, value: string) => void
}

export default function WebsiteForm({ siteForm, loading, onSubmit, onChange }: WebsiteFormProps) {
  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <Plus className="h-5 w-5 text-indigo-600" />
        <h2 className="font-semibold text-slate-900 dark:text-white">Add Website</h2>
      </div>

      <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Name
        <input
          value={siteForm.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          placeholder="My Website"
        />
      </label>

      <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
        URL
        <input
          value={siteForm.url}
          onChange={(e) => onChange('url', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          placeholder="https://example.com"
          type="url"
        />
      </label>

      <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Method
        <select
          value={siteForm.method}
          onChange={(e) => onChange('method', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        >
          <option value="GET">GET</option>
          <option value="HEAD">HEAD</option>
          <option value="POST">POST</option>
        </select>
      </label>

      <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Check Interval
        <select
          value={siteForm.checkInterval || '300'}
          onChange={(e) => onChange('checkInterval', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
        >
          <option value="60">1 minute</option>
          <option value="300">5 minutes</option>
          <option value="600">10 minutes</option>
          <option value="1800">30 minutes</option>
          <option value="3600">1 hour</option>
        </select>
      </label>

      <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Tags
        <input
          value={siteForm.tags}
          onChange={(e) => onChange('tags', e.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          placeholder="prod, api"
        />
      </label>

      <label className="mb-3 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Keyword Check
        <div className="mt-1.5 flex gap-2">
          <select
            value={siteForm.keywordType || 'CONTAINS'}
            onChange={(e) => onChange('keywordType', e.target.value)}
            className="h-10 w-28 shrink-0 rounded-lg border border-slate-300 px-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
          >
            <option value="CONTAINS">Contains</option>
            <option value="NOT_CONTAINS">Not contains</option>
          </select>
          <input
            value={siteForm.keywordCheck || ''}
            onChange={(e) => onChange('keywordCheck', e.target.value)}
            className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            placeholder="uptime (leave empty to skip)"
          />
        </div>
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

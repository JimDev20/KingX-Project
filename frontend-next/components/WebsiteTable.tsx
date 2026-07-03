import {
  CheckCircle2, XCircle, Clock3, ShieldCheck,
  RefreshCcw, Trash2, Globe2, Loader2, Search, Edit3,
} from 'lucide-react'

interface Website {
  id: string
  name: string
  url: string
  status: 'UP' | 'DOWN' | 'PENDING' | 'MAINTENANCE'
  uptime: number
  responseTime: number | null
  lastChecked: string | null
  tags: string[]
}

const statusStyles: Record<string, string> = {
  UP: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DOWN: 'border-red-200 bg-red-50 text-red-700',
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
  MAINTENANCE: 'border-slate-200 bg-slate-50 text-slate-600',
}

const statusIcons: Record<string, React.ReactNode> = {
  UP: <CheckCircle2 className="h-4 w-4" />,
  DOWN: <XCircle className="h-4 w-4" />,
  PENDING: <Clock3 className="h-4 w-4" />,
  MAINTENANCE: <ShieldCheck className="h-4 w-4" />,
}

interface WebsiteTableProps {
  websites: Website[]
  search: string
  statusFilter: string
  checkingId: string
  loading: boolean
  message: string
  onSearchChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
  onRefresh: () => void
  onCheck: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (site: Website) => void
  onViewHistory: (id: string) => void
}

export default function WebsiteTable({
  websites, search, statusFilter, checkingId, loading, message,
  onSearchChange, onStatusFilterChange, onRefresh,
  onCheck, onDelete, onEdit, onViewHistory,
}: WebsiteTableProps) {
  const filtered = websites.filter((site) => {
    const matchSearch = site.name.toLowerCase().includes(search.toLowerCase()) ||
      site.url.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || site.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Websites</h1>
          <p className="mt-0.5 text-sm text-slate-500">Search, filter, and manage monitored sites.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:w-64"
              placeholder="Search websites"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="ALL">All status</option>
            <option value="UP">Up</option>
            <option value="DOWN">Down</option>
            <option value="PENDING">Pending</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 hover:text-indigo-600"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {message}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Website</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Uptime</th>
              <th className="px-5 py-3.5">Response</th>
              <th className="px-5 py-3.5">Last Checked</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((site) => (
              <tr key={site.id} className="transition hover:bg-slate-50">
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onViewHistory(site.id)}
                    className="font-semibold text-slate-900 transition hover:text-indigo-600"
                  >
                    {site.name}
                  </button>
                  <a
                    className="text-slate-500 transition hover:text-indigo-600"
                    href={site.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {site.url}
                  </a>
                  {site.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {site.tags.map((tag) => (
                        <span key={tag} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold ${statusStyles[site.status]}`}>
                    {statusIcons[site.status]}
                    {site.status}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold text-slate-900">{site.uptime}%</td>
                <td className="px-5 py-4 text-slate-600">
                  {site.responseTime ? `${site.responseTime}ms` : '-'}
                </td>
                <td className="px-5 py-4 text-slate-500">
                  {site.lastChecked ? new Date(site.lastChecked).toLocaleString() : 'Not checked'}
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(site)}
                      title="Edit website"
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onCheck(site.id)}
                      title="Run check"
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {checkingId === site.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <RefreshCcw className="h-4 w-4" />
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(site.id)}
                      title="Delete website"
                      className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="grid place-items-center px-5 py-16 text-center">
          <Globe2 className="mb-3 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-900">No websites found</p>
          <p className="mt-1 text-sm text-slate-500">Add a site or adjust your filters.</p>
        </div>
      )}
    </div>
  )
}

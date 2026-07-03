import { useEffect, useState } from 'react'
import { X, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

interface HistoryEntry {
  id: string
  status: 'up' | 'down' | 'pending'
  responseTime: number | null
  statusCode: number | null
  timestamp: string
  error?: string | null
}

interface Props {
  websiteId: string
  websiteName: string
  onClose: () => void
}

async function fetchHistory(id: string): Promise<HistoryEntry[]> {
  const token = localStorage.getItem('kingx_token')
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'
  const res = await fetch(`${base}/websites/${id}/history?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return data.history || []
}

export default function UptimeChart({ websiteId, websiteName, onClose }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchHistory(websiteId).then((data) => {
      if (!cancelled) {
        setHistory(data.reverse())
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [websiteId])

  const upCount = history.filter((h) => h.status === 'up').length
  const downCount = history.filter((h) => h.status === 'down').length
  const uptime = history.length > 0 ? ((upCount / history.length) * 100).toFixed(1) : '100.0'
  const trend = upCount >= downCount ? 'up' : 'down'

  const chartData = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    response: h.responseTime || 0,
    status: h.status,
  }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{websiteName}</h2>
            <p className="text-sm text-slate-500">Last {history.length} checks</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="p-6">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{uptime}%</p>
                <p className="text-sm text-emerald-600">Uptime</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-700">{history.length}</p>
                <p className="text-sm text-slate-500">Checks</p>
              </div>
              <div className="rounded-lg p-4 text-center" style={{ backgroundColor: trend === 'up' ? '#ecfdf5' : '#fef2f2' }}>
                {trend === 'up'
                  ? <TrendingUp className="mx-auto h-8 w-8 text-emerald-600" />
                  : <TrendingDown className="mx-auto h-8 w-8 text-red-600" />
                }
                <p className="text-sm" style={{ color: trend === 'up' ? '#059669' : '#dc2626' }}>
                  {trend === 'up' ? 'Stable' : 'Unstable'}
                </p>
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" unit="ms" />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="response"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, fill: '#6366f1' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {history.length === 0 && (
              <div className="py-12 text-center text-slate-500">
                <Minus className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p>No check history yet</p>
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-6 max-h-48 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="pb-2 pr-4">Time</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Response</th>
                      <th className="pb-2">Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.slice(0, 20).map((entry) => (
                      <tr key={entry.id} className="text-slate-700">
                        <td className="py-2 pr-4 text-slate-500">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">
                          <span className={`font-semibold ${entry.status === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {entry.status}
                          </span>
                        </td>
                        <td className="py-2 pr-4">{entry.responseTime ? `${entry.responseTime}ms` : '-'}</td>
                        <td className="py-2">{entry.statusCode || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

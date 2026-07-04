'use client'

import { useEffect, useState } from 'react'
import { Activity, Globe2, Shield, Users, X, Loader2, Search } from 'lucide-react'
import Skeleton, { SkeletonRow } from './Skeleton'
import Tooltip from './Tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface AdminStats {
  totalUsers: number
  totalSites: number
  totalTeams: number
  totalChecks: number
}

interface AdminUser {
  id: string
  email: string
  fullName: string
  role: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
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

export default function AdminPage({ onClose, inline }: Props) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [dash, userList] = await Promise.all([
        request<{ stats: AdminStats }>('/admin/dashboard'),
        request<{ users: AdminUser[] }>('/admin/users?pageSize=100'),
      ])
      setStats(dash.stats)
      setUsers(userList.users)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await request(`/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      })
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const filteredUsers = search
    ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || u.fullName?.toLowerCase().includes(search.toLowerCase()))
    : users

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Panel</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
      </div>

      <div className="p-6 space-y-6">
          {message && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{message}</div>
          )}

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                    <Skeleton className="mb-2 h-3 w-12" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-9 w-56 rounded-lg" />
                </div>
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Users</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalUsers ?? '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Globe2 className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sites</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalSites ?? '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Teams</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalTeams ?? '-'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Checks</span>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{stats?.totalChecks ?? '-'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">User Management</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-9 w-56 rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      placeholder="Search users by name or email"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Verified</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{u.fullName || '-'}</td>
                          <td className="px-4 py-3 text-slate-600">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                              u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${u.isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {u.isVerified ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3">
                            <Tooltip text="Change this user's role">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="h-8 rounded-lg border border-slate-300 px-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="SUPERADMIN">SUPERADMIN</option>
                              </select>
                            </Tooltip>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">Recent Activity</h3>
                </div>
                <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
                  Audit logging is available in the activity log.
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
      <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">{content}</div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Users, Plus, X, Loader2, UserPlus, Trash2, UserMinus, Shield, ShieldCheck, UserCog } from 'lucide-react'
import { SkeletonRow } from './Skeleton'
import Tooltip from './Tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Team {
  id: string
  name: string
  slug: string
  ownerId: string
  members: TeamMember[]
}

interface TeamMember {
  id: string
  role: string
  user: { id: string; email: string; fullName: string }
}

interface Props {
  onClose?: () => void
  inline?: boolean
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('kingx_token')
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  const payload = res.status === 204 ? null : await res.json()
  if (!res.ok) throw new Error(payload?.error || 'Request failed')
  return payload as T
}

const roleBadge: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-700 border-purple-200',
  ADMIN: 'bg-blue-100 text-blue-700 border-blue-200',
  MEMBER: 'bg-slate-100 text-slate-700 border-slate-200',
  VIEWER: 'bg-amber-100 text-amber-700 border-amber-200',
}

export default function TeamsPage({ onClose, inline }: Props) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [addMemberEmail, setAddMemberEmail] = useState('')
  const [addMemberTeamId, setAddMemberTeamId] = useState('')

  const loadTeams = async () => {
    setLoading(true)
    try {
      const data = await request<{ teams: Team[] }>('/teams')
      setTeams(data.teams)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadTeams() }, [])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      await request('/teams', { method: 'POST', body: JSON.stringify({ name: newTeamName }) })
      setNewTeamName('')
      setShowCreate(false)
      await loadTeams()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to create team')
    }
  }

  const handleAddMember = async (teamId: string) => {
    if (!addMemberEmail) return
    setMessage('')
    try {
      await request(`/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email: addMemberEmail }),
      })
      setAddMemberEmail('')
      setAddMemberTeamId('')
      await loadTeams()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to add member')
    }
  }

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    setMessage('')
    try {
      await request(`/teams/${teamId}/members/${memberId}`, { method: 'DELETE' })
      await loadTeams()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm('Delete this team? This cannot be undone.')) return
    setMessage('')
    try {
      await request(`/teams/${teamId}`, { method: 'DELETE' })
      await loadTeams()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete team')
    }
  }

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Teams</h2>
        </div>
        {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
      </div>

      <div className="p-6 space-y-4">
        <Tooltip text="Create a new team to collaborate with others">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </button>
        </Tooltip>

          {showCreate && (
            <form onSubmit={handleCreateTeam} className="flex gap-3">
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                placeholder="Team name"
                required
              />
              <button type="submit" className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700">
                Create
              </button>
            </form>
          )}

          {message && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{message}</div>
          )}

          {loading ? (
            <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-5 dark:border-slate-700">
                <div className="mb-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-5 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-9 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/30">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                        <div className="space-y-1.5">
                          <div className="h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                          <div className="h-3 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        </div>
                      </div>
                      <div className="h-5 w-14 animate-pulse rounded-md bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ))}
                </div>
              </div>
            ))}</div>
          ) : teams.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="font-semibold text-slate-700">No teams yet</p>
              <p className="text-sm">Create a team to collaborate with others.</p>
            </div>
          ) : (
            teams.map((team) => {
              const currentUserId = localStorage.getItem('kingx_user')
                ? JSON.parse(localStorage.getItem('kingx_user')!).id
                : ''
              const isOwner = team.ownerId === currentUserId

              return (
                <div key={team.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{team.name}</h3>
                      <p className="text-sm text-slate-500">{team.slug}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAddMemberTeamId(addMemberTeamId === team.id ? '' : team.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {addMemberTeamId === team.id && (
                    <div className="mb-4 flex gap-3">
                      <input
                        value={addMemberEmail}
                        onChange={(e) => setAddMemberEmail(e.target.value)}
                        className="h-10 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        placeholder="user@example.com"
                        type="email"
                      />
                      <button
                        onClick={() => handleAddMember(team.id)}
                        className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Invite
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                            {member.user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{member.user.fullName}</p>
                            <p className="text-sm text-slate-500">{member.user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${roleBadge[member.role] || roleBadge.MEMBER}`}>
                            {member.role}
                          </span>
                          {isOwner && member.role !== 'OWNER' && (
                            <button
                              onClick={() => handleRemoveMember(team.id, member.id)}
                              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
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

'use client'

import { useEffect, useState } from 'react'
import { Phone, Plus, X, Loader2, Trash2, Edit3, Clock, Save } from 'lucide-react'
import Tooltip from './Tooltip'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface User { id: string; email: string; fullName: string }
interface Rotation { id: string; scheduleId: string; userId: string; startTime: string; endTime: string; dayOfWeek: string | null; priority: number }
interface Schedule { id: string; teamId: string; name: string; type: string; timezone: string; rotations: Rotation[]; team?: { name: string } }

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

const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const dayLabels: Record<string, string> = { MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat', SUN: 'Sun' }

function getUserName(teamMembers: User[], id: string): string {
  return teamMembers.find(u => u.id === id)?.fullName || teamMembers.find(u => u.id === id)?.email || id.slice(0, 8)
}

interface BriefTeam { id: string; name: string; slug: string }

export default function OnCallPage({ onClose, inline }: Props) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [teams, setTeams] = useState<BriefTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTeamId, setNewTeamId] = useState('')
  const [newType, setNewType] = useState('WEEKLY')
  const [editingRotation, setEditingRotation] = useState<{ scheduleId: string; rotation?: Rotation } | null>(null)
  const [rotForm, setRotForm] = useState({ userId: '', startTime: '09:00', endTime: '17:00', dayOfWeek: '', priority: '0' })

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const [schedData, teamsData] = await Promise.all([
        request<{ items: Schedule[] }>('/oncall'),
        request<{ items: BriefTeam[] }>('/teams'),
      ])
      setSchedules(schedData.items)
      setTeams(teamsData.items)
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Failed to load') }
    finally { setLoading(false) }
  }

  const loadTeamMembers = async (teamId: string): Promise<void> => {
    try {
      const team = await request<{ id: string; members: { id: string; user: User }[] }>(`/teams/${teamId}`)
      setTeamMembers(team.members.map(m => m.user))
    } catch { setTeamMembers([]) }
  }

  useEffect(() => { void loadSchedules() }, [])

  const handleCreate = async () => {
    if (!newName || !newTeamId) return
    try {
      await request('/oncall', { method: 'POST', body: JSON.stringify({ name: newName, teamId: newTeamId, type: newType }) })
      setShowCreate(false); setNewName(''); setNewTeamId(''); setNewType('WEEKLY')
      await loadSchedules()
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Failed to create') }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm('Delete this schedule?')) return
    try { await request(`/oncall/${id}`, { method: 'DELETE' }); await loadSchedules() }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Failed to delete') }
  }

  const handleSaveRotation = async (scheduleId: string) => {
    const body = { userId: rotForm.userId, startTime: rotForm.startTime, endTime: rotForm.endTime, dayOfWeek: rotForm.dayOfWeek || null, priority: Number(rotForm.priority) }
    try {
      if (editingRotation?.rotation) {
        await request(`/oncall/${scheduleId}/rotations/${editingRotation.rotation.id}`, { method: 'PATCH', body: JSON.stringify(body) })
      } else {
        await request(`/oncall/${scheduleId}/rotations`, { method: 'POST', body: JSON.stringify(body) })
      }
      setEditingRotation(null); setRotForm({ userId: '', startTime: '09:00', endTime: '17:00', dayOfWeek: '', priority: '0' })
      await loadSchedules()
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Failed to save rotation') }
  }

  const handleDeleteRotation = async (scheduleId: string, rotationId: string) => {
    if (!window.confirm('Remove this rotation?')) return
    try { await request(`/oncall/${scheduleId}/rotations/${rotationId}`, { method: 'DELETE' }); await loadSchedules() }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Failed to remove') }
  }

  const isCurrentlyOnCall = (r: Rotation): boolean => {
    const now = new Date()
    const day = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()]
    if (r.dayOfWeek && r.dayOfWeek !== day) return false
    const min = now.getHours() * 60 + now.getMinutes()
    const [sh, sm] = r.startTime.split(':').map(Number)
    const [eh, em] = r.endTime.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    return min >= startMin && min < endMin
  }

  const content = (
    <div className="rounded-2xl border border-slate-200/80 bg-white/80 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 dark:border-slate-700/80">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">On-Call Scheduling</h2>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip text="Create a new on-call schedule">
            <button onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"><Plus className="h-3.5 w-3.5" /> New Schedule</button>
          </Tooltip>
          {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>}
        </div>
      </div>
      <div className="space-y-5 p-6">
        {message && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{message}</div>}

        {showCreate && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
            <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">New Schedule</p>
            <div className="grid gap-3 sm:grid-cols-4">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Schedule name"
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              <select value={newType} onChange={e => setNewType(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="WEEKLY">Weekly</option>
                <option value="DAILY">Daily</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <select value={newTeamId} onChange={e => setNewTeamId(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="">Select team...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={handleCreate} className="h-10 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700">Create</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : schedules.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50">No on-call schedules yet. Create one to get started.</div>
        ) : (
          <div className="space-y-4">
            {schedules.map(s => {
              const onCallNow = s.rotations.filter(isCurrentlyOnCall)
              return (
                <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30"><Clock className="h-5 w-5" /></div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{s.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.type} &middot; {s.team?.name || teams.find(t => t.id === s.teamId)?.name || s.teamId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {onCallNow.length > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {getUserName(teamMembers, onCallNow[0].userId)} on-call now
                        </span>
                      )}
                      <Tooltip text="Delete this schedule">
                        <button onClick={() => handleDeleteSchedule(s.id)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><Trash2 className="h-4 w-4" /></button>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {s.rotations.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No rotations defined</p>
                    ) : (
                      s.rotations.map(r => {
                        const now = isCurrentlyOnCall(r)
                        return (
                          <div key={r.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${now ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-700'}`}>
                            <div className={`h-2 w-2 rounded-full ${now ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                            <span className="min-w-[120px] font-medium text-slate-800 dark:text-slate-200">{getUserName(teamMembers, r.userId)}</span>
                            <span className="text-xs text-slate-500">{r.startTime} &ndash; {r.endTime}</span>
                            {r.dayOfWeek && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">{dayLabels[r.dayOfWeek]}</span>}
                            <span className="ml-auto flex items-center gap-1">
                              <Tooltip text="Edit rotation">
                                <button onClick={() => { void loadTeamMembers(s.teamId); setEditingRotation({ scheduleId: s.id, rotation: r }); setRotForm({ userId: r.userId, startTime: r.startTime, endTime: r.endTime, dayOfWeek: r.dayOfWeek || '', priority: String(r.priority) }) }}
                                  className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-700"><Edit3 className="h-3.5 w-3.5" /></button>
                              </Tooltip>
                              <Tooltip text="Remove rotation">
                                <button onClick={() => handleDeleteRotation(s.id, r.id)} className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"><X className="h-3.5 w-3.5" /></button>
                              </Tooltip>
                            </span>
                          </div>
                        )
                      })
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-700">
                    {editingRotation && editingRotation.scheduleId === s.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select value={rotForm.userId} onChange={e => setRotForm({ ...rotForm, userId: e.target.value })}
                          className="h-9 rounded-lg border border-slate-300 px-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                          <option value="">Select user...</option>
                          {teamMembers.map(u => <option key={u.id} value={u.id}>{u.fullName || u.email}</option>)}
                        </select>
                        <input type="time" value={rotForm.startTime} onChange={e => setRotForm({ ...rotForm, startTime: e.target.value })}
                          className="h-9 w-28 rounded-lg border border-slate-300 px-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                        <input type="time" value={rotForm.endTime} onChange={e => setRotForm({ ...rotForm, endTime: e.target.value })}
                          className="h-9 w-28 rounded-lg border border-slate-300 px-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                        {s.type === 'WEEKLY' && (
                          <select value={rotForm.dayOfWeek} onChange={e => setRotForm({ ...rotForm, dayOfWeek: e.target.value })}
                            className="h-9 rounded-lg border border-slate-300 px-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                            <option value="">Every day</option>
                            {days.map(d => <option key={d} value={d}>{dayLabels[d]}</option>)}
                          </select>
                        )}
                        <input type="number" value={rotForm.priority} onChange={e => setRotForm({ ...rotForm, priority: e.target.value })} placeholder="Priority"
                          className="h-9 w-20 rounded-lg border border-slate-300 px-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                        <Tooltip text="Save rotation">
                          <button onClick={() => handleSaveRotation(s.id)} className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"><Save className="h-4 w-4" /></button>
                        </Tooltip>
                        <button onClick={() => setEditingRotation(null)} className="text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                      </div>
                    ) : (
                      <Tooltip text="Add a new rotation entry">
                        <button onClick={() => { void loadTeamMembers(s.teamId); setEditingRotation({ scheduleId: s.id }); setRotForm({ userId: '', startTime: '09:00', endTime: '17:00', dayOfWeek: '', priority: '0' }) }}
                          className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"><Plus className="h-3.5 w-3.5" /> Add Rotation</button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )
            })}
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

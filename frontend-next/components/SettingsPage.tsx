'use client'

import { useState, useEffect } from 'react'
import { Settings, Save, Loader2, X, Eye, EyeOff, User, Mail, KeyRound } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Props {
  onClose: () => void
}

export default function SettingsPage({ onClose }: Props) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem('kingx_user')
    if (user) {
      const parsed = JSON.parse(user)
      setFullName(parsed.fullName || '')
      setEmail(parsed.email || '')
    }
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const token = localStorage.getItem('kingx_token')
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      if (data.user) {
        localStorage.setItem('kingx_user', JSON.stringify(data.user))
      }
      setMessage('Profile updated successfully')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const token = localStorage.getItem('kingx_token')
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Password change failed')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Password changed successfully')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Password change failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {message && (
            <div className={`rounded-lg border px-4 py-2.5 text-sm ${
              message.includes('successfully')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <User className="h-4 w-4" />
              Profile
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <label className="block text-sm font-medium text-slate-600">
                Full Name
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Email
                <div className="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  <Mail className="mr-2 h-4 w-4" />
                  {email}
                </div>
              </label>
              <button
                type="submit"
                disabled={saving}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </button>
            </form>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <KeyRound className="h-4 w-4" />
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-3">
              <label className="block text-sm font-medium text-slate-600">
                Current Password
                <input
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  type={showPassword ? 'text' : 'password'}
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                New Password
                <input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  type={showPassword ? 'text' : 'password'}
                  minLength={6}
                />
              </label>
              <label className="block text-sm font-medium text-slate-600">
                Confirm New Password
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  type={showPassword ? 'text' : 'password'}
                />
              </label>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                    className="rounded border-slate-300"
                  />
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  Show passwords
                </label>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

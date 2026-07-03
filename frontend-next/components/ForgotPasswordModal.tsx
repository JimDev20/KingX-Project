'use client'

import { useState } from 'react'
import { Loader2, Mail, ArrowLeft, CheckCircle2, X } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Props { onClose: () => void; onSwitchToLogin: () => void }

export default function ForgotPasswordModal({ onClose, onSwitchToLogin }: Props) {
  const [step, setStep] = useState<'email' | 'sent' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const r = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      setStep('sent')
    } catch (ex) {
      setMsg(ex instanceof Error ? ex.message : 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const r = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Failed')
      onSwitchToLogin()
      onClose()
    } catch (ex) {
      setMsg(ex instanceof Error ? ex.message : 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reset Password</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {msg && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">{msg}</div>}

          {step === 'email' && (
            <form onSubmit={requestReset} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Enter your email and we'll send you a reset token.</p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
              </label>
              <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Reset Token
              </button>
              <button type="button" onClick={onSwitchToLogin} className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            </form>
          )}

          {step === 'sent' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-800 dark:bg-emerald-900/20">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">Check your email</p>
                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-300">
                  If an account exists for {email}, you'll receive a reset token.
                </p>
              </div>

              <form onSubmit={resetPassword} className="space-y-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Reset Token
                  <input value={token} onChange={(e) => setToken(e.target.value)} required
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </label>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New Password
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6}
                    className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                </label>
                <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

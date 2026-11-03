'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'

interface Props { onClose: () => void; onSwitchToLogin: () => void }

export default function ForgotPasswordModal({ onClose, onSwitchToLogin }: Props) {
  const [step, setStep] = useState<'email' | 'sent' | 'reset'>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, [href]')).filter(el => !el.hasAttribute('disabled'))
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

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
        body: JSON.stringify({ token, newPassword: password }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="forgot-title" className="w-full max-w-md rounded-[4px] border border-white/10 bg-[#131824] shadow-2xl" style={{ fontFamily: 'var(--font-hanken), "Hanken Grotesk", Arial, sans-serif' }}>
        <div className="flex items-center justify-between px-6 py-5">
          <h2 id="forgot-title" className="text-2xl font-medium tracking-[-0.03em] text-[#e9edf3]">Reset password</h2>
          <button type="button" onClick={onClose} className="text-sm text-[#8891a1] transition-colors hover:text-white">Close</button>
        </div>

        <div className="px-6 pb-6">
          {msg && <div role="alert" className="mb-4 rounded-[3px] border border-[#f08c8c]/40 bg-[#f08c8c]/10 px-4 py-2.5 text-sm text-[#f08c8c]">{msg}</div>}

          {step === 'email' && (
            <form onSubmit={requestReset} className="space-y-4">
              <p className="text-sm text-[#b4bdca]">Enter your email and we will send you a reset token.</p>
              <label className="block text-sm font-medium text-[#b4bdca]">
                Email
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required autoFocus
                  className="mt-1.5 h-11 w-full rounded-[3px] border border-white/25 bg-[#0a0d14] px-3 text-sm text-[#e9edf3] outline-none transition-colors placeholder:text-[#8891a1] focus:border-[#5a9bfc]" />
              </label>
              <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-[3px] bg-[#5a9bfc] text-sm font-medium text-[#06101f] transition-colors hover:bg-[#7db0ff] disabled:opacity-60">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send reset token
              </button>
              <button type="button" onClick={onSwitchToLogin} className="flex items-center gap-1 text-sm text-[#8891a1] transition-colors hover:text-white">
                <ArrowLeft className="h-3 w-3" /> Back to sign in
              </button>
            </form>
          )}

          {step === 'sent' && (
            <div className="space-y-4">
              <div className="rounded-[3px] border border-[#7bd8a5]/30 bg-[#7bd8a5]/10 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-[#7bd8a5]" />
                <p className="font-medium text-[#7bd8a5]">Check your email</p>
                <p className="mt-1 text-sm text-[#b4bdca]">
                  If an account exists, a reset token has been sent.
                </p>
              </div>

              <form onSubmit={resetPassword} className="space-y-4">
                <label className="block text-sm font-medium text-[#b4bdca]">
                  Reset token
                  <input value={token} onChange={(e) => setToken(e.target.value)} required autoFocus
                    className="mt-1.5 h-11 w-full rounded-[3px] border border-white/25 bg-[#0a0d14] px-3 text-sm text-[#e9edf3] outline-none transition-colors focus:border-[#5a9bfc]" />
                </label>
                <label className="block text-sm font-medium text-[#b4bdca]">
                  New password
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6}
                    className="mt-1.5 h-11 w-full rounded-[3px] border border-white/25 bg-[#0a0d14] px-3 text-sm text-[#e9edf3] outline-none transition-colors focus:border-[#5a9bfc]" />
                </label>
                <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-[3px] bg-[#5a9bfc] text-sm font-medium text-[#06101f] transition-colors hover:bg-[#7db0ff] disabled:opacity-60">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

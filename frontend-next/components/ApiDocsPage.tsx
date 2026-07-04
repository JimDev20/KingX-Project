'use client'

import { BookOpen, Code2, Copy, Globe2, Key, Link2, Server, Shield, XCircle } from 'lucide-react'
import { useState } from 'react'
import Tooltip from './Tooltip'

interface Props { onClose?: () => void; inline?: boolean }

const endpoints = [
  { method: 'POST', path: '/api/auth/register', desc: 'Create a new user account', body: { fullName: 'string', email: 'string', password: 'string' } },
  { method: 'POST', path: '/api/auth/login', desc: 'Sign in with email and password', body: { email: 'string', password: 'string' } },
  { method: 'GET', path: '/api/websites', desc: 'List all monitored websites', auth: true },
  { method: 'POST', path: '/api/websites', desc: 'Add a new website to monitor', auth: true, body: { name: 'string', url: 'string', method: 'GET|POST|HEAD', tags: 'string[]' } },
  { method: 'GET', path: '/api/websites/:id', desc: 'Get website details', auth: true },
  { method: 'PATCH', path: '/api/websites/:id', desc: 'Update website settings', auth: true },
  { method: 'DELETE', path: '/api/websites/:id', desc: 'Remove a website', auth: true },
  { method: 'POST', path: '/api/websites/:id/check', desc: 'Trigger an immediate health check', auth: true },
  { method: 'GET', path: '/api/websites/stats', desc: 'Get aggregate dashboard stats', auth: true },
  { method: 'GET', path: '/api/websites/:id/history', desc: 'Get response time history', auth: true },
  { method: 'GET', path: '/api/alerts/rules', desc: 'List alert rules', auth: true },
  { method: 'POST', path: '/api/alerts/rules', desc: 'Create an alert rule', auth: true, body: { websiteId: 'string', type: 'EMAIL|SLACK|DISCORD', recipients: 'string[]', threshold: 'number' } },
  { method: 'PATCH', path: '/api/alerts/rules/:id', desc: 'Toggle or update an alert rule', auth: true },
  { method: 'DELETE', path: '/api/alerts/rules/:id', desc: 'Delete an alert rule', auth: true },
  { method: 'GET', path: '/api/alerts', desc: 'List alert history', auth: true },
  { method: 'GET', path: '/api/teams', desc: 'List user teams', auth: true },
  { method: 'POST', path: '/api/teams', desc: 'Create a new team', auth: true, body: { name: 'string' } },
  { method: 'POST', path: '/api/teams/:id/members', desc: 'Invite a team member', auth: true, body: { email: 'string' } },
  { method: 'DELETE', path: '/api/teams/:id/members/:memberId', desc: 'Remove a team member', auth: true },
  { method: 'DELETE', path: '/api/teams/:id', desc: 'Delete a team', auth: true },
  { method: 'GET', path: '/api/maintenance', desc: 'List maintenance windows', auth: true },
  { method: 'POST', path: '/api/maintenance', desc: 'Schedule maintenance', auth: true },
  { method: 'DELETE', path: '/api/maintenance/:id', desc: 'Cancel maintenance', auth: true },
  { method: 'GET', path: '/api/incidents', desc: 'List incident history', auth: true },
  { method: 'GET', path: '/api/settings/profile', desc: 'Get user profile', auth: true },
  { method: 'PATCH', path: '/api/settings/profile', desc: 'Update profile', auth: true },
  { method: 'PUT', path: '/api/settings/password', desc: 'Change password', auth: true },
  { method: 'GET', path: '/api/settings/api-keys', desc: 'List API keys', auth: true },
  { method: 'POST', path: '/api/settings/api-keys', desc: 'Create an API key', auth: true },
  { method: 'DELETE', path: '/api/settings/api-keys/:id', desc: 'Revoke an API key', auth: true },
  { method: 'GET', path: '/api/public/status/:slug', desc: 'Public status page (no auth)' },
]

const methodColors: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PUT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function ApiDocsPage({ onClose, inline }: Props) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL || 'https://kingx-project1.onrender.com'}${path}`)
    setCopied(path)
    setTimeout(() => setCopied(null), 2000)
  }

  const content = (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">API Documentation</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-slate-400 sm:block dark:text-slate-500">Base URL: {process.env.NEXT_PUBLIC_API_URL || 'https://kingx-project1.onrender.com'}</span>
          {onClose && <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><XCircle className="h-5 w-5" /></button>}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
        <Key className="h-3 w-3" />
        Authentication: Include <code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-700">Authorization: Bearer {'<token>'}</code> header for protected endpoints
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {endpoints.map((ep, i) => (
          <div key={i} className="px-6 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${methodColors[ep.method]}`}>{ep.method}</span>
                  <code className="break-all font-mono text-sm text-slate-800 dark:text-slate-200">{ep.path}</code>
                  {ep.auth && <Tooltip text="Requires authentication"><Shield className="h-3.5 w-3.5 shrink-0 text-amber-500" /></Tooltip>}
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{ep.desc}</p>
                {ep.body && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Body:</span>
                    <pre className="mt-1 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800 dark:text-slate-300">{JSON.stringify(ep.body, null, 2)}</pre>
                  </div>
                )}
              </div>
              <Tooltip text={copied === ep.path ? 'Copied!' : 'Copy full URL'}>
                <button onClick={() => copyPath(ep.path)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800">
                  {copied === ep.path ? <Copy className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Code2 className="h-4 w-4" />
          <span>Integrate with your tools using the KingX API. All responses are JSON. Authentication via Bearer token in the Authorization header.</span>
        </div>
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

export default ApiDocsPage

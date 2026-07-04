'use client'

import { Activity, BarChart3, Bell, ChevronRight, Globe2, Layers, Menu, Moon, Shield, Sun, Users, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from './ThemeProvider'
import Skeleton from './Skeleton'

interface Props {
  onOpenAuth: () => void
}

const features = [
  {
    icon: <Activity className="h-6 w-6" />,
    title: 'Real-time Monitoring',
    desc: 'Check your websites every 5 minutes with configurable intervals. Get instant status updates.',
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: 'Response Time Analytics',
    desc: 'Track response times with beautiful charts. Identify slowdowns before they become outages.',
  },
  {
    icon: <Bell className="h-6 w-6" />,
    title: 'Instant Alerts',
    desc: 'Get notified via email, Slack, or Discord when your sites go down. Never miss an incident.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Team Collaboration',
    desc: 'Invite team members, assign roles, and manage access. Work together on uptime monitoring.',
  },
  {
    icon: <Globe2 className="h-6 w-6" />,
    title: 'Multi-region Checks',
    desc: 'Monitor from multiple locations worldwide. Ensure global availability for your users.',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: '99.9% Uptime SLA',
    desc: 'Built on enterprise infrastructure. Your monitoring stays up so your sites stay up.',
  },
]

const pricing = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['10 websites', '5-minute checks', 'Email alerts', '24h history', '1 team member'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['50 websites', '1-minute checks', 'Slack & Discord alerts', '90-day history', '5 team members', 'API access'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    features: ['Unlimited websites', '30-second checks', 'All alert channels', '2-year history', 'Unlimited team members', 'Priority support', 'Custom integrations'],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function LandingPage({ onOpenAuth }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 400)
    return () => clearTimeout(t)
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-9 w-20 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>
        <main className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="mb-6 h-12 w-3/4 max-w-lg" />
            <Skeleton className="mb-2 h-6 w-5/6 max-w-xl" />
            <Skeleton className="mb-8 h-6 w-4/6 max-w-md" />
            <div className="flex gap-4">
              <Skeleton className="h-12 w-36 rounded-xl" />
              <Skeleton className="h-12 w-36 rounded-xl" />
            </div>
          </div>
          <div className="mt-20 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
                <Skeleton className="mb-4 h-10 w-10 rounded-lg" />
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
              <Activity className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">KingX</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Pricing</a>
            <a href="#about" className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">About</a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={onOpenAuth} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">
              Sign in
            </button>
            <button onClick={onOpenAuth} className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700">
              Get Started
            </button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 md:hidden dark:text-slate-400">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 pb-4 pt-2 md:hidden dark:border-slate-800 dark:bg-slate-900">
            <nav className="flex flex-col gap-2">
              <a href="#features" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">Features</a>
              <a href="#pricing" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">Pricing</a>
              <a href="#about" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">About</a>
              <hr className="my-1 border-slate-200 dark:border-slate-700" />
              <button onClick={() => { toggleTheme(); setMenuOpen(false) }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </button>
              <button onClick={() => { setMenuOpen(false); onOpenAuth() }} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">Sign in</button>
              <button onClick={() => { setMenuOpen(false); onOpenAuth() }} className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white">Get Started</button>
            </nav>
          </div>
        )}
      </header>

      <section className="relative min-h-screen pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200/30 via-transparent to-transparent dark:from-indigo-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-200/20 via-transparent to-transparent dark:from-purple-500/10" />

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
            <Zap className="h-4 w-4" />
            Now in public beta &middot; Free to use
          </div>

          <h1 className="max-w-4xl text-center text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Monitor your websites{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">with confidence</span>
          </h1>
          <p className="mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Track uptime, response times, and incidents across all your websites.
            Get alerted when things go down. Collaborate with your team.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <button
              onClick={onOpenAuth}
              className="flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 dark:shadow-indigo-500/20"
            >
              Start Monitoring Free
              <ChevronRight className="h-5 w-5" />
            </button>
            <a
              href="#features"
              className="flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-8 text-base font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              See Features
            </a>
          </div>

          <div className="mt-16 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
            {[
              ['10K+', 'Websites Monitored'],
              ['99.9%', 'Average Uptime'],
              ['< 30s', 'Alert Delivery'],
            ].map(([stat, label]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-white/60 p-6 text-center backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/60">
                <p className="text-3xl font-bold text-indigo-600">{stat}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative border-t border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Everything you need to stay online
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Built for developers and teams who need reliable monitoring without the complexity.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-slate-200 p-6 transition hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100 dark:border-slate-700 dark:hover:border-indigo-700 dark:hover:shadow-indigo-900/20">
                <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 ring-1 ring-indigo-100 dark:from-indigo-900/30 dark:to-purple-900/30 dark:text-indigo-400 dark:ring-indigo-800/50">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative border-t border-slate-200 bg-gradient-to-br from-indigo-50 to-purple-50 py-24 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Stats</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Trusted by growing teams
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Globe2 className="h-5 w-5" />, stat: '10,000+', label: 'Websites Monitored', color: 'text-indigo-600' },
              { icon: <Activity className="h-5 w-5" />, stat: '1M+', label: 'Daily Checks', color: 'text-emerald-600' },
              { icon: <Users className="h-5 w-5" />, stat: '500+', label: 'Active Teams', color: 'text-amber-600' },
              { icon: <Bell className="h-5 w-5" />, stat: '< 30s', label: 'Alert Delivery', color: 'text-purple-600' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className={`mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-white ${s.color} ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600`}>
                  {s.icon}
                </div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.stat}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="relative border-t border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">Pricing</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Start free. Upgrade when you grow.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.popular
                    ? 'border-indigo-200 bg-gradient-to-b from-indigo-50 to-white shadow-xl shadow-indigo-100 dark:border-indigo-700 dark:from-indigo-950/50 dark:to-slate-900 dark:shadow-indigo-900/20'
                    : 'border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Layers className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onOpenAuth}
                  className={`mt-8 flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:from-indigo-700 hover:to-purple-700'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="relative border-t border-slate-200 bg-gradient-to-br from-slate-900 to-slate-950 py-24 text-white dark:border-slate-800">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Ready to start monitoring?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Join thousands of teams who trust KingX to keep their websites online.
          </p>
          <button
            onClick={onOpenAuth}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-8 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-600 hover:to-purple-600"
          >
            Get Started Free
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-bold tracking-tight text-slate-900 dark:text-white">KingX</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} KingX. Built with TypeScript, Next.js &bull; Open source
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

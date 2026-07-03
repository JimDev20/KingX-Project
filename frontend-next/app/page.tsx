"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Globe2,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

type AuthMode = "login" | "register";
type WebsiteStatus = "UP" | "DOWN" | "PENDING" | "MAINTENANCE";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isVerified: boolean;
}

interface Website {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "HEAD";
  checkInterval: number;
  timeout: number;
  status: WebsiteStatus;
  lastChecked: string | null;
  responseTime: number | null;
  uptime: number;
  tags: string[];
  createdAt: string;
}

interface Stats {
  totalSites: number;
  upSites: number;
  downSites: number;
  pendingSites: number;
  uptime: number;
  averageResponseTime: number;
}

const emptyStats: Stats = {
  totalSites: 0,
  upSites: 0,
  downSites: 0,
  pendingSites: 0,
  uptime: 100,
  averageResponseTime: 0,
};

const statusStyles: Record<WebsiteStatus, string> = {
  UP: "border-emerald-200 bg-emerald-50 text-emerald-700",
  DOWN: "border-red-200 bg-red-50 text-red-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  MAINTENANCE: "border-slate-200 bg-slate-50 text-slate-600",
};

const statusIcons: Record<WebsiteStatus, React.ReactNode> = {
  UP: <CheckCircle2 className="h-4 w-4" />,
  DOWN: <XCircle className="h-4 w-4" />,
  PENDING: <Clock3 className="h-4 w-4" />,
  MAINTENANCE: <ShieldCheck className="h-4 w-4" />,
};

export default function Home() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("kingx_token") || "";
  });
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;

    const savedUser = localStorage.getItem("kingx_user");
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });
  const [authForm, setAuthForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  const [siteForm, setSiteForm] = useState({
    name: "",
    url: "",
    method: "GET",
    tags: "",
  });
  const [websites, setWebsites] = useState<Website[]>([]);
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState("");
  const [message, setMessage] = useState("");

  const filteredWebsites = useMemo(() => {
    return websites.filter((website) => {
      const matchesSearch =
        website.name.toLowerCase().includes(search.toLowerCase()) ||
        website.url.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || website.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, websites]);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token],
  );

  const request = useCallback(async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, options);
    const payload = response.status === 204 ? null : await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || "Request failed");
    }

    return payload as T;
  }, []);

  const loadDashboard = useCallback(async (activeToken = token) => {
    if (!activeToken) return;

    setLoading(true);
    setMessage("");

    try {
      const headers = {
        Authorization: `Bearer ${activeToken}`,
      };
      const [sitesPayload, statsPayload] = await Promise.all([
        request<{ items: Website[] }>("/websites?pageSize=50", { headers }),
        request<Stats>("/websites/stats", { headers }),
      ]);

      setWebsites(sitesPayload.items);
      setStats(statsPayload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [request, token]);

  useEffect(() => {
    if (token) {
      const timeoutId = window.setTimeout(() => {
        void loadDashboard(token);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [loadDashboard, token]);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const payload =
        authMode === "register"
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const result = await request<{ token: string; user: User }>(`/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      localStorage.setItem("kingx_token", result.token);
      localStorage.setItem("kingx_user", JSON.stringify(result.user));
      setToken(result.token);
      setUser(result.user);
      setAuthForm({ fullName: "", email: "", password: "" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kingx_token");
    localStorage.removeItem("kingx_user");
    setToken("");
    setUser(null);
    setWebsites([]);
    setStats(emptyStats);
  };

  const handleCreateWebsite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await request("/websites", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          name: siteForm.name,
          url: siteForm.url,
          method: siteForm.method,
          tags: siteForm.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });

      setSiteForm({ name: "", url: "", method: "GET", tags: "" });
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add website");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckWebsite = async (websiteId: string) => {
    setCheckingId(websiteId);
    setMessage("");

    try {
      await request(`/websites/${websiteId}/check`, {
        method: "POST",
        headers: authHeaders,
      });
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to check website");
    } finally {
      setCheckingId("");
    }
  };

  const handleDeleteWebsite = async (websiteId: string) => {
    setLoading(true);
    setMessage("");

    try {
      await request(`/websites/${websiteId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      await loadDashboard();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete website");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-[#f8fafc] text-slate-950">
        <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between bg-[#111827] p-8 text-white lg:p-12">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#22c55e] text-[#052e16]">
                <Activity className="h-6 w-6" />
              </div>
              <span className="text-xl font-semibold">KingX</span>
            </div>

            <div className="max-w-2xl py-16">
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.16em] text-emerald-300">
                Uptime Monitor v2
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Track site health, response time, and incidents from one command center.
              </h1>
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  ["Live checks", "Manual status checks with response time history."],
                  ["JWT security", "Protected dashboard and website operations."],
                  ["Deploy-ready", "Vercel frontend plus Render backend config."],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-lg border border-white/15 bg-white/8 p-4">
                    <p className="font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-400">Backend API: {API_URL}</p>
          </div>

          <div className="flex items-center justify-center p-6">
            <form onSubmit={handleAuth} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                {(["login", "register"] as AuthMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAuthMode(mode)}
                    className={`h-10 flex-1 rounded-md text-sm font-semibold capitalize transition ${
                      authMode === mode ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {authMode === "register" && (
                <label className="mb-4 block text-sm font-medium text-slate-700">
                  Full name
                  <input
                    value={authForm.fullName}
                    onChange={(event) => setAuthForm({ ...authForm, fullName: event.target.value })}
                    className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500"
                    autoComplete="name"
                  />
                </label>
              )}

              <label className="mb-4 block text-sm font-medium text-slate-700">
                Email
                <input
                  value={authForm.email}
                  onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500"
                  autoComplete="email"
                  type="email"
                />
              </label>

              <label className="mb-5 block text-sm font-medium text-slate-700">
                Password
                <input
                  value={authForm.password}
                  onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                  className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500"
                  autoComplete={authMode === "login" ? "current-password" : "new-password"}
                  type="password"
                />
              </label>

              {message && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {authMode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#111827] text-emerald-300">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold">KingX Monitor</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="space-y-4">
          <form onSubmit={handleCreateWebsite} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              <h2 className="font-semibold">Add Website</h2>
            </div>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Name
              <input
                value={siteForm.name}
                onChange={(event) => setSiteForm({ ...siteForm, name: event.target.value })}
                className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500"
                placeholder="Main website"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              URL
              <input
                value={siteForm.url}
                onChange={(event) => setSiteForm({ ...siteForm, url: event.target.value })}
                className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500"
                placeholder="https://example.com"
                type="url"
              />
            </label>
            <label className="mb-3 block text-sm font-medium text-slate-700">
              Method
              <select
                value={siteForm.method}
                onChange={(event) => setSiteForm({ ...siteForm, method: event.target.value })}
                className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500"
              >
                <option>GET</option>
                <option>HEAD</option>
                <option>POST</option>
              </select>
            </label>
            <label className="mb-4 block text-sm font-medium text-slate-700">
              Tags
              <input
                value={siteForm.tags}
                onChange={(event) => setSiteForm({ ...siteForm, tags: event.target.value })}
                className="mt-2 h-10 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-indigo-500"
                placeholder="prod, api"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add site
            </button>
          </form>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard icon={<Globe2 />} label="Total Sites" value={stats.totalSites} tone="indigo" />
            <StatCard icon={<CheckCircle2 />} label="Uptime" value={`${stats.uptime}%`} tone="emerald" />
            <StatCard icon={<AlertTriangle />} label="Down" value={stats.downSites} tone="red" />
            <StatCard icon={<Clock3 />} label="Avg Response" value={`${stats.averageResponseTime}ms`} tone="amber" />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-xl font-semibold">Websites</h1>
                <p className="text-sm text-slate-500">Search, filter, check, and manage monitored sites.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-indigo-500 sm:w-64"
                    placeholder="Search websites"
                  />
                </label>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All status</option>
                  <option value="UP">Up</option>
                  <option value="DOWN">Down</option>
                  <option value="PENDING">Pending</option>
                  <option value="MAINTENANCE">Maintenance</option>
                </select>
                <button
                  type="button"
                  onClick={() => void loadDashboard()}
                  title="Refresh"
                  className="grid h-10 w-10 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {message && (
              <div className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Website</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Uptime</th>
                    <th className="px-4 py-3">Response</th>
                    <th className="px-4 py-3">Last Checked</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWebsites.map((website) => (
                    <tr key={website.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-950">{website.name}</div>
                        <a className="text-slate-500 hover:text-indigo-600" href={website.url} target="_blank" rel="noreferrer">
                          {website.url}
                        </a>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {website.tags.map((tag) => (
                            <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[website.status]}`}>
                          {statusIcons[website.status]}
                          {website.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium">{website.uptime}%</td>
                      <td className="px-4 py-4">{website.responseTime ? `${website.responseTime}ms` : "-"}</td>
                      <td className="px-4 py-4 text-slate-500">
                        {website.lastChecked ? new Date(website.lastChecked).toLocaleString() : "Not checked"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void handleCheckWebsite(website.id)}
                            title="Run check"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            {checkingId === website.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteWebsite(website.id)}
                            title="Delete website"
                            className="grid h-9 w-9 place-items-center rounded-lg border border-slate-300 text-slate-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
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

            {filteredWebsites.length === 0 && (
              <div className="grid place-items-center px-4 py-16 text-center">
                <Globe2 className="mb-3 h-10 w-10 text-slate-300" />
                <p className="font-semibold">No websites found</p>
                <p className="mt-1 text-sm text-slate-500">Add a site or adjust your filters.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "indigo" | "emerald" | "red" | "amber";
}) {
  const tones = {
    indigo: "bg-indigo-50 text-indigo-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`mb-4 grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

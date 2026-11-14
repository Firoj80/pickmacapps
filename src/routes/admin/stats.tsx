import { useState, useMemo } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, useAdminNotice } from "@/components/admin-shell";
import { ensureAdminSession, getCachedAdminApps } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";
import type { AppItem } from "@/lib/catalog";

export const Route = createFileRoute("/admin/stats")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminApps(),
  component: AppStatsAdminPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "App Analytics & Clicks — Admin",
      description: "Directory click tracking and try app conversion statistics for all Mac apps.",
      path: "/admin/stats",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

type SortField = "clicks" | "try" | "conversion" | "name";

function AppStatsAdminPage() {
  const apps = Route.useLoaderData();
  const notice = useAdminNotice();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "clicked" | "free" | "paid">("all");
  const [sort, setSort] = useState<SortField>("clicks");

  // Summary KPI Calculations
  const { totalCardClicks, totalTryClicks, topApp, maxClicks } = useMemo(() => {
    let cardSum = 0;
    let trySum = 0;
    let max = 1;
    let best: AppItem | null = null;
    let bestTotal = -1;

    for (const app of apps) {
      const c = Number(app.clickCount ?? 0);
      const t = Number(app.tryCount ?? 0);
      cardSum += c;
      trySum += t;
      if (c > max) max = c;
      if (c + t > bestTotal) {
        bestTotal = c + t;
        best = app;
      }
    }
    return {
      totalCardClicks: cardSum,
      totalTryClicks: trySum,
      topApp: best,
      maxClicks: max,
    };
  }, [apps]);

  const overallConversion =
    totalCardClicks > 0 ? ((totalTryClicks / totalCardClicks) * 100).toFixed(1) : "0.0";

  // Filter & Sort Apps
  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apps
      .filter((app) => {
        if (filter === "clicked" && Number(app.clickCount ?? 0) === 0 && Number(app.tryCount ?? 0) === 0) {
          return false;
        }
        if (filter === "free" && app.pricing !== "free") return false;
        if (filter === "paid" && app.pricing === "free") return false;
        if (!q) return true;
        return (
          app.name.toLowerCase().includes(q) ||
          app.slug.toLowerCase().includes(q) ||
          app.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const cA = Number(a.clickCount ?? 0);
        const cB = Number(b.clickCount ?? 0);
        const tA = Number(a.tryCount ?? 0);
        const tB = Number(b.tryCount ?? 0);

        if (sort === "clicks") return cB - cA || tB - tA;
        if (sort === "try") return tB - tA || cB - cA;
        if (sort === "conversion") {
          const rateA = cA > 0 ? tA / cA : 0;
          const rateB = cB > 0 ? tB / cB : 0;
          return rateB - rateA || cB - cA;
        }
        return a.name.localeCompare(b.name);
      });
  }, [apps, search, filter, sort]);

  return (
    <AdminShell
      title="App Analytics & Engagement"
      lede="Live click statistics: Card interactions, 'Try App' button referrals, and conversion performance."
      active="stats"
    >
      <Notice {...notice} />

      <div className="space-y-6">
        {/* KPI Metric Cards */}
        <section aria-label="Summary statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card Clicks */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Card Clicks</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-sm">
                👁️
              </span>
            </div>
            <div className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
              {totalCardClicks.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-muted">Visitors opening app modal cards</p>
          </div>

          {/* Try App Clicks */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Try App Clicks</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-sm">
                🚀
              </span>
            </div>
            <div className="mt-2 font-display text-3xl font-bold tracking-tight text-emerald-600">
              {totalTryClicks.toLocaleString()}
            </div>
            <p className="mt-1 text-[11px] text-muted">Outbound website button clicks</p>
          </div>

          {/* Conversion Rate */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Conversion Rate</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-sm">
                🎯
              </span>
            </div>
            <div className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
              {overallConversion}%
            </div>
            <p className="mt-1 text-[11px] text-muted">Try clicks vs. card views ratio</p>
          </div>

          {/* Top Performer */}
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">Top Performer</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-sm">
                🏆
              </span>
            </div>
            <div className="mt-2 truncate text-lg font-bold text-ink">
              {topApp ? topApp.name : "None yet"}
            </div>
            <p className="mt-1 text-[11px] text-muted truncate">
              {topApp
                ? `${Number(topApp.clickCount ?? 0)} card · ${Number(topApp.tryCount ?? 0)} try clicks`
                : "Awaiting visitor clicks"}
            </p>
          </div>
        </section>

        {/* Filter, Search & Table Section */}
        <section className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
          {/* Header Controls */}
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  placeholder="Search by name, slug, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-line bg-stone-50/70 px-3.5 py-2 text-xs text-ink placeholder:text-muted focus:border-ink focus:bg-white focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-ink cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "all" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100"
                }`}
              >
                All ({apps.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("clicked")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "clicked" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100"
                }`}
              >
                Active Clicks ({apps.filter((a) => Number(a.clickCount ?? 0) > 0 || Number(a.tryCount ?? 0) > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setFilter("free")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "free" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100"
                }`}
              >
                Free Only
              </button>
              <button
                type="button"
                onClick={() => setFilter("paid")}
                className={`rounded-lg px-2.5 py-1.5 font-medium transition cursor-pointer ${
                  filter === "paid" ? "bg-ink text-canvas font-semibold" : "text-muted hover:bg-stone-100"
                }`}
              >
                Paid Only
              </button>
            </div>
          </div>

          {/* Table & Cards */}
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">
              No apps matched your current search or filter.
            </div>
          ) : (
            <>
              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-line bg-stone-50/70 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-5 py-3">App Information</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Pricing</th>
                      <th
                        className="px-4 py-3 cursor-pointer hover:text-ink transition"
                        onClick={() => setSort("clicks")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Card Clicks {sort === "clicks" ? "▼" : ""}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer hover:text-ink transition"
                        onClick={() => setSort("try")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Try App Clicks {sort === "try" ? "▼" : ""}
                        </span>
                      </th>
                      <th
                        className="px-4 py-3 cursor-pointer hover:text-ink transition"
                        onClick={() => setSort("conversion")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Conversion % {sort === "conversion" ? "▼" : ""}
                        </span>
                      </th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filteredApps.map((app) => {
                      const c = Number(app.clickCount ?? 0);
                      const t = Number(app.tryCount ?? 0);
                      const convRate = c > 0 ? ((t / c) * 100).toFixed(1) : "0.0";
                      const pctOfMax = maxClicks > 0 ? Math.min(100, Math.round((c / maxClicks) * 100)) : 0;

                      return (
                        <tr key={app.id} className="hover:bg-stone-50/40 transition">
                          {/* App Info */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {app.icon ? (
                                <img
                                  src={app.icon}
                                  alt=""
                                  className="h-8 w-8 rounded-lg object-cover ring-1 ring-line/70"
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-muted">
                                  {app.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-1.5 font-semibold text-ink">
                                  <span>{app.name}</span>
                                  {app.editorChoice ? (
                                    <span className="rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">
                                      {app.featuredTier === "article" ? "🌟 Gold" : "🔹 Blue"}
                                    </span>
                                  ) : null}
                                  {app.isHot ? (
                                    <span className="rounded bg-rose-100 px-1 text-[10px] font-bold text-rose-700">
                                      🔥 Hot
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[11px] text-muted">/{app.slug}</div>
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3.5 text-xs text-muted">
                            {app.category}
                          </td>

                          {/* Pricing */}
                          <td className="px-4 py-3.5">
                            <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-700 capitalize">
                              {app.pricing}
                            </span>
                          </td>

                          {/* Card Clicks */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-ink">
                                {c.toLocaleString()}
                              </span>
                              {c > 0 ? (
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-stone-100">
                                  <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${Math.max(8, pctOfMax)}%` }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </td>

                          {/* Try App Clicks */}
                          <td className="px-4 py-3.5">
                            <span className={`font-display font-bold ${t > 0 ? "text-emerald-600" : "text-muted"}`}>
                              {t.toLocaleString()}
                            </span>
                          </td>

                          {/* Conversion Rate */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                Number(convRate) >= 15
                                  ? "bg-emerald-100 text-emerald-800"
                                  : Number(convRate) > 0
                                  ? "bg-stone-100 text-stone-700"
                                  : "text-muted"
                              }`}
                            >
                              {convRate}%
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to="/app/$slug"
                                params={{ slug: app.slug }}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium text-body hover:bg-stone-50 hover:text-ink transition"
                              >
                                Live ↗
                              </Link>
                              {app.dashboardToken ? (
                                <Link
                                  to="/dashboard/$token"
                                  params={{ token: app.dashboardToken }}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                                  title="Open Submitter Mini-Dashboard"
                                >
                                  Dashboard
                                </Link>
                              ) : null}
                              <Link
                                to="/admin/apps/$id"
                                params={{ id: app.id }}
                                className="rounded-lg bg-ink px-2.5 py-1 text-xs font-medium text-canvas hover:opacity-90 transition"
                              >
                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Leaderboard View (hidden on desktop) */}
              <div className="block md:hidden divide-y divide-line">
                {filteredApps.map((app, idx) => {
                  const c = Number(app.clickCount ?? 0);
                  const t = Number(app.tryCount ?? 0);
                  const convRate = c > 0 ? ((t / c) * 100).toFixed(1) : "0.0";
                  const pctOfMax = maxClicks > 0 ? Math.min(100, Math.round((c / maxClicks) * 100)) : 0;

                  return (
                    <div key={app.id} className="p-4 space-y-3">
                      {/* Top Header: Rank + Icon + Name + Tier */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                              : idx === 1
                              ? "bg-stone-200 text-stone-700"
                              : idx === 2
                              ? "bg-amber-700/10 text-amber-900"
                              : "bg-stone-100 text-muted"
                          }`}>
                            {idx + 1}
                          </span>
                          {app.icon ? (
                            <img
                              src={app.icon}
                              alt=""
                              className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-line/70"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xs font-bold text-muted">
                              {app.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 font-semibold text-ink truncate">
                              <span className="truncate">{app.name}</span>
                              {app.editorChoice ? (
                                <span className="shrink-0 rounded bg-amber-100 px-1 text-[9.5px] font-bold text-amber-800">
                                  {app.featuredTier === "article" ? "🌟 Gold" : "🔹 Blue"}
                                </span>
                              ) : null}
                              {app.isHot ? (
                                <span className="shrink-0 rounded bg-rose-100 px-1 text-[9.5px] font-bold text-rose-700">
                                  🔥
                                </span>
                              ) : null}
                            </div>
                            <div className="text-[11px] text-muted truncate">/{app.slug} · <span className="capitalize">{app.pricing}</span></div>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold ${
                            Number(convRate) >= 15
                              ? "bg-emerald-100 text-emerald-800"
                              : Number(convRate) > 0
                              ? "bg-stone-100 text-stone-700"
                              : "text-muted"
                          }`}
                        >
                          {convRate}% conv
                        </span>
                      </div>

                      {/* Performance Bar & Stats Grid */}
                      <div className="rounded-xl border border-line bg-stone-50/60 p-3 space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="rounded-lg bg-white p-2 border border-line">
                            <div className="text-[10px] uppercase font-semibold text-muted">Card Clicks</div>
                            <div className="mt-0.5 font-display text-base font-bold text-ink">
                              {c.toLocaleString()}
                            </div>
                          </div>
                          <div className="rounded-lg bg-white p-2 border border-line">
                            <div className="text-[10px] uppercase font-semibold text-muted">Try Referrals</div>
                            <div className={`mt-0.5 font-display text-base font-bold ${t > 0 ? "text-emerald-600" : "text-muted"}`}>
                              {t.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {c > 0 ? (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10.5px] text-muted">
                              <span>Catalog Share</span>
                              <span>{pctOfMax}% of top</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(5, pctOfMax)}%` }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Link
                          to="/app/$slug"
                          params={{ slug: app.slug }}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-body hover:text-ink"
                        >
                          Live ↗
                        </Link>
                        {app.dashboardToken ? (
                          <Link
                            to="/dashboard/$token"
                            params={{ token: app.dashboardToken }}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                          >
                            Dashboard
                          </Link>
                        ) : null}
                        <Link
                          to="/admin/apps/$id"
                          params={{ id: app.id }}
                          className="rounded-xl bg-ink px-4 py-1.5 text-xs font-semibold text-canvas"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

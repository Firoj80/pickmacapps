import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Pill, statusTone } from "@/components/admin-shell";
import { pricingLabel } from "@/lib/catalog";
import { fetchAdminApps, ensureAdminSession, getCachedAdminApps } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/apps/")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminApps(),
  component: AppsPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Admin apps",
      description: "Manage PickMacApps listings.",
      path: "/admin/apps",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

const filters = [
  { id: "all", label: "All Apps" },
  { id: "hot", label: "🔥 Hot" },
  { id: "blue", label: "🔹 Blue Tier" },
  { id: "gold", label: "🌟 Gold Tier" },
  { id: "published", label: "Published" },
  { id: "pending", label: "Pending" },
  { id: "unpublished", label: "Unpublished" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function AppsPage() {
  const apps = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const hotCount = useMemo(() => apps.filter((a) => a.isHot).length, [apps]);
  const blueCount = useMemo(() => apps.filter((a) => a.editorChoice && a.featuredTier !== "article").length, [apps]);
  const goldCount = useMemo(() => apps.filter((a) => a.editorChoice && a.featuredTier === "article").length, [apps]);
  const publishedCount = useMemo(() => apps.filter((a) => a.status === "published").length, [apps]);
  const unpublishedCount = useMemo(() => apps.filter((a) => a.status === "unpublished" || a.status === "pending").length, [apps]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (filter === "hot" && !app.isHot) return false;
      if (filter === "blue" && (!app.editorChoice || app.featuredTier === "article")) return false;
      if (filter === "gold" && (!app.editorChoice || app.featuredTier !== "article")) return false;
      if (filter === "published" && app.status !== "published") return false;
      if (filter === "pending" && app.status !== "pending") return false;
      if (filter === "unpublished" && app.status !== "unpublished") return false;

      if (!needle) return true;
      return (
        app.name.toLowerCase().includes(needle) ||
        app.slug.includes(needle) ||
        (app.categoryName && app.categoryName.toLowerCase().includes(needle))
      );
    });
  }, [apps, filter, query]);

  return (
    <AdminShell
      title="Apps Directory Management"
      lede={`${apps.length} total listings. Edit metadata, manage tier placements, and toggle Hot featured apps.`}
      active="apps"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {unpublishedCount > 0 ? (
            <form method="post" action="/api/admin/publish-all">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 cursor-pointer"
              >
                <span>🚀</span>
                <span>Publish All Unpublished ({unpublishedCount})</span>
              </button>
            </form>
          ) : null}
          <Link
            to="/admin/apps/new"
            preload="intent"
            className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas shadow-xs transition hover:opacity-90"
          >
            <span>+</span>
            <span>Add New App</span>
          </Link>
        </div>
      }
    >
      {/* Real-time Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-line bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-medium text-muted">Total Apps</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-ink">{apps.length}</span>
            <span className="text-[11px] text-muted">apps</span>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-rose-800">🔥 Hot Featured</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-rose-900">{hotCount}</span>
            <span className="text-[11px] text-rose-700/80">apps</span>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50/40 p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-sky-800">🔹 Blue Tier</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-sky-900">{blueCount} / 3</span>
            <span className="text-[11px] text-sky-700/80">slots</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-800">🌟 Gold Tier</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-900">{goldCount} / 3</span>
            <span className="text-[11px] text-amber-700/80">slots</span>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-line bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-medium text-muted">Review Queue</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`text-xl font-bold ${unpublishedCount > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {unpublishedCount}
            </span>
            <span className="text-[11px] text-muted">pending</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <svg
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, slug, category..."
            aria-label="Search apps"
            className="h-10 w-full rounded-xl border border-line bg-white pr-4 pl-9 text-xs text-ink placeholder:text-muted shadow-2xs transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {filters.map((item) => {
            const countLabel =
              item.id === "all"
                ? ` (${apps.length})`
                : item.id === "hot"
                ? ` (${hotCount})`
                : item.id === "blue"
                ? ` (${blueCount}/3)`
                : item.id === "gold"
                ? ` (${goldCount}/3)`
                : item.id === "published"
                ? ` (${publishedCount})`
                : item.id === "unpublished" || item.id === "pending"
                ? ` (${unpublishedCount})`
                : "";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === item.id
                    ? "bg-ink text-canvas shadow-xs font-semibold"
                    : "bg-white text-body ring-1 ring-line hover:bg-stone-50"
                }`}
              >
                <span>{item.label}</span>
                <span className="opacity-80">{countLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern Elevated Apps Table */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="text-[11px] font-semibold tracking-wider text-muted uppercase bg-stone-50/70 border-b border-line">
              <tr>
                <th className="px-5 py-3">App Information</th>
                <th className="px-4 py-3">Pricing Model</th>
                <th className="px-4 py-3">Status & Placement Tier</th>
                <th className="px-4 py-3">Badge Check</th>
                <th className="px-4 py-3">🔥 Hot Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((app) => (
                <tr key={app.id} className="group transition hover:bg-stone-50/40">
                  {/* App Info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: app.id }}
                        preload="intent"
                        className="relative shrink-0"
                      >
                        {app.icon ? (
                          <img
                            alt={app.name}
                            src={app.icon}
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                            className="h-10 w-10 rounded-xl object-cover ring-1 ring-line shadow-2xs transition group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-xs font-bold text-muted ring-1 ring-line">
                            APP
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to="/admin/apps/$id"
                            params={{ id: app.id }}
                            preload="intent"
                            className="font-semibold text-ink group-hover:text-accent transition-colors truncate max-w-[200px]"
                          >
                            {app.name}
                          </Link>
                          {app.website ? (
                            <a
                              href={app.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open website"
                              className="text-muted hover:text-ink transition"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span className="capitalize">{app.categoryName || app.category}</span>
                          <span>·</span>
                          <span className="font-mono text-[11px] text-muted/80">/app/{app.slug}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Pricing Model */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                        app.pricing === "free"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : app.pricing === "freemium"
                          ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                          : "bg-surface-2 text-stone-700 dark:text-stone-300 ring-1 ring-line"
                      }`}
                    >
                      {pricingLabel[app.pricing] || "Free"}
                    </span>
                  </td>

                  {/* Status & Placement */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill tone={statusTone(app.status)}>{app.status}</Pill>
                      {app.editorChoice ? (
                        app.featuredTier === "article" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                            <span>🌟</span>
                            <span>Gold Tier</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[11px] font-bold text-sky-800 dark:text-sky-300">
                            <span>🔹</span>
                            <span>Blue Tier</span>
                          </span>
                        )
                      ) : null}
                    </div>
                    {app.editorChoice && app.featuredUntil ? (
                      <div className="mt-1 text-[10px] font-mono text-muted">
                        {(() => {
                          const until = new Date(app.featuredUntil);
                          const days = Math.ceil((until.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                          const formatted = until.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          return days > 0 ? `Paid expires: ${formatted} (${days}d left)` : `Paid expired: ${formatted}`;
                        })()}
                      </div>
                    ) : null}
                  </td>

                  {/* Reciprocal Badge Status */}
                  <td className="px-4 py-3.5 text-xs whitespace-nowrap">
                    {app.editorChoice ? (
                      <span className="text-muted/80 italic">Not required (Paid)</span>
                    ) : app.badgeStatus === "ok" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <span>✓</span>
                        <span>Badge Active</span>
                      </span>
                    ) : app.badgeStatus === "fail" ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-medium">
                        <span>✕</span>
                        <span>Missing Badge</span>
                      </span>
                    ) : (
                      <span className="text-muted">{app.badgeStatus || "Unchecked"}</span>
                    )}
                  </td>

                  {/* Hot Featured Toggle */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <form method="post" action="/api/admin/toggle-hot" className="inline">
                      <input type="hidden" name="id" value={app.id} />
                      <input type="hidden" name="return_to" value="/admin/apps" />
                      <button
                        type="submit"
                        title={app.isHot ? "Remove Hot status" : "Mark app as Hot"}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                          app.isHot
                            ? "bg-rose-600 text-white shadow-xs hover:bg-rose-700"
                            : "border border-line bg-white text-muted hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50"
                        }`}
                      >
                        <span>🔥</span>
                        <span>{app.isHot ? "Hot Active" : "Make Hot"}</span>
                      </button>
                    </form>
                    {app.isHot && app.hotMarkedAt ? (
                      <div className="mt-1 text-[10px] text-muted font-mono">
                        {(() => {
                          const marked = new Date(app.hotMarkedAt);
                          const expiry = new Date(marked.getTime() + 30 * 24 * 60 * 60 * 1000);
                          const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                          const formatted = expiry.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                          return `Expires: ${formatted} (${daysLeft}d)`;
                        })()}
                      </div>
                    ) : null}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {app.status === "published" ? (
                        <Link
                          to="/app/$slug"
                          params={{ slug: app.slug }}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium text-body hover:text-ink hover:border-line-2 transition"
                        >
                          <span>Live</span>
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </Link>
                      ) : null}
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: app.id }}
                        preload="intent"
                        className="inline-flex items-center rounded-lg bg-ink px-3 py-1 text-xs font-semibold text-canvas transition hover:opacity-90"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {shown.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-ink">No apps match this query or filter</p>
            <p className="mt-1 text-xs text-muted">Try clearing your search query or switching filters.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-3 inline-block rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-body hover:bg-stone-50"
            >
              Reset Search
            </button>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}

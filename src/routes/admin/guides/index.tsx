import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Pill, statusTone } from "@/components/admin-shell";
import { fetchAdminGuides, ensureAdminSession, getCachedAdminGuides } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/guides/")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminGuides(),
  component: GuidesPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Admin guides",
      description: "Manage PickMacApps guides.",
      path: "/admin/guides",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function GuidesPage() {
  const guides = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const publishedCount = useMemo(() => guides.filter((g) => g.status === "published").length, [guides]);
  const draftCount = useMemo(() => guides.filter((g) => g.status !== "published").length, [guides]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter((guide) => {
      if (filter === "published" && guide.status !== "published") return false;
      if (filter === "draft" && guide.status === "published") return false;

      if (!q) return true;
      return (
        guide.title.toLowerCase().includes(q) ||
        guide.slug.toLowerCase().includes(q) ||
        (guide.excerpt && guide.excerpt.toLowerCase().includes(q))
      );
    });
  }, [guides, query, filter]);

  return (
    <AdminShell
      title="Editorial Guides & Articles"
      lede={`${guides.length} total articles. Manage publications, draft new tutorials, and review content.`}
      active="guides"
      actions={
        <Link
          to="/admin/guides/new"
          preload="intent"
          className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas shadow-xs transition hover:opacity-90"
        >
          <span>✍️</span>
          <span>Write New Guide</span>
        </Link>
      }
    >
      {/* Metrics Banner */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-2xs">
          <p className="text-xs font-medium text-muted">Total Guides</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-ink">{guides.length}</span>
            <span className="text-xs text-muted">authored articles</span>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/40 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">Live on Site</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">
              {publishedCount}
            </span>
            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80">published</span>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/40 p-4 shadow-2xs">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">In Progress</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-amber-900 dark:text-amber-200">
              {draftCount}
            </span>
            <span className="text-xs text-amber-700/80 dark:text-amber-400/80">drafts</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Tabs */}
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides by title or slug..."
            aria-label="Search guides"
            className="h-10 w-full rounded-xl border border-line bg-white pr-4 pl-9 text-xs text-ink placeholder:text-muted shadow-2xs transition-colors hover:border-line-2 focus-visible:border-accent focus-visible:outline-none"
          />
        </div>

        <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-xl bg-surface-2 p-1 border border-line">
          {(
            [
              ["all", `All (${guides.length})`],
              ["published", `Published (${publishedCount})`],
              ["draft", `Drafts (${draftCount})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`h-8 rounded-lg px-3 text-xs font-medium transition-all ${
                filter === id
                  ? "bg-ink text-canvas shadow-xs font-semibold"
                  : "text-body hover:text-ink hover:bg-surface/60"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Guides Table & Mobile Cards */}
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        {shown.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-medium text-ink">No guides match your query</p>
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
        ) : (
          <>
            {/* Desktop Table View (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50/60 text-[11px] font-semibold uppercase tracking-wider text-muted border-b border-line">
                  <tr>
                    <th className="px-5 py-3">Guide / Article</th>
                    <th className="px-4 py-3">Published Date</th>
                    <th className="px-4 py-3">Read Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((guide) => (
                    <tr key={guide.slug} className="group transition hover:bg-stone-50/40">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <Link
                            to="/admin/guides/$slug"
                            params={{ slug: guide.slug }}
                            preload="intent"
                            className="font-semibold text-ink group-hover:text-accent transition-colors"
                          >
                            {guide.title}
                          </Link>
                          {guide.excerpt ? (
                            <p className="mt-1 line-clamp-1 max-w-xl text-xs text-muted">
                              {guide.excerpt}
                            </p>
                          ) : null}
                          <span className="mt-1 text-[11px] font-mono text-muted/70">
                            /blog/{guide.slug}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-muted whitespace-nowrap">
                        {guide.date || "—"}
                      </td>
                      <td className="px-4 py-4 text-xs text-body whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[11px] text-stone-700">
                          <span>⏱</span>
                          <span>{guide.minutes || 3} min</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Pill tone={statusTone(guide.status)}>{guide.status}</Pill>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {guide.status === "published" ? (
                            <Link
                              to="/blog/$slug"
                              params={{ slug: guide.slug }}
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
                            to="/admin/guides/$slug"
                            params={{ slug: guide.slug }}
                            preload="intent"
                            className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1 text-xs font-semibold text-canvas transition hover:opacity-90"
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

            {/* Mobile Article Card Stack (hidden on desktop) */}
            <div className="block md:hidden divide-y divide-line">
              {shown.map((guide) => (
                <div key={guide.slug} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to="/admin/guides/$slug"
                      params={{ slug: guide.slug }}
                      preload="intent"
                      className="font-semibold text-sm text-ink hover:underline"
                    >
                      {guide.title}
                    </Link>
                    <Pill tone={statusTone(guide.status)}>{guide.status}</Pill>
                  </div>

                  {guide.excerpt ? (
                    <p className="text-xs text-muted line-clamp-2">{guide.excerpt}</p>
                  ) : null}

                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span className="font-mono text-[11px]">/blog/{guide.slug}</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 px-2 py-0.5 text-[10.5px] text-stone-700">
                      ⏱ {guide.minutes || 3} min
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-line/60">
                    {guide.status === "published" ? (
                      <Link
                        to="/blog/$slug"
                        params={{ slug: guide.slug }}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-body hover:text-ink"
                      >
                        Live ↗
                      </Link>
                    ) : null}
                    <Link
                      to="/admin/guides/$slug"
                      params={{ slug: guide.slug }}
                      className="rounded-xl bg-ink px-4 py-1.5 text-xs font-semibold text-canvas"
                    >
                      Edit Guide
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}

import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, useAdminNotice } from "@/components/admin-shell";
import { fetchAdminHome, ensureAdminSession, getCachedAdminHome } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/badges")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminHome(),
  component: BadgesAdminPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Free-Listing Badges — Admin",
      description: "Monitor and verify reciprocal backlinks for free listings.",
      path: "/admin/badges",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function BadgesAdminPage() {
  const data = Route.useLoaderData();
  const notice = useAdminNotice();

  const total = data.badges.length;
  const active = data.badges.filter((b) => b.badgeStatus === "ok").length;
  const missing = data.badges.filter((b) => b.badgeStatus !== "ok").length;

  return (
    <AdminShell
      title="Free-Listing Badges"
      lede="Automatic verification for reciprocal backlinks on user-submitted free apps."
      active="badges"
    >
      <Notice {...notice} />

      <div className="space-y-6">
        {/* Metric & Health Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Free Apps Monitored</div>
            <div className="mt-1 text-2xl font-bold text-ink">{total}</div>
            <div className="mt-0.5 text-xs text-muted">User submissions only</div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">Active Badges</span>
              <span className="text-xs font-bold text-emerald-600">
                {total > 0 ? Math.round((active / total) * 100) : 100}% Health
              </span>
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">{active}</div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${total > 0 ? (active / total) * 100 : 100}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted">Missing Badges</div>
            <div className="mt-1 text-2xl font-bold text-rose-600">{missing}</div>
            <div className="mt-0.5 text-xs text-muted">Needs verification / auto-unpublish</div>
          </div>
        </div>

        {/* Action and Table */}
        <section className="rounded-2xl border border-line bg-white shadow-xs overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Monitored Free Listings</h2>
              <p className="text-xs text-muted">Daily cron checks run at 8 AM UTC. Catalog seeded apps are permanently exempt.</p>
            </div>
            <form method="post" action="/api/admin/badges">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas hover:opacity-90 transition cursor-pointer"
              >
                Run Verification Now
              </button>
            </form>
          </div>

          {data.badges.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted">No user-submitted free listings found.</p>
          ) : (
            <>
              {/* Desktop Table View (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50/70 border-b border-line text-[11px] font-semibold text-muted uppercase">
                    <tr>
                      <th className="px-5 py-3">App Name</th>
                      <th className="px-4 py-3">Website</th>
                      <th className="px-4 py-3">Badge Status</th>
                      <th className="px-4 py-3">Directory Status</th>
                      <th className="px-4 py-3">Details</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.badges.map((app) => (
                      <tr key={app.id} className="hover:bg-stone-50/40 transition">
                        <td className="px-5 py-3.5 font-semibold text-ink">{app.name}</td>
                        <td className="px-4 py-3.5">
                          <a
                            href={app.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-muted hover:text-ink underline"
                          >
                            {app.website}
                          </a>
                        </td>
                        <td className="px-4 py-3.5">
                          {app.badgeStatus === "ok" ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <span>✓</span> Verified Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                              <span>✕</span> {app.badgeStatus || "Missing"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {app.status === "published" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Published (Live)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-rose-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              Unpublished (Offline)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted truncate max-w-xs">
                          {app.badgeDetail || "No errors reported"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            to="/admin/apps/$id"
                            params={{ id: app.id }}
                            className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-medium text-ink hover:bg-stone-50"
                          >
                            Edit App
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Stack View (hidden on desktop) */}
              <div className="block md:hidden divide-y divide-line">
                {data.badges.map((app) => (
                  <div key={app.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-sm font-semibold text-ink">{app.name}</span>
                        <div className="mt-0.5">
                          <a
                            href={app.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-muted underline hover:text-ink"
                          >
                            {app.website}
                          </a>
                        </div>
                      </div>
                      {app.status === "published" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-bold text-rose-700 ring-1 ring-rose-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                          Offline
                        </span>
                      )}
                    </div>

                    <div className="rounded-xl border border-line bg-stone-50/60 p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-muted">Badge Status:</span>
                        {app.badgeStatus === "ok" ? (
                          <span className="font-semibold text-emerald-600">✓ Verified Active</span>
                        ) : (
                          <span className="font-semibold text-rose-600">✕ {app.badgeStatus || "Missing"}</span>
                        )}
                      </div>
                      {app.badgeDetail ? (
                        <div className="flex items-start justify-between gap-2 pt-1 border-t border-line/60">
                          <span className="text-muted shrink-0">Audit Detail:</span>
                          <span className="text-right text-muted line-clamp-2">{app.badgeDetail}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: app.id }}
                        className="w-full rounded-xl border border-line bg-white py-2 text-center text-xs font-semibold text-ink hover:bg-stone-50"
                      >
                        Edit Listing Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

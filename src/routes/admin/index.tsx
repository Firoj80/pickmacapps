import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, Pill, fieldClass, statusTone, useAdminNotice } from "@/components/admin-shell";
import { fetchAdminHome, ensureAdminSession, getCachedAdminHome } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminHome(),
  component: AdminHome,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Admin",
      description: "PickMacApps directory admin.",
      path: "/admin",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function AdminHome() {
  const data = Route.useLoaderData();
  const notice = useAdminNotice();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "paid">("all");

  const waiting = data.submissions.filter((item) => item.status === "pending" || item.status === "paid").length;
  const filteredSubmissions = data.submissions.filter((item) => {
    if (activeTab === "pending") return item.status === "pending";
    if (activeTab === "paid") return item.status === "paid";
    return true;
  });

  const blueOccupants = data.stats.blueOccupants ?? [];
  const goldOccupants = data.stats.goldOccupants ?? [];
  const hotApps = data.stats.hotApps ?? [];

  return (
    <AdminShell
      title="Overview"
      lede="Live system vitals, 30-day slot allocations, traffic trends, and listing management."
      active="overview"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {(data.stats.unpublishedApps ?? 0) > 0 ? (
            <form method="post" action="/api/admin/publish-all">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 cursor-pointer"
              >
                Publish All Unpublished ({data.stats.unpublishedApps})
              </button>
            </form>
          ) : null}
          <Link
            to="/admin/apps/new"
            preload="intent"
            className="rounded-xl bg-ink px-3.5 py-2 text-xs font-medium text-canvas transition hover:opacity-90"
          >
            + Add App
          </Link>
          <form method="post" action="/api/admin/badges">
            <button
              type="submit"
              className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink transition hover:bg-stone-50"
            >
              Verify Badges
            </button>
          </form>
          <Link
            to="/admin/guides/new"
            preload="intent"
            className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink transition hover:bg-stone-50"
          >
            + New Guide
          </Link>
        </div>
      }
    >
      <Notice {...notice} />

      {/* Primary KPI Metric Cards */}
      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Total Revenue</span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Paid Tiers
            </span>
          </div>
          <div className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink">
            {money(data.stats.revenueCents)}
          </div>
          <p className="mt-1 text-[11px] text-muted">From Dodo Payments checkouts</p>
        </div>

        {/* Active Published Apps KPI */}
        <div className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Catalog Volume</span>
            <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
              Live Shelf
            </span>
          </div>
          <div className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink">
            {data.stats.free + data.stats.paid + data.stats.freemium}
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {data.stats.free} free · {data.stats.paid + data.stats.freemium} paid apps
          </p>
        </div>

        {/* Blue Featured Tier Slots */}
        <div className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">🔹 Blue Placement ($99)</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                (data.stats.blueChoice ?? 0) >= 3
                  ? "bg-rose-50 text-rose-700"
                  : "bg-sky-50 text-sky-700"
              }`}
            >
              {data.stats.blueChoice ?? 0}/3 Slots
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[28px] font-semibold tracking-tight text-ink">
              {data.stats.blueChoice ?? 0}
              <span className="text-sm font-normal text-muted"> / 3</span>
            </span>
            <span className="text-xs text-muted">
              ({Math.max(0, 3 - (data.stats.blueChoice ?? 0))} available)
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-sky-500 transition-all duration-500"
              style={{ width: `${Math.min(100, ((data.stats.blueChoice ?? 0) / 3) * 100)}%` }}
            />
          </div>
        </div>

        {/* Gold Article Tier Slots */}
        <div className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">🌟 Gold Article ($120)</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                (data.stats.goldChoice ?? 0) >= 3
                  ? "bg-rose-50 text-rose-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {data.stats.goldChoice ?? 0}/3 Slots
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[28px] font-semibold tracking-tight text-ink">
              {data.stats.goldChoice ?? 0}
              <span className="text-sm font-normal text-muted"> / 3</span>
            </span>
            <span className="text-xs text-muted">
              ({Math.max(0, 3 - (data.stats.goldChoice ?? 0))} available)
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-fuchsia-500 transition-all duration-500"
              style={{ width: `${Math.min(100, ((data.stats.goldChoice ?? 0) / 3) * 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Secondary Quick Stats */}
      <section aria-label="Secondary metrics" className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-muted">🔥 Hot Apps</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">{data.stats.hotCount ?? 0} active</p>
        </div>
        <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-muted">⏳ Pending Review</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">{waiting} submissions</p>
        </div>
        <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-muted">📱 Published Apps</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">
            {data.stats.free + data.stats.paid + data.stats.freemium}
            <span className="ml-1 text-xs font-normal text-muted">
              ({data.stats.free} free · {data.stats.paid + data.stats.freemium} paid)
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white px-3.5 py-2.5">
          <p className="text-[11px] font-medium text-muted">📖 Editorial Guides</p>
          <p className="mt-0.5 text-lg font-semibold text-ink">
            {data.stats.guides} published
            {data.stats.draftGuides ? <span className="ml-1 text-xs font-normal text-muted">({data.stats.draftGuides} draft)</span> : null}
          </p>
        </div>
      </section>

      {/* Live Slot Occupancy & 7-Day Trending Split Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Slot Occupancy Roster */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">30-Day Placement Roster</h2>
              <p className="text-xs text-muted">Active apps occupying the 3 Blue and 3 Gold featured slots.</p>
            </div>
            <Link
              to="/admin/apps"
              preload="intent"
              className="text-xs font-medium text-ink underline hover:text-muted"
            >
              Manage Apps
            </Link>
          </div>

          <div className="mt-4 space-y-4">
            {/* Blue Tier Slots */}
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-sky-800 dark:text-sky-300">
                  🔹 Blue Tier Slots ({blueOccupants.length}/3)
                </span>
                <span className="text-muted">{Math.max(0, 3 - blueOccupants.length)} available</span>
              </div>
              <div className="mt-2 space-y-2">
                {[0, 1, 2].map((slotIdx) => {
                  const occupant = blueOccupants[slotIdx];
                  if (!occupant) {
                    return (
                      <div
                        key={`blue-slot-${slotIdx}`}
                        className="flex items-center justify-between rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-muted"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">
                            {slotIdx + 1}
                          </span>
                          Empty Slot — Open for assignment
                        </span>
                        <span className="text-[11px] font-medium text-emerald-600">Available</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={occupant.id}
                      className="flex items-center justify-between rounded-xl border border-sky-100 bg-sky-50/30 px-3.5 py-2 transition hover:border-sky-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[10px] font-bold text-sky-700">
                          {slotIdx + 1}
                        </span>
                        {occupant.icon ? (
                          <img alt="" src={occupant.icon} className="h-7 w-7 rounded-md object-cover" />
                        ) : null}
                        <div>
                          <Link
                            to="/admin/apps/$id"
                            params={{ id: occupant.id }}
                            preload="intent"
                            className="text-xs font-medium text-ink hover:underline"
                          >
                            {occupant.name}
                          </Link>
                          <p className="text-[10px] text-muted">/{occupant.slug}</p>
                        </div>
                      </div>
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: occupant.id }}
                        preload="intent"
                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-ink ring-1 ring-line hover:bg-stone-50"
                      >
                        Edit
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gold Tier Slots */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  🌟 Gold Article Tier Slots ({goldOccupants.length}/3)
                </span>
                <span className="text-muted">{Math.max(0, 3 - goldOccupants.length)} available</span>
              </div>
              <div className="mt-2 space-y-2">
                {[0, 1, 2].map((slotIdx) => {
                  const occupant = goldOccupants[slotIdx];
                  if (!occupant) {
                    return (
                      <div
                        key={`gold-slot-${slotIdx}`}
                        className="flex items-center justify-between rounded-xl border border-dashed border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-xs text-muted"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">
                            {slotIdx + 1}
                          </span>
                          Empty Slot — Open for assignment
                        </span>
                        <span className="text-[11px] font-medium text-emerald-600">Available</span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={occupant.id}
                      className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/30 px-3.5 py-2 transition hover:border-amber-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                          {slotIdx + 1}
                        </span>
                        {occupant.icon ? (
                          <img alt="" src={occupant.icon} className="h-7 w-7 rounded-md object-cover" />
                        ) : null}
                        <div>
                          <Link
                            to="/admin/apps/$id"
                            params={{ id: occupant.id }}
                            preload="intent"
                            className="text-xs font-medium text-ink hover:underline"
                          >
                            {occupant.name}
                          </Link>
                          <p className="text-[10px] text-muted">/{occupant.slug}</p>
                        </div>
                      </div>
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: occupant.id }}
                        preload="intent"
                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-medium text-ink ring-1 ring-line hover:bg-stone-50"
                      >
                        Edit
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Editorial Shelf & Hot Highlights */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">🔥 Hot & Featured Highlights</h2>
              <p className="text-xs text-muted">Apps marked as Hot for top shelf placement.</p>
            </div>
            <Link
              to="/admin/apps"
              preload="intent"
              className="text-xs font-medium text-ink underline hover:text-muted"
            >
              Toggle Hot in Apps →
            </Link>
          </div>

          <div className="mt-4">
            {hotApps.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">
                <p className="text-2xl mb-1">🔥</p>
                No apps currently marked as Hot.
                <p className="mt-1">Use the toggle button in the Apps table to feature hot apps.</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {hotApps.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/30 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {h.icon ? <img alt="" src={h.icon} className="h-7 w-7 rounded-md object-cover" /> : null}
                      <div>
                        <Link
                          to="/admin/apps/$id"
                          params={{ id: h.id }}
                          preload="intent"
                          className="font-medium text-ink hover:underline"
                        >
                          {h.name}
                        </Link>
                        <p className="text-[10px] text-muted">/{h.slug}</p>
                      </div>
                    </div>
                    <form method="post" action="/api/admin/toggle-hot" className="inline">
                      <input type="hidden" name="id" value={h.id} />
                      <input type="hidden" name="return_to" value="/admin" />
                      <button
                        type="submit"
                        title="Remove Hot status"
                        className="rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Submissions Management */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Submissions Pipeline</h2>
            <p className="text-xs text-muted">Review, approve, or reject submissions.</p>
          </div>
          <div className="flex items-center gap-1">
            {(["all", "pending", "paid"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                  activeTab === tab ? "bg-ink text-canvas" : "text-muted hover:bg-stone-100"
                }`}
              >
                {tab === "all" ? `All (${data.submissions.length})` : tab === "pending" ? `Pending (${data.submissions.filter(s => s.status === 'pending').length})` : `Paid (${data.submissions.filter(s => s.status === 'paid').length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">No submissions in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] tracking-wide text-muted uppercase bg-stone-50/50">
                <tr>
                  <th className="px-4 py-2.5 font-medium">App</th>
                  <th className="px-3 py-2.5 font-medium">Plan & Tier</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredSubmissions.map((item) => (
                  <tr key={item.id} className="transition hover:bg-stone-50/40">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium text-ink">{item.app_name}</p>
                        {item.app_slug ? (
                          <a
                            href={`/app/${item.app_slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 rounded-md bg-purple-50 px-2 py-0.5 text-[10.5px] font-semibold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300"
                            title="Updates the live listing upon approval"
                          >
                            🔄 Update (/app/{item.app_slug})
                          </a>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                        <a href={item.website} className="underline hover:text-ink" target="_blank" rel="noreferrer">
                          {item.website}
                        </a>
                        {item.email && <span>• {item.email}</span>}
                        {item.x_handle && (
                          <a
                            href={`https://x.com/${item.x_handle.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-ink hover:underline"
                          >
                            • {item.x_handle}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {item.plan === "choice" ? (
                        <div className="flex flex-col items-start gap-1">
                          <Pill tone="choice">
                            {item.tier === "article" ? "🌟 Gold ($120)" : "🔹 Blue ($99)"}
                          </Pill>
                          {item.tier === "article" ? (
                            (data.stats.goldChoice ?? 0) >= 3 && (item.status === "pending" || item.status === "paid") ? (
                              <span className="text-[10px] font-semibold text-rose-600">⚠️ Gold full (3/3)</span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-600">
                                {Math.max(0, 3 - (data.stats.goldChoice ?? 0))}/3 Gold free
                              </span>
                            )
                          ) : (
                            (data.stats.blueChoice ?? 0) >= 3 && (item.status === "pending" || item.status === "paid") ? (
                              <span className="text-[10px] font-semibold text-rose-600">⚠️ Blue full (3/3)</span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-600">
                                {Math.max(0, 3 - (data.stats.blueChoice ?? 0))}/3 Blue free
                              </span>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-1">
                          <Pill tone="off">Free Listing</Pill>
                          {Boolean(item.badge_ok) ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Badge Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-rose-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                              ⚠️ Badge Missing
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Pill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === "pending" || item.status === "paid" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <form method="post" action="/api/admin/reject">
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className="rounded-lg px-2.5 py-1.5 text-xs text-muted transition hover:bg-stone-100 hover:text-ink cursor-pointer"
                            >
                              Reject
                            </button>
                          </form>
                          {item.plan === "free" ? (
                            <form method="post" action="/api/admin/verify-submission-badge">
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                title="Check PickMacApps badge live on website"
                                className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink transition hover:bg-stone-50 cursor-pointer"
                              >
                                🔍 Check Badge
                              </button>
                            </form>
                          ) : null}
                          {item.plan === "free" && !item.badge_ok ? (
                            <button
                              type="button"
                              disabled
                              title="Cannot approve: PickMacApps badge was not found on website. Verify badge first."
                              className="rounded-lg bg-stone-200 px-3 py-1.5 text-xs font-medium text-stone-400 cursor-not-allowed"
                            >
                              Approve
                            </button>
                          ) : (
                            <form method="post" action="/api/admin/approve">
                              <input type="hidden" name="id" value={item.id} />
                              <button
                                type="submit"
                                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas transition hover:opacity-90 cursor-pointer"
                              >
                                Approve
                              </button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted">{item.email}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pricing Configuration Cards */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Tier 1: Featured Placement */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <span>🔹</span> Featured Placement ($99 Tier)
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                Blue Badge
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  (data.stats.blueChoice ?? 0) >= 3 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {data.stats.blueChoice ?? 0}/3 slots
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-body">
            Charged by Dodo: <strong>{money(data.offer.featuredPriceCents ?? data.offer.priceCents)}</strong>, shown marked down from {money(data.offer.featuredCompareCents ?? data.offer.compareCents)}.
          </p>
          <div className="mt-2 text-xs text-muted">
            Capacity: <strong>{data.stats.blueChoice ?? 0} active</strong> / 3 max ({Math.max(0, 3 - (data.stats.blueChoice ?? 0))} available)
          </div>
          <form method="post" action="/api/admin/price" className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="tier" value="featured" />
            <label className="text-[13px] font-medium text-ink">
              Charge ($)
              <input name="dollars" defaultValue={((data.offer.featuredPriceCents ?? data.offer.priceCents) / 100).toFixed(2)} className={fieldClass} />
            </label>
            <label className="text-[13px] font-medium text-ink">
              Compare-at ($)
              <input name="compare" defaultValue={((data.offer.featuredCompareCents ?? data.offer.compareCents) / 100).toFixed(2)} className={fieldClass} />
            </label>
            <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas hover:opacity-90">
              Save Featured
            </button>
          </form>
        </section>

        {/* Tier 2: Featured + Medium Article */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
              <span>🌟</span> Featured + Medium Article ($120 Tier)
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Gold Badge
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  (data.stats.goldChoice ?? 0) >= 3 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {data.stats.goldChoice ?? 0}/3 slots
              </span>
            </div>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-body">
            Charged by Dodo: <strong>{money(data.offer.articlePriceCents ?? 12000)}</strong>, shown marked down from {money(data.offer.articleCompareCents ?? 24900)}.
          </p>
          <div className="mt-2 text-xs text-muted">
            Capacity: <strong>{data.stats.goldChoice ?? 0} active</strong> / 3 max ({Math.max(0, 3 - (data.stats.goldChoice ?? 0))} available)
          </div>
          <form method="post" action="/api/admin/price" className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="tier" value="article" />
            <label className="text-[13px] font-medium text-ink">
              Charge ($)
              <input name="dollars" defaultValue={((data.offer.articlePriceCents ?? 12000) / 100).toFixed(2)} className={fieldClass} />
            </label>
            <label className="text-[13px] font-medium text-ink">
              Compare-at ($)
              <input name="compare" defaultValue={((data.offer.articleCompareCents ?? 24900) / 100).toFixed(2)} className={fieldClass} />
            </label>
            <button type="submit" className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-95">
              Save Article
            </button>
          </form>
        </section>
      </div>

      {/* Free-Listing Badges & Telegram Moderation Bot */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Free-Listing Badges</h2>
              <p className="mt-1 text-sm leading-relaxed text-body">
                Only user-submitted free listings are checked. All admin-added catalog apps are permanently exempt from badge checks.
              </p>
            </div>
            <form method="post" action="/api/admin/badges">
              <button type="submit" className="rounded-xl border border-line px-3 py-2 text-xs font-medium text-ink hover:bg-stone-50">
                Check Now
              </button>
            </form>
          </div>
          <ul className="mt-4 max-h-56 space-y-2 overflow-auto text-sm">
            {data.badges.length === 0 ? <li className="text-muted text-xs">No free listings to check.</li> : null}
            {data.badges.map((app) => (
              <li key={app.id} className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium text-ink">{app.name}</span>
                <span className="shrink-0 text-muted">
                  {app.badgeStatus}
                  {app.badgeDetail ? ` · ${app.badgeDetail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-ink">Telegram Moderation Bot</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    data.stats.telegramConfigured
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {data.stats.telegramConfigured ? "Configured" : "Env Vars Needed"}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-body">
                Receive instant alerts for every new app submission and approve, reject, or verify its backlink badge directly inside Telegram.
              </p>
            </div>
            <form method="post" action="/api/admin/telegram">
              <button
                type="submit"
                disabled={!data.stats.telegramConfigured}
                className="shrink-0 rounded-xl bg-ink px-3.5 py-2 text-xs font-semibold text-canvas shadow-xs transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Connect & Test
              </button>
            </form>
          </div>
          <div className="mt-4 space-y-1.5 rounded-xl border border-line bg-stone-50/70 p-3.5 text-xs text-body">
            {data.stats.telegramConfigured ? (
              <>
                <p className="font-semibold text-emerald-700">✅ Bot Token & Admin Chat ID active</p>
                <p className="text-muted leading-relaxed">
                  Notifications, live badge checks, 1-tap approval, and 5 X post templates are ready.{" "}
                  <code className="text-ink">TELEGRAM_WEBHOOK_SECRET</code> is optional (auto-managed).
                </p>
                <p className="pt-0.5 text-[11px] text-muted">
                  Webhook: <code className="text-ink">/api/telegram/webhook</code> · Commands: <code>/start</code>, <code>/id</code>, <code>/pending</code>
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold text-ink">Environment Variables (Vercel / Server):</p>
                <ul className="space-y-1 text-muted">
                  <li>
                    <code className="text-ink">TELEGRAM_BOT_TOKEN</code> — Bot token from <code>@BotFather</code>
                  </li>
                  <li>
                    <code className="text-ink">TELEGRAM_ADMIN_CHAT_ID</code> — Your numeric Telegram Chat ID (send <code>/id</code> to bot)
                  </li>
                  <li>
                    <code className="text-ink">TELEGRAM_WEBHOOK_SECRET</code> — <em>Optional</em> (auto-generated if omitted)
                  </li>
                </ul>
                <p className="pt-1 text-[11px] text-muted">
                  Webhook endpoint: <code className="text-ink">/api/telegram/webhook</code> · Commands: <code>/start</code>, <code>/id</code>, <code>/pending</code>
                </p>
              </>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

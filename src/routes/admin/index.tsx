import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
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

  const waiting = data.submissions.filter((item) => item.status === "pending" || item.status === "paid").length;
  const blueOccupants = data.stats.blueOccupants ?? [];
  const goldOccupants = data.stats.goldOccupants ?? [];
  const hotApps = data.stats.hotApps ?? [];

  return (
    <AdminShell
      title="Overview"
      lede="Live system vitals, 30-day slot allocations, traffic trends, and quick operations."
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
              className="rounded-xl border border-line bg-white px-3.5 py-2 text-xs font-medium text-ink transition hover:bg-stone-50 cursor-pointer"
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

      {/* Operations & Quick Actions Hub */}
      <section aria-label="Operations and quick actions" className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Operations & Quick Actions</h2>
            <p className="text-xs text-muted">Dedicated operational management pages and system controls.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Submissions Pipeline */}
          <Link
            to="/admin/submissions"
            preload="intent"
            className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/30 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-base">
                  📥
                </span>
                {waiting > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                    {waiting} waiting
                  </span>
                ) : (
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                    All clear
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-ink">
                Submissions Pipeline
              </h3>
              <p className="mt-1 text-xs text-muted line-clamp-2">
                Review submitted apps, verify backlink badges, and approve or reject listings.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-ink">
              <span>Open pipeline</span>
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>

          {/* Upvotes & Auto-Promotion */}
          <Link
            to="/admin/upvotes"
            preload="intent"
            className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/30 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-base">
                  ▲
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    (data.stats as { upvoteSettings?: { upvotesEnabled?: boolean } }).upvoteSettings?.upvotesEnabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {(data.stats as { upvoteSettings?: { upvotesEnabled?: boolean } }).upvoteSettings?.upvotesEnabled ? "Enabled" : "Off"}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-ink">
                Upvotes & Auto-Hot
              </h3>
              <p className="mt-1 text-xs text-muted line-clamp-2">
                Configure sitewide voting and threshold ({(data.stats as { upvoteSettings?: { hotThreshold?: number } }).upvoteSettings?.hotThreshold ?? 15} votes) for auto-promotion to Hot.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-ink">
              <span>Configure rules</span>
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>

          {/* Free-Listing Badges */}
          <Link
            to="/admin/badges"
            preload="intent"
            className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/30 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-base">
                  🔍
                </span>
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                  {data.badges.length} apps
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-ink">
                Free-Listing Badges
              </h3>
              <p className="mt-1 text-xs text-muted line-clamp-2">
                Audit backlink badges on user-submitted apps and run instant verification checks.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-ink">
              <span>Audit badges</span>
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>

          {/* Telegram Moderation Bot */}
          <Link
            to="/admin/telegram"
            preload="intent"
            className="group relative flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/30 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-base">
                  🤖
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    data.stats.telegramConfigured
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {data.stats.telegramConfigured ? "Active" : "Setup Needed"}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-ink group-hover:text-ink">
                Telegram Bot
              </h3>
              <p className="mt-1 text-xs text-muted line-clamp-2">
                Instant submission notifications, live badge checks, and 1-tap moderation.
              </p>
            </div>
            <div className="mt-3 flex items-center text-xs font-semibold text-ink">
              <span>Manage bot</span>
              <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Secondary Quick Stats */}
      <section aria-label="Secondary metrics" className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                          <div className="flex items-center gap-1.5 text-[10px] text-muted">
                            <span>/{occupant.slug}</span>
                            {occupant.featuredUntil ? (
                              <>
                                <span>·</span>
                                <span className="font-mono text-sky-700">
                                  {(() => {
                                    const until = new Date(occupant.featuredUntil);
                                    const days = Math.ceil((until.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                                    const formatted = until.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                    return days > 0 ? `${days} days remaining (${formatted})` : `Expired on ${formatted}`;
                                  })()}
                                </span>
                              </>
                            ) : null}
                          </div>
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
                          <div className="flex items-center gap-1.5 text-[10px] text-muted">
                            <span>/{occupant.slug}</span>
                            {occupant.featuredUntil ? (
                              <>
                                <span>·</span>
                                <span className="font-mono text-sky-700">
                                  {(() => {
                                    const until = new Date(occupant.featuredUntil);
                                    const days = Math.ceil((until.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                                    const formatted = until.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                    return days > 0 ? `${days} days remaining (${formatted})` : `Expired on ${formatted}`;
                                  })()}
                                </span>
                              </>
                            ) : null}
                          </div>
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
                        <div className="flex items-center gap-1.5 text-[10px] text-muted">
                          <span>/{h.slug}</span>
                          <span>·</span>
                          <span className="font-mono text-rose-600">
                            {(() => {
                              const marked = new Date(h.hotMarkedAt || Date.now());
                              const expiry = new Date(marked.getTime() + 30 * 24 * 60 * 60 * 1000);
                              const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                              const formatted = expiry.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                              return `${daysLeft} days remaining (${formatted})`;
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <form method="post" action="/api/admin/toggle-hot" className="inline">
                      <input type="hidden" name="id" value={h.id} />
                      <input type="hidden" name="return_to" value="/admin" />
                      <button
                        type="submit"
                        title="Remove Hot status"
                        className="rounded-lg bg-white px-2 py-1 text-[11px] font-medium text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50 cursor-pointer"
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
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
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
            <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas hover:opacity-90 cursor-pointer">
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
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
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
            <button type="submit" className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:opacity-95 cursor-pointer">
              Save Article
            </button>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

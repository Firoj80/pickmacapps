import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
import { BadgeCheckIcon } from "@/components/icons";
import { fetchAdminHome, ensureAdminSession, getCachedAdminHome, seedAdminHomeCache } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";
import { getHotDaysRemaining } from "@/lib/catalog";

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
      description: "PickMacApps directory admin command center.",
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

function formatRelativeTime(dateStr?: string | Date | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function getSlotDaysRemaining(featuredUntil?: string | Date | null) {
  if (!featuredUntil) return null;
  const until = new Date(featuredUntil);
  if (isNaN(until.getTime())) return null;
  const days = Math.max(0, Math.min(30, Math.round((until.getTime() - Date.now()) / (24 * 60 * 60 * 1000))));
  const formatted = until.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return { days, formatted, isExpired: days <= 0 };
}

function auditActionDetails(action: string) {
  switch (action) {
    case "approve":
    case "approved":
      return { icon: "✅", label: "Approved submission", color: "text-emerald-700 bg-emerald-50" };
    case "reject":
    case "rejected":
      return { icon: "✕", label: "Rejected submission", color: "text-rose-700 bg-rose-50" };
    case "toggle_hot":
    case "hot_toggled":
      return { icon: "🔥", label: "Updated hot status", color: "text-rose-700 bg-rose-50" };
    case "price_updated":
    case "price":
      return { icon: "💵", label: "Updated tier pricing", color: "text-indigo-700 bg-indigo-50" };
    case "badge_checked":
    case "badges":
      return { icon: "🔍", label: "Ran badge check", color: "text-sky-700 bg-sky-50" };
    case "created":
    case "create_app":
      return { icon: "➕", label: "Added new app", color: "text-emerald-700 bg-emerald-50" };
    case "publish_all":
      return { icon: "🚀", label: "Published all apps", color: "text-purple-700 bg-purple-50" };
    default:
      return { icon: "⚡", label: action.replace(/_/g, " "), color: "text-stone-700 bg-stone-100" };
  }
}

function AdminHome() {
  const data = Route.useLoaderData();
  const notice = useAdminNotice();
  const [showPricing, setShowPricing] = useState(false);

  if (typeof window !== "undefined" && data) {
    seedAdminHomeCache(data);
  }

  const pendingSubmissions = (data.submissions ?? []).filter(
    (item) => item.status === "pending" || item.status === "paid",
  );
  const waiting = pendingSubmissions.length;
  const blueOccupants = data.stats.blueOccupants ?? [];
  const goldOccupants = data.stats.goldOccupants ?? [];
  const hotApps = data.stats.hotApps ?? [];
  const scheduledHotApps = (data.stats as any).scheduledHotApps ?? [];
  const scheduledGoldApps = (data.stats as any).scheduledGoldApps ?? [];
  const queuedPaidBookings = (data.stats as any).queuedPaidBookings ?? [];
  const totalScheduled = scheduledHotApps.length + scheduledGoldApps.length + queuedPaidBookings.length;
  const topPerforming = data.stats.topPerforming ?? [];
  const recentAudit = data.stats.recentAudit ?? [];
  const totalCatalog = data.stats.free + data.stats.paid + data.stats.freemium;

  const totalCardClicks = data.stats.totalCardClicks ?? 0;
  const totalTryClicks = data.stats.totalTryClicks ?? 0;
  const conversionRate = totalCardClicks > 0 ? ((totalTryClicks / totalCardClicks) * 100).toFixed(1) : "0.0";
  const sidebarConfig = data.offer.sidebarSettings ?? { enabled: true, duration: "24h" };
  const recentCounts = (data.stats as { recentCounts?: Record<string, number> }).recentCounts ?? {};

  return (
    <AdminShell
      title="Overview"
      lede="Directory command center: real-time operations, slot occupancy, moderation queue, and vitals."
      active="overview"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {(data.stats.unpublishedApps ?? 0) > 0 ? (
            <form method="post" action="/api/admin/publish-all">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 cursor-pointer"
              >
                Publish All ({data.stats.unpublishedApps})
              </button>
            </form>
          ) : null}
          <Link
            to="/admin/apps/new"
            preload="intent"
            className="rounded-xl bg-ink px-3.5 py-1.5 text-xs font-semibold text-canvas shadow-xs transition hover:opacity-90"
          >
            + Add App
          </Link>
          <form method="post" action="/api/admin/badges">
            <button
              type="submit"
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-stone-50 cursor-pointer shadow-2xs"
            >
              Verify Badges
            </button>
          </form>
          <Link
            to="/admin/guides/new"
            preload="intent"
            className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-stone-50 shadow-2xs"
          >
            + New Guide
          </Link>
        </div>
      }
    >
      <Notice {...notice} />

      {/* Top System Vitals Status Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-stone-50/70 px-3.5 py-2 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-ink">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Supabase PostgreSQL Active
          </span>
          <span className="text-stone-300">|</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                data.stats.telegramConfigured ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            Telegram Bot:{" "}
            <Link to="/admin/telegram" className="font-semibold text-ink hover:underline">
              {data.stats.telegramConfigured ? "Connected" : "Setup Needed"}
            </Link>
          </span>
          <span className="text-stone-300">|</span>
          <span>
            Upvote Auto-Hot:{" "}
            <span className="font-semibold text-ink">
              {(data.stats as { upvoteSettings?: { hotThreshold?: number } }).upvoteSettings?.hotThreshold ?? 15} votes
            </span>
          </span>
        </div>
        <div className="text-[11px] text-muted">
          <span>7-Day Hot Policy Active</span>
        </div>
      </div>

      {/* 4-Card Executive KPI Strip */}
      <section aria-label="Executive KPI Metrics" className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Total Revenue</span>
            <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              Dodo Payments
            </span>
          </div>
          <div className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink">
            {money(data.stats.revenueCents)}
          </div>
          <p className="mt-1 text-[11px] text-muted">From paid featured & article sponsorships</p>
        </div>

        {/* Catalog Volume */}
        <Link
          to="/admin/apps"
          preload="intent"
          className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Catalog Volume</span>
            <span className="text-xs font-semibold text-indigo-600 group-hover:underline">All Apps →</span>
          </div>
          <div className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink">
            {totalCatalog}
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {data.stats.free} free · {data.stats.paid + data.stats.freemium} paid apps
          </p>
        </Link>

        {/* Referrals & Traffic */}
        <Link
          to="/admin/stats"
          preload="intent"
          className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Outbound Referrals</span>
            <span className="text-xs font-semibold text-emerald-600 group-hover:underline">Analytics →</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-[26px] font-semibold tracking-tight text-emerald-600">
              {totalTryClicks.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-muted">({conversionRate}% CTR)</span>
          </div>
          <p className="mt-1 text-[11px] text-muted">From {totalCardClicks.toLocaleString()} app card modal views</p>
        </Link>

        {/* Action Queue */}
        <Link
          to="/admin/submissions"
          preload="intent"
          className="group rounded-2xl border border-line bg-white p-4 shadow-xs transition hover:border-ink/20 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-muted">Action Queue</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                waiting > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {waiting > 0 ? `${waiting} Pending` : "All Clear"}
            </span>
          </div>
          <div className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink">
            {waiting}
          </div>
          <p className="mt-1 text-[11px] text-muted">
            {hotApps.length}/6 hot · {goldOccupants.length}/6 gold slots filled
          </p>
        </Link>
      </section>

      {/* Upcoming Cycle Reservations (Booked for Next Week) */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink">📅 Upcoming Cycle Reservations (Booked for Next Week)</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                totalScheduled > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {totalScheduled > 0 ? `${totalScheduled} Booked for ${data.offer?.hotSlots?.nextDate || "Next Week"}` : "0 Booked · Slots Open"}
            </span>
          </div>
          <div className="text-xs text-muted">
            Next Hot Rollover: <span className="font-semibold text-ink">{data.offer?.hotSlots?.nextDate || "7 days"}</span>
            {" · "}
            Next Gold Rollover: <span className="font-semibold text-ink">{data.offer?.articleSlots?.nextDate || "7 days"}</span>
          </div>
        </div>

        <div className="p-4">
          {totalScheduled === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted">
              <span className="text-2xl mb-1.5">📅</span>
              <p className="font-semibold text-ink">No upcoming cycle reservations currently queued</p>
              <p className="text-[11px] text-muted mt-0.5">
                When current 6 Hot or 6 Gold slots are full, any new bookings or Telegram approvals scheduled for next week ({data.offer?.hotSlots?.nextDate || "next cycle"}) will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {scheduledHotApps.map((app: any) => {
                const dt = app.hotScheduledFor ? new Date(app.hotScheduledFor) : null;
                const formatted = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : (data.offer?.hotSlots?.nextDate || "Next Week");
                const daysLeft = dt && !isNaN(dt.getTime()) ? Math.max(0, Math.ceil((dt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : null;

                return (
                  <div key={`sched-hot-${app.id}`} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {app.icon ? (
                        <img alt="" src={app.icon} className="h-8 w-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-xs shrink-0 text-muted">
                          📱
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to="/admin/apps/$id" params={{ id: app.id }} className="truncate font-semibold text-xs text-ink hover:underline">
                            {app.name}
                          </Link>
                          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-500/20">
                            🔥 Hot Boost (Scheduled)
                          </span>
                        </div>
                        <p className="text-[11px] text-muted truncate mt-0.5">
                          Scheduled for: <span className="font-medium text-ink">{formatted}</span>
                          {daysLeft !== null ? ` (in ${daysLeft} days)` : ""}
                          {app.submitter ? ` · Submitter: ${app.submitter}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: app.id }}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-stone-50 shadow-2xs"
                      >
                        Manage App →
                      </Link>
                    </div>
                  </div>
                );
              })}

              {scheduledGoldApps.map((app: any) => {
                const dt = app.featuredScheduledFor ? new Date(app.featuredScheduledFor) : null;
                const formatted = dt && !isNaN(dt.getTime()) ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : (data.offer?.articleSlots?.nextDate || "Next Week");
                const daysLeft = dt && !isNaN(dt.getTime()) ? Math.max(0, Math.ceil((dt.getTime() - Date.now()) / (24 * 60 * 60 * 1000))) : null;

                return (
                  <div key={`sched-gold-${app.id}`} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {app.icon ? (
                        <img alt="" src={app.icon} className="h-8 w-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-xs shrink-0 text-muted">
                          📱
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to="/admin/apps/$id" params={{ id: app.id }} className="truncate font-semibold text-xs text-ink hover:underline">
                            {app.name}
                          </Link>
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-500/20">
                            <BadgeCheckIcon className="h-3 w-3 shrink-0 fill-amber-500 text-stone-950" />
                            <span>Gold Spotlight (Scheduled)</span>
                          </span>
                        </div>
                        <p className="text-[11px] text-muted truncate mt-0.5">
                          Scheduled for: <span className="font-medium text-ink">{formatted}</span>
                          {daysLeft !== null ? ` (in ${daysLeft} days)` : ""}
                          {app.submitter ? ` · Submitter: ${app.submitter}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: app.id }}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-stone-50 shadow-2xs"
                      >
                        Manage App →
                      </Link>
                    </div>
                  </div>
                );
              })}

              {queuedPaidBookings.map((sub: any) => {
                const isGold = sub.tier === "article";
                const dateLabel = isGold ? (data.offer?.articleSlots?.nextDate || "Next Week") : (data.offer?.hotSlots?.nextDate || "Next Week");

                return (
                  <div key={`queued-sub-${sub.id}`} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {sub.icon ? (
                        <img alt="" src={sub.icon} className="h-8 w-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-xs shrink-0 text-muted">
                          📱
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-semibold text-xs text-ink">{sub.appName}</span>
                          {isGold ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                              <BadgeCheckIcon className="h-3 w-3 shrink-0 fill-amber-500 text-stone-950" />
                              <span>Gold Spotlight (Paid Booking)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800">
                              🔥 Hot Boost (Paid Booking)
                            </span>
                          )}
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                            Paid Confirmed
                          </span>
                        </div>
                        <p className="text-[11px] text-muted truncate mt-0.5">
                          Queued for Next Cycle: <span className="font-medium text-ink">{dateLabel}</span>
                          {sub.submitter ? ` · Submitter: ${sub.submitter}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        to="/admin/submissions"
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 shadow-2xs"
                      >
                        Approve & Schedule →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Two-Column Modern Command Layout */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column (7 cols): Submissions Queue, 7-Day Hot Shelf, Top Drivers */}
        <div className="space-y-5 lg:col-span-7">
          {/* Urgent Submissions Queue */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">📥 Urgent Submissions Queue</span>
                {waiting > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {waiting} waiting
                  </span>
                ) : null}
              </div>
              <Link
                to="/admin/submissions"
                preload="intent"
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View Pipeline ({data.submissions.length}) →
              </Link>
            </div>

            <div className="mt-3">
              {waiting === 0 ? (
                <div className="flex flex-col items-center justify-center py-7 text-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-base text-emerald-600">
                    ✓
                  </div>
                  <p className="mt-2 text-xs font-semibold text-ink">Inbox Zero — All Caught Up!</p>
                  <p className="text-[11px] text-muted">No submitted apps currently awaiting moderation.</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {pendingSubmissions.slice(0, 4).map((sub) => {
                    const isFree = sub.plan === "free";
                    const isGold = sub.tier === "article";
                    return (
                      <div key={sub.id} className="py-2.5 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs font-semibold text-ink">{sub.app_name}</span>
                              {isFree ? (
                                <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
                                  Free
                                </span>
                              ) : isGold ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                                  <BadgeCheckIcon className="h-3 w-3 shrink-0 fill-amber-500 text-stone-950" />
                                  <span>Gold Tier</span>
                                </span>
                              ) : (
                                <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800">
                                  🔹 Blue Tier
                                </span>
                              )}
                              {isFree ? (
                                sub.badge_ok ? (
                                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                                    Badge OK
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-500/20">
                                    No Badge
                                  </span>
                                )
                              ) : null}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                              <a
                                href={sub.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="truncate hover:text-ink hover:underline"
                              >
                                {sub.website.replace(/^https?:\/\//, "")} ↗
                              </a>
                              <span>·</span>
                              <span>{formatRelativeTime(sub.created_at)}</span>
                              <span>·</span>
                              <span className="truncate">{sub.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isFree ? (
                              <form method="post" action="/api/admin/verify-submission-badge">
                                <input type="hidden" name="id" value={sub.id} />
                                <button
                                  type="submit"
                                  title="Check backlink badge on website"
                                  className="rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink hover:bg-stone-50 cursor-pointer shadow-2xs"
                                >
                                  🔍 Verify
                                </button>
                              </form>
                            ) : null}

                            {isFree && !sub.badge_ok ? (
                              <button
                                type="button"
                                disabled
                                title="Cannot approve without backlink badge"
                                className="rounded-lg bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-400 cursor-not-allowed"
                              >
                                Approve
                              </button>
                            ) : (
                              <form method="post" action="/api/admin/approve">
                                <input type="hidden" name="id" value={sub.id} />
                                <button
                                  type="submit"
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 cursor-pointer shadow-2xs"
                                >
                                  ✓ Approve
                                </button>
                              </form>
                            )}

                            <form method="post" action="/api/admin/reject">
                              <input type="hidden" name="id" value={sub.id} />
                              <button
                                type="submit"
                                className="rounded-lg px-2 py-1 text-[11px] font-medium text-muted hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                              >
                                Reject
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* 7-Day Hot App Shelf */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">🔥 7-Day Hot Roster</span>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 ring-1 ring-rose-200">
                  {hotApps.length} / 6 active (7d policy)
                </span>
              </div>
              <Link to="/admin/apps" preload="intent" className="text-xs font-semibold text-ink hover:underline">
                Manage in Apps →
              </Link>
            </div>

            <div className="mt-3">
              {hotApps.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  <p className="text-xl mb-1">🔥</p>
                  No apps currently marked as Hot. Promote apps in the Apps catalog or through community upvotes.
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {hotApps.map((h) => {
                    const { daysLeft, formatted } = getHotDaysRemaining(h.hotMarkedAt);
                    return (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 p-2.5 transition hover:border-rose-300"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {h.icon ? (
                            <img alt="" src={h.icon} className="h-7 w-7 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 text-xs shrink-0 text-muted">
                              📱
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              to="/admin/apps/$id"
                              params={{ id: h.id }}
                              preload="intent"
                              className="block truncate text-xs font-semibold text-ink hover:underline"
                            >
                              {h.name}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-900 border border-rose-300">
                                {daysLeft}d left ({formatted})
                              </span>
                            </div>
                          </div>
                        </div>
                        <form method="post" action="/api/admin/toggle-hot" className="inline shrink-0 ml-2">
                          <input type="hidden" name="id" value={h.id} />
                          <input type="hidden" name="return_to" value="/admin" />
                          <button
                            type="submit"
                            title="Remove Hot status"
                            className="rounded-lg bg-white border border-rose-200 px-2 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-50 hover:text-rose-900 cursor-pointer shadow-2xs transition"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Top Referral Drivers */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">🚀 Top Referral Drivers</h3>
                <p className="text-[11px] text-muted">Apps generating the highest outbound visitor clicks</p>
              </div>
              <Link to="/admin/stats" preload="intent" className="text-xs font-semibold text-indigo-600 hover:underline">
                Full Analytics →
              </Link>
            </div>

            <div className="mt-3">
              {topPerforming.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">No click data accumulated yet.</p>
              ) : (
                <div className="space-y-2">
                  {topPerforming.map((app, idx) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/40 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-700 shrink-0">
                          #{idx + 1}
                        </span>
                        {app.icon ? (
                          <img alt="" src={app.icon} className="h-6 w-6 rounded-md object-cover shrink-0" />
                        ) : null}
                        <div className="min-w-0">
                          <Link
                            to="/admin/apps/$id"
                            params={{ id: app.id }}
                            preload="intent"
                            className="truncate font-semibold text-ink hover:underline block"
                          >
                            {app.name}
                          </Link>
                          <span className="text-[10px] text-muted capitalize">{app.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <span className="font-semibold text-emerald-600" title="Outbound website clicks">
                          🚀 {app.tryCount.toLocaleString()}
                        </span>
                        <span className="text-muted" title="Modal card opens">
                          👁️ {app.clickCount.toLocaleString()}
                        </span>
                        <Link
                          to="/admin/apps/$id"
                          params={{ id: app.id }}
                          preload="intent"
                          className="text-[11px] font-medium text-stone-500 hover:text-ink"
                        >
                          Edit →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): 30-Day Slots, Automation Health, Recent Activity */}
        <div className="space-y-5 lg:col-span-5">
          {/* 30-Day Placement Slots & Pricing */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">💎 7-Day Sponsorship Slots</h3>
                <p className="text-[11px] text-muted">6 Gold homepage placements & 6 Hot boosted placements</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPricing(!showPricing)}
                className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-[11px] font-semibold text-ink hover:bg-surface-3 cursor-pointer"
              >
                {showPricing ? "Hide Pricing" : "Pricing ⚙️"}
              </button>
            </div>

            {/* Quick Collapsible Pricing Editor */}
            {showPricing ? (
              <div className="my-3 space-y-3 rounded-xl border border-line bg-surface-2 p-3 text-xs">
                <div>
                  <div className="font-semibold text-rose-800">
                    🔥 Hot App Placement (${((data.offer.hotPriceCents ?? data.offer.featuredPriceCents ?? data.offer.priceCents) / 100).toFixed(0)} Tier)
                  </div>
                  <form method="post" action="/api/admin/price" className="mt-1.5 grid grid-cols-2 gap-2">
                    <input type="hidden" name="tier" value="featured" />
                    <div>
                      <span className="text-[10px] text-muted">Price ($)</span>
                      <input
                        name="dollars"
                        defaultValue={((data.offer.hotPriceCents ?? data.offer.featuredPriceCents ?? data.offer.priceCents) / 100).toFixed(2)}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted">Compare-At ($)</span>
                      <input
                        name="compare"
                        defaultValue={((data.offer.hotCompareCents ?? data.offer.featuredCompareCents ?? data.offer.compareCents) / 100).toFixed(2)}
                        className={fieldClass}
                      />
                    </div>
                    <button
                      type="submit"
                      className="col-span-2 rounded-lg bg-rose-600 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 cursor-pointer transition"
                    >
                      Update Hot Placement Price
                    </button>
                  </form>
                </div>

                <div className="border-t border-line pt-2.5">
                  <div className="font-semibold text-amber-800">
                    🌟 Gold Article Tier (${((data.offer.articlePriceCents ?? 12000) / 100).toFixed(0)} Tier)
                  </div>
                  <form method="post" action="/api/admin/price" className="mt-1.5 grid grid-cols-2 gap-2">
                    <input type="hidden" name="tier" value="article" />
                    <div>
                      <span className="text-[10px] text-muted">Price ($)</span>
                      <input
                        name="dollars"
                        defaultValue={((data.offer.articlePriceCents ?? 12000) / 100).toFixed(2)}
                        className={fieldClass}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted">Compare-At ($)</span>
                      <input
                        name="compare"
                        defaultValue={((data.offer.articleCompareCents ?? 24900) / 100).toFixed(2)}
                        className={fieldClass}
                      />
                    </div>
                    <button
                      type="submit"
                      className="col-span-2 rounded-lg bg-gradient-to-r from-amber-600 to-fuchsia-600 py-1.5 text-xs font-semibold text-white hover:opacity-90 cursor-pointer transition"
                    >
                      Update Gold Tier Price
                    </button>
                  </form>
                </div>
              </div>
            ) : null}

            {/* Gold Tier Slots (Primary - 6 Slots) */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-800">🌟 Gold Article Tier ({goldOccupants.length}/6)</span>
                <span className="text-[11px] text-muted">{money(data.offer.articlePriceCents ?? 12000)}/mo</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-fuchsia-500 transition-all duration-300"
                  style={{ width: `${(goldOccupants.length / 6) * 100}%` }}
                />
              </div>

              <div className="mt-2 space-y-1.5">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const occupant = goldOccupants[idx];
                  if (!occupant) {
                    return (
                      <div
                        key={`gold-slot-${idx}`}
                        className="flex items-center justify-between rounded-lg border border-dashed border-stone-200 bg-stone-50/40 px-2.5 py-1.5 text-[11px] text-muted"
                      >
                        <span className="flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 text-[9px] font-bold text-stone-600">
                            {idx + 1}
                          </span>
                          Slot {idx + 1}: Open for assignment
                        </span>
                        <span className="font-medium text-emerald-600">Available</span>
                      </div>
                    );
                  }
                  const rem = getSlotDaysRemaining(occupant.featuredUntil);
                  return (
                    <div
                      key={occupant.id}
                      className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/20 px-2.5 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-800 shrink-0">
                          {idx + 1}
                        </span>
                        {occupant.icon ? (
                          <img alt="" src={occupant.icon} className="h-5 w-5 rounded object-cover shrink-0" />
                        ) : null}
                        <Link
                          to="/admin/apps/$id"
                          params={{ id: occupant.id }}
                          preload="intent"
                          className="truncate font-semibold text-ink hover:underline"
                        >
                          {occupant.name}
                        </Link>
                        {rem ? (
                          <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-800 shrink-0">
                            {rem.days}d left
                          </span>
                        ) : null}
                      </div>
                      <Link
                        to="/admin/apps/$id"
                        params={{ id: occupant.id }}
                        preload="intent"
                        className="text-[11px] font-medium text-stone-500 hover:text-ink shrink-0 ml-2"
                      >
                        Edit
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hot Placement Slots (6 Slots) */}
            <div className="mt-4 border-t border-line pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-800">🔥 Hot App Placement ({hotApps.length}/6)</span>
                <span className="text-[11px] text-muted">{money(data.offer.hotPriceCents ?? data.offer.featuredPriceCents ?? 9900)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (hotApps.length / 6) * 100)}%` }}
                />
              </div>
            </div>

            {/* Legacy Blue Tier Slots (if any occupant exists) */}
            {blueOccupants.length > 0 ? (
              <div className="mt-4 border-t border-stone-100 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-sky-800">🔹 Legacy Blue Featured ({blueOccupants.length} active)</span>
                  <span className="text-[11px] text-muted">Discontinued</span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {blueOccupants.map((occupant, idx) => {
                    const rem = getSlotDaysRemaining(occupant.featuredUntil);
                    return (
                      <div
                        key={occupant.id}
                        className="flex items-center justify-between rounded-lg border border-sky-100 bg-sky-50/20 px-2.5 py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-800 shrink-0">
                            {idx + 1}
                          </span>
                          {occupant.icon ? (
                            <img alt="" src={occupant.icon} className="h-5 w-5 rounded object-cover shrink-0" />
                          ) : null}
                          <Link
                            to="/admin/apps/$id"
                            params={{ id: occupant.id }}
                            preload="intent"
                            className="truncate font-semibold text-ink hover:underline"
                          >
                            {occupant.name}
                          </Link>
                          {rem ? (
                            <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[10px] font-bold text-sky-800 shrink-0">
                              {rem.days}d left
                            </span>
                          ) : null}
                        </div>
                        <Link
                          to="/admin/apps/$id"
                          params={{ id: occupant.id }}
                          preload="intent"
                          className="text-[11px] font-medium text-stone-500 hover:text-ink shrink-0 ml-2"
                        >
                          Edit
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          {/* Automation & Platform Health */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <h3 className="text-sm font-semibold text-ink border-b border-line pb-2.5">⚡ Automation & Services</h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-stone-50/70 p-2.5">
                <div>
                  <div className="font-semibold text-ink">Telegram Moderation Bot</div>
                  <div className="text-[11px] text-muted">Instant push alerts & 1-tap moderation</div>
                </div>
                <Link
                  to="/admin/telegram"
                  preload="intent"
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    data.stats.telegramConfigured
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {data.stats.telegramConfigured ? "● Active" : "⚠️ Setup"}
                </Link>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-stone-50/70 p-2.5">
                <div>
                  <div className="font-semibold text-ink">Free Listing Badges</div>
                  <div className="text-[11px] text-muted">{data.badges.length} apps monitored for backlink badge</div>
                </div>
                <Link
                  to="/admin/badges"
                  preload="intent"
                  className="rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink hover:bg-stone-50"
                >
                  Audit →
                </Link>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-stone-50/70 p-2.5">
                <div>
                  <div className="font-semibold text-ink">Upvotes Engine</div>
                  <div className="text-[11px] text-muted">
                    Auto-hot at {(data.stats as { upvoteSettings?: { hotThreshold?: number } }).upvoteSettings?.hotThreshold ?? 15} upvotes
                  </div>
                </div>
                <Link
                  to="/admin/upvotes"
                  preload="intent"
                  className="rounded-lg border border-line bg-white px-2 py-1 text-[11px] font-medium text-ink hover:bg-stone-50"
                >
                  Configure →
                </Link>
              </div>
            </div>
          </section>

          {/* Fresh Drops Running Banner Configuration */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-sm">
                  ⚡
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-ink">Fresh Drops Running Banner</h3>
                  <p className="text-[11px] text-muted">Controls the running Fresh Drops marquee banner under the hero</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  sidebarConfig.enabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                }`}
              >
                {sidebarConfig.enabled ? "● Active" : "Disabled"}
              </span>
            </div>

            <form method="post" action="/api/admin/update-sidebar-settings" className="mt-3.5 space-y-3.5">
              {/* Enabled toggle */}
              <div className="flex items-center justify-between rounded-xl bg-stone-50/70 p-2.5">
                <div>
                  <label htmlFor="sidebar_enabled" className="text-xs font-semibold text-ink cursor-pointer">
                    Show Fresh Drops Banner
                  </label>
                  <div className="text-[11px] text-muted">Running marquee banner under the homepage hero section</div>
                </div>
                <input
                  type="checkbox"
                  id="sidebar_enabled"
                  name="sidebar_enabled"
                  defaultChecked={sidebarConfig.enabled}
                  className="h-4.5 w-4.5 rounded border-line text-ink focus:ring-accent cursor-pointer"
                />
              </div>

              {/* Duration selector */}
              <div>
                <label className="text-xs font-semibold text-ink block mb-1.5">
                  App Addition Timeframe
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "24h", label: "24 Hours (Default)", desc: "Fresh drops under 24 hours", count: recentCounts["24h"] },
                    { id: "7d", label: "7 Days", desc: "Added in the last 7 days", count: recentCounts["7d"] },
                    { id: "15d", label: "15 Days", desc: "Added in the last 15 days", count: recentCounts["15d"] },
                    { id: "30d", label: "30 Days", desc: "Added in the last 30 days", count: recentCounts["30d"] },
                    { id: "all", label: "All Recent", desc: "Newest catalog additions", count: recentCounts.all },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex flex-col rounded-xl border p-2.5 cursor-pointer transition ${
                        sidebarConfig.duration === opt.id
                          ? "border-amber-500 bg-amber-50/40 text-ink ring-1 ring-amber-500/20"
                          : "border-line bg-white hover:bg-stone-50 text-body"
                      } ${opt.id === "all" ? "col-span-2" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="sidebar_duration"
                            value={opt.id}
                            defaultChecked={sidebarConfig.duration === opt.id}
                            className="text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="font-semibold text-ink">{opt.label}</span>
                        </div>
                        {opt.count !== undefined && (
                          <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                            {opt.count} {opt.count === 1 ? "app" : "apps"}
                          </span>
                        )}
                      </div>
                      <span className="mt-1 text-[10px] text-muted pl-5">{opt.desc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-ink py-2 text-xs font-semibold text-canvas shadow-xs transition hover:opacity-90 cursor-pointer"
              >
                Save Fresh Drops Settings
              </button>
            </form>
          </section>

          {/* Recent System Activity Stream */}
          <section className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <h3 className="text-sm font-semibold text-ink border-b border-line pb-2.5">📜 Recent Activity</h3>
            <div className="mt-3">
              {recentAudit.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted">No recent audit events.</p>
              ) : (
                <div className="space-y-2">
                  {recentAudit.map((evt) => {
                    const details = auditActionDetails(evt.action);
                    return (
                      <div key={evt.id} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-start gap-2 min-w-0">
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] shrink-0 mt-0.5 ${details.color}`}
                          >
                            {details.icon}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-ink">
                              {evt.target || details.label}
                            </div>
                            <div className="truncate text-[10px] text-muted">
                              {evt.actor} · {evt.detail || evt.action}
                            </div>
                          </div>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted">
                          {formatRelativeTime(evt.createdAt)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}

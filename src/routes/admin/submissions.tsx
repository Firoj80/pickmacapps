import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, Pill, statusTone, useAdminNotice } from "@/components/admin-shell";
import { BadgeCheckIcon } from "@/components/icons";
import { fetchAdminHome, ensureAdminSession, getCachedAdminHome } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/submissions")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminHome(),
  component: SubmissionsPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Submissions Pipeline — Admin",
      description: "Review and approve app submissions.",
      path: "/admin/submissions",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function SubmissionsPage() {
  const data = Route.useLoaderData();
  const notice = useAdminNotice();
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "paid">("pending");

  const filtered = data.submissions.filter((item) => {
    if (activeTab === "pending") return item.status === "pending";
    if (activeTab === "paid") return item.status === "paid";
    return true;
  });

  const pendingCount = data.submissions.filter((s) => s.status === "pending").length;
  const paidCount = data.submissions.filter((s) => s.status === "paid").length;

  const hotSlots = data.offer?.hotSlots;
  const isHotFull = Boolean(hotSlots?.isFull);
  const nextHotDate = hotSlots?.nextDate || "Next Cycle";

  const goldSlots = data.offer?.articleSlots;
  const isGoldFull = Boolean(goldSlots?.isFull);
  const nextGoldDate = goldSlots?.nextDate || "Next Cycle";

  return (
    <AdminShell
      title="Submissions Pipeline"
      lede="Review incoming free and sponsor submissions. Live check badges and approve directly."
      active="submissions"
    >
      <Notice {...notice} />

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <div className="flex flex-col gap-2 border-b border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-ink">Submissions Queue</h2>
            <p className="text-xs text-muted">
              {pendingCount} pending review · {paidCount} paid awaiting placement
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(["pending", "paid", "all"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition cursor-pointer ${
                  activeTab === tab ? "bg-ink text-canvas shadow-xs" : "text-muted hover:bg-stone-100"
                }`}
              >
                {tab === "all" ? `All (${data.submissions.length})` : tab === "pending" ? `Pending (${pendingCount})` : `Paid (${paidCount})`}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">No submissions in this filter.</p>
        ) : (
          <>
            {/* Desktop View Table (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-[11px] tracking-wide text-muted uppercase bg-stone-50/70 border-b border-line">
                  <tr>
                    <th className="px-5 py-3 font-semibold">App Details</th>
                    <th className="px-4 py-3 font-semibold">Plan & Tier</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filtered.map((item) => (
                    <tr key={item.id} className="transition hover:bg-stone-50/40">
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="font-semibold text-ink">{item.app_name}</p>
                          {item.app_slug ? (
                            <a
                              href={`/app/${item.app_slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 rounded-md bg-purple-50 px-2 py-0.5 text-[10.5px] font-semibold text-purple-700 hover:bg-purple-100"
                            >
                              🔄 Update (/app/{item.app_slug})
                            </a>
                          ) : null}
                        </div>
                        <div className="mt-0.5 text-xs text-muted truncate max-w-md">{item.tagline}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted">
                          <a href={item.website} className="underline hover:text-ink font-mono" target="_blank" rel="noreferrer">
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
                          {item.dashboard_token ? (
                            <Link
                              to="/dashboard/$token"
                              params={{ token: item.dashboard_token }}
                              target="_blank"
                              className="text-indigo-600 hover:underline"
                            >
                              • Dashboard ↗
                            </Link>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.plan === "choice" ? (
                          <div className="flex flex-col items-start gap-1">
                            <Pill tone="choice">
                              {item.tier === "article" ? (
                                <span className="inline-flex items-center gap-1">
                                  <BadgeCheckIcon className="h-3 w-3 shrink-0 fill-amber-500 text-stone-950" />
                                  <span>Gold Spotlight</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-700">
                                  🔥 Hot Boost
                                </span>
                              )}
                            </Pill>
                            {item.status === "paid" ? (
                              <span className="inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-500/20">
                                📅 Booked for {item.tier === "article" ? (data.offer?.articleSlots?.nextDate || "Next Week") : (data.offer?.hotSlots?.nextDate || "Next Week")}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <Pill tone="off">Free Community</Pill>
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
                      <td className="px-4 py-3.5">
                        <Pill tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Pill>
                      </td>
                      <td className="px-5 py-3.5 text-right">
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
                                title="PickMacApps badge was not found on website. Verify badge to enable standard free approve."
                                className="rounded-lg bg-stone-200 px-2.5 py-1 text-[11px] font-medium text-stone-400 cursor-not-allowed"
                              >
                                Free (Badge Required)
                              </button>
                            ) : (
                              <form method="post" action="/api/admin/approve">
                                <input type="hidden" name="id" value={item.id} />
                                <button
                                  type="submit"
                                  className="rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-canvas transition hover:opacity-90 cursor-pointer"
                                >
                                  ✅ Standard Approve
                                </button>
                              </form>
                            )}
                            <form method="post" action="/api/admin/approve">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name={isHotFull ? "schedule_hot" : "make_hot"} value="1" />
                              <button
                                type="submit"
                                title="No badge required for Hot Boost"
                                className="rounded-lg bg-orange-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-orange-700 cursor-pointer"
                              >
                                {isHotFull ? `📅 Hot (${nextHotDate})` : `🔥 Hot (${hotSlots?.remaining ?? 6} left)`}
                              </button>
                            </form>
                            <form method="post" action="/api/admin/approve">
                              <input type="hidden" name="id" value={item.id} />
                              <input type="hidden" name={isGoldFull ? "schedule_gold" : "make_gold"} value="1" />
                              <button
                                type="submit"
                                title="No badge required for Gold Spotlight"
                                className="rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-semibold text-stone-950 transition hover:bg-amber-600 cursor-pointer"
                              >
                                {isGoldFull ? `📅 Gold (${nextGoldDate})` : `🌟 Gold (${goldSlots?.remaining ?? 6} left)`}
                              </button>
                            </form>
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

            {/* Mobile View: Touch-Friendly Card Stack (hidden on md+) */}
            <div className="block md:hidden divide-y divide-line">
              {filtered.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-semibold text-ink">{item.app_name}</span>
                        {item.app_slug ? (
                          <a
                            href={`/app/${item.app_slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700"
                          >
                            Update
                          </a>
                        ) : null}
                      </div>
                      {item.tagline ? (
                        <p className="mt-0.5 text-xs text-muted line-clamp-2">{item.tagline}</p>
                      ) : null}
                    </div>
                    <Pill tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Pill>
                  </div>

                  <div className="space-y-1.5 rounded-xl border border-line bg-stone-50/60 p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Website:</span>
                      <a
                        href={item.website}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-mono text-ink underline"
                      >
                        {item.website}
                      </a>
                    </div>
                    {item.email ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted">Email:</span>
                        <span className="truncate text-ink">{item.email}</span>
                      </div>
                    ) : null}
                    {item.x_handle ? (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted">𝕏 Handle:</span>
                        <a
                          href={`https://x.com/${item.x_handle.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-ink underline"
                        >
                          {item.x_handle}
                        </a>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
                      <span className="text-muted">Tier:</span>
                      {item.plan === "choice" ? (
                        <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                          {item.tier === "article" ? (
                            <>
                              <BadgeCheckIcon className="h-3 w-3 shrink-0 fill-amber-500 text-stone-950" />
                              <span>Gold (Article)</span>
                            </>
                          ) : "🔹 Blue (Featured)"}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted">Free Community</span>
                          {Boolean(item.badge_ok) ? (
                            <span className="text-[10px] font-bold text-emerald-600">✓ Verified</span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600">⚠️ Missing</span>
                          )}
                        </div>
                      )}
                    </div>
                    {item.dashboard_token ? (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
                        <span className="text-muted">Dashboard:</span>
                        <Link
                          to="/dashboard/$token"
                          params={{ token: item.dashboard_token }}
                          target="_blank"
                          className="font-medium text-indigo-600 underline"
                        >
                          Open Creator Dashboard ↗
                        </Link>
                      </div>
                    ) : null}
                  </div>

                  {/* Mobile Touch Actions */}
                  {item.status === "pending" || item.status === "paid" ? (
                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        {item.plan === "free" ? (
                          <form method="post" action="/api/admin/verify-submission-badge" className="flex-1">
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className="w-full rounded-xl border border-line bg-white py-2 text-center text-xs font-semibold text-ink shadow-xs hover:bg-stone-50 active:bg-stone-100 cursor-pointer"
                            >
                              🔍 Check Badge
                            </button>
                          </form>
                        ) : null}

                        <form method="post" action="/api/admin/reject" className="shrink-0">
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            Reject
                          </button>
                        </form>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                        {item.plan === "free" && !item.badge_ok ? (
                          <button
                            type="button"
                            disabled
                            className="w-full rounded-xl bg-stone-200 py-2 text-center text-xs font-semibold text-stone-400 cursor-not-allowed"
                            title="Verify badge on website to enable standard free approve."
                          >
                            Free (Badge Required)
                          </button>
                        ) : (
                          <form method="post" action="/api/admin/approve" className="w-full">
                            <input type="hidden" name="id" value={item.id} />
                            <button
                              type="submit"
                              className="w-full rounded-xl bg-ink py-2 text-center text-xs font-semibold text-canvas shadow-xs hover:opacity-90 active:opacity-80 cursor-pointer"
                            >
                              ✅ Standard Approve
                            </button>
                          </form>
                        )}

                        <form method="post" action="/api/admin/approve" className="w-full">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name={isHotFull ? "schedule_hot" : "make_hot"} value="1" />
                          <button
                            type="submit"
                            title="No badge required for Hot Boost"
                            className="w-full rounded-xl bg-orange-600 py-2 text-center text-xs font-semibold text-white shadow-xs hover:bg-orange-700 active:opacity-80 cursor-pointer"
                          >
                            {isHotFull ? `📅 Hot (${nextHotDate})` : `🔥 Hot (${hotSlots?.remaining ?? 6} left)`}
                          </button>
                        </form>

                        <form method="post" action="/api/admin/approve" className="w-full">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name={isGoldFull ? "schedule_gold" : "make_gold"} value="1" />
                          <button
                            type="submit"
                            title="No badge required for Gold Spotlight"
                            className="w-full rounded-xl bg-amber-500 py-2 text-center text-xs font-semibold text-stone-950 shadow-xs hover:bg-amber-600 active:opacity-80 cursor-pointer"
                          >
                            {isGoldFull ? `📅 Gold (${nextGoldDate})` : `🌟 Gold (${goldSlots?.remaining ?? 6} left)`}
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </AdminShell>
  );
}

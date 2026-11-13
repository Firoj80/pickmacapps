import { useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, Pill, statusTone, useAdminNotice } from "@/components/admin-shell";
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
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
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {item.plan === "choice" ? (
                        <div className="flex flex-col items-start gap-1">
                          <Pill tone="choice">
                            {item.tier === "article" ? "🌟 Gold ($120)" : "🔹 Blue ($99)"}
                          </Pill>
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
                                className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-canvas transition hover:opacity-90 cursor-pointer"
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
    </AdminShell>
  );
}

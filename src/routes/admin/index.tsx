import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, Pill, fieldClass, statusTone, useAdminNotice } from "@/components/admin-shell";
import { fetchAdminHome, requireAdmin } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/")({
  beforeLoad: async () => {
    try {
      await requireAdmin();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => fetchAdminHome(),
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
  const stats = [
    ["Revenue", money(data.stats.revenueCents)],
    ["Waiting", waiting],
    ["Published apps", data.stats.free + data.stats.paid + data.stats.freemium],
    ["Editor’s Choice", data.stats.editorChoice],
    ["Free apps", data.stats.free],
    ["Paid apps", data.stats.paid],
    ["Freemium", data.stats.freemium],
    ["Guides", data.stats.guides],
  ];
  return (
    <AdminShell title="Overview" lede="Approve listings, set the Editor’s Choice price, and check free-listing badges." active="overview">
      <Notice {...notice} />
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-line bg-white px-4 py-3.5">
            <dt className="text-[12px] font-medium text-muted">{label}</dt>
            <dd className="mt-1 font-display text-[28px] leading-none font-semibold tracking-tight text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Submissions</h2>
          <span className="text-xs text-muted">{waiting} to review</span>
        </div>
        {data.submissions.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-4 py-2 font-medium">App</th>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.submissions.map((item) => (
                  <tr key={item.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{item.app_name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                        <a href={item.website} className="underline" target="_blank" rel="noreferrer">
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
                      {item.plan === "choice" ? <Pill tone="choice">Editor’s Choice</Pill> : <Pill tone="off">Free</Pill>}
                    </td>
                    <td className="px-3 py-3">
                      <Pill tone={statusTone(item.status)}>{item.status.replaceAll("_", " ")}</Pill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === "pending" || item.status === "paid" ? (
                        <div className="flex justify-end gap-2">
                          <form method="post" action="/api/admin/reject">
                            <input type="hidden" name="id" value={item.id} />
                            <button type="submit" className="rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-[#f4f3ef]">
                              Reject
                            </button>
                          </form>
                          <form method="post" action="/api/admin/approve">
                            <input type="hidden" name="id" value={item.id} />
                            <button type="submit" className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas">
                              Approve
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
        )}
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-semibold text-ink">Editor’s Choice price</h2>
          <p className="mt-1 text-sm leading-relaxed text-body">
            Charged by Dodo: {money(data.offer.priceCents)}, shown as marked down from {money(data.offer.compareCents)}.
            The browser cannot set the amount.
          </p>
          <form method="post" action="/api/admin/price" className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-[13px] font-medium text-ink">
              Charge
              <input name="dollars" defaultValue={(data.offer.priceCents / 100).toFixed(2)} className={fieldClass} />
            </label>
            <label className="text-[13px] font-medium text-ink">
              Compare-at
              <input name="compare" defaultValue={(data.offer.compareCents / 100).toFixed(2)} className={fieldClass} />
            </label>
            <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas">
              Save price
            </button>
          </form>
        </section>
        <section className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink">Free-listing badges</h2>
              <p className="mt-1 text-sm leading-relaxed text-body">
                Editor’s Choice is not checked. A free listing is unpublished after two checks find the page up and the badge gone.
              </p>
            </div>
            <form method="post" action="/api/admin/badges">
              <button type="submit" className="rounded-xl border border-line px-3 py-2 text-sm font-medium text-ink">
                Check now
              </button>
            </form>
          </div>
          <ul className="mt-4 max-h-56 space-y-2 overflow-auto text-sm">
            {data.badges.length === 0 ? <li className="text-muted">No free listings to check.</li> : null}
            {data.badges.map((app) => (
              <li key={app.id} className="flex items-center justify-between gap-3">
                <span className="truncate text-ink">{app.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {app.badgeStatus}
                  {app.badgeDetail ? ` · ${app.badgeDetail}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AdminShell>
  );
}

import { createFileRoute, Link, redirect, useRouterState } from "@tanstack/react-router";
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
  const search = useRouterState({ select: (state) => state.location.searchStr });
  const params = new URLSearchParams(search);
  const error = params.get("error") ?? "";
  const saved = params.get("saved") ?? "";
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-4xl font-semibold text-ink">Directory</h1>
        <form method="post" action="/api/admin/logout">
          <button type="submit" className="text-sm text-muted underline">
            Sign out
          </button>
        </form>
      </div>
      <nav className="mt-4 flex gap-4 text-sm">
        <Link to="/admin/apps" className="underline">
          Apps
        </Link>
        <Link to="/admin/guides" className="underline">
          Guides
        </Link>
      </nav>
      {error ? <p className="mt-4 text-sm text-amber-800">{error}</p> : null}
      {saved ? <p className="mt-4 text-sm text-body">Saved.</p> : null}
      <dl className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Free apps", data.stats.free],
          ["Paid apps", data.stats.paid],
          ["Freemium", data.stats.freemium],
          ["Editor’s Choice", data.stats.editorChoice],
          ["Published guides", data.stats.guides],
          ["Other guides", data.stats.draftGuides],
          ["Pending apps", data.stats.pendingApps],
          ["Revenue", money(data.stats.revenueCents)],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-line p-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Editor’s Choice price</h2>
        <p className="mt-2 max-w-xl text-sm text-body">
          This updates the Dodo product. The checkout uses that product, so a browser cannot choose the amount. Current
          price {money(data.offer.priceCents)}, shown as marked down from {money(data.offer.compareCents)}.
        </p>
        <form method="post" action="/api/admin/price" className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm text-body">
            Charge in dollars
            <input name="dollars" defaultValue={(data.offer.priceCents / 100).toFixed(2)} className="mt-1 block rounded-lg border border-line px-3 py-2" />
          </label>
          <label className="text-sm text-body">
            Compare-at
            <input name="compare" defaultValue={(data.offer.compareCents / 100).toFixed(2)} className="mt-1 block rounded-lg border border-line px-3 py-2" />
          </label>
          <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-canvas">
            Save price
          </button>
        </form>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Free-app badge check</h2>
          <form method="post" action="/api/admin/badges">
            <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm">
              Check now
            </button>
          </form>
        </div>
        <p className="mt-2 text-sm text-body">
          A free listing is unpublished after two checks find the page up and the badge gone. A site that is down is only flagged.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {data.badges.map((app) => (
            <li key={app.id}>
              {app.name}: {app.badgeStatus}
              {app.badgeDetail ? ` — ${app.badgeDetail}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Submissions</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {data.submissions.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
              <span>
                {item.app_name} · {item.plan} · {item.status}
              </span>
              {item.status === "pending" || item.status === "paid" ? (
                <form method="post" action="/api/admin/approve">
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="underline">
                    Approve
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

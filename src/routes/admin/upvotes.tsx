import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell, Notice, useAdminNotice } from "@/components/admin-shell";
import { fetchAdminHome, ensureAdminSession, getCachedAdminHome } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/upvotes")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => getCachedAdminHome(),
  component: UpvotesAdminPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Upvotes & Auto-Promotion — Admin",
      description: "Configure sitewide upvoting and Hot app auto-promotion.",
      path: "/admin/upvotes",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function UpvotesAdminPage() {
  const data = Route.useLoaderData();
  const notice = useAdminNotice();
  const upvoteSettings = (data.stats as { upvoteSettings?: { upvotesEnabled?: boolean; autoHotEnabled?: boolean; hotThreshold?: number } }).upvoteSettings ?? {
    upvotesEnabled: true,
    autoHotEnabled: true,
    hotThreshold: 15,
  };

  return (
    <AdminShell
      title="Upvotes & Auto-Promotion to Hot"
      lede="Manage visitor upvote permissions and configure the automatic Hot promotion threshold."
      active="upvotes"
    >
      <Notice {...notice} />

      <div className="max-w-2xl space-y-6">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-ink">Upvote & Hot Rules</h2>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Visitors can upvote any Mac app once without creating an account. When an app receives enough votes, it can be automatically promoted to the Hot Apps shelf.
          </p>

          <form method="post" action="/api/admin/update-upvote-settings" className="mt-6 space-y-4">
            <label className="flex items-start gap-3 rounded-xl border border-line bg-stone-50/70 p-4 text-xs cursor-pointer">
              <input
                type="checkbox"
                name="upvotes_enabled"
                defaultChecked={upvoteSettings.upvotesEnabled ?? true}
                className="mt-0.5 h-4 w-4 rounded accent-ink cursor-pointer"
              />
              <div>
                <div className="font-semibold text-sm text-ink">Enable Sitewide Upvotes</div>
                <div className="text-muted text-xs mt-0.5">Show the interactive ▲ vote button on all app cards and app detail pages.</div>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-xl border border-line bg-stone-50/70 p-4 text-xs cursor-pointer">
              <input
                type="checkbox"
                name="auto_hot_enabled"
                defaultChecked={upvoteSettings.autoHotEnabled ?? true}
                className="mt-0.5 h-4 w-4 rounded accent-ink cursor-pointer"
              />
              <div>
                <div className="font-semibold text-sm text-ink">Auto-Promote to Hot Apps</div>
                <div className="text-muted text-xs mt-0.5">Automatically mark apps as Hot when their upvote count crosses the threshold.</div>
              </div>
            </label>

            <div className="rounded-xl border border-line bg-stone-50/70 p-4 text-xs">
              <label htmlFor="hot_threshold" className="font-semibold text-sm text-ink block">
                Upvote Promotion Threshold
              </label>
              <p className="text-muted text-xs mt-0.5">
                Number of upvotes required for an app to be automatically added to Hot (e.g. 15, 20, 50).
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="hot_threshold"
                  name="hot_threshold"
                  type="number"
                  min="1"
                  max="500"
                  defaultValue={upvoteSettings.hotThreshold ?? 15}
                  className="w-24 rounded-xl border border-line bg-white px-3 py-2 text-center text-base font-bold text-ink outline-none focus:border-ink"
                />
                <span className="text-xs text-muted">votes</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-canvas shadow-xs hover:opacity-90 cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

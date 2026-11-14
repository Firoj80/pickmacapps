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

      <div className="max-w-3xl space-y-6">
        {/* KPI / Status Summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Upvoting System</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${upvoteSettings.upvotesEnabled ? "bg-emerald-500" : "bg-stone-300"}`} />
              <span className="text-xl font-bold text-ink">
                {upvoteSettings.upvotesEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Public ▲ vote buttons</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Auto-Promotion</span>
            <div className="mt-1 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${upvoteSettings.autoHotEnabled ? "bg-rose-500" : "bg-stone-300"}`} />
              <span className="text-xl font-bold text-ink">
                {upvoteSettings.autoHotEnabled ? "Active" : "Off"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Promotes top voted apps</p>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-xs">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">Promotion Threshold</span>
            <div className="mt-1 text-2xl font-bold text-ink">
              {upvoteSettings.hotThreshold ?? 15} <span className="text-sm font-normal text-muted">votes</span>
            </div>
            <p className="mt-0.5 text-xs text-muted">Required to enter Hot shelf</p>
          </div>
        </div>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-semibold text-ink">Configure Upvoting & Promotion Rules</h2>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Visitors can upvote any Mac app once without creating an account. When an app receives enough votes, it can be automatically promoted to the Hot Apps shelf for 30 days.
          </p>

          <form method="post" action="/api/admin/update-upvote-settings" className="mt-6 space-y-4">
            <label className="flex items-start justify-between gap-4 rounded-xl border border-line bg-stone-50/60 p-4 transition hover:bg-stone-50 cursor-pointer">
              <div>
                <div className="font-semibold text-sm text-ink">Enable Sitewide Upvotes</div>
                <div className="text-muted text-xs mt-0.5 max-w-md">
                  Show the interactive ▲ vote button on all app cards and individual app detail pages.
                </div>
              </div>
              <input
                type="checkbox"
                name="upvotes_enabled"
                defaultChecked={upvoteSettings.upvotesEnabled ?? true}
                className="mt-1 h-5 w-5 rounded accent-ink cursor-pointer shrink-0"
              />
            </label>

            <label className="flex items-start justify-between gap-4 rounded-xl border border-line bg-stone-50/60 p-4 transition hover:bg-stone-50 cursor-pointer">
              <div>
                <div className="font-semibold text-sm text-ink flex items-center gap-1.5">
                  <span>🔥 Auto-Promote to Hot Apps</span>
                </div>
                <div className="text-muted text-xs mt-0.5 max-w-md">
                  Automatically mark apps as Hot when their community upvote count crosses the threshold.
                </div>
              </div>
              <input
                type="checkbox"
                name="auto_hot_enabled"
                defaultChecked={upvoteSettings.autoHotEnabled ?? true}
                className="mt-1 h-5 w-5 rounded accent-rose-600 cursor-pointer shrink-0"
              />
            </label>

            <div className="rounded-xl border border-line bg-stone-50/60 p-4">
              <label htmlFor="hot_threshold" className="font-semibold text-sm text-ink block">
                Upvote Promotion Threshold
              </label>
              <p className="text-muted text-xs mt-0.5">
                Number of upvotes required for an app to trigger automated Hot promotion.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <input
                  id="hot_threshold"
                  name="hot_threshold"
                  type="number"
                  min="1"
                  max="500"
                  defaultValue={upvoteSettings.hotThreshold ?? 15}
                  className="w-24 rounded-xl border border-line bg-white px-3 py-2 text-center text-base font-bold text-ink outline-none focus:border-ink shadow-2xs"
                />
                <span className="text-xs font-medium text-muted">verified upvotes</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-ink px-6 py-2.5 text-xs font-bold text-canvas shadow-xs hover:opacity-90 cursor-pointer"
              >
                Save Upvote Settings
              </button>
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}

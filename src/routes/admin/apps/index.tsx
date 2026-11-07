import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Pill, fieldClass, statusTone } from "@/components/admin-shell";
import { pricingLabel } from "@/lib/catalog";
import { fetchAdminApps, requireAdmin } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/apps/")({
  beforeLoad: async () => {
    try {
      await requireAdmin();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => fetchAdminApps(),
  component: AppsPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Admin apps",
      description: "Manage PickMacApps listings.",
      path: "/admin/apps",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

const filters = ["all", "published", "pending", "unpublished"] as const;

function AppsPage() {
  const apps = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (filter !== "all" && app.status !== filter) return false;
      if (!needle) return true;
      return app.name.toLowerCase().includes(needle) || app.slug.includes(needle);
    });
  }, [apps, filter, query]);
  return (
    <AdminShell title="Apps" lede={`${apps.length} listings. Edit any of them without leaving the directory.`} active="apps">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search apps"
          aria-label="Search apps"
          className={`${fieldClass} mt-0 sm:max-w-xs`}
        />
        <div className="flex gap-1">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
                filter === item ? "bg-ink text-canvas" : "bg-white text-body ring-1 ring-line"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-[11px] tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">App</th>
                <th className="px-3 py-2 font-medium">Price model</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Badge</th>
                <th className="px-4 py-2 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {shown.map((app) => (
                <tr key={app.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {app.icon ? <img alt="" src={app.icon} className="h-9 w-9 rounded-lg object-cover" /> : null}
                      <div>
                        <p className="font-medium text-ink">{app.name}</p>
                        <p className="text-xs text-muted">{app.categoryName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-body">{pricingLabel[app.pricing]}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Pill tone={statusTone(app.status)}>{app.status}</Pill>
                      {app.editorChoice ? (
                        app.featuredTier === "article" ? (
                          <Pill tone="choice">🌟 Gold (Article)</Pill>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                            🔹 Blue (Featured)
                          </span>
                        )
                      ) : null}
                      {app.isHot ? (
                        <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          🔥 Hot
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">{app.editorChoice ? "Not required" : app.badgeStatus}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/apps/$id" params={{ id: app.id }} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length === 0 ? <p className="px-4 py-8 text-sm text-muted">No apps match.</p> : null}
      </div>
    </AdminShell>
  );
}

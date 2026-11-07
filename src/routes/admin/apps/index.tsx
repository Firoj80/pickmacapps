import { useMemo, useState } from "react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Pill, fieldClass, statusTone } from "@/components/admin-shell";
import { pricingLabel } from "@/lib/catalog";
import { fetchAdminApps, ensureAdminSession } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/apps/")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
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

const filters = [
  { id: "all", label: "All" },
  { id: "hot", label: "🔥 Hot" },
  { id: "blue", label: "🔹 Blue Tier" },
  { id: "gold", label: "🌟 Gold Tier" },
  { id: "published", label: "Published" },
  { id: "pending", label: "Pending" },
  { id: "unpublished", label: "Unpublished" },
] as const;

type FilterId = (typeof filters)[number]["id"];

function AppsPage() {
  const apps = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return apps.filter((app) => {
      if (filter === "hot" && !app.isHot) return false;
      if (filter === "blue" && (!app.editorChoice || app.featuredTier === "article")) return false;
      if (filter === "gold" && (!app.editorChoice || app.featuredTier !== "article")) return false;
      if (filter === "published" && app.status !== "published") return false;
      if (filter === "pending" && app.status !== "pending") return false;
      if (filter === "unpublished" && app.status !== "unpublished") return false;

      if (!needle) return true;
      return app.name.toLowerCase().includes(needle) || app.slug.includes(needle);
    });
  }, [apps, filter, query]);

  const hotCount = useMemo(() => apps.filter((a) => a.isHot).length, [apps]);
  const blueCount = useMemo(() => apps.filter((a) => a.editorChoice && a.featuredTier !== "article").length, [apps]);
  const goldCount = useMemo(() => apps.filter((a) => a.editorChoice && a.featuredTier === "article").length, [apps]);
  const unpublishedCount = useMemo(() => apps.filter((a) => a.status === "unpublished" || a.status === "pending").length, [apps]);

  return (
    <AdminShell
      title="Apps"
      lede={`${apps.length} listings. Edit metadata, manage tier placements, and toggle Hot featured apps.`}
      active="apps"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {unpublishedCount > 0 ? (
            <form method="post" action="/api/admin/publish-all">
              <button
                type="submit"
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 cursor-pointer"
              >
                Publish All Unpublished ({unpublishedCount})
              </button>
            </form>
          ) : null}
          <Link
            to="/admin/apps/new"
            preload="intent"
            className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-canvas transition hover:opacity-90"
          >
            + Add App
          </Link>
        </div>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search apps by name or slug..."
          aria-label="Search apps"
          className={`${fieldClass} mt-0 sm:max-w-xs`}
        />
        <div className="flex flex-wrap gap-1">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === item.id
                  ? "bg-ink text-canvas shadow-xs"
                  : "bg-white text-body ring-1 ring-line hover:bg-stone-50"
              }`}
            >
              {item.label}
              {item.id === "hot" ? ` (${hotCount})` : item.id === "blue" ? ` (${blueCount}/3)` : item.id === "gold" ? ` (${goldCount}/3)` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-[11px] tracking-wide text-muted uppercase bg-stone-50/50">
              <tr>
                <th className="px-4 py-2.5 font-medium">App</th>
                <th className="px-3 py-2.5 font-medium">Price Model</th>
                <th className="px-3 py-2.5 font-medium">Status & Badges</th>
                <th className="px-3 py-2.5 font-medium">Free Badge Check</th>
                <th className="px-3 py-2.5 font-medium">Hot Featured</th>
                <th className="px-4 py-2.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((app) => (
                <tr key={app.id} className="transition hover:bg-stone-50/40">
                  <td className="px-4 py-3">
                    <Link
                      to="/admin/apps/$id"
                      params={{ id: app.id }}
                      preload="intent"
                      className="group flex items-center gap-3"
                    >
                      {app.icon ? (
                        <img
                          alt=""
                          src={app.icon}
                          className="h-9 w-9 rounded-lg object-cover ring-1 ring-line/50 transition group-hover:scale-105"
                        />
                      ) : null}
                      <div>
                        <p className="font-medium text-ink group-hover:underline">{app.name}</p>
                        <p className="text-xs text-muted">{app.categoryName}</p>
                      </div>
                    </Link>
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
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">
                    {app.editorChoice ? "Not required" : app.badgeStatus}
                  </td>
                  <td className="px-3 py-3">
                    <form method="post" action="/api/admin/toggle-hot" className="inline">
                      <input type="hidden" name="id" value={app.id} />
                      <input type="hidden" name="return_to" value="/admin/apps" />
                      <button
                        type="submit"
                        title={app.isHot ? "Remove Hot status" : "Mark app as Hot"}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                          app.isHot
                            ? "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
                            : "border border-line bg-white text-muted hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/50"
                        }`}
                      >
                        <span>🔥</span>
                        <span>{app.isHot ? "Hot" : "Make Hot"}</span>
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to="/admin/apps/$id"
                      params={{ id: app.id }}
                      preload="intent"
                      className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas transition hover:opacity-90"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {shown.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">No apps match this query or filter.</p> : null}
      </div>
    </AdminShell>
  );
}

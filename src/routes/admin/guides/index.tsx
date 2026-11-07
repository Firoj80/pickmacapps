import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Pill, statusTone } from "@/components/admin-shell";
import { fetchAdminGuides, ensureAdminSession } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/guides/")({
  beforeLoad: async () => {
    try {
      await ensureAdminSession();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: () => fetchAdminGuides(),
  component: GuidesPage,
  head: ({ matches }) => {
    const seo = buildMetadata({
      title: "Admin guides",
      description: "Manage PickMacApps guides.",
      path: "/admin/guides",
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function GuidesPage() {
  const guides = Route.useLoaderData();
  return (
    <AdminShell
      title="Guides"
      lede="Drafts stay off the public site until you publish them."
      active="guides"
      actions={
        <Link
          to="/admin/guides/new"
          preload="intent"
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas transition hover:opacity-90"
        >
          New guide
        </Link>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-xs">
        {guides.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted">No guides yet.</p> : null}
        <ul className="divide-y divide-line">
          {guides.map((guide) => (
            <li key={guide.slug} className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-stone-50/50">
              <div>
                <Link
                  to="/admin/guides/$slug"
                  params={{ slug: guide.slug }}
                  preload="intent"
                  className="text-sm font-medium text-ink hover:underline"
                >
                  {guide.title}
                </Link>
                <p className="text-xs text-muted">{guide.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={statusTone(guide.status)}>{guide.status}</Pill>
                <Link
                  to="/admin/guides/$slug"
                  params={{ slug: guide.slug }}
                  preload="intent"
                  className="rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-ink hover:bg-stone-200"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}

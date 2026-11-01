import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AdminShell, Pill, statusTone } from "@/components/admin-shell";
import { fetchAdminGuides, requireAdmin } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/guides/")({
  beforeLoad: async () => {
    try {
      await requireAdmin();
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
        <Link to="/admin/guides/new" className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-canvas">
          New guide
        </Link>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {guides.length === 0 ? <p className="px-4 py-8 text-sm text-muted">No guides yet.</p> : null}
        <ul className="divide-y divide-line">
          {guides.map((guide) => (
            <li key={guide.slug} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{guide.title}</p>
                <p className="text-xs text-muted">{guide.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <Pill tone={statusTone(guide.status)}>{guide.status}</Pill>
                <Link to="/admin/guides/$slug" params={{ slug: guide.slug }} className="text-sm font-medium text-ink underline">
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

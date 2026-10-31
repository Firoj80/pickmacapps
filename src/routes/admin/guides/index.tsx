import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-semibold text-ink">Guides</h1>
        <Link to="/admin/guides/new" className="rounded-full bg-ink px-4 py-2 text-sm text-canvas">
          New guide
        </Link>
      </div>
      <ul className="mt-6 divide-y divide-line">
        {guides.map((guide) => (
          <li key={guide.slug} className="flex items-center justify-between py-3 text-sm">
            <span>
              {guide.title} · {guide.status}
            </span>
            <Link to="/admin/guides/$slug" params={{ slug: guide.slug }} className="underline">
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

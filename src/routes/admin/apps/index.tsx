import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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

function AppsPage() {
  const apps = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/admin" className="text-sm text-muted">
        Back
      </Link>
      <h1 className="font-display mt-3 text-4xl font-semibold text-ink">Apps</h1>
      <ul className="mt-6 divide-y divide-line">
        {apps.map((app) => (
          <li key={app.id} className="flex items-center justify-between py-3 text-sm">
            <span>
              {app.name} · {app.pricing} · {app.status}
              {app.editorChoice ? " · Editor’s Choice" : ""}
            </span>
            <Link to="/admin/apps/$id" params={{ id: app.id }} className="underline">
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

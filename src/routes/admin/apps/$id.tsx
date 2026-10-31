import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { categories } from "@/lib/catalog";
import { fetchAdminApp, requireAdmin } from "@/lib/directory.fn";
import { buildMetadata, originFrom } from "@/lib/seo";

export const Route = createFileRoute("/admin/apps/$id")({
  beforeLoad: async () => {
    try {
      await requireAdmin();
    } catch {
      throw redirect({ href: "/admin/login" });
    }
  },
  loader: ({ params }) => fetchAdminApp({ data: { id: params.id } }),
  component: EditApp,
  head: ({ matches, params }) => {
    const seo = buildMetadata({
      title: "Edit app",
      description: "Edit a PickMacApps listing.",
      path: `/admin/apps/${params.id}`,
      origin: originFrom(matches),
      noindex: true,
    });
    return { meta: seo.meta, links: seo.links };
  },
});

function EditApp() {
  const app = Route.useLoaderData();
  if (!app) return <main className="px-6 py-12">That app is not in the directory.</main>;
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link to="/admin/apps" className="text-sm text-muted">
        Apps
      </Link>
      <h1 className="font-display mt-3 text-4xl font-semibold text-ink">{app.name}</h1>
      <form method="post" action="/api/admin/apps" className="mt-6 space-y-3">
        <input type="hidden" name="id" value={app.id} />
        <input name="name" defaultValue={app.name} aria-label="Name" className="w-full rounded-lg border border-line px-3 py-2" />
        <input name="slug" defaultValue={app.slug} aria-label="Slug" className="w-full rounded-lg border border-line px-3 py-2" />
        <input name="website" defaultValue={app.website} aria-label="Website" className="w-full rounded-lg border border-line px-3 py-2" />
        <input name="tagline" defaultValue={app.tagline} aria-label="Tagline" className="w-full rounded-lg border border-line px-3 py-2" />
        <textarea name="description" defaultValue={app.description} aria-label="Description" rows={8} className="w-full rounded-lg border border-line px-3 py-2" />
        <select name="pricing" defaultValue={app.pricing} aria-label="Pricing" className="w-full rounded-lg border border-line px-3 py-2">
          <option value="free">Free</option>
          <option value="freemium">Freemium</option>
          <option value="paid">Paid</option>
        </select>
        <select name="category" defaultValue={app.category} aria-label="Category" className="w-full rounded-lg border border-line px-3 py-2">
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={app.status} aria-label="Status" className="w-full rounded-lg border border-line px-3 py-2">
          <option value="published">Published</option>
          <option value="unpublished">Unpublished</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="editor_choice" defaultChecked={app.editorChoice} />
          Editor’s Choice
        </label>
        <button type="submit" className="rounded-full bg-ink px-4 py-2 text-sm text-canvas">
          Save
        </button>
      </form>
      <form method="post" action="/api/admin/apps" className="mt-4">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="id" value={app.id} />
        <button type="submit" className="text-sm text-amber-900 underline">
          Delete
        </button>
      </form>
    </main>
  );
}

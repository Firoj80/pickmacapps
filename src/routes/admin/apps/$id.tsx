import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell, Field, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
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
  const notice = useAdminNotice();
  if (!app) {
    return (
      <AdminShell title="Missing app" active="apps">
        <p className="text-sm text-body">That app is not in the directory.</p>
      </AdminShell>
    );
  }
  return (
    <AdminShell title={app.name} lede="These are the fields a listing is published with." active="apps">
      <Notice {...notice} />
      <form method="post" action="/api/admin/apps" className="max-w-2xl space-y-4 rounded-2xl border border-line bg-white p-5">
        <input type="hidden" name="id" value={app.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input name="name" defaultValue={app.name} required className={fieldClass} />
          </Field>
          <Field label="Slug">
            <input name="slug" defaultValue={app.slug} required className={fieldClass} />
          </Field>
        </div>
        <Field label="Website">
          <input name="website" type="url" defaultValue={app.website} required className={fieldClass} />
        </Field>
        <Field label="Tagline">
          <input name="tagline" defaultValue={app.tagline} required className={fieldClass} />
        </Field>
        <Field label="Description">
          <textarea name="description" defaultValue={app.description} rows={8} className={fieldClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Icon URL">
            <input name="icon" type="url" defaultValue={app.icon} className={fieldClass} />
          </Field>
          <Field label="Demo image URL">
            <input name="demo" type="url" defaultValue={app.demo} className={fieldClass} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price model">
            <select name="pricing" defaultValue={app.pricing} className={fieldClass}>
              <option value="free">Free</option>
              <option value="freemium">Freemium</option>
              <option value="paid">Paid</option>
            </select>
          </Field>
          <Field label="Category">
            <select name="category" defaultValue={app.category} className={fieldClass}>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Status">
          <select name="status" defaultValue={app.status} className={fieldClass}>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="editor_choice" defaultChecked={app.editorChoice} />
          Editor’s Choice — follow link, no badge check
        </label>
        <button type="submit" className="rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-canvas">
          Save listing
        </button>
      </form>
      <form method="post" action="/api/admin/apps" className="mt-3 max-w-2xl">
        <input type="hidden" name="intent" value="delete" />
        <input type="hidden" name="id" value={app.id} />
        <button type="submit" className="text-sm text-amber-900 underline">
          Delete
        </button>
      </form>
    </AdminShell>
  );
}

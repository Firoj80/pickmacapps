import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminShell, Field, Notice, fieldClass, useAdminNotice } from "@/components/admin-shell";
import { normalizeCategorySlug, shelfCategories } from "@/lib/shelf-categories";
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
            <select name="category" defaultValue={normalizeCategorySlug(app.category)} className={fieldClass}>
              {shelfCategories.map((category) => (
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
        <div className="rounded-xl border border-line bg-[#faf9f5] p-3.5 space-y-3">
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              name="editor_choice"
              defaultChecked={app.editorChoice}
              disabled={app.editorChoiceSlotsFull && !app.editorChoice}
              className="h-4 w-4 rounded border-line text-ink focus:ring-accent"
            />
            <span className="font-medium">Editor’s Choice / Featured Placement</span>
            <span className="text-xs text-muted">— follow link, top hero rotation (30-day placement)</span>
          </label>

          <div className="pt-2 border-t border-line/60">
            <label htmlFor="featured_tier" className="block text-xs font-medium text-body mb-1.5">
              Featured Tier & Badge Style (3 Blue + 3 Gold slots max)
            </label>
            <select
              id="featured_tier"
              name="featured_tier"
              defaultValue={app.featuredTier ?? "featured"}
              className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink focus:border-accent focus:outline-none"
            >
              <option value="featured">
                🔹 Blue Badge — Featured Placement ($99) ({Math.max(0, 3 - ((app.otherFeaturedCount ?? 0) + (app.editorChoice && app.featuredTier !== "article" ? 1 : 0)))}/3 available)
              </option>
              <option value="article">
                🌟 Golden Badge — Featured + Medium Article ($120) ({Math.max(0, 3 - ((app.otherArticleCount ?? 0) + (app.editorChoice && app.featuredTier === "article" ? 1 : 0)))}/3 available)
              </option>
            </select>
            <p className="mt-1 text-[11px] text-muted">
              Gold badge apps appear with highest priority at the top, followed by Blue badge apps. Max 3 apps per tier.
            </p>
          </div>

          <div className="space-y-1 pt-1 border-t border-line/60 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-body flex items-center gap-1.5">
                <span>🔹 Blue spots:</span>
                <strong className="text-ink">
                  {(app.otherFeaturedCount ?? 0) + (app.editorChoice && app.featuredTier !== "article" ? 1 : 0)} / 3 active
                </strong>
              </span>
              {(app.otherFeaturedCount ?? 0) + (app.editorChoice && app.featuredTier !== "article" ? 1 : 0) >= 3 ? (
                <span className="font-semibold text-rose-600">Blue Full (3/3)</span>
              ) : (
                <span className="font-medium text-emerald-600">
                  {3 - ((app.otherFeaturedCount ?? 0) + (app.editorChoice && app.featuredTier !== "article" ? 1 : 0))} spots free
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-body flex items-center gap-1.5">
                <span>🌟 Gold spots:</span>
                <strong className="text-ink">
                  {(app.otherArticleCount ?? 0) + (app.editorChoice && app.featuredTier === "article" ? 1 : 0)} / 3 active
                </strong>
              </span>
              {(app.otherArticleCount ?? 0) + (app.editorChoice && app.featuredTier === "article" ? 1 : 0) >= 3 ? (
                <span className="font-semibold text-rose-600">Gold Full (3/3)</span>
              ) : (
                <span className="font-medium text-emerald-600">
                  {3 - ((app.otherArticleCount ?? 0) + (app.editorChoice && app.featuredTier === "article" ? 1 : 0))} spots free
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hot App Toggle */}
        <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 dark:border-rose-950 dark:bg-rose-950/20">
          <label className="flex items-center gap-2.5 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              name="is_hot"
              defaultChecked={app.isHot}
              className="h-4 w-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
            />
            <span className="font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <span>🔥 Mark as Hot App</span>
            </span>
            <span className="text-xs text-muted">
              — displays fire badge on cards and ranks directly below paid featured apps
            </span>
          </label>
        </div>

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
